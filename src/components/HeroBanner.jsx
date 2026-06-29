import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { getSetting, subscribeToSettings } from "@/lib/settingsStore";
import { useT } from "@/lib/i18n";

// ── Canvas-based animated backgrounds ─────────────────────────────────────────
function ParticlesCanvas({ color1, color2, speed }) {
  const canvasRef = useRef();
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.offsetWidth,
      y: Math.random() * canvas.offsetHeight,
      r: Math.random() * 3 + 1,
      dx: (Math.random() - 0.5) * speed * 0.4,
      dy: (Math.random() - 0.5) * speed * 0.4,
      alpha: Math.random() * 0.8 + 0.2
    }));
    const resize = () => {canvas.width = canvas.offsetWidth;canvas.height = canvas.offsetHeight;};
    resize();
    window.addEventListener("resize", resize);
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,215,100,${p.alpha})`;
        ctx.fill();
        p.x += p.dx;p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {cancelAnimationFrame(raf);window.removeEventListener("resize", resize);};
  }, [speed]);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

function StarsCanvas({ speed }) {
  const canvasRef = useRef();
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf,t = 0;
    const stars = Array.from({ length: 120 }, () => ({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 2 + 0.5,
      twinkle: Math.random() * Math.PI * 2
    }));
    const resize = () => {canvas.width = canvas.offsetWidth;canvas.height = canvas.offsetHeight;};
    resize();
    window.addEventListener("resize", resize);
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      t += 0.01 * speed;
      stars.forEach((s) => {
        const alpha = 0.4 + 0.6 * Math.abs(Math.sin(t + s.twinkle));
        ctx.beginPath();
        ctx.arc(s.x * canvas.width, s.y * canvas.height, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,200,${alpha})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {cancelAnimationFrame(raf);window.removeEventListener("resize", resize);};
  }, [speed]);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

function IslamicPatternSvg({ color1, color2, speed }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="islamic" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
            <polygon points="40,5 75,25 75,55 40,75 5,55 5,25" fill="none" stroke={color2} strokeWidth="1.5" />
            <polygon points="40,15 65,28 65,52 40,65 15,52 15,28" fill="none" stroke={color2} strokeWidth="0.8" opacity="0.6" />
            <circle cx="40" cy="40" r="5" fill="none" stroke={color2} strokeWidth="1" />
            <line x1="40" y1="5" x2="40" y2="15" stroke={color2} strokeWidth="0.8" />
            <line x1="75" y1="25" x2="65" y2="28" stroke={color2} strokeWidth="0.8" />
            <line x1="75" y1="55" x2="65" y2="52" stroke={color2} strokeWidth="0.8" />
            <line x1="40" y1="75" x2="40" y2="65" stroke={color2} strokeWidth="0.8" />
            <line x1="5" y1="55" x2="15" y2="52" stroke={color2} strokeWidth="0.8" />
            <line x1="5" y1="25" x2="15" y2="28" stroke={color2} strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#islamic)"
        style={{ animation: `slide ${20 / speed}s linear infinite` }} />
      </svg>
      <style>{`@keyframes slide { from { transform: translate(0,0); } to { transform: translate(80px, 80px); } }`}</style>
    </div>);

}

function WavesAnimation({ color1, color2, speed }) {
  const dur = 6 / speed;
  return (
    <div className="absolute inset-0 overflow-hidden">
      {[1, 2, 3].map((i) =>
      <div key={i} className="absolute bottom-0 left-0 right-0"
      style={{
        height: `${30 + i * 10}%`,
        background: `${color2}${i === 1 ? "33" : i === 2 ? "22" : "15"}`,
        borderRadius: "100% 100% 0 0",
        animation: `wave ${dur + i}s ease-in-out infinite alternate`,
        animationDelay: `${i * 0.3}s`
      }} />
      )}
      <style>{`@keyframes wave { from { transform: translateX(-5%) scaleY(1); } to { transform: translateX(5%) scaleY(1.1); } }`}</style>
    </div>);

}

function FloatingShapes({ color2, speed }) {
  const shapes = [
  { top: "10%", left: "5%", size: 60, shape: "hex", delay: 0 },
  { top: "70%", left: "8%", size: 40, shape: "diamond", delay: 1 },
  { top: "20%", right: "5%", size: 80, shape: "hex", delay: 0.5 },
  { top: "60%", right: "3%", size: 50, shape: "diamond", delay: 1.5 },
  { top: "40%", left: "15%", size: 30, shape: "circle", delay: 2 },
  { top: "50%", right: "12%", size: 35, shape: "circle", delay: 2.5 }];

  const dur = 4 / speed;
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {shapes.map((s, i) =>
      <div key={i} className="absolute opacity-20"
      style={{
        top: s.top, left: s.left, right: s.right,
        width: s.size, height: s.size,
        background: color2,
        borderRadius: s.shape === "circle" ? "50%" : s.shape === "diamond" ? "4px" : "20%",
        transform: s.shape === "diamond" ? "rotate(45deg)" : undefined,
        animation: `float${i} ${dur + i * 0.5}s ease-in-out infinite`
      }} />
      )}
      <style>{shapes.map((_, i) =>
        `@keyframes float${i} { 0%,100% { transform: translateY(0) rotate(${i * 30}deg); } 50% { transform: translateY(-20px) rotate(${i * 30 + 10}deg); } }`
        ).join("")}</style>
    </div>);

}

function GradientAnimation({ from, to, speed }) {
  const dur = 8 / speed;
  return (
    <div className="absolute inset-0"
    style={{
      background: `linear-gradient(135deg, ${from}, ${to}, ${from})`,
      backgroundSize: "300% 300%",
      animation: `gradAnim ${dur}s ease infinite`
    }}>
      <style>{`@keyframes gradAnim { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }`}</style>
    </div>);

}

function SlideshowBg({ urls, transition, duration, blur, brightness }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!urls.length) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % urls.length), duration * 1000);
    return () => clearInterval(t);
  }, [urls.length, duration]);
  if (!urls.length) return null;
  return (
    <div className="absolute inset-0">
      {urls.map((url, i) =>
      <div key={url + i} className="absolute inset-0 transition-all duration-1000"
      style={{
        opacity: i === idx ? 1 : 0,
        backgroundImage: `url(${url})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        filter: `blur(${blur}px) brightness(${brightness / 100})`,
        transform: transition === "zoom" ? i === idx ? "scale(1.05)" : "scale(1)" : undefined,
        transition: "opacity 1s ease, transform 6s ease"
      }} />
      )}
    </div>);

}

