import * as React from "react";
import { format } from "date-fns";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function TimePicker({ value, onChange, disabled }: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [time, setTime] = React.useState(value || "09:00");

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = e.target.value;
    setTime(time);
    onChange(time);
  };

  return (
    <div className="relative">
      <Input
        type="time"
        value={time}
        onChange={handleTimeChange}
        disabled={disabled}
        className={cn(
          "h-10 pl-10",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      />
      <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
    </div>
  );
} 