import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, Book, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { ACCESS_LEVELS } from "@/lib/data-types";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [institutionName, setInstitutionName] = useState<string | null>(null);
  const { user, signOut, profile } = useAuth();

  // Access level checks
  const isSuperAdmin = profile?.access_level === ACCESS_LEVELS.SUPER_ADMIN;
  const isInstitutionAdmin = profile?.access_level === ACCESS_LEVELS.INSTITUTION_ADMIN;
  const isLibraryManager = profile?.access_level === ACCESS_LEVELS.LIBRARY_MANAGER;
  const isUser = profile?.access_level === ACCESS_LEVELS.USER;
  const isStudent = isUser; // Students are users with access_level 4

  // Only show staff links for admin and manager levels
  const isStaff = isInstitutionAdmin || isLibraryManager;

  useEffect(() => {
    if (profile?.institution_id) {
      fetchInstitutionName(profile.institution_id);
    }
  }, [profile]);

  const fetchInstitutionName = async (institutionId: string) => {
    try {
      const { data, error } = await supabase
        .from('institutions')
        .select('name')
        .eq('id', institutionId)
        .single();
      
      if (error) {
        console.error("Error fetching institution name:", error);
        return;
      }
      
      if (data) {
        setInstitutionName(data.name);
      }
    } catch (error) {
      console.error("Error fetching institution name:", error);
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const getRoleName = (accessLevel: number) => {
    switch (accessLevel) {
      case ACCESS_LEVELS.SUPER_ADMIN:
        return "Super Admin";
      case ACCESS_LEVELS.INSTITUTION_ADMIN:
        return "Institution Admin";
      case ACCESS_LEVELS.LIBRARY_MANAGER:
        return "Library Manager";
      case ACCESS_LEVELS.USER:
        return "Student";
      default:
        return "Unknown";
    }
  };

  return (
    <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Book className="text-library-primary h-6 w-6" />
          <div>
            <span className="text-lg font-bold">Library App</span>
            {institutionName && !isSuperAdmin && (
              <span className="block text-xs text-gray-500">{institutionName}</span>
            )}
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-6">
          <Link
            to="/"
            className={`px-2 py-1 ${
              isActive("/")
                ? "text-library-primary font-medium"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Dashboard
          </Link>
          {isSuperAdmin && (
            <Link
              to="/institutions"
              className={`px-2 py-1 ${
                isActive("/institutions")
                  ? "text-library-primary font-medium"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Institutions
            </Link>
          )}
          {isSuperAdmin && (
            <Link
              to="/libraries"
              className={`px-2 py-1 ${
                isActive("/libraries")
                  ? "text-library-primary font-medium"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Libraries
            </Link>
          )}
          
          {/* User-specific navigation */}
          {isUser ? (
            <>
              <Link
                to="/books"
                className={`px-2 py-1 ${
                  isActive("/books")
                    ? "text-library-primary font-medium"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Books
              </Link>
              <Link
                to="/borrowed-books"
                className={`px-2 py-1 ${
                  isActive("/borrowed-books")
                    ? "text-library-primary font-medium"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                My Borrowings
              </Link>
              <Link
                to="/student/requests"
                className={`px-2 py-1 ${
                  isActive("/student/requests")
                    ? "text-library-primary font-medium"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                My Requests
              </Link>
            </>
          ) : (
            <>
              {/* Only show Books link for non-super-admin users */}
              {!isSuperAdmin && (
                <Link
                  to="/books"
                  className={`px-2 py-1 ${
                    isActive("/books")
                      ? "text-library-primary font-medium"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Books
                </Link>
              )}
              
              {/* Only show Borrowed Books link for non-super-admin users */}
              {!isSuperAdmin && (
                <Link
                  to="/borrowed-books"
                  className={`px-2 py-1 ${
                    isActive("/borrowed-books")
                      ? "text-library-primary font-medium"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {isStaff ? 'Borrowed Books' : 'My Borrowings'}
                </Link>
              )}
              
              {/* Only show Requests link for staff users */}
              {isStaff && !isSuperAdmin && (
                <Link
                  to="/requests"
                  className={`px-2 py-1 ${
                    isActive("/requests")
                      ? "text-library-primary font-medium"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Requests
                </Link>
              )}
            </>
          )}
        </nav>

        {/* User Dropdown */}
        <div className="flex items-center">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="rounded-full h-8 w-8 p-0 overflow-hidden">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-library-primary text-white">
                      {user.email?.[0].toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem className="text-sm text-gray-500 cursor-default">
                  {user.email}
                </DropdownMenuItem>
                <DropdownMenuItem className="text-sm text-gray-500 cursor-default">
                  Access Level: {profile?.access_level ? getRoleName(profile.access_level) : 'Loading...'}
                </DropdownMenuItem>
                {institutionName && !isSuperAdmin && (
                  <DropdownMenuItem className="text-sm text-gray-500 cursor-default">
                    Institution: {institutionName}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleSignOut}>Log Out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/auth")}
              className="mr-2"
            >
              Log In
            </Button>
          )}

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden ml-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <nav className="md:hidden bg-white p-4 border-t">
          <div className="flex flex-col space-y-4">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-2 py-1 ${
                isActive("/")
                  ? "text-library-primary font-medium"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Dashboard
            </Link>
            {isSuperAdmin && (
              <Link
                to="/institutions"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-2 py-1 ${
                  isActive("/institutions")
                    ? "text-library-primary font-medium"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Institutions
              </Link>
            )}
            {isSuperAdmin && (
              <Link
                to="/libraries"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-2 py-1 ${
                  isActive("/libraries")
                    ? "text-library-primary font-medium"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Libraries
              </Link>
            )}
            {!isSuperAdmin && (
              <Link
                to="/books"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-2 py-1 ${
                  isActive("/books")
                    ? "text-library-primary font-medium"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Books
              </Link>
            )}
            {!isSuperAdmin && (
              <Link
                to="/borrowed-books"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-2 py-1 ${
                  isActive("/borrowed-books")
                    ? "text-library-primary font-medium"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {isStaff ? 'Borrowed Books' : 'My Borrowings'}
              </Link>
            )}
            {isStudent && (
              <Link
                to="/student/requests"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-2 py-1 ${
                  isActive("/student/requests")
                    ? "text-library-primary font-medium"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                My Requests
              </Link>
            )}
            {isStaff && !isSuperAdmin && (
              <Link
                to="/requests"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-2 py-1 ${
                  isActive("/requests")
                    ? "text-library-primary font-medium"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Requests
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
};

export default Header;
