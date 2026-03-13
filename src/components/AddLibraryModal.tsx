import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/supabase";
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
import { Institution } from "@/types/database";
import { Database } from "@/integrations/supabase/types";
import { Loader2 } from "lucide-react";
import { Trash2 } from "lucide-react";

type Library = Database["public"]["Tables"]["libraries"]["Row"] & {
  institutions?: {
    name: string;
  };
};

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
  institution_id: z.string().min(1, "Institution is required"),
  name: z.string().min(1, "Library name is required"),
  address: z.string().min(1, "Address is required"),
  contact_number: z.string().min(1, "Contact number is required"),
  open_time: z.string().min(1, "Open time is required"),
  close_time: z.string().min(1, "Close time is required"),
  days_closed: z.array(z.string()),
  resources: z.array(z.string()),
  shelves: z.array(z.object({
    id: z.string().optional(),
    description: z.string().optional(),
  })),
  managed_by: z.array(z.string()),
  user_types: z.array(z.string()),
});

export function AddLibraryModal({ isOpen, library, onClose, onSuccess }: AddLibraryModalProps) {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      institution_id: library?.institution_id || "",
      name: library?.name || "",
      address: library?.address || "",
      contact_number: library?.contact_number || "",
      open_time: library?.open_time || "09:00",
      close_time: library?.close_time || "17:00",
      days_closed: library?.days_closed || [],
      resources: library?.resources || [],
      shelves: library?.shelves || [],
      managed_by: library?.managed_by || [],
      user_types: library?.user_types || [],
    },
  });

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const fetchInstitutions = async () => {
    try {
      const { data, error } = await supabase
        .from("institutions")
        .select("*");
      if (error) throw error;
      setInstitutions(data as unknown as Institution[]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      const shelves = values.shelves.map(shelf => ({
        id: shelf.id,
        description: shelf.description || ""
      }));

      if (library) {
        const updateData: Database["public"]["Tables"]["libraries"]["Update"] = {
          name: values.name,
          address: values.address,
          institution_id: values.institution_id,
          contact_number: values.contact_number,
          open_time: values.open_time,
          close_time: values.close_time,
          days_closed: values.days_closed,
          resources: values.resources,
          shelves,
          managed_by: values.managed_by,
          user_types: values.user_types,
          updated_at: new Date().toISOString(),
        };

        const { error: updateError } = await supabase
          .from("libraries")
          .update(updateData)
          .eq("id", library.id);

        if (updateError) throw updateError;

        toast({
          title: "Success",
          description: "Library updated successfully",
        });
      } else {
        const insertData: Database["public"]["Tables"]["libraries"]["Insert"] = {
          name: values.name,
          address: values.address,
          institution_id: values.institution_id,
          contact_number: values.contact_number,
          open_time: values.open_time,
          close_time: values.close_time,
          days_closed: values.days_closed,
          resources: values.resources,
          shelves,
          managed_by: values.managed_by,
          user_types: values.user_types,
          created_by: (await supabase.auth.getUser()).data.user?.id || "",
        };

        const { error: insertError } = await supabase
          .from("libraries")
          .insert(insertData);

        if (insertError) throw insertError;

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
    (inst) => inst.id === form.watch("institution_id")
  );

  const libraryManagerRoles = selectedInstitution?.organization_structure?.level3?.level3_role_names || [];
  const userTypeConfigs = selectedInstitution?.organization_structure?.level4?.configs || [];
  const resourceTypes = selectedInstitution?.organization_structure?.resource_types || [];

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
              name="institution_id"
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
                        <SelectItem key={institution.id} value={institution.id}>
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
                name="contact_number"
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
                name="open_time"
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
                name="close_time"
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
              name="days_closed"
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
              name="managed_by"
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
              name="user_types"
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
                      const { error } = await supabase
                        .from("libraries")
                        .delete()
                        .eq("id", library.id);
                      if (error) throw error;
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