/**
 * AiLayerStudio — إنشاء طبقات خلفية فخمة بالوصف فقط (بلا كود)
 * يولّد HTML+CSS احترافي متعدد الطبقات مع وهج وعمق وحركة لانهائية.
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Sparkles, RefreshCw, Wand2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const IDEAS = [
  "غبار ذهبي يتصاعد ببطء مع وهج دافئ",
  "نجوم تتلألأ وشفق أخضر زمردي ناعم",
  "خطوط نور إسلامية هندسية تتنفس",
  "أوراق ذهبية تتساقط مع ضباب خفيف",
  "موجات حرير سوداء وذهبية تتحرك بهدوء",
  "دوائر نور متوهجة تتوسع كالمياه",
];

const LUXE = [
  { id: "soft",  label: "هادئ",     hint: "very subtle, minimal, calm" },
  { id: "rich",  label: "فخم",      hint: "rich layered depth, elegant glow" },
  { id: "ultra", label: "فخم جداً", hint: "cinematic, ultra-premium, many depth layers, bloom and light sweeps" },
];

const PALETTES = [
  { id: "emerald_gold", label: "زمردي وذهبي", hint: "#0f3d2e, #1a6b3c, #ffd786, #f5e9c8" },
  { id: "black_gold",   label: "أسود وذهبي",  hint: "#0a0a0a, #1a1410, #d4af37, #fff3cf" },
  { id: "night_blue",   label: "أزرق ليلي",   hint: "#081226, #123a63, #9ed8ff, #ffffff" },
  { id: "warm_sand",    label: "رملي دافئ",   hint: "#2a1d10, #6b4a22, #e8c990, #fff6e6" },
  { id: "auto",         label: "حسب الوصف",   hint: "choose the most fitting elegant palette for the description" },
];

export default function AiLayerStudio({ layerForm, setLayerForm }) {
  const [busy, setBusy] = useState(false);
  const luxe    = layerForm.aiLuxe    || "rich";
  const palette = layerForm.aiPalette || "emerald_gold";
  const motion  = layerForm.aiMotion  ?? 5;

  const generate = async (variation = false) => {
    const desc = (layerForm.aiPrompt || "").trim();
    if (!desc) { toast.error("اكتب وصف التأثير الذي تريده"); return; }
    const ns = "ai" + Math.random().toString(36).slice(2, 8);
    const lx = LUXE.find(l => l.id === luxe);
    const pl = PALETTES.find(p => p.id === palette);
    setBusy(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        model: "gemini_3_flash",
        prompt: `Create a premium animated CSS overlay layer for a website hero banner.

Description (Arabic): "${desc}"
Style: ${lx.hint} · Palette: ${pl.hint} · Speed: ${motion}/10
${variation ? "Give a different composition than the obvious one." : ""}

Output one <style> block + one <div class="${ns}">…</div>.
Rules:
- Namespace every class and @keyframes with "${ns}". No global selectors.
- Wrapper: position:absolute;inset:0;overflow:hidden;pointer-events:none.
- HTML+CSS only, no JS, no images, no text. Max 30 elements.
- Infinite seamless loops; animate transform/opacity/filter only.
- 2–3 depth layers: soft radial-gradient glow base, blurred glow orbs, fine particles. Use mix-blend-mode:screen, low opacity (0.08–0.5), varied :nth-child sizes/positions/durations (10s–30s) with negative delays.
- Stays subtle so white text above remains readable.

Return only the html.`,
        response_json_schema: {
          type: "object",
          properties: { html: { type: "string" }, name: { type: "string" } },
          required: ["html"]
        }
      });
      const html = (res?.html || "").replace(/^```[a-z]*\n?|```$/g, "").trim();
      if (!html) { toast.error("تعذر إنشاء التأثير — حاول بوصف آخر"); return; }
      setLayerForm(f => ({ ...f, html, label: f.label || res?.name || desc.slice(0, 24) }));
      toast.success(variation ? "تنويع جديد جاهز ✓" : "تم إنشاء طبقة فخمة ✓ شاهد المعاينة");
    } catch {
      toast.error("حدث خطأ أثناء الإنشاء — أعد المحاولة");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs flex items-center gap-1.5">
          <Wand2 className="w-3.5 h-3.5 text-primary" /> صف التأثير الذي تريده بكلماتك
        </Label>
        <textarea value={layerForm.aiPrompt || ""}
          onChange={e => setLayerForm({ ...layerForm, aiPrompt: e.target.value })}
          className="mt-1.5 w-full h-20 p-2.5 text-xs bg-card rounded-xl border border-border resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="مثال: غبار ذهبي يتصاعد ببطء مع وهج دافئ وأشعة نور خفيفة" />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {IDEAS.map(i => (
          <button key={i} onClick={() => setLayerForm({ ...layerForm, aiPrompt: i })}
            className="px-2 py-1 rounded-full border border-border bg-card text-[10px] hover:border-primary/50 hover:text-primary transition-colors">
            {i}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[11px]">مستوى الفخامة</Label>
          <div className="flex gap-1 bg-card p-1 rounded-xl border border-border">
            {LUXE.map(l => (
              <button key={l.id} onClick={() => setLayerForm({ ...layerForm, aiLuxe: l.id })}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                  luxe === l.id ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}>{l.label}</button>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-[11px]">لوحة الألوان</Label>
          <select value={palette} onChange={e => setLayerForm({ ...layerForm, aiPalette: e.target.value })}
            className="w-full h-9 rounded-lg bg-card border border-border text-xs px-2">
            {PALETTES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-[11px]">سرعة الحركة: {motion}/10</Label>
        <Slider min={1} max={10} value={[motion]}
          onValueChange={([v]) => setLayerForm({ ...layerForm, aiMotion: v })} />
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={() => generate(false)} disabled={busy} className="flex-1 h-9 text-xs gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          {busy ? "جارٍ إنشاء طبقة فخمة..." : "أنشئ التأثير"}
        </Button>
        {layerForm.html && (
          <Button size="sm" variant="outline" onClick={() => generate(true)} disabled={busy} className="h-9 text-xs gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> تنويع آخر
          </Button>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground leading-relaxed">
        كل وصف يُنتج طبقة جديدة بالكامل — لا حدود للاحتمالات. يمكنك توليد تنويعات متعددة لنفس الوصف واختيار الأجمل.
      </p>
    </div>
  );
}