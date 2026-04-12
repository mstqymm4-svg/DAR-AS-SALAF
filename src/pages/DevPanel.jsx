import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Lock, Palette, Image, Type, BookPlus, KeyRound, Eye, EyeOff, Upload, Check, BookOpen, Pencil, Trash2, Plus } from "lucide-react";
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

// ─── Color Utils ────────────────────────────────────────────────
export function applyStoredColors() {
  const bg = localStorage.getItem("dev_bg");
  const fg = localStorage.getItem("dev_fg");
  const primary = localStorage.getItem("dev_primary");
  const accent = localStorage.getItem("dev_accent");
  const card = localStorage.getItem("dev_card");
  if (bg) document.documentElement.style.setProperty("--background", bg);
  if (fg) document.documentElement.style.setProperty("--foreground", fg);
  if (primary) {
    document.documentElement.style.setProperty("--primary", primary);
    document.documentElement.style.setProperty("--ring", primary);
    document.documentElement.style.setProperty("--sidebar-primary", primary);
  }
  if (accent) document.documentElement.style.setProperty("--accent", accent);
  if (card) {
    document.documentElement.style.setProperty("--card", card);
    document.documentElement.style.setProperty("--popover", card);
  }
}

function applyColors({ bg, fg, primary, accent, card }) {
  if (bg) { document.documentElement.style.setProperty("--background", bg); localStorage.setItem("dev_bg", bg); }
  if (fg) { document.documentElement.style.setProperty("--foreground", fg); localStorage.setItem("dev_fg", fg); }
  if (primary) {
    document.documentElement.style.setProperty("--primary", primary);
    document.documentElement.style.setProperty("--ring", primary);
    document.documentElement.style.setProperty("--sidebar-primary", primary);
    localStorage.setItem("dev_primary", primary);
  }
  if (accent) { document.documentElement.style.setProperty("--accent", accent); localStorage.setItem("dev_accent", accent); }
  if (card) {
    document.documentElement.style.setProperty("--card", card);
    document.documentElement.style.setProperty("--popover", card);
    localStorage.setItem("dev_card", card);
  }
}

const PRESETS = [
  { name: "أخضر إسلامي (افتراضي)", bg: "40 30% 97%", fg: "160 30% 10%", primary: "158 45% 28%", accent: "43 80% 55%", card: "40 25% 99%" },
  { name: "أزرق عميق", bg: "220 30% 97%", fg: "220 30% 10%", primary: "217 71% 35%", accent: "43 80% 55%", card: "220 25% 99%" },
  { name: "بنفسجي راقي", bg: "270 20% 97%", fg: "270 30% 10%", primary: "270 50% 38%", accent: "43 80% 55%", card: "270 15% 99%" },
  { name: "بني ذهبي", bg: "35 30% 96%", fg: "30 40% 10%", primary: "30 50% 30%", accent: "43 80% 55%", card: "35 25% 98%" },
  { name: "داكن ليلي", bg: "220 20% 8%", fg: "220 10% 92%", primary: "217 71% 50%", accent: "43 80% 55%", card: "220 20% 12%" },
  { name: "أحمر داكن", bg: "0 15% 97%", fg: "0 30% 10%", primary: "0 55% 35%", accent: "43 80% 55%", card: "0 10% 99%" },
];

const categoryOptions = ["القرآن وعلومه","الحديث الشريف","الفقه الإسلامي","السيرة النبوية","العقيدة","التزكية والرقائق","التاريخ الإسلامي","أخرى"];

const emptyBook = { title: "", author: "", category: "القرآن وعلومه", description: "", cover_image: "", pages_count: "", language: "العربية", pdf_url: "", is_featured: false, rating: 0 };

