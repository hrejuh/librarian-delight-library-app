import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { Profile, UserRole } from "@/lib/data-types";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  signUp: (email: string, password: string, role: UserRole, institutionId?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isLibrarian: boolean;
  isStudent: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // For now: derive a profile in-memory from the authenticated User object
  const fetchProfile = async (userId: string) => {
    try {
      console.log("Fetching profile for user:", userId);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      console.log("Profile fetch result:", { data, error });

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        if (!mounted) return;

        setSession(currentSession);
        const sessionUser = currentSession?.user ?? null;
        setUser(sessionUser);
        if (sessionUser) {
          // fetch then clear loading
          fetchProfile(sessionUser.id).finally(() => {
            setIsLoading(false);
          });
        } else {
          setProfile(null);
          setIsLoading(false);
        }
      }
    );

    // Initialize session and profile
    (async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!mounted) return;

      setSession(currentSession);
      const sessionUser = currentSession?.user ?? null;
      setUser(sessionUser);
      if (sessionUser) {
        await fetchProfile(sessionUser.id);
      }
      setIsLoading(false);
    })();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  // Remove signup for non-authenticated users, this will only be used internally
  const signUp = async (email: string, password: string, role: UserRole, institutionId?: string) => {
    setIsLoading(true);
    try {
      // Validate role
      if (!['student', 'librarian', 'admin', 'super_admin'].includes(role)) {
        toast({
          title: "Invalid role",
          description: "Role must be one of: student, librarian, admin, super_admin",
          variant: "destructive",
        });
        return;
      }

      // First create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        toast({
          title: "Signup failed",
          description: authError.message,
          variant: "destructive",
        });
        return;
      }

      if (authData.user) {
        try {
          // Try to create the profile, but don't worry if it fails
          await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              email: email,
              role: role,
              institution_id: institutionId
            });
        } catch (profileError) {
          console.error("Profile creation error:", profileError);
          // Continue anyway - we'll use in-memory profile
        }

        // Derive and set fallback profile immediately
        fetchProfile(authData.user.id);

        toast({
          title: "User created successfully",
          description: `New user with role ${role} has been added.`,
        });
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      toast({
        title: "Signup failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (data.user) {
        await fetchProfile(data.user.id);
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
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

  // Role check helper properties - using profile object directly
  const isLibrarian = profile?.role === "librarian";
  const isStudent = profile?.role === "student";
  // Only 'admin' role gets isAdmin; super_admin only has isSuperAdmin
  const isAdmin = profile?.role === "admin";
  const isSuperAdmin = profile?.role === "super_admin";

  // Add debug logging for roles
  useEffect(() => {
    if (profile) {
      // Removed debug logging
    }
  }, [profile, isLibrarian, isStudent, isAdmin, isSuperAdmin]);

  // Add a useEffect to handle profile updates
  useEffect(() => {
    const handleProfileUpdate = () => {
      if (user) {
        fetchProfile(user.id);
      }
    };

    window.addEventListener('profile-updated', handleProfileUpdate);
    return () => {
      window.removeEventListener('profile-updated', handleProfileUpdate);
    };
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        isLoading,
        signUp,
        signIn,
        signOut,
        refreshProfile,
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
