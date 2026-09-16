import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import pkg from "./package.json";

// Single source of truth for the app version: read it from package.json and
// expose it to the client as the compile-time constant __APP_VERSION__ (see
// src/vite-env.d.ts). Lets the UI show which build is live after a deploy.

// base: "./" keeps built asset paths relative, so dist/ can be served from any
// subfolder (GitHub Pages, Netlify, a plain static host) without extra config.
export default defineConfig({
  base: "./",
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
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
      includeAssets: ["favicon.svg", "apple-touch-icon.png", "icon-192.png", "icon-512.png"],
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,woff2}"],
      },
      manifest: {
        name: "SkinLog",
        short_name: "SkinLog",
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
