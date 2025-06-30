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
| Barcode Scanning          | ✅ Done       | Live mobile scanning with red scan line + flashlight toggle |
| Upload from Gallery       | ✅ Done       | Decode barcodes from uploaded images (drag/drop or select) |
| Blockchain Verification   | ✅ Done       | Polygon contract read for verification |
| Government Recall Sync    | ⏳ Planned    | Will pull from Canada Health database |
| PWA Manifest & Offline    | ⏳ Planned    | Service Worker and Add-to-Home functionality |
| Authentication            | ⏳ In Progress| Google OAuth for advanced access |
| View Scan History         | ✅ Done       | Locally tracked codes for UX |
| Mobile-Only Support       | ✅ Done       | Fully restricted to phones/tablets, scroll/zoom lock |
| iOS Safe Area Support     | ✅ Done       | Env-aware spacing below elements (notch/footer) |

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
| Chain      | Polygon Blockchain              |
| Auth       | Google OAuth                    |
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

## 🔄 Contract Verification
After deploying the `TruMark` smart contract, verify the source on your target
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

