import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Globe, Languages, BookText, Trash2, Plus, Pencil, Ban, Check, BarChart3,
  Play, Square, Eye, RefreshCw, Library, Loader2, AlertTriangle, FileSearch,
  ScanText, FileText, RotateCw,
} from "lucide-react";
import {
  getAllLanguages, ensureDefaultLanguages, getTranslationStats, getAllTranslatedBooks,
  getAllGlossary, deleteTranslations, cancelTranslation, getErrorLog, inspectBook,
  retryFailedPage,
} from "@/lib/translationEngine";
import { getSetting, setSetting } from "@/lib/settingsStore";

const CATEGORY_LABELS = {
  religious_terms: "مصطلحات شرعية",
  scholars: "أسماء العلماء",
  books: "أسماء الكتب",
  quran: "آيات قرآنية",
  hadith: "أحاديث نبوية",
  general: "عام",
};

// ─── Stats Tab ────────────────────────────────────────────────────────────────
function StatsTab() {
  const [stats, setStats] = useState(null);

  const load = useCallback(async () => {
    setStats(await getTranslationStats());
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!stats) return <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto mt-8" />;

  const cards = [
    { label: "الكتب المترجمة", value: stats.totalBooks, icon: Library, color: "text-blue-500" },
    { label: "إجمالي الترجمات", value: stats.totalTranslations, icon: Globe, color: "text-green-500" },
    { label: "مكتملة", value: stats.completed, icon: Check, color: "text-emerald-500" },
    { label: "قيد المعالجة", value: stats.pending, icon: Loader2, color: "text-amber-500" },
    { label: "أخطاء", value: stats.errors, icon: Ban, color: "text-red-500" },
    { label: "اللغات المستخدمة", value: stats.languagesUsed.length, icon: Languages, color: "text-purple-500" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <c.icon className={`w-5 h-5 ${c.color}`} />
              <span className="text-2xl font-black">{c.value}</span>
            </div>
            <p className="text-xs text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>

      {stats.languagesUsed.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
            <Languages className="w-4 h-4 text-primary" /> اللغات المستخدمة في الترجمة
          </h3>
          <div className="flex flex-wrap gap-2">
            {stats.languagesUsed.map((lang) => (
              <span key={lang} className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium">
                {lang}
              </span>
            ))}
          </div>
        </div>
      )}

      <Button onClick={load} variant="outline" className="w-full">
        <RefreshCw className="w-4 h-4 ml-2" /> تحديث الإحصائيات
      </Button>
    </div>
  );
}

// ─── Languages Tab ───────────────────────────────────────────────────────────
function LanguagesTab() {
  const [langs, setLangs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ code: "", name: "", native_name: "", rtl: false, active: true, font_family: "" });

  const load = useCallback(async () => {
    await ensureDefaultLanguages();
    setLangs(await getAllLanguages());
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!form.code || !form.name) { toast.error("أدخل رمز واسم اللغة"); return; }
    try {
      if (editing) {
        await base44.entities.TranslationLanguage.update(editing.id, form);
        toast.success("تم تحديث اللغة");
      } else {
        await base44.entities.TranslationLanguage.create(form);
        toast.success("تمت إضافة اللغة");
      }
      setShowForm(false); setEditing(null);
      setForm({ code: "", name: "", native_name: "", rtl: false, active: true, font_family: "" });
      load();
    } catch (e) { toast.error("فشل الحفظ"); }
  };

  const handleEdit = (lang) => {
    setEditing(lang);
    setForm({ code: lang.code, name: lang.name, native_name: lang.native_name || "", rtl: lang.rtl, active: lang.active, font_family: lang.font_family || "" });
    setShowForm(true);
  };

  const handleToggle = async (lang) => {
    await base44.entities.TranslationLanguage.update(lang.id, { active: !lang.active });
    load();
  };

  const handleDelete = async (lang) => {
    if (!confirm(`حذف اللغة "${lang.name}"؟`)) return;
    await base44.entities.TranslationLanguage.delete(lang.id);
    toast.success("تم حذف اللغة");
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold">اللغات المتاحة ({langs.length})</h3>
        <Button size="sm" onClick={() => { setEditing(null); setForm({ code: "", name: "", native_name: "", rtl: false, active: true, font_family: "" }); setShowForm(true); }}>
          <Plus className="w-4 h-4 ml-1" /> إضافة لغة
        </Button>
      </div>

      {showForm && (
        <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">رمز اللغة</Label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="ar, ur, en..." disabled={!!editing} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">اسم اللغة</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="العربية" className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">الاسم الأصلي</Label>
              <Input value={form.native_name} onChange={(e) => setForm({ ...form, native_name: e.target.value })}
                placeholder="العربية" className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">الخط (CSS)</Label>
              <Input value={form.font_family} onChange={(e) => setForm({ ...form, font_family: e.target.value })}
                placeholder="var(--font-inter)" className="h-8 text-sm" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs">
              <Switch checked={form.rtl} onCheckedChange={(v) => setForm({ ...form, rtl: v })} />
              RTL
            </label>
            <label className="flex items-center gap-2 text-xs">
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              مفعّلة
            </label>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave}><Check className="w-4 h-4 ml-1" /> حفظ</Button>
            <Button size="sm" variant="outline" onClick={() => { setShowForm(false); setEditing(null); }}>إلغاء</Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {langs.map((lang) => (
          <div key={lang.id} className="flex items-center gap-3 bg-card border border-border rounded-xl p-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
              {lang.code.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{lang.name}</p>
              <p className="text-xs text-muted-foreground">
                {lang.native_name} {lang.rtl ? "• RTL" : "• LTR"} {lang.active ? "• مفعّلة" : "• متوقفة"}
              </p>
            </div>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(lang)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleToggle(lang)}>
              {lang.active ? <Ban className="w-3.5 h-3.5 text-amber-500" /> : <Play className="w-3.5 h-3.5 text-green-500" />}
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleDelete(lang)}>
              <Trash2 className="w-3.5 h-3.5 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Glossary Tab ─────────────────────────────────────────────────────────────
function GlossaryTab() {
  const [terms, setTerms] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ term: "", translation: "", target_language: "all", category: "general", notes: "" });
  const [langs, setLangs] = useState([]);

  const load = useCallback(async () => {
    setTerms(await getAllGlossary());
    setLangs(await getAllLanguages());
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!form.term || !form.translation) { toast.error("أدخل المصطلح والترجمة"); return; }
    try {
      await base44.entities.TranslationGlossary.create(form);
      toast.success("تمت إضافة المصطلح");
      setForm({ term: "", translation: "", target_language: "all", category: "general", notes: "" });
      setShowForm(false);
      load();
    } catch (e) { toast.error("فشل الحفظ"); }
  };

  const handleDelete = async (id) => {
    await base44.entities.TranslationGlossary.delete(id);
    toast.success("تم حذف المصطلح");
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold">القاموس الذكي ({terms.length})</h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 ml-1" /> إضافة مصطلح
        </Button>
      </div>

      {showForm && (
        <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">المصطلح</Label>
              <Input value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value })}
                placeholder="صلاة" className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">الترجمة</Label>
              <Input value={form.translation} onChange={(e) => setForm({ ...form, translation: e.target.value })}
                placeholder="Prayer / نماز" className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">اللغة</Label>
              <Select value={form.target_language} onValueChange={(v) => setForm({ ...form, target_language: v })}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع اللغات</SelectItem>
                  {langs.map((l) => <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">التصنيف</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="ملاحظات (اختياري)" className="h-8 text-sm" />
          <Button size="sm" onClick={handleSave}><Check className="w-4 h-4 ml-1" /> حفظ</Button>
        </div>
      )}

      <div className="space-y-2">
        {terms.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">لا توجد مصطلحات بعد</p>
        ) : terms.map((t) => (
          <div key={t.id} className="flex items-center gap-3 bg-card border border-border rounded-xl p-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{t.term}</span>
                <span className="text-muted-foreground text-sm">←</span>
                <span className="text-sm text-primary font-medium">{t.translation}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  {CATEGORY_LABELS[t.category] || t.category}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {t.target_language === "all" ? "كل اللغات" : t.target_language}
                </span>
              </div>
            </div>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleDelete(t.id)}>
              <Trash2 className="w-3.5 h-3.5 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Books Tab ────────────────────────────────────────────────────────────────
function BooksTab() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setBooks(await getAllTranslatedBooks());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (bookId, lang) => {
    if (!confirm(`حذف ترجمة ${lang}؟`)) return;
    await deleteTranslations(bookId, lang);
    toast.success("تم حذف الترجمة");
    load();
  };

  const handleStop = (bookId, lang) => {
    cancelTranslation(bookId, lang);
    toast.info("تم إرسال طلب الإيقاف");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold">الكتب المترجمة ({books.length})</h3>
        <Button size="sm" variant="outline" onClick={load}>
          <RefreshCw className="w-4 h-4 ml-1" /> تحديث
        </Button>
      </div>

      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />
      ) : books.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">لا توجد كتب مترجمة بعد</p>
      ) : (
        <div className="space-y-3">
          {books.map((b) => (
            <div key={b.book_id} className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{b.book_title || "كتاب بدون عنوان"}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {b.languages.map((lang) => (
                      <span key={lang} className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Progress */}
              {b.total_pages > 0 && (
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{b.completed} / {b.total_pages} صفحة</span>
                    <span className="font-medium text-primary">{b.progress}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${b.progress}%` }} />
                  </div>
                </div>
              )}

              {/* Status */}
              <div className="flex items-center gap-3 text-xs">
                {b.completed > 0 && <span className="text-green-500">{b.completed} مكتملة</span>}
                {b.pending > 0 && <span className="text-amber-500">{b.pending} قيد المعالجة</span>}
                {b.errors > 0 && <span className="text-red-500">{b.errors} أخطاء</span>}
              </div>

              {/* Actions per language */}
              <div className="flex flex-wrap gap-2">
                {b.languages.map((lang) => (
                  <div key={lang} className="flex items-center gap-1 bg-muted/50 rounded-lg px-2 py-1">
                    <span className="text-xs font-medium">{lang}</span>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleStop(b.book_id, lang)}>
                      <Square className="w-3 h-3 text-amber-500" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleDelete(b.book_id, lang)}>
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Settings Tab ──────────────────────────────────────────────────────────────
function SettingsTab() {
  const [model, setModel] = useState(() => getSetting("translation_model") || "claude_sonnet_4_6");
  const [preserveTerms, setPreserveTerms] = useState(() => getSetting("translation_preserve_terms") !== "false");

  const handleSave = () => {
    setSetting("translation_model", model);
    setSetting("translation_preserve_terms", String(preserveTerms));
    toast.success("تم حفظ الإعدادات");
  };

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-4 space-y-4">
        <h3 className="text-sm font-bold">إعدادات جودة الترجمة</h3>

        <div>
          <Label className="text-xs mb-1 block">نموذج الذكاء الاصطناعي</Label>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="claude_sonnet_4_6">Claude Sonnet (أعلى جودة)</SelectItem>
              <SelectItem value="claude_opus_4_6">Claude Opus (أعلى دقة - مكلف)</SelectItem>
              <SelectItem value="gpt_5_4">GPT-5 (جودة عالية)</SelectItem>
              <SelectItem value="gemini_3_flash">Gemini Flash (سريع + بحث ويب)</SelectItem>
              <SelectItem value="automatic">تلقائي (افتراضي)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[10px] text-muted-foreground mt-1">
            النماذج المتقدمة تستهلك رصيد أكثر لكنها تعطي دقة أعلى للنصوص الدينية
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm">المحافظة على المصطلحات الشرعية</Label>
            <p className="text-xs text-muted-foreground">استخدام الترجمات المقبولة للمصطلحات الإسلامية</p>
          </div>
          <Switch checked={preserveTerms} onCheckedChange={setPreserveTerms} />
        </div>

        <Button onClick={handleSave} className="w-full">
          <Check className="w-4 h-4 ml-2" /> حفظ الإعدادات
        </Button>
      </div>
    </div>
  );
}

// ─── Error Log Tab ────────────────────────────────────────────────────────────
function ErrorLogTab() {
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErrors(await getErrorLog());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRetry = async (err) => {
    try {
      const books = await base44.entities.Book.filter({ id: err.book_id });
      if (books.length === 0) { toast.error("الكتاب غير موجود"); return; }
      const book = books[0];
      toast.info(`إعادة معالجة الصفحة ${err.page_number}...`);
      await retryFailedPage(book, err.page_number, err.target_language);
      toast.success("تمت المعالجة بنجاح");
      load();
    } catch (e) {
      toast.error(e.message || "فشلت إعادة المعالجة");
    }
  };

  const handleClearErrors = async () => {
    if (!confirm("حذف جميع سجلات الأخطاء؟")) return;
    await base44.entities.Translation.deleteMany({ status: "error" });
    toast.success("تم مسح سجل الأخطاء");
    load();
  };

  const ERROR_TYPE_LABELS = {
    extraction_failed: "فشل الاستخراج",
    ocr_failed: "فشل OCR",
    translation_failed: "فشل الترجمة",
    quality_check_failed: "فشل فحص الجودة",
    empty_text: "نص فارغ",
    other: "أخرى",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive" /> سجل الأخطاء ({errors.length})
        </h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={load}>
            <RefreshCw className="w-4 h-4 ml-1" /> تحديث
          </Button>
          {errors.length > 0 && (
            <Button size="sm" variant="outline" onClick={handleClearErrors} className="text-destructive hover:text-destructive">
              <Trash2 className="w-4 h-4 ml-1" /> مسح الكل
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />
      ) : errors.length === 0 ? (
        <div className="text-center py-12">
          <Check className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">لا توجد أخطاء — كل شيء يعمل بسلاسة</p>
        </div>
      ) : (
        <div className="space-y-2">
          {errors.map((err) => (
            <div key={err.id} className="bg-card border border-destructive/20 rounded-xl p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold truncate">{err.book_title || "كتاب بدون عنوان"}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive font-medium">
                      {ERROR_TYPE_LABELS[err.error_type] || err.error_type || "خطأ"}
                    </span>
                    {err.target_language && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {err.target_language}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{err.error_message}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">
                    صفحة {err.page_number} • {new Date(err.updated_date).toLocaleString("ar")}
                  </p>
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => handleRetry(err)}>
                  <RotateCw className="w-3.5 h-3.5 text-primary" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Book Inspection Tab ──────────────────────────────────────────────────────
function InspectTab() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inspecting, setInspecting] = useState(null);
  const [results, setResults] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    const allBooks = await base44.entities.Book.list("-updated_date", 100);
    setBooks((allBooks || []).filter((b) => b.pdf_url));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleInspect = async (book) => {
    setInspecting(book.id);
    try {
      const info = await inspectBook(book.pdf_url, book.id);
      setResults((prev) => ({ ...prev, [book.id]: info }));
      if (info.needs_ocr) toast.info(`"${book.title}" يحتاج OCR`);
      else toast.success(`"${book.title}" يحتوي على نص (${info.total_pages} صفحة)`);
    } catch (e) {
      toast.error("فشل الفحص");
    } finally {
      setInspecting(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <FileSearch className="w-4 h-4 text-primary" /> فحص الكتب ({books.length})
        </h3>
        <Button size="sm" variant="outline" onClick={load}>
          <RefreshCw className="w-4 h-4 ml-1" /> تحديث
        </Button>
      </div>

      <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
        افحص كل كتاب لمعرفة: هل يحتوي على نص قابل للترجمة؟ هل يحتاج OCR؟ عدد الصفحات؟
      </p>

      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />
      ) : (
        <div className="space-y-2">
          {books.map((book) => {
            const info = results[book.id];
            return (
              <div key={book.id} className="bg-card border border-border rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{book.title}</p>
                    <p className="text-xs text-muted-foreground">{book.author}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleInspect(book)} disabled={inspecting === book.id}>
                    {inspecting === book.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSearch className="w-3.5 h-3.5" />}
                    <span className="mr-1">فحص</span>
                  </Button>
                </div>

                {info && (
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    {info.has_text ? (
                      <span className="text-[10px] px-2 py-1 rounded-lg bg-green-500/10 text-green-600 font-medium flex items-center gap-1">
                        <FileText className="w-3 h-3" /> نص مباشر ({info.pages_with_text} صفحة)
                      </span>
                    ) : null}
                    {info.needs_ocr ? (
                      <span className="text-[10px] px-2 py-1 rounded-lg bg-amber-500/10 text-amber-600 font-medium flex items-center gap-1">
                        <ScanText className="w-3 h-3" /> يحتاج OCR ({info.pages_without_text} صفحة)
                      </span>
                    ) : null}
                    {info.total_pages > 0 && (
                      <span className="text-[10px] px-2 py-1 rounded-lg bg-muted text-muted-foreground font-medium">
                        الإجمالي: {info.total_pages} صفحة
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DevTranslations() {
  const [tab, setTab] = useState("stats");

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-2 md:grid-cols-7 w-full h-auto">
          <TabsTrigger value="stats" className="text-xs gap-1 py-1.5"><BarChart3 className="w-3.5 h-3.5" /> إحصائيات</TabsTrigger>
          <TabsTrigger value="inspect" className="text-xs gap-1 py-1.5"><FileSearch className="w-3.5 h-3.5" /> فحص الكتب</TabsTrigger>
          <TabsTrigger value="languages" className="text-xs gap-1 py-1.5"><Languages className="w-3.5 h-3.5" /> اللغات</TabsTrigger>
          <TabsTrigger value="glossary" className="text-xs gap-1 py-1.5"><BookText className="w-3.5 h-3.5" /> القاموس</TabsTrigger>
          <TabsTrigger value="books" className="text-xs gap-1 py-1.5"><Library className="w-3.5 h-3.5" /> الكتب</TabsTrigger>
          <TabsTrigger value="errors" className="text-xs gap-1 py-1.5"><AlertTriangle className="w-3.5 h-3.5" /> سجل الأخطاء</TabsTrigger>
          <TabsTrigger value="settings" className="text-xs gap-1 py-1.5"><Globe className="w-3.5 h-3.5" /> الإعدادات</TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="mt-4"><StatsTab /></TabsContent>
        <TabsContent value="inspect" className="mt-4"><InspectTab /></TabsContent>
        <TabsContent value="languages" className="mt-4"><LanguagesTab /></TabsContent>
        <TabsContent value="glossary" className="mt-4"><GlossaryTab /></TabsContent>
        <TabsContent value="books" className="mt-4"><BooksTab /></TabsContent>
        <TabsContent value="errors" className="mt-4"><ErrorLogTab /></TabsContent>
        <TabsContent value="settings" className="mt-4"><SettingsTab /></TabsContent>
      </Tabs>
    </div>
  );
}