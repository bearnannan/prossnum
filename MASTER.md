# Prossnum Design System Architecture (MASTER.md)

> [!NOTE]
> This is a living document derived from the `ui-ux-pro-max` intelligence system. It defines the "Prossnum Premium Glassmorphism" aesthetic.

## 1. Visual Identity
**Core Concept**: Architectural Minimalism combined with High-Tech Infrastructure monitoring.
- **Aesthetic**: Glassmorphism, Bento Grids, Professional Data Density.
- **Vibe**: Trustworthy, Precise, State-of-the-art.

## 2. Design Tokens

### 2.1 Color Palette (OKLCH & Mauve)
We use a hybrid approach of **Mauve** for base structural depth and **OKLCH** for high-vibrancy accentuation.

| Role | Color (Hex/OKLCH) | Usage |
| :--- | :--- | :--- |
| **Background (Light)** | `oklch(0.985 0.002 280)` | Global page background |
| **Background (Dark)** | `oklch(0.12 0.015 270)` | Global dark mode background |
| **Mauve Base** | `#1a1722` (900) | Sidebar & deep panel backgrounds |
| **Primary Accent** | `oklch(0.205 0.02 260)` | Branding & critical buttons |
| **Success** | `oklch(0.696 0.17 162.48)` | Progress completion, status: ON |
| **Action Gradient** | `linear-gradient(135deg, #3b82f6, #8b5cf6)` | CTA buttons & active indicators |

### 2.2 Typography
- **Headlines**: `Outfit` (Manrope fallback) - -0.02em letter-spacing.
- **Body/Labels**: `Inter` (Sans-serif fallback) - high legibility for data points.

| Style | Font | Size | Weight |
| :--- | :--- | :--- | :--- |
| **Hero Title** | Outfit | 1.875rem+ | 800 (Extrabold) |
| **Card Header** | Outfit | 1rem | 700 (Bold) |
| **Body Text** | Inter | 0.875rem | 400 (Regular) |
| **Data Label** | Inter | 0.75rem | 600 (Semibold) |

## 3. Glassmorphism System
Prossnum interfaces are built on three tiers of transparency and blur.

### 🥉 Glass Subtle
- **Specs**: `Blur: 12px`, `Opacity: 45%`, `Saturation: 1.2`.
- **Use Case**: Search bars, dropdown menus, nested elements.

### 🥈 Glass Standard
- **Specs**: `Blur: 20px`, `Opacity: 72%`, `Saturation: 1.4`.
- **Use Case**: Main dashboard cards, navigation sidebars.

### 🥇 Glass Elevated
- **Specs**: `Blur: 24px`, `Opacity: 82%`, `Saturation: 1.6`.
- **Use Case**: Modals, high-priority overlays, header bars.

## 4. Interaction Physics
- **Easing**: `cubic-bezier(0.16, 1, 0.3, 1)` (Premium Out Ease).
- **Hover**: 
  - Scale: `1.02`.
  - Shift: `translateY(-4px)`.
  - Shadow: `shadow-premium-md` to `shadow-premium-lg`.
- **Loading**: Pulse Shimmer (`1.8s` loop).

## 5. UI Components Guidelines
- **Bento Cards**: Always have `border-radius: 1.25rem` (xl) or `1.5rem` (2xl).
- **Icons**: Use `material-symbols-outlined` with `wght: 400`.
- **Progress Bars**: Height `6px`, rounded `999px`, utilize `glow-` effects when 100%.

---
*Created with ui-ux-pro-max intelligence v2.5.0*
