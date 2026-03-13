import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AppLayout } from "./components/layout/AppLayout";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy-load route pages for code splitting
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Books = lazy(() => import("./pages/Books"));
const Circulation = lazy(() => import("./pages/Circulation"));
const Fines = lazy(() => import("./pages/Fines"));
const Institutions = lazy(() => import("./pages/Institutions"));
const Libraries = lazy(() => import("./pages/Libraries"));
const Users = lazy(() => import("./pages/Users"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

const App = () => (
  <AuthProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />

          <Route
            path="/"
            element={
              <AppLayout>
                <LazyPage><Dashboard /></LazyPage>
              </AppLayout>
            }
          />
          <Route
            path="/books"
            element={
              <AppLayout>
                <LazyPage><Books /></LazyPage>
              </AppLayout>
            }
          />
          <Route
            path="/circulation"
            element={
              <AppLayout>
                <LazyPage><Circulation /></LazyPage>
              </AppLayout>
            }
          />
          <Route
            path="/fines"
            element={
              <AppLayout>
                <LazyPage><Fines /></LazyPage>
              </AppLayout>
            }
          />
          <Route
            path="/institutions"
            element={
              <AppLayout>
                <LazyPage><Institutions /></LazyPage>
              </AppLayout>
            }
          />
          <Route
            path="/libraries"
            element={
              <AppLayout>
                <LazyPage><Libraries /></LazyPage>
              </AppLayout>
            }
          />
          <Route
            path="/users"
            element={
              <AppLayout>
                <LazyPage><Users /></LazyPage>
              </AppLayout>
            }
          />
          <Route
            path="/reports"
            element={
              <AppLayout>
                <LazyPage><Reports /></LazyPage>
              </AppLayout>
            }
          />
          <Route
            path="/settings"
            element={
              <AppLayout>
                <LazyPage><Settings /></LazyPage>
              </AppLayout>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </AuthProvider>
);

export default App;
