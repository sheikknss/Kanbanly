import { useEffect, useId, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { CheckCircle2, Circle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  commentAdded,
  selectColumnById,
  selectTaskById,
  taskDeleted,
  taskToggled,
  taskUpdated,
} from "@/store/redux/workspaceSlice";
import { USERS, getUserById } from "@/api/users";
import { useAuth } from "@/context/AuthContext";
import { useDebounce, usePermissions } from "@/hooks";
import { LabelChip, PRIORITIES, UserAvatar } from "@/components/common";
import { timeAgo } from "@/utils/filterTasks";

/**
 * Task editor used in two places — the board's modal AND the /tasks/$taskId
 * page. Composition over duplication.
 *
 * Title/description are edited locally and auto-saved via useDebounce,
 * so Redux isn't hit on every keystroke.
 */
export function TaskDetail({ taskId, onDeleted }) {
  const task = useSelector((s) => selectTaskById(s, taskId));
  const column = useSelector((s) => (task ? selectColumnById(s, task.columnId) : null));
  const dispatch = useDispatch();
  const { user } = useAuth();
  const can = usePermissions();
  const id = useId();

  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [labelDraft, setLabelDraft] = useState("");
  const [comment, setComment] = useState("");
  const debouncedTitle = useDebounce(title, 400);
  const debouncedDesc = useDebounce(description, 400);

  // Auto-save effect. Guarded so we only dispatch real changes.
  useEffect(() => {
    if (!task) return;
    const changes = {};
    if (debouncedTitle.trim() && debouncedTitle !== task.title) changes.title = debouncedTitle.trim();
    if (debouncedDesc !== task.description) changes.description = debouncedDesc;
    if (Object.keys(changes).length) dispatch(taskUpdated({ id: task.id, changes, actor: user?.name }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTitle, debouncedDesc]);

  if (!task) return <p className="text-sm text-muted-foreground">This task no longer exists.</p>;

  const set = (changes) => dispatch(taskUpdated({ id: task.id, changes, actor: user?.name }));

  const addLabel = (e) => {
    e.preventDefault();
    const l = labelDraft.trim().toLowerCase().replace(/\s+/g, "-");
    if (l && !task.labels.includes(l)) set({ labels: [...task.labels, l] });
    setLabelDraft("");
  };

  const submitComment = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    dispatch(commentAdded({ taskId: task.id, text: comment.trim(), authorId: user?.id, actor: user?.name }));
    setComment("");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <button
          onClick={() => dispatch(taskToggled({ id: task.id, actor: user?.name }))}
          aria-label={task.completed ? "Mark as not complete" : "Mark complete"}
          className="mt-2 text-muted-foreground hover:text-success"
        >
          {task.completed ? <CheckCircle2 className="size-5 text-success" /> : <Circle className="size-5" />}
        </button>
        <div className="flex-1">
          <Label htmlFor={`${id}-t`} className="sr-only">Title</Label>
          <Input
            id={`${id}-t`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-invalid={!title.trim()}
            className="h-auto border-transparent px-1 font-display text-xl font-semibold shadow-none focus-visible:border-input"
          />
          {!title.trim() && <p className="px-1 text-xs text-destructive">Title can’t be empty.</p>}
          <p className="eyebrow px-1">in {column?.title}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label>Priority</Label>
          <Select value={task.priority} onValueChange={(v) => set({ priority: v })}>
            <SelectTrigger aria-label="Priority"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Assignee</Label>
          <Select value={task.assigneeId ?? "none"} onValueChange={(v) => set({ assigneeId: v === "none" ? null : v })}>
            <SelectTrigger aria-label="Assignee"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Unassigned</SelectItem>
              {USERS.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-due`}>Due date</Label>
          <Input id={`${id}-due`} type="date" value={task.dueDate ?? ""} onChange={(e) => set({ dueDate: e.target.value || null })} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Labels</Label>
        <div className="flex flex-wrap items-center gap-1.5">
          {task.labels.map((l) => (
            <button key={l} onClick={() => set({ labels: task.labels.filter((x) => x !== l) })} aria-label={`Remove label ${l}`} className="hover:opacity-60">
              <LabelChip label={l} />
            </button>
          ))}
          <form onSubmit={addLabel}>
            <Input value={labelDraft} onChange={(e) => setLabelDraft(e.target.value)} placeholder="+ label" aria-label="Add label" className="h-7 w-28 text-xs" />
          </form>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`${id}-d`}>Description</Label>
        <Textarea id={`${id}-d`} rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add more detail…" />
      </div>

      <section aria-labelledby={`${id}-c`} className="space-y-3">
        <h3 id={`${id}-c`} className="text-sm font-semibold">Comments ({task.comments.length})</h3>
        <ul className="space-y-3">
          {task.comments.map((c) => (
            <li key={c.id} className="flex gap-2.5">
              <UserAvatar userId={c.authorId} />
              <div className="flex-1 rounded-lg bg-muted px-3 py-2 text-sm">
                <p className="mb-0.5 text-xs"><span className="font-semibold">{getUserById(c.authorId)?.name}</span> <span className="text-muted-foreground">· {timeAgo(c.at)}</span></p>
                {c.text}
              </div>
            </li>
          ))}
        </ul>
        <form onSubmit={submitComment} className="flex gap-2">
          <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Write a comment…" aria-label="Write a comment" />
          <Button type="submit" disabled={!comment.trim()}>Send</Button>
        </form>
      </section>

      {can.canDeleteTask && (
        <div className="border-t pt-4">
          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => {
              if (!confirm(`Delete “${task.title}”?`)) return;
              dispatch(taskDeleted({ id: task.id, actor: user?.name }));
              toast("Task deleted");
              onDeleted?.();
            }}
          >
            <Trash2 className="size-4" /> Delete task
          </Button>
        </div>
      )}
    </div>
  );
}
