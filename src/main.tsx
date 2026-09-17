import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { initSync } from "./sync";
// Self-hosted Hanken Grotesk (latin subset only) so the app has zero network
// calls and works fully offline. The service worker precaches the .woff2 files.
import "@fontsource/hanken-grotesk/latin-400.css";
import "@fontsource/hanken-grotesk/latin-500.css";
import "@fontsource/hanken-grotesk/latin-600.css";
import "@fontsource/hanken-grotesk/latin-700.css";
import "@fontsource/hanken-grotesk/latin-800.css";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Resume cloud sync if the user previously opted in. No-op (and no Firebase SDK
// load) when sync is unconfigured or the user never signed in.
void initSync();
