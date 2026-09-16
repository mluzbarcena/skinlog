import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// base: "./" keeps built asset paths relative, so dist/ can be served from any
// subfolder (GitHub Pages, Netlify, a plain static host) without extra config.
export default defineConfig({
  base: "./",
  plugins: [
    react(),
    tailwindcss(),
    // Service worker for true offline use: Workbox precaches the built app shell
    // (JS/CSS/HTML), icons and the self-hosted font, so the app boots with no
    // network. registerType "prompt" surfaces an in-app "new version" banner
    // instead of silently reloading mid-edit. The manifest lives here (single
    // source of truth) — the plugin injects <link rel="manifest"> at build time.
    VitePWA({
      registerType: "prompt",
      includeAssets: ["apple-touch-icon.png", "icon-192.png", "icon-512.png"],
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,woff2}"],
      },
      manifest: {
        name: "Rutina Skincare",
        short_name: "Rutina",
        start_url: "./",
        scope: "./",
        display: "standalone",
        orientation: "portrait",
        background_color: "#f5f7f6",
        theme_color: "#0f7a6e",
        icons: [
          { src: "./icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
          { src: "./icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
    }),
  ],
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
