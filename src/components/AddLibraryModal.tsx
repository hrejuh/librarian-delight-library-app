import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Library {
  _id: string;
  institutionId: string;
  name: string;
  address: string;
  contactNumber?: string;
  openTime?: string;
  closeTime?: string;
  daysClosed?: string[];
  resources?: string[];
  shelves?: any[];
  managedBy?: string[];
  userTypes?: string[];
  institutions?: {
    name: string;
  };
}

const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

interface AddLibraryModalProps {
  isOpen: boolean;
  library?: Library;
  onClose: () => void;
  onSuccess: () => void;
}

const formSchema = z.object({
  institutionId: z.string().min(1, "Institution is required"),
  name: z.string().min(1, "Library name is required"),
  address: z.string().min(1, "Address is required"),
  contactNumber: z.string().min(1, "Contact number is required"),
  openTime: z.string().min(1, "Open time is required"),
  closeTime: z.string().min(1, "Close time is required"),
  daysClosed: z.array(z.string()),
  resources: z.array(z.string()),
  shelves: z.array(z.object({
    id: z.string().optional(),
    description: z.string().optional(),
  })),
  managedBy: z.array(z.string()),
  userTypes: z.array(z.string()),
});

export function AddLibraryModal({ isOpen, library, onClose, onSuccess }: AddLibraryModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();

  // Fetch institutions via Convex (automatically real-time)
  const institutions = useQuery(api.institutions.list) ?? [];

  const createLibrary = useMutation(api.libraries.create);
  const updateLibrary = useMutation(api.libraries.update);
  const removeLibrary = useMutation(api.libraries.remove);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      institutionId: library?.institutionId || "",
      name: library?.name || "",
      address: library?.address || "",
      contactNumber: library?.contactNumber || "",
      openTime: library?.openTime || "09:00",
      closeTime: library?.closeTime || "17:00",
      daysClosed: library?.daysClosed || [],
      resources: library?.resources || [],
      shelves: library?.shelves || [],
      managedBy: library?.managedBy || [],
      userTypes: library?.userTypes || [],
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      const shelves = values.shelves.map(shelf => ({
        id: shelf.id,
        description: shelf.description || ""
      }));

      if (library) {
        await updateLibrary({
          id: library._id as any,
          name: values.name,
          address: values.address,
          institutionId: values.institutionId as any,
          contactNumber: values.contactNumber,
          openTime: values.openTime,
          closeTime: values.closeTime,
          daysClosed: values.daysClosed,
          resources: values.resources,
          shelves,
          managedBy: values.managedBy,
          userTypes: values.userTypes,
        });

        toast({
          title: "Success",
          description: "Library updated successfully",
        });
      } else {
        await createLibrary({
          name: values.name,
          address: values.address,
          institutionId: values.institutionId as any,
          contactNumber: values.contactNumber,
          openTime: values.openTime,
          closeTime: values.closeTime,
          daysClosed: values.daysClosed,
          resources: values.resources,
          shelves,
          managedBy: values.managedBy,
          userTypes: values.userTypes,
        });

        toast({
          title: "Success",
          description: "Library added successfully",
        });
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedInstitution = institutions.find(
    (inst) => inst._id === form.watch("institutionId")
  );

  const libraryManagerRoles = selectedInstitution?.organizationStructure?.level3?.level3_role_names || [];
  const userTypeConfigs = selectedInstitution?.organizationStructure?.level4?.configs || [];
  const resourceTypes = selectedInstitution?.organizationStructure?.resource_types || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{library ? "Edit Library" : "Add New Library"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Institution Selection */}
            <FormField
              control={form.control}
              name="institutionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Institution</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={!!library}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an institution" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {institutions.map((institution) => (
                        <SelectItem key={institution._id} value={institution._id}>
                          {institution.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Library Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Number</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Operating Hours */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="openTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Open Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="closeTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Close Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Days Closed */}
            <FormField
              control={form.control}
              name="daysClosed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Days Closed</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <Button
                        key={day}
                        type="button"
                        variant={field.value?.includes(day) ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => {
                          const newValue = field.value?.includes(day)
                            ? field.value.filter((d) => d !== day)
                            : [...(field.value || []), day];
                          field.onChange(newValue);
                        }}
                        className={field.value?.includes(day) ? "bg-muted hover:bg-muted/80" : "hover:bg-muted/50"}
                      >
                        {day}
                      </Button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Resource Types */}
            <FormField
              control={form.control}
              name="resources"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resource Types</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {resourceTypes.map((resource) => (
                      <Button
                        key={resource}
                        type="button"
                        variant={field.value?.includes(resource) ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => {
                          const newValue = field.value?.includes(resource)
                            ? field.value.filter((r) => r !== resource)
                            : [...(field.value || []), resource];
                          field.onChange(newValue);
                        }}
                        className={field.value?.includes(resource) ? "bg-muted hover:bg-muted/80" : "hover:bg-muted/50"}
                      >
                        {resource}
                      </Button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Shelves */}
            <FormField
              control={form.control}
              name="shelves"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shelves</FormLabel>
                  <div className="space-y-2">
                    {field.value.map((shelf, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <FormField
                          control={form.control}
                          name={`shelves.${index}.id`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input placeholder="Shelf ID" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`shelves.${index}.description`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input placeholder="Description (optional)" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newShelves = [...field.value];
                            newShelves.splice(index, 1);
                            field.onChange(newShelves);
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        field.onChange([
                          ...field.value,
                          { id: "", description: "" }
                        ]);
                      }}
                    >
                      Add Shelf
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Managed By */}
            <FormField
              control={form.control}
              name="managedBy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Managed By</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {libraryManagerRoles.map((role) => (
                      <Button
                        key={role}
                        type="button"
                        variant={field.value?.includes(role) ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => {
                          const newValue = field.value?.includes(role)
                            ? field.value.filter((r) => r !== role)
                            : [...(field.value || []), role];
                          field.onChange(newValue);
                        }}
                        className={field.value?.includes(role) ? "bg-muted hover:bg-muted/80" : "hover:bg-muted/50"}
                      >
                        {role}
                      </Button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* User Types */}
            <FormField
              control={form.control}
              name="userTypes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User Types</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {userTypeConfigs.map((config) => (
                      <Button
                        key={config.id}
                        type="button"
                        variant={field.value?.includes(config.id) ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => {
                          const newValue = field.value?.includes(config.id)
                            ? field.value.filter((id) => id !== config.id)
                            : [...(field.value || []), config.id];
                          field.onChange(newValue);
                        }}
                        className={field.value?.includes(config.id) ? "bg-muted hover:bg-muted/80" : "hover:bg-muted/50"}
                      >
                        {config.name}
                      </Button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex justify-between">
              {library && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={async () => {
                    if (!library) return;
                    setIsLoading(true);
                    try {
                      await removeLibrary({ id: library._id as any });
                      toast({
                        title: "Success",
                        description: "Library deleted successfully",
                      });
                      onSuccess();
                      onClose();
                    } catch (error: any) {
                      toast({
                        title: "Error",
                        description: error.message,
                        variant: "destructive",
                      });
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Delete Library
                </Button>
              )}
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {library ? "Update Library" : "Add Library"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
