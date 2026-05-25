# AI Instructions: Prossnum Operational Handbook

This document defines the core principles, architectural patterns, and design standards for the Antigravity agent operating within the Prossnum ecosystem.

## 1. Core Operating Principles

- **Compounding Knowledge**: Every session must leave the project smarter. Follow the `llm-wiki` pattern strictly to maintain persistent context.
- **Premium Aesthetics**: Every UI contribution must be stunning. Adhere to the `MASTER.md` design system. Avoid generic, boring, or "AI-looking" interfaces.
- **Build Integrity**: All changes must maintain a stable production build. Use `Memento-Skills` for self-healing and error resolution.
- **Token Efficiency**: Use concise communication and strategic file reading. Refer to `rtk` (60-90% saving) and `caveman` principles for high-frequency interactions.
- **Codebase Intelligence**: Leverage `GitNexus` for deep architectural understanding and impact analysis before any significant change.

---

## 2. Knowledge Management (llm-wiki Pattern)

The knowledge base is stored in the project root and structured as follows:

- **`index.md`**: The content-oriented catalog. Lists all major pages, concepts, and components with one-line summaries.
- **`log.md`**: The chronological record. Every significant change, decision, or discovery must be logged here with a date and prefix (e.g., `## [YYYY-MM-DD] Feature | Description`).
- **`workspace_audit.md`**: The living map of the system architecture and third-party integrations.
- **`knowledge/`**: Directory for detailed research, post-mortems, and technical deep-dives.

**Operation Ingest**: When new information or feedback is received, integrate it into the wiki immediately rather than re-discovering it later.

---

## 3. Design System Standards (MASTER.md)

Prossnum uses a **Glassmorphism / Bento-Grid** design language.

### A. Visual Tokens
- **Theme**: Dark mode by default with neophilic accents.
- **Glass Effects**: High-blur backdrops, subtle white borders (1px, 10-20% opacity).
- **Colors**:
  - `Surface`: Deep charcoal/navy translucent.
  - `Accent`: Vibrant gradients (Cyan-to-Blue, Vivid Purple).
  - `Typography`: Modern, high-readability sans-serif (Sarabun/Inter).

### B. Component Patterns
- **Bento Grids**: Use for dashboards to group related information in visually distinct tiles.
- **Micro-animations**: Use `framer-motion` for all state transitions (hover, entry, exit).
- **Icons**: Use `lucide-react` with consistent stroke weight.

---

## 4. Maintenance & Updates

### 1. External Modules
The project includes several cloned repositories (not submodules). To keep them updated:
- **Automation**: Run `.\update_modules.ps1` from the root directory.
- **Scope**: This script pulls `origin/main` or `origin/master` for all directories containing a `.git` folder.

### 2. Living Documentation
- **Sync Routine**: At the start of each significant phase, verify `llm-wiki.md` and `AI_INSTRUCTIONS.md` are up to date with the latest architectural changes (e.g., Supabase migration details).
- **Knowledge Synchronization**: **CRITICAL**: Every time a build error, architectural conflict, or significant post-mortem occurs, the agent MUST update the `knowledge/` directory (e.g., `vercel_stability.md`) *before* final closure.
- **Update Frequency**: Documentation must be updated *before* a walkthrough is generated for any major feature.

## 5. Development Workflow

### Step 1: Research & Audit
Before editing code, perform a symbolic search or use `GitNexus` (e.g., `query`, `impact`) to understand the scope and dependencies. Confirm the backend state (Supabase vs. Google Sheets).

### Step 2: Plan & Propose
For complex changes, provide an Implementation Plan artifact. Ensure the plan highlights UI impact and testing strategy.

### Step 3: Execute & Stabilize
- Use `npm run dev` to verify UI changes in real-time.
- Use `npm run build` to verify architectural integrity.
- If a build fails, invoke the `Memento-Skills` reflective loop to diagnose and fix.

### Step 4: Document & Close
Finalize every task by updating the `log.md` and `index.md`. Create a Walkthrough artifact with screenshots/narrative of the change.

---

## 5. LINE Quota & Incident Fallback Standards

If you modify or refactor the incident reporting or push notification modules:
- **Zero-Restart Switcher**: Always query Supabase settings `line_backup_token`, `line_backup_group_id`, and `fallback_email_to` dynamically via `getIncidentConfigAsync()` inside any route handler. Never hardcode token backups or trigger server restarts.
- **Microsoft 365 SMTP baseline**: Keep baseline SMTP values (`smtp.office365.com` and `587`) as default parameters inside `src/lib/incidents/config.ts`.
- **Resilient Fallbacks**: Never let the email fallback service crash or fail silently if credentials are blank. Ensure the `nodemailer` logger prints the visually highlighted mock status directly to the console in local testing.

---

## 6. Skill Priority Matrix

1. **`GitNexus`**: Primary for codebase intelligence, impact analysis, and knowledge-graph context.
2. **`ui-ux-pro-max-skill`**: Primary for UI quality and design-system adherence.
3. **`Memento-Skills`**: Primary for stability and "Exit 0" build enforcement.
4. **`rtk`**: Token efficiency proxy — 60–90% LLM token savings. Run `rtk init --agent antigravity`.
5. **`loading-ui`**: Animated loading components (spinners, skeletons) for the webapp.
6. **`obsidian-skills`**: Obsidian knowledge-management agent skills.
7. **`skills`** (Google): GCP/Gemini API integration recipe skills.
8. **`oh-my-codex`**: For orchestrating complex, multi-repo tasks.
9. **`frontend-design`**: Standard implementation tool for web components.

---

## Commandment for the Agent
> *"Do not build a Minimum Viable Product. Build a Maximum Delight Experience."*
