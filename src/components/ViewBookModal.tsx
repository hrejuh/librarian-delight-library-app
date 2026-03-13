import { Book } from "@/lib/data-types";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookOpen, IndianRupee, Users, Calendar, Tag } from "lucide-react";

interface ViewBookModalProps {
  book: Book;
  onClose: () => void;
  showRequestButton?: boolean;
  onRequestBook?: (book: Book) => void;
}

export const ViewBookModal = ({ book, onClose, showRequestButton = false, onRequestBook }: ViewBookModalProps) => {
  const bookStatus = typeof book.status === 'string' 
    ? book.status.charAt(0).toUpperCase() + book.status.slice(1)
    : book.status;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl" aria-describedby="book-details-description">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">Book Details</DialogTitle>
        </DialogHeader>
        
        <div id="book-details-description" className="sr-only">
          Detailed information about the book, including cover image, title, author, and availability status
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Book Cover */}
          <div className="md:col-span-1">
            <div className="aspect-[2/3] bg-gray-100 rounded-xl overflow-hidden shadow-lg">
              {book.image_url ? (
                <img
                  src={book.image_url}
                  alt={`Cover of ${book.title}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <BookOpen className="w-16 h-16" />
                </div>
              )}
            </div>
          </div>
          
          {/* Book Details */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{book.title}</h2>
              <div className="text-base text-gray-600 mb-2">
                <span className="font-medium">By: </span>
                {book.authors && book.authors.length > 0 ? book.authors.join(", ") : "Unknown Author"}
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${book.available > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                  {book.available > 0 ? `${book.available} of ${book.total} Available` : 'Not available'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 font-medium">
                  {book.genres && book.genres.length > 0 ? book.genres.join(", ") : "No Genre"}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700 font-medium">
                  {book.language || "Unknown Language"}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${String(book.status).toLowerCase() === "available" ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"}`}>
                  {bookStatus}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-sm text-gray-500">Publisher</div>
                <div className="font-medium text-gray-900">{book.publisher || "-"}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-gray-500">Publish Date</div>
                <div className="font-medium text-gray-900">{book.publish_date || "-"}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-gray-500">Cover Type</div>
                <div className="font-medium text-gray-900">{book.cover_type || "-"}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-gray-500">ISBN-13</div>
                <div className="font-medium text-gray-900">{book.isbn_13 || "-"}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-gray-500">ISBN-10</div>
                <div className="font-medium text-gray-900">{book.isbn_10 || "-"}</div>
              </div>
            </div>
            <div className="space-y-2 mt-4">
              <h3 className="text-lg font-semibold text-gray-900">Summary</h3>
              <p className="text-gray-700 leading-relaxed">
                {book.summary || "No summary available."}
              </p>
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex gap-2 justify-end mt-6">
          {showRequestButton && 
           (String(book.status).toLowerCase() === 'available' || String(book.status).toLowerCase() === 'Available') && 
           book.available > 0 && (
            <Button 
              className="bg-library-primary hover:bg-blue-700 text-white"
              onClick={() => onRequestBook && onRequestBook(book)}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Request Book
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={onClose}
            className="border-gray-300 hover:bg-gray-50"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
