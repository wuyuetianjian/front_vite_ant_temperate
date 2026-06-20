# Liquid Glass Design System

**Date:** 2026-06-20  
**Scope:** All pages (LoginPage + AdminLayout) + reusable design token system  
**Reference:** Apple iOS 26 / macOS 26 Liquid Glass design language  
**Stack:** React 19 + Vite + Ant Design v6 + CSS Custom Properties

---

## 1. Goals

- Apply Apple-style Liquid Glass visual language across the entire frontend
- Establish a centralized CSS token system so future pages inherit the style with zero extra work
- Allow administrators to upload a custom wallpaper that shows through all glass panels
- Support both light and dark modes with a single set of tokens

---

## 2. Design System (CSS Tokens)

### File: `src/styles/liquid-glass.css`

All glass properties are defined as CSS Custom Properties on `:root` (light mode defaults) and overridden under `[data-theme="dark"]`.

```css
:root {
  /* Wallpaper */
  --wallpaper-url: none;

  /* Glass material */
  --glass-blur: 48px;
  --glass-saturate: 180%;
  --glass-bg: rgba(255, 255, 255, 0.18);
  --glass-border: rgba(255, 255, 255, 0.40);
  --glass-specular: rgba(255, 255, 255, 0.70);   /* top-edge specular highlight */
  --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);

  /* Border radius scale */
  --glass-radius-sm: 12px;
  --glass-radius-md: 16px;
  --glass-radius-lg: 24px;

  /* Typography on glass */
  --glass-text-primary:   rgba(20, 20, 30, 0.90);
  --glass-text-secondary: rgba(20, 20, 30, 0.55);

  /* Accent (indigo) */
  --glass-accent:      #6366f1;
  --glass-accent-glow: rgba(99, 102, 241, 0.35);
}

[data-theme="dark"] {
  --glass-bg:        rgba(0, 0, 0, 0.25);
  --glass-border:    rgba(255, 255, 255, 0.12);
  --glass-specular:  rgba(255, 255, 255, 0.22);
  --glass-shadow:    0 8px 32px rgba(0, 0, 0, 0.45);
  --glass-text-primary:   rgba(255, 255, 255, 0.90);
  --glass-text-secondary: rgba(255, 255, 255, 0.50);
}

/* Core utility class — apply to any glass surface */
.glass {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  border: 1px solid var(--glass-border);
  box-shadow:
    var(--glass-shadow),
    inset 0 1px 0 var(--glass-specular);
  border-radius: var(--glass-radius-md);
}

/* Content card variant — slightly more transparent, used inside pages */
.glass-card {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow), inset 0 1px 0 var(--glass-specular);
  border-radius: var(--glass-radius-lg);
  padding: 24px;
}
```

### File: `src/styles/glass-overrides.css`

Ant Design component overrides. All values reference CSS variables so dark mode switching is automatic.

**Button**
```css
.ant-btn-default {
  background: rgba(255,255,255,0.10) !important;
  border-color: var(--glass-border) !important;
  backdrop-filter: blur(8px);
  color: var(--glass-text-primary) !important;
}
.ant-btn-default:hover {
  background: rgba(255,255,255,0.18) !important;
  border-color: rgba(255,255,255,0.50) !important;
}
.ant-btn-primary {
  background: linear-gradient(135deg, #6366f1, #8b5cf6) !important;
  box-shadow: 0 4px 20px var(--glass-accent-glow),
              inset 0 1px 0 rgba(255,255,255,0.25) !important;
  border: none !important;
}
```

**Table**
```css
.ant-table { background: transparent !important; }
.ant-table-thead > tr > th {
  background: rgba(255,255,255,0.08) !important;
  border-bottom: 1px solid var(--glass-border) !important;
}
.ant-table-tbody > tr > td {
  border-bottom: 1px solid rgba(255,255,255,0.06) !important;
  background: transparent !important;
}
.ant-table-tbody > tr:hover > td {
  background: rgba(255,255,255,0.06) !important;
}
```

