![Status](https://img.shields.io/badge/status-in%20development-yellow?style=flat-square&logo=github)
![License](https://img.shields.io/badge/license-Kiarash%20Kia%20All%20Rights%20Reserved-red?style=flat-square&logo=law&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-in%20progress-orange?style=flat-square&logo=pwa&logoColor=white)
![Design System](https://img.shields.io/badge/design%20system-TruKit-%23FF6B6B?style=flat-square&logo=figma&logoColor=white)
![UI Framework](https://img.shields.io/badge/UI%20Framework-Chakra%20UI-%2331C4A4?style=flat-square&logo=chakraui&logoColor=white)
![Built With](https://img.shields.io/badge/built%20with-React%20+%20Vite-blueviolet?style=flat-square&logo=react&logoColor=white)



# TruMark 🛒🔗  
**Food Transparency Verifier Powered by Blockchain**

> _Pixel-perfect mobile-first consumer PWA built for supply chain accountability._

---

## 📖 Overview

**TruMark** is a public-facing web application, currently developed for Canadians, that allows consumers to scan food product barcodes and verify their safety, recall status, and blockchain-verified supply chain. The MVP focuses on **clarity, safety, and instant trust**, backed by government data and smart contracts on Polygon.

**TruKit** is the design system crafted to form the beauty of TruMar- born from a heritage of clarity, usability, and timeless design. Inspired by Apple’s Human Interface Guidelines, Chakra UI’s modular efficiency, and Ontario’s accessibility standards, TruKit blends structure with flexibility to ensure effortless and intuitive experience for all users. Designed with fluidity without excess, spacing without clutter, and interactions without friction, TruKit minimizes cognitive load and keeps the focus on functionality. A lightweight, distraction-free approach ensures that users navigate with ease, never overwhelmed or uncertain about the app’s core purpose.

---

## 📱 MVP Features

| Feature                   | Status       | Description |
|---------------------------|--------------|-------------|
| Onboarding Flow           | ✅ Done       | Pixel-perfect, animated screens with spacing fidelity |
| Barcode Scanning          | ✅ Done       | ZXing engine (EAN/UPC/Code-128, TRY_HARDER), auto-routes to product on detect |
| Upload from Gallery       | ✅ Done       | Decode barcodes from uploaded images |
| Product Details Screen    | ✅ Done       | Safety verdict, recall surface, supply-chain trace |
| Blockchain Verification   | ✅ Done       | On-chain trust screen (contract/tx refs + journey); reads simulated, real read-ready |
| Product Data Lookup       | ✅ Done       | Live product identity from Open Food Facts |
| Government Recall Sync    | ✅ Live        | UPC-keyed lookup against Health Canada / CFIA (`recall_service`), re-validated against the live recall page per scan; mock fallback offline |
| Camera-Denied Recovery    | ✅ Done       | Permission fallback with manual barcode entry |
| PWA Manifest & Offline    | ⏳ Planned    | Service Worker and Add-to-Home functionality |
| Authentication            | ⏳ Planned    | Google OAuth for advanced access |
| View Scan History         | ✅ Done       | localStorage-backed history drawer |
| Mobile-Only Support       | ✅ Done       | Phone/tablet only; desktop shows an "open on your phone" gate |
| iOS Safe Area Support     | ✅ Done       | Env-aware spacing (notch/footer/home indicator) |

---

## 🧠 Tech Stack

| Layer      | Technology                      |
|------------|---------------------------------|
| Framework  | React + Vite + TypeScript       |
| UI Kit     | Chakra UI (Infused with *TruKit)|
| Animation  | Framer Motion                   |
| Styling    | CSS Variables + Design Tokens   |
| Fonts      | SF Pro Display, SF Pro          |
| Routing    | React Router DOM                |
| Chain      | Polygon (Amoy) registry contract|
| Product DB | Open Food Facts API             |
| Recalls    | Mock (CFIA/Health Canada target)|
| Auth       | Google OAuth (planned)          |
| UI/UX      | Figma - Notion - Ps             |

---

## 🧠 Onboarding Psychology & Cognitive Impact

The onboarding flow in **TruMark** isn't just a UI layer — it's a **frictionless behavioral funnel** designed to prime trust, reduce cognitive load, and influence user expectations using applied UX psychology principles.

### 🔍 Goals of the Onboarding Experience

| Objective                  | Approach                                                                 |
|---------------------------|--------------------------------------------------------------------------|
| Build User Trust          | Display verified blockchain + scanner visuals immediately                |
| Reduce Cognitive Load     | 3-step limit, single CTA, progressive disclosure of key features         |
| Establish Mental Model    | “Scan → Verify → Trust” narrative supported by imagery and spacing       |
| Encourage Action          | High-contrast buttons, minimal text, next-step momentum via CTA clarity  |
| Emotional Framing         | Calm blue, safe yellow, secure purple to associate colors with emotion   |

---

### 🧩 UX Psychology Techniques Used

| Technique                   | How It’s Applied |
|-----------------------------|------------------|
| **Hick’s Law**              | Only one decision per screen (Next / Let's Go) |
| **Serial Position Effect**  | Blockchain (most important info) shown last for memorability |
| **Progressive Disclosure**  | Details revealed step-by-step, not all at once |
| **Color Psychology**        | Blue = trust, Yellow = alert-readiness, Purple = security |
| **Fitts’s Law**             | Large CTA buttons at thumb-friendly zones |
| **Recognition > Recall**    | Uses visuals (scan, chain icon, etc.) to reduce memory burden |
| **Safe Defaults**           | No user input needed; flow guides itself |

---

### 🤝 Trust-First Design Principles

- **Transparency before interaction**: Users see that their data is not requested before trust is built.
- **Emotional consistency**: All screens respect a consistent tone, avoiding anxiety-inducing interfaces.
- **Minimalism with intention**: Space isn’t empty — it’s *rest space* to avoid decision fatigue.

> 🧬 **Outcome**: In under 9 seconds, users move from *"What is this?"* to *"Okay, I trust this app to scan my food safely."*

---

## 📷 Scanner Module (Tech)

| Component       | Tech Used         |
|------------------|-------------------|
| Camera API       | `navigator.mediaDevices.getUserMedia()` |
| Barcode Decoding | `QuaggaJS` with custom scan area and red-line overlay |
| Flashlight Torch | MediaTrack `applyConstraints()` w/ `torch` constraint |
| Upload & Decode  | `FileReader` + Quagga decodeSingle |
| Canvas Patch     | Using native canvas (`willReadFrequently`) patch advisory for performance |

> 📌 **Note**: On iOS Safari, torch functionality depends on native support and is polyfilled via `ImageCapture`.

---

## 💎 UI Fidelity
- ✅ 393×852 layout base (iPhone 15 size)
- ✅ Button size: 168×53 px, border-radius 36px, iOS shadow
- ✅ Spacing between elements:
- Status bar → Progress bar: 64px
- Progress bar → Title: 32px
- Title → Image: 24px
- Image → Description: 64px
- Description → Button: 64px
- Button → Bottom: max(104px, env(safe-area-inset-bottom))

---

## 🧱 Architecture (current build)

TruMark is a **scan → verify → trust** flow over three layers:

| Layer | What it does | Where |
|-------|--------------|-------|
| **Product identity** | Resolves a barcode to a real product | `src/lib/openFoodFacts.ts` (Open Food Facts) |
| **Safety** | Active recalls for that product | `src/lib/recalls.ts` → `recall_service` (Health Canada / CFIA, UPC-keyed) |
| **Provenance** | On-chain supply-chain record | `src/lib/chain.ts` → `blockchain_service` → `TruMark.sol` registry |

`src/lib/report.ts` fans these out in parallel and computes a single **verdict**
(`safe` / `caution` / `recalled`) that drives all status color in the UI.

**Smart contract** — `TruMark.sol` is now a **single long-lived registry** keyed
by UPC (`registerProduct` / `getProduct` / `isRegistered`), not a
one-contract-per-product deployment. Writes are owner-gated; reads are public.

**Routes** — `/` onboarding · `/scanner` · `/product/:upc` · `/verification/:upc`
(result screens are deep-linkable by barcode).

**Design system** — TruKit lives in `src/theme.ts` as semantic tokens (status
colors, spacing, radii, elevation) plus component recipes. Screens consume
tokens, never raw hex.

**Recall module** — `recall_service` wraps Health Canada/CFIA: it builds a UPC →
recall index (open-data list + parsing the UPC table off each public recall
page, since the gov API has no UPC index) and serves
`GET /api/v1/recalls?upc=&weeks=`. See [recall_service/README.md](recall_service/README.md).

### Environment

- **Frontend** (`trumark-frontend/.env.example`): `VITE_CHAIN_API_URL`,
  `VITE_SIMULATE_CHAIN` (defaults to simulation — safe for demos),
  `VITE_RECALL_API_URL` (recall service; mock fallback when unset).
- **Service** (`blockchain_service`): `SIMULATE` (defaults ON; only `"false"`
  goes live), `CONTRACT_ADDRESS`, `ALCHEMY_API_URL`, `PRIVATE_KEY`, optional
  `REGISTER_API_KEY` to gate the register endpoint.

### Demo recall UPCs

Scan or hand-enter these to exercise the safety states:
`0000000000017` (high-severity recall) · `0000000000024` (allergen recall) ·
`0000000000031` (unverified on-chain → caution).

---

## 🔄 Contract Verification
After deploying the `TruMark` registry, verify the source on your target
network using Hardhat:

```bash
npm run verify -- <deployed-contract-address>
```

This executes `npx hardhat verify` and publishes the contract to the configured
block explorer.

Before running Hardhat tasks, create a `.env` file with your RPC endpoints and
API keys:

```bash
cp .env.example .env
# then fill in SEPOLIA_URL, AMOY_URL, PRIVATE_KEY and explorer API keys
```

## 🧑‍🎨 Credits
- 👨‍💻 Development: Kiarash Kia + Upayan Chatterjee + Copilot AI Assistant
- 🎨 UI/UX Design: Kiarash Kia
- 🔗 Blockchain: Polygon Smart Contract Layer
---
## 🙌 Final Note
This MVP is the foundation of a next-gen trust-based food transparency network. Consumers should know what they consume. This app makes that easy, visual, and verifiable.

---
                                          © 2025 Kiarash Kia. All rights reserved.

As a package, this software and its code, design, and all associated assets are the exclusive intellectual property of **Kiarash Kia** and **Upayan Chatterjee**.

