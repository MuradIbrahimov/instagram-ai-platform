"use client";

import { useState, useId } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateWorkspace } from "@/hooks/use-workspaces";
import { ApiError } from "@/lib/api";

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  name: z.string().min(2, "Workspace name must be at least 2 characters"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers, and hyphens"),
});

type FormValues = z.infer<typeof schema>;

// ─── Slug Generator ───────────────────────────────────────────────────────────

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ─── Component ────────────────────────────────────────────────────────────────

interface CreateWorkspaceModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateWorkspaceModal({
  open,
  onClose,
}: CreateWorkspaceModalProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const createMutation = useCreateWorkspace();
  const nameId = useId();
  const slugId = useId();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", slug: "" },
  });

  const slugValue = watch("slug");

  // Update slug in real-time as name changes (unless user has manually edited it)
  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.value;
    // Only auto-generate if slug matches the previous auto-generated value
    // (i.e. user hasn't manually edited it)
    const currentSlug = watch("slug");
    const prevAutoSlug = toSlug(watch("name") ?? "");
    if (currentSlug === prevAutoSlug || currentSlug === "") {
      setValue("slug", toSlug(name));
    }
  }

  async function onSubmit(values: FormValues) {
    setFormError(null);
    try {
      await createMutation.mutateAsync(values);
      reset();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message);
      } else {
        setFormError("An unexpected error occurred. Please try again.");
      }
    }
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      reset();
      setFormError(null);
      onClose();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create workspace</DialogTitle>
          <DialogDescription>
            Workspaces let you manage separate brands or clients independently.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor={nameId}>Workspace name</Label>
            <Input
              id={nameId}
              type="text"
              autoFocus
              placeholder="Acme Brand"
              error={Boolean(errors.name)}
              {...register("name", {
                onChange: handleNameChange,
              })}
            />
            {errors.name && (
              <p className="text-xs" style={{ color: "var(--color-danger)" }}>
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <Label htmlFor={slugId}>Slug</Label>
            <Input
              id={slugId}
              type="text"
              placeholder="acme-brand"
              className="font-mono"
              error={Boolean(errors.slug)}
              {...register("slug")}
            />
            {slugValue && !errors.slug && (
              <p
                className="text-xs font-mono"
                style={{ color: "var(--color-foreground-muted)" }}
              >
                replyr.app/{slugValue}
              </p>
            )}
            {errors.slug && (
              <p className="text-xs" style={{ color: "var(--color-danger)" }}>
                {errors.slug.message}
              </p>
            )}
          </div>

          {/* Form error */}
          {formError && (
            <div
              className="rounded-md border px-3 py-2 text-sm"
              style={{
                background:
                  "color-mix(in srgb, var(--color-danger) 10%, transparent)",
                borderColor:
                  "color-mix(in srgb, var(--color-danger) 30%, transparent)",
                color: "var(--color-danger)",
              }}
            >
              {formError}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={onClose}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="md"
              loading={createMutation.isPending}
            >
              Create workspace
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
