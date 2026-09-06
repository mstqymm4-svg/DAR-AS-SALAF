import React, { useEffect, useState } from "react";

/*
========================================================
DAR AL ULOOM — PROFESSIONAL SPLASH SCREEN
========================================================
*/

// الشعار الرسمي الحالي لدار العلوم (الصورة المرجعية الأصلية)
const LOGO_URL =
  "https://media.base44.com/images/public/69c8e483a69a0d215eee4ef7/679b37a0c_C06AC024-1230-4B65-91B9-B30DDE077171.png";

export default function DarAlUloomSplash({ onComplete }) {
  const [phase, setPhase] = useState("enter");
  const [logoLoaded, setLogoLoaded] = useState(false);

  useEffect(() => {
    // تحميل الشعار قبل بدء الحركة حتى لا يظهر مكان فارغ
    const logo = new Image();
    logo.onload = () => setLogoLoaded(true);
    logo.onerror = () => setLogoLoaded(true);
    logo.src = LOGO_URL;

    const timer1 = setTimeout(() => setPhase("focus"), 650);
    const timer2 = setTimeout(() => setPhase("exit"), 1900);
    const timer3 = setTimeout(() => {
      if (typeof onComplete === "function") onComplete();
    }, 2450);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  return (
    <div
      className={`
        fixed
        inset-0
        z-[999999]
        flex
        items-center
        justify-center
        overflow-hidden
        bg-[#F8FAFC]
        transition-all
        duration-[550ms]
        ease-[cubic-bezier(.22,1,.36,1)]
        ${phase === "exit" ? "scale-[1.035] opacity-0" : "scale-100 opacity-100"}
      `}
      dir="rtl"
    >
      {/* BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none">
        {/* الضوء المركزي */}
        <div
          className={`
            absolute
            left-1/2
            top-1/2
            h-[430px]
            w-[430px]
            -translate-x-1/2
            -translate-y-1/2
            rounded-full
            bg-[#A5F3FC]/25
            blur-[100px]
            transition-all
            duration-[1200ms]
            ${phase === "focus" ? "scale-125 opacity-100" : "scale-75 opacity-50"}
          `}
        />
        {/* ضوء علوي */}
        <div
          className="absolute -left-24 -top-24 h-[280px] w-[280px] rounded-full bg-[#0891B2]/10 blur-[90px]"
        />
        {/* ضوء سفلي */}
        <div
          className="absolute -bottom-32 -right-24 h-[320px] w-[320px] rounded-full bg-[#155E75]/10 blur-[100px]"
        />
        {/* دوائر زخرفية */}
        <div className="animate-ring-one absolute left-1/2 top-1/2 h-[270px] w-[270px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#0891B2]/10" />
        <div className="animate-ring-two absolute left-1/2 top-1/2 h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#155E75]/5" />
      </div>

      {/* MAIN CONTENT */}
      <div
        className={`
          relative
          z-10
          flex
          flex-col
          items-center
          justify-center
          transition-all
          duration-[700ms]
          ease-[cubic-bezier(.22,1,.36,1)]
          ${
            phase === "enter"
              ? "translate-y-5 scale-[0.92] opacity-0"
              : phase === "focus"
              ? "translate-y-0 scale-100 opacity-100"
              : "translate-y-[-10px] scale-[1.03] opacity-0"
          }
        `}
      >
        {/* LOGO */}
        <div className="relative flex items-center justify-center">
          {/* هالة الشعار */}
          <div
            className={`
              absolute
              h-[230px]
              w-[230px]
              rounded-full
              bg-[#A5F3FC]/30
              blur-[55px]
              transition-all
              duration-[900ms]
              ${phase === "focus" ? "scale-110 opacity-100" : "scale-50 opacity-0"}
            `}
          />
          {/* الحلقة */}
          <div
            className={`
              absolute
              h-[205px]
              w-[205px]
              rounded-full
              border
              border-[#0891B2]/15
              transition-all
              duration-[900ms]
              ${phase === "focus" ? "scale-100 opacity-100" : "scale-50 opacity-0"}
            `}
          />
          {/* الشعار */}
          <div
            className={`
              relative
              flex
              h-[165px]
              w-[165px]
              items-center
              justify-center
              transition-all
              duration-[900ms]
              ease-[cubic-bezier(.16,1,.3,1)]
              ${
                phase === "enter"
                  ? "scale-[0.55] rotate-[-8deg] opacity-0"
                  : phase === "focus"
                  ? "scale-100 rotate-0 opacity-100"
                  : "scale-[1.04] rotate-0 opacity-0"
              }
            `}
          >
            {logoLoaded && (
              <img
                src={LOGO_URL}
                alt="دار العلوم"
                draggable="false"
                className="relative z-20 max-h-full max-w-full object-contain select-none drop-shadow-[0_18px_35px_rgba(15,23,42,0.14)]"
              />
            )}
          </div>
        </div>

        {/* APP NAME */}
        <div
          className={`
            mt-8
            text-center
            transition-all
            duration-[700ms]
            delay-[180ms]
            ${
              phase === "enter"
                ? "translate-y-5 opacity-0"
                : phase === "focus"
                ? "translate-y-0 opacity-100"
                : "translate-y-[-5px] opacity-0"
            }
          `}
        >
          <h1 className="text-[30px] font-bold leading-none tracking-[-0.02em] text-[#0F172A]">
            دار العلوم
          </h1>
          <p className="mt-3 text-[14px] font-medium tracking-[0.08em] text-[#155E75]">
            للعلم والمعرفة
          </p>
        </div>

        {/* LOADING LINE */}
        <div
          className={`
            mt-10
            h-[3px]
            w-[82px]
            overflow-hidden
            rounded-full
            bg-[#E2E8F0]
            transition-all
            duration-500
            ${phase === "focus" ? "opacity-100" : "opacity-0"}
          `}
        >
          <div className="animate-loading-line h-full w-[42px] rounded-full bg-[#155E75]" />
        </div>
      </div>

      {/* FOOTER */}
      <div
        className={`
          absolute
          bottom-7
          left-0
          right-0
          text-center
          transition-all
          duration-500
          ${phase === "focus" ? "translate-y-0 opacity-60" : "translate-y-2 opacity-0"}
        `}
      >
        <span className="text-[11px] font-medium text-[#64748B]">
          أهلاً بك في دار العلوم
        </span>
      </div>

      {/* ANIMATIONS */}
      <style>{`
        @keyframes loadingLine {
          0% { transform: translateX(150%); }
          100% { transform: translateX(-180%); }
        }
        @keyframes ringOne {
          0% { transform: translate(-50%, -50%) scale(.92); opacity: .25; }
          50% { transform: translate(-50%, -50%) scale(1.02); opacity: .55; }
          100% { transform: translate(-50%, -50%) scale(.92); opacity: .25; }
        }
        @keyframes ringTwo {
          0% { transform: translate(-50%, -50%) scale(.95); opacity: .15; }
          50% { transform: translate(-50%, -50%) scale(1.05); opacity: .3; }
          100% { transform: translate(-50%, -50%) scale(.95); opacity: .15; }
        }
        .animate-loading-line { animation: loadingLine 1.05s cubic-bezier(.4,0,.2,1) infinite; }
        .animate-ring-one { animation: ringOne 3.2s ease-in-out infinite; }
        .animate-ring-two { animation: ringTwo 4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .animate-loading-line, .animate-ring-one, .animate-ring-two { animation: none !important; }
        }
      `}</style>
    </div>
  );
}