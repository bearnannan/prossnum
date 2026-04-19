# PROSSNUM Workspace Audit

This document provides a comprehensive map of the Prossnum ecosystem, detailing the role of each directory and the integration of specialized agent skills.

## 1. Core Application
- **Directory**: `webapp/`
- **Role**: The primary user-facing application.
- **Stack**: Next.js 16 (App Router), React 19, Tailwind CSS v4, Google Sheets Backend.
- **Operational Files**: `progress_summary.txt`, `build_error.log`, `system_audit.md`.

## 2. Agent Intelligence & Frameworks
These directories provide the "brain" and efficiency layers for the coding assistant.
- **`Memento-Skills/`**: Self-evolving agent framework. Uses reflective learning loops to optimize its own code and prompts based on task failure/success.
- **`caveman/`**: Token-efficiency layer. Compresses AI output by 65-75% while maintaining technical accuracy.
- **`oh-my-codex/`**: Orchestration framework for Codex-style skills and agents.
- **`.agent/skills/`**: Standardized collection of designer and engineering skills (adapt, animate, audit, polish, etc.).

## 3. Specialized Design & Tools
- **`ui-ux-pro-max-skill/`**: Advanced design reasoning engine. Generates industry-specific design systems (colors, typography, patterns).
- **`drawio-mcp/`**: Integration for Draw.io diagrams, allowing for visual architecture documentation.
- **`cliTokenKill/`**: Security utility for managing and clearing CLI session tokens.
- **`llm-wiki.md`**: Architectural pattern for persistent, compounding knowledge management.

## 4. Reference Projects & Resources
These are clones of external repositories used for inspiration, education, and feature reference.
- **`FossFLOW/`**: Reference for flow-based development.
- **`YourPOS-With-Stripe/`**: Reference for Point-of-Sale and Stripe payment integration.
- **`ebook-for-education/`**: educational resource reference.
- **`public-apis/`**: Extensive list of public APIs for integration research.

## 5. Core Skill Matrix
| **High** | `ui-ux-pro-max` | `ui-ux-pro-max-skill` | Styling & Design System |
| **High** | `memento-loop` | `Memento-Skills` | Build Fixes & Optimization |
| **Medium** | `caveman-prose` | `caveman` | Token Efficiency |
| **Medium** | `diagram-mcp` | `drawio-mcp` | Architecture Visualization |
