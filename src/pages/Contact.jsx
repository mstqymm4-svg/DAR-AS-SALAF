import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, MessageCircle, Send } from "lucide-react";
import { WhatsAppIcon } from "@/components/BrandIcons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import { getSetting } from "@/lib/settingsStore";

export default function Contact() {
  const t = useT();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const contactEmail = getSetting("contact_email") || "support@example.com";
  const whatsappUrl = getSetting("whatsapp_url") || "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error(t.contactFillAll);
      return;
    }
    setSending(true);
    try {
      const { base44 } = await import("@/api/base44Client");
      await base44.integrations.Core.SendEmail({
        to: contactEmail,
        subject: `${name} — ${email}`,
        body: message,
      });
      toast.success(t.contactSent);
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      toast.error(t.contactSendError);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t.contactTitle}</h1>
        </div>

        <p className="text-muted-foreground text-sm leading-relaxed mb-8">
          {t.contactIntro}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <a
            href={`mailto:${contactEmail}`}
            className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border hover:border-primary/40 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{t.contactEmailLabel}</p>
              <p className="text-sm font-medium text-foreground truncate">{contactEmail}</p>
            </div>
          </a>

          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border hover:border-primary/40 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                <WhatsAppIcon className="w-5 h-5 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{t.whatsappLabel}</p>
                <p className="text-sm font-medium text-foreground">{t.directContact}</p>
              </div>
            </a>
          )}
        </div>

        {/* Contact form */}
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">{t.contactName}</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.contactNamePlaceholder}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">{t.contactEmailLabel}</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">{t.contactMessage}</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t.contactMessagePlaceholder}
              rows={5}
              className="w-full resize-none"
            />
          </div>
          <Button type="submit" disabled={sending} className="w-full sm:w-auto">
            {sending ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                {t.sending}
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                {t.sendMessage}
              </>
            )}
          </Button>
        </form>

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground">{t.contactReplySoon}</p>
          <Link to="/" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
            {t.backToHome}
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}