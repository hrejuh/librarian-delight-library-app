import { AddBookDialog } from "./AddBookDialog";
import { Book } from "@/lib/data-types";

interface EditBookModalProps {
  mode: "edit";
  book: Book;
  onClose: () => void;
  onSave: (book: Book) => void;
}

export const EditBookModal = ({ mode, book, onClose, onSave }: EditBookModalProps) => {
  return (
    <AddBookDialog
      isOpen={true}
      onClose={onClose}
      onSave={onSave}
      book={book}
      mode="edit"
    />
  );
};
