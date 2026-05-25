# Implementation Plan: Migrating Incident Operations to Mission Control

## Core Objective

Migrate the `/incidents` path into the `/mission-control` workflow to align with the correct product direction. To minimize deployment risks, avoid deleting the `/incidents` route immediately. Use a safe, phased transition so Mission Control becomes the primary operational surface while the legacy route remains available until all workflows are verified.

## Phase 1: Establish `/mission-control` as the Primary Operations Surface

Port and integrate all active features from `/incidents` into the unified `/mission-control` workspace:

- Create Incident: Initialize new tracking records.
- Edit Active Incident: Modify open issue parameters.
- Update Status: Change progress fields such as Pending, In Progress, and Resolved.
- Retry LINE Notification: Re-push dynamic payload triggers.
- Asset-Linked Incident Creation: Log issues tied directly to specific equipment or infrastructure.
- LINE Bot / Settings Access: Manage configuration credentials.

Temporarily retain the legacy `/incidents` route as a backward-compatibility path that redirects users to `/mission-control` or serves a lightweight fallback view.

Permanently deprecate and retire the `/incidents` route once `/mission-control` validates and covers 100% of the operational workflows.

## Phase 2: UI/UX Component Enhancements (Tactical HUD Layout)

Enhance Mission Control with operational UI components that follow `design-system-retro-neon-updated.md`:

- Action Drawers: Integrate a native "New Incident" sliding drawer in the `/mission-control` layout.
- Unified Inspector Panel: Add editable incident detail fields inside the Mission Control inspector sidebar.
- Inline Operations: Embed status update dropdowns and localized retry actions directly within the primary data queue and inspector view.
- Settings Shortcuts: Mount a direct system shortcut to access the dynamic LINE Bot fallback settings configuration.

## Phase 3: Routing, Deep-Linking & Verification

Implement strict state-driven routing parameters so focused operational states can load directly:

- `/mission-control?incident=<id>`: Deep-link straight to an active target's inspector panel.
- `/mission-control?action=new`: Open the incident creation drawer automatically.

Update navigation and route behavior:

- Remap the primary application sidebar link from `/incidents` to `/mission-control`.
- Apply automatic Next.js router middleware redirection from `/incidents` to `/mission-control` after production verification.

## Verification Requirements

- Confirm `/mission-control` supports create, edit, status update, retry notification, asset-linked creation, and LINE settings access.
- Confirm `/incidents` remains safe during the transition.
- Run TypeScript and lint checks.
- Browser-test desktop and mobile Mission Control layouts.
- Verify no map, HUD, drawer, inspector, or modal behavior violates the retro-neon design system.

## Completion Criteria

The migration is complete when `/mission-control` is the primary incident operations surface, legacy users can still reach the workflow safely, and every operational action previously available on `/incidents` works inside the Mission Control map/HUD environment.
