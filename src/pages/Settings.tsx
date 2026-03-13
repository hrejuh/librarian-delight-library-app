import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Settings as SettingsIcon,
  Clock,
  BookOpen,
  DollarSign,
  Save,
  Building2,
} from "lucide-react";

const PATRON_TYPES = [
  { key: "student", label: "Student" },
  { key: "faculty", label: "Faculty" },
  { key: "walk_in", label: "Walk-in" },
];

function CirculationRuleCard({
  patronType,
  label,
  institutionId,
}: {
  patronType: string;
  label: string;
  institutionId: string;
}) {
  const { toast } = useToast();
  const rule = useQuery(
    api.circulationRules.getByPatronType,
    { institutionId: institutionId as any, patronType },
  );
  const upsertRule = useMutation(api.circulationRules.upsert);

  const [maxBooks, setMaxBooks] = useState(5);
  const [loanDurationDays, setLoanDurationDays] = useState(14);
  const [reserveDurationDays, setReserveDurationDays] = useState(3);
  const [maxRenewals, setMaxRenewals] = useState(2);
  const [finePerDay, setFinePerDay] = useState(0.5);
  const [maxConcurrentHolds, setMaxConcurrentHolds] = useState(3);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (rule) {
      setMaxBooks(rule.maxBooks);
      setLoanDurationDays(rule.loanDurationDays);
      setReserveDurationDays(rule.reserveDurationDays);
      setMaxRenewals(rule.maxRenewals);
      setFinePerDay(rule.finePerDay);
      setMaxConcurrentHolds(rule.maxConcurrentHolds);
    }
  }, [rule]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await upsertRule({
        institutionId: institutionId as any,
        patronType,
        maxBooks,
        loanDurationDays,
        reserveDurationDays,
        maxRenewals,
        finePerDay,
        maxConcurrentHolds,
      });
      toast({ title: "Rules saved", description: `Updated rules for ${label}` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{label}</CardTitle>
          <Badge variant={rule ? "secondary" : "outline"}>
            {rule ? "Configured" : "Default"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Max Books</Label>
            <Input
              type="number"
              min={1}
              value={maxBooks}
              onChange={(e) => setMaxBooks(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Loan Duration (days)</Label>
            <Input
              type="number"
              min={1}
              value={loanDurationDays}
              onChange={(e) => setLoanDurationDays(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Reserve Duration (days)</Label>
            <Input
              type="number"
              min={1}
              value={reserveDurationDays}
              onChange={(e) => setReserveDurationDays(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Max Renewals</Label>
            <Input
              type="number"
              min={0}
              value={maxRenewals}
              onChange={(e) => setMaxRenewals(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Fine Per Day ($)</Label>
            <Input
              type="number"
              min={0}
              step={0.25}
              value={finePerDay}
              onChange={(e) => setFinePerDay(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Max Concurrent Holds</Label>
            <Input
              type="number"
              min={0}
              value={maxConcurrentHolds}
              onChange={(e) => setMaxConcurrentHolds(Number(e.target.value))}
            />
          </div>
        </div>
        <Button size="sm" onClick={handleSave} disabled={saving} className="w-full">
          <Save className="h-3.5 w-3.5 mr-1" />
          {saving ? "Saving..." : "Save Rules"}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function Settings() {
  const { profile, isAdmin, isSuperAdmin } = useAuth();
  const { toast } = useToast();

  const institution = useQuery(
    api.institutions.getById,
    profile?.institutionId ? { id: profile.institutionId } : "skip",
  );

  const updateInstitution = useMutation(api.institutions.update);

  const [openTime, setOpenTime] = useState("");
  const [closeTime, setCloseTime] = useState("");
  const [rules, setRules] = useState("");
  const [savingInst, setSavingInst] = useState(false);

  useEffect(() => {
    if (institution) {
      setOpenTime(institution.openTime ?? "");
      setCloseTime(institution.closeTime ?? "");
      setRules(institution.rules ?? "");
    }
  }, [institution]);

  const handleSaveInstitution = async () => {
    if (!profile?.institutionId) return;
    setSavingInst(true);
    try {
      await updateInstitution({
        id: profile.institutionId,
        openTime: openTime || undefined,
        closeTime: closeTime || undefined,
        rules: rules || undefined,
      });
      toast({ title: "Institution settings saved" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSavingInst(false);
    }
  };

  if (!profile?.institutionId) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <SettingsIcon className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium">No institution selected</p>
            <p className="text-sm">Settings are managed per institution.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      {/* Institution Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">Institution</CardTitle>
              <CardDescription>{institution?.name}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Opening Time
              </Label>
              <Input
                type="time"
                value={openTime}
                onChange={(e) => setOpenTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Closing Time
              </Label>
              <Input
                type="time"
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Library Rules & Policies</Label>
            <Textarea
              placeholder="Enter library rules and policies..."
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              rows={4}
            />
          </div>
          <Button onClick={handleSaveInstitution} disabled={savingInst}>
            <Save className="h-4 w-4 mr-1" />
            {savingInst ? "Saving..." : "Save Institution Settings"}
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Circulation Rules */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-lg font-semibold">Circulation Rules</h2>
            <p className="text-sm text-muted-foreground">
              Configure borrowing limits, loan durations, and fines per patron type.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PATRON_TYPES.map((pt) => (
            <CirculationRuleCard
              key={pt.key}
              patronType={pt.key}
              label={pt.label}
              institutionId={profile.institutionId!}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