**Modal**
```css
.ant-modal-mask {
  background: rgba(0,0,0,0.20) !important;
  backdrop-filter: blur(4px) !important;
}
.ant-modal-content {
  background: var(--glass-bg) !important;
  backdrop-filter: blur(64px) saturate(var(--glass-saturate)) !important;
  border: 1px solid var(--glass-border) !important;
  border-radius: var(--glass-radius-lg) !important;
  box-shadow: 0 24px 64px rgba(0,0,0,0.30),
              inset 0 1px 0 var(--glass-specular) !important;
}
.ant-modal-header {
  background: transparent !important;
  border-bottom: 1px solid var(--glass-border) !important;
}
.ant-modal-footer { border-top: 1px solid var(--glass-border) !important; }
```

**Dropdown / Select / Datepicker popups**
```css
.ant-dropdown-menu,
.ant-select-dropdown,
.ant-picker-dropdown .ant-picker-panel-container {
  background: var(--glass-bg) !important;
  backdrop-filter: blur(48px) saturate(var(--glass-saturate)) !important;
  border: 1px solid var(--glass-border) !important;
  border-radius: var(--glass-radius-md) !important;
  box-shadow: var(--glass-shadow) !important;
}
.ant-dropdown-menu-item:hover,
.ant-select-item-option-active {
  background: rgba(255,255,255,0.10) !important;
}
```

**Form inputs (global)**
```css
.ant-input, .ant-input-affix-wrapper,
.ant-select-selector, .ant-picker {
  background: rgba(255,255,255,0.08) !important;
  border-color: var(--glass-border) !important;
}
.ant-input-affix-wrapper-focused,
.ant-select-focused .ant-select-selector,
.ant-picker-focused {
  border-color: var(--glass-accent) !important;
  box-shadow: 0 0 0 3px var(--glass-accent-glow) !important;
}
```

**Ant Design Card**
```css
.ant-card {
  background: var(--glass-bg) !important;
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  border: 1px solid var(--glass-border) !important;
  box-shadow: var(--glass-shadow) !important;
  border-radius: var(--glass-radius-lg) !important;
}
```

**Drawer / Tag / Tooltip**
```css
.ant-drawer-content {
  background: var(--glass-bg) !important;
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate)) !important;
}
.ant-tag {
  background: rgba(255,255,255,0.10) !important;
  border-color: var(--glass-border) !important;
  backdrop-filter: blur(8px);
  border-radius: 999px !important;
}
.ant-tooltip-inner {
  background: rgba(20,20,30,0.75) !important;
  backdrop-filter: blur(16px) !important;
  border: 1px solid var(--glass-border) !important;
}
```

---

## 3. Wallpaper System

### File: `src/store/wallpaper.ts`

Zustand store persisted to `localStorage`. Stores wallpaper as a base64 data URL (max 4 MB enforced in UI). On change, syncs `--wallpaper-url` CSS variable to `document.documentElement`.

```ts
interface WallpaperStore {
  url: string | null
  setUrl: (url: string) => void
  clear: () => void
}
```

### Component: `WallpaperBackground`

Fixed fullscreen div rendered as the first child of `App.tsx`, `z-index: 0`. All layout elements are `z-index ≥ 1`.

```
position: fixed; inset: 0; z-index: 0;
background: var(--wallpaper-url, <default-gradient>) center/cover no-repeat fixed;
```

Overlaid with a thin tint layer for readability:
- Light mode: `rgba(255,255,255,0.15)`
- Dark mode: `rgba(0,0,0,0.35)`

Fallback when no wallpaper is set: the existing indigo/purple gradient + orbs — no visual gap.

### CSS variable sync in `App.tsx`

```tsx
useEffect(() => {
  const root = document.documentElement
  if (url) {
    root.style.setProperty('--wallpaper-url', `url("${url}")`)
  } else {
    root.style.removeProperty('--wallpaper-url')
  }
}, [url])
```

`data-theme` attribute sync also lives here:
```tsx
useEffect(() => {
  document.documentElement.dataset.theme = resolved()  // 'light' | 'dark'
}, [resolved()])
```

