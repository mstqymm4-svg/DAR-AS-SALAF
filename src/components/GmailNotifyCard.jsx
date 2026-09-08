import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Mail, Send, Link2, Unlink, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { toast } from "sonner";

const CONNECTOR_ID = "6a9f8551f9be8820e93e9e05";

/**
 * Gmail notifications card — each user connects their own Gmail account;
 * admins can then send a library update email to all app users.
 */
export default function GmailNotifyCard() {
  const [authed, setAuthed] = useState(false);
  const [user, setUser] = useState(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [subject, setSubject] = useState("كتاب جديد في المكتبة");
  const [body, setBody] = useState("");

  const checkConnection = async () => {
    try {
      await base44.functions.invoke("gmailNotify", { action: "status" });
      setConnected(true);
    } catch {
      setConnected(false);
    }
  };

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (ok) => {
      if (ok) {
        setAuthed(true);
        setUser(await base44.auth.me().catch(() => null));
        await checkConnection();
      }
      setLoading(false);
    });
  }, []);

  const handleConnect = async () => {
    const url = await base44.connectors.connectAppUser(CONNECTOR_ID);
    const popup = window.open(url, "_blank");
    const timer = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(timer);
        checkConnection();
      }
    }, 500);
  };

  const handleDisconnect = async () => {
    await base44.connectors.disconnectAppUser(CONNECTOR_ID);
    setConnected(false);
  };

  const handleSend = async () => {
    setSending(true);
    try {
      const res = await base44.functions.invoke("gmailNotify", { action: "send", subject, body });
      toast.success(`تم إرسال ${res.data.sent} من ${res.data.total} رسالة`);
      setBody("");
    } catch (e) {
      toast.error("فشل الإرسال");
    }
    setSending(false);
  };

  if (loading) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.22 }} className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Mail className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h2 className="text-base font-bold">إشعارات Gmail</h2>
          <p className="text-xs text-muted-foreground mt-0.5">اربط حساب Gmail الخاص بك لإرسال إشعارات المكتبة</p>
        </div>
      </div>

      {!authed ? (
        <Button onClick={() => base44.auth.redirectToLogin()} className="rounded-[4px_20px_4px_20px]">تسجيل الدخول</Button>
      ) : !connected ? (
        <Button onClick={handleConnect} className="gap-2 rounded-[4px_20px_4px_20px]">
          <Link2 className="w-4 h-4" /> ربط حساب Gmail
        </Button>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sm text-primary font-medium">
              <CheckCircle2 className="w-4 h-4" /> الحساب مرتبط
            </span>
            <Button variant="outline" size="sm" onClick={handleDisconnect} className="gap-2 rounded-[4px_20px_4px_20px]">
              <Unlink className="w-4 h-4" /> فصل
            </Button>
          </div>

          {user?.role === "admin" && (
            <div className="space-y-3 pt-2 border-t border-border">
              <div>
                <Label>عنوان الرسالة</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label>نص الرسالة</Label>
                <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} className="mt-1.5" placeholder="أضفنا كتابًا جديدًا إلى المكتبة..." />
              </div>
              <Button onClick={handleSend} disabled={sending || !body.trim()} className="gap-2 rounded-[4px_20px_4px_20px]">
                <Send className="w-4 h-4" /> إرسال لجميع المستخدمين
              </Button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}