import * as React from "react";
import type { ToastAction, ToastVariant } from "@/components/ui/toast";

interface ToastItem {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  action?: React.ReactElement<typeof ToastAction>;
}

const TOAST_LIMIT = 4;
const TOAST_REMOVE_DELAY = 5000;

interface ToastState {
  toasts: ToastItem[];
}

type Action =
  | { type: "ADD_TOAST"; toast: ToastItem }
  | { type: "UPDATE_TOAST"; toast: Partial<ToastItem> & { id: string } }
  | { type: "DISMISS_TOAST"; toastId?: string }
  | { type: "REMOVE_TOAST"; toastId?: string };

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const reducer = (state: ToastState, action: Action): ToastState => {
  switch (action.type) {
    case "ADD_TOAST": {
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };
    }
    case "UPDATE_TOAST": {
      return {
        ...state,
        toasts: state.toasts.map((toast) =>
          toast.id === action.toast.id ? { ...toast, ...action.toast } : toast,
        ),
      };
    }
    case "DISMISS_TOAST": {
      const { toastId } = action;
      if (toastId) {
        const timeout = toastTimeouts.get(toastId);
        if (!timeout) {
          const newTimeout = setTimeout(() => {
            dispatch({ type: "REMOVE_TOAST", toastId });
          }, TOAST_REMOVE_DELAY);
          toastTimeouts.set(toastId, newTimeout);
        }
      } else {
        state.toasts.forEach((toast) => {
          const timeout = toastTimeouts.get(toast.id);
          if (!timeout) {
            const newTimeout = setTimeout(() => {
              dispatch({ type: "REMOVE_TOAST", toastId: toast.id });
            }, TOAST_REMOVE_DELAY);
            toastTimeouts.set(toast.id, newTimeout);
          }
        });
      }
      return {
        ...state,
        toasts: state.toasts.filter((toast) => (toastId ? toast.id !== toastId : false)),
      };
    }
    case "REMOVE_TOAST": {
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((toast) => toast.id !== action.toastId),
      };
    }
    default:
      return state;
  }
};

const listeners: Array<(state: ToastState) => void> = [];
let memoryState: ToastState = { toasts: [] };

function dispatch(action: Action): void {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

function genId(): string {
  return crypto.randomUUID();
}

interface ToastInput {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  action?: React.ReactElement<typeof ToastAction>;
}

export function toast(input: ToastInput): { id: string; dismiss: () => void } {
  const id = genId();

  dispatch({
    type: "ADD_TOAST",
    toast: {
      id,
      title: input.title,
      description: input.description,
      variant: input.variant,
      action: input.action,
    },
  });

  const timeout = setTimeout(() => {
    dispatch({ type: "REMOVE_TOAST", toastId: id });
  }, TOAST_REMOVE_DELAY);
  toastTimeouts.set(id, timeout);

  return {
    id,
    dismiss: () => dispatch({ type: "DISMISS_TOAST", toastId: id }),
  };
}

export function useToast(): {
  toasts: ToastItem[];
  toast: typeof toast;
  dismiss: (toastId?: string) => void;
} {
  const [state, setState] = React.useState<ToastState>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}
