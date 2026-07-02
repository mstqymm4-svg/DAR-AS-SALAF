import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from './components/Layout';
import SaveStatusIndicator from './components/SaveStatusIndicator';
import { useEffect } from 'react';
import { loadSettings } from '@/lib/settingsStore';
import { initThemeEngine } from '@/lib/themeEngine';
import { base44 } from '@/api/base44Client';
// Apply theme immediately from localStorage before any renders
try {
  const lsMode = localStorage.getItem("devs_theme_mode") || (localStorage.getItem("devs_dark_mode") === "true" ? "dark" : "light");
  if (lsMode === "dark") document.documentElement.classList.add("dark");
  else if (lsMode === "light") document.documentElement.classList.remove("dark");
} catch(e) {}
import Home from './pages/Home';
import Books from './pages/Books';
import BookDetails from './pages/BookDetails';
import Favorites from './pages/Favorites';
import Admin from './pages/Admin';
import Settings from './pages/Settings';
import DevPanel from './pages/DevPanel';
import ReadBook from './pages/ReadBook';
import Videos from './pages/Videos';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Load settings from DB on app start, then init theme
  useEffect(() => {
    base44.auth.me()
      .then(u => loadSettings(u?.email))
      .catch(() => loadSettings())
      .finally(() => initThemeEngine());
  }, []);

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <>
    <SaveStatusIndicator />
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/books" element={<Books />} />
        <Route path="/book/:id" element={<BookDetails />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/dev" element={<DevPanel />} />
        <Route path="/read/:id" element={<ReadBook />} />
        <Route path="/videos" element={<Videos />} />
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
    </>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App