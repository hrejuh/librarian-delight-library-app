import { useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  AlertTriangle,
  DollarSign,
  Users,
  Building2,
  ArrowLeftRight,
  Clock,
  TrendingUp,
} from "lucide-react";

function StatCard({
  title,
  value,
  icon: Icon,
  variant = "default",
  onClick,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  variant?: "default" | "warning" | "danger";
  onClick?: () => void;
}) {
  const iconBg =
    variant === "danger"
      ? "bg-red-100 text-red-600"
      : variant === "warning"
        ? "bg-amber-100 text-amber-600"
        : "bg-primary/10 text-primary";

  return (
    <Card
      className={onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}
      onClick={onClick}
    >
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

function SuperAdminDashboard() {
  const navigate = useNavigate();
  const metrics = useQuery(api.dashboard.getMetrics, {});

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Institutions"
          value={metrics?.totalInstitutions ?? 0}
          icon={Building2}
          onClick={() => navigate("/institutions")}
        />
        <StatCard
          title="Total Users"
          value={metrics?.totalUsers ?? 0}
          icon={Users}
          onClick={() => navigate("/users")}
        />
        <StatCard
          title="Librarians"
          value={metrics?.totalLibrarians ?? 0}
          icon={Users}
        />
        <StatCard
          title="Students"
          value={metrics?.totalStudents ?? 0}
          icon={Users}
        />
      </div>
    </div>
  );
}

function StaffDashboard({ role }: { role: "admin" | "librarian" }) {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const metrics = useQuery(
    api.dashboard.getMetrics,
    profile?.institutionId
      ? { institutionId: profile.institutionId }
      : "skip",
  );

  const institution = useQuery(
    api.institutions.getById,
    profile?.institutionId ? { id: profile.institutionId } : "skip",
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        {institution && (
          <p className="text-muted-foreground text-sm">{institution.name}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Books"
          value={metrics?.totalBooks ?? 0}
          icon={BookOpen}
          onClick={() => navigate("/books")}
        />
        <StatCard
          title="Borrowed"
          value={metrics?.borrowedBooks ?? 0}
          icon={ArrowLeftRight}
          onClick={() => navigate("/circulation")}
        />
        <StatCard
          title="Overdue"
          value={metrics?.overdueBooks ?? 0}
          icon={AlertTriangle}
          variant="danger"
          onClick={() => navigate("/circulation")}
        />
        <StatCard
          title="Pending Requests"
          value={metrics?.pendingRequests ?? 0}
          icon={Clock}
          variant="warning"
          onClick={() => navigate("/circulation")}
        />
        <StatCard
          title="Total Fines"
          value={`$${(metrics?.totalPenalties ?? 0).toFixed(2)}`}
          icon={DollarSign}
          onClick={() => navigate("/fines")}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button onClick={() => navigate("/books")}>Manage Books</Button>
            <Button variant="outline" onClick={() => navigate("/circulation")}>
              Circulation
            </Button>
            {role === "admin" && (
              <Button variant="outline" onClick={() => navigate("/users")}>
                Manage Users
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StudentDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const stats = useQuery(
    api.dashboard.getStudentStats,
    profile?.userId ? { userId: profile.userId } : "skip",
  );

  const institution = useQuery(
    api.institutions.getById,
    profile?.institutionId ? { id: profile.institutionId } : "skip",
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        {institution && (
          <p className="text-muted-foreground text-sm">{institution.name}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Books Borrowed"
          value={stats?.totalBorrowed ?? 0}
          icon={BookOpen}
          onClick={() => navigate("/circulation")}
        />
        <StatCard
          title="Due Soon"
          value={stats?.dueSoon ?? 0}
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="Fines"
          value={`$${(stats?.totalFines ?? 0).toFixed(2)}`}
          icon={DollarSign}
          variant={stats?.totalFines ? "danger" : "default"}
          onClick={() => navigate("/fines")}
        />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Browse the catalog to find and borrow books.
            </p>
            <div className="flex justify-center gap-3">
              <Button onClick={() => navigate("/books")}>Browse Books</Button>
              <Button variant="outline" onClick={() => navigate("/circulation")}>
                My Borrowings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Dashboard() {
  const { profile, isSuperAdmin, isAdmin, isLibrarian } = useAuth();

  if (!profile) return null;

  if (isSuperAdmin) return <SuperAdminDashboard />;
  if (isAdmin) return <StaffDashboard role="admin" />;
  if (isLibrarian) return <StaffDashboard role="librarian" />;
  return <StudentDashboard />;
}
