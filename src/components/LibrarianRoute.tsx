
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface LibrarianRouteProps {
  children: React.ReactNode;
}

const LibrarianRoute = ({ children }: LibrarianRouteProps) => {
  const { profile, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // Allow librarian, admin and super_admin roles
  if (profile?.role !== 'librarian' && profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default LibrarianRoute;
