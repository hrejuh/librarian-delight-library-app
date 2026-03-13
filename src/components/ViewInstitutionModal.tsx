import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
// LibraryFormData is not directly used here as institution.organization_structure.level3.libraries has its own structure
import { Institution, Level4UserConfig } from "@/lib/data-types"; 
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from 'date-fns';

interface ViewInstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  institution: Institution | null;
}

const DetailItem: React.FC<{ label: string; value?: string | number | null; children?: React.ReactNode }> = ({ label, value, children }) => (
  <div className="mb-2">
    <p className="text-sm font-medium text-gray-500">{label}</p>
    {children ? <div className="text-sm text-gray-800">{children}</div> : <p className="text-sm text-gray-800">{value || "N/A"}</p>}
  </div>
);

const SectionTitle: React.FC<{ title: string }> = ({ title }) => (
  <>
    <h3 className="text-lg font-semibold text-gray-700 mt-4 mb-2">{title}</h3>
    <Separator className="mb-3" />
  </>
);

export function ViewInstitutionModal({ isOpen, onClose, institution }: ViewInstitutionModalProps) {
  console.log("[ViewInstitutionModal] Rendering with props:", { isOpen, institutionId: institution?.id });

  if (!institution) {
    return null;
  }

  const {
    name,
    address,
    admin_name,
    admin_email,
    contact_phone,
    organization_structure,
    created_at,
    created_by,
  } = institution;

  const libraries = organization_structure?.level3?.libraries || [];
  const level3RoleNames = organization_structure?.level3?.level3_role_names || [];
  const level4Configs = organization_structure?.level4?.configs || [];
  const resourceTypes = organization_structure?.resource_types || [];
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Institution Details: {name}</DialogTitle>
          <DialogDescription>
            Comprehensive overview of {name}.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh] pr-5">
          <div className="space-y-4 py-4">
            <SectionTitle title="Basic Information" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
              <DetailItem label="Institution Name" value={name} />
              <DetailItem label="Address" value={address} />
              <DetailItem label="Contact Phone" value={contact_phone} />
              <DetailItem label="Administrator Name" value={admin_name} />
              <DetailItem label="Administrator Email" value={admin_email} />
            </div>

            {resourceTypes.length > 0 && (
              <>
                <SectionTitle title="Resource Types" />
                <div className="flex flex-wrap gap-2">
                  {resourceTypes.map(resource => <Badge key={resource} variant="outline">{resource}</Badge>)}
                </div>
              </>
            )}

            {libraries.length > 0 && (
              <>
                <SectionTitle title="Libraries (Level 3)" />
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Library Name</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead className="text-center">Is Default?</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {libraries.map((lib, index) => (
                      <TableRow key={`${lib.name}-${index}`}>
                        <TableCell>{lib.name}</TableCell>
                        <TableCell>{lib.address}</TableCell>
                        <TableCell className="text-center">{lib.is_default ? <Badge variant="default">Yes</Badge> : "No"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
            
            {level3RoleNames.length > 0 && (
              <>
                <SectionTitle title="Level 3 Role Names" />
                <div className="flex flex-wrap gap-2">
                    {level3RoleNames.map(role => <Badge key={role} variant="outline">{role}</Badge>)}
                </div>
              </>
            )}

            {level4Configs.length > 0 && (
              <>
                <SectionTitle title="Level 4 User Configurations" />
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type Name</TableHead>
                      <TableHead className="text-right">Max Books</TableHead>
                      <TableHead className="text-right">Loan (Days)</TableHead>
                      <TableHead className="text-right">Reserve (Days)</TableHead>
                      <TableHead className="text-right">Fine/Day</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {level4Configs.map(config => (
                      <TableRow key={config.id}>
                        <TableCell>{config.name}</TableCell>
                        <TableCell className="text-right">{config.max_books}</TableCell>
                        <TableCell className="text-right">{config.loan_duration}</TableCell>
                        <TableCell className="text-right">{config.reservation_duration}</TableCell>
                        <TableCell className="text-right">₹{config.fine_per_day.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
            
            <SectionTitle title="System Information" />
            <DetailItem label="Created At" value={created_at ? format(new Date(created_at), 'PPPpp') : "N/A"} />
            <DetailItem label="Created By (User ID)" value={created_by} />

          </div>
        </ScrollArea>
        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 