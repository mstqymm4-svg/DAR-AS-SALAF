import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CloudUpload, Loader2, RefreshCw, CloudOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useT } from "@/lib/i18n";
import { toast } from "sonner";
import { pushAccountData, getLastSyncAt } from "@/lib/accountSync";

/**
 * Settings card for the per-email cloud backup: shows the last backup time
 * and lets the user push their account data to the cloud right away.
 */
export default function AccountSyncCard() {
  const t = useT();
  const [user, setUser] = useState(null);
  const [busy, setBusy] = useState(false);
  const [lastAt, setLastAt] = useState(getLastSyncAt());

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const handleSync = async () => {
    if (!user) return;
    setBusy(true);
    const ok = await pushAccountData(user);
    setBusy(false);
    setLastAt(getLastSyncAt());
    if (ok) toast.success(t.syncOk);
    else toast.error(t.syncFail);
  };

  const timeLabel = lastAt ? new Date(lastAt).toLocaleString() : "—";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden"
    >
      <div className="absolute top-0 bottom-0 -end-16 w-48 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <CloudUpload className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h2 className="text-base font-bold">{t.syncTitle}</h2>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-4">{t.syncSub}</p>
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={handleSync} disabled={!user || busy} className="gap-2 rounded-[4px_20px_4px_20px]">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {t.syncNowBtn}
        </Button>
        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
          {lastAt ? <CloudUpload className="w-3.5 h-3.5 text-primary/60" /> : <CloudOff className="w-3.5 h-3.5" />}
          {t.syncLastAt}: <span className="font-medium">{timeLabel}</span>
        </span>
      </div>
    </motion.div>
  );
}