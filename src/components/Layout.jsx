import { Outlet, Link, useLocation } from "react-router-dom";
import { BookOpen, Home, Heart, Search, Settings, Code } from "lucide-react";
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

// Safe localStorage
const ls = {
  get: (k, fallback = "") => { try { return localStorage.getItem(k) || fallback; } catch(e) { return fallback; } }
};

export default function Layout() {
  const location = useLocation();
  const [user, setUser] = useState(null);

  // Read customization from localStorage
  const appName    = ls.get("dev_app_name", "المكتبة الدينية");
  const appSub     = ls.get("dev_app_subtitle", "نور العلم والمعرفة");
  const langDir    = ls.get("dev_lang_dir", "rtl");
  const navHome    = ls.get("dev_lang_navHome", "الرئيسية");
  const navBooks   = ls.get("dev_lang_navBooks", "المكتبة");
  const navFav     = ls.get("dev_lang_navFav", "المفضلة");
  const navSettings= ls.get("dev_lang_navSettings", "الإعدادات");

  const navItems = [
    { path: "/",         icon: Home,     label: navHome },
    { path: "/books",    icon: BookOpen, label: navBooks },
    { path: "/favorites",icon: Heart,    label: navFav },
    { path: "/settings", icon: Settings, label: navSettings },
    { path: "/dev",      icon: Code,     label: "Dev" },
  ];

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  return (
    <div dir={langDir} className="min-h-screen bg-background font-tajawal">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground leading-tight">{appName}</h1>
                <p className="text-[10px] text-muted-foreground -mt-0.5">{appSub}</p>
              </div>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
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
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <Link to="/books" className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors">
              <Search className="w-5 h-5 text-muted-foreground" />
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
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? "fill-primary/20" : ""}`} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}