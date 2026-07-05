import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Plus, Trash2, Eye, EyeOff, Save, Languages, Play, Pause,
  RefreshCw, FileText, Clock, CheckCircle, AlertCircle, Loader2,
  Activity, Zap, BarChart3, BookOpen,
} from "lucide-react";

const LANGUAGES = [
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "ur", name: "الأردية", flag: "🇵🇰" },
  { code: "en", name: "الإنجليزية", flag: "🇬🇧" },
  { code: "hi", name: "الهندية", flag: "🇮🇳" },
];

const STATUS_CONFIG = {
  pending: { label: "في الانتظار", color: "text-gray-500 bg-gray-500/10", icon: Clock },
  extracting: { label: "استخراج النص", color: "text-blue-500 bg-blue-500/10", icon: Loader2 },
  translating: { label: "جاري الترجمة", color: "text-amber-500 bg-amber-500/10", icon: Loader2 },
  completed: { label: "مكتملة", color: "text-green-500 bg-green-500/10", icon: CheckCircle },
  error: { label: "خطأ", color: "text-red-500 bg-red-500/10", icon: AlertCircle },
  paused: { label: "متوقفة مؤقتاً", color: "text-purple-500 bg-purple-500/10", icon: Pause },
};

// ─── Translations List Tab ────────────────────────────────────────────────────
function TranslationsListTab() {
  const [translations, setTranslations] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ book_id: "", target_language: "ar", source_language: "auto" });

  const load = useCallback(async () => {
    setLoading(true);
    const [tData, bData] = await Promise.all([
      base44.entities.BookTranslation.list("-created_date", 500),
      base44.entities.Book.list("-created_date", 500),
    ]);
    setTranslations(tData || []);
    setBooks(bData || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!form.book_id) { toast.error("اختر كتاباً"); return; }
    const book = books.find((b) => b.id === form.book_id);
    if (!book) { toast.error("الكتاب غير موجود"); return; }

    // Check for existing translation
    const existing = translations.filter((t) => t.book_id === form.book_id && t.target_language === form.target_language);
    if (existing.length > 0) {
      toast.error("توجد ترجمة لهذا الكتاب بنفس اللغة");
      return;
    }

    try {
      await base44.entities.BookTranslation.create({
        book_id: form.book_id,
        book_title: book.title,
        source_language: form.source_language,
        target_language: form.target_language,
        status: "pending",
        progress: 0,
        translated_pages: 0,
        current_page: 0,
        enabled: true,
        translation_engine: "ai_auto",
        started_at: new Date().toISOString(),
      });
      toast.success("تم إنشاء ترجمة جديدة. ابدأ الترجمة من قائمة الترجمات.");
      setShowForm(false);
      setForm({ book_id: "", target_language: "ar", source_language: "auto" });
      load();
    } catch (e) {
      toast.error("فشل إنشاء الترجمة");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("حذف هذه الترجمة؟")) return;
    await base44.entities.BookTranslation.delete(id);
    toast.success("تم الحذف");
    load();
  };

  const handleToggleEnabled = async (t) => {
    await base44.entities.BookTranslation.update(t.id, { enabled: !t.enabled });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold">الترجمات ({translations.length})</h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 ml-1" /> ترجمة جديدة
        </Button>
      </div>

      {showForm && (
        <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-3">
          <div>
            <Label className="text-xs">اختر الكتاب</Label>
            <Select value={form.book_id} onValueChange={(v) => setForm({ ...form, book_id: v })}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="اختر كتاباً" /></SelectTrigger>
              <SelectContent>
                {books.filter((b) => b.pdf_url).map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">اللغة الأصلية</Label>
              <Select value={form.source_language} onValueChange={(v) => setForm({ ...form, source_language: v })}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">اكتشاف تلقائي</SelectItem>
                  {LANGUAGES.map((l) => <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">لغة الترجمة</Label>
              <Select value={form.target_language} onValueChange={(v) => setForm({ ...form, target_language: v })}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreate}><Save className="w-4 h-4 ml-1" /> إنشاء</Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>إلغاء</Button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-center text-sm text-muted-foreground py-8">جاري التحميل...</p>
      ) : translations.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">لا توجد ترجمات بعد</p>
      ) : (
        <div className="space-y-2">
          {translations.map((t) => {
            const status = STATUS_CONFIG[t.status] || STATUS_CONFIG.pending;
            const StatusIcon = status.icon;
            return (
              <div key={t.id} className="bg-card border border-border rounded-xl p-3 space-y-2">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${status.color}`}>
                    <StatusIcon className={`w-4 h-4 ${t.status === "extracting" || t.status === "translating" ? "animate-spin" : ""}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{t.book_title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span>{LANGUAGES.find((l) => l.code === t.source_language)?.name || "تلقائي"}</span>
                      <span>←</span>
                      <span>{LANGUAGES.find((l) => l.code === t.target_language)?.name || t.target_language}</span>
                      {t.is_ocr && <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 text-[9px]">OCR</span>}
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${status.color}`}>{status.label}</span>
                </div>

                {/* Progress bar */}
                {(t.status === "translating" || t.status === "extracting" || t.status === "completed") && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>{t.translated_pages || 0} / {t.total_pages || 0} صفحة</span>
                      <span>{t.progress || 0}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${t.progress || 0}%` }} />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1 pt-1 border-t border-border">
                  {t.translated_pdf_url && t.status === "completed" && (
                    <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => window.open(t.translated_pdf_url, "_blank")}>
                      <FileText className="w-3 h-3" /> عرض
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => handleToggleEnabled(t)}>
                    {t.enabled ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    {t.enabled ? "ظاهرة" : "مخفية"}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-destructive" onClick={() => handleDelete(t.id)}>
                    <Trash2 className="w-3 h-3" /> حذف
                  </Button>
                  {t.error_message && (
                    <span className="text-[10px] text-red-500 truncate flex-1 text-left" title={t.error_message}>⚠ {t.error_message}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────
function SettingsTab() {
  const [enabled, setEnabled] = useState(() => localStorage.getItem("devs_translation_enabled") !== "false");
  const [engine, setEngine] = useState(() => localStorage.getItem("devs_translation_engine") || "ai_auto");
  const [ocrEnabled, setOcrEnabled] = useState(() => localStorage.getItem("devs_translation_ocr") !== "false");

  const handleSave = () => {
    localStorage.setItem("devs_translation_enabled", String(enabled));
    localStorage.setItem("devs_translation_engine", engine);
    localStorage.setItem("devs_translation_ocr", String(ocrEnabled));
    toast.success("تم حفظ الإعدادات");
    window.dispatchEvent(new Event("app-settings-changed"));
  };

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-4 space-y-4">
        <h3 className="text-sm font-bold">إعدادات الترجمة</h3>

        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm">تفعيل نظام الترجمة</Label>
            <p className="text-xs text-muted-foreground">إظهار أو إخفاء خيار الترجمة للمستخدمين</p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm">تفعيل OCR للكتب المصورة</Label>
            <p className="text-xs text-muted-foreground">استخراج النص من الصور باستخدام الذكاء الاصطناعي</p>
          </div>
          <Switch checked={ocrEnabled} onCheckedChange={setOcrEnabled} />
        </div>

        <div>
          <Label className="text-sm">محرك الترجمة</Label>
          <Select value={engine} onValueChange={setEngine}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ai_auto">الذكاء الاصطناعي (تلقائي)</SelectItem>
              <SelectItem value="ai_claude">Claude (جودة عالية)</SelectItem>
              <SelectItem value="ai_gemini">Gemini (سريع)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
          <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
            ⚠️ تنبيه: الترجمات التي ينتجها الذكاء الاصطناعي للكتب الدينية ينبغي مراجعتها قبل اعتمادها أو نشرها.
          </p>
        </div>

        <Button onClick={handleSave} className="w-full"><Save className="w-4 h-4 ml-2" /> حفظ الإعدادات</Button>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-bold mb-3">اللغات المدعومة</h3>
        <div className="grid grid-cols-2 gap-2">
          {LANGUAGES.map((l) => (
            <div key={l.code} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
              <span className="text-lg">{l.flag}</span>
              <span className="text-sm">{l.name}</span>
              <span className="text-[10px] text-muted-foreground mr-auto">{l.code}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Performance Tab ──────────────────────────────────────────────────────────
function PerformanceTab() {
  const [translations, setTranslations] = useState([]);

  useEffect(() => {
    base44.entities.BookTranslation.list("-created_date", 500).then(setTranslations);
  }, []);

  const completed = translations.filter((t) => t.status === "completed");
  const inProgress = translations.filter((t) => t.status === "translating" || t.status === "extracting");
  const errors = translations.filter((t) => t.status === "error");
  const ocrCount = translations.filter((t) => t.is_ocr);

  const stats = [
    { label: "إجمالي الترجمات", value: translations.length, icon: BookOpen, color: "text-blue-500" },
    { label: "مكتملة", value: completed.length, icon: CheckCircle, color: "text-green-500" },
    { label: "قيد المعالجة", value: inProgress.length, icon: Loader2, color: "text-amber-500" },
    { label: "أخطاء", value: errors.length, icon: AlertCircle, color: "text-red-500" },
    { label: "باستخدام OCR", value: ocrCount.length, icon: FileText, color: "text-purple-500" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-3 text-center">
            <s.icon className={`w-5 h-5 mx-auto mb-1 ${s.color}`} />
            <p className="text-xl font-black">{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {errors.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-bold mb-2 flex items-center gap-2"><AlertCircle className="w-4 h-4 text-red-500" /> سجل الأخطاء</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {errors.map((e) => (
              <div key={e.id} className="text-xs p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                <p className="font-medium truncate">{e.book_title}</p>
                <p className="text-red-500 mt-0.5">{e.error_message || "خطأ غير معروف"}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DevTranslations() {
  const [tab, setTab] = useState("list");
  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="list" className="text-xs gap-1"><Languages className="w-3.5 h-3.5" /> الترجمات</TabsTrigger>
          <TabsTrigger value="settings" className="text-xs gap-1"><Activity className="w-3.5 h-3.5" /> الإعدادات</TabsTrigger>
          <TabsTrigger value="performance" className="text-xs gap-1"><BarChart3 className="w-3.5 h-3.5" /> الأداء</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="mt-4"><TranslationsListTab /></TabsContent>
        <TabsContent value="settings" className="mt-4"><SettingsTab /></TabsContent>
        <TabsContent value="performance" className="mt-4"><PerformanceTab /></TabsContent>
      </Tabs>
    </div>
  );
}