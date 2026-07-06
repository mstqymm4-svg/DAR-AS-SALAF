import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Already installed?
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (localStorage.getItem("pwa_install_dismissed") === "true") return;

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
    if (outcome === "dismissed") {
      localStorage.setItem("pwa_install_dismissed", "true");
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem("pwa_install_dismissed", "true");
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md"
        >
          <div className="bg-card border border-border rounded-2xl shadow-2xl p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Download className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold">ثبّت التطبيق على جوالك</p>
              <p className="text-xs text-muted-foreground">للوصول السريع والاستخدام دون اتصال</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleInstall}
                className="bg-primary text-primary-foreground text-xs font-bold px-4 py-2 rounded-xl hover:bg-primary/90 active:scale-95 transition-all"
              >
                تثبيت
              </button>
              <button
                onClick={handleDismiss}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}