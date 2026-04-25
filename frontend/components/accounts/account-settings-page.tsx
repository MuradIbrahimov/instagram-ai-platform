"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { formatDistanceToNow } from "date-fns";
import { Loader2, RefreshCw, Eye } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUpdateAccount, useSyncAccount } from "@/hooks/use-instagram";
import { ApiError } from "@/lib/api";
import type { InstagramAccount, ReplyMode, UpdateInstagramAccountData } from "@/types/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AiFormValues {
  auto_reply_enabled: boolean;
  reply_mode: ReplyMode;
  confidence_threshold: number;
}

// ─── Reply Mode Segmented Control ─────────────────────────────────────────────

const REPLY_MODES: Array<{
  value: ReplyMode;
  label: string;
  description: string;
}> = [
  {
    value: "automatic",
    label: "Automatic",
    description: "AI sends replies immediately.",
  },
  {
    value: "approval_required",
    label: "Needs Approval",
    description: "AI drafts replies — you approve before sending.",
  },
  {
    value: "human_only",
    label: "Human Only",
    description: "AI is disabled. All replies manual.",
  },
];

function ReplyModeControl({
  value,
  onChange,
}: {
  value: ReplyMode;
  onChange: (v: ReplyMode) => void;
}) {
  return (
    <div className="space-y-2">
      <div
        className="inline-flex rounded-md border p-0.5"
        style={{
          borderColor: "var(--color-border)",
          background: "color-mix(in srgb, var(--color-surface) 50%, transparent)",
        }}
      >
        {REPLY_MODES.map((mode) => (
          <button
            key={mode.value}
            type="button"
            onClick={() => onChange(mode.value)}
            className={cn(
              "rounded px-3 py-1.5 text-xs font-medium transition-colors",
            )}
            style={
              value === mode.value
                ? {
                    background: "var(--color-accent)",
                    color: "#fff",
                  }
                : {
                    background: "transparent",
                    color: "var(--color-foreground-muted)",
                  }
            }
          >
            {mode.label}
          </button>
        ))}
      </div>
      {/* Description for the selected mode */}
      <p className="text-xs" style={{ color: "var(--color-foreground-muted)" }}>
        {REPLY_MODES.find((m) => m.value === value)?.description}
      </p>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-card border p-6 space-y-5"
      style={{
        background: "var(--color-surface)",
        borderColor: "var(--color-border)",
      }}
    >
      <h2
        className="text-sm font-semibold uppercase tracking-widest"
        style={{ color: "var(--color-foreground-muted)" }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span
        className="text-sm pt-0.5 shrink-0"
        style={{ color: "var(--color-foreground-muted)" }}
      >
        {label}
      </span>
      <div className="text-right">{children}</div>
    </div>
  );
}

// ─── Replace Token ────────────────────────────────────────────────────────────

function ReplaceTokenField({
  onSave,
  isSaving,
}: {
  onSave: (token: string) => void;
  isSaving: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <span
          className="font-mono text-sm"
          style={{ color: "var(--color-foreground-muted)" }}
        >
          ••••••••••••
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setEditing(true)}
        >
          Replace token
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="password"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="New access token..."
        autoFocus
        className="h-8 rounded-md border px-2 text-sm w-48 bg-transparent focus:outline-none"
        style={{
          borderColor: "var(--color-border)",
          color: "var(--color-foreground)",
        }}
      />
      <Button
        type="button"
        size="sm"
        loading={isSaving}
        disabled={value.length < 20}
        onClick={() => {
          onSave(value);
          setEditing(false);
          setValue("");
        }}
      >
        Save
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => {
          setEditing(false);
          setValue("");
        }}
      >
        Cancel
      </Button>
    </div>
  );
}

// ─── AccountSettingsPage ──────────────────────────────────────────────────────

interface AccountSettingsPageProps {
  account: InstagramAccount;
  workspaceId: string;
}

