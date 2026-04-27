# ProssNum Dashboard v1.7.0 — Authentication & UX Milestone

## 🚀 What's New?

We are excited to announce the release of **v1.7.0**, which introduces full **LINE Login** integration and a more personalized experience for authorized personnel.

### 🔐 Authentication & Security
- **LINE Login Integration**: Users can now securely sign in using their LINE accounts.
- **Global Auth Guard**: Implemented robust middleware protection across all dashboard routes. Both tradition PIN login and LINE OAuth are supported seamlessly.
- **Improved Security Logic**: Centralized authentication checks to ensure data privacy for infrastructure operations.

### ✨ User Experience (UX)
- **Personalized Navbar**: The top navigation bar now displays the logged-in user's name and profile image (when authenticated via LINE).
- **Progress Feedback**: Added loading states to login flows ("Connecting...") for a smoother, more responsive feel.
- **Glassmorphism UI**: Refined the logout and profile area with a premium, modern design matching the dashboard's aesthetic.

### 🛠️ Stability & Fixes
- Fixed hydration mismatches on the main dashboard for more reliable initial loads.
- Resolved Recharts sizing warnings (`width(-1)`) to ensure charts render perfectly on first mount.
- Optimized PWA synchronization for offline-resilient data entry.

---
**Full Changelog**: [v1.6.0...v1.7.0](https://github.com/bearnannan/prossnum/compare/v1.6.0...v1.7.0)

*(To use this, go to your repository on GitHub, click 'Tags', select 'v1.7.0', and click 'Create release from tag'.)*
