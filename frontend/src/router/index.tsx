import { lazy, Suspense, useMemo } from "react";
import { createBrowserRouter, Outlet, useLocation } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { RouteSkeleton } from "@/components/layout/RouteSkeleton";
import { RequireAuth } from "@/router/RequireAuth";
import { RouteErrorBoundary } from "@/router/RouteErrorBoundary";

const LoginPage = lazy(() => import("@/features/auth/LoginPage").then((module) => ({ default: module.LoginPage })));
const RegisterPage = lazy(() =>
  import("@/features/auth/RegisterPage").then((module) => ({ default: module.RegisterPage })),
);
const HomePage = lazy(() => import("@/features/dashboard/pages/HomePage").then((module) => ({ default: module.HomePage })));
const WorkspacesPage = lazy(() =>
  import("@/features/workspaces/WorkspacesPage").then((module) => ({ default: module.WorkspacesPage })),
);
const ConversationsPage = lazy(() =>
  import("@/features/conversations/pages/ConversationsPage").then((module) => ({ default: module.ConversationsPage })),
);
const ConversationDetailPage = lazy(() =>
  import("@/features/conversations/pages/ConversationDetailPage").then((module) => ({ default: module.ConversationDetailPage })),
);
const InstagramPage = lazy(() =>
  import("@/features/instagram/pages/InstagramPage").then((module) => ({ default: module.InstagramPage })),
);
const KnowledgePage = lazy(() =>
  import("@/features/knowledge/pages/KnowledgePage").then((module) => ({ default: module.KnowledgePage })),
);
const SettingsPage = lazy(() =>
  import("@/features/settings/pages/SettingsPage").then((module) => ({ default: module.SettingsPage })),
);
const RootRedirect = lazy(() =>
  import("@/pages/RootRedirect").then((module) => ({ default: module.RootRedirect })),
);

function LazyRoute({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <Suspense fallback={<RouteSkeleton />}>{children}</Suspense>;
}

function PublicLayout(): React.JSX.Element {
  return <AuthLayout />;
}

const titlePatterns: Array<{ match: RegExp; title: string }> = [
  { match: /^\/workspaces$/, title: "Workspaces" },
  { match: /^\/workspaces\/new$/, title: "Workspaces" },
  { match: /^\/w\/[^/]+\/conversations$/, title: "Conversations" },
  { match: /^\/w\/[^/]+\/conversations\/[^/]+$/, title: "Conversation" },
  { match: /^\/w\/[^/]+\/instagram$/, title: "Instagram" },
  { match: /^\/w\/[^/]+\/knowledge$/, title: "Knowledge" },
  { match: /^\/w\/[^/]+\/settings$/, title: "Settings" },
];

function ProtectedLayout(): React.JSX.Element {
  const location = useLocation();

  const pageTitle = useMemo(() => {
    const match = titlePatterns.find((item) => item.match.test(location.pathname));
    return match?.title ?? "Dashboard";
  }, [location.pathname]);

  return (
    <RequireAuth>
      <AppShell pageTitle={pageTitle}>
        <Outlet />
      </AppShell>
    </RequireAuth>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: "/login",
        element: (
          <LazyRoute>
            <LoginPage />
          </LazyRoute>
        ),
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: "/register",
        element: (
          <LazyRoute>
            <RegisterPage />
          </LazyRoute>
        ),
        errorElement: <RouteErrorBoundary />,
      },
    ],
  },
  {
    path: "/",
    element: <ProtectedLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        index: true,
        element: (
          <LazyRoute>
            <RootRedirect />
          </LazyRoute>
        ),
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: "workspaces",
        element: (
          <LazyRoute>
            <WorkspacesPage />
          </LazyRoute>
        ),
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: "workspaces/new",
        element: (
          <LazyRoute>
            <WorkspacesPage />
          </LazyRoute>
        ),
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: "w/:workspaceId/conversations",
        element: (
          <LazyRoute>
            <ConversationsPage />
          </LazyRoute>
        ),
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: "w/:workspaceId/conversations/:conversationId",
        element: (
          <LazyRoute>
            <ConversationDetailPage />
          </LazyRoute>
        ),
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: "w/:workspaceId/instagram",
        element: (
          <LazyRoute>
            <InstagramPage />
          </LazyRoute>
        ),
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: "w/:workspaceId/knowledge",
        element: (
          <LazyRoute>
            <KnowledgePage />
          </LazyRoute>
        ),
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: "w/:workspaceId/settings",
        element: (
          <LazyRoute>
            <SettingsPage />
          </LazyRoute>
        ),
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: "dashboard",
        element: (
          <LazyRoute>
            <HomePage />
          </LazyRoute>
        ),
        errorElement: <RouteErrorBoundary />,
      },
    ],
  },
]);
