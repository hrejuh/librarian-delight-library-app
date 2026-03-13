import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function Fines() {
  const { profile, isStudent } = useAuth();
  const { toast } = useToast();

  const fines = useQuery(
    isStudent ? api.fines.listByUser : api.fines.listByInstitution,
    profile
      ? isStudent
        ? { userId: profile.userId }
        : profile.institutionId
          ? { institutionId: profile.institutionId }
          : "skip"
      : "skip",
  );

  const payFine = useMutation(api.fines.payFine);
  const waiveFine = useMutation(api.fines.waiveFine);

  const handlePayFull = async (fineId: string, amount: number) => {
    try {
      await payFine({ fineId: fineId as any, amount });
      toast({ title: "Fine marked as paid" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleWaive = async (fineId: string) => {
    try {
      await waiveFine({ fineId: fineId as any });
      toast({ title: "Fine waived" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "default";
      case "waived":
        return "secondary";
      case "partial":
        return "outline";
      default:
        return "destructive";
    }
  };

  const totalUnpaid = (fines ?? [])
    .filter((f) => f.status === "unpaid" || f.status === "partial")
    .reduce((sum, f) => sum + (f.amount - f.paidAmount), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          {isStudent ? "My Fines" : "Fine Management"}
        </h1>
        {totalUnpaid > 0 && (
          <Badge variant="destructive" className="text-sm px-3 py-1">
            Outstanding: ${totalUnpaid.toFixed(2)}
          </Badge>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {!isStudent && <TableHead>User</TableHead>}
                <TableHead>Book</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                {!isStudent && (
                  <TableHead className="text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {(fines ?? []).length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isStudent ? 6 : 8}
                    className="text-center text-muted-foreground py-8"
                  >
                    No fines found
                  </TableCell>
                </TableRow>
              ) : (
                (fines ?? []).map((fine) => (
                  <TableRow key={fine._id}>
                    {!isStudent && (
                      <TableCell>{(fine as any).userName ?? "Unknown"}</TableCell>
                    )}
                    <TableCell className="font-medium">
                      {(fine as any).bookTitle ?? "Unknown"}
                    </TableCell>
                    <TableCell className="capitalize">{fine.reason}</TableCell>
                    <TableCell>${fine.amount.toFixed(2)}</TableCell>
                    <TableCell>${fine.paidAmount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={statusColor(fine.status) as any}>
                        {fine.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(fine.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    {!isStudent && (
                      <TableCell className="text-right space-x-1">
                        {(fine.status === "unpaid" || fine.status === "partial") && (
                          <>
                            <Button
                              size="sm"
                              onClick={() =>
                                handlePayFull(
                                  fine._id,
                                  fine.amount - fine.paidAmount,
                                )
                              }
                            >
                              Pay Full
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleWaive(fine._id)}
                            >
                              Waive
                            </Button>
                          </>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
