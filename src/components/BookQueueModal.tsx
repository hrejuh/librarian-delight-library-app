import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, Clock, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Book } from "@/lib/data-types";

interface BookQueueModalProps {
  book: Book;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface QueueInfo {
  position: number;
  totalWaiting: number;
  estimatedWaitTime: string;
}

export const BookQueueModal = ({
  book,
  isOpen,
  onClose,
  onSuccess,
}: BookQueueModalProps) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [queueInfo, setQueueInfo] = useState<QueueInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchQueueInfo = async () => {
    if (!user || !profile?.institution_id) return;

    try {
      const { data, error: queueError } = await supabase
        .from('book_queue')
        .select('position, status')
        .eq('book_id', book.id)
        .eq('user_id', user.id)
        .single();

      if (queueError && queueError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw queueError;
      }

      const { count, error: countError } = await supabase
        .from('book_queue')
        .select('*', { count: 'exact', head: true })
        .eq('book_id', book.id)
        .eq('status', 'waiting');

      if (countError) throw countError;

      if (data) {
        setQueueInfo({
          position: data.position,
          totalWaiting: count || 0,
          estimatedWaitTime: calculateWaitTime(data.position, count || 0)
        });
      } else {
        setQueueInfo({
          position: (count || 0) + 1,
          totalWaiting: count || 0,
          estimatedWaitTime: calculateWaitTime((count || 0) + 1, count || 0)
        });
      }
    } catch (error: any) {
      console.error('Error fetching queue info:', error);
      setError('Failed to fetch queue information');
    }
  };

  const calculateWaitTime = (position: number, totalWaiting: number): string => {
    // Assuming average loan duration is 14 days
    const averageLoanDays = 14;
    const estimatedDays = Math.ceil((position * averageLoanDays) / book.total);
    
    if (estimatedDays <= 7) return 'Less than a week';
    if (estimatedDays <= 14) return '1-2 weeks';
    if (estimatedDays <= 30) return '2-4 weeks';
    return 'More than a month';
  };

  const handleJoinQueue = async () => {
    if (!user || !profile?.institution_id) {
      setError('You must be logged in and associated with an institution to join the queue');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data: queueId, error: queueError } = await supabase
        .rpc('manage_book_queue', {
          p_book_id: book.id,
          p_user_id: user.id,
          p_institution_id: profile.institution_id
        });

      if (queueError) throw queueError;

      toast({
        title: "Success",
        description: "You have been added to the queue. We'll notify you when the book is available.",
      });
      onSuccess();
    } catch (error: any) {
      console.error('Error joining queue:', error);
      setError(error.message || 'Failed to join the queue');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch queue info when modal opens
  useState(() => {
    if (isOpen) {
      fetchQueueInfo();
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Join Book Queue</DialogTitle>
          <DialogDescription>
            This book is currently unavailable. Join the queue to be notified when it becomes available.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-sm">
                {queueInfo ? (
                  `You will be position ${queueInfo.position} of ${queueInfo.totalWaiting} in the queue`
                ) : (
                  'Calculating queue position...'
                )}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm">
                {queueInfo ? (
                  `Estimated wait time: ${queueInfo.estimatedWaitTime}`
                ) : (
                  'Calculating wait time...'
                )}
              </span>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  <li>You will be notified when the book becomes available</li>
                  <li>You have 24 hours to borrow the book once notified</li>
                  <li>Queue position is based on first-come, first-served</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleJoinQueue}
            disabled={isLoading}
          >
            {isLoading ? "Joining Queue..." : "Join Queue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 