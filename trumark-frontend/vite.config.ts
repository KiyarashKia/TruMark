import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";

// Where the recall service runs. The Vite dev server reaches it server-side, so
// it stays plain HTTP on the PC — the phone never talks to it directly.
const RECALL_TARGET = "http://127.0.0.1:3002";

export default defineConfig({
  plugins: [
    react(),
    // Self-signed HTTPS. Required so the phone camera works — browsers only
    // allow getUserMedia on https:// or localhost, never on a plain http LAN IP.
    basicSsl(),
  ],
  server: {
    // Listen on all interfaces so a phone on the same Wi-Fi can load the app.
    host: true,
    proxy: {
      // The app calls /recall-api/* (same-origin, HTTPS). Vite forwards those
      // to the recall service over HTTP server-side. This avoids:
      //   - mixed content (an HTTPS page can't fetch HTTP directly)
      //   - CORS (same-origin from the browser's view)
      //   - needing the phone to reach port 3002 / firewall rules
      "/recall-api": {
        target: RECALL_TARGET,
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/recall-api/, ""),
      },
    },
  },
});