// ── Main HeroBanner ────────────────────────────────────────────────────────────
function read(key, fallback = "") {return getSetting(key) || fallback;}

export default function HeroBanner() {
  const t = useT();
  const [s, setS] = useState(() => ({
    bgType: read("hero_bg_type", "gradient_anim"),
    bgUrl: read("hero_bg_url"),
    gradFrom: read("hero_grad_from", "#134e2a"),
    gradTo: read("hero_grad_to", "#1a6b3c"),
    opacity: Number(read("hero_bg_opacity", "100")),
    blur: Number(read("hero_bg_blur", "0")),
    brightness: Number(read("hero_bg_brightness", "100")),
    contrast: Number(read("hero_bg_contrast", "100")),
    saturation: Number(read("hero_bg_saturation", "100")),
    overlayColor: read("hero_overlay_color", "#000000"),
    overlayAlpha: Number(read("hero_overlay_alpha", "30")),
    animSpeed: Number(read("hero_anim_speed", "5")),
    zoom: read("hero_zoom") === "true",
    title: read("hero_title"),
    subtitle: read("hero_subtitle"),
    btnText: read("hero_btn_text"),
    btnLink: read("hero_btn_link", "/books"),
    slideUrls: (() => {try {return JSON.parse(read("hero_slideshow_urls", "[]"));} catch {return [];}})(),
    slideTransition: read("hero_slide_transition", "fade"),
    slideDuration: Number(read("hero_slide_duration", "4")),
    videoAutoplay: read("hero_video_autoplay") !== "false",
    videoLoop: read("hero_video_loop") !== "false",
    videoMute: read("hero_video_mute") !== "false",
    videoBrightness: Number(read("hero_video_brightness", "100")),
    lottieUrl: read("hero_lottie_url"),
    customHtml: read("hero_custom_html")
  }));

  useEffect(() => {
    const unsub = subscribeToSettings(() => {
      setS({
        bgType: read("hero_bg_type", "gradient_anim"),
        bgUrl: read("hero_bg_url"),
        gradFrom: read("hero_grad_from", "#134e2a"),
        gradTo: read("hero_grad_to", "#1a6b3c"),
        opacity: Number(read("hero_bg_opacity", "100")),
        blur: Number(read("hero_bg_blur", "0")),
        brightness: Number(read("hero_bg_brightness", "100")),
        contrast: Number(read("hero_bg_contrast", "100")),
        saturation: Number(read("hero_bg_saturation", "100")),
        overlayColor: read("hero_overlay_color", "#000000"),
        overlayAlpha: Number(read("hero_overlay_alpha", "30")),
        animSpeed: Number(read("hero_anim_speed", "5")),
        zoom: read("hero_zoom") === "true",
        title: read("hero_title"),
        subtitle: read("hero_subtitle"),
        btnText: read("hero_btn_text"),
        btnLink: read("hero_btn_link", "/books"),
        slideUrls: (() => {try {return JSON.parse(read("hero_slideshow_urls", "[]"));} catch {return [];}})(),
        slideTransition: read("hero_slide_transition", "fade"),
        slideDuration: Number(read("hero_slide_duration", "4")),
        videoAutoplay: read("hero_video_autoplay") !== "false",
        videoLoop: read("hero_video_loop") !== "false",
        videoMute: read("hero_video_mute") !== "false",
        videoBrightness: Number(read("hero_video_brightness", "100")),
        lottieUrl: read("hero_lottie_url"),
        customHtml: read("hero_custom_html")
      });
    });
    return unsub;
  }, []);

  const hexToRgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r},${g},${b}`;
  };

  const overlayStyle = {
    backgroundColor: `rgba(${hexToRgb(s.overlayColor)},${s.overlayAlpha / 100})`
  };

  const bgFilterStyle = {
    filter: `blur(${s.blur}px) brightness(${s.brightness / 100}) contrast(${(s.contrast || 100) / 100}) saturate(${(s.saturation || 100) / 100})`,
    opacity: s.opacity / 100,
    transform: s.zoom ? "scale(1.05)" : undefined
  };

  const renderBg = () => {
    const { bgType, bgUrl, gradFrom, gradTo, animSpeed } = s;
    if (bgType === "static_image" || bgType === "animated_gif") {
      return bgUrl ?
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${bgUrl})`, ...bgFilterStyle }} /> :

      <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})` }} />;

    }
    if (bgType === "video_mp4" || bgType === "video_webm") {
      return bgUrl ?
      <video className="absolute inset-0 w-full h-full object-cover" style={bgFilterStyle}
      autoPlay={s.videoAutoplay} loop={s.videoLoop} muted={s.videoMute} playsInline>
          <source src={bgUrl} type={bgType === "video_mp4" ? "video/mp4" : "video/webm"} />
        </video> :

      <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})` }} />;

    }
    if (bgType === "slideshow") {
      return <SlideshowBg urls={s.slideUrls} transition={s.slideTransition}
      duration={s.slideDuration} blur={s.blur} brightness={s.brightness} />;
    }
    if (bgType === "lottie") {
      return s.lottieUrl ?
      <iframe src={`https://lottiefiles.com/preview/${s.lottieUrl}`}
      className="absolute inset-0 w-full h-full border-0" title="lottie" style={{ opacity: s.opacity / 100 }} /> :
      <GradientAnimation from={gradFrom} to={gradTo} speed={animSpeed} />;
    }
    if (bgType === "custom_html") {
      return s.customHtml ?
      <div className="absolute inset-0" dangerouslySetInnerHTML={{ __html: s.customHtml }} /> :
      <GradientAnimation from={gradFrom} to={gradTo} speed={animSpeed} />;
    }
    if (bgType === "gradient_anim") return <GradientAnimation from={gradFrom} to={gradTo} speed={animSpeed} />;
    if (bgType === "particles") return <><GradientAnimation from={gradFrom} to={gradTo} speed={2} /><ParticlesCanvas speed={animSpeed} /></>;
    if (bgType === "islamic_pattern") return <><GradientAnimation from={gradFrom} to={gradTo} speed={3} /><IslamicPatternSvg color2={gradTo} speed={animSpeed} /></>;
    if (bgType === "floating_shapes") return <><GradientAnimation from={gradFrom} to={gradTo} speed={3} /><FloatingShapes color2={gradTo} speed={animSpeed} /></>;
    if (bgType === "stars") return <><div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})` }} /><StarsCanvas speed={animSpeed} /></>;
    if (bgType === "waves") return <><div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${gradFrom}, ${gradTo})` }} /><WavesAnimation color2={gradTo} speed={animSpeed} /></>;
    // fallback
    return <GradientAnimation from={gradFrom} to={gradTo} speed={animSpeed} />;
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="py-12 md:py-20">

      <div className="relative overflow-hidden rounded-3xl min-h-[300px] md:min-h-[360px] flex items-center">
        {/* Background layer */}
        {renderBg()}

        {/* Overlay */}
        <div className="absolute inset-0 opacity-100 rounded-md" style={overlayStyle} />

        {/* Subtle Islamic decoration */}
        {!["video_mp4", "video_webm"].includes(s.bgType) &&
        <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-6 right-10 text-7xl opacity-10 text-white select-none">﷽</div>
            <div className="absolute bottom-4 left-8 text-5xl opacity-10 text-white select-none">☪</div>
          </div>
        }

        {/* Content */}
        <div className="relative z-10 max-w-2xl p-8 md:p-14 w-full">
          <h1 className="mb-4 text-3xl font-black leading-tight md:text-5xl text-white drop-shadow-lg">
            {s.title || t.heroTitle}
          </h1>
          <p className="mb-8 text-base leading-relaxed opacity-90 md:text-lg max-w-lg text-white/90 drop-shadow">
            {s.subtitle || t.heroSub}
          </p>
          <Link
            to={s.btnLink || "/books"}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-accent-foreground font-bold text-sm hover:opacity-90 transition-opacity shadow-lg">
            {s.btnText || t.browseLib}
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </motion.section>);

}