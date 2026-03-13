import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Book, AlertTriangle, DollarSign, Users, Building, User, BookOpen, Pencil, Trash2 } from "lucide-react";
import { EditBookModal } from "@/components/EditBookModal";
import { Book as BookType, BorrowedBook, Institution, Profile, AccessLevel, Json } from "@/lib/data-types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AddInstitutionModal } from "@/components/AddInstitutionModal";
import { AddUserModal } from "@/components/AddUserModal";
import { AddBookDialog } from "@/components/AddBookDialog";
import { EditInstitutionModal } from "@/components/EditInstitutionModal";
import { AddBooksModal } from "@/components/AddBooksModal";
import { AddUsersModal } from "@/components/AddUsersModal";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Database } from "@/integrations/supabase/types";

type InstitutionRow = Database['public']['Tables']['institutions']['Row'];
type InstitutionInsert = Database['public']['Tables']['institutions']['Insert'];

const Dashboard = () => {
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [showAddInstitutionModal, setShowAddInstitutionModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditInstitutionModal, setShowEditInstitutionModal] = useState(false);
  const [showAddBooksModal, setShowAddBooksModal] = useState(false);
  const [showAddUsersModal, setShowAddUsersModal] = useState(false);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [currentInstitution, setCurrentInstitution] = useState<Institution | null>(null);
  const [users, setUsers] = useState<Profile[]>([]);
  const [dashboardMetrics, setDashboardMetrics] = useState({
    totalBooks: 0,
    borrowedBooks: 0,
    overdueBooks: 0,
    totalPenalties: 0,
    totalRequests: 0,
    totalUsers: 0,
    totalInstitutions: 0,
    totalLibrarians: 0,
    totalStudents: 0,
  });
  const [userBorrowedBooks, setUserBorrowedBooks] = useState<BorrowedBook[]>([]);
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null);
  const { toast } = useToast();
  const { isLibrarian, isStudent, isAdmin, isSuperAdmin, user, profile, isLoading } = useAuth();
  const navigate = useNavigate();
  const [editInstitution, setEditInstitution] = useState<Institution | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [institutionToDelete, setInstitutionToDelete] = useState<Institution | null>(null);

  useEffect(() => {
    if (profile && !isLoading) {
      fetchMetrics();
      if (isStudent && user) {
        fetchUserBorrowedBooks();
      }
      if (isSuperAdmin) {
        fetchInstitutions();
        fetchUsers();
      }
      if (profile.institution_id) {
        fetchInstitutionInfo(profile.institution_id);
      }
    }
  }, [isLibrarian, isStudent, isAdmin, isSuperAdmin, user, profile, isLoading]);

  const fetchInstitutionInfo = async (institutionId: string) => {
    try {
      const { data, error } = await supabase
        .from('institutions')
        .select('*')
        .eq('id', institutionId)
        .single();
      
      if (error) {
        console.error("Error fetching institution:", error);
        return;
      }
      
      if (data) {
        // Cast the data to Institution with proper types
        const typedInstitution: Institution = {
          ...data,
          organization_structure: data.organization_structure as Json,
          contact_phone: data.contact_phone || undefined,
          open_time: data.open_time || undefined,
          close_time: data.close_time || undefined,
          off_days: data.off_days || undefined,
          reserve_duration_days: data.reserve_duration_days || 0,
          loan_duration_days: data.loan_duration_days || 0,
          late_fine_per_day: data.late_fine_per_day || 0,
          rules: data.rules || undefined,
          admin_password: data.admin_password || undefined
        };
        
        setCurrentInstitution(typedInstitution);
      }
    } catch (error) {
      console.error("Error fetching institution:", error);
    }
  };

  const fetchInstitutions = async () => {
    try {
      const { data, error } = await supabase
        .from('institutions')
        .select('*');
      
      if (error) {
        console.error("Error fetching institutions:", error);
        return;
      }
      
      if (data) {
        // Cast the data to Institution[] with proper types
        const typedInstitutions: Institution[] = (data as InstitutionRow[]).map(inst => ({
          ...inst,
          organization_structure: inst.organization_structure as Json,
          contact_phone: inst.contact_phone || undefined,
          open_time: inst.open_time || undefined,
          close_time: inst.close_time || undefined,
          off_days: inst.off_days || undefined,
          reserve_duration_days: inst.reserve_duration_days || 0,
          loan_duration_days: inst.loan_duration_days || 0,
          late_fine_per_day: inst.late_fine_per_day || 0,
          rules: inst.rules || undefined,
          admin_password: inst.admin_password || undefined
        }));
        
        setInstitutions(typedInstitutions);
        setDashboardMetrics(prev => ({
          ...prev,
          totalInstitutions: typedInstitutions.length
        }));
      }
    } catch (error) {
      console.error("Error fetching institutions:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      // Use direct_profile_lookup instead
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      
      if (error) {
        console.error("Error fetching users:", error);
        return;
      }
      
      if (data) {
        // Cast the data to Profile[] with proper types
        const typedUsers: Profile[] = (data as Database['public']['Tables']['profiles']['Row'][]).map(user => ({
          ...user,
          access_level: user.access_level as AccessLevel,
          role: user.role as Profile['role'],
          institution_id: user.institution_id,
          user_type: user.user_type,
          permissions: user.permissions,
          created_at: user.created_at
        }));
        
        setUsers(typedUsers);
        setDashboardMetrics(prev => ({
          ...prev,
          totalUsers: typedUsers.length,
          totalLibrarians: typedUsers.filter(u => u.role === 'librarian').length,
          totalStudents: typedUsers.filter(u => u.role === 'student').length
        }));
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchMetrics = async () => {
    if (!profile || !profile.institution_id) {
      // If student has no institution, just fetch their borrowings
      if (isStudent) {
        fetchUserBorrowedBooks();
      }
      return;
    }

    try {
      // Get book counts
      const booksQuery = supabase
        .from('books')
        .select('id, status');
      
      // Add institution filter for admin or librarian
      if ((isAdmin || isLibrarian || isStudent) && profile.institution_id) {
        booksQuery.eq('institution_id', profile.institution_id);
      }
      
      const { data: booksData, error: booksError } = await booksQuery;
      
      if (booksError) {
        console.error("Error fetching books:", booksError);
        return;
      }

      // Get borrowings for overdue books
      const borrowingsQuery = supabase
        .from('borrowings')
        .select('*')
        .is('return_date', null);
      
      // Add filters based on role
      if (isStudent && user) {
        borrowingsQuery.eq('user_id', user.id);
      } else if ((isAdmin || isLibrarian) && profile.institution_id) {
        borrowingsQuery.eq('institution_id', profile.institution_id);
      }
      
      const { data: borrowingsData, error: borrowingsError } = await borrowingsQuery;
      
      if (borrowingsError) {
        console.error("Error fetching borrowings:", borrowingsError);
        return;
      }

      // Get requests count
      const requestsQuery = supabase
        .from('requests')
        .select('*', { count: 'exact' });
      
      // Add filters based on role
      if (isStudent && user) {
        requestsQuery.eq('user_id', user.id);
      } else if ((isAdmin || isLibrarian) && profile.institution_id) {
        requestsQuery.eq('institution_id', profile.institution_id);
      }
      
      const { count: requestsCount, error: requestsError } = await requestsQuery;
      
      if (requestsError) {
        console.error("Error fetching requests:", requestsError);
        return;
      }

      // Calculate metrics
      const totalBooks = booksData.length;
      const borrowedBooks = borrowingsData.length;
      const now = new Date();
      
      const overdueBooks = borrowingsData.filter(book => 
        new Date(book.due_date) < now
      ).length;
      
      const totalPenalties = borrowingsData.reduce(
        (sum, book) => sum + (book.penalty || 0),
        0
      );

      setDashboardMetrics(prev => ({
        ...prev,
        totalBooks,
        borrowedBooks,
        overdueBooks,
        totalPenalties,
        totalRequests: requestsCount || 0
      }));
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
    }
  };

  const fetchUserBorrowedBooks = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('borrowings')
        .select(`
          *,
          book:books(*)
        `)
        .eq('user_id', user.id)
        .is('return_date', null);
        
      if (error) {
        console.error("Error fetching user borrowings:", error);
        return;
      }

      if (data) {
        const formattedBorrowings: BorrowedBook[] = await Promise.all(data.map(async (item) => {
          let borrowerEmail = "Unknown";
          let borrowerName = "Unknown";
          
          // Try to get the email from profiles table
          if (item.user_id) {
            const { data: userData } = await supabase
              .from('profiles')
              .select('email')
              .eq('id', item.user_id)
              .single();
            
            if (userData) {
              borrowerEmail = userData.email;
              borrowerName = userData.email.split('@')[0]; // Use email username as name
            }
          }

          return {
            id: item.id,
            book: item.book as BookType,
            borrower_email: borrowerEmail,
            borrower_name: borrowerName,
            borrow_date: item.borrow_date,
            due_date: item.due_date,
            return_date: item.return_date,
            penalty: item.penalty || 0,
            user_id: item.user_id,
            institution_id: item.institution_id
          };
        }));

        setUserBorrowedBooks(formattedBorrowings);
      }
    } catch (error) {
      console.error("Error fetching user borrowings:", error);
    }
  };

  const handleAddBook = async (newBook: BookType) => {
    if (!profile?.institution_id) return;
    
    try {
      const { data, error } = await supabase
        .from("books")
        .insert({
          ...newBook,
          institution_id: profile.institution_id,
        })
        .select()
        .single();

      if (error) throw error;

      // Update metrics
      setDashboardMetrics(prev => ({
        ...prev,
        totalBooks: prev.totalBooks + 1
      }));

      toast({
        title: "Success",
        description: "Book added successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAddInstitution = async (institution: Omit<Institution, "id" | "created_at" | "created_by">) => {
    try {
      const { data: instData, error: instError } = await supabase
        .from('institutions')
        .insert({
          name: institution.name,
          address: institution.address,
          admin_name: institution.admin_name,
          admin_email: institution.admin_email,
          admin_password: institution.admin_password,
          contact_phone: institution.contact_phone,
          organization_structure: institution.organization_structure,
          open_time: institution.open_time,
          close_time: institution.close_time,
          off_days: institution.off_days,
          reserve_duration_days: institution.reserve_duration_days,
          loan_duration_days: institution.loan_duration_days,
          late_fine_per_day: institution.late_fine_per_day,
          rules: institution.rules
        } as InstitutionInsert)
        .select()
        .single();

      if (instError) {
        toast({
          title: "Error Adding Institution",
          description: instError.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Institution Added",
        description: `Institution "${institution.name}" has been added successfully.`,
      });
      setShowAddInstitutionModal(false);
      fetchInstitutions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAddUser = async (data: { 
    email: string; 
    password: string; 
    userType: string;
    institution_id: string;
  }) => {
    try {
      if (!data.email || !data.password || !data.userType || !data.institution_id) {
        toast({
          title: "Error Adding User",
          description: "All fields are required",
          variant: "destructive",
        });
        return;
      }
      
      // Sign up user through Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });
      
      if (authError) {
        toast({
          title: "Error Adding User",
          description: authError.message,
          variant: "destructive",
        });
        return;
      }

      if (authData.user) {
        // Create the profile with the user type and institution
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: data.email,
            role: 'student', // Default role for all users
            access_level: 4 as AccessLevel, // Default access level for students
            institution_id: data.institution_id,
            user_type: data.userType, // Store the user type from institution settings
            permissions: [] // Default empty permissions
          });

        if (profileError) {
          toast({
            title: "Error Creating Profile",
            description: profileError.message,
            variant: "destructive",
          });
          return;
        }
      }
      
      toast({
        title: "User Added",
        description: `User with email "${data.email}" has been added.`,
      });
      
      // Refresh user list
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditInstitution = async (institution: Omit<Institution, "id" | "created_at" | "created_by">) => {
    if (!selectedInstitution) return;

    try {
      const { error } = await supabase
        .from('institutions')
        .update({
          name: institution.name,
          address: institution.address,
          admin_name: institution.admin_name,
          admin_email: institution.admin_email,
          admin_password: institution.admin_password,
          contact_phone: institution.contact_phone,
          organization_structure: institution.organization_structure,
          open_time: institution.open_time,
          close_time: institution.close_time,
          off_days: institution.off_days,
          reserve_duration_days: institution.reserve_duration_days,
          loan_duration_days: institution.loan_duration_days,
          late_fine_per_day: institution.late_fine_per_day,
          rules: institution.rules
        } as InstitutionInsert)
        .eq('id', selectedInstitution.id);
      
      if (error) {
        toast({
          title: "Error Updating Institution",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Institution Updated",
        description: `"${institution.name}" has been updated successfully.`,
      });
      
      // Refresh institutions
      fetchInstitutions();
      setShowEditInstitutionModal(false);
      setSelectedInstitution(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditInstitutionClick = (institution: Institution) => {
    setEditInstitution(institution);
    setShowAddInstitutionModal(true);
  };

  const handleDeleteInstitutionClick = (institution: Institution) => {
    setInstitutionToDelete(institution);
    setShowDeleteDialog(true);
  };

  const handleConfirmDeleteInstitution = async () => {
    if (!institutionToDelete) return;
    try {
      const { error } = await supabase
        .from('institutions')
        .delete()
        .eq('id', institutionToDelete.id);
      if (error) throw error;
      toast({
        title: "Institution Deleted",
        description: `Institution "${institutionToDelete.name}" has been deleted.`,
      });
      setShowDeleteDialog(false);
      setInstitutionToDelete(null);
      fetchInstitutions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Show loading state while profile is being fetched
  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-8 mt-16">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading dashboard...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Super Admin Dashboard
  if (isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 py-8 mt-16">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
            <div className="flex gap-2">
              <Button
                className="bg-library-primary hover:bg-blue-700"
                onClick={() => setShowAddBooksModal(true)}
              >
                Add Books
              </Button>
              <Button
                className="bg-library-primary hover:bg-blue-700"
                onClick={() => setShowAddUsersModal(true)}
              >
                Add Users
              </Button>
              <Button
                className="bg-library-primary hover:bg-blue-700"
                onClick={() => setShowAddInstitutionModal(true)}
              >
                Add Institution
              </Button>
              <Button
                className="bg-library-primary hover:bg-blue-700"
                onClick={() => navigate('/libraries')}
              >
                Add Library
              </Button>
            </div>
          </div>
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate('/institutions')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Institutions</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardMetrics.totalInstitutions}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardMetrics.totalUsers}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Librarians</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardMetrics.totalLibrarians}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardMetrics.totalStudents}</div>
              </CardContent>
            </Card>
          </div>
        </main>
        
        {showAddBooksModal && (
          <AddBooksModal
            onClose={() => setShowAddBooksModal(false)}
            onSave={() => {}}
          />
        )}
        {showAddUsersModal && (
          <AddUsersModal
            onClose={() => setShowAddUsersModal(false)}
            onSave={() => {}}
          />
        )}
        {showAddUserModal && (
          <AddUserModal
            onClose={() => setShowAddUserModal(false)}
            onSave={handleAddUser}
            institutions={institutions}
          />
        )}
        {showEditInstitutionModal && selectedInstitution && (
          <EditInstitutionModal
            institution={selectedInstitution}
            onClose={() => {
              setShowEditInstitutionModal(false);
              setSelectedInstitution(null);
            }}
            onSave={handleEditInstitution}
          />
        )}
        {showAddInstitutionModal && (
          <AddInstitutionModal
            isOpen={showAddInstitutionModal}
            institution={editInstitution || undefined}
            onClose={() => { 
              setShowAddInstitutionModal(false); 
              setEditInstitution(null); 
            }}
            onSuccess={() => {
              fetchInstitutions();
              setShowAddInstitutionModal(false); 
              setEditInstitution(null);
            }}
          />
        )}
        {showDeleteDialog && institutionToDelete && (
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Institution</DialogTitle>
              </DialogHeader>
              <div>Are you sure you want to delete "{institutionToDelete.name}"? This action cannot be undone.</div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleConfirmDeleteInstitution}>Delete</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    );
  }

  // Admin Dashboard
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 py-8 mt-16">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              {currentInstitution && (
                <p className="text-gray-600">{currentInstitution.name}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                className="bg-library-primary hover:bg-blue-700"
                onClick={() => setShowAddBookModal(true)}
              >
                Add New Book
              </Button>
              <Button 
                className="bg-library-primary hover:bg-blue-700"
                onClick={() => setShowAddUserModal(true)}
              >
                Add User
              </Button>
            </div>
          </div>
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-white shadow-md rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Book className="h-6 w-6 text-library-primary" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Books</p>
                  <p className="text-2xl font-bold">{dashboardMetrics.totalBooks}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white shadow-md rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BookOpen className="h-6 w-6 text-library-primary" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Borrowed Books</p>
                  <p className="text-2xl font-bold">{dashboardMetrics.borrowedBooks}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white shadow-md rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Overdue Books</p>
                  <p className="text-2xl font-bold">{dashboardMetrics.overdueBooks}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white shadow-md rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-library-primary" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Penalties</p>
                  <p className="text-2xl font-bold">₹{dashboardMetrics.totalPenalties.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow-md rounded-lg p-4 cursor-pointer" onClick={() => navigate('/requests')}>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Book className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Requests</p>
                  <p className="text-2xl font-bold">{dashboardMetrics.totalRequests}</p>
                </div>
              </div>
            </div>
          </div>
        </main>
        
        {showAddBookModal && (
          <AddBookDialog
            isOpen={showAddBookModal}
            onClose={() => setShowAddBookModal(false)}
            onSave={handleAddBook}
          />
        )}
        
        {showAddUserModal && (
          <AddUserModal
            onClose={() => setShowAddUserModal(false)}
            onSave={handleAddUser}
            institutions={institutions.length > 0 ? institutions : (currentInstitution ? [currentInstitution] : [])}
          />
        )}
      </div>
    );
  }

  // Librarian Dashboard
  if (isLibrarian) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 py-8 mt-16">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold">Librarian Dashboard</h1>
              {currentInstitution && (
                <p className="text-gray-600">{currentInstitution.name}</p>
              )}
            </div>
            <Button 
              className="bg-library-primary hover:bg-blue-700"
              onClick={() => setShowAddBookModal(true)}
            >
              Add New Book
            </Button>
          </div>
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-white shadow-md rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Book className="h-6 w-6 text-library-primary" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Books</p>
                  <p className="text-2xl font-bold">{dashboardMetrics.totalBooks}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white shadow-md rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BookOpen className="h-6 w-6 text-library-primary" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Borrowed Books</p>
                  <p className="text-2xl font-bold">{dashboardMetrics.borrowedBooks}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white shadow-md rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Overdue Books</p>
                  <p className="text-2xl font-bold">{dashboardMetrics.overdueBooks}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white shadow-md rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-library-primary" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Penalties</p>
                  <p className="text-2xl font-bold">₹{dashboardMetrics.totalPenalties.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow-md rounded-lg p-4 cursor-pointer" onClick={() => navigate('/requests')}>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Book className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Requests</p>
                  <p className="text-2xl font-bold">{dashboardMetrics.totalRequests}</p>
                </div>
              </div>
            </div>
          </div>
        </main>
        
        {showAddBookModal && (
          <AddBookDialog
            isOpen={showAddBookModal}
            onClose={() => setShowAddBookModal(false)}
            onSave={handleAddBook}
          />
        )}
      </div>
    );
  }

  // Student Dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-8 mt-16">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Student Dashboard</h1>
            {currentInstitution && (
              <p className="text-gray-600">{currentInstitution.name}</p>
            )}
          </div>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white shadow-md rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Book className="h-6 w-6 text-library-primary" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Books</p>
                <p className="text-2xl font-bold">{dashboardMetrics.totalBooks}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow-md rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-library-primary" />
              </div>
              <div>
                <p className="text-sm text-gray-600">My Borrowed Books</p>
                <p className="text-2xl font-bold">{userBorrowedBooks.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow-md rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">My Overdue Books</p>
                <p className="text-2xl font-bold">
                  {userBorrowedBooks.filter(book => 
                    new Date(book.due_date) < new Date()
                  ).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow-md rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">My Penalties</p>
                <p className="text-2xl font-bold">
                  ₹{userBorrowedBooks.reduce((total, book) => total + book.penalty, 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow-md rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold mb-4">Welcome to the Library</h2>
          <p className="text-gray-600 mb-6">Browse books, track your borrowings, and make new requests.</p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button 
              className="bg-library-primary hover:bg-blue-700"
              onClick={() => navigate('/books')}
            >
              Browse Books
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/borrowed-books')}
            >
              My Borrowed Books
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