export function AccountSettingsPage({
  account,
  workspaceId,
}: AccountSettingsPageProps) {
  const updateMutation = useUpdateAccount(workspaceId);
  const syncMutation = useSyncAccount(workspaceId);

  // ── AI Settings form ──────────────────────────────────────────────────────

  const defaultValues: AiFormValues = {
    auto_reply_enabled: account.auto_reply_enabled,
    reply_mode: account.reply_mode,
    confidence_threshold: account.confidence_threshold,
  };

  const { control, handleSubmit, watch, reset, formState } =
    useForm<AiFormValues>({ defaultValues });

  // Reset when account data changes (e.g. after re-fetch)
  useEffect(() => {
    reset({
      auto_reply_enabled: account.auto_reply_enabled,
      reply_mode: account.reply_mode,
      confidence_threshold: account.confidence_threshold,
    });
  }, [account, reset]);

  const isDirty = formState.isDirty;
  const auto_reply_enabled = watch("auto_reply_enabled");
  const confidence_threshold = watch("confidence_threshold");

  async function onSaveAi(values: AiFormValues) {
    try {
      await updateMutation.mutateAsync({
        accountId: account.id,
        data: values,
      });
      toast.success("Settings saved.");
      reset(values); // mark clean
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to save settings.");
      }
    }
  }

  // ── is_active toggle (immediate, not form) ────────────────────────────────

  function handleToggleActive(checked: boolean) {
    updateMutation.mutate(
      { accountId: account.id, data: { is_active: checked } },
      {
        onSuccess: () =>
          toast.success(checked ? "Account activated." : "Account deactivated."),
        onError: () => toast.error("Failed to update account status."),
      },
    );
  }

  // ── Replace token ─────────────────────────────────────────────────────────

  function handleReplaceToken(token: string) {
    updateMutation.mutate(
      { accountId: account.id, data: { access_token: token } },
      {
        onSuccess: () => toast.success("Access token updated."),
        onError: () => toast.error("Failed to update token."),
      },
    );
  }

  // ── Sync ──────────────────────────────────────────────────────────────────

  function handleSync() {
    syncMutation.mutate(account.id, {
      onSuccess: () => toast.success("Account synced successfully."),
      onError: () => toast.error("Sync failed. Please try again."),
    });
  }

  return (
    <TooltipProvider>
      <div className="max-w-2xl space-y-6">
        {/* Page heading */}
        <div>
          <h1
            className="text-xl font-semibold"
            style={{ color: "var(--color-foreground)" }}
          >
            @{account.instagram_username}
          </h1>
          {account.page_name && (
            <p
              className="text-sm mt-0.5"
              style={{ color: "var(--color-foreground-muted)" }}
            >
              {account.page_name}
            </p>
          )}
        </div>

        {/* ── Section 1: Account Info ────────────────────────────────────── */}
        <Section title="Account Info">
          <Row label="Username">
            <span
              className="text-sm font-medium"
              style={{ color: "var(--color-foreground)" }}
            >
              @{account.instagram_username}
            </span>
          </Row>

          {account.page_name && (
            <Row label="Page Name">
              <span
                className="text-sm"
                style={{ color: "var(--color-foreground)" }}
              >
                {account.page_name}
              </span>
            </Row>
          )}

          <Row label="Account ID">
            <span
              className="font-mono text-xs rounded px-1.5 py-0.5"
              style={{
                background: "color-mix(in srgb, var(--color-border) 50%, transparent)",
                color: "var(--color-foreground-muted)",
              }}
            >
              {account.id}
            </span>
          </Row>

          <Row label="Last Synced">
            <span
              className="text-sm"
              style={{ color: "var(--color-foreground-muted)" }}
            >
              {account.last_synced_at
                ? formatDistanceToNow(new Date(account.last_synced_at), {
                    addSuffix: true,
                  })
                : "Never"}
            </span>
          </Row>

          <Row label="Access Token">
            <ReplaceTokenField
              onSave={handleReplaceToken}
              isSaving={updateMutation.isPending}
            />
          </Row>

          <div className="flex items-center justify-between pt-1">
            <div className="space-y-0.5">
              <Label className="text-sm">Account Active</Label>
              <p
                className="text-xs"
                style={{ color: "var(--color-foreground-muted)" }}
              >
                Enables receiving and sending messages.
              </p>
            </div>
            <Switch
              checked={account.is_active}
              onCheckedChange={handleToggleActive}
              disabled={updateMutation.isPending}
            />
          </div>

          <div className="pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={syncMutation.isPending}
            >
              {syncMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RefreshCw className="size-3.5" />
              )}
              {syncMutation.isPending ? "Syncing…" : "Sync Now"}
            </Button>
          </div>
        </Section>

        {/* ── Section 2: AI Reply Settings ──────────────────────────────── */}
        <Section title="AI Reply Settings">
          <form onSubmit={handleSubmit(onSaveAi)} className="space-y-5">
            {/* Auto-reply toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm">Auto-reply Enabled</Label>
                <p
                  className="text-xs"
                  style={{ color: "var(--color-foreground-muted)" }}
                >
                  Let the AI respond to incoming messages automatically.
                </p>
              </div>
              <Controller
                name="auto_reply_enabled"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>

            {/* Reply mode */}
            <div className="space-y-2">
              <Label className="text-sm">Reply Mode</Label>
              <Controller
                name="reply_mode"
                control={control}
                render={({ field }) => (
                  <ReplyModeControl
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>

            {/* Confidence threshold */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">
                  Escalate to human if AI confidence is below
                </Label>
                <span
                  className="text-sm font-semibold tabular-nums"
                  style={{ color: "var(--color-accent)" }}
                >
                  {Math.round(confidence_threshold * 100)}%
                </span>
              </div>
              <Controller
                name="confidence_threshold"
                control={control}
                render={({ field }) => (
                  <input
                    type="range"
                    min={0.5}
                    max={1.0}
                    step={0.05}
                    value={field.value}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    className="w-full accent-[var(--color-accent)]"
                    disabled={!auto_reply_enabled}
                  />
                )}
              />
              <div className="flex justify-between text-xs" style={{ color: "var(--color-foreground-muted)" }}>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Business hours only — coming soon */}
            <div className="flex items-center justify-between opacity-60">
              <div className="space-y-0.5">
                <Label className="text-sm">Business Hours Only</Label>
                <p
                  className="text-xs"
                  style={{ color: "var(--color-foreground-muted)" }}
                >
                  Only auto-reply during configured business hours.
                </p>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Switch checked={false} disabled />
                  </span>
                </TooltipTrigger>
                <TooltipContent>Coming soon</TooltipContent>
              </Tooltip>
            </div>

            {/* Save button */}
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                size="sm"
                disabled={!isDirty}
                loading={updateMutation.isPending && formState.isSubmitting}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </Section>
      </div>
    </TooltipProvider>
  );
}
