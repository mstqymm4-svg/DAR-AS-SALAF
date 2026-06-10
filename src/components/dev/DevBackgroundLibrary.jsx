import { useState } from "react";
import { toast } from "sonner";
import { Check, Zap } from "lucide-react";
import { setSettings, getSetting } from "@/lib/settingsStore";

// ── Preset library ─────────────────────────────────────────────────────────────
const PRESETS = [
  // Animated
  {
    id: "islamic_gold", category: "إسلامية",
    label: "ذهبي إسلامي", icon: "☪", preview: "from-yellow-900 via-amber-800 to-yellow-700",
    settings: { hero_bg_type: "islamic_pattern", hero_grad_from: "#4a3000", hero_grad_to: "#c9860a", hero_anim_speed: "5" }
  },
  {
    id: "islamic_green", category: "إسلامية",
    label: "أخضر إسلامي", icon: "🕌", preview: "from-green-950 via-emerald-900 to-green-800",
    settings: { hero_bg_type: "islamic_pattern", hero_grad_from: "#052e16", hero_grad_to: "#166534", hero_anim_speed: "4" }
  },
  {
    id: "islamic_blue", category: "إسلامية",
    label: "أزرق إسلامي", icon: "🌙", preview: "from-blue-950 via-blue-900 to-indigo-900",
    settings: { hero_bg_type: "islamic_pattern", hero_grad_from: "#0a1628", hero_grad_to: "#1e3a8a", hero_anim_speed: "4" }
  },
  {
    id: "stars_night", category: "إسلامية",
    label: "ليلة نجوم", icon: "⭐", preview: "from-slate-950 via-indigo-950 to-slate-900",
    settings: { hero_bg_type: "stars", hero_grad_from: "#020617", hero_grad_to: "#1e1b4b", hero_anim_speed: "3" }
  },
  // Gradients animated
  {
    id: "luxury_green", category: "فخمة",
    label: "فخم أخضر", icon: "💚", preview: "from-emerald-900 to-green-600",
    settings: { hero_bg_type: "gradient_anim", hero_grad_from: "#064e3b", hero_grad_to: "#059669", hero_anim_speed: "6" }
  },
  {
    id: "luxury_blue", category: "فخمة",
    label: "فخم أزرق", icon: "💎", preview: "from-blue-950 to-cyan-700",
    settings: { hero_bg_type: "gradient_anim", hero_grad_from: "#0c1445", hero_grad_to: "#0891b2", hero_anim_speed: "5" }
  },
  {
    id: "luxury_gold", category: "فخمة",
    label: "فخم ذهبي", icon: "✨", preview: "from-yellow-950 to-amber-600",
    settings: { hero_bg_type: "gradient_anim", hero_grad_from: "#451a03", hero_grad_to: "#d97706", hero_anim_speed: "5" }
  },
  {
    id: "luxury_purple", category: "فخمة",
    label: "فخم بنفسجي", icon: "👑", preview: "from-purple-950 to-fuchsia-700",
    settings: { hero_bg_type: "gradient_anim", hero_grad_from: "#1e0a3c", hero_grad_to: "#9333ea", hero_anim_speed: "6" }
  },
  {
    id: "luxury_dark", category: "فخمة",
    label: "فخم داكن", icon: "🖤", preview: "from-neutral-950 to-slate-800",
    settings: { hero_bg_type: "gradient_anim", hero_grad_from: "#0a0a0a", hero_grad_to: "#1e293b", hero_anim_speed: "4" }
  },
  // Particles
  {
    id: "particles_gold", category: "متحركة",
    label: "جزيئات ذهبية", icon: "🌟", preview: "from-amber-950 to-yellow-900",
    settings: { hero_bg_type: "particles", hero_grad_from: "#3d1c00", hero_grad_to: "#92400e", hero_anim_speed: "5" }
  },
  {
    id: "particles_green", category: "متحركة",
    label: "جزيئات خضراء", icon: "🍃", preview: "from-green-950 to-emerald-800",
    settings: { hero_bg_type: "particles", hero_grad_from: "#052e16", hero_grad_to: "#065f46", hero_anim_speed: "4" }
  },
  {
    id: "waves_ocean", category: "متحركة",
    label: "موجات المحيط", icon: "🌊", preview: "from-cyan-950 to-blue-800",
    settings: { hero_bg_type: "waves", hero_grad_from: "#083344", hero_grad_to: "#1e40af", hero_anim_speed: "3" }
  },
  {
    id: "floating_shapes", category: "متحركة",
    label: "أشكال طائرة", icon: "◆", preview: "from-violet-950 to-purple-800",
    settings: { hero_bg_type: "floating_shapes", hero_grad_from: "#2e1065", hero_grad_to: "#7e22ce", hero_anim_speed: "4" }
  },
  // Image presets
  {
    id: "unsplash_mosque", category: "صور",
    label: "مسجد فخم", icon: "🕌", preview: "from-stone-900 to-stone-700",
    settings: {
      hero_bg_type: "static_image",
      hero_bg_url: "https://images.unsplash.com/photo-1542816417-0983c9c9ad53?w=1600&auto=format&fit=crop",
      hero_bg_brightness: "70", hero_overlay_alpha: "30", hero_overlay_color: "#000000"
    }
  },
  {
    id: "unsplash_quran", category: "صور",
    label: "قرآن كريم", icon: "📖", preview: "from-amber-950 to-amber-800",
    settings: {
      hero_bg_type: "static_image",
      hero_bg_url: "https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=1600&auto=format&fit=crop",
      hero_bg_brightness: "60", hero_overlay_alpha: "40", hero_overlay_color: "#000000"
    }
  },
  {
    id: "unsplash_library", category: "صور",
    label: "مكتبة كلاسيكية", icon: "📚", preview: "from-stone-800 to-stone-600",
    settings: {
      hero_bg_type: "static_image",
      hero_bg_url: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1600&auto=format&fit=crop",
      hero_bg_brightness: "60", hero_overlay_alpha: "40", hero_overlay_color: "#1a0a00"
    }
  },
  {
    id: "unsplash_kaaba", category: "صور",
    label: "الكعبة المشرفة", icon: "🕋", preview: "from-neutral-900 to-stone-800",
    settings: {
      hero_bg_type: "static_image",
      hero_bg_url: "https://images.unsplash.com/photo-1564769662533-4f00a87b4056?w=1600&auto=format&fit=crop",
      hero_bg_brightness: "65", hero_overlay_alpha: "35", hero_overlay_color: "#000000"
    }
  },
];

