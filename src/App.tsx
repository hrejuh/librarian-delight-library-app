import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Dashboard from "./pages/Dashboard";
import Books from "./pages/Books";
import BorrowedBooks from "./pages/BorrowedBooks";
import Requests from "./pages/Requests";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import LibrarianRoute from "./components/LibrarianRoute";
import AdminRoute from "./components/AdminRoute";
import SuperAdminRoute from "./components/SuperAdminRoute";
import StudentDashboard from "@/pages/student/StudentDashboard";
import MyRequests from "@/pages/student/MyRequests";
import Institutions from "./pages/Institutions";
import Libraries from "./pages/Libraries";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            
            {/* Dashboard is accessible to all authenticated users */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            
            {/* Books is accessible to students, librarians, and admins (not super_admin) */}
            <Route
              path="/books"
              element={
                <ProtectedRoute>
                  <Books />
                </ProtectedRoute>
              }
            />
            
            {/* Borrowed Books is accessible to students, librarians, and admins (not super_admin) */}
            <Route
              path="/borrowed-books"
              element={
                <ProtectedRoute>
                  <BorrowedBooks />
                </ProtectedRoute>
              }
            />
            
            {/* Requests is only accessible to librarians and admins */}
            <Route
              path="/requests"
              element={
                <ProtectedRoute>
                  <LibrarianRoute>
                    <Requests />
                  </LibrarianRoute>
                </ProtectedRoute>
              }
            />
            
            {/* Student routes */}
            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/requests"
              element={
                <ProtectedRoute>
                  <MyRequests />
                </ProtectedRoute>
              }
            />
            
            {/* Institutions is only accessible to super admins */}
            <Route
              path="/institutions"
              element={
                <ProtectedRoute>
                  <SuperAdminRoute>
                    <Institutions />
                  </SuperAdminRoute>
                </ProtectedRoute>
              }
            />

            {/* Libraries is only accessible to super admins */}
            <Route
              path="/libraries"
              element={
                <ProtectedRoute>
                  <SuperAdminRoute>
                    <Libraries />
                  </SuperAdminRoute>
                </ProtectedRoute>
              }
            />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
