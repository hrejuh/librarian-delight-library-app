import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Database } from "@/integrations/supabase/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';

type Library = Database["public"]["Tables"]["libraries"]["Row"] & {
  institutions?: {
    name: string;
  };
};

interface ViewLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  library: Library | null;
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

const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function ViewLibraryModal({ isOpen, onClose, library }: ViewLibraryModalProps) {
  if (!library) {
    return null;
  }

  const {
    name,
    address,
    contact_info,
    open_time,
    close_time,
    days_closed,
    resources,
    shelves,
    managed_by,
    user_types,
    created_at,
    created_by,
    updated_at,
    institutions,
  } = library;

  const BadgeList = ({ items }: { items: string[] | null }) => (
    <div className="flex flex-wrap gap-2">
      {items?.map((item) => (
        <Badge key={item} variant="secondary">
          {item}
        </Badge>
      ))}
      {(!items || items.length === 0) && (
        <span className="text-sm text-muted-foreground">None</span>
      )}
    </div>
  );

  const ShelfList = ({ shelves }: { shelves: any[] | null }) => (
    <div className="space-y-2">
      {shelves?.map((shelf, index) => (
        <div key={index} className="flex items-center gap-2">
          <Badge variant="outline">{shelf.id}</Badge>
          {shelf.description && (
            <span className="text-sm text-muted-foreground">{shelf.description}</span>
          )}
        </div>
      ))}
      {(!shelves || shelves.length === 0) && (
        <span className="text-sm text-muted-foreground">No shelves configured</span>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">{name}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-8rem)] pr-4">
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <SectionTitle title="Basic Information" />
              <div className="grid grid-cols-2 gap-4">
                <DetailItem
                  label="Institution"
                  value={institutions?.name}
                />
                <DetailItem
                  label="Contact Number"
                  value={contact_info && typeof contact_info === 'object' && 'phone' in contact_info && typeof contact_info.phone === 'string' 
                    ? contact_info.phone 
                    : undefined}
                />
                <DetailItem
                  label="Address"
                  value={address}
                />
              </div>
            </div>

            {/* Operating Hours */}
            <div className="space-y-4">
              <SectionTitle title="Operating Hours" />
              <div className="grid grid-cols-2 gap-4">
                <DetailItem
                  label="Open Time"
                  value={open_time}
                />
                <DetailItem
                  label="Close Time"
                  value={close_time}
                />
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Days Closed</span>
                <BadgeList items={days_closed} />
              </div>
            </div>

            {/* Resources and Shelves */}
            <div className="space-y-4">
              <SectionTitle title="Resources and Shelves" />
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">Resource Types</span>
                  <BadgeList items={resources} />
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">Shelves</span>
                  <ShelfList shelves={shelves} />
                </div>
              </div>
            </div>

            {/* Management and Access */}
            <div className="space-y-4">
              <SectionTitle title="Management and Access" />
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">Managed By</span>
                  <BadgeList items={managed_by} />
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">User Types</span>
                  <BadgeList items={user_types} />
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="space-y-4">
              <SectionTitle title="Metadata" />
              <div className="grid grid-cols-2 gap-4">
                <DetailItem
                  label="Created At"
                  value={created_at ? format(new Date(created_at), "PPP p") : undefined}
                />
                <DetailItem
                  label="Created By"
                  value={created_by}
                />
                <DetailItem
                  label="Last Updated"
                  value={updated_at ? format(new Date(updated_at), "PPP p") : undefined}
                />
              </div>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 