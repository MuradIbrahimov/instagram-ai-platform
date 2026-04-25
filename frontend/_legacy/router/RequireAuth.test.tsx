import { describe, expect, it, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { RequireAuth } from "@/router/RequireAuth";
import { useAuthStore } from "@/stores/auth.store";

describe("RequireAuth", () => {
  beforeEach(async () => {
    window.localStorage.clear();
    useAuthStore.setState({
      user: null,
      token: null,
      workspaces: [],
      activeWorkspaceId: null,
    });
    await useAuthStore.persist.rehydrate();
  });

  it("redirects to login when unauthenticated", async () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route
              path="/"
              element={
                <RequireAuth>
                  <div>Private page</div>
                </RequireAuth>
              }
            />
            <Route path="/login" element={<div>Login page</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Login page")).toBeInTheDocument();
    });
  });
});
