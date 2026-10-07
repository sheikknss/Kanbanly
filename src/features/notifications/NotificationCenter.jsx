import { Bell, CalendarClock } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  notificationsRead,
  selectActivity,
  selectDueSoon,
  selectUnreadCount,
} from "@/store/redux/workspaceSlice";
import { formatDate, timeAgo } from "@/utils/filterTasks";

/**
 * Notifications are DERIVED from the activity log + task due dates.
 * There is no separate "notifications" array to keep in sync —
 * derived state avoids a whole class of bugs.
 */
export function NotificationCenter() {
  const dispatch = useDispatch();
  const activity = useSelector(selectActivity);
  const unread = useSelector(selectUnreadCount);
  const dueSoon = useSelector(selectDueSoon);
  const badge = unread + dueSoon.length;

  return (
    <Popover onOpenChange={(open) => !open && unread > 0 && dispatch(notificationsRead())}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Notifications, ${badge} new`} className="relative">
          <Bell className="size-4" />
          {badge > 0 && (
            <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-primary px-1 font-mono text-[9px] font-bold text-primary-foreground">
              {badge > 9 ? "9+" : badge}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b px-4 py-3">
          <p className="font-display font-semibold">Notifications</p>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {dueSoon.map((t) => (
            <Link key={t.id} to="/tasks/$taskId" params={{ taskId: t.id }} className="flex gap-3 border-b bg-warning/10 px-4 py-2.5 text-sm hover:bg-warning/20">
              <CalendarClock className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
              <span>
                <span className="font-medium">{t.title}</span> is due {formatDate(t.dueDate)}
              </span>
            </Link>
          ))}
          {activity.length === 0 && <p className="p-4 text-sm text-muted-foreground">No activity yet.</p>}
          {activity.slice(0, 25).map((a, i) => (
            <div key={a.id} className="flex gap-3 border-b px-4 py-2.5 text-sm last:border-0">
              <span aria-hidden className={i < unread ? "mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" : "mt-1.5 size-1.5 shrink-0 rounded-full bg-border"} />
              <div>
                <p>
                  <span className="font-medium">{a.actor}</span> {a.message}
                </p>
                <p className="eyebrow mt-0.5">{timeAgo(a.at)}</p>
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
