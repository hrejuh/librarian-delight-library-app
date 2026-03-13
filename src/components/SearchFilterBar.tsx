import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { bookGenres } from "@/lib/mock-data";
import { useAuth } from "@/contexts/AuthContext";

export interface SearchFilterBarProps {
  type: "books" | "borrowed";
  onSearch: (filters: {
    searchQuery: string;
    statusFilter: string;
    genreFilter: string;
    sortBy: string;
  }) => void;
}

const SearchFilterBar = ({ type, onSearch }: SearchFilterBarProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [genreFilter, setGenreFilter] = useState("all");
  const [sortBy, setSortBy] = useState(
    type === "books" ? "title_asc" : "due_date_asc"
  );
  const { profile } = useAuth();
  
  // Check if user has librarian, admin or super_admin privileges
  const hasStaffPermissions = profile?.role === "librarian" || profile?.role === "admin" || profile?.role === "super_admin";

  useEffect(() => {
    // Initial search on component mount
    handleApplyFilters();
  }, []);

  const handleApplyFilters = () => {
    console.log("Applying filters:", {
      searchQuery,
      statusFilter,
      genreFilter,
      sortBy,
    });
    onSearch({
      searchQuery,
      statusFilter,
      genreFilter,
      sortBy,
    });
  };

  // Add effect to apply filters when they change
  useEffect(() => {
    handleApplyFilters();
  }, [searchQuery, statusFilter, genreFilter, sortBy]);

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <Input
            type="text"
            placeholder={
              type === "books" ? "Search books..." : "Search borrowed books..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>

        {hasStaffPermissions && type === "books" && (
          <div>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Available">Available</SelectItem>
                <SelectItem value="Borrowed">Borrowed</SelectItem>
                <SelectItem value="Reserved">Reserved</SelectItem>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
                <SelectItem value="Lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {type === "borrowed" && (
          <div>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="due_soon">Due Soon (3 days)</SelectItem>
                <SelectItem value="not_due">Not Due</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {type === "books" && (
          <div>
            <Select
              value={genreFilter}
              onValueChange={(value) => {
                setGenreFilter(value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Genre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genres</SelectItem>
                {bookGenres.map((genre) => (
                  <SelectItem key={genre} value={genre.toLowerCase()}>
                    {genre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              {type === "books" && hasStaffPermissions ? (
                <>
                  <SelectItem value="title_asc">Title (A-Z)</SelectItem>
                  <SelectItem value="price_asc">Price (Low to High)</SelectItem>
                  <SelectItem value="price_desc">Price (High to Low)</SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value="title_asc">Title (A-Z)</SelectItem>
                  <SelectItem value="due_date_asc">Due Date (Soonest First)</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button onClick={handleApplyFilters} className="bg-library-primary hover:bg-blue-700">
          Apply Filters
        </Button>
      </div>
    </div>
  );
};

export default SearchFilterBar;
