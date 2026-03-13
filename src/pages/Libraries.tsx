import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Loader2, Pencil, Trash2, Building, MapPin, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AddLibraryModal } from "@/components/AddLibraryModal";

type Library = {
  _id: string;
  name: string;
  address: string;
  institutionId: string;
  contactInfo?: any;
  institutionName?: string;
  [key: string]: any;
};

const Libraries = () => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [libraryToDelete, setLibraryToDelete] = useState<Library | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedLibrary, setSelectedLibrary] = useState<Library | null>(null);
  const { toast } = useToast();

  const librariesData = useQuery(api.libraries.listWithInstitution, {});
  const removeLibrary = useMutation(api.libraries.remove);

  const isLoading = librariesData === undefined;
  const libraries: Library[] = (librariesData ?? []) as Library[];

  const handleConfirmDelete = async () => {
    if (!libraryToDelete) return;
    try {
      await removeLibrary({ id: libraryToDelete._id as any });
      toast({ title: "Library deleted" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setShowDeleteDialog(false);
    setLibraryToDelete(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Libraries</h1>
        <Button onClick={() => { setSelectedLibrary(null); setShowAddModal(true); }}>
          <Plus className="h-4 w-4 mr-1" />
          Add Library
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : libraries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Building className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium">No libraries found</p>
            <p className="text-sm">Add a library to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {libraries.map((library) => (
            <Card
              key={library._id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => { setSelectedLibrary(library); setShowAddModal(true); }}
            >
              <CardContent className="p-4 relative">
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => { e.stopPropagation(); setSelectedLibrary(library); setShowAddModal(true); }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={(e) => { e.stopPropagation(); setLibraryToDelete(library); setShowDeleteDialog(true); }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex gap-3">
                  <Building className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <h2 className="font-semibold truncate pr-16">{library.name}</h2>
                    <div className="flex items-start gap-1 mt-1 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <span className="truncate">{library.address}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t">
                  <Badge variant="outline">
                    {library.institutionName || "Unknown Institution"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddLibraryModal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setSelectedLibrary(null); }}
        onSuccess={() => { setShowAddModal(false); setSelectedLibrary(null); }}
        library={selectedLibrary || undefined}
      />

      {showDeleteDialog && libraryToDelete && (
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Library</DialogTitle>
            </DialogHeader>
            <p>Are you sure you want to delete "{libraryToDelete.name}"? This cannot be undone.</p>
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

export default Libraries;
