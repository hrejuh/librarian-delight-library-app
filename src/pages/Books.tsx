import { useState, useMemo } from "react";
import { useQuery, useMutation, usePaginatedQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Plus,
  BookOpen,
  Loader2,
  Grid3X3,
  List,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddBookDialog } from "@/components/AddBookDialog";

export default function Books() {
  const { profile, isStudent } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGenre, setFilterGenre] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showAddBook, setShowAddBook] = useState(false);

  const isStaff = !isStudent;

  // Use paginated query for the book list
  const {
    results: books,
    status: paginationStatus,
    loadMore,
  } = usePaginatedQuery(
    api.books.listByInstitution,
    profile?.institutionId
      ? { institutionId: profile.institutionId }
      : "skip",
    { initialNumItems: 50 },
  );

  // Use search index when searching
  const searchResults = useQuery(
    api.books.search,
    profile?.institutionId && searchQuery.trim().length >= 2
      ? { institutionId: profile.institutionId, searchQuery }
      : "skip",
  );

  const genres = useQuery(api.genres.list);
  const createBook = useMutation(api.books.create);
  const borrowBook = useMutation(api.borrowings.borrowBook);

  const displayBooks = searchQuery.trim().length >= 2
    ? searchResults ?? []
    : books ?? [];

  const filteredBooks = useMemo(() => {
    if (filterGenre === "all") return displayBooks;
    return displayBooks.filter((b) =>
      b.genres?.some((g) => g.toLowerCase() === filterGenre.toLowerCase()),
    );
  }, [displayBooks, filterGenre]);

  const handleBorrow = async (bookId: string) => {
    if (!profile?.institutionId) return;
    try {
      await borrowBook({
        bookId: bookId as any,
        institutionId: profile.institutionId,
      });
      toast({ title: "Request submitted", description: "Awaiting approval." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleAddBook = async (newBook: any) => {
    if (!profile?.institutionId) return;
    try {
      await createBook({ ...newBook, institutionId: profile.institutionId });
      toast({ title: "Book added" });
      setShowAddBook(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const statusBadge = (book: { available: number }) => {
    if (book.available > 0)
      return <Badge variant="secondary">Available ({book.available})</Badge>;
    return <Badge variant="destructive">Unavailable</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Books</h1>
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search books..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={filterGenre} onValueChange={setFilterGenre}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Genre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genres</SelectItem>
              {(genres ?? []).map((g) => (
                <SelectItem key={g._id} value={g.name}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="rounded-r-none"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="rounded-l-none"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          {isStaff && (
            <Button onClick={() => setShowAddBook(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Book
            </Button>
          )}
        </div>
      </div>

      {filteredBooks.length === 0 && paginationStatus !== "LoadingFirstPage" ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <BookOpen className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium">No books found</p>
            <p className="text-sm">
              {books?.length ? "Try different search or filter." : "Add books to get started."}
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredBooks.map((book) => (
              <Card key={book._id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-[3/4] bg-muted flex items-center justify-center relative">
                  {book.imageUrl ? (
                    <img
                      src={book.imageUrl}
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BookOpen className="h-12 w-12 text-muted-foreground/40" />
                  )}
                  <div className="absolute top-2 right-2">
                    {statusBadge(book)}
                  </div>
                </div>
                <CardContent className="p-3 space-y-1">
                  <h3 className="font-medium text-sm line-clamp-1">{book.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {book.authors.join(", ")}
                  </p>
                  {book.genres.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {book.genres.slice(0, 2).map((g) => (
                        <Badge key={g} variant="outline" className="text-[10px] px-1 py-0">
                          {g}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {isStudent && book.available > 0 && (
                    <Button
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => handleBorrow(book._id)}
                    >
                      Request Borrow
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          {paginationStatus === "CanLoadMore" && !searchQuery.trim() && (
            <div className="flex justify-center pt-4">
              <Button variant="outline" onClick={() => loadMore(50)}>
                Load More
              </Button>
            </div>
          )}
          {paginationStatus === "LoadingMore" && (
            <div className="flex justify-center pt-4">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          )}
        </>
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Authors</TableHead>
                    <TableHead>Genre</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>ISBN</TableHead>
                    {isStudent && <TableHead className="text-right">Action</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBooks.map((book) => (
                    <TableRow key={book._id}>
                      <TableCell className="font-medium">{book.title}</TableCell>
                      <TableCell>{book.authors.join(", ")}</TableCell>
                      <TableCell>{book.genres.join(", ") || "-"}</TableCell>
                      <TableCell>{statusBadge(book)}</TableCell>
                      <TableCell className="text-xs">
                        {book.isbn13 ?? book.isbn10 ?? "-"}
                      </TableCell>
                      {isStudent && (
                        <TableCell className="text-right">
                          {book.available > 0 && (
                            <Button
                              size="sm"
                              onClick={() => handleBorrow(book._id)}
                            >
                              Request
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          {paginationStatus === "CanLoadMore" && !searchQuery.trim() && (
            <div className="flex justify-center pt-4">
              <Button variant="outline" onClick={() => loadMore(50)}>
                Load More
              </Button>
            </div>
          )}
        </>
      )}

      {paginationStatus === "LoadingFirstPage" && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {showAddBook && (
        <AddBookDialog
          isOpen={showAddBook}
          onClose={() => setShowAddBook(false)}
          onSave={handleAddBook}
        />
      )}
    </div>
  );
}
