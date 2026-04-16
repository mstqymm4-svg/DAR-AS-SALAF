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

const ls = {
  get: (k, fb = "") => { try { return localStorage.getItem(k) || fb; } catch(e) { return fb; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch(e) {} },
};

const APP_LANGUAGES = {
  ar: { label: "العربية 🇸🇦", dir: "rtl", strings: { appName:"المكتبة الدينية", appSubtitle:"نور العلم والمعرفة", heroTitle:"اقرأ وتعلّم وتدبّر", heroSub:"اكتشف مجموعة واسعة من الكتب الدينية في مختلف المجالات الإسلامية.", navHome:"الرئيسية", navBooks:"المكتبة", navFav:"المفضلة", navSettings:"الإعدادات", browseLib:"تصفح المكتبة" } },
  en: { label: "English 🇬🇧", dir: "ltr", strings: { appName:"Islamic Library", appSubtitle:"Light of Knowledge", heroTitle:"Read, Learn & Reflect", heroSub:"Discover a wide collection of Islamic books covering all fields of Islamic knowledge.", navHome:"Home", navBooks:"Library", navFav:"Favorites", navSettings:"Settings", browseLib:"Browse Library" } },
  hi: { label: "हिंदी 🇮🇳", dir: "ltr", strings: { appName:"इस्लामी पुस्तकालय", appSubtitle:"ज्ञान का प्रकाश", heroTitle:"पढ़ें, सीखें और विचार करें", heroSub:"इस्लामी ज्ञान के सभी क्षेत्रों पर पुस्तकों का विशाल संग्रह।", navHome:"मुख्य पृष्ठ", navBooks:"पुस्तकालय", navFav:"पसंदीदा", navSettings:"सेटिंग्स", browseLib:"पुस्तकालय देखें" } },
  ur: { label: "اردو 🇵🇰", dir: "rtl", strings: { appName:"اسلامی کتب خانہ", appSubtitle:"علم کی روشنی", heroTitle:"پڑھیں، سیکھیں اور غور کریں", heroSub:"اسلامی علوم کے تمام شعبوں پر کتابوں کا وسیع ذخیرہ۔", navHome:"مرکزی صفحہ", navBooks:"کتب خانہ", navFav:"پسندیدہ", navSettings:"ترتیبات", browseLib:"کتب خانہ دیکھیں" } },
  fr: { label: "Français 🇫🇷", dir: "ltr", strings: { appName:"Bibliothèque Islamique", appSubtitle:"Lumière du Savoir", heroTitle:"Lisez, Apprenez & Méditez", heroSub:"Découvrez une vaste collection de livres islamiques couvrant tous les domaines.", navHome:"Accueil", navBooks:"Bibliothèque", navFav:"Favoris", navSettings:"Paramètres", browseLib:"Parcourir" } },
};

export default function Settings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState("العربية");
  const [fullName, setFullName] = useState("");
  const [appLang, setAppLang] = useState(() => ls.get("dev_app_lang", "ar"));

  useEffect(() => {
    loadUser();
    const isDark = document.documentElement.classList.contains("dark");
    setDarkMode(isDark);
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
    toast.success("تم حفظ الملف الشخصي بنجاح");
    setSaving(false);
  };

  const handleToggleDark = (val) => {
    setDarkMode(val);
    if (val) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    await base44.auth.updateMe({
      notifications_enabled: notifications,
      preferred_language: language,
    });
    toast.success("تم حفظ التفضيلات بنجاح");
    setSaving(false);
  };

  const handleSaveAppLang = () => {
    ls.set("dev_app_lang", appLang);
    const lang = APP_LANGUAGES[appLang];
    if (lang) {
      Object.entries(lang.strings).forEach(([k, v]) => ls.set(`dev_lang_${k}`, v));
      ls.set("dev_lang_dir", lang.dir);
    }
    toast.success("تم تطبيق لغة التطبيق — أعد تحميل الصفحة لرؤية التغيير");
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">الإعدادات</h1>
        <p className="text-sm text-muted-foreground mt-1">إدارة حسابك وتفضيلاتك</p>
      </div>

      <div className="space-y-6">
        {/* Profile */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-base font-bold text-foreground">الملف الشخصي</h2>
          </div>

          <div className="space-y-4">
            <div>
              <Label>الاسم الكامل</Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="أدخل اسمك الكامل"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>البريد الإلكتروني</Label>
              <Input value={user?.email || ""} disabled className="mt-1.5 opacity-60" />
            </div>
            <Button onClick={handleSaveProfile} disabled={saving} className="gap-2 rounded-xl">
              <Save className="w-4 h-4" />
              حفظ التغييرات
            </Button>
          </div>
        </motion.div>

        {/* Appearance */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sun className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-base font-bold text-foreground">المظهر</h2>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">الوضع الليلي</p>
              <p className="text-xs text-muted-foreground mt-0.5">تفعيل المظهر الداكن للتطبيق</p>
            </div>
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-muted-foreground" />
              <Switch checked={darkMode} onCheckedChange={handleToggleDark} />
              <Moon className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </motion.div>

        {/* Notifications & Language */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Globe className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-base font-bold text-foreground">التفضيلات</h2>
          </div>

          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">الإشعارات</p>
                <p className="text-xs text-muted-foreground mt-0.5">استلام إشعارات عند إضافة كتب جديدة</p>
              </div>
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-muted-foreground" />
                <Switch checked={notifications} onCheckedChange={setNotifications} />
              </div>
            </div>

            <div>
              <Label>اللغة المفضلة للكتب</Label>
              <p className="text-xs text-muted-foreground mt-0.5 mb-1.5">سيتم تصفية الكتب حسب هذه اللغة في صفحة المكتبة</p>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="الكل">الكل (جميع اللغات)</SelectItem>
                  <SelectItem value="العربية">العربية</SelectItem>
                  <SelectItem value="الإنجليزية">الإنجليزية</SelectItem>
                  <SelectItem value="الفرنسية">الفرنسية</SelectItem>
                  <SelectItem value="الأوردو">الأوردو (هندي)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleSavePreferences} disabled={saving} className="gap-2 rounded-xl">
              <Save className="w-4 h-4" />
              حفظ التفضيلات
            </Button>
          </div>
        </motion.div>

        {/* App Language */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Languages className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">لغة واجهة التطبيق</h2>
              <p className="text-xs text-muted-foreground mt-0.5">تغيير لغة جميع نصوص التطبيق</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {Object.entries(APP_LANGUAGES).map(([code, lang]) => (
              <label key={code} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${appLang === code ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                <input type="radio" name="appLang" value={code} checked={appLang === code} onChange={() => setAppLang(code)} className="hidden"/>
                <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${appLang === code ? "border-primary bg-primary" : "border-border"}`}/>
                <span className="text-sm font-medium">{lang.label}</span>
              </label>
            ))}
          </div>
          <Button onClick={handleSaveAppLang} className="gap-2 rounded-xl w-full">
            <Save className="w-4 h-4" />
            تطبيق اللغة
          </Button>
        </motion.div>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center">
              <LogOut className="w-4 h-4 text-destructive" />
            </div>
            <h2 className="text-base font-bold text-foreground">تسجيل الخروج</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">سيتم تسجيل خروجك من جميع الأجهزة.</p>
          <Button variant="destructive" onClick={handleLogout} className="gap-2 rounded-xl">
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </Button>
        </motion.div>
      </div>
    </div>
  );
}