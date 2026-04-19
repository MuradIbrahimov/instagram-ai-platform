import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { z } from "zod";

const API_URL = "http://localhost:8000/api/v1";

const userFixture = {
  id: "e7dcb114-77e2-4f56-9d8f-1b4cb6f2c201",
  email: "owner@example.com",
  full_name: "Workspace Owner",
  is_active: true,
  created_at: "2026-04-10T08:15:00Z",
};

const workspaceFixtures = [
  {
    id: "ce86b0ac-b0ea-4f3f-b261-7ecdf847e188",
    name: "Main Workspace",
    slug: "main-workspace",
    timezone: "UTC",
    auto_reply_enabled: true,
    created_at: "2026-04-10T09:00:00Z",
    role: "owner",
  },
];

const workspaceCreateSchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
});

export const handlers = [
  http.post(`${API_URL}/auth/login`, async () => {
    return HttpResponse.json({
      access_token: "test-token",
      token_type: "bearer",
      expires_in: 3600,
    });
  }),

  http.post(`${API_URL}/auth/register`, async () => {
    return HttpResponse.json(userFixture, { status: 201 });
  }),

  http.get(`${API_URL}/auth/me`, async () => {
    return HttpResponse.json(userFixture, { status: 200 });
  }),

  http.get(`${API_URL}/workspaces`, async () => {
    return HttpResponse.json(workspaceFixtures, { status: 200 });
  }),

  http.post(`${API_URL}/workspaces`, async ({ request }) => {
    const payload = workspaceCreateSchema.parse(await request.json());

    return HttpResponse.json(
      {
        id: "8b66d1f8-aea2-4ed4-b860-69899a3f2e6d",
        name: payload.name,
        slug: payload.slug ?? payload.name.toLowerCase().replace(/\s+/g, "-"),
        timezone: "UTC",
        auto_reply_enabled: true,
        created_at: "2026-04-10T09:05:00Z",
      },
      { status: 201 },
    );
  }),

  http.get(`${API_URL}/workspaces/:workspaceId`, async ({ params }) => {
    const workspace = workspaceFixtures.find((item) => item.id === params.workspaceId);

    if (!workspace) {
      return HttpResponse.json({ detail: "Workspace not found" }, { status: 404 });
    }

    const { role, ...workspaceOnly } = workspace;
    return HttpResponse.json(workspaceOnly, { status: 200 });
  }),
];

export const server = setupServer(...handlers);
