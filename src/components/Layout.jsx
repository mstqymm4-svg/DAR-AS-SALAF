import { Outlet, Link, useLocation } from "react-router-dom";
import { BookOpen, Home, Heart, Settings, Code } from "lucide-react";
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useT } from "@/lib/i18n";

export default function Layout() {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const t = useT();

  const showDevNav = (() => { try { return localStorage.getItem("dev_show_dev_nav") !== "false"; } catch(e) { return true; } })();

  const navItems = [
    { path: "/",          icon: Home,     label: t.navHome },
    { path: "/books",     icon: BookOpen, label: t.navBooks },
    { path: "/favorites", icon: Heart,    label: t.navFav },
    { path: "/settings",  icon: Settings, label: t.navSettings },
    ...(showDevNav ? [{ path: "/dev", icon: Code, label: "Dev" }] : []),
  ];

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // logo from dev panel
  const logoUrl = (() => { try { return localStorage.getItem("dev_logo_url") || ""; } catch(e) { return ""; } })();

  return (
    <div dir={t.dir} className="min-h-screen bg-background font-tajawal">
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
                <h1 className="text-foreground text-xl font-bold leading-tight">{t.appName}</h1>
                <p className="text-[10px] text-muted-foreground -mt-0.5">{t.appSubtitle}</p>
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