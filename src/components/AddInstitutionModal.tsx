import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Mail, Phone, Clock, BookOpen, Users, AlertCircle, Lock, Calendar, Sun, Moon, MapPin, User, Shield, Trash2, PlusCircle, X } from "lucide-react";
import { Institution, ACCESS_LEVELS, Json } from "@/lib/data-types";
import { OrganizationStructure } from "@/lib/data-types";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { TimePicker } from "@/components/ui/time-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast as sonnerToast } from "@/components/ui/sonner";
import { Building2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";

interface Level4UserConfig {
  id: string;
  name: string;
  max_books: number;
  loan_duration: number;
  reservation_duration: number;
  fine_per_day: number;
}

interface LibraryFormData {
  id: string;
  name: string;
  address: string;
}

interface OrganizationStructureLocal {
  level3: {
    level3_role_names: string[];
    libraries: LibraryFormData[];
  };
  level4: {
    configs: Level4UserConfig[];
  };
  resource_types: string[];
}

interface InstitutionData {
  id: string;
  name: string;
  address: string;
  adminName: string;
  adminEmail: string;
  contactPhone?: string;
  organizationStructure: {
    level3: {
      libraries: Array<{ id?: string; name: string; address: string; is_default: boolean; }>;
      level3_role_names: string[];
    };
    level4: {
      configs: Level4UserConfig[];
    };
    resource_types: string[];
  };
}

interface AddInstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  institution?: Institution | null;
}

const DEFAULT_ORGANIZATION_STRUCTURE = {
  access_levels: ACCESS_LEVELS,
  default_limits: {
    SUPER_ADMIN: { max_books: 10, max_days: 30, max_reservations: 5, fine_per_day: 0, concurrent_borrows: 10 },
    INSTITUTION_ADMIN: { max_books: 8, max_days: 21, max_reservations: 4, fine_per_day: 0, concurrent_borrows: 8 },
    LIBRARY_MANAGER: { max_books: 6, max_days: 14, max_reservations: 3, fine_per_day: 0, concurrent_borrows: 6 },
    USER: { max_books: 3, max_days: 7, max_reservations: 2, fine_per_day: 50, concurrent_borrows: 3 }
  }
};

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const ACCESS_LEVEL_DESCRIPTIONS = {
  SUPER_ADMIN: "Full system access and management capabilities",
  INSTITUTION_ADMIN: "Institution-level management and configuration",
  LIBRARY_MANAGER: "Library-level operations and user management",
  USER: "Basic user access with borrowing privileges"
};

const formSchema = z.object({
  // Basic Information
  name: z.string().min(1, "Institution Name is required"),
  address: z.string().min(1, "Address is required"),
  admin_name: z.string().min(1, "Admin Name is required"),
  admin_email: z.string().email("Invalid email address").min(1, "Admin Email is required"),
  admin_password: z.string().min(8, "Password must be at least 8 characters").optional(),
  contact_phone: z.string().optional().or(z.literal('')),

  // Level 3 Configuration
  level3_role_names: z.array(z.string().min(1)).min(1, "At least one Level 3 role is required.").optional().default(["Librarian", "Manager"]),

  // Resource Types
  resource_types: z.array(z.string().min(1)).min(1, "At least one resource type is required.").optional().default(["Books", "Articles", "Magazines", "CDs", "Question Banks"]),

  // Level 4 Configuration
  level4_configs: z.array(z.object({
    id: z.string(),
    name: z.string().min(1, "Configuration name is required"),
    max_books: z.number().min(0, "Max books must be non-negative"),
    loan_duration: z.number().min(1, "Loan duration must be at least 1 day"),
    reservation_duration: z.number().min(1, "Reservation duration must be at least 1 day"),
    fine_per_day: z.number().min(0, "Fine must be non-negative"),
  })).optional().default([
    { id: crypto.randomUUID(), name: "Students", max_books: 5, loan_duration: 14, reservation_duration: 7, fine_per_day: 1.00 },
    { id: crypto.randomUUID(), name: "Faculty", max_books: 10, loan_duration: 30, reservation_duration: 14, fine_per_day: 0.50 },
  ]),
});

type FormData = z.infer<typeof formSchema>;

const createDefaultLevel4Configs = (): Level4UserConfig[] => [
  { id: crypto.randomUUID(), name: "Students", max_books: 5, loan_duration: 14, reservation_duration: 7, fine_per_day: 1.00 },
  { id: crypto.randomUUID(), name: "Faculty", max_books: 10, loan_duration: 30, reservation_duration: 14, fine_per_day: 0.50 },
  { id: crypto.randomUUID(), name: "Graduate Students", max_books: 8, loan_duration: 21, reservation_duration: 10, fine_per_day: 0.75 },
  { id: crypto.randomUUID(), name: "Patrons", max_books: 3, loan_duration: 7, reservation_duration: 3, fine_per_day: 2.00 },
];

