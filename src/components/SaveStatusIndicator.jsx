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

  return null;










}