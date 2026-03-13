import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Search, Check, X, RotateCcw, ArrowDownUp } from "lucide-react";
import { format } from "date-fns";

export default function Circulation() {
  const { profile, isStudent, isLibrarian, isAdmin, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const isStaff = isLibrarian || isAdmin || isSuperAdmin;

  const borrowings = useQuery(
    api.borrowings.listForBorrowedBooksPage,
    profile
      ? {
          userId: profile.userId,
          role: profile.role,
          institutionId: profile.institutionId ?? undefined,
        }
      : "skip",
  );

  const requests = useQuery(
    api.requests.listByInstitution,
    isStaff && profile?.institutionId
      ? { institutionId: profile.institutionId }
      : "skip",
  );

  const myRequests = useQuery(
    api.requests.listByUser,
    isStudent && profile ? { userId: profile.userId } : "skip",
  );

  const approveRequest = useMutation(api.borrowings.handleRequestApproval);
  const rejectRequest = useMutation(api.borrowings.rejectRequest);
  const returnBook = useMutation(api.borrowings.returnBook);
  const renewBook = useMutation(api.borrowings.renewBook);

  const handleApprove = async (requestId: string) => {
    try {
      await approveRequest({ requestId: requestId as any });
      toast({ title: "Request approved" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await rejectRequest({ requestId: requestId as any });
      toast({ title: "Request rejected" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleReturn = async (borrowingId: string) => {
    try {
      const result = await returnBook({ borrowingId: borrowingId as any });
      toast({
        title: "Book returned",
        description:
          result.penalty > 0 ? `Fine: $${result.penalty.toFixed(2)}` : undefined,
      });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleRenew = async (borrowingId: string) => {
    try {
      await renewBook({ borrowingId: borrowingId as any });
      toast({ title: "Book renewed successfully" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const formatDate = (ts: number) => format(new Date(ts), "MMM d, yyyy");

  const activeBorrowings = (borrowings ?? []).filter(
    (b) => b.status === "active" || b.status === "overdue",
  );
  const returnedBorrowings = (borrowings ?? []).filter(
    (b) => b.status === "returned",
  );
  const pendingRequests = (isStaff ? requests : myRequests)?.filter(
    (r) => r.status === "pending",
  ) ?? [];
  const processedRequests = (isStaff ? requests : myRequests)?.filter(
    (r) => r.status !== "pending",
  ) ?? [];

  const filterItems = <T extends { book?: { title?: string } | null }>(
    items: T[],
  ) => {
    if (!searchTerm) return items;
    const term = searchTerm.toLowerCase();
    return items.filter((item) =>
      item.book?.title?.toLowerCase().includes(term),
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          {isStudent ? "My Borrowings" : "Circulation"}
        </h1>
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search books..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">
            Active ({activeBorrowings.length})
          </TabsTrigger>
          <TabsTrigger value="requests">
            Requests ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book</TableHead>
                    {isStaff && <TableHead>Borrower</TableHead>}
                    <TableHead>Borrowed</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filterItems(activeBorrowings).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isStaff ? 6 : 5} className="text-center text-muted-foreground py-8">
                        No active borrowings
                      </TableCell>
                    </TableRow>
                  ) : (
                    filterItems(activeBorrowings).map((b) => (
                      <TableRow key={b._id}>
                        <TableCell className="font-medium">
                          {b.book?.title ?? "Unknown"}
                        </TableCell>
                        {isStaff && (
                          <TableCell>{b.borrowerName}</TableCell>
                        )}
                        <TableCell>{formatDate(b.borrowDate)}</TableCell>
                        <TableCell>{formatDate(b.dueDate)}</TableCell>
                        <TableCell>
                          {b.dueDate < Date.now() ? (
                            <Badge variant="destructive">Overdue</Badge>
                          ) : (
                            <Badge variant="secondary">Active</Badge>
                          )}
                          {b.renewCount > 0 && (
                            <Badge variant="outline" className="ml-1">
                              Renewed {b.renewCount}x
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          {isStaff && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReturn(b._id)}
                            >
                              <ArrowDownUp className="h-3.5 w-3.5 mr-1" />
                              Return
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRenew(b._id)}
                          >
                            <RotateCcw className="h-3.5 w-3.5 mr-1" />
                            Renew
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book</TableHead>
                    {isStaff && <TableHead>Requester</TableHead>}
                    <TableHead>Date</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Status</TableHead>
                    {isStaff && (
                      <TableHead className="text-right">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isStaff ? 6 : 5} className="text-center text-muted-foreground py-8">
                        No pending requests
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingRequests.map((r) => (
                      <TableRow key={r._id}>
                        <TableCell className="font-medium">
                          {r.book?.title ?? "Unknown"}
                        </TableCell>
                        {isStaff && (
                          <TableCell>{(r as any).userName ?? "Unknown"}</TableCell>
                        )}
                        <TableCell>{formatDate(r.requestDate)}</TableCell>
                        <TableCell>{formatDate(r.expirationDate)}</TableCell>
                        <TableCell>
                          <Badge>Pending</Badge>
                        </TableCell>
                        {isStaff && (
                          <TableCell className="text-right space-x-1">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(r._id)}
                            >
                              <Check className="h-3.5 w-3.5 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(r._id)}
                            >
                              <X className="h-3.5 w-3.5 mr-1" />
                              Reject
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book</TableHead>
                    {isStaff && <TableHead>Borrower</TableHead>}
                    <TableHead>Borrowed</TableHead>
                    <TableHead>Returned</TableHead>
                    <TableHead>Fine</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filterItems(returnedBorrowings).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isStaff ? 5 : 4} className="text-center text-muted-foreground py-8">
                        No history yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    filterItems(returnedBorrowings).map((b) => (
                      <TableRow key={b._id}>
                        <TableCell className="font-medium">
                          {b.book?.title ?? "Unknown"}
                        </TableCell>
                        {isStaff && (
                          <TableCell>{b.borrowerName}</TableCell>
                        )}
                        <TableCell>{formatDate(b.borrowDate)}</TableCell>
                        <TableCell>
                          {b.returnDate ? formatDate(b.returnDate) : "-"}
                        </TableCell>
                        <TableCell>
                          {b.penalty > 0 ? `$${b.penalty.toFixed(2)}` : "-"}
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
