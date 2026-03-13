import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { Loader2, Pencil, Trash2, Eye, Building, MapPin, Phone } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";
import { AddLibraryModal } from "@/components/AddLibraryModal";
import { ViewLibraryModal } from "@/components/ViewLibraryModal";

type Library = Database["public"]["Tables"]["libraries"]["Row"] & {
  institutions?: {
    name: string;
  };
};

const Libraries = () => {
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [libraryToDelete, setLibraryToDelete] = useState<Library | null>(null);
  const [showAddLibraryModal, setShowAddLibraryModal] = useState(false);
  const [selectedLibrary, setSelectedLibrary] = useState<Library | null>(null);
  const [showViewLibraryModal, setShowViewLibraryModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchLibraries();
  }, []);

  const fetchLibraries = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("libraries")
        .select(`
          *,
          institutions (
            name
          )
        `);

      if (error) throw error;
      setLibraries(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch libraries: " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLibraryClick = (library: Library) => {
    setLibraryToDelete(library);
    setShowDeleteDialog(true);
  };

  const handleConfirmDeleteLibrary = async () => {
    if (!libraryToDelete) return;
    try {
      const { error } = await supabase
        .from("libraries")
        .delete()
        .eq("id", libraryToDelete.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Library deleted successfully",
      });
      setShowDeleteDialog(false);
      setLibraryToDelete(null);
      fetchLibraries();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete library: " + error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditLibraryClick = (library: Library) => {
    setSelectedLibrary(library);
    setShowAddLibraryModal(true);
  };

  const handleViewLibraryClick = (library: Library) => {
    setSelectedLibrary(library);
    setShowViewLibraryModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8 mt-16">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Libraries</h1>
          <Button
            className="bg-library-primary hover:bg-blue-700"
            onClick={() => {
              setSelectedLibrary(null);
              setShowAddLibraryModal(true);
            }}
          >
            Add Library
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : libraries.length === 0 ? (
          <div className="text-center py-12 border rounded-md bg-gray-50">
            <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No libraries found.</p>
            <p className="text-sm text-gray-500">Click "Add Library" to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {libraries.map((library) => (
              <div
                key={library.id}
                className="bg-white shadow-md rounded-lg p-6 flex flex-col gap-2 relative hover:shadow-lg hover:bg-gray-50 transition-all duration-200 cursor-pointer group"
                onClick={() => handleViewLibraryClick(library)}
              >
                <div className="absolute top-2 right-2 flex gap-2 z-10">
                  <button
                    className="p-1 rounded hover:bg-gray-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditLibraryClick(library);
                    }}
                    title="Edit Library"
                  >
                    <Pencil className="h-4 w-4 text-blue-600" />
                  </button>
                  <button
                    className="p-1 rounded hover:bg-gray-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteLibraryClick(library);
                    }}
                    title="Delete Library"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>

                <div className="flex gap-4">
                  <Building className="h-6 w-6 text-library-primary flex-shrink-0 mt-1" />
                  <div>
                    <h2 className="text-xl font-semibold mb-2 truncate" title={library.name}>
                      {library.name}
                    </h2>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-start">
                        <MapPin className="h-4 w-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" />
                        <span className="truncate" title={library.address}>
                          {library.address}
                        </span>
                      </div>
                      {library.contact_info && typeof library.contact_info === 'object' && 'phone' in library.contact_info && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                          <span>{library.contact_info.phone || "N/A"}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <Badge variant="outline" className="text-sm">
                    {library.institutions?.name || "Unknown Institution"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {showDeleteDialog && libraryToDelete && (
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Library</DialogTitle>
              </DialogHeader>
              <div>
                Are you sure you want to delete "{libraryToDelete.name}"? This action cannot be undone.
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleConfirmDeleteLibrary}>
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        <AddLibraryModal
          isOpen={showAddLibraryModal}
          onClose={() => {
            setShowAddLibraryModal(false);
            setSelectedLibrary(null);
          }}
          onSuccess={fetchLibraries}
          library={selectedLibrary || undefined}
        />

        {selectedLibrary && (
          <ViewLibraryModal
            isOpen={showViewLibraryModal}
            onClose={() => {
              setShowViewLibraryModal(false);
              setSelectedLibrary(null);
            }}
            library={selectedLibrary}
          />
        )}
      </main>
    </div>
  );
};

export default Libraries; 