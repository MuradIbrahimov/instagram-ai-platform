"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Loader2 } from "lucide-react";
import { useDeleteDocument } from "@/hooks/use-knowledge";

interface DeleteDocumentDialogProps {
  documentId: string;
  documentTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteDocumentDialog({
  documentId,
  documentTitle,
  open,
  onOpenChange,
}: DeleteDocumentDialogProps) {
  const deleteDoc = useDeleteDocument();

  function handleConfirm() {
    deleteDoc.mutate(documentId, {
      onSuccess: () => onOpenChange(false),
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border p-6 shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-border)",
            color: "var(--color-foreground)",
          }}
          aria-describedby="delete-dialog-description"
        >
          <Dialog.Title className="text-base font-semibold">
            Delete this document?
          </Dialog.Title>
          <p
            id="delete-dialog-description"
            className="mt-2 text-sm"
            style={{ color: "var(--color-foreground-muted)" }}
          >
            <span className="block">
              <span
                className="font-medium"
                style={{ color: "var(--color-foreground)" }}
              >
                &ldquo;{documentTitle}&rdquo;
              </span>{" "}
              will be permanently deleted.
            </span>
            <span className="mt-1 block">
              This will remove all chunks and the AI will no longer use this
              knowledge.
            </span>
          </p>
          <div className="mt-5 flex justify-end gap-3">
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:opacity-80"
                style={{
                  borderColor: "var(--color-border)",
                  color: "var(--color-foreground)",
                }}
                disabled={deleteDoc.isPending}
              >
                Cancel
              </button>
            </Dialog.Close>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={deleteDoc.isPending}
              className="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60"
            >
              {deleteDoc.isPending && (
                <Loader2 className="size-3.5 animate-spin" />
              )}
              Delete
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

