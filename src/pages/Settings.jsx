import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { User, Bell, Moon, Sun, Globe, LogOut, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState("العربية");
  const [fullName, setFullName] = useState("");

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