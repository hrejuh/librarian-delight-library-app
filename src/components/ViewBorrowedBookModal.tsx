import { BorrowedBook } from "@/lib/data-types";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getDaysLeft } from "@/lib/mock-data";

interface ViewBorrowedBookModalProps {
  borrowedBook: BorrowedBook;
  onClose: () => void;
  onMarkAsReturned: () => void;
}

export const ViewBorrowedBookModal = ({
  borrowedBook,
  onClose,
  onMarkAsReturned,
}: ViewBorrowedBookModalProps) => {
  const daysLeft = getDaysLeft(borrowedBook.due_date);
  
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl" aria-describedby="borrowed-book-description">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Borrowed Book Details</DialogTitle>
        </DialogHeader>

        <div id="borrowed-book-description" className="sr-only">
          View details of your borrowed book, including due date and return status
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <div className="aspect-[2/3] bg-gray-200 rounded-lg overflow-hidden">
              {borrowedBook.book.image_url ? (
                <img
                  src={borrowedBook.book.image_url}
                  alt={`Cover of ${borrowedBook.book.title}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No Image
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-2 space-y-4">
            <h2 className="text-2xl font-bold">{borrowedBook.book.title}</h2>

            <div className="space-y-2">
              <div>
                <span className="font-semibold">Borrower: </span>
                <span>{borrowedBook.borrower_email}</span>
              </div>
              <div>
                <span className="font-semibold">Borrow Date: </span>
                <span>{new Date(borrowedBook.borrow_date).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="font-semibold">Due Date: </span>
                <span>{new Date(borrowedBook.due_date).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="font-semibold">Days Left: </span>
                <span className={`${daysLeft === "Overdue" ? "text-red-600 font-semibold" : ""}`}>
                  {daysLeft}
                </span>
              </div>
              <div>
                <span className="font-semibold">Penalty: </span>
                <span className={`${borrowedBook.penalty > 0 ? "text-red-600 font-semibold" : ""}`}>
                  ₹{borrowedBook.penalty.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="pt-4">
              <h3 className="font-semibold mb-1">Book Summary:</h3>
              <p className="text-gray-700">{borrowedBook.book.summary}</p>
            </div>
          </div>
        </div>

        <DialogFooter className="space-x-2">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            onClick={onMarkAsReturned}
            className="bg-library-primary hover:bg-blue-700"
          >
            Mark as Returned
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