const getInitialFormValues = (institution: Institution | null): FormData => {
  if (institution) {
    return {
      name: institution.name,
      address: institution.address,
      admin_name: institution.adminName,
      admin_email: institution.adminEmail,
      contact_phone: institution.contactPhone || "",
      level3_role_names: institution.organizationStructure?.level3?.level3_role_names || ["Librarian", "Manager"],
      resource_types: institution.organizationStructure?.resource_types || ["Books", "Articles", "Magazines", "CDs", "Question Banks"],
      level4_configs: institution.organizationStructure?.level4?.configs && institution.organizationStructure.level4.configs.length > 0
        ? institution.organizationStructure.level4.configs.map(config => ({
            id: config.id || crypto.randomUUID(),
            name: config.name,
            max_books: config.max_books,
            loan_duration: config.loan_duration,
            reservation_duration: config.reservation_duration,
            fine_per_day: config.fine_per_day,
          }))
        : createDefaultLevel4Configs(),
    };
  }
  return {
    name: "",
    address: "",
    admin_name: "",
    admin_email: "",
    admin_password: "",
    contact_phone: "",
    level3_role_names: ["Librarian", "Manager"],
    resource_types: ["Books", "Articles", "Magazines", "CDs", "Question Banks"],
    level4_configs: createDefaultLevel4Configs(),
  };
};

