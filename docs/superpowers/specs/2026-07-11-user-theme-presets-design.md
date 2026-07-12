# User Theme Presets Design

## Goal

Add the Ant Design theme experience shown on the Chinese homepage into the admin app: users can choose from several named visual styles, apply them immediately, and persist the choice to the database so the same user gets the same style after login.

## Theme Scope

The first implementation supports these presets:

- default
- dark
- mui
- shadcn
- cartoon
- illustration
- bootstrap
- glass
- geek

Each preset maps to a structured front-end theme config: Ant Design algorithm, seed tokens, component token overrides, CSS theme class, and density. The current liquid-glass visual language remains the baseline, especially for the admin shell and wallpaper background.

## User Preference Storage

Store user theme choices on the authenticated user record:

- `theme_preset`: selected preset key
- `theme_mode`: `light`, `dark`, or `system`
- `theme_config`: optional JSON string for future custom or AI-generated themes

The API returns these fields in `User`. A new current-user preference endpoint updates only the authenticated user's theme fields, avoiding broad user update permissions for a personal setting.

## Frontend Behavior

The theme store keeps a local fallback for logged-out or failed API states. When a user logs in or `/v1/auth/me` refreshes, the store hydrates from the user object. When a user changes theme in the UI, the app applies it immediately, saves it through the API, updates the auth user, and keeps local fallback in sync.

The appearance UI lives in Profile first, because it is a personal preference. It uses a compact preset grid with visual swatches and clear active state. The panel also keeps the existing light, dark, and system behavior by mapping those modes into preset behavior.

## AI Theme Entry

Add the UI and data model shape for AI generated themes, but do not fake generation if no backend AI endpoint exists. The custom config field is reserved so a future AI endpoint can save generated token JSON without changing the storage model.

## Validation

Validate with:

- backend code generation after proto and ent schema changes
- Go tests for backend behavior where available
- front-end typecheck/build
- manual checks for login hydration, profile theme switching, dark preset, compact/high-density display, and fallback behavior when saving fails
