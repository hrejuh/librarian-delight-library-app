import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { Loader2, Pencil, Trash2, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AddInstitutionModal } from "@/components/AddInstitutionModal";
import { ViewInstitutionModal } from "@/components/ViewInstitutionModal";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Institution, Json } from "@/lib/data-types";
import { Database } from "@/integrations/supabase/types";

type InstitutionRow = Database['public']['Tables']['institutions']['Row'];

const Institutions = () => {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editInstitution, setEditInstitution] = useState<Institution | null>(null);
  const [showAddInstitutionModal, setShowAddInstitutionModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [institutionToDelete, setInstitutionToDelete] = useState<Institution | null>(null);
  const [selectedInstitutionForView, setSelectedInstitutionForView] = useState<Institution | null>(null);
  const [showViewInstitutionModal, setShowViewInstitutionModal] = useState(false);

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const fetchInstitutions = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from("institutions").select("*");
    if (!error && data) {
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
    }
    setIsLoading(false);
  };

  const handleEditInstitutionClick = (institution: Institution) => {
    setEditInstitution(institution);
    setShowAddInstitutionModal(true);
  };

  const handleViewDetailsClick = (institution: Institution) => {
    setSelectedInstitutionForView(institution);
    setShowViewInstitutionModal(true);
  };

  const handleDeleteInstitutionClick = (institution: Institution) => {
    setInstitutionToDelete(institution);
    setShowDeleteDialog(true);
  };

  const handleConfirmDeleteInstitution = async () => {
    if (!institutionToDelete) return;
    const { error } = await supabase
      .from('institutions')
      .delete()
      .eq('id', institutionToDelete.id);
    if (!error) {
      await fetchInstitutions();
    }
    setShowDeleteDialog(false);
    setInstitutionToDelete(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8 mt-16">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Institutions</h1>
        </div>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : institutions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No institutions found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {institutions.map((institution) => (
              <div
                key={institution.id}
                className="bg-white shadow-md rounded-lg p-6 flex flex-col gap-2 relative hover:shadow-lg hover:bg-gray-50 transition-all duration-200 cursor-pointer group"
                onClick={() => handleViewDetailsClick(institution)}
              >
                <div className="absolute top-2 right-2 flex gap-2 z-10">
                  <button
                    className="p-1 rounded hover:bg-gray-200"
                    onClick={e => { e.stopPropagation(); handleEditInstitutionClick(institution); }}
                    title="Edit Institution"
                  >
                    <Pencil className="h-4 w-4 text-blue-600" />
                  </button>
                  <button
                    className="p-1 rounded hover:bg-gray-200"
                    onClick={e => { e.stopPropagation(); handleDeleteInstitutionClick(institution); }}
                    title="Delete Institution"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>
                <h2 className="text-xl font-semibold mb-2 truncate" title={institution.name}>{institution.name}</h2>
                <p className="mb-1"><span className="font-semibold">Address:</span> {institution.address}</p>
                <p className="mb-1"><span className="font-semibold">Contact:</span> {institution.admin_email}<br />{institution.contact_phone}</p>
              </div>
            ))}
          </div>
        )}
        {showAddInstitutionModal && editInstitution && (
          <AddInstitutionModal
            isOpen={showAddInstitutionModal}
            institution={editInstitution}
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
        {showViewInstitutionModal && selectedInstitutionForView && (
          <ViewInstitutionModal
            isOpen={showViewInstitutionModal}
            institution={selectedInstitutionForView}
            onClose={() => {
              setShowViewInstitutionModal(false);
              setSelectedInstitutionForView(null);
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
      </main>
    </div>
  );
};

export default Institutions; 