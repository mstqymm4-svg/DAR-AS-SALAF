import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Lock, Palette, Image, BookPlus, KeyRound, Eye, EyeOff,
  Upload, Check, BookOpen, Pencil, Trash2, Settings, RefreshCw,
  Shield, LayoutDashboard, Sparkles, Globe, Pipette, RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const DEV_PASSWORD_KEY = "dev_panel_password";
const DEFAULT_PASSWORD = "42891";
const getPassword = () => localStorage.getItem(DEV_PASSWORD_KEY) || DEFAULT_PASSWORD;

// ─── Color Utils ─────────────────────────────────────────────────────
export function applyStoredColors() {
  const map = {
    "--background": localStorage.getItem("dev_bg"),
    "--foreground": localStorage.getItem("dev_fg"),
    "--primary": localStorage.getItem("dev_primary"),
    "--ring": localStorage.getItem("dev_primary"),
    "--sidebar-primary": localStorage.getItem("dev_primary"),
    "--accent": localStorage.getItem("dev_accent"),
    "--card": localStorage.getItem("dev_card"),
    "--popover": localStorage.getItem("dev_card"),
  };
  Object.entries(map).forEach(([k, v]) => { if (v) document.documentElement.style.setProperty(k, v); });
}

function applyColors({ bg, fg, primary, accent, card }) {
  if (bg) { document.documentElement.style.setProperty("--background", bg); localStorage.setItem("dev_bg", bg); }
  if (fg) { document.documentElement.style.setProperty("--foreground", fg); localStorage.setItem("dev_fg", fg); }
  if (primary) {
    ["--primary","--ring","--sidebar-primary"].forEach(v => document.documentElement.style.setProperty(v, primary));
    localStorage.setItem("dev_primary", primary);
  }
  if (accent) { document.documentElement.style.setProperty("--accent", accent); localStorage.setItem("dev_accent", accent); }
  if (card) {
    ["--card","--popover"].forEach(v => document.documentElement.style.setProperty(v, card));
    localStorage.setItem("dev_card", card);
  }
}

// ─── HSL ↔ HEX helpers ───────────────────────────────────────────────
function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => { const k = (n + h / 30) % 12; const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1); return Math.round(255 * color).toString(16).padStart(2, "0"); };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToHsl(hex) {
  let r = parseInt(hex.slice(1,3),16)/255, g = parseInt(hex.slice(3,5),16)/255, b = parseInt(hex.slice(5,7),16)/255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b); let h,s,l=(max+min)/2;
  if (max===min) { h=s=0; } else {
    const d=max-min; s=l>0.5?d/(2-max-min):d/(max+min);
    switch(max){ case r:h=((g-b)/d+(g<b?6:0))/6;break; case g:h=((b-r)/d+2)/6;break; default:h=((r-g)/d+4)/6; }
  }
  return `${Math.round(h*360)} ${Math.round(s*100)}% ${Math.round(l*100)}%`;
}

function hslStringToHex(hsl) {
  if (!hsl) return "#000000";
  const parts = hsl.trim().replace(/%/g,"").split(/\s+/);
  if (parts.length < 3) return "#000000";
  return hslToHex(Number(parts[0]), Number(parts[1]), Number(parts[2]));
}

const PRESETS = [
  { name: "أخضر إسلامي", bg: "40 30% 97%", fg: "160 30% 10%", primary: "158 45% 28%", accent: "43 80% 55%", card: "40 25% 99%" },
  { name: "أزرق عميق",   bg: "220 30% 97%", fg: "220 30% 10%", primary: "217 71% 35%", accent: "43 80% 55%", card: "220 25% 99%" },
  { name: "بنفسجي راقي", bg: "270 20% 97%", fg: "270 30% 10%", primary: "270 50% 38%", accent: "43 80% 55%", card: "270 15% 99%" },
  { name: "بني ذهبي",    bg: "35 30% 96%",  fg: "30 40% 10%",  primary: "30 50% 30%",  accent: "43 80% 55%", card: "35 25% 98%" },
  { name: "داكن ليلي",   bg: "220 20% 8%",  fg: "220 10% 92%", primary: "217 71% 50%", accent: "43 80% 55%", card: "220 20% 12%" },
  { name: "أحمر داكن",   bg: "0 15% 97%",   fg: "0 30% 10%",   primary: "0 55% 35%",   accent: "43 80% 55%", card: "0 10% 99%" },
  { name: "فيروزي",      bg: "185 25% 97%", fg: "185 35% 10%", primary: "185 60% 32%", accent: "43 80% 55%", card: "185 20% 99%" },
  { name: "وردي ناعم",   bg: "340 25% 97%", fg: "340 30% 10%", primary: "340 60% 40%", accent: "43 80% 55%", card: "340 20% 99%" },
];

