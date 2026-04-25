import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateWorkspace } from "@/features/workspaces/hooks/useCreateWorkspace";

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const createWorkspaceSchema = z.object({
  name: z.string().min(1, "Workspace name is required."),
  slug: z
    .string()
    .min(1, "Slug is required.")
    .regex(/^[a-z0-9-]+$/, "Slug can include lowercase letters, numbers, and hyphens only."),
});

type CreateWorkspaceFormValues = z.infer<typeof createWorkspaceSchema>;

interface CreateWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateWorkspaceDialog({ open, onOpenChange }: CreateWorkspaceDialogProps): React.JSX.Element {
  const createWorkspaceMutation = useCreateWorkspace();

  const form = useForm<CreateWorkspaceFormValues>({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: {
      name: "",
      slug: "",
    },
  });

  const nameValue = form.watch("name");
  const slugValue = form.watch("slug");

  useEffect(() => {
    const hasEditedSlug = Boolean(form.formState.dirtyFields.slug);
    if (!hasEditedSlug) {
      form.setValue("slug", slugify(nameValue), { shouldValidate: true });
    }
  }, [form, nameValue]);

  const onSubmit = form.handleSubmit((values) => {
    createWorkspaceMutation.mutate(
      {
        name: values.name,
        slug: values.slug,
      },
      {
        onSuccess: () => {
          form.reset({ name: "", slug: "" });
          onOpenChange(false);
        },
      },
    );
  });

  const handleCancel = (): void => {
    if (!createWorkspaceMutation.isPending) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create workspace</DialogTitle>
          <DialogDescription>Set up a new workspace for your Instagram DM AI team.</DialogDescription>
        </DialogHeader>
        <form id="create-workspace-dialog-form" className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="name">Workspace name</Label>
            <Input id="name" placeholder="Acme Support" {...form.register("name")} />
            {form.formState.errors.name ? (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            ) : null}
            <p className="text-xs text-muted-foreground">Slug preview: {slugValue || "workspace-slug"}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Workspace slug</Label>
            <Input id="slug" placeholder="acme-support" {...form.register("slug")} />
            {form.formState.errors.slug ? (
              <p className="text-xs text-destructive">{form.formState.errors.slug.message}</p>
            ) : null}
          </div>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCancel} disabled={createWorkspaceMutation.isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-workspace-dialog-form"
            disabled={createWorkspaceMutation.isPending}
          >
            {createWorkspaceMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {createWorkspaceMutation.isPending ? "Creating..." : "Create workspace"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
