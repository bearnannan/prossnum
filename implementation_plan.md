# Goal: System Audit & Skill Identification

The objective is to perform a comprehensive system audit of the current web application using the newly added `.agent/skills` framework and identify the core skills that should be utilized to improve the project's quality.

## Proposed Changes

### 1. Execute Comprehensive Diagnostic Scan
- I will review the core components of the codebase (`webapp/src/app` and `webapp/src/components`) against the five pillars defined in the `audit` skill:
  - **Accessibility**: ARIA labels, contrast, keyboard navigation.
  - **Performance**: Render paths, bundle impacts, optimization.
  - **Theming**: Consistency of design tokens and dark mode.
  - **Responsive Design**: Mobile/tablet views and touch target size.
  - **Anti-Patterns**: Identifying generic "AI slop" or sub-optimal design choices.

### 2. Generate Audit Report
- I will document all findings in a new artifact (`audit_report.md`).
- The report will grade the severity of the issues (Critical, High, Medium, Low) without immediately fixing them, as per the `audit` skill's instruction.

### 3. Identify and Map Main Skills
- Based on the findings, I will map the required fixes to the newly added skills in `.agent/skills` (e.g., `frontend-design`, `optimize`, `harden`, `polish`, `typeset`, `arrange`, `adapt`).
- I will update `webapp/system_audit.md` to reflect the actual available agent skills, replacing the placeholder skills currently listed there.

## User Review Required
- Please review this approach. If approved, I will proceed to execution mode to scan the codebase and generate the audit report.

## Verification Plan
- **Manual Verification**: You will receive a detailed `audit_report.md` detailing the exact status of the frontend and specific commands (e.g., `/polish`, `/optimize`) that can be used to resolve the identified issues.
