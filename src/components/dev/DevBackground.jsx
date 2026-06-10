import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Image, Video, Layers, Play, Pause, Upload, Trash2,
  Eye, Settings, Film, Zap, RefreshCw, Plus, X, Check
} from "lucide-react";
import { getSetting, setSetting, setSettings } from "@/lib/settingsStore";
import { base44 } from "@/api/base44Client";

const BG_TYPES = [
  { id: "gradient_anim",    label: "تدرج متحرك",           icon: "🌈" },
  { id: "particles",        label: "جزيئات متحركة",         icon: "✨" },
  { id: "islamic_pattern",  label: "نمط إسلامي",            icon: "☪" },
  { id: "floating_shapes",  label: "أشكال طائرة",           icon: "◆" },
  { id: "stars",            label: "نجوم متحركة",           icon: "⭐" },
  { id: "waves",            label: "موجات متحركة",          icon: "〰" },
  { id: "static_image",     label: "صورة ثابتة",            icon: "🖼" },
  { id: "animated_gif",     label: "صورة متحركة (GIF)",     icon: "🎞" },
  { id: "slideshow",        label: "عرض شرائح",             icon: "📸" },
  { id: "video_mp4",        label: "فيديو MP4",             icon: "🎬" },
  { id: "video_webm",       label: "فيديو WebM",            icon: "🎥" },
  { id: "lottie",           label: "رسوم Lottie",           icon: "🎨" },
  { id: "custom_html",      label: "كود HTML مخصص",         icon: "💻" },
];

const TRANSITIONS = ["fade", "slide", "zoom", "flip", "blur"];

