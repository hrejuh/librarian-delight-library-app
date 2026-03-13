import { useState } from "react";
import { BorrowedBook } from "@/lib/data-types";
import { Button } from "@/components/ui/button";
import { ViewBorrowedBookModal } from "./ViewBorrowedBookModal";
import { getDaysLeft } from "@/lib/mock-data";

interface BorrowedBookCardProps {
  borrowedBook: BorrowedBook;
  onMarkAsReturned: (id: string) => void;
}

export const BorrowedBookCard = ({
  borrowedBook,
  onMarkAsReturned,
}: BorrowedBookCardProps) => {
  const [showViewModal, setShowViewModal] = useState(false);
  
  const daysLeft = getDaysLeft(borrowedBook.due_date);
  
  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
          <div className="w-[80px] h-[120px] bg-gray-200 rounded overflow-hidden">
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

          <div className="flex-1 text-center md:text-left space-y-1">
            <h3 className="text-lg font-bold">{borrowedBook.book.title}</h3>
            <p className="text-sm">
              <span className="text-gray-500">Borrowed by: </span>
              {borrowedBook.borrower_email}
            </p>
            <p className="text-sm">
              <span className="text-gray-500">Due Date: </span>
              {new Date(borrowedBook.due_date).toLocaleDateString()}
            </p>
            <p className="text-sm">
              <span className="text-gray-500">Days Left: </span>
              <span className={`${daysLeft === "Overdue" ? "text-red-600 font-semibold" : ""}`}>
                {daysLeft}
              </span>
            </p>
            <p className="text-sm">
              <span className="text-gray-500">Penalty: </span>
              <span className={`${borrowedBook.penalty > 0 ? "text-red-600 font-semibold" : ""}`}>
                ₹{borrowedBook.penalty.toFixed(2)}
              </span>
            </p>

            <div className="mt-3 space-x-2 flex justify-center md:justify-start">
              <Button
                size="sm"
                className="bg-library-primary hover:bg-blue-700"
                onClick={() => onMarkAsReturned(borrowedBook.id)}
              >
                Mark as Returned
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-library-primary text-library-primary"
                onClick={() => setShowViewModal(true)}
              >
                View Details
              </Button>
            </div>
          </div>
        </div>
      </div>

      {showViewModal && (
        <ViewBorrowedBookModal 
          borrowedBook={borrowedBook}
          onMarkAsReturned={() => {
            onMarkAsReturned(borrowedBook.id);
            setShowViewModal(false);
          }}
          onClose={() => setShowViewModal(false)} 
        />
      )}
    </>
  );
};
