import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type BookCondition = 'good' | 'fair' | 'poor' | 'damaged';

interface BookConditionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (condition: BookCondition, notes: string) => void;
  mode: 'borrow' | 'return';
  initialCondition?: BookCondition;
  initialNotes?: string;
  title?: string;
}

export const BookConditionForm = ({
  isOpen,
  onClose,
  onSubmit,
  mode,
  initialCondition = 'good',
  initialNotes = '',
  title
}: BookConditionFormProps) => {
  const [condition, setCondition] = useState<BookCondition>(initialCondition);
  const [notes, setNotes] = useState(initialNotes);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!condition) {
      setError('Please select a condition');
      return;
    }
    onSubmit(condition, notes);
    onClose();
  };

  const getConditionDescription = (condition: BookCondition) => {
    switch (condition) {
      case 'good':
        return 'Book is in excellent condition with minimal wear';
      case 'fair':
        return 'Book shows some wear but is still in good reading condition';
      case 'poor':
        return 'Book has significant wear but is still readable';
      case 'damaged':
        return 'Book has major damage that affects readability';
      default:
        return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {title || `${mode === 'borrow' ? 'Book Condition on Borrow' : 'Book Condition on Return'}`}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-2">
            <Label htmlFor="condition">Book Condition</Label>
            <Select
              value={condition}
              onValueChange={(value: BookCondition) => {
                setCondition(value);
                setError(null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="fair">Fair</SelectItem>
                <SelectItem value="poor">Poor</SelectItem>
                {mode === 'return' && <SelectItem value="damaged">Damaged</SelectItem>}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500 mt-1">
              {getConditionDescription(condition)}
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about the book's condition..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          {mode === 'return' && condition === 'damaged' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please note that returning a damaged book may result in a fine. The librarian will review the condition and determine if any charges apply.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {mode === 'borrow' ? 'Confirm Borrow' : 'Confirm Return'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 