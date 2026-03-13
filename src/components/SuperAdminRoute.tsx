
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface SuperAdminRouteProps {
  children: React.ReactNode;
}

const SuperAdminRoute = ({ children }: SuperAdminRouteProps) => {
  const { profile, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // Explicitly check for 'super_admin' role
  if (profile?.role !== 'super_admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default SuperAdminRoute;
