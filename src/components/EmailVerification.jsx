import { useState, useEffect, useRef } from "react";
import { ShieldCheck, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { useT } from "@/lib/i18n";

const CODE_KEY = (email) => `ev_code_${email}`;
const VERIFIED_KEY = (email) => `email_verified_${email}`;
const EXPIRY_MS = 10 * 60 * 1000;

export default function EmailVerification({ email, sendSignal }) {
  const t = useT();
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [sent, setSent] = useState(false);
  const [verified, setVerified] = useState(() => {
    try { return localStorage.getItem(VERIFIED_KEY(email)) === "1"; } catch { return false; }
  });

  // Reset state when the email changes
  useEffect(() => {
    if (!email) return;
    setVerified(() => { try { return localStorage.getItem(VERIFIED_KEY(email)) === "1"; } catch { return false; } });
    setSent(false);
    setCode("");
  }, [email]);

  // Send a fresh code whenever the parent signals (Save & Send button)
  const lastSignal = useRef(0);
  useEffect(() => {
    if (!sendSignal || !email || sendSignal === lastSignal.current) return;
    lastSignal.current = sendSignal;
    sendCode();
  }, [sendSignal]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!email) return null;

  const sendCode = async () => {
    setSending(true);
    try {
      const gen = String(Math.floor(100000 + Math.random() * 900000));
      localStorage.setItem(CODE_KEY(email), JSON.stringify({ code: gen, exp: Date.now() + EXPIRY_MS }));
      await base44.integrations.Core.SendEmail({
        to: email,
        subject: t.evMailSubject,
        body: t.evMailBody.replace("{code}", gen),
      });
      setSent(true);
      toast.success(t.evSentToast);
    } catch (e) {
      toast.error(t.evSendError);
    } finally {
      setSending(false);
    }
  };

  const verify = async () => {
    setVerifying(true);
    try {
      const raw = localStorage.getItem(CODE_KEY(email));
      if (!raw) { toast.error(t.evSendFirst); return; }
      const entry = JSON.parse(raw);
      if (Date.now() > entry.exp) { toast.error(t.evExpired); return; }
      if (entry.code !== code.trim()) { toast.error(t.evWrongCode); return; }
      localStorage.setItem(VERIFIED_KEY(email), "1");
      localStorage.removeItem(CODE_KEY(email));
      setVerified(true);
      setCode("");
      toast.success(t.evSuccess);
    } catch {
      toast.error(t.evError);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div>
      {verified ? (
        <p className="flex items-center gap-1.5 text-xs text-green-600 font-bold">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {t.evVerified} ✓
        </p>
      ) : sent ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={t.evCodePlaceholder}
              inputMode="numeric"
              className="flex-1 tracking-widest text-center"
            />
            <Button onClick={verify} disabled={verifying || !code.trim()} className="gap-2 shrink-0 rounded-[4px_20px_4px_20px]">
              {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              {t.evVerify}
            </Button>
          </div>
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>{t.evCheckSpam}</span>
            <button onClick={sendCode} disabled={sending} className="text-primary hover:underline font-bold shrink-0">
              {sending ? "…" : t.evResend}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}