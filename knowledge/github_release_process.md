# GitHub Release Process

This guide documents the standardized process for recording the state of the Prossnum codebase at specific milestones. Following these steps ensures version consistency and reliable deployments.

> [!IMPORTANT]
> This process is derived from the `llm-wiki.md` and `AI_INSTRUCTIONS.md` frameworks to ensure architectural compounding.

## 📦 Semantic Versioning (SemVer) Principles

We follow the `vMAJOR.MINOR.PATCH` format:

| Type | Format | When to Use |
| :--- | :--- | :--- |
| **MAJOR** | `x.0.0` | **Breaking Changes**: Changes that render the previous version unusable or require manual migration. |
| **MINOR** | `0.x.0` | **New Features**: Addition of functionality that is backward compatible. |
| **PATCH** | `0.0.x` | **Bug Fixes**: Minor improvements, security patches, or documentation updates. |

## 🚀 Implementation Steps

### 1. Commit All Changes
Before tagging, ensure the working directory is clean and all logic is committed.
```powershell
git add .
git commit -m "feat/fix: descriptive message for the version"
```

### 2. Create a Vision Tag
Create a local tag to identify the specific state of the code.
```powershell
git tag -a v1.x.x -m "Release v1.x.x: Summary of key changes"
```

### 3. Push the Tag to GitHub
Tags must be pushed explicitly to the remote repository.
```powershell
git push origin main
git push origin v1.x.x
```

### 4. Create a Release from the Tag
Navigate to the GitHub Repository and finalize the Release.
- **Repository**: [bearnannan/prossnum](https://github.com/bearnannan/prossnum.git)
- **Action**: Select the tag and generate release notes (use current `walkthrough.md` for inspiration).

## 🛠️ Maintenance Tools
Every time a release is performed, ensure the `log.md` and `index.md` are updated to maintain the **LLM-Wiki** chain of truth.
