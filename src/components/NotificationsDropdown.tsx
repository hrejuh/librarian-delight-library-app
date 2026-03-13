import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Bell, BookOpen, AlertCircle, Clock, DollarSign, Check } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

const NotificationsDropdown = () => {
  const { profile } = useAuth();
  const { toast } = useToast();

  const notifications = useQuery(
    api.notifications.listByUser,
    profile?.userId ? { userId: profile.userId, limit: 10 } : "skip",
  );

  const markAsReadMutation = useMutation(api.notifications.markAsRead);
  const markAllAsReadMutation = useMutation(api.notifications.markAllAsRead);

  const isLoading = notifications === undefined;
  const notificationList = notifications ?? [];
  const unreadCount = notificationList.filter((n) => !n.isRead).length;

  const markAsRead = async (notificationId: string) => {
    try {
      await markAsReadMutation({ id: notificationId as any });
    } catch {
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    }
  };

  const markAllAsRead = async () => {
    if (!profile?.userId || notificationList.length === 0) return;
    try {
      await markAllAsReadMutation({ userId: profile.userId });
    } catch {
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "hold_ready":
      case "request_approved":
        return <BookOpen className="h-4 w-4 text-green-500 shrink-0" />;
      case "overdue":
      case "request_rejected":
        return <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />;
      case "due_reminder":
        return <Clock className="h-4 w-4 text-amber-500 shrink-0" />;
      case "fine_added":
        return <DollarSign className="h-4 w-4 text-red-500 shrink-0" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground shrink-0" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-3 py-2">
          <h4 className="text-sm font-medium">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-auto py-1"
              onClick={markAllAsRead}
            >
              <Check className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        {isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Loading...
          </div>
        ) : notificationList.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {notificationList.map((notification) => (
              <DropdownMenuItem
                key={notification._id}
                className={`px-3 py-2.5 cursor-pointer ${!notification.isRead ? "bg-muted/50" : ""}`}
                onClick={() => markAsRead(notification._id)}
              >
                <div className="flex gap-2.5 w-full">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm truncate">
                        {notification.title}
                      </p>
                      {!notification.isRead && (
                        <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(
                        new Date(notification.createdAt ?? notification._creationTime),
                        { addSuffix: true },
                      )}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationsDropdown;
