# YouTube Playback Controller

A Chrome and Firefox extension to control YouTube playback speed with a beautiful popup and an in‑page overlay. It stays perfectly in sync with YouTube’s native speed controls and shows the current speed as a toolbar badge.

## Features

- Syncs with YouTube: changing speed in the extension or in YouTube (gear menu) updates both ways instantly
- Presets and slider: quickly pick common speeds or fine‑tune with a slider
- Badge: shows current playback speed next to the pinned toolbar icon
- Overlay: optional in‑page speed controller with auto‑hide, position, and opacity controls
- Keyboard shortcuts: increase, decrease, reset, and cycle through presets
- Automation: rules to auto‑apply a speed by channel, title, or URL
- Profiles: save multiple sets of presets and defaults, and switch quickly
- Options page: full settings dashboard with live auto‑save


## Install (dev)

1. Install pnpm (>= 8) and Node (>= 18)
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Build the extension:
   ```bash
   pnpm run build
   ```
4. Load in Chrome:
   - Open `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist/` directory
   - Pin the extension via the puzzle icon so the popup and badge are visible

   Load in Firefox:
   - Open `about:debugging#/runtime/this-firefox`
   - Click "Load Temporary Add-on..." and select any file inside `dist/` (e.g., `manifest.json`)
   - Or use `npx web-ext run -s dist` for faster iteration

For iterative development:
```bash
pnpm run dev   # watches and rebuilds to dist/
```
After each rebuild, click the refresh icon on your extension card in `chrome://extensions`.


## Scripts

- `pnpm run build` – production build to `dist/`
- `pnpm run dev` – watch mode rebuilds to `dist/`
- For Firefox dev, you can also run: `npx web-ext run -s dist`
- `pnpm run lint` – ESLint (TypeScript + React)
- `pnpm run lint:fix` – ESLint with auto‑fix
- `pnpm run typecheck` – TypeScript type checking


## Project structure

```
public/manifest.json   # MV3 manifest (popup, options, background, content)
src/background/        # Background logic:
                       # - Chrome: service worker
                       # - Firefox: event page (fallback via background.scripts)
src/content/           # In‑page overlay, syncing with <video>, keyboard shortcuts
src/popup/             # Popup UI (tabs: General, Profiles, Automation, Settings)
src/options/           # Full settings dashboard (beautiful sidebar layout)
src/shared/            # Cross‑cutting utilities: storage, messaging, youtube helpers
src/components/        # Reusable UI components (slider, presets, tabs, theme toggle)
src/styles/            # Tailwind CSS
```

Key files:
- `src/shared/youtube.ts`: get/set playback rate, reverse playback support, video readiness
- `src/content/index.tsx`: binds to the active video’s `ratechange`, rebinding when YouTube swaps the element; broadcasts speed, saves default automatically
- `src/popup/App.tsx`: popup UI; applies speed to the active tab; requests and listens for current speed
- `src/background/index.ts`: keeps the action enabled on all tabs; updates/clears badge; provides Firefox fallback for session-like storage


## Settings overview

- Default playback rate
- Presets list (add/remove)
- Overlay: visible, auto‑hide, position (right/bottom in px), opacity
- Shortcuts: increase, decrease, reset, cycle; step size; optional snap‑to‑preset
- Automation rules: apply by channel/title/URL; bulk add/import
- Profiles: save and switch between sets of presets/defaults

All settings auto‑save.


## Toolbar badge

- Shows current speed (e.g., `1x`, `1.25x`, `1.3x`, `2x`). Negative values show reverse playback (e.g., `-1x`).
- Updates immediately when speed changes via YouTube UI, popup, overlay, or shortcuts.
- Clears on non‑YouTube pages, but the popup remains available everywhere.


## Firefox compatibility

- Manifest uses both `background.service_worker` (Chrome) and `background.scripts` (Firefox) with `preferred_environment` so each browser picks the right mode.
- `chrome.storage.session` is emulated on Firefox via `storage.local`; ephemeral keys are cleared on startup/installed.
- `browser` namespace shim is used where needed; APIs are feature-detected (e.g., `scripting.executeScript`).
- If badge colors don’t change on older Firefox, text color fallback is ignored.

## Troubleshooting

- Popup doesn’t open
  - Ensure the extension is pinned (puzzle icon → pin).
  - Reload in `chrome://extensions` after building.
- Badge doesn’t show a value
  - Open a YouTube video; the badge clears on non‑YouTube pages by design.
  - Change speed in the player or popup to trigger an update.
- Content not applying speed
  - Verify permissions and matches in `public/manifest.json`.
  - Open the YouTube page devtools Console for errors and reload the extension.


## CI & maintenance

- GitHub Actions: checks lint, typecheck, and build on PRs and pushes
- Dependabot: npm and actions updates
- Release Drafter: automatic release notes drafting


## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Please follow the PR template and ensure `pnpm run lint`, `pnpm run typecheck`, and `pnpm run build` pass.


## Security

See [SECURITY.md](SECURITY.md). Please report vulnerabilities privately. 