export default function DevBackground() {
  const [bgType, setBgType]               = useState(() => getSetting("hero_bg_type") || "gradient_anim");
  const [heroTitle, setHeroTitle]         = useState(() => getSetting("hero_title") || "");
  const [heroSubtitle, setHeroSubtitle]   = useState(() => getSetting("hero_subtitle") || "");
  const [heroBtnText, setHeroBtnText]     = useState(() => getSetting("hero_btn_text") || "");
  const [heroBtnLink, setHeroBtnLink]     = useState(() => getSetting("hero_btn_link") || "/books");
  const [opacity, setOpacity]             = useState(() => Number(getSetting("hero_bg_opacity") || 100));
  const [blur, setBlur]                   = useState(() => Number(getSetting("hero_bg_blur") || 0));
  const [brightness, setBrightness]       = useState(() => Number(getSetting("hero_bg_brightness") || 100));
  const [overlayColor, setOverlayColor]   = useState(() => getSetting("hero_overlay_color") || "#000000");
  const [overlayAlpha, setOverlayAlpha]   = useState(() => Number(getSetting("hero_overlay_alpha") || 30));
  const [animSpeed, setAnimSpeed]         = useState(() => Number(getSetting("hero_anim_speed") || 5));
  const [zoomEffect, setZoomEffect]       = useState(() => getSetting("hero_zoom") === "true");
  const [parallax, setParallax]           = useState(() => getSetting("hero_parallax") === "true");
  const [bgUrl, setBgUrl]                 = useState(() => getSetting("hero_bg_url") || "");
  const [slideshowUrls, setSlideshowUrls] = useState(() => { try { return JSON.parse(getSetting("hero_slideshow_urls") || "[]"); } catch { return []; } });
  const [slideTransition, setSlideTransition] = useState(() => getSetting("hero_slide_transition") || "fade");
  const [slideDuration, setSlideDuration] = useState(() => Number(getSetting("hero_slide_duration") || 4));
  const [videoAutoplay, setVideoAutoplay] = useState(() => getSetting("hero_video_autoplay") !== "false");
  const [videoLoop, setVideoLoop]         = useState(() => getSetting("hero_video_loop") !== "false");
  const [videoMute, setVideoMute]         = useState(() => getSetting("hero_video_mute") !== "false");
  const [videoBrightness, setVideoBrightness] = useState(() => Number(getSetting("hero_video_brightness") || 100));
  const [videoMobile, setVideoMobile]     = useState(() => getSetting("hero_video_mobile") !== "false");
  const [lottieUrl, setLottieUrl]         = useState(() => getSetting("hero_lottie_url") || "");
  const [customHtml, setCustomHtml]       = useState(() => getSetting("hero_custom_html") || "");
  const [gradientFrom, setGradientFrom]   = useState(() => getSetting("hero_grad_from") || "#134e2a");
  const [gradientTo, setGradientTo]       = useState(() => getSetting("hero_grad_to") || "#1a6b3c");
  const [uploading, setUploading]         = useState(false);
  const [uploadPct, setUploadPct]         = useState(0);
  const [activeTab, setActiveTab]         = useState("type");
  const fileRef = useRef();
  const slideshowFileRef = useRef();
  const lottieFileRef = useRef();

  const save = (key, val) => setSetting(key, String(val));

  const saveAll = () => {
    setSettings({
      hero_bg_type: bgType, hero_title: heroTitle, hero_subtitle: heroSubtitle,
      hero_btn_text: heroBtnText, hero_btn_link: heroBtnLink,
      hero_bg_opacity: opacity, hero_bg_blur: blur, hero_bg_brightness: brightness,
      hero_overlay_color: overlayColor, hero_overlay_alpha: overlayAlpha,
      hero_anim_speed: animSpeed, hero_zoom: zoomEffect, hero_parallax: parallax,
      hero_bg_url: bgUrl, hero_slideshow_urls: JSON.stringify(slideshowUrls),
      hero_slide_transition: slideTransition, hero_slide_duration: slideDuration,
      hero_video_autoplay: videoAutoplay, hero_video_loop: videoLoop,
      hero_video_mute: videoMute, hero_video_brightness: videoBrightness,
      hero_video_mobile: videoMobile, hero_lottie_url: lottieUrl,
      hero_custom_html: customHtml, hero_grad_from: gradientFrom, hero_grad_to: gradientTo,
    });
  };

  useEffect(() => { saveAll(); }, [bgType, heroTitle, heroSubtitle, heroBtnText, heroBtnLink,
    opacity, blur, brightness, overlayColor, overlayAlpha, animSpeed, zoomEffect, parallax,
    bgUrl, slideshowUrls, slideTransition, slideDuration, videoAutoplay, videoLoop, videoMute,
    videoBrightness, videoMobile, lottieUrl, customHtml, gradientFrom, gradientTo]);

  const uploadFile = async (file, onDone) => {
    if (!file) return;
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) { toast.error("الحجم الأقصى 500MB"); return; }
    setUploading(true); setUploadPct(0);
    const fakeProgress = setInterval(() => setUploadPct(p => Math.min(p + 10, 85)), 200);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      clearInterval(fakeProgress); setUploadPct(100);
      onDone(file_url);
      toast.success("تم الرفع بنجاح");
    } catch {
      clearInterval(fakeProgress);
      toast.error("فشل الرفع");
    } finally {
      setTimeout(() => { setUploading(false); setUploadPct(0); }, 800);
    }
  };

  const addSlideshowImage = (url) => setSlideshowUrls(prev => [...prev, url]);
  const removeSlideshowImage = (i) => setSlideshowUrls(prev => prev.filter((_, idx) => idx !== i));

  const isVideo   = bgType === "video_mp4" || bgType === "video_webm";
  const isImage   = bgType === "static_image" || bgType === "animated_gif";
  const isSlide   = bgType === "slideshow";
  const isLottie  = bgType === "lottie";
  const isHtml    = bgType === "custom_html";
  const isGrad    = bgType === "gradient_anim";
  const isAnim    = ["particles","islamic_pattern","floating_shapes","stars","waves"].includes(bgType);

  const TABS = [
    { id: "type",     label: "نوع الخلفية",   icon: Layers },
    { id: "content",  label: "محتوى البانر",  icon: Image },
    { id: "effects",  label: "التأثيرات",     icon: Zap },
    { id: "upload",   label: "رفع ملفات",     icon: Upload },
    ...(isVideo ? [{ id: "video", label: "إعدادات الفيديو", icon: Film }] : []),
    ...(isSlide ? [{ id: "slide", label: "إعدادات الشرائح", icon: Play }] : []),
  ];

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
          <Image className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-black">إدارة الخلفيات</h2>
          <p className="text-xs text-muted-foreground">تحكم كامل في خلفية البانر الرئيسي</p>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-muted/50 p-1 rounded-xl overflow-x-auto">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === tab.id ? "bg-white dark:bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}>
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TYPE TAB ── */}
      {activeTab === "type" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">اختر نوع خلفية البانر الرئيسي:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {BG_TYPES.map(type => (
              <button key={type.id} onClick={() => setBgType(type.id)}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  bgType === type.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card hover:border-primary/40 hover:bg-muted"
                }`}>
                <span className="text-lg">{type.icon}</span>
                <span className="text-xs">{type.label}</span>
                {bgType === type.id && <Check className="w-3.5 h-3.5 mr-auto shrink-0" />}
              </button>
            ))}
          </div>

          {/* Gradient colors */}
          {isGrad && (
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold">ألوان التدرج</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1">اللون الأول</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={gradientFrom} onChange={e => setGradientFrom(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-border" />
                    <span className="text-xs text-muted-foreground">{gradientFrom}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-xs mb-1">اللون الثاني</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={gradientTo} onChange={e => setGradientTo(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-border" />
                    <span className="text-xs text-muted-foreground">{gradientTo}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Animation speed for animated types */}
          {isAnim && (
            <div className="bg-card border border-border rounded-xl p-4 space-y-2">
              <Label className="text-xs">سرعة الحركة: {animSpeed}x</Label>
              <Slider min={1} max={10} step={1} value={[animSpeed]}
                onValueChange={([v]) => setAnimSpeed(v)} />
            </div>
          )}

          {/* Custom HTML */}
          {isHtml && (
            <div className="space-y-2">
              <Label className="text-xs">كود HTML/CSS/JS المخصص</Label>
              <textarea value={customHtml} onChange={e => setCustomHtml(e.target.value)}
                className="w-full h-40 p-3 text-xs font-mono bg-muted rounded-xl border border-border resize-none"
                placeholder="<div style='...'>...</div>" />
            </div>
          )}
        </div>
      )}

      {/* ── CONTENT TAB ── */}
      {activeTab === "content" && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            <p className="text-sm font-semibold flex items-center gap-2"><Settings className="w-4 h-4" /> محتوى البانر</p>
            <div className="space-y-1">
              <Label className="text-xs">العنوان الرئيسي</Label>
              <Input value={heroTitle} onChange={e => setHeroTitle(e.target.value)}
                placeholder="اتركه فارغاً لاستخدام الافتراضي" className="text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">العنوان الفرعي</Label>
              <Input value={heroSubtitle} onChange={e => setHeroSubtitle(e.target.value)}
                placeholder="اتركه فارغاً لاستخدام الافتراضي" className="text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">نص الزر</Label>
              <Input value={heroBtnText} onChange={e => setHeroBtnText(e.target.value)}
                placeholder="اتركه فارغاً لاستخدام الافتراضي" className="text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">رابط الزر</Label>
              <Input value={heroBtnLink} onChange={e => setHeroBtnLink(e.target.value)}
                placeholder="/books" className="text-sm" dir="ltr" />
            </div>
          </div>
        </div>
      )}

      {/* ── EFFECTS TAB ── */}
      {activeTab === "effects" && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            <p className="text-sm font-semibold">تأثيرات الخلفية</p>
            <div className="space-y-3">
              <div>
                <Label className="text-xs mb-1 block">الشفافية: {opacity}%</Label>
                <Slider min={10} max={100} value={[opacity]} onValueChange={([v]) => setOpacity(v)} />
              </div>
              <div>
                <Label className="text-xs mb-1 block">ضبابية: {blur}px</Label>
                <Slider min={0} max={30} value={[blur]} onValueChange={([v]) => setBlur(v)} />
              </div>
              <div>
                <Label className="text-xs mb-1 block">السطوع: {brightness}%</Label>
                <Slider min={20} max={150} value={[brightness]} onValueChange={([v]) => setBrightness(v)} />
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            <p className="text-sm font-semibold">طبقة اللون</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Label className="text-xs">لون الطبقة</Label>
                <input type="color" value={overlayColor} onChange={e => setOverlayColor(e.target.value)}
                  className="w-10 h-8 rounded border border-border cursor-pointer" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">شفافية الطبقة: {overlayAlpha}%</Label>
                <Slider min={0} max={90} value={[overlayAlpha]} onValueChange={([v]) => setOverlayAlpha(v)} />
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold">تأثيرات حركية</p>
            <div className="flex items-center justify-between">
              <Label className="text-xs">تأثير التكبير (Zoom)</Label>
              <Switch checked={zoomEffect} onCheckedChange={setZoomEffect} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">تأثير المنظور (Parallax)</Label>
              <Switch checked={parallax} onCheckedChange={setParallax} />
            </div>
            <div>
              <Label className="text-xs mb-1 block">سرعة الحركة: {animSpeed}x</Label>
              <Slider min={1} max={10} step={1} value={[animSpeed]} onValueChange={([v]) => setAnimSpeed(v)} />
            </div>
          </div>
        </div>
      )}

      {/* ── UPLOAD TAB ── */}
      {activeTab === "upload" && (
        <div className="space-y-4">
          {/* Main bg upload */}
          {(isImage || isVideo) && (
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold">
                {isVideo ? "رفع ملف الفيديو" : "رفع صورة الخلفية"}
              </p>
              {bgUrl && (
                <div className="relative rounded-xl overflow-hidden border border-border">
                  {isVideo
                    ? <video src={bgUrl} className="w-full h-32 object-cover" muted />
                    : <img src={bgUrl} className="w-full h-32 object-cover" alt="bg" />}
                  <button onClick={() => setBgUrl("")}
                    className="absolute top-2 left-2 bg-destructive text-white rounded-full p-1">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
              <input ref={fileRef} type="file"
                accept={isVideo ? "video/mp4,video/webm" : "image/jpeg,image/png,image/webp,image/gif"}
                className="hidden" onChange={e => uploadFile(e.target.files[0], setBgUrl)} />
              <Button variant="outline" className="w-full gap-2" onClick={() => fileRef.current.click()} disabled={uploading}>
                <Upload className="w-4 h-4" />
                {uploading ? `جارٍ الرفع... ${uploadPct}%` : "اختر ملفاً"}
              </Button>
              {uploading && (
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full transition-all duration-200" style={{ width: `${uploadPct}%` }} />
                </div>
              )}
              {bgUrl && (
                <div className="space-y-1">
                  <Label className="text-xs">أو أدخل رابط مباشر</Label>
                  <Input value={bgUrl} onChange={e => setBgUrl(e.target.value)} dir="ltr" className="text-xs" />
                </div>
              )}
            </div>
          )}

          {/* Lottie upload */}
          {isLottie && (
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold">رفع ملف Lottie JSON</p>
              <input ref={lottieFileRef} type="file" accept=".json" className="hidden"
                onChange={e => uploadFile(e.target.files[0], setLottieUrl)} />
              <Button variant="outline" className="w-full gap-2" onClick={() => lottieFileRef.current.click()} disabled={uploading}>
                <Upload className="w-4 h-4" />
                {uploading ? `جارٍ الرفع... ${uploadPct}%` : "اختر ملف JSON"}
              </Button>
              <div className="space-y-1">
                <Label className="text-xs">أو أدخل رابط Lottie</Label>
                <Input value={lottieUrl} onChange={e => setLottieUrl(e.target.value)} dir="ltr" className="text-xs"
                  placeholder="https://assets.lottiefiles.com/..." />
              </div>
            </div>
          )}

          {/* Slideshow upload */}
          {isSlide && (
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold">صور عرض الشرائح</p>
              <div className="grid grid-cols-3 gap-2">
                {slideshowUrls.map((url, i) => (
                  <div key={i} className="relative rounded-xl overflow-hidden border border-border">
                    <img src={url} className="w-full h-20 object-cover" alt={`slide ${i+1}`} />
                    <button onClick={() => removeSlideshowImage(i)}
                      className="absolute top-1 left-1 bg-destructive text-white rounded-full p-0.5">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
                <button onClick={() => slideshowFileRef.current.click()} disabled={uploading}
                  className="flex flex-col items-center justify-center h-20 rounded-xl border-2 border-dashed border-primary/30 hover:border-primary text-muted-foreground hover:text-primary transition-colors">
                  <Plus className="w-5 h-5" />
                  <span className="text-[10px] mt-1">إضافة</span>
                </button>
              </div>
              <input ref={slideshowFileRef} type="file" accept="image/*" className="hidden"
                onChange={e => uploadFile(e.target.files[0], addSlideshowImage)} />
              {uploading && (
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${uploadPct}%` }} />
                </div>
              )}
            </div>
          )}

          {/* Direct URL for any type */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-2">
            <p className="text-sm font-semibold">رابط مباشر للخلفية</p>
            <Input value={bgUrl} onChange={e => setBgUrl(e.target.value)} dir="ltr" className="text-xs"
              placeholder="https://..." />
          </div>
        </div>
      )}

      {/* ── VIDEO TAB ── */}
      {activeTab === "video" && isVideo && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <p className="text-sm font-semibold flex items-center gap-2"><Film className="w-4 h-4" /> إعدادات الفيديو</p>
          <div className="space-y-3">
            {[
              { label: "تشغيل تلقائي", val: videoAutoplay, set: setVideoAutoplay },
              { label: "تكرار الفيديو", val: videoLoop, set: setVideoLoop },
              { label: "كتم الصوت", val: videoMute, set: setVideoMute },
              { label: "تحسين الجوال", val: videoMobile, set: setVideoMobile },
            ].map(({ label, val, set }) => (
              <div key={label} className="flex items-center justify-between">
                <Label className="text-xs">{label}</Label>
                <Switch checked={val} onCheckedChange={set} />
              </div>
            ))}
            <div>
              <Label className="text-xs mb-1 block">سطوع الفيديو: {videoBrightness}%</Label>
              <Slider min={20} max={150} value={[videoBrightness]} onValueChange={([v]) => setVideoBrightness(v)} />
            </div>
          </div>
        </div>
      )}

      {/* ── SLIDE TAB ── */}
      {activeTab === "slide" && isSlide && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <p className="text-sm font-semibold flex items-center gap-2"><Play className="w-4 h-4" /> إعدادات الشرائح</p>
          <div className="space-y-2">
            <Label className="text-xs">نوع الانتقال</Label>
            <div className="flex gap-2 flex-wrap">
              {TRANSITIONS.map(t => (
                <button key={t} onClick={() => setSlideTransition(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    slideTransition === t ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/40"
                  }`}>{t}</button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs mb-1 block">مدة كل شريحة: {slideDuration}ث</Label>
            <Slider min={2} max={15} step={1} value={[slideDuration]} onValueChange={([v]) => setSlideDuration(v)} />
          </div>
        </div>
      )}

      {/* Save button */}
      <Button onClick={() => { saveAll(); toast.success("تم الحفظ ✓"); }} className="w-full gap-2">
        <Check className="w-4 h-4" />
        حفظ وتطبيق الآن
      </Button>
    </div>
  );
}