# Nam Y Quán — Tuệ Tâm Đường (`CLAUDE.md`)

> Educational Vietnamese Traditional Medicine (Y học cổ truyền Việt Nam) interactive apothecary simulation — React 18 + TypeScript + Vite 5 SPA.

## Live & Repo Info
- **Live Playtest URL:** `https://johnny163412.github.io/nam-y-quan/` (served from orphan `gh-pages` branch)
- **GitHub Repo:** `https://github.com/johnny163412/nam-y-quan` (public)
- **Local Path:** `/Users/thiagop/nam-y-quan`

## Core Architecture (v2.0.1 — Full-Bleed `100dvh` Spatial Diorama)
- **`src/App.tsx`**: Locks the app into a `100dvh` spatial shell (`app-shell spatial-shell`). Keeps `<ClinicDesk />` permanently mounted underneath; secondary modes (`Tàng Thư Các`, `Khảo Thí Y Miếu`, `Đoán Thể Chất`) open as ancient-scroll overlays on top so closing them returns directly to the active patient. Manages `<TitleGateScreen />`, `<AchievementToast />`, and `<AchievementCabinetModal />` (12 Honor Seals).
- **`src/components/HeaderPlaque.tsx`**: Single translucent ~48px floating top HUD (Rank Seal, Day/Solar Term, Y Đức, Streak, overlay buttons, 12 Honor Seals counter, Settings modal with audio mixer, JSON save export/import, and educational/CC-BY-4.0 attribution).
- **`src/components/ClinicDesk.tsx`**: 4-room horizontal spatial track (`I. Tiền Đường`, `II. Dược Các`, `III. Nội Các & Lò`, `IV. Hậu Viên`) with full-bleed painted room backgrounds (`spatial-room-bg-layer`), 2.5D mouse parallax (`--px`/`--py`), `<FloatingAtmosphereCanvas />`, `<FirstCaseGuideBar />`, and `<FloatingJuiceLayer />`.
  - **Tiền Đường foreground desk (`tien-duong-desk-foreground`)** MUST remain rendered **outside** `.apothecary-room-track` (because CSS `position: fixed` inside a transformed ancestor breaks viewport centering!). It holds the 5 tactile examination instruments (`Soi Gương`, `Nghe Thở`, `Thẻ Vấn`, `Gối Mạch`, `Đĩa Bát Quái`) flanked by real clickable desk relics (**Đỉnh Trầm Hương** at ≥ 20 Y Đức grants +1 inquiry turn per case; **Ấn Y Quán / Ấn Ngọc Bích** at ≥ 120 Y Đức).
  - Clicking any instrument slides in the right-side `.spatial-inspector-drawer` without hiding the patient.
- **`src/components/PaoZhiRig.tsx`**: Interactive 3-4s tactile mortar-pounding & oscillating-heat wok-roasting mini-game (with instant "Xong nhanh" bypass) powered by `<ApothecaryVfxCanvas />`.
- **`src/components/MeridianBodyMap.tsx`**: 24 acupoints (12 front, 12 back) on 1:1 aligned front/back watercolor figures (`meridian-front.jpg` & `meridian-back.jpg`, `500×888`), with glowing animated Qi arcs connecting active acupoints, Moxa (`Ngải cứu`), and Bamboo Cupping (`Giác hơi`).
- **`src/components/StoveAndSealRig.tsx`**: Direct pointer/touch swipe-to-fan bamboo fan interaction over the terracotta decoction stove + live taste reading + cinnabar/jade seal stamp.
- **`src/components/svg/TongueMirror.tsx`**: Watercolor antique bronze mirror (`./art/tools/bronze-mirror.jpg`) framing a live HTML5 canvas textured tongue with 5 interactive Zang-Fu zones.
- **`src/engine/audio.ts`**: Dual-deck crossfading BGM player (`./audio/tranquil-pavilion.m4a` for rooms 0/1/3, `./audio/warm-hearth.m4a` for room 2 — Kevin MacLeod CC BY 4.0) + WebAudio procedural SFX (`playVoiceBlip`, `playAchievementSeal`, `playMortarGrind`, `playWokSizzle`, `playBambooFan`, `playNeedleInsert`, `playSealStamp`, etc.).
- **`src/engine/cardExporter.ts`**: Zero-dependency HTML5 Canvas `1080×1350` PNG certificate exporter for Outcome Certificates and 9-Constitution Cards.
- **`src/engine/tcmEngine.ts`**: Pure TCM clinical simulation engine (Eight Principles vectors, Quân-Thần-Tá-Sứ weighting, Pao Zhi transformations, pregnancy contraindications, Classical Formula synergy detection, seasonal solar terms, Tý Ngọ Lưu Chú).
- **`src/styles/woodblock.css`**: Complete theme stylesheet (xuan paper, carved ironwood, cinnabar, herbal jade, antique brass).

## Strict Project Conventions & Guardrails
1. **Zero OS Unicode Emojis:** A unit test in `src/engine/__tests__/tcmEngine.test.ts` strictly enforces **zero** system Unicode pictographic emojis across all `src/` UI files. Always use `<AntiqueIcon name="..." />` from `src/components/svg/AntiqueIcons.tsx` instead.
2. **Relative Asset Paths Only:** `vite.config.ts` uses `base: './'`. Always reference assets in `public/` using `./art/...` and `./audio/...` (never leading `/art/`), or they will 404 on GitHub Pages `/nam-y-quan/`.
3. **Art Cohesion:** All 56+ illustrations in `public/art/` follow a warm Vietnamese hand-inked watercolor & rice-paper aesthetic (no flat modern vector/clipart).
4. **All 20 herbs, 20 garden plots, and 3 chapters** are intentionally unlocked for playtesting.
5. **Preserve 100% Vietnamese UI copy** with authentic TCM terminology.

## Commands
```bash
# Local dev server
npm run dev

# Run all 16 unit & integrity tests (data, solvability, contraindications, art existence, zero-emoji check)
npx vitest run

# Type-check + production build
npm run build

# Deploy dist/ to GitHub Pages (gh-pages branch — note: local gh token uses repo scope, not workflow scope)
TMPDIR_PAGES=$(mktemp -d) && \
cp -R dist/. "$TMPDIR_PAGES/" && \
touch "$TMPDIR_PAGES/.nojekyll" && \
(cd "$TMPDIR_PAGES" && git init -b gh-pages && git add -A && git commit -m "deploy: update" && git remote add origin https://github.com/johnny163412/nam-y-quan.git && git push -f origin gh-pages) && \
rm -rf "$TMPDIR_PAGES"
```
