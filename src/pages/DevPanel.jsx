import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Lock, Palette, Image, Type, BookPlus, KeyRound, Eye, EyeOff, Upload, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";

const DEV_PASSWORD_KEY = "dev_panel_password";
const DEFAULT_PASSWORD = "42891";

const getPassword = () => localStorage.getItem(DEV_PASSWORD_KEY) || DEFAULT_PASSWORD;

const COLORS = [
  { name: "أخضر إسلامي", primary: "158 45% 28%", accent: "43 80% 55%" },
  { name: "أزرق عميق", primary: "217 71% 35%", accent: "43 80% 55%" },
  { name: "بنفسجي", primary: "270 50% 35%", accent: "43 80% 55%" },
  { name: "بني ذهبي", primary: "30 50% 30%", accent: "43 80% 55%" },
  { name: "رمادي أنيق", primary: "220 20% 30%", accent: "43 80% 55%" },
  { name: "أحمر داكن", primary: "0 50% 30%", accent: "43 80% 55%" },
];

function applyColor(primary, accent) {
  document.documentElement.style.setProperty("--primary", primary);
  document.documentElement.style.setProperty("--ring", primary);
  document.documentElement.style.setProperty("--sidebar-primary", primary);
  document.documentElement.style.setProperty("--accent", accent);
  localStorage.setItem("dev_primary_color", primary);
  localStorage.setItem("dev_accent_color", accent);
}

export function applyStoredColors() {
  const primary = localStorage.getItem("dev_primary_color");
  const accent = localStorage.getItem("dev_accent_color");
  if (primary) {
    document.documentElement.style.setProperty("--primary", primary);
    document.documentElement.style.setProperty("--ring", primary);
    document.documentElement.style.setProperty("--sidebar-primary", primary);
  }
  if (accent) document.documentElement.style.setProperty("--accent", accent);
}