const CATEGORIES = ["الكل", "إسلامية", "فخمة", "متحركة", "صور"];

export default function DevBackgroundLibrary() {
  const [activeCategory, setActiveCategory] = useState("الكل");
  const [applied, setApplied] = useState(() => getSetting("hero_bg_preset") || "");

  const filtered = activeCategory === "الكل"
    ? PRESETS
    : PRESETS.filter(p => p.category === activeCategory);

  const applyPreset = (preset) => {
    setSettings({ ...preset.settings, hero_bg_preset: preset.id });
    setApplied(preset.id);
    toast.success(`✓ تم تطبيق "${preset.label}" على الصفحة الرئيسية`);
  };

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-black">مكتبة الخلفيات</h2>
          <p className="text-xs text-muted-foreground">اختر خلفية جاهزة وطبّقها بضغطة واحدة</p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
              activeCategory === cat
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border hover:border-primary/40 bg-card"
            }`}>{cat}</button>
        ))}
      </div>

      {/* Presets Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {filtered.map(preset => (
          <button key={preset.id} onClick={() => applyPreset(preset)}
            className={`relative flex flex-col overflow-hidden rounded-2xl border-2 transition-all hover:scale-[1.02] active:scale-95 ${
              applied === preset.id ? "border-primary shadow-lg shadow-primary/20" : "border-border hover:border-primary/50"
            }`}>
            {/* Color preview */}
            <div className={`h-20 bg-gradient-to-br ${preset.preview} flex items-center justify-center`}>
              <span className="text-4xl">{preset.icon}</span>
              {applied === preset.id && (
                <div className="absolute top-2 left-2 bg-primary text-primary-foreground rounded-full p-0.5">
                  <Check className="w-3 h-3" />
                </div>
              )}
            </div>
            <div className="bg-card p-2 text-right">
              <p className="text-xs font-bold truncate">{preset.label}</p>
              <p className="text-[10px] text-muted-foreground">{preset.category}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}