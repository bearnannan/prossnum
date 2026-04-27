import { Plugin, Notice, TFile, PluginSettingTab, App, Setting } from 'obsidian';
import { DataFetcher } from './data-fetcher';

interface ProjectSummarizerSettings {
    projectFolderPath: string;
    indexFilePath: string;
    logFilePath: string;
}

const DEFAULT_SETTINGS: ProjectSummarizerSettings = {
    projectFolderPath: '',
    indexFilePath: 'project-index.md',
    logFilePath: 'project-log.md'
}

export default class ProjectSummarizerPlugin extends Plugin {
    settings!: ProjectSummarizerSettings;
    dataFetcher!: DataFetcher;

    async onload() {
        console.log('Loading Project Summarizer Skill...');
        
        await this.loadSettings();
        
        this.dataFetcher = new DataFetcher(this.app);

        // Initialize index when metadata cache is resolved
        this.app.workspace.onLayoutReady(async () => {
            await this.dataFetcher.initializeIndex();
        });

        // Register event listeners for incremental updates
        this.registerEvent(
            this.app.metadataCache.on('changed', (file) => {
                if (file instanceof TFile) {
                    if (this.isWithinScope(file)) {
                        this.dataFetcher.checkAndAddFile(file);
                    }
                }
            })
        );

        this.registerEvent(
            this.app.vault.on('delete', (file) => {
                this.dataFetcher.removeFile(file.path);
            })
        );

        // Add a command to trigger a summary generation
        this.addCommand({
            id: 'generate-project-summary',
            name: 'Generate Project Summary',
            callback: async () => {
                const summaries = await this.dataFetcher.getAllProjectSummaries();
                new Notice(`Found ${summaries.length} project(s). Check console for details.`);
                console.log('Project Summaries:', summaries);
                
                await this.updateIndexFile(summaries);
                await this.appendToLog('Generated project summary for ' + summaries.length + ' projects.');
            }
        });

        // Add settings tab
        this.addSettingTab(new ProjectSummarizerSettingTab(this.app, this));
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    private isWithinScope(file: TFile): boolean {
        if (!this.settings.projectFolderPath) return true;
        return file.path.startsWith(this.settings.projectFolderPath);
    }

    private async updateIndexFile(summaries: any[]) {
        const indexPath = this.settings.indexFilePath;
        let content = '# Project Index\n\nGenerated at: ' + new Date().toLocaleString() + '\n\n';
        
        summaries.forEach(s => {
            content += `- [[${s.path}|${s.title}]] (Status: ${s.frontmatter?.status || 'N/A'})\n`;
        });

        const existingFile = this.app.vault.getAbstractFileByPath(indexPath);
        if (existingFile instanceof TFile) {
            await this.app.vault.modify(existingFile, content);
        } else {
            await this.app.vault.create(indexPath, content);
        }
        
        new Notice(`Updated ${indexPath}`);
    }

    private async appendToLog(message: string) {
        const logPath = this.settings.logFilePath;
        const entry = `\n## [${new Date().toISOString().split('T')[0]}] ${message}\n`;
        
        const existingFile = this.app.vault.getAbstractFileByPath(logPath);
        if (existingFile instanceof TFile) {
            const currentContent = await this.app.vault.read(existingFile);
            await this.app.vault.modify(existingFile, currentContent + entry);
        } else {
            await this.app.vault.create(logPath, '# Project Log\n' + entry);
        }
    }
}

class ProjectSummarizerSettingTab extends PluginSettingTab {
    plugin: ProjectSummarizerPlugin;

    constructor(app: App, plugin: ProjectSummarizerPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const {containerEl} = this;
        containerEl.empty();
        containerEl.createEl('h2', {text: 'Project Summarizer Settings'});

        new Setting(containerEl)
            .setName('Project Folder Path')
            .setDesc('Limit scanning to this folder (leave empty for whole vault)')
            .addText(text => text
                .setPlaceholder('e.g. Projects/')
                .setValue(this.plugin.settings.projectFolderPath)
                .onChange(async (value) => {
                    this.plugin.settings.projectFolderPath = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Index File Path')
            .setDesc('Path to the generated index file')
            .addText(text => text
                .setValue(this.plugin.settings.indexFilePath)
                .onChange(async (value) => {
                    this.plugin.settings.indexFilePath = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Log File Path')
            .setDesc('Path to the generated log file')
            .addText(text => text
                .setValue(this.plugin.settings.logFilePath)
                .onChange(async (value) => {
                    this.plugin.settings.logFilePath = value;
                    await this.plugin.saveSettings();
                }));
    }
}
