# Vercel Build Stability Guide

This document serves as a persistent post-mortem and technical guide for ensuring stable deployments of the Prossnum web application to Vercel.

## 1. Middleware & Proxy Convention
**CRITICAL**: This project does NOT use the standard Next.js `middleware.ts` naming convention.

- **Mandatory Filename**: `webapp/src/proxy.ts`
- **Mandated Export**:
  ```typescript
  export function proxy(request: NextRequest) {
    // ... logic
  }
  ```
- **Why?**: The project's build pipeline (including `@ducanh2912/next-pwa` or custom server configurations) is specifically mapped to `proxy.ts`. Using `middleware.ts` will cause the build to fail with a conflict error.

## 2. UI & Hydration Stability
Hydration mismatches are the most common cause of "Build Failed" (when linting is strict) or runtime flickering.

- **Recharts Sizing**: Avoid providing `-1` or `0` to width/height properties. Always use `ResponsiveContainer` and ensure the parent has a defined height.
- **Dynamic Content**: Avoid using `Date.now()` or browser-only globals (like `window`) in the initial render of a component. If necessary, use a `useEffect` and a `hasMounted` state to guard the client-side logic.
- **Icon Rendering**: Use a consistent icon library (`lucide-react`) and avoid conditional imports that might result in different HTML on the server vs client.

## 3. PWA & Static Assets
- **Generated Assets**: Files like `public/sw.js` and `public/workbox-*.js` are generated at build time by the PWA plugin.
- **Git Strategy**: Generally, these should be in `.gitignore` to prevent stale versions from being committed, but ensure Vercel has the permissions needed to generate them during its own build process.

## 4. Pre-Deployment Checklist for Agents
Before pushing to GitHub, any Agent operating on this codebase MUST run:
1. `cd webapp`
2. `npm run build`
3. If build fails, resolve errors locally first. Do NOT push code that does not build with `Exit code: 0`.

---
*Created on 2026-04-21 following the Prossnum Operational Handbook.*