### Upload UI in `SettingsPage.tsx`

New "外观" (Appearance) section card:

- File input: `accept="image/*"`, max 4 MB (validated before reading)
- On select: `FileReader.readAsDataURL()` → `wallpaper.setUrl(result)`
- Preview: 240×135 thumbnail of current wallpaper
- "恢复默认" button: calls `wallpaper.clear()`
- Change takes effect immediately, no page reload required

---

## 4. AdminLayout Changes

### Removed
- All inline `glassBg`, `glassBorder`, `headerGlassBg`, `layoutBg` computed values
- `isDark` conditional background logic in Sider/Header

### Added
- `<Layout>` and `<Content>`: `background: transparent`
- Sider: `className="glass"` + `style={{ background: 'transparent' }}`
- Header: `className="glass"`, converted to floating bar style:
  - `position: sticky; top: 8px; margin: 8px 16px 0`
  - `borderRadius: var(--glass-radius-lg)` — full rounded corners, floats above content
- Logo area: glass pill wrapper
- Menu overrides in `glass-overrides.css`:
  ```css
  .ant-menu { background: transparent !important; }
  .ant-menu-item-selected {
    background: rgba(99,102,241,0.15) !important;
    border-left: 2px solid var(--glass-accent);
    border-radius: var(--glass-radius-sm);
  }
  .ant-menu-item:hover { background: rgba(255,255,255,0.08) !important; }
  ```

---

## 5. LoginPage Changes

### Background
- `.login-page` background → `transparent` (WallpaperBackground shows through)
- `.bg-orb` opacity reduced (0.18 → 0.10) — acts as color accent over wallpaper
- Fallback: dark gradient on `body` for when no wallpaper is set

### Brand panel (left, animated characters)
- `.brand-panel` background → `transparent`
- Panel separator `::after` uses `var(--glass-border)` instead of hardcoded rgba
- Animated characters unchanged — they naturally float over the blurred wallpaper

### Login card `.login-box`
- Replaces all hardcoded `rgba(255,255,255,0.04)` values with design tokens
- Uses stronger blur (`--glass-blur: 64px` locally) for form readability
- Box shadow adds bottom-edge inner reflection:
  ```css
  box-shadow:
    var(--glass-shadow),
    inset 0 1px 0 var(--glass-specular),
    inset 0 -1px 0 rgba(255,255,255,0.06);
  ```

### Form inputs
- Replaced with global `glass-overrides.css` rules (no duplication)
- Focus state uses `var(--glass-accent)` + `var(--glass-accent-glow)`

### Theme
- LoginPage follows the global `useThemeStore` (light/dark). The `loginDarkTheme` ConfigProvider is replaced with a dynamic config that reads `resolved()` and applies `darkAlgorithm` or `defaultAlgorithm` accordingly.
- The glass card's strong blur (64px) provides sufficient contrast in both modes without forcing dark.
- Hardcoded `borderRadius: 12` → `token.borderRadiusLG` from ConfigProvider (maps to `--glass-radius-sm` equivalent)

---

## 6. Delivery Checklist

| File | Action |
|---|---|
| `src/styles/liquid-glass.css` | Create — CSS token system |
| `src/styles/glass-overrides.css` | Create — Ant Design overrides |
| `src/store/wallpaper.ts` | Create — wallpaper Zustand store |
| `src/main.tsx` | Import both CSS files |
| `src/App.tsx` | Add `WallpaperBackground`, sync `--wallpaper-url` + `data-theme` |
| `src/pages/admin/AdminLayout.tsx` | Remove inline glass logic, add CSS classes |
| `src/pages/LoginPage.tsx` | Background transparent, token refs |
| `src/App.css` | Replace hardcoded values with CSS variables |
| `src/pages/admin/SettingsPage.tsx` | Add wallpaper upload UI section |

---

## 7. Out of Scope

- Backend API for wallpaper storage (wallpaper stored in `localStorage` only for now)
- Animation/motion design beyond existing CSS transitions
- Custom icon set changes
- New page layouts beyond the existing route structure
