import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Camera, Heart, Download, BookOpen, Loader2, Save, Activity, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import EmailVerification from "@/components/EmailVerification";
import SmartImage from "@/components/SmartImage";
import { useT } from "@/lib/i18n";
import { toast } from "sonner";
import { getAccountEmail, setAccountEmail, getDownloadedBookIds, getAvatarUrl, setAvatarUrl, getWatchedVideoIds } from "@/lib/activeUser";
import { getFavoriteIds, getBook } from "@/lib/offlineSync";

const initials = (name, email) => {
  const src = (name || email || "").trim();
  return src ? src[0].toUpperCase() : "•";
};

export default function ProfileCard() {
  const t = useT();
  const fileRef = useRef(null);
  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [avatar, setAvatar] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sendSignal, setSendSignal] = useState(0);
  const [stats, setStats] = useState({ favs: 0, dls: 0, reading: 0, watched: 0 });
  const [recentReads, setRecentReads] = useState([]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const u = await base44.auth.me().catch(() => null);
    setUser(u);
    if (u) {
      setFullName(u.full_name || "");
      const em = getAccountEmail(u);
      setEmailInput(em);
      setAvatar(getAvatarUrl(em));
      refreshStats(em);
      loadRecentReads();
    }
  };

  const refreshStats = async (email) => {
    const favs = await getFavoriteIds(email).catch(() => []);
    let reading = 0;
    try {
      reading = Object.keys(localStorage).filter((k) => k.startsWith("lastpage_")).length;
    } catch {}
    setStats({ favs: favs.length, dls: getDownloadedBookIds(email).length, reading, watched: getWatchedVideoIds(email).length });
  };

  const loadRecentReads = async () => {
    try {
      const entries = Object.keys(localStorage).
      filter((k) => k.startsWith("lastpage_")).
      map((k) => {
        const id = k.slice("lastpage_".length);
        return {
          id,
          page: Number(localStorage.getItem(k)) || 1,
          ts: Number(localStorage.getItem(`lastts_${id}`)) || 0
        };
      }).
      sort((a, b) => b.ts - a.ts).
      slice(0, 3);
      const books = await Promise.all(entries.map((e) => getBook(e.id).catch(() => null)));
      setRecentReads(
        entries.
        map((e, i) => ({ ...e, book: books[i] })).
        filter((r) => r.book)
      );
    } catch {}
  };

  const handleAvatarPick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const em = getAccountEmail(user) || emailInput.trim();
      setAvatarUrl(em, file_url);
      setAvatar(file_url);
      window.dispatchEvent(new Event("dau-avatar-change"));
      toast.success(t.changePhoto + " ✓");
    } catch (err) {
      toast.error(t.uploadFailed);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    const em = emailInput.trim();
    if (!em || !/^\S+@\S+\.\S+$/.test(em)) {
      toast.error(t.evInvalidEmail);
      return;
    }
    setSaving(true);
    try {
      await base44.auth.updateMe({ full_name: fullName });
      const prev = getAccountEmail(user);
      if (prev && prev !== em) {
        // carry the avatar over to the new account email
        const av = getAvatarUrl(prev);
        if (av) setAvatarUrl(em, av);
      }
      setAccountEmail(em);
      setEmailInput(em);
      setSendSignal(Date.now()); // sends the verification code email right away
      await refreshStats(em);
      toast.success(t.saveChanges + " ✓");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-card border border-border rounded-2xl overflow-hidden">
      
      {/* Banner */}
      <div className="h-24 bg-gradient-to-l from-primary/30 via-primary/10 to-accent/15 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_80%_20%,hsl(var(--accent)/0.4),transparent_60%)]" />
        <div className="absolute -bottom-8 -start-8 w-32 h-32 rounded-full bg-primary/10" />
        <div className="absolute top-3 end-10 w-14 h-14 rounded-full border-[3px] border-foreground/10" />
        <div className="absolute top-6 start-16 w-2 h-2 rounded-full bg-accent/50" />
        <div className="absolute bottom-4 end-1/3 w-1.5 h-1.5 rounded-full bg-primary/30" />
      </div>

      {/* Avatar + identity */}
      <div className="px-6 -mt-10">
        <div className="flex items-end justify-between">
          <div className="relative">
            <div className="w-20 h-20 rounded-full ring-4 ring-card bg-primary/10 overflow-hidden flex items-center justify-center shadow-lg">
              {avatar ?
              <img src={avatar} alt={t.profile} className="w-full h-full object-cover" /> :

              <span className="text-2xl font-black text-primary">{initials(fullName, emailInput)}</span>
              }
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarPick} />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              title={t.changePhoto}
              className="absolute bottom-0 -end-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-60">
              
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            </button>
          </div>
          <div className="pb-1 text-end">
            <p className="font-bold text-foreground truncate max-w-[180px] mt-5">{fullName || t.profile}</p>
            <p className="text-xs text-muted-foreground truncate max-w-[180px]">{emailInput}</p>
          </div>
        </div>
      </div>

      {/* Fields */}
      <div className="px-6 pt-5 space-y-4">
        <div>
          <Label>{t.fullName}</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1.5" />
        </div>
        <div>
          <Label>{t.email}</Label>
          <Input value={emailInput} onChange={(e) => setEmailInput(e.target.value)} type="email" inputMode="email" className="mt-1.5" />
          <p className="text-xs text-muted-foreground mt-1">{t.accHint}</p>
        </div>
        <Button onClick={handleSaveProfile} disabled={saving} className="gap-2 rounded-[4px_20px_4px_20px]">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {t.saveSendBtn}
        </Button>

        {/* Email verification — inline, code sent immediately on save */}
        <EmailVerification email={emailInput} sendSignal={sendSignal} />
      </div>

      {/* Stats */}
      <div className="px-6 pt-5">
        <h3 className="flex items-center gap-2 text-sm font-bold text-foreground mb-3">
          <Activity className="w-4 h-4 text-primary" /> {t.myActivity}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <StatChip icon={<Heart className="w-4 h-4" />} value={stats.favs} label={t.accFavorites} tone="accent" />
          <StatChip icon={<Download className="w-4 h-4" />} value={stats.dls} label={t.accOfflineBooks} tone="primary" />
          <StatChip icon={<BookOpen className="w-4 h-4" />} value={stats.reading} label={t.booksRead} tone="success" />
          <StatChip icon={<Eye className="w-4 h-4" />} value={stats.watched} label={t.watchedVideos} tone="muted" />
        </div>
      </div>

      {/* Recent reads */}
      {recentReads.length > 0 &&
      <div className="px-6 pt-5 pb-6">
          <h3 className="flex items-center gap-2 text-sm font-bold text-foreground mb-3">
            <BookOpen className="w-4 h-4 text-primary" /> {t.lastRead}
          </h3>
          <div className="space-y-2">
            {recentReads.map((r) => {
            const pct = r.book.pages_count ?
            Math.min(100, Math.round(r.page / r.book.pages_count * 100)) :
            null;
            return (
              <Link
                key={r.id}
                to={`/read/${r.id}`}
                className="flex items-center gap-3 p-2.5 rounded-xl border border-border hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 hover:-translate-y-0.5 transition-all bg-background/50">
                
                  <div className="w-11 h-14 rounded-lg overflow-hidden bg-muted shrink-0">
                    {r.book.cover_image ?
                  <SmartImage
                    src={r.book.cover_image}
                    alt={r.book.title}
                    className="w-full h-full object-cover"
                    fallback={() => <BookOpen className="w-5 h-5 text-muted-foreground" />} /> :


                  <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-muted-foreground/40" />
                      </div>
                  }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{r.book.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t.pageNo} {r.page}{pct !== null ? ` · ${pct}%` : ""}
                    </p>
                    <div className="h-1 rounded-full bg-muted mt-1.5 overflow-hidden">
                      <div className="h-full bg-primary/70 rounded-full" style={{ width: `${pct ?? Math.min(100, r.page)}%` }} />
                    </div>
                  </div>
                </Link>);

          })}
          </div>
        </div>
      }
      {recentReads.length === 0 && <div className="pb-6" />}
    </motion.div>);

}

function StatChip({ icon, value, label, tone }) {
  const tones = {
    accent: "text-accent bg-accent/10 border-accent/20",
    primary: "text-primary bg-primary/10 border-primary/20",
    success: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    muted: "text-foreground bg-muted border-border"
  };
  return (
    <div className={`rounded-2xl border p-3 flex flex-col items-center gap-1 ${tones[tone] || tones.muted}`}>
      <div className="w-8 h-8 rounded-full bg-card/70 flex items-center justify-center">{icon}</div>
      <span className="text-xl font-black leading-none">{value}</span>
      <span className="text-[10px] font-medium text-muted-foreground text-center leading-tight">{label}</span>
    </div>);

}