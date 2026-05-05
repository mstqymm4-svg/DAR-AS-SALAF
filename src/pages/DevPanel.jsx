import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Lock, Palette, Image, BookPlus, KeyRound, Eye, EyeOff,
  Upload, Check, BookOpen, Pencil, Trash2, Settings, RefreshCw,
  Shield, LayoutDashboard, Sparkles, Globe, Pipette, RotateCcw,
  Tags, Plus, X, Youtube, ExternalLink, Languages, Type, Search, Moon, Sun
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { TRANSLATIONS } from "@/lib/i18n";

// ─── Storage ──────────────────────────────────────────────────────────────────
const ls = {
  get: (k, fb = null) => { try { const v = localStorage.getItem(k); return v !== null ? v : fb; } catch(e) { return fb; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch(e) {} },
  getJson: (k, fb = null) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch(e) { return fb; } },
  setJson: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch(e) {} },
  remove: (k) => { try { localStorage.removeItem(k); } catch(e) {} },
  clear: () => { try { localStorage.clear(); } catch(e) {} },
};

// ─── Password ────────────────────────────────────────────────────────────────
const DEV_PASSWORD_KEY = "dev_panel_password";
const DEFAULT_PASSWORD = "42891";
const getPassword = () => ls.get(DEV_PASSWORD_KEY) || DEFAULT_PASSWORD;

