"use client";

import { useState, useId } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
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
import { useCreateAccount } from "@/hooks/use-instagram";
import { ApiError } from "@/lib/api";

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  instagram_account_id: z
    .string()
    .min(5, "Account ID must be at least 5 characters")
    .regex(/^\d+$/, "Account ID must be a numeric string"),
  instagram_username: z
    .string()
    .min(1, "Username is required")
    .transform((v) => v.replace(/^@/, "")),
  access_token: z.string().min(20, "Token must be at least 20 characters"),
  page_name: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

// ─── AddAccountModal ──────────────────────────────────────────────────────────

interface AddAccountModalProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
}

export function AddAccountModal({
  open,
  onClose,
  workspaceId,
}: AddAccountModalProps) {
  const [showToken, setShowToken] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const createMutation = useCreateAccount(workspaceId);

  const idFieldId = useId();
  const usernameFieldId = useId();
  const tokenFieldId = useId();
  const pageNameFieldId = useId();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      instagram_account_id: "",
      instagram_username: "",
      access_token: "",
      page_name: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setFormError(null);
    try {
      await createMutation.mutateAsync({
        instagram_account_id: values.instagram_account_id,
        instagram_username: values.instagram_username,
        access_token: values.access_token,
        page_name: values.page_name || undefined,
      });
      reset();
      onClose();
      toast.success("Instagram account connected successfully.");
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
      setShowToken(false);
      onClose();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Connect Instagram Account</DialogTitle>
          <DialogDescription>
            Add an Instagram account to this workspace. You can find your
            Account ID in the Meta Business Suite.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-4 pt-2"
        >
          {/* Instagram Account ID */}
          <div className="space-y-1.5">
            <Label htmlFor={idFieldId}>Instagram Account ID</Label>
            <Input
              id={idFieldId}
              type="text"
              placeholder="123456789012345"
              error={Boolean(errors.instagram_account_id)}
              {...register("instagram_account_id")}
            />
            {errors.instagram_account_id ? (
              <p className="text-xs" style={{ color: "var(--color-danger)" }}>
                {errors.instagram_account_id.message}
              </p>
            ) : (
              <p
                className="text-xs"
                style={{ color: "var(--color-foreground-muted)" }}
              >
                Found in Meta Business Suite → Settings → Instagram Accounts.
              </p>
            )}
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <Label htmlFor={usernameFieldId}>Instagram Username</Label>
            <Input
              id={usernameFieldId}
              type="text"
              placeholder="@yourbrand"
              error={Boolean(errors.instagram_username)}
              {...register("instagram_username")}
            />
            {errors.instagram_username && (
              <p className="text-xs" style={{ color: "var(--color-danger)" }}>
                {errors.instagram_username.message}
              </p>
            )}
          </div>

          {/* Access Token */}
          <div className="space-y-1.5">
            <Label htmlFor={tokenFieldId}>Access Token</Label>
            <div className="relative">
              <Input
                id={tokenFieldId}
                type={showToken ? "text" : "password"}
                placeholder="EAABx..."
                error={Boolean(errors.access_token)}
                className="pr-10"
                {...register("access_token")}
              />
              <button
                type="button"
                onClick={() => setShowToken((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-hover"
                tabIndex={-1}
              >
                {showToken ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {errors.access_token ? (
              <p className="text-xs" style={{ color: "var(--color-danger)" }}>
                {errors.access_token.message}
              </p>
            ) : (
              <p
                className="text-xs"
                style={{ color: "var(--color-foreground-muted)" }}
              >
                Get this from your Meta App → Instagram → Generate Token.
              </p>
            )}
          </div>

          {/* Page Name (optional) */}
          <div className="space-y-1.5">
            <Label htmlFor={pageNameFieldId}>
              Page Name{" "}
              <span style={{ color: "var(--color-foreground-muted)" }}>
                (optional)
              </span>
            </Label>
            <Input
              id={pageNameFieldId}
              type="text"
              placeholder="My Brand Page"
              {...register("page_name")}
            />
          </div>

          {/* Form error */}
          {formError && (
            <p
              className="rounded-md border px-3 py-2 text-sm"
              style={{
                color: "var(--color-danger)",
                borderColor: "var(--color-danger)",
                background: "color-mix(in srgb, var(--color-danger) 10%, transparent)",
              }}
            >
              {formError}
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              loading={isSubmitting || createMutation.isPending}
            >
              Connect Account
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
