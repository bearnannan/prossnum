# PROSSNUM Workspace Audit
**Last Updated:** 2026-04-28 | Audit Revision 6.0

This document provides a comprehensive map of the Prossnum ecosystem, detailing the role of each directory and the integration of specialized agent skills.

---

## 1. Core Application
- **Directory**: `webapp/`
- **Role**: The primary user-facing application.
- **Stack**: Next.js (App Router), React 19, Tailwind CSS v4, Proxy-based Auth, Supabase Backend.
- **Operational Files**: `AI_INSTRUCTIONS.md`, `workspace_audit.md`, `scripts/update_modules.ps1`.
- **Intelligence**: Indexed by [GitNexus](file:///d:/APP/prossnum/agent-frameworks/GitNexus) (repo: `webapp`).

---

## 2. Organized Skill Repository (TIER 1 — Active)

| Directory | Role |
|-----------|------|
| `agent-frameworks/` | **Intelligence Layers** — `GitNexus`, `FossFLOW`, `MemOS`, `langgraph`, `crewAI`, `UltraRAG`, `caveman`, `oh-my-codex`, `Memento-Skills`, `ui-ux-pro-max-skill`, `milvus`, `temporal`. |
| `mcp-servers/` | **MCP Infrastructure** — `drawio-mcp`, `sentry`. |
| `utilities/` | **Operational Tools** — `loading-ui`, `ebook-for-education`, `public-apis`, `rbac-manager`, `cliTokenKill`, `merge-pdf-files`, `convert-pdf-to-jpg`. |
| `reference/` | **Pattern Libraries** — `awesome-agent-skills`, `obsidian-skills`, `skills`, `YourPOS-With-Stripe`. |
| `reference/backend/` | **Backend Refs** — `django`, `fastapi`, `flask`, `pandas`, `poetry`, `pytest`. |
| `reference/infrastructure/` | **Infra Refs** — `dapr`, `next-auth`, `rtk`, `sqldef`, `vault`. |

---

## 3. Formalized Agent Skills (.agent/skills/skills/)
These are the central, standardized skills utilized by the agentic ecosystem.

| Skill Name | Role |
|------------|------|
| `gitnexus-intelligence` | Advanced impact analysis and codebase exploration. |
| `gitnexus-index-management` | Maintenance of the LadybugDB knowledge graph. |
| `memento-loop` | Self-evolving reflective process for system stability. |
| `ui-ux-pro-max` | Design system enforcement and UI excellence. |
| **Productivity Batch** | **Consolidated Agent Operations** |
| `caveman` | Ultra-terse, token-efficient communication mode. |
| `diagnose` | Systematic error and log analysis protocol. |
| `github-triage` | Streamlined PR and Issue management workflows. |
| `grill-me` | Pressure testing logic and assumptions. |
| `improve-codebase-architecture` | Architectural refactoring and design guidance. |
| `tdd` | Test-Driven Development workflow enforcement. |
| `to-issues` / `to-prd` | Artifact transformation and requirement drafting. |
| `write-a-skill` | Self-improvement and capability extension. |
| `zoom-out` | High-level architectural perspective and summaries. |

---

## 4. Technical Knowledge Base (LLM-Wiki)
- **Directory**: `knowledge/`
- **Role**: Persistent technical memory storage.
- **Operational Files**: `llm-wiki.md` (pattern spec), `index.md`, `log.md`.

---

## 5. Maintenance & Archives
- **Scripts**: `scripts/` — Contains utility scripts like `update_modules.ps1`.
- **Archives**: `docs/legacy/` — Historical implementation plans and walkthroughs.
- **Skills (Dev)**: `.agent/skills/` — Active skill development and orchestration.

