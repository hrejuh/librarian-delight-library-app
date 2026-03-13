import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Users,
  ArrowLeftRight,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Clock,
  BarChart3,
} from "lucide-react";
import { format } from "date-fns";

function StatCard({
  title,
  value,
  icon: Icon,
  variant = "default",
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  variant?: "default" | "warning" | "danger";
}) {
  const iconBg =
    variant === "danger"
      ? "bg-red-100 text-red-600"
      : variant === "warning"
        ? "bg-amber-100 text-amber-600"
        : "bg-primary/10 text-primary";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg ${iconBg}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

export default function Reports() {
  const { profile } = useAuth();

  const metrics = useQuery(
    api.dashboard.getMetrics,
    profile?.institutionId
      ? { institutionId: profile.institutionId }
      : "skip",
  );

  const borrowings = useQuery(
    api.borrowings.listByInstitution,
    profile?.institutionId
      ? { institutionId: profile.institutionId }
      : "skip",
  );

  const fines = useQuery(
    api.fines.listByInstitution,
    profile?.institutionId
      ? { institutionId: profile.institutionId }
      : "skip",
  );

  const books = useQuery(
    api.books.listByInstitution,
    profile?.institutionId
      ? { institutionId: profile.institutionId, paginationOpts: { numItems: 100, cursor: null } }
      : "skip",
  );

  const now = Date.now();
  const activeBorrowings = (borrowings ?? []).filter(
    (b) => b.status === "active" || b.status === "overdue",
  );
  const overdueBorrowings = activeBorrowings.filter((b) => b.dueDate < now);
  const returnedBorrowings = (borrowings ?? []).filter((b) => b.status === "returned");

  // Genre distribution
  const genreCounts: Record<string, number> = {};
  (books?.page ?? []).forEach((book) => {
    (book.genres ?? []).forEach((g: string) => {
      genreCounts[g] = (genreCounts[g] || 0) + 1;
    });
  });
  const sortedGenres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]);

  // Most borrowed (by counting borrowings per book title)
  const bookBorrowCounts: Record<string, number> = {};
  (borrowings ?? []).forEach((b) => {
    const title = b.book?.title ?? "Unknown";
    bookBorrowCounts[title] = (bookBorrowCounts[title] || 0) + 1;
  });
  const popularBooks = Object.entries(bookBorrowCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

  // Fine statistics
  const totalFineAmount = (fines ?? []).reduce((sum, f) => sum + f.amount, 0);
  const totalPaid = (fines ?? []).reduce((sum, f) => sum + f.paidAmount, 0);
  const unpaidFines = (fines ?? []).filter(
    (f) => f.status === "unpaid" || f.status === "partial",
  );

  if (!profile?.institutionId) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Reports</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium">No institution selected</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Reports</h1>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          title="Total Books"
          value={metrics?.totalBooks ?? 0}
          icon={BookOpen}
        />
        <StatCard
          title="Borrowed"
          value={metrics?.borrowedBooks ?? 0}
          icon={ArrowLeftRight}
        />
        <StatCard
          title="Overdue"
          value={metrics?.overdueBooks ?? 0}
          icon={AlertTriangle}
          variant="danger"
        />
        <StatCard
          title="Pending"
          value={metrics?.pendingRequests ?? 0}
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="Total Fines"
          value={`$${totalFineAmount.toFixed(2)}`}
          icon={DollarSign}
        />
        <StatCard
          title="Collected"
          value={`$${totalPaid.toFixed(2)}`}
          icon={TrendingUp}
        />
      </div>

      <Tabs defaultValue="collection">
        <TabsList>
          <TabsTrigger value="collection">Collection</TabsTrigger>
          <TabsTrigger value="circulation">Circulation</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="fines">Fines</TabsTrigger>
        </TabsList>

        {/* Collection Tab */}
        <TabsContent value="collection" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Genre Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {sortedGenres.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4 text-center">No genre data available</p>
                ) : (
                  <div className="space-y-2">
                    {sortedGenres.map(([genre, count]) => {
                      const maxCount = sortedGenres[0][1];
                      const pct = Math.round((count / maxCount) * 100);
                      return (
                        <div key={genre} className="flex items-center gap-3">
                          <span className="text-sm w-28 truncate text-muted-foreground">{genre}</span>
                          <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary/70 rounded-full flex items-center pl-2"
                              style={{ width: `${Math.max(pct, 10)}%` }}
                            >
                              <span className="text-xs font-medium text-primary-foreground">{count}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Most Borrowed Books</CardTitle>
              </CardHeader>
              <CardContent>
                {popularBooks.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4 text-center">No borrowing data yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Book</TableHead>
                        <TableHead className="text-right">Times Borrowed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {popularBooks.map(([title, count], i) => (
                        <TableRow key={title}>
                          <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                          <TableCell className="font-medium">{title}</TableCell>
                          <TableCell className="text-right">{count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Circulation Tab */}
        <TabsContent value="circulation" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Borrowings</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book</TableHead>
                    <TableHead>Borrower</TableHead>
                    <TableHead>Borrowed</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(borrowings ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No borrowings yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    (borrowings ?? []).slice(0, 20).map((b) => (
                      <TableRow key={b._id}>
                        <TableCell className="font-medium">{b.book?.title ?? "Unknown"}</TableCell>
                        <TableCell>{b.borrowerName ?? "Unknown"}</TableCell>
                        <TableCell>{format(new Date(b.borrowDate), "MMM d, yyyy")}</TableCell>
                        <TableCell>{format(new Date(b.dueDate), "MMM d, yyyy")}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              b.status === "returned"
                                ? "secondary"
                                : b.dueDate < now
                                  ? "destructive"
                                  : "default"
                            }
                          >
                            {b.dueDate < now && b.status !== "returned" ? "Overdue" : b.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overdue Tab */}
        <TabsContent value="overdue" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Currently Overdue ({overdueBorrowings.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book</TableHead>
                    <TableHead>Borrower</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Days Overdue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overdueBorrowings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No overdue items
                      </TableCell>
                    </TableRow>
                  ) : (
                    overdueBorrowings.map((b) => {
                      const daysOverdue = Math.ceil((now - b.dueDate) / (1000 * 60 * 60 * 24));
                      return (
                        <TableRow key={b._id}>
                          <TableCell className="font-medium">{b.book?.title ?? "Unknown"}</TableCell>
                          <TableCell>{b.borrowerName ?? "Unknown"}</TableCell>
                          <TableCell>{format(new Date(b.dueDate), "MMM d, yyyy")}</TableCell>
                          <TableCell>
                            <Badge variant="destructive">{daysOverdue} days</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fines Tab */}
        <TabsContent value="fines" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Fines Issued</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalFineAmount.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">{(fines ?? []).length} fines total</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Collected</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">${totalPaid.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  ${(totalFineAmount - totalPaid).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">{unpaidFines.length} unpaid</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Fines</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Book</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(fines ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No fines recorded
                      </TableCell>
                    </TableRow>
                  ) : (
                    (fines ?? []).slice(0, 20).map((fine) => (
                      <TableRow key={fine._id}>
                        <TableCell>{(fine as any).userName ?? "Unknown"}</TableCell>
                        <TableCell className="font-medium">{(fine as any).bookTitle ?? "Unknown"}</TableCell>
                        <TableCell className="capitalize">{fine.reason}</TableCell>
                        <TableCell>${fine.amount.toFixed(2)}</TableCell>
                        <TableCell>${fine.paidAmount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              fine.status === "paid"
                                ? "secondary"
                                : fine.status === "waived"
                                  ? "outline"
                                  : "destructive"
                            }
                          >
                            {fine.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
