/* =============================================================================
   UpdatePrompt.tsx — surfaces the service worker lifecycle to the user:
   a banner offering to reload when a new version is waiting (registerType
   "prompt"), and a brief toast once the app is cached for offline use.
   ============================================================================= */

import { useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { useI18n } from "../i18n/useI18n";
import { useToast } from "./Toast";

export function UpdatePrompt() {
  const { t } = useI18n();
  const toast = useToast();

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  useEffect(() => {
    if (offlineReady) {
      toast(t.pwa.offlineReady);
      setOfflineReady(false);
    }
  }, [offlineReady, setOfflineReady, toast, t]);

  if (!needRefresh) return null;

  return (
    <div className="pwa-banner" role="status" aria-live="polite">
      <span>{t.pwa.updateAvailable}</span>
      <button className="btn primary" onClick={() => updateServiceWorker(true)}>
        {t.pwa.update}
      </button>
      <button className="btn ghost" onClick={() => setNeedRefresh(false)}>
        {t.pwa.dismiss}
      </button>
    </div>
  );
}
