import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Book } from "@/lib/data-types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import SearchFilterBar from "@/components/SearchFilterBar";
import { Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Request {
  id: string;
  user_id: string;
  book_id: string;
  request_date: string;
  expiration_date: string;
  status: string;
  notes: string;
  user_name: string;
  book?: Book;
  user?: {
    email: string;
    role?: string;
  };
  institution_id?: string;
}

interface RequestWithUser extends Request {
  user: {
    email: string;
    role?: string;
  };
}

const Requests = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();
  const { profile } = useAuth();

  useEffect(() => {
    fetchRequests();

    // Subscribe to real-time updates for requests
    const subscription = supabase
      .channel('requests_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'requests'
        },
        (payload) => {
          console.log('Real-time update received:', payload);
          fetchRequests(); // Reload requests when any change occurs
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [profile]);

  const fetchRequests = async () => {
    if (!profile?.institution_id) return;

    try {
      const { data, error } = await supabase
        .from("requests")
        .select(`
          *,
          book:books(*),
          user:profiles(email, role)
        `)
        .eq("institution_id", profile.institution_id)
        .order("request_date", { ascending: false });

      if (error) throw error;

      const typedData = (data || []) as unknown as Request[];
      setRequests(typedData);
      setIsLoading(false);
    } catch (error: any) {
      console.error("Error fetching requests:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleApprove = async (requestId: string, bookId: string, userId: string, institutionId: string) => {
    try {
      console.log('Starting request approval process:', { requestId, bookId, userId, institutionId });

      // 1. Fetch the request to check expiration
      console.log('Fetching request details...');
      const { data: requestData, error: requestError } = await supabase
        .from("requests")
        .select("expiration_date, status")
        .eq("id", requestId)
        .single();

      if (requestError) {
        console.error('Error fetching request:', requestError);
        throw new Error("Could not fetch request details");
      }
      if (!requestData) {
        console.error('No request data found');
        throw new Error("Request not found");
      }

      console.log('Request details:', requestData);

      if (requestData.status !== "pending") {
        console.error('Invalid request status:', requestData.status);
        throw new Error("Request is not pending");
      }

      if (new Date(requestData.expiration_date) < new Date()) {
        console.error('Request expired:', requestData.expiration_date);
        throw new Error("Request has expired");
      }

      // 2. Get user's email and role
      console.log('Fetching user profile...');
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('email, role, borrowed_books')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('Error fetching user profile:', userError);
        throw new Error("Could not find user profile");
      }
      if (!userData?.email || !userData?.role) {
        console.error('Invalid user data:', userData);
        throw new Error("User profile is incomplete");
      }

      console.log('User profile:', userData);

      // 3. Get institution settings and organization structure
      console.log('Fetching institution settings...');
      const { data: institutionData, error: institutionError } = await supabase
        .from("institutions")
        .select("organization_structure")
        .eq("id", institutionId)
        .single();

      if (institutionError) {
        console.error('Error fetching institution:', institutionError);
        throw new Error("Could not fetch institution settings");
      }
      if (!institutionData?.organization_structure) {
        console.error('Invalid institution data:', institutionData);
        throw new Error("Institution settings are incomplete");
      }

      console.log('Institution data:', institutionData);

      // Parse the organization structure
      const orgStructure = typeof institutionData.organization_structure === 'string' 
        ? JSON.parse(institutionData.organization_structure)
        : institutionData.organization_structure;

      console.log('Parsed organization structure:', orgStructure);

      // Find the user's config based on their role
      const userRole = userData.role.toLowerCase();
      const configs = orgStructure.level4?.configs || [];
      console.log('Available configs:', configs);
      console.log('Looking for role:', userRole);

      const userConfig = configs.find(
        (config: any) => config.name?.toLowerCase() === userRole
      );

      if (!userConfig) {
        console.error('No config found for role:', userRole);
        throw new Error(`No configuration found for role: ${userData.role}`);
      }

      console.log('Found user config:', userConfig);

      // Check if user has reached their borrowing limit
      if (userData.borrowed_books >= userConfig.max_books) {
        console.error('Borrowing limit reached:', {
          current: userData.borrowed_books,
          max: userConfig.max_books
        });
        throw new Error(`User has reached their maximum borrowing limit of ${userConfig.max_books} books`);
      }

      // 4. Call the handle_request_approval RPC function
      console.log('Calling handle_request_approval with params:', {
        p_request_id: requestId,
        p_book_id: bookId,
        p_user_id: userId,
        p_borrower_email: userData.email,
        p_institution_id: institutionId,
        p_loan_days: userConfig.loan_duration,
        p_fine_per_day: userConfig.fine_per_day
      });

      const { error: approvalError } = await supabase
        .rpc('handle_request_approval', {
          p_request_id: requestId,
          p_book_id: bookId,
          p_user_id: userId,
          p_borrower_email: userData.email,
          p_institution_id: institutionId,
          p_loan_days: userConfig.loan_duration,
          p_fine_per_day: userConfig.fine_per_day
        });

      if (approvalError) {
        console.error('Error in handle_request_approval:', approvalError);
        // Handle specific error messages
        if (approvalError.message.includes('maximum borrowing limit')) {
          throw new Error(approvalError.message);
        } else if (approvalError.message.includes('Request not found')) {
          throw new Error('The request could not be found or has already been processed');
        } else if (approvalError.message.includes('Institution settings not found')) {
          throw new Error('Could not find institution settings. Please contact support.');
        } else {
          throw approvalError;
        }
      }

      console.log('Request approved successfully');
      toast({
        title: "Success",
        description: `Request approved. Loan duration: ${userConfig.loan_duration} days`,
      });
      fetchRequests(); // Refresh the requests list

    } catch (error) {
      console.error('Error in handleApprove:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to approve request",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (requestId: string, bookId: string, institutionId: string) => {
    try {
      // Update request status to rejected
      const { error: updateError } = await supabase
        .from("requests")
        .update({ 
          status: 'rejected',
          notes: 'Request rejected by librarian'
        })
        .eq('id', requestId)
        .eq('institution_id', institutionId);

      if (updateError) throw updateError;

      // Increment book availability since request was rejected
      // 1. Fetch current available value
      const { data: bookData, error: fetchBookError } = await supabase
        .from("books")
        .select("available")
        .eq("id", bookId)
        .eq("institution_id", institutionId)
        .single();

      if (fetchBookError || !bookData) throw fetchBookError || new Error("Book not found");

      // 2. Increment and update
      const { error: bookError } = await supabase
        .from("books")
        .update({ available: bookData.available + 1 })
        .eq("id", bookId)
        .eq("institution_id", institutionId);

      if (bookError) throw bookError;

      toast({
        title: "Success",
        description: "Request rejected successfully",
      });
      fetchRequests();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      searchQuery === "" ||
      request.book?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || request.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8 mt-16">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Requests</h1>
        </div>

        <SearchFilterBar
          type="books"
          onSearch={({ searchQuery, statusFilter }) => {
            setSearchQuery(searchQuery);
            setStatusFilter(statusFilter);
          }}
        />

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No requests found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{request.book?.title}</div>
                      <div className="text-sm text-gray-500">{request.book?.authors?.join(', ')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{request.user?.email}</div>
                      <div className="text-sm text-gray-500 capitalize">{request.user?.role}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(request.request_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        request.status === "approved" ? "bg-green-100 text-green-800" :
                        request.status === "rejected" ? "bg-red-100 text-red-800" :
                        "bg-yellow-100 text-yellow-800"
                      }`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {request.status === "pending" && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleApprove(request.id, request.book_id, request.user_id, request.institution_id ?? "")}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(request.id, request.book_id, request.institution_id ?? "")}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default Requests;
