import { useState, useEffect, useCallback } from "react";
import { BorrowedBook } from "@/lib/data-types";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { handleAndShowError, AppError, ErrorType } from "@/lib/error-handling";
import { toast } from "sonner";

interface UseBorrowedBooksReturn {
  borrowedBooks: BorrowedBook[];
  isLoading: boolean;
  isReturning: boolean;
  filter: "current" | "returned" | "all";
  setFilter: (filter: "current" | "returned" | "all") => void;
  institutionSettings: {
    late_fine_per_day: number;
  } | null;
  handleReturn: (borrowingId: string) => Promise<void>;
  refreshBooks: () => Promise<void>;
  error: AppError | null;
}

export const useBorrowedBooks = (): UseBorrowedBooksReturn => {
  const [borrowedBooks, setBorrowedBooks] = useState<BorrowedBook[]>([]);
  const [filter, setFilter] = useState<"current" | "returned" | "all">("current");
  const [isLoading, setIsLoading] = useState(true);
  const [isReturning, setIsReturning] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [institutionSettings, setInstitutionSettings] = useState<{
    late_fine_per_day: number;
  } | null>(null);
  const { user, profile } = useAuth();

  const fetchInstitutionSettings = useCallback(async () => {
    if (!profile?.institution_id) {
      setError({
        type: "VALIDATION_ERROR",
        message: "Institution ID Missing",
        details: "Your account is not associated with any institution. Please contact your administrator."
      });
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('institutions')
        .select('late_fine_per_day')
        .eq('id', profile.institution_id)
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error("Institution settings not found");
      }

      setInstitutionSettings(data);
      setError(null);
    } catch (error) {
      const appError = handleAndShowError(error);
      setError(appError);
    }
  }, [profile?.institution_id]);

  const fetchBorrowedBooks = useCallback(async () => {
    if (!user || !profile) {
      setError({
        type: "AUTH_ERROR",
        message: "Authentication Required",
        details: "Please log in to view borrowed books."
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('borrowings')
        .select(`
          id,
          book_id,
          user_id,
          borrow_date,
          due_date,
          return_date,
          penalty,
          institution_id,
          book:books!inner (
            id,
            title,
            authors,
            available,
            status,
            total,
            summary,
            image_url,
            genres
          )
        `)
        .order('borrow_date', { ascending: false });

      // Apply filter
      if (filter === "current") {
        query = query.is('return_date', null);
      } else if (filter === "returned") {
        query = query.not('return_date', 'is', null);
      }

      // If student, only fetch their books
      if (profile.role === 'student') {
        query = query.eq('user_id', user.id);
      }

      // If admin or librarian, filter by institution
      if ((profile.role === 'admin' || profile.role === 'librarian') && profile.institution_id) {
        query = query.eq('institution_id', profile.institution_id);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error("No data returned from the server");
      }

      const formattedBooks: BorrowedBook[] = await Promise.all(data.map(async (item) => {
        let borrowerEmail = "Unknown";
        let borrowerName = "Unknown";

        // Get user info using direct_profile_lookup
        if (item.user_id) {
          const { data: userData, error: userError } = await supabase
            .rpc('direct_profile_lookup', { lookup_id: item.user_id });

          if (userError) {
            console.warn(`Failed to fetch user info for ID ${item.user_id}:`, userError);
          } else if (userData?.[0]) {
            borrowerEmail = userData[0].email;
            borrowerName = userData[0].full_name || userData[0].email;
          }
        }

        // Calculate penalty if book is overdue
        let penalty = item.penalty || 0;
        if (!item.return_date && new Date(item.due_date) < new Date()) {
          const daysOverdue = Math.ceil((new Date().getTime() - new Date(item.due_date).getTime()) / (1000 * 60 * 60 * 24));
          penalty = daysOverdue * (institutionSettings?.late_fine_per_day || 20);
        }

        return {
          id: item.id,
          book: {
            ...item.book,
            status: item.book.status as BorrowedBook['book']['status']
          },
          borrower_email: borrowerEmail,
          borrower_name: borrowerName,
          borrow_date: item.borrow_date,
          due_date: item.due_date,
          return_date: item.return_date,
          penalty: penalty,
          user_id: item.user_id,
          institution_id: item.institution_id
        };
      }));

      setBorrowedBooks(formattedBooks);
      setError(null);
    } catch (error) {
      const appError = handleAndShowError(error);
      setError(appError);
    } finally {
      setIsLoading(false);
    }
  }, [user, profile, filter, institutionSettings]);

  const handleReturn = async (borrowingId: string) => {
    if (!profile?.institution_id) {
      const error: AppError = {
        type: "VALIDATION_ERROR",
        message: "Permission Error",
        details: "You must be associated with an institution to return a book"
      };
      handleAndShowError(error);
      setError(error);
      return;
    }

    setIsReturning(true);
    setError(null);

    try {
      const { error: returnError } = await supabase
        .rpc('return_book', {
          p_borrowing_id: borrowingId,
          p_institution_id: profile.institution_id
        });

      if (returnError) {
        throw returnError;
      }

      await fetchBorrowedBooks();
      toast.success("Book returned successfully");
    } catch (error) {
      const appError = handleAndShowError(error);
      setError(appError);
    } finally {
      setIsReturning(false);
    }
  };

  useEffect(() => {
    if (profile?.institution_id) {
      fetchInstitutionSettings();
    }
  }, [profile?.institution_id, fetchInstitutionSettings]);

  useEffect(() => {
    fetchBorrowedBooks();
  }, [fetchBorrowedBooks]);

  return {
    borrowedBooks,
    isLoading,
    isReturning,
    filter,
    setFilter,
    institutionSettings,
    handleReturn,
    refreshBooks: fetchBorrowedBooks,
    error
  };
}; 