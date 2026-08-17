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
      
















      
    </AnimatePresence>);

}