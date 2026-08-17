import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { User, Bell, Moon, Sun, Globe, LogOut, Save, Languages, Info, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MobileSelect } from "@/components/ui/mobile-select";
import SettingRow from "@/components/SettingRow";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import MobileHeader from "@/components/MobileHeader";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useT, TRANSLATIONS } from "@/lib/i18n";
import { setThemeMode, getThemeState, subscribeToTheme } from "@/lib/themeEngine";
import { PageSpinner } from "@/components/Skeleton";

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

  if (loading) return <PageSpinner />;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <MobileHeader title={t.settings} />
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
            <Button onClick={handleSaveProfile} disabled={saving} className="gap-2 rounded-[4px_20px_4px_20px]">
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
          <SettingRow
            title={t.darkMode}
            description={t.darkModeSub}
            control={
            <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-muted-foreground" />
                <Switch checked={darkMode} onCheckedChange={handleToggleDark} />
                <Moon className="w-4 h-4 text-muted-foreground" />
              </div>
            } />
          
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
            <SettingRow
              icon={<Bell className="w-4 h-4" />}
              title={t.notifications}
              description={t.notificationsSub}
              control={<Switch checked={notifications} onCheckedChange={setNotifications} />} />
            
            <div>
              <Label>{t.preferredLang}</Label>
              <p className="text-xs text-muted-foreground mt-0.5 mb-1.5">{t.preferredLangSub}</p>
              <MobileSelect
                value={language}
                onValueChange={setLanguage}
                placeholder={t.preferredLangPlaceholder}
                triggerClassName="mt-1.5"
                options={[
                { value: "الكل", label: "الكل" },
                { value: "العربية", label: "العربية" },
                { value: "الإنجليزية", label: "الإنجليزية" },
                { value: "الفرنسية", label: "الفرنسية" },
                { value: "الأوردو", label: "الأوردو" },
                { value: "الهندية", label: "الهندية" },
                { value: "التركية", label: "التركية" }]
                } />
              
            </div>
            <Button onClick={handleSavePreferences} disabled={saving} className="gap-2 rounded-[4px_6px_4px_4px]">
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

        {/* About & Contact */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }} className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Info className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-base font-bold">{t.aboutTitle} & {t.contactTitle}</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">{t.aboutContactSub}</p>
          <div className="grid grid-cols-2 gap-2">
            <Link to="/about" className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary/10 text-primary font-medium text-sm hover:bg-primary/15 transition-colors">
              <Info className="w-4 h-4" /> {t.aboutTitle}
            </Link>
            <Link to="/contact" className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary/10 text-primary font-medium text-sm hover:bg-primary/15 transition-colors">
              <Mail className="w-4 h-4" /> {t.contactTitle}
            </Link>
          </div>
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

        {/* Account Deletion — Play Store policy compliance */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.35 }} className="bg-card border border-destructive/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center">
              <Trash2 className="w-4 h-4 text-destructive" />
            </div>
            <h2 className="text-base font-bold">{t.deleteAccount}</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">{t.deleteAccountSub}</p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2 rounded-xl">
                <Trash2 className="w-4 h-4" /> {t.deleteAccount}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t.deleteAccountConfirm}</AlertDialogTitle>
                <AlertDialogDescription>{t.deleteAccountWarning}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                <AlertDialogAction onClick={() => base44.auth.logout()}>{t.deletePermanently}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </motion.div>
      </div>
    </div>);

}