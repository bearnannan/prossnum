import { App, TFile, MetadataCache } from 'obsidian';

export interface ProjectSummary {
    path: string;
    title: string;
    tags: string[];
    frontmatter: any;
    lastModified: number;
}

export class DataFetcher {
    private app: App;
    private projectFiles: Set<string> = new Set();

    constructor(app: App) {
        this.app = app;
    }

    /**
     * Initializes the index by scanning all markdown files for the #project tag.
     */
    async initializeIndex() {
        const files = this.app.vault.getMarkdownFiles();
        for (const file of files) {
            this.checkAndAddFile(file);
        }
        console.log(`[DataFetcher] Initialized index with ${this.projectFiles.size} project files.`);
    }

    /**
     * Checks if a file has the #project tag and updates the internal index.
     */
    checkAndAddFile(file: TFile) {
        const cache = this.app.metadataCache.getFileCache(file);
        const tags = cache?.tags?.map(t => t.tag) || [];
        const frontmatterTags = cache?.frontmatter?.tags || [];
        
        // Normalize tags (handle list vs string in frontmatter)
        const allTags = [...tags, ...(Array.isArray(frontmatterTags) ? frontmatterTags : [frontmatterTags])];
        
        if (allTags.some(t => t.includes('project'))) {
            this.projectFiles.add(file.path);
        } else {
            this.projectFiles.delete(file.path);
        }
    }

    /**
     * Removes a file from the index (e.g. when deleted).
     */
    removeFile(path: string) {
        this.projectFiles.delete(path);
    }

    /**
     * Compiles summaries for all indexed project files.
     */
    async getAllProjectSummaries(): Promise<ProjectSummary[]> {
        const summaries: ProjectSummary[] = [];
        
        for (const path of this.projectFiles) {
            const file = this.app.vault.getAbstractFileByPath(path);
            if (file instanceof TFile) {
                const cache = this.app.metadataCache.getFileCache(file);
                summaries.push({
                    path: file.path,
                    title: file.basename,
                    tags: cache?.tags?.map(t => t.tag) || [],
                    frontmatter: cache?.frontmatter || {},
                    lastModified: file.stat.mtime
                });
            }
        }
        
        return summaries;
    }
}
