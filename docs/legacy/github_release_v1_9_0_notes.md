# Release Notes: ProssNum v1.9.0

## 🧠 Intelligence & Architecture Milestone

This release marks a major leap in developer experience and architectural stability by introducing the **Intelligence Layer** and a complete **Root Directory Reorganization**.

---

### 🚀 Key Improvements

#### 1. Intelligence Layer (GitNexus Integration)
- **Codebase Knowledge Graph**: Integrated GitNexus to provide deep semantic understanding of the monorepo.
- **Impact Analysis**: Agents can now perform better impact analysis before making changes.
- **Compounding Memory**: Established `llm-wiki.md` as a living documentation system.

#### 2. Architectural Cleanup (Revision 5.0)
- **Root Clutter Reduction**: Moved 20+ root-level directories into categorized Tier 1 repositories:
  - `agent-frameworks/`: Consolidated AI tools (LangGraph, CrewAI, MemOS, etc.).
  - `infra-refs/`: Secure storage for infrastructure tools (Vault, Dapr, RTK).
  - `reference/`: Pattern libraries and UI component references (Loading-UI, Skills).
- **Legacy Archiving**: Introduced `docs/legacy/` to store historical implementation plans, keeping the workspace clean for active development.
- **Script Management**: Centralized automation tools into the `scripts/` directory.

#### 3. Documentation & Audit
- **Workspace Audit v5.0**: Fully updated mapping of the ecosystem.
- **Intelligence-First README**: Redesigned `README.md` to highlight the new architecture and operational standards.

---

### 🛠️ Maintenance Updates
- Fixed directory access issues for core AI skills (`rtk`, `caveman`).
- Synchronized all `AI_INSTRUCTIONS.md` with the new folder paths.

---

**Full Changelog**: [v1.8.0...v1.9.0](https://github.com/bearnannan/prossnum/compare/v1.8.0...v1.9.0)
