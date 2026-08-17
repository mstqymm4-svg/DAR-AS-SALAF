import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Check, Cloud, CloudOff } from "lucide-react";
import { onContentChange, getSyncStatus } from "@/lib/contentSyncEngine";

/**
 * SyncStatusBadge — Shows a subtle sync indicator in the corner.
 * - Spinning icon while syncing
 * - Green check briefly when sync completes with changes
 * - Gray cloud when idle/online
 * - Gray cloud-off when offline
 * Auto-hides after a few seconds when idle.
 */
export default function SyncStatusBadge() {
  const [status, setStatus] = useState(getSyncStatus());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const unsub = onContentChange((event) => {
      if (event.type === "status") setStatus(event.status);
      if (event.type === "sync_complete") {
        const r = event.result;
        const hasChanges = r && Object.values(r).some(
          (v) => v && !v.error && (v.new > 0 || v.updated > 0 || v.deleted > 0)
        );
        if (hasChanges) {
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 3000);
        }
      }
    });

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      unsub();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Don't show when idle and no recent activity
  if (!status.isSyncing && !showSuccess && !status.error) {
    // Show offline indicator only
    if (!isOnline) {
      return (
        <div className="fixed bottom-20 lg:bottom-4 left-4 z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/90 backdrop-blur-sm border border-border shadow-sm text-xs text-muted-foreground">
          <CloudOff className="w-3 h-3" />
          <span>وضع عدم الاتصال</span>
        </div>);

    }
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 10 }}
        className="fixed bottom-20 lg:bottom-4 left-4 z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/95 backdrop-blur-sm border border-border shadow-lg text-xs font-medium hidden">
        
        {status.isSyncing ?
        <>
            <RefreshCw className="w-3 h-3 animate-spin text-primary" />
            <span className="text-foreground">جارٍ تحديث المحتوى…</span>
          </> :
        showSuccess ?
        <>
            <Check className="w-3 h-3 text-green-500" />
            <span className="text-foreground">تم تحديث المحتوى</span>
          </> :
        null}
      </motion.div>
    </AnimatePresence>);

}