const categoryOptions = ["القرآن وعلومه","الحديث الشريف","الفقه الإسلامي","السيرة النبوية","العقيدة","التزكية والرقائق","التاريخ الإسلامي","أخرى"];
const emptyBook = { title:"", author:"", category:"القرآن وعلومه", description:"", cover_image:"", pages_count:"", language:"العربية", pdf_url:"", is_featured:false, rating:0 };

const COLOR_FIELDS = [
  { key: "bg",      label: "الخلفية",      cssVar: "--background" },
  { key: "fg",      label: "النص",         cssVar: "--foreground" },
  { key: "primary", label: "اللون الأساسي", cssVar: "--primary" },
  { key: "accent",  label: "التمييز",      cssVar: "--accent" },
  { key: "card",    label: "البطاقات",     cssVar: "--card" },
];

// ─── App Language translations ────────────────────────────────────────
const APP_LANGUAGES = {
  ar: {
    label: "العربية 🇸🇦",
    dir: "rtl",
    strings: {
      appName: "المكتبة الدينية",
      appSubtitle: "نور العلم والمعرفة",
      heroTitle: "اقرأ وتعلّم وتدبّر",
      heroSub: "اكتشف مجموعة واسعة من الكتب الدينية في مختلف المجالات الإسلامية.",
      navHome: "الرئيسية",
      navBooks: "المكتبة",
      navFav: "المفضلة",
      navSettings: "الإعدادات",
      browseLib: "تصفح المكتبة",
    }
  },
  en: {
    label: "English 🇬🇧",
    dir: "ltr",
    strings: {
      appName: "Islamic Library",
      appSubtitle: "Light of Knowledge",
      heroTitle: "Read, Learn & Reflect",
      heroSub: "Discover a wide collection of Islamic books covering all fields of Islamic knowledge.",
      navHome: "Home",
      navBooks: "Library",
      navFav: "Favorites",
      navSettings: "Settings",
      browseLib: "Browse Library",
    }
  },
  hi: {
    label: "हिंदी 🇮🇳",
    dir: "ltr",
    strings: {
      appName: "इस्लामी पुस्तकालय",
      appSubtitle: "ज्ञान का प्रकाश",
      heroTitle: "पढ़ें, सीखें और विचार करें",
      heroSub: "इस्लामी ज्ञान के सभी क्षेत्रों को कवर करने वाली पुस्तकों का विशाल संग्रह खोजें।",
      navHome: "मुख्य पृष्ठ",
      navBooks: "पुस्तकालय",
      navFav: "पसंदीदा",
      navSettings: "सेटिंग्स",
      browseLib: "पुस्तकालय देखें",
    }
  },
  ur: {
    label: "اردو 🇵🇰",
    dir: "rtl",
    strings: {
      appName: "اسلامی کتب خانہ",
      appSubtitle: "علم کی روشنی",
      heroTitle: "پڑھیں، سیکھیں اور غور کریں",
      heroSub: "اسلامی علوم کے تمام شعبوں پر مشتمل کتابوں کا وسیع ذخیرہ دریافت کریں۔",
      navHome: "مرکزی صفحہ",
      navBooks: "کتب خانہ",
      navFav: "پسندیدہ",
      navSettings: "ترتیبات",
      browseLib: "کتب خانہ دیکھیں",
    }
  },
};

