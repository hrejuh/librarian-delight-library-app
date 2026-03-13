import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Institution, Level4UserConfig } from "@/lib/data-types";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  userType: z.string().nonempty({ message: "User type is required" }),
  institution_id: z.string().nonempty({ message: "Institution is required" }),
});

interface AddUserModalProps {
  onClose: () => void;
  onSave: (data: z.infer<typeof formSchema>) => void;
  institutions: Institution[];
}

export const AddUserModal = ({ onClose, onSave, institutions }: AddUserModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userTypes, setUserTypes] = useState<Level4UserConfig[]>([]);
  const { profile } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      userType: "",
      institution_id: profile?.institution_id || "",
    },
  });

  // Fetch user types when institution changes
  useEffect(() => {
    const fetchUserTypes = async () => {
      const institutionId = form.getValues("institution_id");
      if (!institutionId) return;

      const { data, error } = await supabase
        .from('institutions')
        .select('organization_structure')
        .eq('id', institutionId)
        .single();

      if (error || !data?.organization_structure) {
        console.error('Error fetching institution settings:', error);
        return;
      }

      const orgStructure = data.organization_structure as {
        level4?: {
          configs?: Level4UserConfig[];
        };
      };

      if (orgStructure.level4?.configs) {
        setUserTypes(orgStructure.level4.configs);
      }
    };

    fetchUserTypes();
  }, [form.watch("institution_id")]);

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    
    try {
      await onSave(values);
      onClose();
    } catch (error) {
      console.error("Error adding user:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSuperAdmin = profile?.role === "super_admin";

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]" aria-describedby="add-user-description">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Add New User</DialogTitle>
        </DialogHeader>

        <div id="add-user-description" className="sr-only">
          Add a new user to the library system by entering their email and role
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="user@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="******" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="userType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a user type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {userTypes.map((type) => (
                        <SelectItem key={type.id} value={type.name}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="institution_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Institution</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={!isSuperAdmin && profile?.institution_id !== undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an institution" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {institutions.map(institution => (
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

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-library-primary"
              >
                {isSubmitting ? "Adding..." : "Add User"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
