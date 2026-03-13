"use client";

import { useState, useEffect } from "react";
import { Building, BookOpen, Users, Library, UserCog, Users2, Landmark, Phone, MapPin, Loader2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddInstitutionModal } from "@/components/AddInstitutionModal";
import { ViewInstitutionModal } from "@/components/ViewInstitutionModal";
import { AddBooksModal } from "@/components/AddBooksModal";
import { AddUsersModal } from "@/components/AddUsersModal";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import SuperAdminRoute from "@/components/SuperAdminRoute";
import { supabase } from "@/lib/supabase";
import { Institution, OrganizationStructure } from "@/lib/data-types";

function SuperAdminDashboardContent() {
  console.log("SuperAdminDashboardContent loaded");
  const { toast } = useToast();
  const { user } = useAuth();
  const [showAddInstitutionModal, setShowAddInstitutionModal] = useState(false);
  const [showAddBooksModal, setShowAddBooksModal] = useState(false);
  const [showAddUsersModal, setShowAddUsersModal] = useState(false);

  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [isLoadingInstitutions, setIsLoadingInstitutions] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [selectedInstitutionForView, setSelectedInstitutionForView] = useState<Institution | null>(null);
  const [showViewInstitutionModal, setShowViewInstitutionModal] = useState(false);

  useEffect(() => {
    const fetchInstitutions = async () => {
      setIsLoadingInstitutions(true);
      const { data, error } = await supabase.from("institutions").select("*");

      if (error) {
        console.error("Error fetching institutions:", error);
        toast({
          title: "Error",
          description: "Failed to fetch institutions.",
          variant: "destructive",
        });
        setInstitutions([]);
      } else if (data) {
        const processedData = data.map((inst: any): Institution => {
          const orgStruct: OrganizationStructure = inst.organization_structure ? 
            inst.organization_structure as OrganizationStructure :
            { level3: { libraries: [], level3_role_names: [] }, level4: { configs: [] } };

          return {
            id: inst.id || crypto.randomUUID(),
            name: inst.name || "Unnamed Institution",
            address: inst.address || "No address provided",
            admin_name: inst.admin_name || "N/A",
            admin_email: inst.admin_email || "N/A",
            admin_password: inst.admin_password || "",
            contact_phone: inst.contact_phone || undefined,
            reserve_duration_days: inst.reserve_duration_days || 0,
            loan_duration_days: inst.loan_duration_days || 0,
            late_fine_per_day: inst.late_fine_per_day || 0,
            organization_structure: {
              level3: {
                libraries: Array.isArray(orgStruct.level3?.libraries) ? orgStruct.level3.libraries : [],
                level3_role_names: Array.isArray(orgStruct.level3?.level3_role_names) ? orgStruct.level3.level3_role_names : [],
              },
              level4: {
                configs: Array.isArray(orgStruct.level4?.configs) ? orgStruct.level4.configs : [],
              },
            },
            rules: inst.rules || undefined,
            open_time: inst.open_time || undefined,
            close_time: inst.close_time || undefined,
            off_days: Array.isArray(inst.off_days) ? inst.off_days : undefined,
            created_at: inst.created_at || undefined,
            created_by: inst.created_by || undefined,
          } as Institution;
        });
        setInstitutions(processedData);
      }
      setIsLoadingInstitutions(false);
    };

    fetchInstitutions();
  }, [toast, refreshKey]);

  const handleAddInstitutionSuccess = () => {
    setShowAddInstitutionModal(false);
    setRefreshKey(prevKey => prevKey + 1);
  };

  const handleViewInstitution = (institution: Institution) => {
    setSelectedInstitutionForView(institution);
    setShowViewInstitutionModal(true);
  };

  const handleAddBooks = async (books: any[]) => {
    try {
      toast({
        title: "Success",
        description: "Books added successfully",
      });
      setShowAddBooksModal(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add books",
        variant: "destructive",
      });
    }
  };

  const handleAddUsers = async (users: any[]) => {
    try {
      toast({
        title: "Success",
        description: "Users added successfully",
      });
      setShowAddUsersModal(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add users",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
        <div className="flex gap-4">
          <Button
            onClick={() => setShowAddBooksModal(true)}
            className="bg-library-primary hover:bg-library-primary/90"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Add Books (Global)
          </Button>
          <Button
            onClick={() => setShowAddUsersModal(true)}
            className="bg-library-primary hover:bg-library-primary/90"
          >
            <Users className="h-4 w-4 mr-2" />
            Add Users (Global)
          </Button>
          <Button
            onClick={() => setShowAddInstitutionModal(true)}
            className="bg-library-primary hover:bg-library-primary/90"
          >
            <Building className="h-4 w-4 mr-2" />
            Add New Institution
          </Button>
        </div>
      </div>

      {showAddInstitutionModal && (
        <AddInstitutionModal
          isOpen={showAddInstitutionModal}
          onClose={() => setShowAddInstitutionModal(false)}
          onSuccess={handleAddInstitutionSuccess}
        />
      )}

      {showAddBooksModal && (
        <AddBooksModal
          onClose={() => setShowAddBooksModal(false)}
          onSave={handleAddBooks}
        />
      )}

      {showAddUsersModal && (
        <AddUsersModal
          onClose={() => setShowAddUsersModal(false)}
          onSave={handleAddUsers}
        />
      )}

      {selectedInstitutionForView && showViewInstitutionModal && (
        <ViewInstitutionModal
          institution={selectedInstitutionForView}
          isOpen={showViewInstitutionModal}
          onClose={() => {
            setShowViewInstitutionModal(false);
            setSelectedInstitutionForView(null);
          }}
        />
      )}

      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-4">Registered Institutions</h2>
        {isLoadingInstitutions ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <p className="ml-2 text-gray-500">Loading institutions...</p>
          </div>
        ) : institutions.length === 0 ? (
          <div className="text-center py-12 border rounded-md bg-gray-50">
            <Landmark className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No institutions found.</p>
            <p className="text-sm text-gray-500">Click "Add New Institution" to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {institutions.map((institution) => (
              <div
                key={institution.id}
                className="bg-white shadow-lg rounded-xl p-6 flex flex-col justify-between hover:shadow-xl transition-shadow duration-300 cursor-pointer group"
                onClick={() => handleViewInstitution(institution)}
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-semibold text-library-primary truncate group-hover:text-library-primary-darker" title={institution.name}>
                      {institution.name}
                    </h3>
                    <Eye className="h-5 w-5 text-gray-400 group-hover:text-library-primary transition-colors" />
                  </div>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" />
                      <span className="truncate" title={institution.address}>{institution.address}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                      <span>{institution.contact_phone || "N/A"}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-auto pt-4 border-t border-gray-200 space-y-2">
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <div className="flex items-center">
                       <Library className="h-4 w-4 mr-1.5 text-indigo-500" />
                       <span>Libraries:</span>
                    </div>
                    <span className="font-medium text-gray-700">
                        {institution.organization_structure.level3.libraries.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <div className="flex items-center">
                       <Users2 className="h-4 w-4 mr-1.5 text-purple-500" />
                       <span>L3 Roles:</span>
                    </div>
                    <span className="font-medium text-gray-700">
                        {institution.organization_structure.level3.level3_role_names.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <div className="flex items-center">
                      <UserCog className="h-4 w-4 mr-1.5 text-teal-500" />
                      <span>L4 User Types:</span>
                    </div>
                    <span className="font-medium text-gray-700">
                        {institution.organization_structure.level4.configs.length}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SuperAdminDashboard() {
  return (
    <SuperAdminRoute>
      <SuperAdminDashboardContent />
    </SuperAdminRoute>
  );
} 