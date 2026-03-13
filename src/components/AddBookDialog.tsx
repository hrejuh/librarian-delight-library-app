import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Book, BookStatus } from "@/lib/data-types";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, BookOpen, X, Check, BookText, BookMarked } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import React from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { cn } from "@/lib/utils";
import { handleAndShowError } from "@/lib/error-handling";
import { bookSchema, validateForm } from "@/lib/form-validation";

interface AddBookDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (book: Book) => void;
  book?: Book;
  mode?: "add" | "edit";
}

interface SearchResult {
  title: string;
  authors: string[];
  publisher?: string;
  publishDate?: string;
  isbn13?: string;
  isbn10?: string;
  coverUrl?: string;
}

export const AddBookDialog = ({ isOpen, onClose, onSave, book, mode = "add" }: AddBookDialogProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isbnInput, setIsbnInput] = useState("");
  const [isLookingUpIsbn, setIsLookingUpIsbn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("search");
  const [formData, setFormData] = useState<Partial<Book> & {
    imageFile?: File | null;
  }>({
    title: "",
    authors: [],
    genres: [],
    summary: "",
    imageUrl: "",
    status: "Available",
    total: 1,
    isbn13: "",
    isbn10: "",
    publishDate: "",
    publisher: "",
    coverType: "Paperback",
    language: "English",
  });
  const [authorInput, setAuthorInput] = useState("");
  const [genreInput, setGenreInput] = useState("");
  const { toast } = useToast();

  // Add a list of common languages
  const languageOptions = [
    "English", "Hindi", "Spanish", "French", "German", "Chinese", "Japanese", "Russian", "Arabic", "Portuguese", "Bengali", "Italian", "Korean", "Turkish", "Vietnamese", "Polish", "Dutch", "Greek", "Czech", "Swedish", "Urdu", "Tamil", "Telugu", "Marathi", "Gujarati", "Punjabi", "Malayalam", "Kannada", "Oriya", "Assamese", "Maithili", "Santali", "Konkani", "Nepali", "Sinhala", "Burmese", "Thai", "Indonesian", "Filipino", "Malay", "Swahili"
  ];
  const [languageSearch, setLanguageSearch] = useState("English");
  const [showLanguageList, setShowLanguageList] = useState(false);

  const [isAddingAuthor, setIsAddingAuthor] = useState(false);
  const [isAddingGenre, setIsAddingGenre] = useState(false);

  // Fetch authors and genres using Convex queries (automatically real-time)
  const authorsData = useQuery(api.authors.list);
  const genresData = useQuery(api.genres.list);
  const authors = authorsData?.map((a: any) => a.name) ?? [];
  const genres = genresData?.map((g: any) => g.name) ?? [];

  const createAuthor = useMutation(api.authors.create);
  const createGenre = useMutation(api.genres.create);
  const lookupISBN = useAction(api.actions.isbnLookup.lookupISBN);
  const searchByTitle = useAction(api.actions.isbnLookup.searchByTitle);

  React.useEffect(() => {
    if (mode === "edit" && book) {
      setFormData({
        title: book.title,
        authors: book.authors || [],
        genres: book.genres || [],
        summary: book.summary || "",
        imageUrl: book.imageUrl || "",
        status: book.status || "Available",
        _id: book._id,
        available: book.available || book.total || 1,
        total: book.total || 1,
        isbn13: book.isbn13 || "",
        isbn10: book.isbn10 || "",
        publishDate: book.publishDate || "",
        publisher: book.publisher || "",
        coverType: book.coverType || "Paperback",
        imageFile: null,
        language: book.language || "English",
      });
      setActiveTab("manual");
    } else if (mode === "add") {
      setFormData({
        title: "",
        authors: [],
        genres: [],
        summary: "",
        imageUrl: "",
        status: "Available",
        total: 1,
        isbn13: "",
        isbn10: "",
        publishDate: "",
        publisher: "",
        coverType: "Paperback",
        imageFile: null,
        language: "English",
      });
      setActiveTab("search");
    }
  }, [mode, book, isOpen]);


  const searchBooks = async () => {
    if (!searchQuery.trim()) {
      handleAndShowError({
        type: "VALIDATION_ERROR",
        message: "Search Error",
        details: "Please enter a search query"
      });
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchByTitle({ query: searchQuery });
      setSearchResults(results as SearchResult[]);
    } catch (error) {
      handleAndShowError(error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleIsbnLookup = async () => {
    if (!isbnInput.trim()) return;
    setIsLookingUpIsbn(true);
    try {
      const result = await lookupISBN({ isbn: isbnInput });
      if (result) {
        setFormData({
          title: result.title || "",
          authors: result.authors || [],
          genres: result.genres || [],
          summary: result.summary || "",
          imageUrl: result.coverUrl || "",
          status: "Available",
          available: 1,
          total: 1,
          isbn13: result.isbn13 || "",
          isbn10: result.isbn10 || "",
          publishDate: result.publishDate || "",
          publisher: result.publisher || "",
          coverType: "Paperback",
          imageFile: null,
          language: result.language || "English",
        });
        setLanguageSearch(result.language || "English");
        setActiveTab("manual");
        toast({ title: "Book found", description: `"${result.title}" loaded from ISBN lookup.` });
      } else {
        toast({ title: "Not found", description: "No book found for this ISBN.", variant: "destructive" });
      }
    } catch (error) {
      handleAndShowError(error);
    } finally {
      setIsLookingUpIsbn(false);
    }
  };

  const handleSelectBook = (result: SearchResult) => {
    setFormData({
      title: result.title || "",
      authors: result.authors || [],
      genres: [],
      summary: "",
      imageUrl: result.coverUrl || "",
      status: "Available",
      available: 1,
      total: 1,
      isbn13: result.isbn13 || "",
      isbn10: result.isbn10 || "",
      publishDate: result.publishDate || "",
      publisher: result.publisher || "",
      coverType: "Paperback",
      imageFile: null,
      language: "English",
    });

    setLanguageSearch("English");
    setActiveTab("manual");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form data
    const validationResult = validateForm(bookSchema, formData);
    if (!validationResult.success) {
      handleAndShowError({
        type: "VALIDATION_ERROR",
        message: "Validation Error",
        details: validationResult.error
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Remove imageFile from the form data before saving
      const { imageFile, ...bookData } = formData;
      const bookToSave = {
        ...bookData,
        available: formData.total,
        language: formData.language,
      } as Book;
      await onSave(bookToSave);
      onClose();
    } catch (error) {
      handleAndShowError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddAuthor = async (input: string) => {
    const properCase = input.trim().replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    if (!properCase) return;

    if (!authors.some((a: string) => a.toLowerCase() === properCase.toLowerCase())) {
      setIsAddingAuthor(true);
      try {
        await createAuthor({ name: properCase });
      } catch (error) {
        // ignore
      }
      setIsAddingAuthor(false);
    }

    if (!formData.authors?.some(a => a.toLowerCase() === properCase.toLowerCase())) {
      setFormData(prev => ({ ...prev, authors: [...(prev.authors || []), properCase] }));
    }
    setAuthorInput("");
  };

  const handleAddGenre = async (input: string) => {
    const properCase = input.trim().replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    if (!properCase) return;

    if (!genres.some((g: string) => g.toLowerCase() === properCase.toLowerCase())) {
      setIsAddingGenre(true);
      try {
        await createGenre({ name: properCase });
      } catch (error) {
        // ignore
      }
      setIsAddingGenre(false);
    }

    if (!formData.genres?.some(g => g.toLowerCase() === properCase.toLowerCase())) {
      setFormData(prev => ({ ...prev, genres: [...(prev.genres || []), properCase] }));
    }
    setGenreInput("");
  };

  const removeAuthor = (author: string) => {
    setFormData(prev => ({ ...prev, authors: (prev.authors || []).filter(a => a !== author) }));
  };

  const removeGenre = (genre: string) => {
    setFormData(prev => ({ ...prev, genres: (prev.genres || []).filter(g => g !== genre) }));
  };

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, imageUrl: e.target.value }));
  };

  const filteredLanguages = languageOptions.filter(lang =>
    lang.toLowerCase().includes(languageSearch.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden" aria-describedby="add-book-description">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{mode === "edit" ? "Edit Book" : "Add New Book"}</DialogTitle>
        </DialogHeader>

        <div id="add-book-description" className="sr-only">
          {mode === "edit"
            ? "Edit the details of an existing book in the library"
            : "Add a new book to the library by either searching online or entering details manually"}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search">Search Online</TabsTrigger>
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="mt-4">
            <div className="flex flex-col h-[520px]">
              {/* ISBN Lookup */}
              <div className="flex gap-2 mb-3">
                <Input
                  placeholder="Enter ISBN (10 or 13 digits)..."
                  value={isbnInput}
                  onChange={(e) => setIsbnInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleIsbnLookup()}
                  className="flex-1"
                />
                <Button
                  onClick={handleIsbnLookup}
                  disabled={isLookingUpIsbn || !isbnInput.trim()}
                  variant="secondary"
                >
                  {isLookingUpIsbn ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Lookup ISBN"
                  )}
                </Button>
              </div>

              <div className="relative mb-3">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">or search by title</span>
                </div>
              </div>

              {/* Title Search */}
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by title or author..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && searchBooks()}
                    className="pl-10"
                  />
                </div>
                <Button
                  onClick={searchBooks}
                  disabled={isSearching || !searchQuery.trim()}
                >
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Search"
                  )}
                </Button>
              </div>

              <div className="flex-1 overflow-hidden">
                {isSearching && (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                )}

                {!isSearching && searchResults.length === 0 && searchQuery && (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No results found</p>
                  </div>
                )}

                {!isSearching && searchResults.length === 0 && !searchQuery && (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Enter an ISBN or search term to find books</p>
                  </div>
                )}

                {!isSearching && searchResults.length > 0 && (
                  <ScrollArea className="h-full border rounded-md">
                    <div className="p-4 space-y-4">
                      {searchResults.map((result, idx) => (
                        <div
                          key={`${result.isbn13 || result.isbn10 || idx}`}
                          className="flex gap-4 p-4 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50"
                          onClick={(e) => {
                            e.preventDefault();
                            handleSelectBook(result);
                          }}
                        >
                          <div className="w-20 h-28 flex-shrink-0">
                            {result.coverUrl ? (
                              <img
                                src={result.coverUrl}
                                alt={result.title}
                                className="w-full h-full object-cover rounded"
                              />
                            ) : (
                              <div className="w-full h-full bg-muted rounded flex items-center justify-center">
                                <BookOpen className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">{result.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {result.authors?.join(", ") || "Unknown Author"}
                            </p>
                            {result.publisher && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {result.publisher}{result.publishDate ? ` (${result.publishDate})` : ""}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="manual" className="mt-4">
            <form onSubmit={handleSubmit} className="flex flex-col h-[520px]">
              <div className="flex-1 grid grid-cols-1 gap-4 overflow-y-auto pr-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Cover Type</Label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, coverType: "Paperback" })}
                        className={`flex-1 px-4 py-2 rounded-md border transition-colors ${
                          formData.coverType === "Paperback"
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/50 hover:bg-muted border-muted-foreground/20"
                        }`}
                      >
                        Paperback
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, coverType: "Hardcover" })}
                        className={`flex-1 px-4 py-2 rounded-md border transition-colors ${
                          formData.coverType === "Hardcover"
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/50 hover:bg-muted border-muted-foreground/20"
                        }`}
                      >
                        Hardcover
                      </button>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="authors">Authors *</Label>
                    <div className="flex flex-wrap gap-2 mb-1">
                      {formData.authors?.map((author) => (
                        <span key={author} className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                          {author}
                          <button type="button" className="ml-1 text-blue-500 hover:text-red-500" onClick={() => removeAuthor(author)}>
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <Input
                      id="authors"
                      value={authorInput}
                      onChange={(e) => setAuthorInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddAuthor(authorInput); } }}
                      placeholder="Type author and press Enter"
                      list="author-list"
                      disabled={isAddingAuthor}
                    />
                    <datalist id="author-list">
                      {authors
                        .filter((a: string) => !formData.authors?.includes(a) && a.toLowerCase().includes(authorInput.toLowerCase()))
                        .map((a: string) => (
                          <option key={a} value={a} />
                        ))}
                    </datalist>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="genres">Genres *</Label>
                    <div className="flex flex-wrap gap-2 mb-1">
                      {formData.genres?.map((genre) => (
                        <span key={genre} className="flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                          {genre}
                          <button type="button" className="ml-1 text-green-500 hover:text-red-500" onClick={() => removeGenre(genre)}>
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <Input
                      id="genres"
                      value={genreInput}
                      onChange={(e) => setGenreInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddGenre(genreInput); } }}
                      placeholder="Type genre and press Enter"
                      list="genre-list"
                      disabled={isAddingGenre}
                    />
                    <datalist id="genre-list">
                      {genres
                        .filter((g: string) => !formData.genres?.includes(g) && g.toLowerCase().includes(genreInput.toLowerCase()))
                        .map((g: string) => (
                          <option key={g} value={g} />
                        ))}
                    </datalist>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="isbn13">ISBN-13</Label>
                    <Input
                      id="isbn13"
                      value={formData.isbn13 || ""}
                      onChange={(e) => setFormData({ ...formData, isbn13: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="isbn10">ISBN-10</Label>
                    <Input
                      id="isbn10"
                      value={formData.isbn10 || ""}
                      onChange={(e) => setFormData({ ...formData, isbn10: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="publishDate">Publish Date</Label>
                    <Input
                      id="publishDate"
                      type="date"
                      value={formData.publishDate || ""}
                      onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="publisher">Publisher</Label>
                    <Input
                      id="publisher"
                      value={formData.publisher || ""}
                      onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="total">Total Copies *</Label>
                    <Input
                      id="total"
                      type="number"
                      min="1"
                      value={formData.total}
                      onChange={(e) => setFormData({ ...formData, total: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="language">Language</Label>
                    <div className="relative">
                      <Input
                        id="language"
                        value={languageSearch}
                        onChange={(e) => {
                          setLanguageSearch(e.target.value);
                          setShowLanguageList(true);
                        }}
                        onFocus={() => setShowLanguageList(true)}
                        onBlur={() => setTimeout(() => setShowLanguageList(false), 200)}
                        placeholder="Search language..."
                        className="w-full"
                      />
                      {showLanguageList && filteredLanguages.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                          {filteredLanguages.map(lang => (
                            <div
                              key={lang}
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                              onClick={() => {
                                setFormData({ ...formData, language: lang });
                                setLanguageSearch(lang);
                                setShowLanguageList(false);
                              }}
                            >
                              {lang}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="imageUrl">Cover Image URL</Label>
                    <Input
                      id="imageUrl"
                      value={formData.imageUrl}
                      onChange={handleImageUrlChange}
                      placeholder="Paste image URL here"
                    />
                  </div>
                  <div className="flex flex-col items-center justify-center min-h-[120px]">
                    <div className="relative w-24 h-36 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden mb-2">
                      {formData.imageUrl ? (
                        <>
                          <img
                            src={formData.imageUrl}
                            alt="Book cover preview"
                            className="w-full h-full object-cover rounded-lg shadow-md"
                          />
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, imageUrl: "" }))}
                            className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md hover:scale-110 transition-all duration-200"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </>
                      ) : (
                        <BookOpen className="w-10 h-10 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="summary">Summary</Label>
                  <textarea
                    id="summary"
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 h-24"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : mode === "edit" ? "Save" : "Add Book"}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
