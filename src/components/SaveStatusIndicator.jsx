import { useState, useEffect } from "react";
import { Check, Loader2, AlertCircle } from "lucide-react";
import { onSaveStatus } from "@/lib/settingsStore";

export default function SaveStatusIndicator() {
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    const unsub = onSaveStatus(setStatus);
    return unsub;
  }, []);

  if (status === "idle") return null;

  return (
    <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[999] flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold shadow-lg transition-all duration-300 ${
      status === "saving" ? "bg-primary text-primary-foreground" :
      status === "saved"  ? "bg-green-600 text-white" :
      status === "error"  ? "bg-destructive text-destructive-foreground" : ""
    }`}>
      {status === "saving" && <><Loader2 className="w-3.5 h-3.5 animate-spin" /> جاري الحفظ...</>}
      {status === "saved"  && <><Check   className="w-3.5 h-3.5" /> تم الحفظ ✓</>}
      {status === "error"  && <><AlertCircle className="w-3.5 h-3.5" /> خطأ في الحفظ</>}
    </div>
  );
}