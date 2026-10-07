import { useEffect, useId, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useUIStore } from "@/store/zustand/uiStore";
import { projectAdded, projectUpdated, selectProjectById } from "@/store/redux/workspaceSlice";
import { useAuth } from "@/context/AuthContext";
import { ColorDot, PROJECT_COLORS } from "@/components/common";
import { cn } from "@/lib/utils";

const EMPTY = { name: "", description: "", dueDate: "", color: "chart-1" };

/** Pure validator — easy to test, reusable on a server. */
export function validateProject(values) {
  const errors = {};
  const name = values.name.trim();
  if (!name) errors.name = "Project name is required.";
  else if (name.length < 3) errors.name = "Use at least 3 characters.";
  else if (name.length > 60) errors.name = "Keep it under 60 characters.";
  if (values.description.length > 300) errors.description = "Max 300 characters.";
  return errors;
}

/**
 * One dialog for create + edit. Open state lives in Zustand so any button
 * anywhere can open it without prop drilling.
 */
export function ProjectFormDialog() {
  const { open, projectId } = useUIStore((s) => s.projectDialog);
  const close = useUIStore((s) => s.closeProjectDialog);
  const project = useSelector((s) => (projectId ? selectProjectById(s, projectId) : null));
  const dispatch = useDispatch();
  const { user } = useAuth();
  const formId = useId(); // stable unique IDs for label ↔ input wiring

  const [values, setValues] = useState(EMPTY);
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Reset the form whenever the dialog opens for a (different) project.
  useEffect(() => {
    if (open) {
      setValues(project ? { name: project.name, description: project.description, dueDate: project.dueDate ?? "", color: project.color } : EMPTY);
      setTouched({});
    }
  }, [open, project]);

  // Derived state: errors are computed from values, never stored.
  const errors = validateProject(values);
  const isValid = Object.keys(errors).length === 0;

  const update = (field) => (e) => setValues((v) => ({ ...v, [field]: e.target.value }));
  const blur = (field) => () => setTouched((t) => ({ ...t, [field]: true }));

  async function onSubmit(e) {
    e.preventDefault();
    setTouched({ name: true, description: true });
    if (!isValid) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 250)); // pretend network
    const data = { ...values, name: values.name.trim(), dueDate: values.dueDate || null };
    if (project) {
      dispatch(projectUpdated({ id: project.id, changes: data, actor: user?.name }));
      toast.success("Project updated");
    } else {
      dispatch(projectAdded({ ...data, ownerId: user?.id, actor: user?.name }));
      toast.success(`Created “${data.name}”`);
    }
    setSubmitting(false);
    close();
  }

  const fieldError = (f) => touched[f] && errors[f];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{project ? "Edit project" : "New project"}</DialogTitle>
          <DialogDescription>Projects group a board of columns and tasks.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor={`${formId}-name`}>Name</Label>
            <Input
              id={`${formId}-name`}
              value={values.name}
              onChange={update("name")}
              onBlur={blur("name")}
              aria-invalid={!!fieldError("name")}
              aria-describedby={fieldError("name") ? `${formId}-name-err` : undefined}
              autoFocus
            />
            {fieldError("name") && <p id={`${formId}-name-err`} className="text-xs text-destructive">{errors.name}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${formId}-desc`}>Description</Label>
            <Textarea
              id={`${formId}-desc`}
              rows={3}
              value={values.description}
              onChange={update("description")}
              onBlur={blur("description")}
              aria-invalid={!!fieldError("description")}
            />
            <div className="flex justify-between text-xs">
              <span className="text-destructive">{fieldError("description")}</span>
              <span className="text-muted-foreground">{values.description.length}/300</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor={`${formId}-due`}>Due date</Label>
              <Input id={`${formId}-due`} type="date" value={values.dueDate} onChange={update("dueDate")} />
            </div>
            <fieldset className="space-y-1.5">
              <legend className="text-sm font-medium">Color</legend>
              <div className="flex gap-1.5 pt-1.5">
                {PROJECT_COLORS.map((c) => (
                  <button
                    type="button"
                    key={c}
                    aria-label={`Color ${c}`}
                    aria-pressed={values.color === c}
                    onClick={() => setValues((v) => ({ ...v, color: c }))}
                    className={cn("grid size-7 place-items-center rounded border", values.color === c && "ring-2 ring-ring")}
                  >
                    <ColorDot color={c} className="size-4" />
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={close}>Cancel</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : project ? "Save changes" : "Create project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
