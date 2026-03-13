import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpenIcon, ClipboardListIcon, ClockIcon, UserIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface Stats {
  borrowed: number;
  dueSoon: number;
  fines: number;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ borrowed: 0, dueSoon: 0, fines: 0 });

  // Cast to any to avoid deep TS generic instantiation issues
  const sb: any = supabase;

  useEffect(() => {
    if (!user) return;
    async function loadStats() {
      // Total borrowed books
      const { data: borrowedRows } = await sb
        .from("borrowings")
        .select("id")
        .eq("user_id", user.id)
        .eq("collected", true);
      const borrowed = borrowedRows?.length ?? 0;

      // Books due within next 3 days
      const now = new Date();
      const inThree = new Date(now);
      inThree.setDate(now.getDate() + 3);
      const { data: soonRows } = await sb
        .from("borrowings")
        .select("id")
        .eq("user_id", user.id)
        .eq("collected", true)
        .lte("due_date", inThree.toISOString());
      const dueSoon = soonRows?.length ?? 0;

      // Outstanding fines from borrowings penalties field
      const { data: penaltyRows } = await sb
        .from("borrowings")
        .select("penalty")
        .eq("user_id", user.id);
      const fines = penaltyRows?.reduce((sum: number, r: any) => sum + (r.penalty || 0), 0) ?? 0;

      setStats({ borrowed, dueSoon, fines });
    }
    loadStats();
  }, [user]);

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold">Student Dashboard</h1>
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <p>Total Borrowed</p>
          <h2 className="text-xl font-semibold">{stats.borrowed}</h2>
        </Card>
        <Card>
          <p>Due Soon</p>
          <h2 className="text-xl font-semibold">{stats.dueSoon}</h2>
        </Card>
        <Card>
          <p>Fines</p>
          <h2 className="text-xl font-semibold">₹{stats.fines}</h2>
        </Card>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Link to="/borrowed-books">
          <Button className="w-full" variant="outline">
            <ClipboardListIcon className="mr-2" /> My Borrowed Books
          </Button>
        </Link>
        <Link to="/student/requests">
          <Button className="w-full" variant="outline">
            <ClockIcon className="mr-2" /> My Requests
          </Button>
        </Link>
        <Link to="/student/profile">
          <Button className="w-full" variant="outline">
            <UserIcon className="mr-2" /> Profile
          </Button>
        </Link>
      </div>
    </div>
  );
} 