export default function DevPanel() {
  const [unlocked, setUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [activeTab, setActiveTab] = useState("color");

  // Color
  const [selectedColor, setSelectedColor] = useState(null);

  // Logo
  const [logoUrl, setLogoUrl] = useState(localStorage.getItem("dev_logo_url") || "");
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // App Name
  const [appName, setAppName] = useState(localStorage.getItem("dev_app_name") || "المكتبة الدينية");
  const [appSubtitle, setAppSubtitle] = useState(localStorage.getItem("dev_app_subtitle") || "نور العلم والمعرفة");

  // Book PDF
  const [bookTitle, setBookTitle] = useState("");
  const [bookAuthor, setBookAuthor] = useState("");
  const [bookCategory, setBookCategory] = useState("القرآن وعلومه");
  const [pdfUrl, setPdfUrl] = useState("");
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [savingBook, setSavingBook] = useState(false);

  // Password change
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");

  useEffect(() => {
    applyStoredColors();
  }, []);

  const handleUnlock = () => {
    if (passwordInput === getPassword()) {
      setUnlocked(true);
    } else {
      toast.error("كلمة المرور غير صحيحة");
    }
  };

  const handleColorSelect = (color) => {
    setSelectedColor(color.name);
    applyColor(color.primary, color.accent);
    toast.success(`تم تطبيق اللون: ${color.name}`);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingLogo(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setLogoUrl(file_url);
    localStorage.setItem("dev_logo_url", file_url);
    setUploadingLogo(false);
    toast.success("تم رفع الشعار بنجاح");
  };

  const handleSaveAppName = () => {
    localStorage.setItem("dev_app_name", appName);
    localStorage.setItem("dev_app_subtitle", appSubtitle);
    toast.success("تم حفظ اسم التطبيق، أعد تحميل الصفحة لرؤية التغيير");
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPdf(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setPdfUrl(file_url);
    setUploadingPdf(false);
    toast.success("تم رفع الملف");
  };

  const handleAddBook = async () => {
    if (!bookTitle || !bookAuthor || !pdfUrl) {
      toast.error("يرجى ملء العنوان والمؤلف ورفع ملف PDF");
      return;
    }
    setSavingBook(true);
    await base44.entities.Book.create({
      title: bookTitle,
      author: bookAuthor,
      category: bookCategory,
      pdf_url: pdfUrl,
      language: "العربية",
      is_featured: false,
      rating: 0,
    });
    toast.success("تمت إضافة الكتاب بنجاح");
    setBookTitle("");
    setBookAuthor("");
    setPdfUrl("");
    setSavingBook(false);
  };

  const handleChangePassword = () => {
    if (currentPwd !== getPassword()) {
      toast.error("كلمة المرور الحالية غير صحيحة");
      return;
    }
    if (newPwd.length < 4) {
      toast.error("كلمة المرور الجديدة يجب أن تكون 4 أحرف على الأقل");
      return;
    }
    if (newPwd !== confirmPwd) {
      toast.error("كلمة المرور الجديدة غير متطابقة");
      return;
    }
    localStorage.setItem(DEV_PASSWORD_KEY, newPwd);
    toast.success("تم تغيير كلمة المرور بنجاح");
    setCurrentPwd("");
    setNewPwd("");
    setConfirmPwd("");
  };

  const tabs = [
    { id: "color", label: "اللون", icon: Palette },
    { id: "logo", label: "الشعار", icon: Image },
    { id: "name", label: "الاسم", icon: Type },
    { id: "book", label: "كتاب PDF", icon: BookPlus },
    { id: "password", label: "كلمة المرور", icon: KeyRound },
  ];

  if (!unlocked) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border border-border rounded-2xl p-8 w-full max-w-sm"
        >
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
              <Lock className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-xl font-black text-foreground">لوحة المطور</h1>
            <p className="text-sm text-muted-foreground mt-1">أدخل كلمة المرور للمتابعة</p>
          </div>
          <div className="space-y-4">
            <div className="relative">
              <Input
                type={showPwd ? "text" : "password"}
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                placeholder="كلمة المرور"
                className="h-12 rounded-xl pl-10"
              />
              <button
                onClick={() => setShowPwd(!showPwd)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Button onClick={handleUnlock} className="w-full h-12 rounded-xl font-bold">
              دخول
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
          <Lock className="w-6 h-6 text-primary" />
          لوحة المطور
        </h1>
        <p className="text-sm text-muted-foreground mt-1">إعدادات متقدمة للتطبيق</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        {/* Color */}
        {activeTab === "color" && (
          <div>
            <h2 className="text-base font-bold mb-4">اختر لون التطبيق</h2>
            <div className="grid grid-cols-2 gap-3">
              {COLORS.map((color) => (
                <button
                  key={color.name}
                  onClick={() => handleColorSelect(color)}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    selectedColor === color.name
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full shrink-0"
                    style={{ background: `hsl(${color.primary})` }}
                  />
                  <span className="text-sm font-medium">{color.name}</span>
                  {selectedColor === color.name && <Check className="w-4 h-4 text-primary mr-auto" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Logo */}
        {activeTab === "logo" && (
          <div>
            <h2 className="text-base font-bold mb-4">تعديل شعار التطبيق</h2>
            <div className="flex flex-col items-center gap-4">
              {logoUrl && (
                <img src={logoUrl} alt="الشعار" className="w-20 h-20 rounded-2xl object-cover border border-border" />
              )}
              <label className="cursor-pointer w-full">
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                <div className="flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-dashed border-border hover:border-primary/40 transition-colors">
                  {uploadingLogo ? (
                    <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">اختر صورة للشعار</span>
                    </>
                  )}
                </div>
              </label>
              {logoUrl && (
                <p className="text-xs text-muted-foreground text-center">
                  تم رفع الشعار. أعد تحميل الصفحة لرؤية التغيير في الهيدر.
                </p>
              )}
            </div>
          </div>
        )}

        {/* App Name */}
        {activeTab === "name" && (
          <div className="space-y-4">
            <h2 className="text-base font-bold mb-2">تعديل اسم التطبيق</h2>
            <div>
              <Label>الاسم الرئيسي</Label>
              <Input
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className="mt-1.5"
                placeholder="المكتبة الدينية"
              />
            </div>
            <div>
              <Label>الوصف الفرعي</Label>
              <Input
                value={appSubtitle}
                onChange={(e) => setAppSubtitle(e.target.value)}
                className="mt-1.5"
                placeholder="نور العلم والمعرفة"
              />
            </div>
            <Button onClick={handleSaveAppName} className="w-full rounded-xl">
              حفظ الاسم
            </Button>
          </div>
        )}

        {/* Book PDF */}
        {activeTab === "book" && (
          <div className="space-y-4">
            <h2 className="text-base font-bold mb-2">إضافة كتاب بملف PDF</h2>
            <div>
              <Label>عنوان الكتاب *</Label>
              <Input value={bookTitle} onChange={(e) => setBookTitle(e.target.value)} className="mt-1.5" placeholder="أدخل عنوان الكتاب" />
            </div>
            <div>
              <Label>المؤلف *</Label>
              <Input value={bookAuthor} onChange={(e) => setBookAuthor(e.target.value)} className="mt-1.5" placeholder="اسم المؤلف" />
            </div>
            <div>
              <Label>التصنيف</Label>
              <select
                value={bookCategory}
                onChange={(e) => setBookCategory(e.target.value)}
                className="mt-1.5 w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              >
                {["القرآن وعلومه","الحديث الشريف","الفقه الإسلامي","السيرة النبوية","العقيدة","التزكية والرقائق","التاريخ الإسلامي","أخرى"].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>ملف PDF *</Label>
              <label className="cursor-pointer block mt-1.5">
                <input type="file" accept=".pdf" onChange={handlePdfUpload} className="hidden" />
                <div className={`flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-dashed transition-colors ${pdfUrl ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                  {uploadingPdf ? (
                    <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                  ) : pdfUrl ? (
                    <><Check className="w-4 h-4 text-primary" /><span className="text-sm text-primary font-medium">تم رفع الملف ✓</span></>
                  ) : (
                    <><Upload className="w-4 h-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">ارفع ملف PDF</span></>
                  )}
                </div>
              </label>
            </div>
            <Button onClick={handleAddBook} disabled={savingBook} className="w-full rounded-xl">
              {savingBook ? "جاري الإضافة..." : "إضافة الكتاب"}
            </Button>
          </div>
        )}

        {/* Password */}
        {activeTab === "password" && (
          <div className="space-y-4">
            <h2 className="text-base font-bold mb-2">تغيير كلمة المرور</h2>
            <div>
              <Label>كلمة المرور الحالية</Label>
              <Input type="password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>كلمة المرور الجديدة</Label>
              <Input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>تأكيد كلمة المرور</Label>
              <Input type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} className="mt-1.5" />
            </div>
            <Button onClick={handleChangePassword} className="w-full rounded-xl">
              تغيير كلمة المرور
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}