import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBorrowedBooks } from "@/hooks/useBorrowedBooks";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { sanitizeString, formatCurrency } from "@/lib/utils";
import { useCallback } from "react";

const BorrowedBooks = () => {
  const { isLibrarian, isAdmin } = useAuth();
  const {
    borrowedBooks,
    isLoading,
    isReturning,
    filter,
    setFilter,
    handleReturn,
    error
  } = useBorrowedBooks();

  const calculateDaysLeft = useCallback((dueDate: string) => {
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(dueDate)) {
      return "Invalid date";
    }

    const today = new Date();
    const due = new Date(dueDate);
    
    // Validate date is not invalid
    if (isNaN(due.getTime())) {
      return "Invalid date";
    }

    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "Overdue";
    if (diffDays === 0) return "Due today";
    return `${diffDays} days`;
  }, []);

  const formatDate = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }
      return date.toLocaleDateString();
    } catch {
      return "Invalid date";
    }
  }, []);

  const renderError = () => {
    if (!error) return null;

    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{sanitizeString(error.message)}</AlertTitle>
        <AlertDescription>{sanitizeString(error.details || '')}</AlertDescription>
      </Alert>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {sanitizeString(error.message)}
          </h3>
          <p className="text-gray-500">
            {sanitizeString(error.details || '')}
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      );
    }

    if (borrowedBooks.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500">No borrowed books found</p>
          <p className="text-sm text-gray-400 mt-2">
            {filter === "current" 
              ? "You don't have any current borrowings."
              : filter === "returned"
              ? "You haven't returned any books yet."
              : "You haven't borrowed any books yet."}
          </p>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Book Title</TableHead>
            <TableHead>Authors</TableHead>
            {(isLibrarian || isAdmin) && <TableHead>Borrower</TableHead>}
            <TableHead>Borrowed On</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Days Left</TableHead>
            <TableHead>Penalty</TableHead>
            {(isLibrarian || isAdmin) && <TableHead>Action</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {borrowedBooks.map((item) => {
            const daysLeft = calculateDaysLeft(item.due_date);
            return (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  {sanitizeString(item.book.title)}
                </TableCell>
                <TableCell>
                  {item.book.authors.map(sanitizeString).join(', ')}
                </TableCell>
                {(isLibrarian || isAdmin) && (
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {sanitizeString(item.borrower_name)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {sanitizeString(item.borrower_email)}
                      </span>
                    </div>
                  </TableCell>
                )}
                <TableCell>{formatDate(item.borrow_date)}</TableCell>
                <TableCell>{formatDate(item.due_date)}</TableCell>
                <TableCell>
                  <span className={daysLeft === "Overdue" ? "text-red-600 font-semibold" : ""}>
                    {daysLeft}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={item.penalty > 0 ? "text-red-600 font-semibold" : ""}>
                    {formatCurrency(item.penalty)}
                  </span>
                </TableCell>
                {(isLibrarian || isAdmin) && !item.return_date && (
                  <TableCell>
                    <Button
                      size="sm"
                      className="bg-library-primary hover:bg-blue-700"
                      onClick={() => handleReturn(item.id)}
                      disabled={isReturning}
                    >
                      {isReturning ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Mark as Returned
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8 mt-16">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            {(isLibrarian || isAdmin) ? 'Borrowed Books' : 'My Borrowed Books'}
          </h1>
          <Tabs value={filter} onValueChange={(value) => setFilter(value as typeof filter)}>
            <TabsList>
              <TabsTrigger value="current">Current</TabsTrigger>
              <TabsTrigger value="returned">Returned</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {renderError()}

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default BorrowedBooks;
