import { useState } from "react";
import { Book } from "@/lib/data-types";
import { Button } from "@/components/ui/button";
import { EditBookModal } from "./EditBookModal";
import { ViewBookModal } from "./ViewBookModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Edit, Trash2 } from "lucide-react";
import { BorrowRequestModal } from "./BorrowRequestModal";
import { BookQueueModal } from "./BookQueueModal";
import { InstitutionSettings } from "@/lib/data-types";
import { useAuth } from "@/contexts/AuthContext";

interface BookCardProps {
  book: Book;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onUpdate?: (updatedBook: Book) => void;
  onBorrow: (bookId: string) => Promise<void>;
  onRequest?: (id: string) => void;
  isStudent?: boolean;
  institutionSettings: InstitutionSettings | null;
}

export const BookCard = ({ 
  book, 
  onView, 
  onEdit, 
  onDelete, 
  onUpdate,
  onBorrow,
  onRequest,
  isStudent = false,
  institutionSettings
}: BookCardProps) => {
  const { user } = useAuth();
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [showQueueModal, setShowQueueModal] = useState(false);

  const handleDelete = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onDelete) {
      onDelete(book.id);
    }
    setShowDeleteDialog(false);
  };

  const handleViewClick = () => {
    if (onView) {
      onView(book.id);
    } else {
      setShowViewModal(true);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(book.id);
    } else {
      setShowEditModal(true);
    }
  };

  const handleDeleteIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleBorrowClick = (e: React.MouseEvent) => {
    // Prevent the click from bubbling up to the card
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      // TODO: Add proper unauthenticated user handling
      console.log("User not authenticated");
      return;
    }

    // Check if we have institution settings for borrowing
    if (book.available > 0 && !institutionSettings) {
      console.log("Institution settings not available");
      return;
    }

    // Show appropriate modal based on availability
    if (book.available > 0) {
      setShowBorrowModal(true);
    } else {
      setShowQueueModal(true);
    }
  };

  const handleBorrowSuccess = async () => {
    setShowBorrowModal(false);
    await onBorrow(book.id);
  };

  const handleQueueSuccess = () => {
    setShowQueueModal(false);
  };

  return (
    <>
      <div
        className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow flex items-center p-4 gap-4 min-h-[140px] cursor-pointer"
        onClick={handleViewClick}
      >
        {/* Book Image */}
        <img
          src={book.image_url || "https://via.placeholder.com/100x140?text=Book"}
          alt={book.title}
          className="w-24 h-32 object-cover rounded-md border border-gray-200 flex-shrink-0"
        />
        {/* Book Details */}
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-lg truncate pr-2">{book.title}</h3>
            {!isStudent && (
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="hover:bg-blue-100 text-blue-600"
                  onClick={handleEditClick}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="hover:bg-red-100 text-red-600"
                  onClick={handleDeleteIconClick}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <p className="text-gray-600 text-sm truncate">{book.authors && book.authors.length > 0 ? book.authors.join(", ") : "Unknown Author"}</p>
          <p className="text-gray-500 text-xs mt-1 line-clamp-2">{book.summary || "No summary available."}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${book.available > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
              {book.available > 0 ? `${book.available} of ${book.total} Available` : 'Not available'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 font-medium">
              {book.genres && book.genres.length > 0 ? book.genres.join(", ") : "No Genre"}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-3">
            {isStudent && (
              <div onClick={(e) => e.stopPropagation()}>
                <Button
                  size="sm"
                  variant={book.available > 0 ? "default" : "outline"}
                  className={`rounded-full px-4 font-semibold shadow-sm transition-colors ${
                    book.available > 0 
                      ? 'bg-library-primary hover:bg-blue-700 text-white' 
                      : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                  }`}
                  onClick={handleBorrowClick}
                >
                  {book.available > 0 ? "Borrow" : "Join Queue"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showViewModal && (
        <ViewBookModal
          book={book}
          onClose={() => setShowViewModal(false)}
        />
      )}

      {showEditModal && (
        <EditBookModal
          mode="edit"
          book={book}
          onClose={() => setShowEditModal(false)}
          onSave={(updatedBook) => {
            if (onUpdate) {
              onUpdate(updatedBook);
            }
            setShowEditModal(false);
          }}
        />
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent aria-describedby="delete-book-description">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          </AlertDialogHeader>

          <div id="delete-book-description" className="sr-only">
            Confirm deletion of this book from the library system
          </div>

          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the book
            from the library.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showBorrowModal && institutionSettings && (
        <BorrowRequestModal
          book={book}
          isOpen={showBorrowModal}
          onClose={() => setShowBorrowModal(false)}
          onSuccess={handleBorrowSuccess}
          institutionSettings={institutionSettings}
        />
      )}

      {showQueueModal && (
        <BookQueueModal
          book={book}
          isOpen={showQueueModal}
          onClose={() => setShowQueueModal(false)}
          onSuccess={handleQueueSuccess}
        />
      )}
    </>
  );
};

export const AddBookCard = ({ onAdd }: { onAdd: () => void }) => {
  return (
    <div 
      className="bg-white rounded-lg shadow-md p-4 flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-gray-200 min-h-[140px]"
      onClick={onAdd}
    >
      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-2">
        <span className="text-library-primary text-2xl">+</span>
      </div>
      <p className="text-library-primary font-medium">Add New Book</p>
    </div>
  );
};

export default BookCard;
