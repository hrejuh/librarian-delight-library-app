import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { EditBookModal } from "../components/EditBookModal";
import { ViewBookModal } from "@/components/ViewBookModal";
import { Book, InstitutionSettings } from "@/lib/data-types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import SearchFilterBar from "@/components/SearchFilterBar";
import { BookCard } from "@/components/BookCard";
import { Loader2 } from "lucide-react";
import { AddBookDialog } from "@/components/AddBookDialog";

interface BookWithNextSlot extends Book {
  nextAvailableSlot?: string | null;
}

interface User {
  id: string;
  email: string;
  user_metadata?: {
    institution_id?: string;
  };
}

const Books = () => {
  const [books, setBooks] = useState<BookWithNextSlot[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [modalType, setModalType] = useState<"view" | "edit" | "add" | "borrow" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGenre, setFilterGenre] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [institutionSettings, setInstitutionSettings] = useState<InstitutionSettings | null>(null);
  const { toast } = useToast();
  const { profile, user } = useAuth();
  const processingBooks = new Set<string>();

  useEffect(() => {
    // Only fetch books if we have a profile and haven't loaded books yet
    if (profile) {
      fetchBooks();
      fetchInstitutionSettings();
    }

    // Subscribe to real-time updates for books
    const subscription = supabase
      .channel('books_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'books',
          filter: `institution_id=eq.${profile?.institution_id}`
        },
        (payload) => {
          console.log('Real-time update received:', payload);
          fetchBooks(); // Reload books when any change occurs
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [profile]);

  const fetchInstitutionSettings = async () => {
    if (!profile?.institution_id) return;
    
    const { data, error } = await supabase
      .from('institutions')
      .select('organization_structure')
      .eq('id', profile.institution_id)
      .single();

    if (!error && data?.organization_structure) {
      const orgStructure = data.organization_structure as {
        level4?: {
          configs?: Array<{
            name: string;
            reservation_duration?: number;
            loan_duration?: number;
            fine_per_day?: number;
            max_books?: number;
          }>;
        };
      };

      const studentConfig = orgStructure.level4?.configs?.find(
        (config) => config.name === "Students"
      );

      if (studentConfig) {
        setInstitutionSettings({
          reserve_duration_days: studentConfig.reservation_duration || 7,
          loan_duration_days: studentConfig.loan_duration || 14,
          late_fine_per_day: studentConfig.fine_per_day || 1.00,
          collection_window_hours: 24, // Default value
          max_books_per_user: studentConfig.max_books || 5,
          max_active_requests: 3, // Default value
        });
      }
    }
  };

  const fetchBooks = async () => {
    if (!profile?.institution_id) {
      return;
    }
    try {
      const { data: booksData, error: booksError } = await supabase
        .from("books")
        .select("*")
        .eq("institution_id", profile.institution_id);

      if (booksError) throw booksError;

      // Use the available and total columns directly from the books table
      const booksWithStatus = booksData?.map(book => ({
        ...book,
        status: book.available > 0 ? "Available" as const : "Borrowed" as const,
        nextAvailableSlot: null
      })) || [];

      setBooks(booksWithStatus);
      setIsLoading(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleBorrow = async (bookId: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to request a book",
        variant: "destructive",
      });
      return;
    }

    if (!profile?.institution_id) {
      toast({
        title: "Error",
        description: "You must be associated with an institution to request a book",
        variant: "destructive",
      });
      return;
    }

    if (processingBooks.has(bookId)) {
      return;
    }

    try {
      processingBooks.add(bookId);

      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + (institutionSettings?.reserve_duration_days || 0));
      expirationDate.setHours(23, 59, 59, 999);

      // Call the borrow_book function
      const { data: requestId, error: borrowError } = await supabase
        .rpc('borrow_book', {
          p_book_id: bookId,
          p_user_id: user.id,
          p_institution_id: profile.institution_id,
          p_expiration_date: expirationDate.toISOString()
        });

      if (borrowError) {
        throw borrowError;
      }

      // Update local state - only modify available count
      setBooks((prevBooks) =>
        prevBooks.map((b) =>
          b.id === bookId
            ? {
                ...b,
                available: b.available - 1,
                status: b.available - 1 === 0 ? "Borrowed" : "Available"
              }
            : b
        )
      );

      toast({
        title: "Success",
        description: `Book request submitted successfully. Please collect the book from the library within ${institutionSettings?.reserve_duration_days} days.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit the book request",
        variant: "destructive",
      });
    } finally {
      processingBooks.delete(bookId);
    }
  };

  const handleDelete = async (bookId: string) => {
    try {
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', bookId);

      if (error) {
        toast({
          title: "Error Deleting Book",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setBooks(books.filter((book) => book.id !== bookId));

      toast({
        title: "Book Deleted",
        description: "The book has been successfully deleted.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateBook = async (updatedBook: Book) => {
    try {
      const { error } = await supabase
        .from('books')
        .update({
          title: updatedBook.title,
          authors: updatedBook.authors,
          status: updatedBook.status,
          summary: updatedBook.summary,
          image_url: updatedBook.image_url,
          genres: updatedBook.genres,
          available: updatedBook.available,
          total: updatedBook.total,
          cover_type: updatedBook.cover_type,
          publisher: updatedBook.publisher,
          publish_date: updatedBook.publish_date,
          isbn_13: updatedBook.isbn_13,
          isbn_10: updatedBook.isbn_10,
          language: updatedBook.language,
        })
        .eq('id', updatedBook.id);

      if (error) {
        toast({
          title: "Error Updating Book",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setBooks(books.map((book) => (book.id === updatedBook.id ? updatedBook : book)));

      toast({
        title: "Book Updated",
        description: "The book has been successfully updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      searchQuery === "" ||
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (book.authors && book.authors.join(", ").toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesGenre =
      filterGenre === "all" || (book.genres && book.genres.join(", ").toLowerCase().includes(filterGenre.toLowerCase()));

    return matchesSearch && matchesGenre;
  });

  // Student view
  if (profile?.role === "student") {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-8 mt-16">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Books</h1>
          </div>

          <SearchFilterBar
            type="books"
            onSearch={({ searchQuery, genreFilter }) => {
              setSearchQuery(searchQuery);
              setFilterGenre(genreFilter);
            }}
          />

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No books found.</p>
              <p className="text-sm text-gray-400 mt-2">
                {books.length > 0 ? "Try adjusting your search filters." : "There are no books in the library yet."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              {filteredBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onView={() => {
                    setSelectedBook(book);
                    setModalType("view");
                  }}
                  onBorrow={handleBorrow}
                  isStudent={true}
                  institutionSettings={institutionSettings}
                />
              ))}
            </div>
          )}

          {selectedBook && modalType === "view" && (
            <ViewBookModal
              book={selectedBook}
              onClose={() => {
                setSelectedBook(null);
                setModalType(null);
              }}
            />
          )}
        </main>
      </div>
    );
  }

  // Staff view
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8 mt-16">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Books</h1>
        </div>

        <SearchFilterBar
          type="books"
          onSearch={({ searchQuery, genreFilter }) => {
            setSearchQuery(searchQuery);
            setFilterGenre(genreFilter);
          }}
        />

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No books found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {filteredBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onView={() => {
                  setSelectedBook(book);
                  setModalType("view");
                }}
                onEdit={() => {
                  setSelectedBook(book);
                  setModalType("edit");
                }}
                onDelete={handleDelete}
                onUpdate={handleUpdateBook}
                onBorrow={handleBorrow}
                institutionSettings={institutionSettings}
                isStudent={false}
              />
            ))}
          </div>
        )}

        {selectedBook && modalType === "view" && (
          <ViewBookModal
            book={selectedBook}
            onClose={() => {
              setSelectedBook(null);
              setModalType(null);
            }}
          />
        )}

        {selectedBook && modalType === "edit" && (
          <EditBookModal
            mode="edit"
            book={selectedBook}
            onClose={() => {
              setSelectedBook(null);
              setModalType(null);
            }}
            onSave={(updatedBook) => {
              handleUpdateBook(updatedBook);
              setSelectedBook(null);
              setModalType(null);
            }}
          />
        )}

        {modalType === "add" && (
          <AddBookDialog
            isOpen={true}
            onClose={() => setModalType(null)}
            onSave={async (newBook) => {
              try {
                const { error } = await supabase.from("books").insert({
                  ...newBook,
                  institution_id: profile?.institution_id,
                });

                if (error) throw error;

                toast({
                  title: "Success",
                  description: "Book added successfully",
                });

                fetchBooks();
                setModalType(null);
              } catch (error: any) {
                toast({
                  title: "Error",
                  description: error.message,
                  variant: "destructive",
                });
              }
            }}
          />
        )}
      </main>
    </div>
  );
};

export default Books;
