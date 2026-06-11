import { Outlet, Link, useLocation } from "react-router-dom";
import { BookOpen, Home, Heart, Settings, Code } from "lucide-react";
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useT } from "@/lib/i18n";
import { getSetting, subscribeToSettings } from "@/lib/settingsStore";

// Icon map for nav items stored in settings
const ICON_MAP = { Home, BookOpen, Heart, Settings, Code };

const DEFAULT_NAV_ITEMS = [
  { id: "home",      label: "الرئيسية",  path: "/",          icon: "Home",     visible: true },
  { id: "books",     label: "المكتبة",   path: "/books",     icon: "BookOpen", visible: true },
  { id: "favorites", label: "المفضلة",   path: "/favorites", icon: "Heart",    visible: true },
  { id: "settings",  label: "الإعدادات", path: "/settings",  icon: "Settings", visible: true },
  { id: "dev",       label: "المطور",    path: "/dev",       icon: "Code",     visible: false },
];

function parseNavItems(raw, showDev) {
  try {
    const items = JSON.parse(raw || "null") || DEFAULT_NAV_ITEMS;
    return items.map(item =>
      // If it's the dev item, respect the show_dev_nav toggle as additional gate
      item.id === "dev" ? { ...item, visible: item.visible && showDev !== false } : item
    ).filter(i => i.visible);
  } catch {
    return DEFAULT_NAV_ITEMS.filter(i => i.id !== "dev" || showDev !== false);
  }
}

export default function Layout() {
  const location = useLocation();
  const t = useT();

  const [navItems, setNavItems] = useState(() =>
    parseNavItems(getSetting("nav_items"), getSetting("show_dev_nav") !== "false")
  );
  const [logoUrl, setLogoUrl]             = useState(() => getSetting("logo_url"));
  const [appNameOverride, setAppNameOverride]     = useState(() => getSetting("app_name"));
  const [appSubtitleOverride, setAppSubtitleOverride] = useState(() => getSetting("app_subtitle"));

  useEffect(() => {
    const unsub = subscribeToSettings((s) => {
      const showDev = s.show_dev_nav !== "false";
      setNavItems(parseNavItems(s.nav_items, showDev));
      setLogoUrl(s.logo_url || "");
      setAppNameOverride(s.app_name || "");
      setAppSubtitleOverride(s.app_subtitle || "");
    });
    return unsub;
  }, []);

  // Apply dir, lang, font globally whenever language changes
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("dir", t.dir || "rtl");
    html.setAttribute("lang", t.langCode || "ar");
    if (t.fontFamily) {
      html.style.setProperty("--font-app", t.fontFamily);
      document.body.style.fontFamily = t.fontFamily;
    }
    document.body.style.lineHeight = t.langCode === "ur" ? "2.8" : "";
  }, [t.dir, t.langCode, t.fontFamily]);

  return (
    <div dir={t.dir} lang={t.langCode} className="min-h-screen bg-background" style={{ fontFamily: t.fontFamily }}>
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center overflow-hidden shrink-0">
                {logoUrl
                  ? <img src={logoUrl} alt="logo" className="w-full h-full object-cover" />
                  : <BookOpen className="w-5 h-5 text-primary-foreground" />}
              </div>
              <div>
                <h1 className="text-foreground text-xl font-bold leading-tight">{appNameOverride || t.appName}</h1>
                <p className="text-[10px] text-muted-foreground -mt-0.5">{appSubtitleOverride || t.appSubtitle}</p>
              </div>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = ICON_MAP[item.icon] || Home;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <Link to="/books" className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors">
              <BookOpen className="w-5 h-5 text-muted-foreground" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-24">
        <Outlet />
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-xl border-t border-border">
        <div className="flex items-center justify-around py-2 px-4">
          {navItems.map((item) => {
            const Icon = ICON_MAP[item.icon] || Home;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "fill-primary/20" : ""}`} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}