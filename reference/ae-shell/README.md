# AE shell snapshot (reference only)

A frozen copy of the "computer" design from The Attention Exchange site, taken from AE commit `aa41566` (`site/`) on 2026-10-06. It comes from git, not the AE working tree, so the uncommitted `Hero.tsx` change there is **not** included.

**Nothing here is wired into the app.** Phase 1 moves the pieces it needs into the real `components/os/`, strips the AE content, and then this folder can be deleted.

## What's here

| Path | What it is |
|---|---|
| `components/os/` | The whole OS folder: shell, AE apps, ad code and tests, kept complete so every import resolves while you read it |
| `components/SmoothScroll.tsx` | Lenis wrapper; `OS.tsx` imports `useLenis` from it |
| `components/shell/routes.ts` | AE nav routes (imported by the shell; replace) |
| `lib/model/` | AE payout and figure models (imported by AE apps and some shell parts; drop) |
| `app/page.os-era.tsx` | The homepage from before the switch to the scroll page (commit `f27f537^`), showing how `<OS />` was mounted |
| `app/layout.tsx`, `app/globals.css` | Fonts, tokens and global styles the shell expects |
| `public/hero/`, `public/wallpaper/`, `public/fonts/` | The current room art, the desktop wallpaper, DepartureMono (+ license) |
| `package.json`, `tsconfig.json`, `vitest.config.ts`, `next.config.ts`, `postcss.config.mjs` | The stack, so dependency versions match |

## Keep vs drop

**Keep (the shell):** `intro/` (Hero, Laptop, geometry, useIntro + tests), `OS.tsx`, `OSWindow.tsx`, `LaunchedWindow.tsx`, `Dock.tsx`, `OSMenuBar.tsx`, `Spotlight.tsx`, `Notifications.tsx`, `GhostCursor.tsx`, `Wallpaper.tsx`, `DesktopItems.tsx`, `OSButton.tsx`, `parts.tsx`, `icons.tsx`, `stage.ts`, `chrome.ts`, `useReducedMotion.ts`, `useIsoLayoutEffect.ts`, `Stacked.tsx`.

**Drop:** `apps/*`, `ad*.ts(x)`, `AdSlot.tsx`, `Auction.tsx`, `campaign.ts`, `slots.ts`, `profiles.tsx`, `AccountMenu.tsx`, `LoginScreen.tsx`, `companions.tsx`, `data.ts`, `lib/model/`, and the AE tests (`campaign`, `adPlacement`, `profiles`, `figures`).

**Untangle, don't just delete.** The "keep" files aren't clean. `OS.tsx` and others import `profiles` (6 imports), `campaign` (5), `registry`, `slots`, `data`, `@/lib/model/*` and `@/components/shell/routes`. The two-account model (advertiser / user) runs through `OS.tsx`. Phase 1 replaces it with a single desktop and a rewritten `registry.tsx` listing the five portfolio apps (Résumé, Projects, The Attention Exchange, About/Mission, Contact).

**Brand mentions:** `intro/Hero.tsx`, `OSMenuBar.tsx`.
