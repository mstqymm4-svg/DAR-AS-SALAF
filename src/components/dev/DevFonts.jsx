import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Type, Upload, Check, RotateCcw, Eye, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { getSetting, setSetting, setSettings, subscribeToSettings } from "@/lib/settingsStore";

// ─── Font Presets (exported for settingsStore) ────────────────────────────────
export const FONT_PRESETS = [
  { name: "Tajawal",              label: "تجوّل",             category: "حديث",    url: "https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&display=swap",             value: "'Tajawal', sans-serif" },
  { name: "Cairo",                label: "القاهرة",            category: "حديث",    url: "https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap",                   value: "'Cairo', sans-serif" },
  { name: "IBM Plex Sans Arabic", label: "IBM بلكس",          category: "حديث",    url: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;600;700&display=swap",        value: "'IBM Plex Sans Arabic', sans-serif" },
  { name: "Readex Pro",           label: "ريدكس برو",          category: "حديث",    url: "https://fonts.googleapis.com/css2?family=Readex+Pro:wght@300;400;600;700&display=swap",                  value: "'Readex Pro', sans-serif" },
  { name: "Noto Sans Arabic",     label: "نوتو سانس",          category: "حديث",    url: "https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@300;400;600;700&display=swap",            value: "'Noto Sans Arabic', sans-serif" },
  { name: "Almarai",              label: "المرعي",             category: "حديث",    url: "https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;700;800&display=swap",                     value: "'Almarai', sans-serif" },
  { name: "Rubik",                label: "روبيك",              category: "حديث",    url: "https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;700&display=swap",                       value: "'Rubik', sans-serif" },
  { name: "Noto Nastaliq Urdu",   label: "نستعلیق اردو",      category: "أوردو",   url: "https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap",                  value: "'Noto Nastaliq Urdu', serif" },
  { name: "Gulzar",               label: "گلزار",              category: "أوردو",   url: "https://fonts.googleapis.com/css2?family=Gulzar&display=swap",                                           value: "'Gulzar', serif" },
  { name: "Amiri",                label: "أميري",              category: "كلاسيكي", url: "https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap",                               value: "'Amiri', serif" },
  { name: "Noto Naskh Arabic",    label: "نوتو نسخ",          category: "كلاسيكي", url: "https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&display=swap",                   value: "'Noto Naskh Arabic', serif" },
  { name: "Scheherazade New",     label: "شهرزاد",             category: "كلاسيكي", url: "https://fonts.googleapis.com/css2?family=Scheherazade+New:wght@400;700&display=swap",                    value: "'Scheherazade New', serif" },
  { name: "Mirza",                label: "ميرزا",              category: "كلاسيكي", url: "https://fonts.googleapis.com/css2?family=Mirza:wght@400;500;600;700&display=swap",                      value: "'Mirza', cursive" },
  { name: "Lateef",               label: "لطيف",               category: "قرآني",   url: "https://fonts.googleapis.com/css2?family=Lateef&display=swap",                                           value: "'Lateef', serif" },
  { name: "Reem Kufi",            label: "ريم كوفي",           category: "زخرفي",   url: "https://fonts.googleapis.com/css2?family=Reem+Kufi:wght@400;500;600;700&display=swap",                  value: "'Reem Kufi', sans-serif" },
  { name: "Aref Ruqaa",           label: "عارف رقعة",          category: "زخرفي",   url: "https://fonts.googleapis.com/css2?family=Aref+Ruqaa:wght@400;700&display=swap",                         value: "'Aref Ruqaa', serif" },
  { name: "El Messiri",           label: "المسيري",            category: "زخرفي",   url: "https://fonts.googleapis.com/css2?family=El+Messiri:wght@400;500;600;700&display=swap",                 value: "'El Messiri', sans-serif" },
];

export const FONT_ROLES = [
  { key: "body",    label: "النص العام",    cssVar: "--font-tajawal", sample: "بسم الله الرحمن الرحيم" },
  { key: "heading", label: "العناوين",      cssVar: "--font-heading", sample: "المكتبة الإسلامية" },
  { key: "title",   label: "أسماء الكتب",  cssVar: "--font-title",   sample: "صحيح البخاري" },
  { key: "nav",     label: "شريط التنقل",  cssVar: "--font-nav",     sample: "الرئيسية" },
  { key: "button",  label: "الأزرار",       cssVar: "--font-button",  sample: "تصفح المكتبة" },
];

const CATEGORIES = ["الكل", "حديث", "أوردو", "كلاسيكي", "قرآني", "زخرفي"];

function injectFont(preset) {
  const linkId = `df-${preset.name.replace(/\s+/g,"-")}`;
  if (!document.getElementById(linkId)) {
    const link = document.createElement("link");
    link.id = linkId; link.rel = "stylesheet"; link.href = preset.url;
    document.head.appendChild(link);
  }
}

export default function DevFonts() {
  const [roleFonts, setRoleFonts]       = useState(() => Object.fromEntries(FONT_ROLES.map(r => [r.key, getSetting(`font_${r.key}`) || ""])));
  const [fontSize, setFontSize]         = useState(() => Number(getSetting("font_size")) || 16);
  const [lineHeight, setLineHeight]     = useState(() => Number(getSetting("line_height")) || 1.6);
  const [letterSpacing, setLetterSpacing] = useState(() => Number(getSetting("letter_spacing")) || 0);
  const [activeRole, setActiveRole]     = useState("body");
  const [fontCat, setFontCat]           = useState("الكل");
  const [uploading, setUploading]       = useState(false);
  const [customFonts, setCustomFonts]   = useState(() => {
    try { return JSON.parse(getSetting("custom_fonts") || "[]"); } catch(e) { return []; }
  });

  useEffect(() => {
    const unsub = subscribeToSettings((s) => {
      const rf = {};
      FONT_ROLES.forEach(r => { rf[r.key] = s[`font_${r.key}`] || ""; });
      setRoleFonts(rf);
      setFontSize(Number(s.font_size) || 16);
    });
    return unsub;
  }, []);

  const applyRoleFont = (role, preset) => {
    injectFont(preset);
    document.documentElement.style.setProperty(role.cssVar, preset.value);
    setRoleFonts(prev => ({ ...prev, [role.key]: preset.name }));
    setSetting(`font_${role.key}`, preset.name);
    toast.success(`تم تطبيق "${preset.label}" على ${role.label} ✓`);
  };

  const handleFontSize = (val) => {
    setFontSize(val);
    document.documentElement.style.setProperty("font-size", `${val}px`);
    setSetting("font_size", String(val));
  };

  const handleLineHeight = (val) => {
    setLineHeight(val);
    document.documentElement.style.setProperty("line-height", String(val));
    setSetting("line_height", String(val));
  };

  const handleLetterSpacing = (val) => {
    setLetterSpacing(val);
    document.documentElement.style.setProperty("letter-spacing", `${val}em`);
    setSetting("letter_spacing", String(val));
  };

  const handleCustomFontUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const fontName = file.name.replace(/\.[^.]+$/, "");
    const style = document.createElement("style");
    style.textContent = `@font-face { font-family: '${fontName}'; src: url('${file_url}'); }`;
    document.head.appendChild(style);
    const newFont = { name: fontName, label: fontName, category: "مرفوع", url: "", value: `'${fontName}', sans-serif` };
    const updated = [...customFonts, newFont];
    setCustomFonts(updated);
    setSetting("custom_fonts", JSON.stringify(updated));
    setUploading(false);
    toast.success(`تم رفع الخط "${fontName}" ✓`);
  };

  const handleResetFonts = () => {
    FONT_ROLES.forEach(r => {
      document.documentElement.style.removeProperty(r.cssVar);
      setSetting(`font_${r.key}`, "");
    });
    document.documentElement.style.removeProperty("font-size");
    setSetting("font_size", "16");
    setRoleFonts(Object.fromEntries(FONT_ROLES.map(r => [r.key, ""])));
    setFontSize(16);
    toast.success("تم إعادة جميع الخطوط للافتراضي");
  };

  const allFonts = [...FONT_PRESETS, ...customFonts];
  const filtered = allFonts.filter(p => fontCat === "الكل" || p.category === fontCat);
  const currentRole = FONT_ROLES.find(r => r.key === activeRole);
  const currentFontPreset = FONT_PRESETS.find(f => f.name === roleFonts[activeRole]);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Live Preview */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Eye className="w-4 h-4 text-primary" />  
          <h3 className="font-bold text-sm">معاينة مباشرة</h3>
        </div>
        <div className="bg-background rounded-xl p-4 border border-border space-y-3">
          <p className="text-2xl font-bold" style={{ fontFamily: (roleFonts.heading && FONT_PRESETS.find(f=>f.name===roleFonts.heading)?.value) || undefined }}>
            المكتبة الإسلامية الرقمية
          </p>
          <p className="text-base font-semibold text-primary" style={{ fontFamily: (roleFonts.title && FONT_PRESETS.find(f=>f.name===roleFonts.title)?.value) || undefined }}>
            صحيح البخاري — الإمام البخاري
          </p>
          <p className="text-sm text-muted-foreground" style={{ fontFamily: (roleFonts.body && FONT_PRESETS.find(f=>f.name===roleFonts.body)?.value) || undefined }}>
            بسم الله الرحمن الرحيم — نمونہ متن اردو
          </p>
          <div className="flex gap-2 flex-wrap">
            <span className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg" style={{ fontFamily: (roleFonts.button && FONT_PRESETS.find(f=>f.name===roleFonts.button)?.value) || undefined }}>تصفح المكتبة</span>
            <span className="text-xs bg-muted text-muted-foreground px-3 py-1.5 rounded-lg" style={{ fontFamily: (roleFonts.nav && FONT_PRESETS.find(f=>f.name===roleFonts.nav)?.value) || undefined }}>الرئيسية · المكتبة · المفضلة</span>
          </div>
        </div>
      </div>

      {/* Typography Controls */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-5">
        <h3 className="font-bold text-sm flex items-center gap-2"><SlidersHorizontal className="w-4 h-4 text-primary" /> ضبط الطباعة</h3>
        
        <div className="space-y-2">
          <div className="flex justify-between"><Label className="text-xs">حجم الخط الأساسي</Label><span className="text-xs font-mono font-bold text-primary">{fontSize}px</span></div>
          <Slider min={12} max={24} step={1} value={[fontSize]} onValueChange={([v]) => handleFontSize(v)} />
          <div className="flex gap-2 flex-wrap">
            {[13, 14, 15, 16, 17, 18, 20].map(s => (
              <button key={s} onClick={() => handleFontSize(s)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${fontSize === s ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/40"}`}>{s}px</button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between"><Label className="text-xs">ارتفاع السطر</Label><span className="text-xs font-mono font-bold text-primary">{lineHeight}</span></div>
          <Slider min={1.2} max={2.4} step={0.1} value={[lineHeight]} onValueChange={([v]) => handleLineHeight(parseFloat(v.toFixed(1)))} />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between"><Label className="text-xs">تباعد الحروف</Label><span className="text-xs font-mono font-bold text-primary">{letterSpacing}em</span></div>
          <Slider min={-0.05} max={0.2} step={0.01} value={[letterSpacing]} onValueChange={([v]) => handleLetterSpacing(parseFloat(v.toFixed(2)))} />
        </div>
      </div>

      {/* Role Selector */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-bold text-sm mb-4 flex items-center gap-2"><Type className="w-4 h-4 text-primary" /> تخصيص الخط حسب العنصر</h3>
        <div className="grid grid-cols-5 gap-2 mb-5">
          {FONT_ROLES.map(role => (
            <button key={role.key} onClick={() => setActiveRole(role.key)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${activeRole === role.key ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
              <span className="text-xs font-bold">{role.label}</span>
              {roleFonts[role.key]
                ? <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-medium truncate max-w-full">{roleFonts[role.key]}</span>
                : <span className="text-[9px] text-muted-foreground">افتراضي</span>}
            </button>
          ))}
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setFontCat(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border-2 shrink-0 transition-all ${fontCat === cat ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Font Grid */}
        <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
          {filtered.map(preset => {
            const isActive = roleFonts[activeRole] === preset.name;
            return (
              <button key={preset.name} onClick={() => applyRoleFont(currentRole, preset)}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-right ${isActive ? "border-primary bg-primary/5 shadow" : "border-border hover:border-primary/40"}`}>
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0 border border-border">
                  <span className="text-xl" style={{ fontFamily: preset.value }}>{preset.category === "أوردو" ? "ا" : "أ"}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate" style={{ fontFamily: preset.value }}>{preset.label}</p>
                  <p className="text-[10px] text-muted-foreground truncate" style={{ fontFamily: preset.value }}>{currentRole?.sample}</p>
                </div>
                {isActive && <Check className="w-4 h-4 text-primary shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Upload Custom Font */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><Upload className="w-4 h-4 text-primary" /> رفع خط مخصص (TTF / OTF / WOFF)</h3>
        <label className="cursor-pointer block">
          <input type="file" accept=".ttf,.otf,.woff,.woff2" onChange={handleCustomFontUpload} className="hidden" />
          <div className={`flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-dashed transition-colors ${uploading ? "border-primary" : "border-border hover:border-primary/50"}`}>
            {uploading
              ? <><div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /><span className="text-sm text-muted-foreground">جاري الرفع...</span></>
              : <><Upload className="w-4 h-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">اضغط لرفع ملف الخط</span></>}
          </div>
        </label>
        {customFonts.length > 0 && (
          <div className="mt-3 space-y-1">
            {customFonts.map(f => (
              <div key={f.name} className="flex items-center gap-2 text-xs bg-muted/50 px-3 py-2 rounded-lg">
                <span className="text-green-600">✓</span>
                <span className="font-medium">{f.name}</span>
                <span className="text-muted-foreground mr-auto">مرفوع</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button variant="outline" onClick={handleResetFonts} className="w-full rounded-xl h-11 gap-2 font-bold hover:border-destructive/50 hover:text-destructive">
        <RotateCcw className="w-4 h-4" /> إعادة جميع الخطوط للافتراضي
      </Button>
    </div>
  );
}