import { useState, useEffect, useRef } from "react";
import { Mail, ShieldCheck, Send, Loader2, CheckCircle2 } from "lucide-react";
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
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          {verified ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <ShieldCheck className="w-4 h-4 text-primary" />}
        </div>
        <div>
          <h2 className="text-base font-bold">{t.evTitle}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{t.evSub}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 mb-4 text-sm">
        <Mail className="w-4 h-4 text-muted-foreground" />
        <span className="font-medium truncate">{email}</span>
        {verified && <span className="text-green-600 text-xs font-bold mr-auto">{t.evVerified} ✓</span>}
      </div>
      {!verified && (
        <div className="space-y-3">
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
          <Button onClick={sendCode} disabled={sending} variant="outline" className="gap-2 w-full rounded-[4px_20px_4px_20px]">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sent ? t.evResend : t.evSend}
          </Button>
          {sent && <p className="text-xs text-muted-foreground text-center">{t.evCheckSpam}</p>}
        </div>
      )}
    </div>
  );
}