import { useState } from "react";
import { Book } from "@/lib/data-types";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookOpen, Calendar, AlertCircle, IndianRupee } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { InstitutionSettings } from "@/lib/data-types";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BorrowRequestModalProps {
  book: Book;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  institutionSettings: InstitutionSettings;
}

export const BorrowRequestModal = ({
  book,
  isOpen,
  onClose,
  onSuccess,
  institutionSettings,
}: BorrowRequestModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error borrowing book:', error);
      setError(error.message || 'Failed to borrow book');
    } finally {
      setIsLoading(false);
    }
  };

  const isAvailable = book.available > 0;
  const nextAvailableDate = book.nextAvailableSlot
    ? new Date(book.nextAvailableSlot).toLocaleDateString()
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]" aria-describedby="borrow-request-description">
        <DialogHeader>
          <DialogTitle>
            {isAvailable ? "Borrow Book" : "Request Book"}
          </DialogTitle>
        </DialogHeader>

        <div id="borrow-request-description" className="sr-only">
          {isAvailable 
            ? "Confirm your request to borrow this book" 
            : "Request to be notified when this book becomes available"}
        </div>

        <div className="grid gap-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-start gap-4">
            {book.image_url && (
              <img
                src={book.image_url}
                alt={book.title}
                className="w-24 h-32 object-cover rounded-md"
              />
            )}
            <div className="space-y-1">
              <h3 className="font-semibold">{book.title}</h3>
              <p className="text-sm text-gray-500">{book.authors.join(', ')}</p>
              <p className="text-sm font-medium text-green-600">
                {book.available} of {book.total} copies available
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 bg-blue-50 p-3 rounded-md">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-2 text-sm text-blue-600">
              <p className="font-medium">Important Information</p>
              <div className="space-y-1.5">
                <div className="flex items-start gap-2">
                  <BookOpen className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Loan Duration: {institutionSettings.loan_duration_days} days</span>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Collect within: {institutionSettings.reserve_duration_days} days</span>
                </div>
                <div className="flex items-start gap-2">
                  <IndianRupee className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Late fine per day: ₹{institutionSettings.late_fine_per_day}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading || !isAvailable}>
            {isLoading ? "Processing..." : isAvailable ? "Confirm Borrow" : "Join Queue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 