export default function DevPanel() {
  const [unlocked, setUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Colors — stored as HSL strings, shown as color pickers too
  const [colors, setColors] = useState({ bg: "", fg: "", primary: "", accent: "", card: "" });
  const [selectedPreset, setSelectedPreset] = useState(null);

  // Logo & Name
  const [logoUrl, setLogoUrl] = useState(() => localStorage.getItem("dev_logo_url") || "");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [appName, setAppName] = useState(() => localStorage.getItem("dev_app_name") || "المكتبة الدينية");
  const [appSubtitle, setAppSubtitle] = useState(() => localStorage.getItem("dev_app_subtitle") || "نور العلم والمعرفة");

  // Book PDF
  const [bookForm, setBookForm] = useState(emptyBook);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [savingBook, setSavingBook] = useState(false);

  // Password
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");

  // Admin Books
  const [books, setBooks] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [editForm, setEditForm] = useState(emptyBook);
  const [editPdfUploading, setEditPdfUploading] = useState(false);
  const [editCoverUploading, setEditCoverUploading] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  // App Settings
  const [pdfViewer, setPdfViewer] = useState(() => localStorage.getItem("dev_pdf_viewer") || "google");
  const [showDevNav, setShowDevNav] = useState(() => localStorage.getItem("dev_show_dev_nav") !== "false");
  const [appLang, setAppLang] = useState(() => localStorage.getItem("dev_app_lang") || "ar");

  // Stats
  const [stats, setStats] = useState({ total: 0, featured: 0, categories: 0 });

  useEffect(() => { applyStoredColors(); }, []);

  useEffect(() => {
    if ((activeTab === "admin" || activeTab === "dashboard") && unlocked) loadBooks();
  }, [activeTab, unlocked]);

  const loadBooks = async () => {
    setLoadingBooks(true);
    const all = await base44.entities.Book.list('-created_date', 300);
    setBooks(all);
    const cats = new Set(all.map(b => b.category));
    setStats({ total: all.length, featured: all.filter(b => b.is_featured).length, categories: cats.size });
    setLoadingBooks(false);
  };

  const handleUnlock = () => {
    if (passwordInput === getPassword()) setUnlocked(true);
    else toast.error("كلمة المرور غير صحيحة");
  };

  // ── Color handlers ──
  const handleApplyPreset = (preset) => {
    setSelectedPreset(preset.name);
    setColors({ bg: preset.bg, fg: preset.fg, primary: preset.primary, accent: preset.accent, card: preset.card });
    applyColors(preset);
    toast.success(`تم تطبيق: ${preset.name}`);
  };

  const handleApplyCustom = () => {
    const hasAny = Object.values(colors).some(v => v.trim() !== "");
    if (!hasAny) { toast.error("أدخل قيمة لون واحدة على الأقل أو اختر ثيماً جاهزاً"); return; }
    applyColors(colors);
    toast.success("تم تطبيق الألوان");
  };

  const handleResetColors = () => {
    ["dev_bg","dev_fg","dev_primary","dev_accent","dev_card"].forEach(k => localStorage.removeItem(k));
    ["--background","--foreground","--primary","--ring","--sidebar-primary","--accent","--card","--popover"]
      .forEach(v => document.documentElement.style.removeProperty(v));
    setColors({ bg:"", fg:"", primary:"", accent:"", card:"" });
    setSelectedPreset(null);
    toast.success("تم إعادة الألوان للافتراضي");
  };

  // color picker (hex) → hsl string
  const handleColorPicker = (key, hex) => {
    const hsl = hexToHsl(hex);
    setColors(c => ({ ...c, [key]: hsl }));
  };

  // ── Logo & name ──
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setUploadingLogo(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setLogoUrl(file_url); localStorage.setItem("dev_logo_url", file_url);
    setUploadingLogo(false); toast.success("تم رفع الشعار");
  };

  const handleSaveAppName = () => {
    localStorage.setItem("dev_app_name", appName);
    localStorage.setItem("dev_app_subtitle", appSubtitle);
    toast.success("تم الحفظ — أعد تحميل الصفحة");
  };

  // ── Book ──
  const handlePdfUpload = async (e, isEdit = false) => {
    const file = e.target.files[0]; if (!file) return;
    if (isEdit) setEditPdfUploading(true); else setPdfUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    if (isEdit) { setEditForm(p => ({ ...p, pdf_url: file_url })); setEditPdfUploading(false); }
    else { setBookForm(p => ({ ...p, pdf_url: file_url })); setPdfUploading(false); }
    toast.success("تم رفع PDF");
  };

  const handleCoverUpload = async (e, isEdit = false) => {
    const file = e.target.files[0]; if (!file) return;
    if (isEdit) setEditCoverUploading(true); else setCoverUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    if (isEdit) { setEditForm(p => ({ ...p, cover_image: file_url })); setEditCoverUploading(false); }
    else { setBookForm(p => ({ ...p, cover_image: file_url })); setCoverUploading(false); }
    toast.success("تم رفع الغلاف");
  };

  const handleAddBook = async () => {
    if (!bookForm.title || !bookForm.author) { toast.error("أدخل العنوان والمؤلف"); return; }
    setSavingBook(true);
    await base44.entities.Book.create({ ...bookForm, pages_count: bookForm.pages_count ? Number(bookForm.pages_count) : null, rating: Number(bookForm.rating)||0 });
    toast.success("تمت إضافة الكتاب"); setBookForm(emptyBook); setSavingBook(false); loadBooks();
  };

  // ── Admin ──
  const openEdit = (book) => {
    setEditingBook(book);
    setEditForm({ title:book.title||"", author:book.author||"", category:book.category||"القرآن وعلومه", description:book.description||"", cover_image:book.cover_image||"", pages_count:book.pages_count||"", language:book.language||"العربية", pdf_url:book.pdf_url||"", is_featured:book.is_featured||false, rating:book.rating||0 });
    setEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!editingBook) return;
    setSavingEdit(true);
    try {
      await base44.entities.Book.update(editingBook.id, {
        title: editForm.title,
        author: editForm.author,
        category: editForm.category,
        description: editForm.description,
        cover_image: editForm.cover_image,
        pages_count: editForm.pages_count ? Number(editForm.pages_count) : null,
        language: editForm.language,
        pdf_url: editForm.pdf_url,
        is_featured: editForm.is_featured,
        rating: Number(editForm.rating) || 0,
      });
      toast.success("تم التحديث بنجاح");
      setEditDialog(false);
      loadBooks();
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (book) => {
    if (!confirm(`حذف "${book.title}"؟`)) return;
    await base44.entities.Book.delete(book.id); toast.success("تم الحذف"); loadBooks();
  };

  // ── Password ──
  const handleChangePassword = () => {
    if (currentPwd !== getPassword()) { toast.error("كلمة المرور الحالية خاطئة"); return; }
    if (newPwd.length < 4) { toast.error("كلمة المرور الجديدة قصيرة جداً"); return; }
    if (newPwd !== confirmPwd) { toast.error("كلمتا المرور غير متطابقتين"); return; }
    localStorage.setItem(DEV_PASSWORD_KEY, newPwd);
    toast.success("تم تغيير كلمة المرور"); setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
  };

  // ── App Settings ──
  const handleSaveAppSettings = () => {
    localStorage.setItem("dev_pdf_viewer", pdfViewer);
    localStorage.setItem("dev_show_dev_nav", String(showDevNav));
    localStorage.setItem("dev_app_lang", appLang);
    // apply language strings to localStorage for app to pick up
    const lang = APP_LANGUAGES[appLang];
    if (lang) {
      Object.entries(lang.strings).forEach(([k, v]) => localStorage.setItem(`dev_lang_${k}`, v));
      localStorage.setItem("dev_lang_dir", lang.dir);
    }
    toast.success("تم حفظ الإعدادات — أعد تحميل الصفحة");
  };

  const tabs = [
    { id: "dashboard",    label: "لوحة التحكم",     icon: LayoutDashboard },
    { id: "color",        label: "الألوان",           icon: Palette },
    { id: "logo",         label: "الشعار والاسم",    icon: Image },
    { id: "book",         label: "إضافة كتاب",       icon: BookPlus },
    { id: "admin",        label: "إدارة الكتب",      icon: BookOpen },
    { id: "app_settings", label: "إعدادات التطبيق",  icon: Settings },
    { id: "password",     label: "كلمة المرور",      icon: KeyRound },
  ];

  if (!unlocked) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} className="bg-card border border-border rounded-2xl p-8 w-full max-w-sm">
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
              <Lock className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-xl font-black">لوحة المطور</h1>
            <p className="text-sm text-muted-foreground mt-1">أدخل كلمة المرور للمتابعة</p>
          </div>
          <div className="space-y-4">
            <div className="relative">
              <Input type={showPwd ? "text" : "password"} value={passwordInput} onChange={e => setPasswordInput(e.target.value)} onKeyDown={e => e.key==="Enter" && handleUnlock()} placeholder="كلمة المرور" className="h-12 rounded-xl pl-10" />
              <button onClick={() => setShowPwd(!showPwd)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPwd ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
              </button>
            </div>
            <Button onClick={handleUnlock} className="w-full h-12 rounded-xl font-bold">دخول</Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary"/> لوحة المطور
        </h1>
        <button onClick={() => { setUnlocked(false); setPasswordInput(""); }} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 border border-border rounded-lg px-3 py-1.5">
          <Lock className="w-3 h-3"/> قفل
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeTab===tab.id ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}>
            <tab.icon className="w-4 h-4"/>{tab.label}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">

        {/* ─── Dashboard ─── */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <h2 className="text-base font-bold flex items-center gap-2"><Sparkles className="w-4 h-4 text-accent"/> نظرة عامة</h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-primary/10 rounded-xl p-4 text-center">
                <p className="text-3xl font-black text-primary">{stats.total}</p>
                <p className="text-xs text-muted-foreground mt-1">إجمالي الكتب</p>
              </div>
              <div className="bg-accent/10 rounded-xl p-4 text-center">
                <p className="text-3xl font-black text-accent">{stats.featured}</p>
                <p className="text-xs text-muted-foreground mt-1">مميز</p>
              </div>
              <div className="bg-muted rounded-xl p-4 text-center">
                <p className="text-3xl font-black">{stats.categories}</p>
                <p className="text-xs text-muted-foreground mt-1">تصنيف</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold mb-3">آخر الكتب المضافة</p>
              {loadingBooks ? (
                <div className="flex justify-center py-6"><div className="w-6 h-6 border-4 border-primary/20 border-t-primary rounded-full animate-spin"/></div>
              ) : (
                <div className="space-y-2">
                  {books.slice(0,5).map(book => (
                    <div key={book.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                      <div className="w-8 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                        {book.cover_image ? <img src={book.cover_image} alt="" className="w-full h-full object-cover"/> : <BookOpen className="w-3.5 h-3.5 text-muted-foreground"/>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{book.title}</p>
                        <p className="text-xs text-muted-foreground">{book.category}</p>
                      </div>
                      {book.pdf_url ? <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">PDF ✓</span> : <span className="text-xs text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">بدون PDF</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={() => setActiveTab("book")} className="rounded-xl gap-2 h-11"><BookPlus className="w-4 h-4"/> إضافة كتاب</Button>
              <Button variant="outline" onClick={() => setActiveTab("admin")} className="rounded-xl gap-2 h-11"><BookOpen className="w-4 h-4"/> إدارة الكتب</Button>
            </div>
          </div>
        )}

        {/* ─── Colors ─── */}
        {activeTab === "color" && (
          <div className="space-y-6">
            <h2 className="text-base font-bold flex items-center gap-2"><Palette className="w-4 h-4"/> تخصيص ألوان التطبيق</h2>

            {/* Presets */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-3">ثيمات جاهزة</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PRESETS.map(p => (
                  <button key={p.name} onClick={() => handleApplyPreset(p)} className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${selectedPreset===p.name ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}>
                    <div className="flex gap-0.5">
                      <div className="w-5 h-8 rounded-sm" style={{ background:`hsl(${p.bg})`, border:"1px solid hsl(0 0% 80%)" }}/>
                      <div className="w-5 h-8 rounded-sm" style={{ background:`hsl(${p.primary})` }}/>
                      <div className="w-5 h-8 rounded-sm" style={{ background:`hsl(${p.accent})` }}/>
                    </div>
                    <span className="text-[10px] font-medium text-center leading-tight">{p.name}</span>
                    {selectedPreset===p.name && <Check className="w-3 h-3 text-primary"/>}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Pickers */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-1"><Pipette className="w-3.5 h-3.5"/> منتقي الألوان</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {COLOR_FIELDS.map(({ key, label }) => {
                  const hexVal = colors[key] ? hslStringToHex(colors[key]) : hslStringToHex(
                    getComputedStyle(document.documentElement).getPropertyValue(
                      key==="bg" ? "--background" : key==="fg" ? "--foreground" : key==="primary" ? "--primary" : key==="accent" ? "--accent" : "--card"
                    ).trim()
                  );
                  return (
                    <div key={key} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border">
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-xl border-2 border-border overflow-hidden cursor-pointer" style={{ background: colors[key] ? `hsl(${colors[key]})` : hexVal }}>
                          <input type="color" value={hexVal} onChange={e => handleColorPicker(key, e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs font-semibold">{label}</Label>
                        <Input value={colors[key]} onChange={e => setColors(c => ({ ...c, [key]: e.target.value }))} placeholder="158 45% 28%" className="h-7 text-xs mt-0.5" />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={handleApplyCustom} className="flex-1 rounded-xl">تطبيق الألوان</Button>
                <Button variant="outline" onClick={handleResetColors} className="rounded-xl gap-1.5"><RotateCcw className="w-3.5 h-3.5"/> إعادة تعيين</Button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Logo & Name ─── */}
        {activeTab === "logo" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold mb-4">شعار التطبيق</h2>
              <div className="flex flex-col items-center gap-4">
                {logoUrl && <img src={logoUrl} alt="الشعار" className="w-20 h-20 rounded-2xl object-cover border border-border"/>}
                <label className="cursor-pointer w-full">
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden"/>
                  <div className="flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-dashed border-border hover:border-primary/40 transition-colors">
                    {uploadingLogo ? <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin"/> : <><Upload className="w-4 h-4 text-muted-foreground"/><span className="text-sm text-muted-foreground">اختر صورة للشعار</span></>}
                  </div>
                </label>
              </div>
            </div>
            <div className="border-t border-border pt-5 space-y-4">
              <h2 className="text-base font-bold">اسم التطبيق</h2>
              <div><Label>الاسم الرئيسي</Label><Input value={appName} onChange={e => setAppName(e.target.value)} className="mt-1.5"/></div>
              <div><Label>الوصف الفرعي</Label><Input value={appSubtitle} onChange={e => setAppSubtitle(e.target.value)} className="mt-1.5"/></div>
              <Button onClick={handleSaveAppName} className="w-full rounded-xl">حفظ</Button>
            </div>
          </div>
        )}

        {/* ─── Add Book ─── */}
        {activeTab === "book" && (
          <div className="space-y-4">
            <h2 className="text-base font-bold mb-2">إضافة كتاب جديد</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>العنوان *</Label><Input value={bookForm.title} onChange={e => setBookForm(p => ({...p,title:e.target.value}))} className="mt-1.5"/></div>
              <div><Label>المؤلف *</Label><Input value={bookForm.author} onChange={e => setBookForm(p => ({...p,author:e.target.value}))} className="mt-1.5"/></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>التصنيف</Label>
                <select value={bookForm.category} onChange={e => setBookForm(p => ({...p,category:e.target.value}))} className="mt-1.5 w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                  {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div><Label>عدد الصفحات</Label><Input type="number" value={bookForm.pages_count} onChange={e => setBookForm(p => ({...p,pages_count:e.target.value}))} className="mt-1.5"/></div>
            </div>
            <div><Label>الوصف</Label><Textarea value={bookForm.description} onChange={e => setBookForm(p => ({...p,description:e.target.value}))} className="mt-1.5" rows={3}/></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>صورة الغلاف</Label>
                <label className="cursor-pointer block mt-1.5">
                  <input type="file" accept="image/*" onChange={e => handleCoverUpload(e,false)} className="hidden"/>
                  <div className={`flex items-center justify-center gap-2 h-10 rounded-xl border-2 border-dashed transition-colors ${bookForm.cover_image?"border-primary bg-primary/5":"border-border"}`}>
                    {coverUploading ? <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin"/> : bookForm.cover_image ? <><Check className="w-4 h-4 text-primary"/><span className="text-xs text-primary">تم الرفع</span></> : <><Upload className="w-4 h-4 text-muted-foreground"/><span className="text-xs text-muted-foreground">رفع الغلاف</span></>}
                  </div>
                </label>
              </div>
              <div>
                <Label>ملف PDF</Label>
                <label className="cursor-pointer block mt-1.5">
                  <input type="file" accept=".pdf" onChange={e => handlePdfUpload(e,false)} className="hidden"/>
                  <div className={`flex items-center justify-center gap-2 h-10 rounded-xl border-2 border-dashed transition-colors ${bookForm.pdf_url?"border-primary bg-primary/5":"border-border"}`}>
                    {pdfUploading ? <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin"/> : bookForm.pdf_url ? <><Check className="w-4 h-4 text-primary"/><span className="text-xs text-primary">PDF جاهز</span></> : <><Upload className="w-4 h-4 text-muted-foreground"/><span className="text-xs text-muted-foreground">رفع PDF</span></>}
                  </div>
                </label>
                <Input value={bookForm.pdf_url} onChange={e => setBookForm(p => ({...p,pdf_url:e.target.value}))} placeholder="أو أدخل رابط PDF مباشرة" className="text-xs h-8 mt-1.5"/>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
              <Label>كتاب مميز ⭐</Label>
              <Switch checked={bookForm.is_featured} onCheckedChange={v => setBookForm(p => ({...p,is_featured:v}))}/>
            </div>
            <Button onClick={handleAddBook} disabled={savingBook} className="w-full rounded-xl h-11">
              {savingBook ? "جاري الإضافة..." : "إضافة الكتاب"}
            </Button>
          </div>
        )}

        {/* ─── Admin Books ─── */}
        {activeTab === "admin" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold">إدارة الكتب — {books.length} كتاب</h2>
              <button onClick={loadBooks} className="p-2 rounded-lg hover:bg-muted transition-colors">
                <RefreshCw className="w-4 h-4 text-muted-foreground"/>
              </button>
            </div>
            {loadingBooks ? (
              <div className="flex justify-center py-10"><div className="w-7 h-7 border-4 border-primary/20 border-t-primary rounded-full animate-spin"/></div>
            ) : (
              <div className="divide-y divide-border max-h-[60vh] overflow-y-auto">
                {books.map(book => (
                  <div key={book.id} className="flex items-center gap-3 py-3">
                    <div className="w-10 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                      {book.cover_image ? <img src={book.cover_image} alt="" className="w-full h-full object-cover"/> : <BookOpen className="w-4 h-4 text-muted-foreground"/>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{book.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{book.author} · {book.category}</p>
                      {book.pdf_url && <p className="text-[10px] text-green-600 mt-0.5">✓ يحتوي على PDF</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => openEdit(book)} className="p-1.5 rounded-lg hover:bg-muted"><Pencil className="w-3.5 h-3.5 text-muted-foreground"/></button>
                      <button onClick={() => handleDelete(book)} className="p-1.5 rounded-lg hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5 text-destructive"/></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── App Settings ─── */}
        {activeTab === "app_settings" && (
          <div className="space-y-5">
            <h2 className="text-base font-bold flex items-center gap-2"><Settings className="w-4 h-4"/> إعدادات التطبيق</h2>

            {/* Language / Translation */}
            <div className="p-4 bg-muted/50 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary"/>
                <p className="text-sm font-semibold">لغة التطبيق</p>
              </div>
              <p className="text-xs text-muted-foreground">اختر لغة واجهة التطبيق وسيتم تطبيقها عند إعادة التحميل</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(APP_LANGUAGES).map(([code, lang]) => (
                  <label key={code} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${appLang===code ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                    <input type="radio" name="appLang" value={code} checked={appLang===code} onChange={() => setAppLang(code)} className="hidden"/>
                    <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${appLang===code ? "border-primary bg-primary" : "border-border"}`}/>
                    <span className="text-sm font-medium">{lang.label}</span>
                  </label>
                ))}
              </div>
              {appLang !== "ar" && (
                <div className="mt-2 p-3 rounded-xl bg-accent/10 border border-accent/20 text-xs text-muted-foreground space-y-1">
                  <p className="font-semibold text-foreground">معاينة النصوص:</p>
                  {Object.entries(APP_LANGUAGES[appLang].strings).slice(0,4).map(([k,v]) => (
                    <p key={k}><span className="text-muted-foreground">{k}:</span> <span className={APP_LANGUAGES[appLang].dir==="rtl" ? "font-tajawal" : ""}>{v}</span></p>
                  ))}
                </div>
              )}
            </div>

            {/* PDF Viewer */}
            <div className="p-4 bg-muted/50 rounded-xl space-y-3">
              <p className="text-sm font-semibold">عارض PDF</p>
              <div className="space-y-2">
                {[
                  { value:"google",  label:"Google Docs Viewer", desc:"الأكثر توافقاً مع المتصفحات" },
                  { value:"mozilla", label:"Mozilla PDF.js",      desc:"سريع ويعمل بدون إنترنت" },
                  { value:"direct",  label:"مباشر (iframe)",      desc:"يعتمد على إعدادات الخادم" },
                ].map(opt => (
                  <label key={opt.value} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${pdfViewer===opt.value ? "border-primary bg-primary/5" : "border-border"}`}>
                    <input type="radio" name="pdfViewer" value={opt.value} checked={pdfViewer===opt.value} onChange={e => setPdfViewer(e.target.value)} className="hidden"/>
                    <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${pdfViewer===opt.value ? "border-primary bg-primary" : "border-border"}`}/>
                    <div>
                      <p className="text-sm font-medium">{opt.label}</p>
                      <p className="text-xs text-muted-foreground">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Show Dev Nav */}
            <div className="p-4 bg-muted/50 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">زر المطور في شريط التنقل</p>
                <p className="text-xs text-muted-foreground mt-0.5">إظهار أو إخفاء الزر</p>
              </div>
              <Switch checked={showDevNav} onCheckedChange={setShowDevNav}/>
            </div>

            {/* Clear Cache */}
            <div className="p-4 bg-muted/50 rounded-xl">
              <p className="text-sm font-semibold mb-1">مسح ذاكرة التخزين المؤقت</p>
              <p className="text-xs text-muted-foreground mb-3">يمسح جميع إعدادات التخصيص المحفوظة</p>
              <Button variant="destructive" size="sm" className="rounded-xl" onClick={() => {
                localStorage.clear();
                toast.success("تم المسح — ستتم إعادة التحميل");
                setTimeout(() => window.location.reload(), 1500);
              }}>
                مسح كل الإعدادات
              </Button>
            </div>

            <Button onClick={handleSaveAppSettings} className="w-full rounded-xl h-11 font-bold">
              حفظ إعدادات التطبيق
            </Button>
          </div>
        )}

        {/* ─── Password ─── */}
        {activeTab === "password" && (
          <div className="space-y-4">
            <h2 className="text-base font-bold mb-2 flex items-center gap-2"><KeyRound className="w-4 h-4"/> تغيير كلمة المرور</h2>
            <div><Label>الحالية</Label><Input type="password" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} className="mt-1.5"/></div>
            <div><Label>الجديدة</Label><Input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} className="mt-1.5"/></div>
            <div><Label>تأكيد الجديدة</Label><Input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} className="mt-1.5"/></div>
            <Button onClick={handleChangePassword} className="w-full rounded-xl">تغيير كلمة المرور</Button>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle>تعديل الكتاب</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>العنوان</Label><Input value={editForm.title} onChange={e => setEditForm(p => ({...p,title:e.target.value}))} className="mt-1"/></div>
              <div><Label>المؤلف</Label><Input value={editForm.author} onChange={e => setEditForm(p => ({...p,author:e.target.value}))} className="mt-1"/></div>
            </div>
            <div>
              <Label>التصنيف</Label>
              <select value={editForm.category} onChange={e => setEditForm(p => ({...p,category:e.target.value}))} className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div><Label>الوصف</Label><Textarea value={editForm.description} onChange={e => setEditForm(p => ({...p,description:e.target.value}))} className="mt-1" rows={3}/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>عدد الصفحات</Label><Input type="number" value={editForm.pages_count} onChange={e => setEditForm(p => ({...p,pages_count:e.target.value}))} className="mt-1"/></div>
              <div><Label>التقييم (0-5)</Label><Input type="number" min={0} max={5} step={0.5} value={editForm.rating} onChange={e => setEditForm(p => ({...p,rating:e.target.value}))} className="mt-1"/></div>
            </div>
            <div>
              <Label>رابط PDF</Label>
              <Input value={editForm.pdf_url} onChange={e => setEditForm(p => ({...p,pdf_url:e.target.value}))} placeholder="رابط PDF" className="mt-1 text-xs"/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">رفع PDF جديد</Label>
                <label className="cursor-pointer block mt-1">
                  <input type="file" accept=".pdf" onChange={e => handlePdfUpload(e,true)} className="hidden"/>
                  <div className={`flex items-center justify-center gap-1 h-9 rounded-xl border-2 border-dashed transition-colors ${editPdfUploading?"border-primary":editForm.pdf_url?"border-primary bg-primary/5":"border-border"}`}>
                    {editPdfUploading ? <div className="w-3 h-3 border-2 border-primary/20 border-t-primary rounded-full animate-spin"/> : <><Upload className="w-3 h-3 text-muted-foreground"/><span className="text-xs text-muted-foreground">PDF</span></>}
                  </div>
                </label>
              </div>
              <div>
                <Label className="text-xs">رفع غلاف جديد</Label>
                <label className="cursor-pointer block mt-1">
                  <input type="file" accept="image/*" onChange={e => handleCoverUpload(e,true)} className="hidden"/>
                  <div className={`flex items-center justify-center gap-1 h-9 rounded-xl border-2 border-dashed transition-colors ${editCoverUploading?"border-primary":editForm.cover_image?"border-primary bg-primary/5":"border-border"}`}>
                    {editCoverUploading ? <div className="w-3 h-3 border-2 border-primary/20 border-t-primary rounded-full animate-spin"/> : <><Upload className="w-3 h-3 text-muted-foreground"/><span className="text-xs text-muted-foreground">غلاف</span></>}
                  </div>
                </label>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
              <Label>مميز ⭐</Label>
              <Switch checked={editForm.is_featured} onCheckedChange={v => setEditForm(p => ({...p,is_featured:v}))}/>
            </div>
            <Button onClick={handleSaveEdit} disabled={savingEdit} className="w-full rounded-xl">
              {savingEdit ? "جاري الحفظ..." : "حفظ التعديلات"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}