import { useState, useEffect } from "react";
import { Palette, Check, RotateCcw, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getSetting, setSettings, subscribeToSettings } from "@/lib/settingsStore";

// HSL ↔ HEX helpers
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
function hslToHexSafe(hsl) {
  if (!hsl) return "#000000";
  const p = hsl.trim().replace(/%/g,"").split(/\s+/);
  if (p.length < 3) return "#000000";
  return hslToHex(Number(p[0]), Number(p[1]), Number(p[2]));
}

const COLOR_PRESETS = [
  { name: "أخضر إسلامي",  bg: "40 30% 97%",  fg: "160 30% 10%", primary: "158 45% 28%", secondary: "40 40% 92%", accent: "43 80% 55%", card: "40 25% 99%",  border: "40 20% 88%", button: "158 45% 28%", shadow: "158 45% 20%" },
  { name: "أزرق عميق",    bg: "220 30% 97%", fg: "220 30% 10%", primary: "217 71% 35%", secondary: "220 30% 92%", accent: "43 80% 55%", card: "220 25% 99%", border: "220 20% 88%", button: "217 71% 35%", shadow: "217 71% 25%" },
  { name: "ذهب فاخر",     bg: "40 20% 97%",  fg: "30 40% 10%",  primary: "38 92% 40%",  secondary: "40 30% 92%", accent: "43 80% 55%", card: "40 15% 98%",  border: "40 20% 85%", button: "38 92% 40%", shadow: "38 92% 30%" },
  { name: "زمردي",        bg: "160 25% 97%", fg: "160 35% 10%", primary: "160 60% 30%", secondary: "160 20% 92%", accent: "43 80% 55%", card: "160 20% 99%", border: "160 15% 88%", button: "160 60% 30%", shadow: "160 60% 20%" },
  { name: "أسود ملكي",    bg: "240 10% 6%",  fg: "240 10% 92%", primary: "271 81% 56%", secondary: "240 10% 14%", accent: "43 80% 55%", card: "240 10% 10%", border: "240 10% 16%", button: "271 81% 56%", shadow: "271 81% 30%" },
  { name: "أبيض نقي",     bg: "0 0% 100%",   fg: "240 10% 10%", primary: "240 5% 26%",  secondary: "0 0% 96%",  accent: "43 80% 55%", card: "0 0% 99%",    border: "0 0% 90%",   button: "240 5% 26%", shadow: "0 0% 50%" },
];

const COLOR_FIELDS = [
  { key: "color_bg",        label: "الخلفية",        cssVar: "--background",  desc: "خلفية الصفحات الرئيسية" },
  { key: "color_fg",        label: "النص",            cssVar: "--foreground",  desc: "لون النصوص الأساسية" },
  { key: "color_primary",   label: "اللون الأساسي",   cssVar: "--primary",     desc: "الأزرار والتمييز" },
  { key: "color_secondary", label: "اللون الثانوي",   cssVar: "--secondary",   desc: "العناصر الثانوية" },
  { key: "color_accent",    label: "لون التمييز",     cssVar: "--accent",      desc: "التوكيدات والنجوم" },
  { key: "color_card",      label: "البطاقات",        cssVar: "--card",        desc: "خلفية البطاقات" },
  { key: "color_border",    label: "الحدود",          cssVar: "--border",      desc: "حدود العناصر" },
  { key: "color_button",    label: "الأزرار",         cssVar: "--primary",     desc: "لون أزرار الإجراء" },
];