// ─── Font Presets ─────────────────────────────────────────────────────────────
export const FONT_PRESETS = [
  { name: "Tajawal",              label: "تجوّل",            category: "حديث",    url: "https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&display=swap",             value: "'Tajawal', sans-serif" },
  { name: "Cairo",                label: "القاهرة",           category: "حديث",    url: "https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap",                   value: "'Cairo', sans-serif" },
  { name: "IBM Plex Sans Arabic", label: "IBM بلكس",         category: "حديث",    url: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;600;700&display=swap",        value: "'IBM Plex Sans Arabic', sans-serif" },
  { name: "Readex Pro",           label: "ريدكس برو",         category: "حديث",    url: "https://fonts.googleapis.com/css2?family=Readex+Pro:wght@300;400;600;700&display=swap",                  value: "'Readex Pro', sans-serif" },
  { name: "Noto Sans Arabic",     label: "نوتو سانس",         category: "حديث",    url: "https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@300;400;600;700&display=swap",            value: "'Noto Sans Arabic', sans-serif" },
  { name: "Almarai",              label: "المرعي",            category: "حديث",    url: "https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;700;800&display=swap",                     value: "'Almarai', sans-serif" },
  { name: "Rubik",                label: "روبيك",             category: "حديث",    url: "https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;700&display=swap",                       value: "'Rubik', sans-serif" },
  { name: "Noto Nastaliq Urdu",   label: "نستعلیق اردو",     category: "أوردو",   url: "https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap",                  value: "'Noto Nastaliq Urdu', serif" },
  { name: "Gulzar",               label: "گلزار (اردو)",      category: "أوردو",   url: "https://fonts.googleapis.com/css2?family=Gulzar&display=swap",                                           value: "'Gulzar', serif" },
  { name: "Amiri",                label: "أميري",             category: "كلاسيكي", url: "https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap",                               value: "'Amiri', serif" },
  { name: "Noto Naskh Arabic",    label: "نوتو نسخ",         category: "كلاسيكي", url: "https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&display=swap",                   value: "'Noto Naskh Arabic', serif" },
  { name: "Scheherazade New",     label: "شهرزاد",            category: "كلاسيكي", url: "https://fonts.googleapis.com/css2?family=Scheherazade+New:wght@400;700&display=swap",                    value: "'Scheherazade New', serif" },
  { name: "Mirza",                label: "ميرزا",             category: "كلاسيكي", url: "https://fonts.googleapis.com/css2?family=Mirza:wght@400;500;600;700&display=swap",                      value: "'Mirza', cursive" },
  { name: "Lateef",               label: "لطيف",              category: "قرآني",   url: "https://fonts.googleapis.com/css2?family=Lateef&display=swap",                                           value: "'Lateef', serif" },
  { name: "Reem Kufi",            label: "ريم كوفي",          category: "زخرفي",   url: "https://fonts.googleapis.com/css2?family=Reem+Kufi:wght@400;500;600;700&display=swap",                  value: "'Reem Kufi', sans-serif" },
  { name: "Aref Ruqaa",           label: "عارف رقعة",         category: "زخرفي",   url: "https://fonts.googleapis.com/css2?family=Aref+Ruqaa:wght@400;700&display=swap",                         value: "'Aref Ruqaa', serif" },
  { name: "El Messiri",           label: "المسيري",           category: "زخرفي",   url: "https://fonts.googleapis.com/css2?family=El+Messiri:wght@400;500;600;700&display=swap",                 value: "'El Messiri', sans-serif" },
];

export const FONT_ROLES = [
  { key: "body",    label: "النص العام",   desc: "جميع نصوص الصفحة",        cssVar: "--font-tajawal", sample: "بسم الله الرحمن الرحيم" },
  { key: "heading", label: "العناوين",     desc: "العناوين الكبيرة (h1,h2)", cssVar: "--font-heading", sample: "المكتبة الإسلامية" },
  { key: "title",   label: "أسماء الكتب", desc: "عناوين الكتب في البطاقات", cssVar: "--font-title",   sample: "صحيح البخاري" },
  { key: "nav",     label: "شريط التنقل", desc: "روابط وأزرار التنقل",      cssVar: "--font-nav",     sample: "الرئيسية" },
  { key: "button",  label: "الأزرار",      desc: "نصوص الأزرار",            cssVar: "--font-button",  sample: "تصفح المكتبة" },
];

// ─── Font helpers ─────────────────────────────────────────────────────────────
function injectRoleFont(role, preset) {
  const linkId = `dev-font-link-${preset.name.replace(/\s+/g, "-")}`;
  if (!document.getElementById(linkId)) {
    const link = document.createElement("link");
    link.id = linkId; link.rel = "stylesheet"; link.href = preset.url;
    document.head.appendChild(link);
  }
  document.documentElement.style.setProperty(role.cssVar, preset.value);
  ls.set(`dev_font_${role.key}`, preset.name);
}

export function applyStoredFont() {
  FONT_ROLES.forEach(role => {
    const stored = ls.get(`dev_font_${role.key}`);
    if (stored) {
      const preset = FONT_PRESETS.find(f => f.name === stored);
      if (preset) injectRoleFont(role, preset);
    }
  });
  const storedSize = ls.get("dev_font_size");
  if (storedSize) document.documentElement.style.setProperty("font-size", `${storedSize}px`);
}

// ─── Color helpers ────────────────────────────────────────────────────────────
export function applyStoredColors() {
  const map = {
    "--background":    ls.get("dev_bg"),
    "--foreground":    ls.get("dev_fg"),
    "--primary":       ls.get("dev_primary"),
    "--ring":          ls.get("dev_primary"),
    "--sidebar-primary": ls.get("dev_primary"),
    "--accent":        ls.get("dev_accent"),
    "--card":          ls.get("dev_card"),
    "--popover":       ls.get("dev_card"),
  };
  Object.entries(map).forEach(([k, v]) => { if (v) document.documentElement.style.setProperty(k, v); });
}

function applyColors({ bg, fg, primary, accent, card }) {
  if (bg)      { document.documentElement.style.setProperty("--background", bg);           ls.set("dev_bg", bg); }
  if (fg)      { document.documentElement.style.setProperty("--foreground", fg);           ls.set("dev_fg", fg); }
  if (primary) {
    ["--primary", "--ring", "--sidebar-primary"].forEach(v => document.documentElement.style.setProperty(v, primary));
    ls.set("dev_primary", primary);
  }
  if (accent)  { document.documentElement.style.setProperty("--accent", accent);           ls.set("dev_accent", accent); }
  if (card)    { ["--card","--popover"].forEach(v => document.documentElement.style.setProperty(v, card)); ls.set("dev_card", card); }
}

// ─── HSL ↔ HEX ───────────────────────────────────────────────────────────────
function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = n => { const k = (n + h / 30) % 12; const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1); return Math.round(255 * c).toString(16).padStart(2, "0"); };
  return `#${f(0)}${f(8)}${f(4)}`;
}
function hexToHsl(hex) {
  let r = parseInt(hex.slice(1,3),16)/255, g = parseInt(hex.slice(3,5),16)/255, b = parseInt(hex.slice(5,7),16)/255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b); let h, s, l = (max+min)/2;
  if (max === min) { h = s = 0; } else {
    const d = max - min; s = l > 0.5 ? d/(2-max-min) : d/(max+min);
    switch(max) { case r: h=((g-b)/d+(g<b?6:0))/6; break; case g: h=((b-r)/d+2)/6; break; default: h=((r-g)/d+4)/6; }
  }
  return `${Math.round(h*360)} ${Math.round(s*100)}% ${Math.round(l*100)}%`;
}
function hslStringToHex(hsl) {
  if (!hsl) return "#000000";
  const p = hsl.trim().replace(/%/g,"").split(/\s+/);
  if (p.length < 3) return "#000000";
  return hslToHex(Number(p[0]), Number(p[1]), Number(p[2]));
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const COLOR_PRESETS = [
  { name: "أخضر إسلامي",  bg: "40 30% 97%",  fg: "160 30% 10%", primary: "158 45% 28%", accent: "43 80% 55%", card: "40 25% 99%"  },
  { name: "أزرق عميق",    bg: "220 30% 97%", fg: "220 30% 10%", primary: "217 71% 35%", accent: "43 80% 55%", card: "220 25% 99%" },
  { name: "بنفسجي راقي",  bg: "270 20% 97%", fg: "270 30% 10%", primary: "270 50% 38%", accent: "43 80% 55%", card: "270 15% 99%" },
  { name: "بني ذهبي",     bg: "35 30% 96%",  fg: "30 40% 10%",  primary: "30 50% 30%",  accent: "43 80% 55%", card: "35 25% 98%"  },
  { name: "داكن ليلي",    bg: "220 20% 8%",  fg: "220 10% 92%", primary: "217 71% 50%", accent: "43 80% 55%", card: "220 20% 12%" },
  { name: "أحمر داكن",   bg: "0 15% 97%",   fg: "0 30% 10%",   primary: "0 55% 35%",   accent: "43 80% 55%", card: "0 10% 99%"   },
  { name: "فيروزي",       bg: "185 25% 97%", fg: "185 35% 10%", primary: "185 60% 32%", accent: "43 80% 55%", card: "185 20% 99%" },
  { name: "وردي ناعم",   bg: "340 25% 97%", fg: "340 30% 10%", primary: "340 60% 40%", accent: "43 80% 55%", card: "340 20% 99%" },
];
const COLOR_FIELDS = [
  { key: "bg",      label: "الخلفية",       cssVar: "--background" },
  { key: "fg",      label: "النص",          cssVar: "--foreground" },
  { key: "primary", label: "اللون الأساسي", cssVar: "--primary" },
  { key: "accent",  label: "التمييز",       cssVar: "--accent" },
  { key: "card",    label: "البطاقات",      cssVar: "--card" },
];
const DEFAULT_CATEGORIES = ["القرآن وعلومه","الحديث الشريف","الفقه الإسلامي","السيرة النبوية","العقيدة","التزكية والرقائق","التاريخ الإسلامي","أخرى"];
const getStoredCategories = () => ls.getJson("dev_categories") || DEFAULT_CATEGORIES;
const emptyBook = { title:"", author:"", category:"القرآن وعلومه", description:"", cover_image:"", pages_count:"", language:"العربية", pdf_url:"", is_featured:false, rating:0 };

const LANG_OPTIONS = [
  { code: "ar", name: "العربية",    flag: "🇸🇦" },
  { code: "en", name: "English",    flag: "🇬🇧" },
  { code: "fr", name: "Français",   flag: "🇫🇷" },
  { code: "ur", name: "اردو",       flag: "🇵🇰" },
  { code: "hi", name: "हिंदी",       flag: "🇮🇳" },
  { code: "tr", name: "Türkçe",     flag: "🇹🇷" },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function DevPanel() {
  const [unlocked, setUnlocked]         = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [showPwd, setShowPwd]           = useState(false);
  const [activeTab, setActiveTab]       = useState("dashboard");

  // Colors
  const [colors, setColors]             = useState({ bg:"", fg:"", primary:"", accent:"", card:"" });
  const [selectedPreset, setSelectedPreset] = useState(null);

  // Save states
  const [savedStates, setSavedStates]   = useState({});
  const markSaved = key => { setSavedStates(s => ({...s, [key]:true})); setTimeout(() => setSavedStates(s => ({...s, [key]:false})), 2200); };

  // Logo & Name — load persisted values
  const [logoUrl, setLogoUrl]           = useState(() => ls.get("dev_logo_url") || "");
  const [appName, setAppName]           = useState(() => ls.get("dev_app_name") || "المكتبة الدينية");
  const [appSubtitle, setAppSubtitle]   = useState(() => ls.get("dev_app_subtitle") || "نور العلم والمعرفة");
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // YouTube
  const [youtubeUrl, setYoutubeUrl]     = useState(() => ls.get("dev_youtube_url") || "");
  const [youtubeLabel, setYoutubeLabel] = useState(() => ls.get("dev_youtube_label") || "قناتنا على يوتيوب");
  const [youtubeSub, setYoutubeSub]     = useState(() => ls.get("dev_youtube_sub") || "تابعونا على قناتنا لمزيد من المحتوى الإسلامي");

  // Books
  const [bookForm, setBookForm]         = useState(emptyBook);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [savingBook, setSavingBook]     = useState(false);

  // Admin
  const [books, setBooks]               = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [editDialog, setEditDialog]     = useState(false);
  const [editingBook, setEditingBook]   = useState(null);
  const [editForm, setEditForm]         = useState(emptyBook);
  const [editPdfUploading, setEditPdfUploading] = useState(false);
  const [editCoverUploading, setEditCoverUploading] = useState(false);
  const [savingEdit, setSavingEdit]     = useState(false);
  const [adminSearch, setAdminSearch]   = useState("");
  const [stats, setStats]               = useState({ total:0, featured:0, categories:0 });

  // App Settings — load persisted values
  const [showDevNav, setShowDevNav]     = useState(() => ls.get("dev_show_dev_nav") !== "false");
  const [appLang, setAppLang]           = useState(() => ls.get("dev_app_lang") || "ar");
  const [darkMode, setDarkMode]         = useState(() => ls.get("dev_dark_mode") === "true");

  // Categories
  const [categories, setCategories]     = useState(() => getStoredCategories());
  const [newCategory, setNewCategory]   = useState("");

  // Fonts
  const [fontSize, setFontSize]         = useState(() => Number(ls.get("dev_font_size")) || 16);
  const [fontCategory, setFontCategory] = useState("الكل");
  const [activeRoleTab, setActiveRoleTab] = useState("body");
  const [roleFonts, setRoleFonts]       = useState(() => {
    const init = {};
    FONT_ROLES.forEach(r => { init[r.key] = ls.get(`dev_font_${r.key}`) || ""; });
    return init;
  });

  // Password
  const [currentPwd, setCurrentPwd]    = useState("");
  const [newPwd, setNewPwd]             = useState("");
  const [confirmPwd, setConfirmPwd]     = useState("");

  useEffect(() => { applyStoredColors(); applyStoredFont(); }, []);
  useEffect(() => {
    if ((activeTab === "admin" || activeTab === "dashboard") && unlocked) loadBooks();
  }, [activeTab, unlocked]);

  // ── Init colors state from saved values
  useEffect(() => {
    setColors({
      bg:      ls.get("dev_bg") || "",
      fg:      ls.get("dev_fg") || "",
      primary: ls.get("dev_primary") || "",
      accent:  ls.get("dev_accent") || "",
      card:    ls.get("dev_card") || "",
    });
  }, [unlocked]);

  const loadBooks = async () => {
    setLoadingBooks(true);
    const all = await base44.entities.Book.list('-created_date', 1000);
    setBooks(all);
    const cats = new Set(all.map(b => b.category));
    setStats({ total: all.length, featured: all.filter(b => b.is_featured).length, categories: cats.size });
    setLoadingBooks(false);
  };

  const handleUnlock = () => {
    if (passwordInput === getPassword()) setUnlocked(true);
    else toast.error("كلمة المرور غير صحيحة");
  };

  // ── Colors ──
  const handleApplyPreset = preset => {
    setSelectedPreset(preset.name);
    setColors({ bg: preset.bg, fg: preset.fg, primary: preset.primary, accent: preset.accent, card: preset.card });
    applyColors(preset);
    toast.success(`تم تطبيق: ${preset.name}`);
  };
  const handleApplyCustom = () => {
    const hasAny = Object.values(colors).some(v => v.trim() !== "");
    if (!hasAny) { toast.error("أدخل قيمة لون أو اختر ثيماً"); return; }
    applyColors(colors);
    markSaved("colors");
    toast.success("تم حفظ الألوان بشكل دائم ✓");
  };
  const handleResetColors = () => {
    ["dev_bg","dev_fg","dev_primary","dev_accent","dev_card"].forEach(k => ls.remove(k));
    ["--background","--foreground","--primary","--ring","--sidebar-primary","--accent","--card","--popover"]
      .forEach(v => document.documentElement.style.removeProperty(v));
    setColors({ bg:"", fg:"", primary:"", accent:"", card:"" });
    setSelectedPreset(null);
    toast.success("تم إعادة الألوان للافتراضي");
  };

  // ── Dark Mode ──
  const handleToggleDark = val => {
    setDarkMode(val);
    document.documentElement.classList.toggle("dark", val);
    ls.set("dev_dark_mode", String(val));
    toast.success(val ? "تم تفعيل الوضع الليلي ✓" : "تم تفعيل الوضع النهاري ✓");
  };

  // ── Logo ──
  const handleLogoUpload = async e => {
    const file = e.target.files[0]; if (!file) return;
    setUploadingLogo(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setLogoUrl(file_url); ls.set("dev_logo_url", file_url);
    setUploadingLogo(false); toast.success("تم رفع الشعار ✓");
  };
  const handleSaveAppName = () => {
    ls.set("dev_app_name", appName);
    ls.set("dev_app_subtitle", appSubtitle);
    markSaved("appName");
    toast.success("تم الحفظ بشكل دائم ✓");
  };

  // ── YouTube ──
  const handleSaveYoutube = () => {
    ls.set("dev_youtube_url", youtubeUrl);
    ls.set("dev_youtube_label", youtubeLabel);
    ls.set("dev_youtube_sub", youtubeSub);
    markSaved("youtube");
    toast.success("تم حفظ إعدادات يوتيوب بشكل دائم ✓");
  };

  // ── Books ──
  const handlePdfUpload = async (e, isEdit = false) => {
    const file = e.target.files[0]; if (!file) return;
    if (isEdit) setEditPdfUploading(true); else setPdfUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    if (isEdit) { setEditForm(p => ({...p, pdf_url: file_url})); setEditPdfUploading(false); }
    else        { setBookForm(p => ({...p, pdf_url: file_url})); setPdfUploading(false); }
    toast.success("تم رفع PDF ✓");
  };
  const handleCoverUpload = async (e, isEdit = false) => {
    const file = e.target.files[0]; if (!file) return;
    if (isEdit) setEditCoverUploading(true); else setCoverUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    if (isEdit) { setEditForm(p => ({...p, cover_image: file_url})); setEditCoverUploading(false); }
    else        { setBookForm(p => ({...p, cover_image: file_url})); setCoverUploading(false); }
    toast.success("تم رفع الغلاف ✓");
  };
  const handleAddBook = async () => {
    if (!bookForm.title || !bookForm.author) { toast.error("أدخل العنوان والمؤلف"); return; }
    setSavingBook(true);
    await base44.entities.Book.create({
      ...bookForm,
      pages_count: bookForm.pages_count ? Number(bookForm.pages_count) : null,
      rating: Number(bookForm.rating) || 0,
    });
    toast.success("تمت إضافة الكتاب بنجاح ✓");
    setBookForm(emptyBook);
    loadBooks();
    setSavingBook(false);
  };

  // ── Admin ──
  const openEdit = book => {
    setEditingBook(book);
    setEditForm({ title: book.title||"", author: book.author||"", category: book.category||"القرآن وعلومه", description: book.description||"", cover_image: book.cover_image||"", pages_count: book.pages_count||"", language: book.language||"العربية", pdf_url: book.pdf_url||"", is_featured: book.is_featured||false, rating: book.rating||0 });
    setEditDialog(true);
  };
  const handleSaveEdit = async () => {
    if (!editingBook) return;
    setSavingEdit(true);
    await base44.entities.Book.update(editingBook.id, { ...editForm, pages_count: editForm.pages_count ? Number(editForm.pages_count) : null, rating: Number(editForm.rating)||0 });
    markSaved("editBook");
    toast.success("تم التحديث بنجاح ✓");
    setTimeout(() => setEditDialog(false), 800);
    loadBooks();
    setSavingEdit(false);
  };
  const handleDelete = async book => {
    if (!confirm(`حذف "${book.title}"؟`)) return;
    await base44.entities.Book.delete(book.id);
    toast.success("تم الحذف");
    loadBooks();
  };

  // ── Password ──
  const handleChangePassword = () => {
    if (currentPwd !== getPassword()) { toast.error("كلمة المرور الحالية خاطئة"); return; }
    if (newPwd.length < 4)            { toast.error("كلمة المرور قصيرة جداً (4 أحرف على الأقل)"); return; }
    if (newPwd !== confirmPwd)        { toast.error("كلمتا المرور غير متطابقتين"); return; }
    ls.set(DEV_PASSWORD_KEY, newPwd);
    markSaved("password");
    toast.success("تم تغيير كلمة المرور ✓");
    setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
  };

  // ── App Settings ──
  const handleSaveAppSettings = () => {
    ls.set("dev_show_dev_nav", String(showDevNav));
    ls.set("dev_app_lang", appLang);
    window.dispatchEvent(new Event("storage"));
    markSaved("appSettings");
    toast.success("تم حفظ الإعدادات بشكل دائم ✓ — أعد تحميل الصفحة لتطبيق اللغة");
  };
  const handleSaveAndReload = () => {
    ls.set("dev_show_dev_nav", String(showDevNav));
    ls.set("dev_app_lang", appLang);
    window.dispatchEvent(new Event("storage"));
    toast.success("تم الحفظ — جاري إعادة التحميل...");
    setTimeout(() => window.location.reload(), 800);
  };

  // ── Categories ──
  const saveCategories = cats => { ls.setJson("dev_categories", cats); setCategories(cats); };
  const handleAddCategory = () => {
    const t = newCategory.trim();
    if (!t) { toast.error("أدخل اسم التصنيف"); return; }
    if (categories.includes(t)) { toast.error("التصنيف موجود مسبقاً"); return; }
    saveCategories([...categories, t]);
    setNewCategory("");
    toast.success("تم إضافة التصنيف ✓");
  };
  const handleRemoveCategory = cat => {
    if (!confirm(`حذف تصنيف "${cat}"؟`)) return;
    saveCategories(categories.filter(c => c !== cat));
    toast.success("تم حذف التصنيف");
  };
  const handleResetCategories = () => { saveCategories(DEFAULT_CATEGORIES); toast.success("تم إعادة التصنيفات للافتراضية"); };

  // ── Fonts ──
  const handleSaveFont = preset => {
    const role = FONT_ROLES.find(r => r.key === activeRoleTab);
    if (role) {
      injectRoleFont(role, preset);
      setRoleFonts(prev => ({...prev, [activeRoleTab]: preset.name}));
      toast.success(`تم تطبيق "${preset.label}" على ${role.label} بشكل دائم ✓`);
    }
  };
  const handleFontSizeChange = size => {
    setFontSize(size);
    document.documentElement.style.setProperty("font-size", `${size}px`);
    ls.set("dev_font_size", String(size));
  };
  const handleResetFont = () => {
    FONT_ROLES.forEach(role => { ls.remove(`dev_font_${role.key}`); document.documentElement.style.removeProperty(role.cssVar); });
    ls.remove("dev_font_size");
    document.documentElement.style.removeProperty("font-size");
    setFontSize(16);
    setRoleFonts(Object.fromEntries(FONT_ROLES.map(r => [r.key, ""])));
    toast.success("تم إعادة جميع الخطوط للافتراضي");
  };

  // ── Tabs ──
  const tabs = [
    { id:"dashboard",    label:"لوحة التحكم",    icon: LayoutDashboard },
    { id:"color",        label:"الألوان",         icon: Palette },
    { id:"fonts",        label:"الخطوط",          icon: Type },
    { id:"logo",         label:"الشعار والاسم",   icon: Image },
    { id:"youtube",      label:"يوتيوب",          icon: Youtube },
    { id:"book",         label:"إضافة كتاب",      icon: BookPlus },
    { id:"admin",        label:"إدارة الكتب",     icon: BookOpen },
    { id:"categories",   label:"التصنيفات",       icon: Tags },
    { id:"app_settings", label:"إعدادات التطبيق", icon: Settings },
    { id:"password",     label:"كلمة المرور",     icon: KeyRound },
  ];

  // ── Lock screen ──
  if (!unlocked) return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
        className="bg-card border border-border rounded-2xl p-8 w-full max-w-sm shadow-xl">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-primary/10 mb-4 rounded-2xl w-16 h-16 flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-xl font-black">لوحة المطور</h1>
          <p className="text-sm text-muted-foreground mt-1">أدخل كلمة المرور للمتابعة</p>
        </div>
        <div className="space-y-4">
          <div className="relative">
            <Input type={showPwd ? "text" : "password"} value={passwordInput}
              onChange={e => setPasswordInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleUnlock()}
              placeholder="كلمة المرور" className="h-12 rounded-xl pl-10" />
            <button onClick={() => setShowPwd(!showPwd)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <Button onClick={handleUnlock} className="w-full h-12 rounded-xl font-bold text-base gap-2">
            <Shield className="w-4 h-4" /> دخول
          </Button>
        </div>
      </motion.div>
    </div>
  );

  const categoryOptions = categories;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" /> لوحة المطور
        </h1>
        <div className="flex items-center gap-2">
          <button onClick={handleToggleDark} className="p-2 rounded-xl border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button onClick={() => { setUnlocked(false); setPasswordInput(""); }}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 border border-border rounded-lg px-3 py-1.5">
            <Lock className="w-3 h-3" /> قفل
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all shadow-sm ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-primary/30 scale-[1.03]"
                : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-muted/50"
            }`}>
            <tab.icon className="w-3.5 h-3.5" /> {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">

        {/* ─── Dashboard ─── */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <h2 className="text-base font-bold flex items-center gap-2"><Sparkles className="w-4 h-4 text-accent" /> نظرة عامة</h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-primary/10 rounded-2xl p-4 text-center border border-primary/20">
                <p className="text-3xl font-black text-primary">{stats.total}</p>
                <p className="text-xs text-muted-foreground mt-1 font-medium">إجمالي الكتب</p>
              </div>
              <div className="bg-accent/10 rounded-2xl p-4 text-center border border-accent/20">
                <p className="text-3xl font-black text-accent">{stats.featured}</p>
                <p className="text-xs text-muted-foreground mt-1 font-medium">كتاب مميز</p>
              </div>
              <div className="bg-muted rounded-2xl p-4 text-center border border-border">
                <p className="text-3xl font-black">{stats.categories}</p>
                <p className="text-xs text-muted-foreground mt-1 font-medium">تصنيف</p>
              </div>
            </div>
            {books.length > 0 && (() => {
              const withPdf = books.filter(b => b.pdf_url).length;
              const pct = Math.round((withPdf / books.length) * 100);
              return (
                <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>تغطية PDF</span>
                    <span className="text-primary">{withPdf}/{books.length} ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-border overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })()}
            <div className="grid grid-cols-2 gap-2">
              {[
                { id:"book",       icon:BookPlus,  label:"إضافة كتاب",    cls:"default" },
                { id:"admin",      icon:BookOpen,  label:"إدارة الكتب",   cls:"outline" },
                { id:"color",      icon:Palette,   label:"الألوان",       cls:"outline" },
                { id:"fonts",      icon:Type,      label:"الخطوط",        cls:"outline" },
                { id:"youtube",    icon:Youtube,   label:"يوتيوب",        cls:"outline" },
                { id:"categories", icon:Tags,      label:"التصنيفات",     cls:"outline" },
              ].map(({ id, icon: Ic, label, cls }) => (
                <Button key={id} variant={cls} onClick={() => setActiveTab(id)} className="rounded-xl gap-2 h-11 font-bold text-sm">
                  <Ic className="w-4 h-4" /> {label}
                </Button>
              ))}
            </div>
            <div>
              <p className="text-sm font-semibold mb-3">آخر الكتب المضافة</p>
              {loadingBooks
                ? <div className="flex justify-center py-6"><div className="w-6 h-6 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
                : <div className="space-y-2">
                    {books.slice(0,6).map(book => (
                      <div key={book.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                        <div className="w-8 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                          {book.cover_image ? <img src={book.cover_image} alt="" className="w-full h-full object-cover" /> : <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate">{book.title}</p>
                          <p className="text-xs text-muted-foreground">{book.author} · {book.category}</p>
                        </div>
                        <div className="flex flex-col gap-1 items-end shrink-0">
                          {book.pdf_url ? <span className="text-[10px] text-green-600 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full font-medium">PDF ✓</span> : <span className="text-[10px] text-orange-500 bg-orange-50 dark:bg-orange-900/30 px-2 py-0.5 rounded-full font-medium">بدون PDF</span>}
                          {book.is_featured && <span className="text-[10px] text-accent bg-accent/10 px-2 py-0.5 rounded-full font-medium">⭐ مميز</span>}
                        </div>
                      </div>
                    ))}
                  </div>
              }
            </div>
          </div>
        )}

        {/* ─── Colors ─── */}
        {activeTab === "color" && (
          <div className="space-y-6">
            <h2 className="text-base font-bold flex items-center gap-2"><Palette className="w-4 h-4" /> تخصيص ألوان التطبيق</h2>
            <div className="p-4 rounded-2xl border-2 border-dashed border-border bg-muted/20">
              <p className="text-xs text-muted-foreground mb-3 text-center">معاينة فورية للألوان</p>
              <div className="rounded-xl overflow-hidden border border-border shadow-sm">
                <div style={{ background: colors.bg ? `hsl(${colors.bg})` : undefined }} className="bg-card px-4 py-2.5 flex items-center gap-2 border-b border-border">
                  <div style={{ background: colors.primary ? `hsl(${colors.primary})` : undefined }} className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                    <BookOpen className="w-3.5 h-3.5" style={{ color:"white" }} />
                  </div>
                  <span style={{ color: colors.fg ? `hsl(${colors.fg})` : undefined }} className="text-xs font-bold text-foreground">المكتبة الدينية</span>
                  <div className="flex gap-1 mr-auto">
                    {["الرئيسية","المكتبة","المفضلة"].map((n,i) => (
                      <span key={i} style={i===0 ? { background: colors.primary ? `hsl(${colors.primary})` : undefined, color:"white" } : { color: colors.fg ? `hsl(${colors.fg})` : undefined }}
                        className={`text-[9px] px-2 py-0.5 rounded-md ${i===0 ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{n}</span>
                    ))}
                  </div>
                </div>
                <div style={{ background: colors.primary ? `hsl(${colors.primary})` : undefined }} className="bg-primary px-4 py-4">
                  <p className="text-white text-xs font-bold mb-1">اقرأ وتعلّم وتدبّر</p>
                  <span style={{ background: colors.accent ? `hsl(${colors.accent})` : undefined }} className="inline-block bg-accent text-[9px] font-bold px-3 py-1 rounded-lg text-foreground">تصفح المكتبة</span>
                </div>
                <div style={{ background: colors.bg ? `hsl(${colors.bg})` : undefined }} className="bg-background px-3 py-3 grid grid-cols-3 gap-2">
                  {[1,2,3].map(i => (
                    <div key={i} style={{ background: colors.card ? `hsl(${colors.card})` : undefined }} className="bg-card rounded-lg p-2 border border-border">
                      <div style={{ background: colors.primary ? `hsl(${colors.primary})` : undefined, opacity:0.2 }} className="rounded h-8 mb-1.5 bg-primary/20" />
                      <div className="bg-foreground/20 rounded h-2 w-3/4 mb-1" /><div className="bg-foreground/10 rounded h-1.5 w-1/2" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-3">ثيمات جاهزة</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {COLOR_PRESETS.map(p => (
                  <button key={p.name} onClick={() => handleApplyPreset(p)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${selectedPreset===p.name ? "border-primary bg-primary/10 shadow-md" : "border-border hover:border-primary/40"}`}>
                    <div className="flex gap-0.5 rounded-md overflow-hidden shadow-sm">
                      <div className="w-6 h-9" style={{ background:`hsl(${p.bg})`, border:"1px solid hsl(0 0% 80%)" }} />
                      <div className="w-6 h-9" style={{ background:`hsl(${p.primary})` }} />
                      <div className="w-6 h-9" style={{ background:`hsl(${p.accent})` }} />
                      <div className="w-6 h-9" style={{ background:`hsl(${p.card})`, border:"1px solid hsl(0 0% 80%)" }} />
                    </div>
                    <span className="text-[10px] font-medium text-center leading-tight">{p.name}</span>
                    {selectedPreset===p.name && <Check className="w-3 h-3 text-primary" />}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-1"><Pipette className="w-3.5 h-3.5" /> ضبط دقيق</p>
              <div className="grid grid-cols-1 gap-3">
                {COLOR_FIELDS.map(({ key, label, cssVar }) => {
                  const hexVal = colors[key] ? hslStringToHex(colors[key]) : hslStringToHex(getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim());
                  return (
                    <div key={key} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border hover:border-primary/30 transition-colors">
                      <label className="relative shrink-0 cursor-pointer group">
                        <div className="w-12 h-12 rounded-xl border-2 border-border shadow-sm group-hover:scale-105 transition-transform overflow-hidden" style={{ background: colors[key] ? `hsl(${colors[key]})` : hexVal }}>
                          <input type="color" value={hexVal} onChange={e => {
                            const hsl = hexToHsl(e.target.value);
                            setColors(c => ({...c, [key]: hsl}));
                            applyColors({ [key]: hsl });
                          }} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                        </div>
                      </label>
                      <div className="flex-1">
                        <Label className="text-xs font-bold">{label}</Label>
                        <div className="flex gap-1.5 mt-1">
                          <Input value={colors[key]} onChange={e => setColors(c => ({...c, [key]: e.target.value}))} placeholder="158 45% 28%" className="h-7 text-xs flex-1 font-mono" />
                          <span className="text-[9px] font-mono text-muted-foreground self-center shrink-0 bg-muted px-1.5 py-1 rounded">{hexVal}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={handleApplyCustom} className={`flex-1 rounded-xl h-11 gap-2 font-bold transition-all ${savedStates.colors ? "bg-green-600 hover:bg-green-700" : ""}`}>
                  {savedStates.colors ? <><Check className="w-4 h-4" /> تم الحفظ!</> : <><Palette className="w-4 h-4" /> تطبيق وحفظ الألوان</>}
                </Button>
                <Button variant="outline" onClick={handleResetColors} className="rounded-xl h-11 gap-1.5 shrink-0 font-bold hover:border-destructive/50 hover:text-destructive">
                  <RotateCcw className="w-3.5 h-3.5" /> إعادة
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Fonts ─── */}
        {activeTab === "fonts" && (
          <div className="space-y-5">
            <h2 className="text-base font-bold flex items-center gap-2"><Type className="w-4 h-4" /> تخصيص الخطوط</h2>
            <div className="p-4 rounded-2xl border-2 border-dashed border-border bg-muted/20">
              <p className="text-xs text-muted-foreground mb-3 text-center font-medium">معاينة مباشرة</p>
              <div className="bg-card rounded-xl p-4 border border-border space-y-2">
                <p className="text-xl font-bold" style={{ fontFamily: (roleFonts.heading && FONT_PRESETS.find(f=>f.name===roleFonts.heading)?.value)||undefined }}>المكتبة الإسلامية الرقمية</p>
                <p className="text-sm font-semibold" style={{ fontFamily: (roleFonts.title && FONT_PRESETS.find(f=>f.name===roleFonts.title)?.value)||undefined }}>صحيح البخاري — الإمام البخاري</p>
                <p className="text-sm text-muted-foreground" style={{ fontFamily: (roleFonts.body && FONT_PRESETS.find(f=>f.name===roleFonts.body)?.value)||undefined }}>بسم الله الرحمن الرحيم</p>
                <p className="text-sm text-muted-foreground" style={{ fontFamily: (roleFonts.body && FONT_PRESETS.find(f=>f.name===roleFonts.body)?.value)||undefined, direction:"ltr", textAlign:"left" }}>نمونہ متن اردو — Urdu Sample Text</p>
                <div className="flex gap-2 mt-2">
                  <span className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-lg" style={{ fontFamily: (roleFonts.button && FONT_PRESETS.find(f=>f.name===roleFonts.button)?.value)||undefined }}>تصفح المكتبة</span>
                  <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-lg" style={{ fontFamily: (roleFonts.nav && FONT_PRESETS.find(f=>f.name===roleFonts.nav)?.value)||undefined }}>الرئيسية</span>
                </div>
              </div>
            </div>
            <div className="p-4 bg-muted/40 rounded-xl border border-border space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold">حجم الخط الأساسي</p>
                <span className="text-sm font-mono font-bold text-primary">{fontSize}px</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {[13,14,15,16,17,18,20].map(size => (
                  <button key={size} onClick={() => handleFontSizeChange(size)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-2 ${fontSize===size ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/40"}`}>
                    {size}px
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium">اختر العنصر:</p>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {FONT_ROLES.map(role => (
                  <button key={role.key} onClick={() => setActiveRoleTab(role.key)}
                    className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl border-2 whitespace-nowrap transition-all shrink-0 min-w-[80px] ${activeRoleTab===role.key ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                    <span className="text-xs font-bold">{role.label}</span>
                    {roleFonts[role.key]
                      ? <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-medium truncate max-w-[70px]">{roleFonts[role.key]}</span>
                      : <span className="text-[9px] text-muted-foreground">افتراضي</span>
                    }
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {["الكل","حديث","أوردو","كلاسيكي","قرآني","زخرفي"].map(cat => (
                <button key={cat} onClick={() => setFontCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border-2 shrink-0 ${fontCategory===cat ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                  {cat}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-2">
              {FONT_PRESETS.filter(p => fontCategory==="الكل" || p.category===fontCategory).map(preset => {
                const isActive = roleFonts[activeRoleTab] === preset.name;
                return (
                  <button key={preset.name} onClick={() => handleSaveFont(preset)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-right w-full ${isActive ? "border-primary bg-primary/5 shadow-md shadow-primary/10" : "border-border hover:border-primary/40 hover:bg-muted/40"}`}>
                    <div className="shrink-0 w-12 h-12 rounded-xl bg-muted flex items-center justify-center border border-border">
                      <span className="text-2xl font-bold" style={{ fontFamily: preset.value }}>{preset.category === "أوردو" ? "ا" : "أ"}</span>
                    </div>
                    <div className="flex-1 min-w-0 text-right">
                      <div className="flex items-center justify-between">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${
                          preset.category==="حديث" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
                          preset.category==="أوردو" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" :
                          preset.category==="كلاسيكي" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" :
                          preset.category==="قرآني" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" :
                          "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                        }`}>{preset.category}</span>
                        {isActive && <Check className="w-4 h-4 text-primary shrink-0" />}
                      </div>
                      <p className="text-sm font-bold mt-0.5" style={{ fontFamily: preset.value }}>{preset.label}</p>
                      <p className="text-xs text-muted-foreground truncate" style={{ fontFamily: preset.value }}>
                        {FONT_ROLES.find(r => r.key===activeRoleTab)?.sample || "بسم الله الرحمن الرحيم"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
            <Button variant="outline" onClick={handleResetFont} className="w-full rounded-xl h-11 gap-2 font-bold hover:border-destructive/50 hover:text-destructive">
              <RotateCcw className="w-3.5 h-3.5" /> إعادة جميع الخطوط للافتراضي
            </Button>
          </div>
        )}

        {/* ─── Logo ─── */}
        {activeTab === "logo" && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl border-2 border-dashed border-border bg-muted/30">
              <p className="text-xs text-muted-foreground mb-3 text-center">معاينة مباشرة للهيدر</p>
              <div className="flex items-center gap-3 bg-card rounded-xl px-4 py-3 border border-border shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center overflow-hidden shrink-0">
                  {logoUrl ? <img src={logoUrl} alt="logo" className="w-full h-full object-cover" /> : <BookOpen className="w-5 h-5 text-primary-foreground" />}
                </div>
                <div>
                  <p className="text-sm font-bold leading-tight">{appName || "اسم التطبيق"}</p>
                  <p className="text-[10px] text-muted-foreground">{appSubtitle || "الوصف"}</p>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-sm font-bold mb-3 flex items-center gap-2"><Image className="w-4 h-4" /> الشعار</h2>
              <div className="flex gap-3 items-start">
                <div className="w-16 h-16 rounded-2xl border-2 border-border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                  {logoUrl ? <img src={logoUrl} alt="logo" className="w-full h-full object-cover" /> : <BookOpen className="w-6 h-6 text-muted-foreground" />}
                </div>
                <div className="flex-1 space-y-2">
                  <label className="cursor-pointer block">
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    <div className="flex items-center justify-center gap-2 h-10 rounded-xl border-2 border-dashed border-border hover:border-primary/40 transition-colors">
                      {uploadingLogo ? <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /> : <><Upload className="w-4 h-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">رفع صورة</span></>}
                    </div>
                  </label>
                  {logoUrl && <button onClick={() => { ls.remove("dev_logo_url"); setLogoUrl(""); toast.success("تم حذف الشعار"); }} className="text-xs text-destructive hover:underline">حذف الشعار</button>}
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-sm font-bold flex items-center gap-2"><Sparkles className="w-4 h-4" /> اسم التطبيق والوصف</h2>
              <div>
                <Label>الاسم الرئيسي</Label>
                <Input value={appName} onChange={e => setAppName(e.target.value)} className="mt-1.5" placeholder="المكتبة الدينية" />
              </div>
              <div>
                <Label>الوصف الفرعي</Label>
                <Input value={appSubtitle} onChange={e => setAppSubtitle(e.target.value)} className="mt-1.5" placeholder="نور العلم والمعرفة" />
              </div>
            </div>
            <Button onClick={handleSaveAppName} className={`w-full h-11 rounded-xl gap-2 font-bold transition-all ${savedStates.appName ? "bg-green-600 hover:bg-green-700" : ""}`}>
              {savedStates.appName ? <><Check className="w-4 h-4" /> تم الحفظ!</> : <><Image className="w-4 h-4" /> حفظ بشكل دائم</>}
            </Button>
          </div>
        )}

        {/* ─── YouTube ─── */}
        {activeTab === "youtube" && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-l from-red-500/10 to-red-600/5 border border-red-200/60 dark:border-red-800/40">
              <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center shrink-0 shadow-lg shadow-red-500/30">
                <Youtube className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold">إعدادات قناة يوتيوب</h2>
                <p className="text-xs text-muted-foreground mt-0.5">يظهر كبانر في الصفحة الرئيسية</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label>رابط القناة</Label>
                <div className="relative mt-1.5">
                  <Youtube className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                  <Input value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} className="pr-9" placeholder="https://youtube.com/@channel" dir="ltr" />
                </div>
              </div>
              <div><Label>نص العنوان</Label><Input value={youtubeLabel} onChange={e => setYoutubeLabel(e.target.value)} className="mt-1.5" /></div>
              <div><Label>نص الوصف</Label><Input value={youtubeSub} onChange={e => setYoutubeSub(e.target.value)} className="mt-1.5" /></div>
              <div className="p-4 rounded-2xl bg-muted/30 border-2 border-dashed border-border">
                <div className="flex items-center gap-4 p-3 rounded-xl bg-gradient-to-l from-red-600/10 to-red-500/5 border border-red-200/50">
                  <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center shrink-0">
                    <Youtube className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">{youtubeLabel || "قناتنا"}</p>
                    <p className="text-xs text-muted-foreground">{youtubeSub || "تابعونا"}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
                </div>
                <p className={`text-center text-xs mt-2 font-medium ${youtubeUrl ? "text-green-600" : "text-orange-500"}`}>
                  {youtubeUrl ? "✓ البانر نشط" : "⚠ أدخل رابط القناة لتفعيل البانر"}
                </p>
              </div>
              <Button onClick={handleSaveYoutube} className={`w-full h-12 rounded-xl gap-2 font-bold transition-all ${savedStates.youtube ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700 text-white"}`}>
                {savedStates.youtube ? <><Check className="w-4 h-4" /> تم الحفظ!</> : <><Youtube className="w-4 h-4" /> حفظ إعدادات يوتيوب</>}
              </Button>
            </div>
          </div>
        )}

        {/* ─── Add Book ─── */}
        {activeTab === "book" && (
          <div className="space-y-4">
            <h2 className="text-base font-bold flex items-center gap-2"><BookPlus className="w-4 h-4" /> إضافة كتاب جديد</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label>العنوان *</Label><Input value={bookForm.title} onChange={e => setBookForm(p=>({...p,title:e.target.value}))} className="mt-1.5" placeholder="عنوان الكتاب" /></div>
              <div><Label>المؤلف *</Label><Input value={bookForm.author} onChange={e => setBookForm(p=>({...p,author:e.target.value}))} className="mt-1.5" placeholder="اسم المؤلف" /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label>التصنيف</Label>
                <select value={bookForm.category} onChange={e => setBookForm(p=>({...p,category:e.target.value}))} className="mt-1.5 w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                  {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div><Label>عدد الصفحات</Label><Input type="number" value={bookForm.pages_count} onChange={e => setBookForm(p=>({...p,pages_count:e.target.value}))} className="mt-1.5" placeholder="0" /></div>
              <div><Label>التقييم (0-5)</Label><Input type="number" min={0} max={5} step={0.5} value={bookForm.rating} onChange={e => setBookForm(p=>({...p,rating:e.target.value}))} className="mt-1.5" /></div>
            </div>
            <div><Label>الوصف</Label><Textarea value={bookForm.description} onChange={e => setBookForm(p=>({...p,description:e.target.value}))} className="mt-1.5" rows={3} placeholder="وصف مختصر..." /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>صورة الغلاف</Label>
                <label className="cursor-pointer block mt-1.5">
                  <input type="file" accept="image/*" onChange={e => handleCoverUpload(e, false)} className="hidden" />
                  <div className={`flex items-center justify-center gap-2 h-10 rounded-xl border-2 border-dashed transition-colors ${bookForm.cover_image ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                    {coverUploading ? <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /> : bookForm.cover_image ? <><Check className="w-4 h-4 text-primary" /><span className="text-xs text-primary font-medium">تم ✓</span></> : <><Upload className="w-4 h-4 text-muted-foreground" /><span className="text-xs text-muted-foreground">رفع الغلاف</span></>}
                  </div>
                </label>
                {bookForm.cover_image && <Input value={bookForm.cover_image} onChange={e => setBookForm(p=>({...p,cover_image:e.target.value}))} className="text-xs h-8 mt-1.5 font-mono" />}
              </div>
              <div>
                <Label>ملف PDF</Label>
                <label className="cursor-pointer block mt-1.5">
                  <input type="file" accept=".pdf" onChange={e => handlePdfUpload(e, false)} className="hidden" />
                  <div className={`flex items-center justify-center gap-2 h-10 rounded-xl border-2 border-dashed transition-colors ${bookForm.pdf_url ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                    {pdfUploading ? <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /> : bookForm.pdf_url ? <><Check className="w-4 h-4 text-primary" /><span className="text-xs text-primary font-medium">PDF ✓</span></> : <><Upload className="w-4 h-4 text-muted-foreground" /><span className="text-xs text-muted-foreground">رفع PDF</span></>}
                  </div>
                </label>
                <Input value={bookForm.pdf_url} onChange={e => setBookForm(p=>({...p,pdf_url:e.target.value}))} placeholder="أو رابط PDF مباشر" className="text-xs h-8 mt-1.5" />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl border border-border">
              <Label className="cursor-pointer">كتاب مميز ⭐</Label>
              <Switch checked={bookForm.is_featured} onCheckedChange={v => setBookForm(p=>({...p,is_featured:v}))} />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddBook} disabled={savingBook} className="flex-1 rounded-xl h-12 font-bold gap-2">
                {savingBook ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> جاري الإضافة...</> : <><BookPlus className="w-4 h-4" /> إضافة الكتاب</>}
              </Button>
              <Button variant="outline" onClick={() => setBookForm(emptyBook)} className="rounded-xl h-12 px-4 font-bold hover:border-destructive/50 hover:text-destructive">
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ─── Admin Books ─── */}
        {activeTab === "admin" && (() => {
          const filtered = books.filter(b => !adminSearch || b.title?.includes(adminSearch) || b.author?.includes(adminSearch) || b.category?.includes(adminSearch));
          return (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold">إدارة الكتب — <span className="text-primary">{books.length}</span> كتاب</h2>
                <button onClick={loadBooks} className="p-2 rounded-lg hover:bg-muted transition-colors">
                  <RefreshCw className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="relative mb-4">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={adminSearch} onChange={e => setAdminSearch(e.target.value)} placeholder="بحث في الكتب..." className="pr-9 h-9 rounded-xl text-sm" />
              </div>
              {loadingBooks
                ? <div className="flex justify-center py-10"><div className="w-7 h-7 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
                : <div className="divide-y divide-border max-h-[60vh] overflow-y-auto">
                    {filtered.map(book => (
                      <div key={book.id} className="flex items-center gap-3 py-3 hover:bg-muted/30 rounded-xl px-1 transition-colors">
                        <div className="w-10 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                          {book.cover_image ? <img src={book.cover_image} alt="" className="w-full h-full object-cover" /> : <BookOpen className="w-4 h-4 text-muted-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate">{book.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{book.author} · {book.category}</p>
                          <div className="flex gap-1 mt-0.5">
                            {book.pdf_url && <span className="text-[10px] text-green-600">✓ PDF</span>}
                            {book.is_featured && <span className="text-[10px] text-accent">⭐ مميز</span>}
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => openEdit(book)} className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors"><Pencil className="w-3.5 h-3.5 text-primary" /></button>
                          <button onClick={() => handleDelete(book)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                        </div>
                      </div>
                    ))}
                    {filtered.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">لا توجد نتائج</p>}
                  </div>
              }
            </div>
          );
        })()}

        {/* ─── Categories ─── */}
        {activeTab === "categories" && (
          <div className="space-y-5">
            <h2 className="text-base font-bold flex items-center gap-2"><Tags className="w-4 h-4" /> إدارة التصنيفات</h2>
            <p className="text-xs text-muted-foreground">التغييرات تُحفظ بشكل دائم وتُطبَّق فوراً.</p>
            <div className="flex gap-2">
              <Input value={newCategory} onChange={e => setNewCategory(e.target.value)} onKeyDown={e => e.key==="Enter" && handleAddCategory()} placeholder="اسم التصنيف الجديد..." className="flex-1" />
              <Button onClick={handleAddCategory} className="gap-1.5 rounded-xl shrink-0">
                <Plus className="w-4 h-4" /> إضافة
              </Button>
            </div>
            <div className="space-y-2">
              {categories.map(cat => (
                <div key={cat} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border">
                  <span className="text-sm font-medium">{cat}</span>
                  <button onClick={() => handleRemoveCategory(cat)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                    <X className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              ))}
            </div>
            <Button variant="outline" onClick={handleResetCategories} className="w-full rounded-xl h-11 gap-2 font-bold hover:border-primary/50 hover:bg-primary/5">
              <RotateCcw className="w-3.5 h-3.5" /> إعادة للافتراضية
            </Button>
          </div>
        )}

        {/* ─── App Settings ─── */}
        {activeTab === "app_settings" && (
          <div className="space-y-5">
            <h2 className="text-base font-bold flex items-center gap-2"><Settings className="w-4 h-4" /> إعدادات التطبيق</h2>

            {/* Dark mode */}
            <div className="p-4 bg-muted/50 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                {darkMode ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
                <div>
                  <p className="text-sm font-semibold">الوضع الليلي</p>
                  <p className="text-xs text-muted-foreground mt-0.5">يُحفظ بشكل دائم</p>
                </div>
              </div>
              <Switch checked={darkMode} onCheckedChange={handleToggleDark} />
            </div>

            {/* Language */}
            <div className="p-4 bg-muted/50 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold">لغة واجهة التطبيق</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {LANG_OPTIONS.map(({ code, name, flag }) => (
                  <label key={code} className={`flex items-center gap-2 p-2.5 rounded-xl border-2 cursor-pointer transition-all ${appLang===code ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                    <input type="radio" name="appLangSettings" value={code} checked={appLang===code} onChange={() => setAppLang(code)} className="hidden" />
                    <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${appLang===code ? "border-primary bg-primary" : "border-border"}`}>
                      {appLang===code && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <span className="text-xs">{flag}</span>
                    <span className="text-xs font-bold">{name}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">⚠ تطبيق اللغة يتطلب إعادة تحميل الصفحة</p>
            </div>

            {/* Dev nav */}
            <div className="p-4 bg-muted/50 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">زر المطور في شريط التنقل</p>
                <p className="text-xs text-muted-foreground mt-0.5">إظهار أو إخفاء الزر فوراً</p>
              </div>
              <Switch checked={showDevNav} onCheckedChange={v => { setShowDevNav(v); ls.set("dev_show_dev_nav", String(v)); window.dispatchEvent(new Event("storage")); }} />
            </div>

            {/* Clear cache */}
            <div className="p-4 bg-muted/50 rounded-xl">
              <p className="text-sm font-semibold mb-1 text-destructive">مسح جميع الإعدادات</p>
              <p className="text-xs text-muted-foreground mb-3">يمسح جميع إعدادات التخصيص المحفوظة ويعيد التطبيق للافتراضي</p>
              <Button variant="destructive" size="sm" className="rounded-xl" onClick={() => { ls.clear(); toast.success("تم المسح — جاري إعادة التحميل..."); setTimeout(() => window.location.reload(), 1500); }}>
                مسح كل الإعدادات
              </Button>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSaveAppSettings} className={`flex-1 rounded-xl h-12 font-bold gap-2 transition-all ${savedStates.appSettings ? "bg-green-600 hover:bg-green-700" : ""}`}>
                {savedStates.appSettings ? <><Check className="w-4 h-4" /> تم الحفظ!</> : <><Check className="w-4 h-4" /> حفظ الإعدادات</>}
              </Button>
              <Button onClick={handleSaveAndReload} variant="outline" className="flex-1 rounded-xl h-12 font-bold gap-2">
                <RefreshCw className="w-4 h-4" /> حفظ وإعادة تحميل
              </Button>
            </div>
          </div>
        )}

        {/* ─── Password ─── */}
        {activeTab === "password" && (
          <div className="space-y-4">
            <h2 className="text-base font-bold flex items-center gap-2"><KeyRound className="w-4 h-4" /> تغيير كلمة المرور</h2>
            <div><Label>الحالية</Label><Input type="password" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} className="mt-1.5" /></div>
            <div><Label>الجديدة</Label><Input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} className="mt-1.5" /></div>
            <div><Label>تأكيد الجديدة</Label><Input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} className="mt-1.5" /></div>
            <Button onClick={handleChangePassword} className={`w-full rounded-xl h-12 gap-2 font-bold transition-all ${savedStates.password ? "bg-green-600 hover:bg-green-700" : ""}`}>
              {savedStates.password ? <><Check className="w-4 h-4" /> تم التغيير!</> : <><KeyRound className="w-4 h-4" /> تغيير كلمة المرور</>}
            </Button>
          </div>
        )}

      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle>تعديل الكتاب</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>العنوان</Label><Input value={editForm.title} onChange={e => setEditForm(p=>({...p,title:e.target.value}))} className="mt-1" /></div>
              <div><Label>المؤلف</Label><Input value={editForm.author} onChange={e => setEditForm(p=>({...p,author:e.target.value}))} className="mt-1" /></div>
            </div>
            <div>
              <Label>التصنيف</Label>
              <select value={editForm.category} onChange={e => setEditForm(p=>({...p,category:e.target.value}))} className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div><Label>الوصف</Label><Textarea value={editForm.description} onChange={e => setEditForm(p=>({...p,description:e.target.value}))} className="mt-1" rows={3} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>الصفحات</Label><Input type="number" value={editForm.pages_count} onChange={e => setEditForm(p=>({...p,pages_count:e.target.value}))} className="mt-1" /></div>
              <div><Label>التقييم (0-5)</Label><Input type="number" min={0} max={5} step={0.5} value={editForm.rating} onChange={e => setEditForm(p=>({...p,rating:e.target.value}))} className="mt-1" /></div>
            </div>
            <div>
              <Label>رابط PDF</Label>
              <Input value={editForm.pdf_url} onChange={e => setEditForm(p=>({...p,pdf_url:e.target.value}))} className="mt-1 text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">رفع PDF جديد</Label>
                <label className="cursor-pointer block mt-1">
                  <input type="file" accept=".pdf" onChange={e => handlePdfUpload(e, true)} className="hidden" />
                  <div className={`flex items-center justify-center gap-1 h-9 rounded-xl border-2 border-dashed transition-colors ${editPdfUploading ? "border-primary" : editForm.pdf_url ? "border-primary bg-primary/5" : "border-border"}`}>
                    {editPdfUploading ? <div className="w-3 h-3 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /> : <><Upload className="w-3 h-3 text-muted-foreground" /><span className="text-xs text-muted-foreground">PDF</span></>}
                  </div>
                </label>
              </div>
              <div>
                <Label className="text-xs">رفع غلاف جديد</Label>
                <label className="cursor-pointer block mt-1">
                  <input type="file" accept="image/*" onChange={e => handleCoverUpload(e, true)} className="hidden" />
                  <div className={`flex items-center justify-center gap-1 h-9 rounded-xl border-2 border-dashed transition-colors ${editCoverUploading ? "border-primary" : editForm.cover_image ? "border-primary bg-primary/5" : "border-border"}`}>
                    {editCoverUploading ? <div className="w-3 h-3 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /> : <><Upload className="w-3 h-3 text-muted-foreground" /><span className="text-xs text-muted-foreground">غلاف</span></>}
                  </div>
                </label>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
              <Label>مميز ⭐</Label>
              <Switch checked={editForm.is_featured} onCheckedChange={v => setEditForm(p=>({...p,is_featured:v}))} />
            </div>
            <Button onClick={handleSaveEdit} disabled={savingEdit} className={`w-full rounded-xl gap-2 transition-all ${savedStates.editBook ? "bg-green-600 hover:bg-green-700" : ""}`}>
              {savingEdit ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> جاري الحفظ...</> : savedStates.editBook ? <><Check className="w-4 h-4" /> تم الحفظ!</> : "حفظ التعديلات"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}