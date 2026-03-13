import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Loader2, Pencil, Trash2, Plus, Building2 } from "lucide-react";
import { AddInstitutionModal } from "@/components/AddInstitutionModal";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { Doc } from "../../convex/_generated/dataModel";

type Institution = Doc<"institutions">;

const Institutions = () => {
  const [editInstitution, setEditInstitution] = useState<Institution | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [institutionToDelete, setInstitutionToDelete] = useState<Institution | null>(null);
  const { toast } = useToast();

  const institutions = useQuery(api.institutions.list) ?? [];
  const removeInstitution = useMutation(api.institutions.remove);
  const isLoading = institutions === undefined;

  const handleConfirmDelete = async () => {
    if (!institutionToDelete) return;
    try {
      await removeInstitution({ id: institutionToDelete._id });
      toast({ title: "Institution deleted" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setShowDeleteDialog(false);
    setInstitutionToDelete(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Institutions</h1>
        <Button onClick={() => { setEditInstitution(null); setShowAddModal(true); }}>
          <Plus className="h-4 w-4 mr-1" />
          Add Institution
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : institutions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Building2 className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium">No institutions found</p>
            <p className="text-sm">Add an institution to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {institutions.map((inst) => (
            <Card
              key={inst._id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => { setEditInstitution(inst); setShowAddModal(true); }}
            >
              <CardContent className="p-4 relative">
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => { e.stopPropagation(); setEditInstitution(inst); setShowAddModal(true); }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={(e) => { e.stopPropagation(); setInstitutionToDelete(inst); setShowDeleteDialog(true); }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <h2 className="text-lg font-semibold truncate pr-16">{inst.name}</h2>
                <p className="text-sm text-muted-foreground mt-1">{inst.address}</p>
                <p className="text-sm text-muted-foreground mt-1">{inst.adminEmail}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddInstitutionModal
          isOpen={showAddModal}
          institution={editInstitution}
          onClose={() => { setShowAddModal(false); setEditInstitution(null); }}
          onSuccess={() => { setShowAddModal(false); setEditInstitution(null); }}
        />
      )}

      {showDeleteDialog && institutionToDelete && (
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Institution</DialogTitle>
            </DialogHeader>
            <p>Are you sure you want to delete "{institutionToDelete.name}"? This cannot be undone.</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleConfirmDelete}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Institutions;