export function AddInstitutionModal({ isOpen, onClose, onSuccess, institution }: AddInstitutionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { profile } = useAuth();
  const [customRoleInput, setCustomRoleInput] = useState("");
  const [customResourceInput, setCustomResourceInput] = useState("");

  const createInstitution = useAction(api.institutionActions.createWithAdmin);
  const updateInstitution = useMutation(api.institutions.update);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: getInitialFormValues(institution),
  });

  // Reset form when institution changes
  useEffect(() => {
    if (institution) {
      form.reset(getInitialFormValues(institution));
    }
  }, [institution, form]);

  // Watch institution name and address
  const institutionName = form.watch("name");
  const institutionAddress = form.watch("address");
  const currentRoles = form.watch("level3_role_names");

  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("basic");
  const [maxValidatedStep, setMaxValidatedStep] = useState(-1);
  const TABS = ["basic", "level4"];

  const { fields: level4Fields, append: appendLevel4Config, remove: removeLevel4Config } = useFieldArray({
    control: form.control,
    name: "level4_configs",
  });

  const validateForm = () => {
    const isValid = form.formState.isValid;
    const errors = form.formState.errors;

    if (!isValid) {
      const errorMessages = Object.entries(errors)
        .map(([field, error]) => `${field}: ${error.message}`)
        .join(", ");
      sonnerToast.error(`Please fix the following errors: ${errorMessages}`);
      return false;
    }

    return true;
  };

  const handleSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const organizationStructure = {
        level3: {
          libraries: [],
          level3_role_names: data.level3_role_names,
        },
        level4: {
          configs: data.level4_configs.map(config => ({
            id: config.id,
            name: config.name,
            max_books: config.max_books,
            loan_duration: config.loan_duration,
            reservation_duration: config.reservation_duration,
            fine_per_day: config.fine_per_day,
          })),
        },
        resource_types: data.resource_types,
      } as OrganizationStructureLocal;

      if (institution) {
        // Update existing institution
        await updateInstitution({
          id: institution._id,
          name: data.name,
          address: data.address,
          adminName: data.admin_name,
          adminEmail: data.admin_email,
          organizationStructure: organizationStructure as any,
        });

        toast({
          title: "Success",
          description: "Institution updated successfully",
        });
      } else {
        // Create new institution
        await createInstitution({
          name: data.name,
          address: data.address,
          adminName: data.admin_name,
          adminEmail: data.admin_email,
          adminPassword: data.admin_password,
          organizationStructure: organizationStructure as any,
        });

        toast({
          title: "Success",
          description: "Institution created successfully",
        });
      }

      onSuccess();
    } catch (error: any) {
      console.error("Error saving institution:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save institution. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    // Handle numeric inputs properly
    const fieldKey = field as keyof FormData;

    if (field === 'level4_configs.0.max_books' || field === 'level4_configs.1.max_books' || field === 'level4_configs.0.loan_duration' || field === 'level4_configs.1.loan_duration' || field === 'level4_configs.0.reservation_duration' || field === 'level4_configs.1.reservation_duration') {
      const numValue = value === '' ? 0 : parseInt(value);
      form.setValue(fieldKey, numValue as any);
    } else if (field === 'level4_configs.0.fine_per_day' || field === 'level4_configs.1.fine_per_day') {
      const numValue = value === '' ? 0 : parseFloat(value);
      form.setValue(fieldKey, numValue as any);
    } else {
      form.setValue(fieldKey, value);
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleAddRole = () => {
    const trimmedName = customRoleInput.trim();
    if (trimmedName) {
      const properCasedName = trimmedName
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      const rolesArray = Array.isArray(currentRoles) ? currentRoles : [];

      if (!rolesArray.map(role => role.toLowerCase()).includes(properCasedName.toLowerCase())) {
        form.setValue("level3_role_names", [...rolesArray, properCasedName], { shouldDirty: true, shouldValidate: true });
        setCustomRoleInput("");
      } else {
        sonnerToast.info(`Role "${properCasedName}" already exists.`);
      }
    }
  };

  const handleRemoveRole = (roleToRemove: string) => {
    form.setValue("level3_role_names", currentRoles.filter(role => role !== roleToRemove), { shouldDirty: true, shouldValidate: true });
  };

  const handleAddResource = () => {
    const trimmedName = customResourceInput.trim();
    if (trimmedName) {
      const properCasedName = trimmedName
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      const resourcesArray = form.watch("resource_types") || [];

      if (!resourcesArray.map(resource => resource.toLowerCase()).includes(properCasedName.toLowerCase())) {
        form.setValue("resource_types", [...resourcesArray, properCasedName], { shouldDirty: true, shouldValidate: true });
        setCustomResourceInput("");
      } else {
        sonnerToast.info(`Resource type "${properCasedName}" already exists.`);
      }
    }
  };

  const handleRemoveResource = (resourceToRemove: string) => {
    const currentResources = form.watch("resource_types");
    form.setValue("resource_types", currentResources.filter(resource => resource !== resourceToRemove), { shouldDirty: true, shouldValidate: true });
  };

  const handleNext = async () => {
    const currentTabIndex = TABS.indexOf(activeTab);
    let fieldsToValidate: (keyof FormData)[] = [];
    let allClientValidationsPassed = false;

    if (activeTab === 'basic') {
      fieldsToValidate = ['name', 'address', 'admin_name', 'admin_email', 'contact_phone'];
      if (!institution) {
        fieldsToValidate.push('admin_password');
      }
    } else if (activeTab === 'level4') {
      if (currentTabIndex < TABS.length - 1) {
        setActiveTab(TABS[currentTabIndex + 1]);
      }
      return;
    }

    allClientValidationsPassed = await form.trigger(fieldsToValidate);

    if (allClientValidationsPassed) {
      // Note: email uniqueness check is now handled server-side by the Convex mutation
      setMaxValidatedStep(Math.max(maxValidatedStep, currentTabIndex));
      if (currentTabIndex < TABS.length - 1) {
        setActiveTab(TABS[currentTabIndex + 1]);
      }
    } else {
      sonnerToast.error("Please fix the errors on the current tab before proceeding.");
    }
  };

  const currentTabIndex = TABS.indexOf(activeTab);
  const isLastStep = currentTabIndex === TABS.length - 1;

  const { errors: formErrors } = form.formState;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{institution ? "Edit" : "Add New"} Institution</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            <Tabs value={activeTab} onValueChange={(newTab) => {
              const newTabIndex = TABS.indexOf(newTab);
              if (newTabIndex <= maxValidatedStep + 1) {
                 setActiveTab(newTab);
              }
            }}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="level4" disabled={maxValidatedStep < 0}>User Rules</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <Card>
                  <CardContent className="pt-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Institution Name <span className="text-destructive">*</span></FormLabel>
                              <FormControl>
                                <Input {...field} className={cn(formErrors.name && "border-destructive")} placeholder="e.g., Central University"/>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address <span className="text-destructive">*</span></FormLabel>
                              <FormControl>
                                <Input {...field} className={cn(formErrors.address && "border-destructive")} placeholder="e.g., 123 University Ave"/>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="contact_phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Phone</FormLabel>
                              <FormControl>
                                 <Input {...field} className={cn(formErrors.contact_phone && "border-destructive")} placeholder="e.g., +1-555-123-4567"/>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="admin_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Admin Name <span className="text-destructive">*</span></FormLabel>
                              <FormControl>
                                <Input {...field} className={cn(formErrors.admin_name && "border-destructive")} placeholder="e.g., Jane Doe"/>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="admin_email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Admin Email <span className="text-destructive">*</span></FormLabel>
                              <FormControl>
                                <Input type="email" {...field} className={cn(formErrors.admin_email && "border-destructive")} placeholder="e.g., admin@university.edu"/>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        {!institution && (
                          <FormField
                            control={form.control}
                            name="admin_password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Admin Password <span className="text-destructive">*</span></FormLabel>
                                <FormControl>
                                  <Input type="password" {...field} className={cn(formErrors.admin_password && "border-destructive")} placeholder="Min 8 characters" />
                                </FormControl>
                                {formErrors.admin_password && (
                                  <FormMessage>{formErrors.admin_password.message}</FormMessage>
                                )}
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-sm font-medium">Level 3 Roles</FormLabel>
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Add role..."
                            value={customRoleInput}
                            onChange={(e) => setCustomRoleInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddRole(); } }}
                            className="h-8 w-40"
                          />
                          <Button type="button" size="sm" onClick={handleAddRole}>Add</Button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 min-h-[28px]">
                        {(form.watch("level3_role_names") || [])?.map((role) => (
                          <div key={role} className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-sm whitespace-nowrap">
                            <span>{role}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 hover:bg-destructive/10 p-0"
                              onClick={() => handleRemoveRole(role)}
                            >
                              <X className="h-3 w-3 text-destructive" />
                              <span className="sr-only">Remove {role}</span>
                            </Button>
                          </div>
                        ))}
                        {(form.watch("level3_role_names") || []).length === 0 && (
                          <span className="text-xs text-muted-foreground italic">No roles defined yet</span>
                        )}
                      </div>
                      <FormMessage>{form.formState.errors.level3_role_names?.message}</FormMessage>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-sm font-medium">Resource Types</FormLabel>
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Add resource type..."
                            value={customResourceInput}
                            onChange={(e) => setCustomResourceInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddResource(); } }}
                            className="h-8 w-40"
                          />
                          <Button type="button" size="sm" onClick={handleAddResource}>Add</Button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 min-h-[28px]">
                        {(form.watch("resource_types") || [])?.map((resource) => (
                          <div key={resource} className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-sm whitespace-nowrap">
                            <span>{resource}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 hover:bg-destructive/10 p-0"
                              onClick={() => handleRemoveResource(resource)}
                            >
                              <X className="h-3 w-3 text-destructive" />
                              <span className="sr-only">Remove {resource}</span>
                            </Button>
                          </div>
                        ))}
                        {(form.watch("resource_types") || []).length === 0 && (
                          <span className="text-xs text-muted-foreground italic">No resource types defined yet</span>
                        )}
                      </div>
                      <FormMessage>{form.formState.errors.resource_types?.message}</FormMessage>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="level4" className="space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Level 4 User Configurations</CardTitle>
                    <Button
                      type="button"
                      onClick={() => appendLevel4Config({
                        id: crypto.randomUUID(),
                        name: "New User Type",
                        max_books: 1,
                        loan_duration: 7,
                        reservation_duration: 3,
                        fine_per_day: 0
                      })}
                    >
                      Add User Type
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {level4Fields.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No Level 4 user configurations. Click "Add User Type" to create one.
                      </p>
                    ) : (
                      <ScrollArea className="h-[400px] border rounded-md">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-2/5">Type Name</TableHead>
                              <TableHead>Max Books</TableHead>
                              <TableHead>Loan (Days)</TableHead>
                              <TableHead>Reserve (Days)</TableHead>
                              <TableHead>Fine/Day</TableHead>
                              <TableHead className="w-[80px] text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {level4Fields.map((fieldItem, index) => (
                              <TableRow key={fieldItem.id}>
                                <TableCell className="font-medium align-top pt-3">
                                  <FormField
                                    control={form.control}
                                    name={`level4_configs.${index}.name`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormControl>
                                          <Input {...field} placeholder="e.g., Staff, Alumni" />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </TableCell>
                                <TableCell className="align-top pt-3">
                                  <FormField
                                    control={form.control}
                                    name={`level4_configs.${index}.max_books`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormControl>
                                          <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))} className="w-24" />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </TableCell>
                                <TableCell className="align-top pt-3">
                                  <FormField
                                    control={form.control}
                                    name={`level4_configs.${index}.loan_duration`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormControl>
                                          <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))} className="w-24" />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </TableCell>
                                <TableCell className="align-top pt-3">
                                  <FormField
                                    control={form.control}
                                    name={`level4_configs.${index}.reservation_duration`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormControl>
                                          <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))} className="w-24" />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </TableCell>
                                <TableCell className="align-top pt-3">
                                  <FormField
                                    control={form.control}
                                    name={`level4_configs.${index}.fine_per_day`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormControl>
                                          <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} className="w-24" />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </TableCell>
                                <TableCell className="text-right align-top pt-2">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeLevel4Config(index)}
                                    className="hover:bg-destructive/10"
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                    <span className="sr-only">Remove</span>
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex justify-between items-center pt-4">
              <div>
                <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              </div>
              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab(TABS[currentTabIndex - 1])}
                  disabled={currentTabIndex === 0}
                  className={cn(currentTabIndex === 0 && "opacity-50 cursor-not-allowed")}
                >
                  Back
                </Button>
                {!isLastStep ? (
                  <Button type="button" onClick={handleNext}>
                    Next
                  </Button>
                ) : (
                  <Button type="button" onClick={form.handleSubmit(handleSubmit)} disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save Institution"}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
