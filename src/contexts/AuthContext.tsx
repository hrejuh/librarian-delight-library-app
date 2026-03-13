import { createContext, useContext, ReactNode } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  profile: Doc<"profiles"> | null | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isLibrarian: boolean;
  isStudent: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const { signIn: convexSignIn, signOut: convexSignOut } = useAuthActions();
  const { toast } = useToast();

  const profile = useQuery(
    api.users.currentUser,
    isAuthenticated ? {} : "skip",
  );

  const isLoading = authLoading || (isAuthenticated && profile === undefined);

  const signIn = async (email: string, password: string) => {
    try {
      await convexSignIn("password", { email, password, flow: "signIn" });
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await convexSignOut();
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const isLibrarian = profile?.role === "librarian";
  const isStudent = profile?.role === "student";
  const isAdmin = profile?.role === "admin";
  const isSuperAdmin = profile?.role === "super_admin";

  return (
    <AuthContext.Provider
      value={{
        profile: profile ?? null,
        isLoading,
        isAuthenticated,
        signIn,
        signOut,
        isLibrarian,
        isStudent,
        isAdmin,
        isSuperAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
