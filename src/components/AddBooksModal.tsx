import { useState } from "react";
import { Upload, BookOpen, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

interface AddBooksModalProps {
  onClose: () => void;
  onSave: (books: any[]) => void;
}

export const AddBooksModal = ({ onClose, onSave }: AddBooksModalProps) => {
  const { toast } = useToast();
  const { isSuperAdmin } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Check if user is super admin
  if (!isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setUploadProgress(i);
      }

      // TODO: Implement actual file upload and processing
      const formData = new FormData();
      formData.append("file", file);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      toast({
        title: "Success",
        description: "Books have been added successfully",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload books. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    // Create a sample CSV content
    const csvContent = [
      ["title", "author", "isbn", "publisher", "publication_year", "category", "copies"],
      ["The Great Gatsby", "F. Scott Fitzgerald", "9780743273565", "Scribner", "1925", "Fiction", "5"],
      ["To Kill a Mockingbird", "Harper Lee", "9780446310789", "Grand Central Publishing", "1960", "Fiction", "3"],
    ].join("\n");

    // Create a blob and download link
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "books_template.csv";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-library-primary" />
            Add Books
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <h3 className="font-medium text-gray-700">Upload Excel/CSV File</h3>
            <p className="text-sm text-gray-500">
              Upload an Excel or CSV file containing book information. The file should include the following columns:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-500 space-y-1">
              <li>title (required)</li>
              <li>author (required)</li>
              <li>isbn (required)</li>
              <li>publisher</li>
              <li>publication_year</li>
              <li>category</li>
              <li>copies (required)</li>
            </ul>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Template
            </Button>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <Upload className="h-8 w-8 text-gray-400" />
              <div className="text-sm text-gray-600">
                {file ? (
                  <div className="flex items-center gap-2">
                    <span>{file.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  "Drag and drop your file here, or click to browse"
                )}
              </div>
            </label>
          </div>

          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="bg-library-primary hover:bg-library-primary/90"
          >
            {isUploading ? "Uploading..." : "Upload Books"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 