export default function DevColors() {
  const [colors, setColors] = useState(() => ({
    color_bg:        getSetting("color_bg"),
    color_fg:        getSetting("color_fg"),
    color_primary:   getSetting("color_primary"),
    color_secondary: getSetting("color_secondary"),
    color_accent:    getSetting("color_accent"),
    color_card:      getSetting("color_card"),
    color_border:    getSetting("color_border"),
    color_button:    getSetting("color_button"),
  }));
  const [activePreset, setActivePreset] = useState(null);

  useEffect(() => {
    const unsub = subscribeToSettings((s) => {
      setColors({
        color_bg:        s.color_bg        || "",
        color_fg:        s.color_fg        || "",
        color_primary:   s.color_primary   || "",
        color_secondary: s.color_secondary || "",
        color_accent:    s.color_accent    || "",
        color_card:      s.color_card      || "",
        color_border:    s.color_border    || "",
        color_button:    s.color_button    || "",
      });
    });
    return unsub;
  }, []);

  const applyColors = (c) => {
    if (c.color_bg)        document.documentElement.style.setProperty("--background", c.color_bg);
    if (c.color_fg)        document.documentElement.style.setProperty("--foreground", c.color_fg);
    if (c.color_primary)   { ["--primary","--ring","--sidebar-primary"].forEach(v => document.documentElement.style.setProperty(v, c.color_primary)); }
    if (c.color_secondary) document.documentElement.style.setProperty("--secondary", c.color_secondary);
    if (c.color_accent)    document.documentElement.style.setProperty("--accent", c.color_accent);
    if (c.color_card)      { ["--card","--popover"].forEach(v => document.documentElement.style.setProperty(v, c.color_card)); }
    if (c.color_border)    { ["--border","--input"].forEach(v => document.documentElement.style.setProperty(v, c.color_border)); }
  };

  const handlePreset = (preset) => {
    const c = {
      color_bg:        preset.bg,
      color_fg:        preset.fg,
      color_primary:   preset.primary,
      color_secondary: preset.secondary,
      color_accent:    preset.accent,
      color_card:      preset.card,
      color_border:    preset.border,
      color_button:    preset.button,
    };
    setColors(c);
    setActivePreset(preset.name);
    applyColors(c);
    setSettings(c);
    toast.success(`تم تطبيق ثيم "${preset.name}" ✓`);
  };

  const handleColorChange = (key, hexVal) => {
    const hsl = hexToHsl(hexVal);
    const updated = { ...colors, [key]: hsl };
    setColors(updated);
    applyColors(updated);
    setSettings({ [key]: hsl });
  };

  const handleReset = () => {
    const reset = Object.fromEntries(Object.keys(colors).map(k => [k, ""]));
    setColors(reset);
    setSettings(reset);
    setActivePreset(null);
    Object.keys(colors).forEach(k => {
      const field = COLOR_FIELDS.find(f => f.key === k);
      if (field) document.documentElement.style.removeProperty(field.cssVar);
    });
    ["--ring","--sidebar-primary","--popover","--input"].forEach(v => document.documentElement.style.removeProperty(v));
    toast.success("تم إعادة الألوان للافتراضي");
  };

  const handleExport = () => {
    const data = JSON.stringify(colors, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "theme.json"; a.click();
    toast.success("تم تصدير الثيم ✓");
  };

  const handleImport = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        setColors(data);
        applyColors(data);
        setSettings(data);
        toast.success("تم استيراد الثيم ✓");
      } catch { toast.error("ملف غير صحيح"); }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Preset Themes */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-bold text-sm mb-4 flex items-center gap-2"><Palette className="w-4 h-4 text-primary" /> ثيمات جاهزة</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {COLOR_PRESETS.map(p => (
            <button key={p.name} onClick={() => handlePreset(p)}
              className={`relative flex flex-col gap-2 p-3 rounded-xl border-2 transition-all ${activePreset === p.name ? "border-primary shadow-md shadow-primary/20" : "border-border hover:border-primary/40"}`}>
              <div className="flex gap-1 rounded-lg overflow-hidden h-8 shadow-sm">
                <div className="flex-1" style={{ background: `hsl(${p.bg})` }} />
                <div className="flex-1" style={{ background: `hsl(${p.primary})` }} />
                <div className="flex-1" style={{ background: `hsl(${p.accent})` }} />
                <div className="flex-1" style={{ background: `hsl(${p.card})`, border: "1px solid hsl(0 0% 80%)" }} />
              </div>
              <span className="text-xs font-bold text-center">{p.name}</span>
              {activePreset === p.name && <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center"><Check className="w-3 h-3 text-primary-foreground" /></div>}
            </button>
          ))}
        </div>
      </div>

      {/* Live Preview */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-bold text-sm mb-4">معاينة مباشرة</h3>
        <div className="rounded-xl overflow-hidden border border-border shadow-sm">
          <div style={{ background: colors.color_bg ? `hsl(${colors.color_bg})` : undefined }} className="bg-background px-4 py-3 flex items-center gap-2 border-b border-border">
            <div style={{ background: colors.color_primary ? `hsl(${colors.color_primary})` : undefined }} className="w-7 h-7 rounded-lg bg-primary" />
            <span style={{ color: colors.color_fg ? `hsl(${colors.color_fg})` : undefined }} className="text-sm font-bold">المكتبة الدينية</span>
            <div className="flex gap-1 mr-auto">
              {["الرئيسية","المكتبة","المفضلة"].map((n,i) => (
                <span key={i} style={i===0 ? { background: colors.color_primary ? `hsl(${colors.color_primary})` : undefined, color:"white" } : { color: colors.color_fg ? `hsl(${colors.color_fg})` : undefined }}
                  className={`text-[10px] px-2 py-0.5 rounded-md ${i===0?"bg-primary text-primary-foreground":"text-muted-foreground"}`}>{n}</span>
              ))}
            </div>
          </div>
          <div style={{ background: colors.color_bg ? `hsl(${colors.color_bg})` : undefined }} className="bg-background px-3 py-3 grid grid-cols-3 gap-2">
            {[1,2,3].map(i => (
              <div key={i} style={{ background: colors.color_card ? `hsl(${colors.color_card})` : undefined, borderColor: colors.color_border ? `hsl(${colors.color_border})` : undefined }} className="bg-card rounded-xl p-3 border border-border">
                <div style={{ background: colors.color_primary ? `hsl(${colors.color_primary})` : undefined, opacity: 0.2 }} className="rounded-lg h-10 mb-2 bg-primary/20" />
                <div className="bg-foreground/20 rounded h-2 w-3/4 mb-1" />
                <div className="bg-foreground/10 rounded h-1.5 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Color Fields */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-bold text-sm mb-4">ضبط الألوان المتقدم</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {COLOR_FIELDS.map(({ key, label, desc }) => {
            const hsl = colors[key];
            const hex = hsl ? hslToHexSafe(hsl) : "#888888";
            return (
              <div key={key} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border">
                <label className="relative cursor-pointer shrink-0">
                  <div className="w-12 h-12 rounded-xl border-2 border-border shadow-sm overflow-hidden" style={{ background: hsl ? `hsl(${hsl})` : hex }}>
                    <input type="color" value={hex} onChange={e => handleColorChange(key, e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                  </div>
                </label>
                <div className="flex-1 min-w-0">
                  <Label className="text-xs font-bold">{label}</Label>
                  <p className="text-[10px] text-muted-foreground">{desc}</p>
                  <p className="text-[10px] font-mono text-primary mt-0.5">{hex}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <Button onClick={handleExport} variant="outline" className="gap-2 rounded-xl font-bold flex-1">
          <Download className="w-4 h-4" /> تصدير الثيم
        </Button>
        <label className="flex-1 cursor-pointer">
          <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          <div className="flex items-center justify-center gap-2 h-9 px-4 rounded-xl border border-input bg-background shadow-sm hover:bg-muted font-bold text-sm cursor-pointer transition-colors">
            <Upload className="w-4 h-4" /> استيراد ثيم
          </div>
        </label>
        <Button onClick={handleReset} variant="outline" className="gap-2 rounded-xl font-bold hover:border-destructive/50 hover:text-destructive flex-1">
          <RotateCcw className="w-4 h-4" /> إعادة للافتراضي
        </Button>
      </div>
    </div>
  );
}