export default function DevPanel() {
  const [unlocked, setUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [activeTab, setActiveTab] = useState("color");

  // Colors
  const [colors, setColors] = useState({ bg: "", fg: "", primary: "", accent: "", card: "" });
  const [selectedPreset, setSelectedPreset] = useState(null);

  // Logo
  const [logoUrl, setLogoUrl] = useState(localStorage.getItem("dev_logo_url") || "");
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // App Name
  const [appName, setAppName] = useState(localStorage.getItem("dev_app_name") || "المكتبة الدينية");
  const [appSubtitle, setAppSubtitle] = useState(localStorage.getItem("dev_app_subtitle") || "نور العلم والمعرفة");

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

  useEffect(() => { applyStoredColors(); }, []);

  useEffect(() => {
    if (activeTab === "admin" && unlocked) loadBooks();
  }, [activeTab, unlocked]);

  const loadBooks = async () => {
    setLoadingBooks(true);
    const all = await base44.entities.Book.list('-created_date', 300);
    setBooks(all);
    setLoadingBooks(false);
  };

  const handleUnlock = () => {
    if (passwordInput === getPassword()) setUnlocked(true);
    else toast.error("كلمة المرور غير صحيحة");
  };

  // Colors
  const handleApplyPreset = (preset) => {
    setSelectedPreset(preset.name);
    setColors({ bg: preset.bg, fg: preset.fg, primary: preset.primary, accent: preset.accent, card: preset.card });
    applyColors({ bg: preset.bg, fg: preset.fg, primary: preset.primary, accent: preset.accent, card: preset.card });
    toast.success(`تم تطبيق: ${preset.name}`);
  };

  const handleApplyCustom = () => {
    applyColors(colors);
    toast.success("تم تطبيق الألوان المخصصة");
  };

  const handleResetColors = () => {
    ["dev_bg","dev_fg","dev_primary","dev_accent","dev_card"].forEach(k => localStorage.removeItem(k));
    ["--background","--foreground","--primary","--ring","--sidebar-primary","--accent","--card","--popover"].forEach(v => document.documentElement.style.removeProperty(v));
    setColors({ bg: "", fg: "", primary: "", accent: "", card: "" });
    setSelectedPreset(null);
    toast.success("تم إعادة الألوان للافتراضي");
  };

  // Logo
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setUploadingLogo(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setLogoUrl(file_url); localStorage.setItem("dev_logo_url", file_url);
    setUploadingLogo(false); toast.success("تم رفع الشعار");
  };

  // App Name
  const handleSaveAppName = () => {
    localStorage.setItem("dev_app_name", appName);
    localStorage.setItem("dev_app_subtitle", appSubtitle);
    toast.success("تم الحفظ، أعد تحميل الصفحة");
  };

  // Book PDF
  const handlePdfUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setPdfUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setBookForm(p => ({ ...p, pdf_url: file_url })); setPdfUploading(false); toast.success("تم رفع PDF");
  };
  const handleCoverUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setCoverUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setBookForm(p => ({ ...p, cover_image: file_url })); setCoverUploading(false); toast.success("تم رفع الغلاف");
  };
  const handleAddBook = async () => {
    if (!bookForm.title || !bookForm.author) { toast.error("أدخل العنوان والمؤلف"); return; }
    setSavingBook(true);
    await base44.entities.Book.create({ ...bookForm, pages_count: bookForm.pages_count ? Number(bookForm.pages_count) : null, rating: Number(bookForm.rating) || 0 });
    toast.success("تمت إضافة الكتاب"); setBookForm(emptyBook); setSavingBook(false);
  };

  // Admin
  const openEdit = (book) => {
    setEditingBook(book);
    setEditForm({ title: book.title||"", author: book.author||"", category: book.category||"القرآن وعلومه", description: book.description||"", cover_image: book.cover_image||"", pages_count: book.pages_count||"", language: book.language||"العربية", pdf_url: book.pdf_url||"", is_featured: book.is_featured||false, rating: book.rating||0 });
    setEditDialog(true);
  };
  const handleSaveEdit = async () => {
    await base44.entities.Book.update(editingBook.id, { ...editForm, pages_count: editForm.pages_count ? Number(editForm.pages_count) : null, rating: Number(editForm.rating)||0 });
    toast.success("تم التحديث"); setEditDialog(false); loadBooks();
  };
  const handleDelete = async (book) => {
    if (!confirm(`حذف "${book.title}"؟`)) return;
    await base44.entities.Book.delete(book.id); toast.success("تم الحذف"); loadBooks();
  };

  // Password
  const handleChangePassword = () => {
    if (currentPwd !== getPassword()) { toast.error("كلمة المرور الحالية خاطئة"); return; }
    if (newPwd.length < 4) { toast.error("كلمة المرور الجديدة قصيرة جداً"); return; }
    if (newPwd !== confirmPwd) { toast.error("كلمتا المرور غير متطابقتين"); return; }
    localStorage.setItem(DEV_PASSWORD_KEY, newPwd);
    toast.success("تم تغيير كلمة المرور"); setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
  };

  const tabs = [
    { id: "color", label: "الألوان", icon: Palette },
    { id: "logo", label: "الشعار", icon: Image },
    { id: "name", label: "الاسم", icon: Type },
    { id: "book", label: "إضافة PDF", icon: BookPlus },
    { id: "admin", label: "إدارة الكتب", icon: BookOpen },
    { id: "password", label: "كلمة المرور", icon: KeyRound },
  ];

  if (!unlocked) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card border border-border rounded-2xl p-8 w-full max-w-sm">
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
              <Lock className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-xl font-black text-foreground">لوحة المطور</h1>
            <p className="text-sm text-muted-foreground mt-1">أدخل كلمة المرور للمتابعة</p>
          </div>
          <div className="space-y-4">
            <div className="relative">
              <Input type={showPwd ? "text" : "password"} value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleUnlock()} placeholder="كلمة المرور" className="h-12 rounded-xl pl-10" />
              <button onClick={() => setShowPwd(!showPwd)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
      <div className="mb-6">
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
          <Lock className="w-6 h-6 text-primary" /> لوحة المطور
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}>
            <tab.icon className="w-4 h-4" />{tab.label}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">

        {/* ─── Colors ─── */}
        {activeTab === "color" && (
          <div className="space-y-6">
            <h2 className="text-base font-bold">تخصيص ألوان التطبيق</h2>

            {/* Presets */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-3">ثيمات جاهزة</p>
              <div className="grid grid-cols-2 gap-2">
                {PRESETS.map((p) => (
                  <button key={p.name} onClick={() => handleApplyPreset(p)} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-sm ${selectedPreset === p.name ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}>
                    <div className="flex gap-1 shrink-0">
                      <div className="w-4 h-6 rounded-sm" style={{ background: `hsl(${p.bg})`, border: "1px solid hsl(0 0% 80%)" }} />
                      <div className="w-4 h-6 rounded-sm" style={{ background: `hsl(${p.primary})` }} />
                      <div className="w-4 h-6 rounded-sm" style={{ background: `hsl(${p.accent})` }} />
                    </div>
                    <span className="text-xs font-medium leading-tight">{p.name}</span>
                    {selectedPreset === p.name && <Check className="w-3 h-3 text-primary mr-auto shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-3">تخصيص يدوي (قيم HSL مثال: <code className="text-xs bg-muted px-1 rounded">158 45% 28%</code>)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: "bg", label: "لون الخلفية (bg)" },
                  { key: "fg", label: "لون الكتابة (text)" },
                  { key: "primary", label: "اللون الأساسي (primary)" },
                  { key: "accent", label: "لون التمييز (accent)" },
                  { key: "card", label: "لون البطاقات (card)" },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg border border-border shrink-0" style={{ background: colors[key] ? `hsl(${colors[key]})` : "transparent" }} />
                    <div className="flex-1">
                      <Label className="text-xs">{label}</Label>
                      <Input value={colors[key]} onChange={(e) => setColors(c => ({ ...c, [key]: e.target.value }))} placeholder="مثال: 158 45% 28%" className="h-8 text-xs mt-0.5" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={handleApplyCustom} className="flex-1 rounded-xl">تطبيق الألوان</Button>
                <Button variant="outline" onClick={handleResetColors} className="rounded-xl">إعادة تعيين</Button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Logo ─── */}
        {activeTab === "logo" && (
          <div>
            <h2 className="text-base font-bold mb-4">تعديل شعار التطبيق</h2>
            <div className="flex flex-col items-center gap-4">
              {logoUrl && <img src={logoUrl} alt="الشعار" className="w-20 h-20 rounded-2xl object-cover border border-border" />}
              <label className="cursor-pointer w-full">
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                <div className="flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-dashed border-border hover:border-primary/40 transition-colors">
                  {uploadingLogo ? <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /> : <><Upload className="w-4 h-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">اختر صورة للشعار</span></>}
                </div>
              </label>
            </div>
          </div>
        )}

        {/* ─── App Name ─── */}
        {activeTab === "name" && (
          <div className="space-y-4">
            <h2 className="text-base font-bold mb-2">تعديل اسم التطبيق</h2>
            <div><Label>الاسم الرئيسي</Label><Input value={appName} onChange={(e) => setAppName(e.target.value)} className="mt-1.5" /></div>
            <div><Label>الوصف الفرعي</Label><Input value={appSubtitle} onChange={(e) => setAppSubtitle(e.target.value)} className="mt-1.5" /></div>
            <Button onClick={handleSaveAppName} className="w-full rounded-xl">حفظ</Button>
          </div>
        )}

        {/* ─── Add Book PDF ─── */}
        {activeTab === "book" && (
          <div className="space-y-4">
            <h2 className="text-base font-bold mb-2">إضافة كتاب بملف PDF</h2>
            <div><Label>العنوان *</Label><Input value={bookForm.title} onChange={(e) => setBookForm(p => ({ ...p, title: e.target.value }))} className="mt-1.5" /></div>
            <div><Label>المؤلف *</Label><Input value={bookForm.author} onChange={(e) => setBookForm(p => ({ ...p, author: e.target.value }))} className="mt-1.5" /></div>
            <div>
              <Label>التصنيف</Label>
              <select value={bookForm.category} onChange={(e) => setBookForm(p => ({ ...p, category: e.target.value }))} className="mt-1.5 w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div><Label>عدد الصفحات</Label><Input type="number" value={bookForm.pages_count} onChange={(e) => setBookForm(p => ({ ...p, pages_count: e.target.value }))} className="mt-1.5" /></div>
            <div>
              <Label>صورة الغلاف</Label>
              <label className="cursor-pointer block mt-1.5">
                <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                <div className={`flex items-center justify-center gap-2 h-10 rounded-xl border-2 border-dashed transition-colors ${bookForm.cover_image ? "border-primary bg-primary/5" : "border-border"}`}>
                  {coverUploading ? <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /> : bookForm.cover_image ? <><Check className="w-4 h-4 text-primary" /><span className="text-xs text-primary">تم الرفع</span></> : <><Upload className="w-4 h-4 text-muted-foreground" /><span className="text-xs text-muted-foreground">رفع صورة الغلاف</span></>}
                </div>
              </label>
            </div>
            <div>
              <Label>ملف PDF</Label>
              <label className="cursor-pointer block mt-1.5">
                <input type="file" accept=".pdf" onChange={handlePdfUpload} className="hidden" />
                <div className={`flex items-center justify-center gap-2 h-10 rounded-xl border-2 border-dashed transition-colors ${bookForm.pdf_url ? "border-primary bg-primary/5" : "border-border"}`}>
                  {pdfUploading ? <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /> : bookForm.pdf_url ? <><Check className="w-4 h-4 text-primary" /><span className="text-xs text-primary">PDF جاهز</span></> : <><Upload className="w-4 h-4 text-muted-foreground" /><span className="text-xs text-muted-foreground">رفع PDF</span></>}
                </div>
              </label>
            </div>
            <div className="flex items-center justify-between"><Label>مميز</Label><Switch checked={bookForm.is_featured} onCheckedChange={(v) => setBookForm(p => ({ ...p, is_featured: v }))} /></div>
            <Button onClick={handleAddBook} disabled={savingBook} className="w-full rounded-xl">
              {savingBook ? "جاري الإضافة..." : "إضافة الكتاب"}
            </Button>
          </div>
        )}

        {/* ─── Admin Books ─── */}
        {activeTab === "admin" && (
          <div>
            <h2 className="text-base font-bold mb-4">إدارة الكتب — {books.length} كتاب</h2>
            {loadingBooks ? (
              <div className="flex justify-center py-10"><div className="w-7 h-7 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
            ) : (
              <div className="divide-y divide-border max-h-[60vh] overflow-y-auto">
                {books.map((book) => (
                  <div key={book.id} className="flex items-center gap-3 py-3">
                    <div className="w-10 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                      {book.cover_image ? <img src={book.cover_image} alt="" className="w-full h-full object-cover" /> : <BookOpen className="w-4 h-4 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{book.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{book.author} · {book.category}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => openEdit(book)} className="p-1.5 rounded-lg hover:bg-muted"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                      <button onClick={() => handleDelete(book)} className="p-1.5 rounded-lg hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── Password ─── */}
        {activeTab === "password" && (
          <div className="space-y-4">
            <h2 className="text-base font-bold mb-2">تغيير كلمة المرور</h2>
            <div><Label>الحالية</Label><Input type="password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} className="mt-1.5" /></div>
            <div><Label>الجديدة</Label><Input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} className="mt-1.5" /></div>
            <div><Label>تأكيد</Label><Input type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} className="mt-1.5" /></div>
            <Button onClick={handleChangePassword} className="w-full rounded-xl">تغيير</Button>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle>تعديل الكتاب</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-4">
            <div><Label>العنوان</Label><Input value={editForm.title} onChange={(e) => setEditForm(p => ({ ...p, title: e.target.value }))} className="mt-1" /></div>
            <div><Label>المؤلف</Label><Input value={editForm.author} onChange={(e) => setEditForm(p => ({ ...p, author: e.target.value }))} className="mt-1" /></div>
            <div>
              <Label>التصنيف</Label>
              <select value={editForm.category} onChange={(e) => setEditForm(p => ({ ...p, category: e.target.value }))} className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div><Label>الوصف</Label><Textarea value={editForm.description} onChange={(e) => setEditForm(p => ({ ...p, description: e.target.value }))} className="mt-1" rows={3} /></div>
            <div><Label>عدد الصفحات</Label><Input type="number" value={editForm.pages_count} onChange={(e) => setEditForm(p => ({ ...p, pages_count: e.target.value }))} className="mt-1" /></div>
            <div><Label>التقييم (0-5)</Label><Input type="number" min={0} max={5} step={0.5} value={editForm.rating} onChange={(e) => setEditForm(p => ({ ...p, rating: e.target.value }))} className="mt-1" /></div>
            <div className="flex items-center justify-between"><Label>مميز</Label><Switch checked={editForm.is_featured} onCheckedChange={(v) => setEditForm(p => ({ ...p, is_featured: v }))} /></div>
            <Button onClick={handleSaveEdit} className="w-full rounded-xl">حفظ التعديلات</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}