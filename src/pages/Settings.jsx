import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { User, Bell, Moon, Sun, Globe, LogOut, Save, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useT, TRANSLATIONS } from "@/lib/i18n";
import { setThemeMode, getThemeState, subscribeToTheme } from "@/lib/themeEngine";

const ls = {
  get: (k, fb = "") => {try {return localStorage.getItem(k) || fb;} catch (e) {return fb;}},
  set: (k, v) => {try {localStorage.setItem(k, v);} catch (e) {}}
};

export default function Settings() {
  const t = useT();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [darkMode, setDarkMode] = useState(() => getThemeState().isDark);
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState("العربية");
  const [fullName, setFullName] = useState("");
  const [appLang, setAppLang] = useState(() => ls.get("dev_app_lang", "ar"));

  useEffect(() => {
    loadUser();
    const unsub = subscribeToTheme(({ isDark }) => setDarkMode(isDark));
    return unsub;
  }, []);

  const loadUser = async () => {
    const u = await base44.auth.me().catch(() => null);
    setUser(u);
    if (u) {
      setFullName(u.full_name || "");
      setNotifications(u.notifications_enabled ?? true);
      setLanguage(u.preferred_language || "العربية");
    }
    setLoading(false);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    await base44.auth.updateMe({ full_name: fullName });
    toast.success(t.saveChanges + " ✓");
    setSaving(false);
  };

  const handleToggleDark = (val) => {
    setDarkMode(val);
    setThemeMode(val ? "dark" : "light");
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    await base44.auth.updateMe({ notifications_enabled: notifications, preferred_language: language });
    toast.success(t.savePreferences + " ✓");
    setSaving(false);
  };

  const handleSaveAppLang = () => {
    ls.set("dev_app_lang", appLang);
    window.dispatchEvent(new Event("app-lang-change"));
    toast.success(t.applyLang + " ✓");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>);

  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">{t.settings}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t.settingsSub}</p>
      </div>

      <div className="space-y-6">
        {/* Profile */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-base font-bold">{t.profile}</h2>
          </div>
          <div className="space-y-4">
            <div>
              <Label>{t.fullName}</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>{t.email}</Label>
              <Input value={user?.email || ""} disabled className="mt-1.5 opacity-60" />
            </div>
            <Button onClick={handleSaveProfile} disabled={saving} className="gap-2 rounded-xl">
              <Save className="w-4 h-4" /> {t.saveChanges}
            </Button>
          </div>
        </motion.div>

        {/* Appearance */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sun className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-base font-bold">{t.appearance}</h2>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{t.darkMode}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t.darkModeSub}</p>
            </div>
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-muted-foreground" />
              <Switch checked={darkMode} onCheckedChange={handleToggleDark} />
              <Moon className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </motion.div>

        {/* Preferences */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Globe className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-base font-bold">{t.preferences}</h2>
          </div>
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t.notifications}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t.notificationsSub}</p>
              </div>
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-muted-foreground" />
                <Switch checked={notifications} onCheckedChange={setNotifications} />
              </div>
            </div>
            <div>
              <Label>{t.preferredLang}</Label>
              <p className="text-xs text-muted-foreground mt-0.5 mb-1.5">{t.preferredLangSub}</p>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="الكل">الكل</SelectItem>
                  <SelectItem value="العربية">العربية</SelectItem>
                  <SelectItem value="الإنجليزية">الإنجليزية</SelectItem>
                  <SelectItem value="الفرنسية">الفرنسية</SelectItem>
                  <SelectItem value="الأوردو">الأوردو</SelectItem>
                  <SelectItem value="الهندية">الهندية</SelectItem>
                  <SelectItem value="التركية">التركية</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSavePreferences} disabled={saving} className="gap-2 rounded-xl">
              <Save className="w-4 h-4" /> {t.savePreferences}
            </Button>
          </div>
        </motion.div>

        {/* App Language */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }} className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Languages className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold">{t.appLangTitle}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{t.appLangSub}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {[
            { code: "ar", name: "العربية" },
            { code: "en", name: "English" },
            { code: "fr", name: "Français" },
            { code: "ur", name: "اردو" },
            { code: "hi", name: "हिंदी" },
            { code: "tr", name: "Türkçe" }].
            map(({ code, name }) =>
            <label key={code} className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${appLang === code ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                <input type="radio" name="appLang" value={code} checked={appLang === code} onChange={() => setAppLang(code)} className="hidden" />
                <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${appLang === code ? "border-primary bg-primary" : "border-border"}`} />
                <span className="text-sm font-medium">{name}</span>
              </label>
            )}
          </div>
          <Button onClick={handleSaveAppLang} className="gap-2 rounded-xl w-full">
            <Save className="w-4 h-4" /> {t.applyLang}
          </Button>
        </motion.div>

        {/* Logout */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }} className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center">
              <LogOut className="w-4 h-4 text-destructive" />
            </div>
            <h2 className="text-base font-bold">{t.logout}</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">{t.logoutSub}</p>
          <Button variant="destructive" onClick={() => base44.auth.logout()} className="gap-2 rounded-xl">
            <LogOut className="w-4 h-4" /> {t.logout}
          </Button>
        </motion.div>
      </div>
    </div>);

}