import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import { Loader2 } from "lucide-react";
import { ACCESS_LEVELS } from "@/lib/data-types";
import { formatDate } from "@/lib/utils";

interface Level4Config {
  id: string;
  name: string;
  max_books: number;
  fine_per_day: number;
  loan_duration: number;
  reservation_duration: number;
}

interface OrganizationStructure {
  level3: {
    libraries: string[];
    level3_role_names: string[];
  };
  level4: {
    configs: Level4Config[];
  };
  resource_types: string[];
}

interface Request {
  id: string;
  book_id: string;
  request_date: string;
  expiration_date: string;
  status: "pending" | "approved" | "rejected" | "expired";
  notes?: string;
  book: {
    title: string;
    authors: string[];
    image_url?: string;
  };
  institutions: {
    organization_structure: OrganizationStructure;
  };
}

export default function MyRequests() {
  const { user, profile } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<"pending" | "all" | "expired">("pending");
  const { toast } = useToast();

  useEffect(() => {
    if (user && profile) {
      loadRequests();
    }
  }, [user, profile]);

  const getUserConfig = (orgStructure: OrganizationStructure) => {
    if (!profile?.role) {
      console.log('No role found in profile:', profile);
      return null;
    }

    console.log('Looking for config for role:', profile.role);
    console.log('Available configs:', orgStructure.level4?.configs);

    // Find config by role name (case-insensitive)
    const config = orgStructure.level4?.configs?.find(config => 
      config.name.toLowerCase() === 'students'
    );

    if (!config) {
      console.log('No matching config found for role:', profile.role);
      console.log('Available config names:', orgStructure.level4?.configs?.map(c => c.name));
    }

    return config;
  };

  const loadRequests = async () => {
    if (!user || !profile) return;
    setLoading(true);
    
    try {
      console.log('Fetching requests for user:', user.id, 'with role:', profile.role);
      
      // First get the user's institution_id from their profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('institution_id')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        throw profileError;
      }

      console.log('User profile data:', profileData);

      if (!profileData?.institution_id) {
        throw new Error('User profile not found or missing institution_id');
      }

      // Then fetch the institution settings
      const { data: institutionData, error: institutionError } = await supabase
        .from('institutions')
        .select('organization_structure')
        .eq('id', profileData.institution_id)
        .single();

      if (institutionError) {
        console.error('Error fetching institution:', institutionError);
        throw institutionError;
      }

      console.log('Institution data:', institutionData);

      // Parse the organization_structure
      const orgStructure = typeof institutionData?.organization_structure === 'object' 
        ? (institutionData.organization_structure as unknown) as OrganizationStructure
        : null;

      if (!orgStructure) {
        throw new Error('Invalid institution organization structure');
      }

      console.log('Parsed organization structure:', orgStructure);

      // Get user's config based on their role
      const userConfig = getUserConfig(orgStructure);
      if (!userConfig) {
        throw new Error('Could not find configuration for user role');
      }

      console.log('User config:', userConfig);

      // Fetch the requests
      const { data, error } = await supabase
        .from("requests")
        .select(`
          id,
          book_id,
          request_date,
          expiration_date,
          status,
          notes,
          book:books(title, authors, image_url)
        `)
        .eq("user_id", user.id)
        .eq('institution_id', profileData.institution_id)
        .order("request_date", { ascending: false });

      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }

      console.log('Raw requests data:', JSON.stringify(data, null, 2));

      // Transform the data to match the Request interface
      const typedData = (data || []).map(request => {
        // Calculate dates based on user's config
        const requestDate = new Date(request.request_date);
        const collectBeforeDate = new Date(requestDate);
        // Subtract 1 from the duration to include today
        collectBeforeDate.setDate(collectBeforeDate.getDate() + (userConfig.reservation_duration - 1));

        const transformedRequest: Request = {
          id: request.id,
          book_id: request.book_id,
          request_date: request.request_date,
          expiration_date: collectBeforeDate.toISOString(),
          status: request.status,
          notes: request.notes,
          book: request.book,
          institutions: {
            organization_structure: {
              level3: orgStructure.level3,
              level4: {
                configs: [userConfig]
              },
              resource_types: orgStructure.resource_types
            }
          }
        };

        return transformedRequest;
      }) as Request[];

      console.log('Final processed data:', typedData);
      setRequests(typedData);
    } catch (error: any) {
      console.error("Error loading requests:", error);
      console.error("Error details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter(request => {
    if (filter === "all") return true;
    if (filter === "pending") return request.status === "pending";
    if (filter === "expired") return request.status === "expired";
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-600";
      case "approved":
        return "text-green-600";
      case "rejected":
        return "text-red-600";
      case "expired":
        return "text-gray-600";
      default:
        return "text-gray-600";
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8 mt-16">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </main>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8 mt-16">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Requests</h1>
          <Tabs value={filter} onValueChange={(value) => setFilter(value as typeof filter)}>
            <TabsList>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="expired">Expired</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Book Title</TableHead>
                  <TableHead>Authors</TableHead>
                  <TableHead>Requested On</TableHead>
                  <TableHead>Collect Before</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center p-4 text-gray-500">
                      No requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.book.title}</TableCell>
                      <TableCell>{request.book.authors.join(", ")}</TableCell>
                      <TableCell>{formatDate(request.request_date)}</TableCell>
                      <TableCell>
                        {formatDate(request.expiration_date)}
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${getStatusColor(request.status)}`}>
                          {request.status === "pending" ? "Reserved" : request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell>{request.notes || "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
    </div>
  );
} 