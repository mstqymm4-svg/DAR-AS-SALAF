import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { execSync } from "child_process";
import app from "../src/app";
import { prisma } from "../src/config/prisma";
import { hashPassword } from "../src/utils/hash";

const api = request(app);
const tokens: Record<string, string> = {};
let userRefresh = "";

async function login(email: string, password: string) {
  const r = await api.post("/api/auth/login").send({ email, password });
  expect(r.status).toBe(200);
  return r.body.data;
}

beforeAll(async () => {
  execSync("npx prisma migrate reset --force --skip-seed --skip-generate", {
    env: process.env,
    stdio: "ignore",
  });
  const pw = await hashPassword("Passw0rd!x");
  await prisma.user.createMany({
    data: [
      { email: "super@test.local", passwordHash: pw, role: "SUPER_ADMIN" },
      { email: "admin@test.local", passwordHash: pw, role: "ADMIN" },
    ],
  });
  tokens.super = (await login("super@test.local", "Passw0rd!x")).accessToken;
  tokens.admin = (await login("admin@test.local", "Passw0rd!x")).accessToken;
});

afterAll(async () => {
  await prisma.$disconnect();
});

const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

describe("health", () => {
  it("reports database ok", async () => {
    const r = await api.get("/api/health");
    expect(r.status).toBe(200);
    expect(r.body.data.database).toBe("ok");
  });
});

describe("auth", () => {
  it("registers a USER without leaking the password hash", async () => {
    const r = await api.post("/api/auth/register").send({ email: "user@test.local", password: "Passw0rd!x", fullName: "Reader" });
    expect(r.status).toBe(201);
    expect(r.body.data.user.role).toBe("USER");
    expect(r.body.data.user.passwordHash).toBeUndefined();
    tokens.user = r.body.data.accessToken;
    userRefresh = r.body.data.refreshToken;
  });

  it("ignores a role field on registration", async () => {
    const r = await api.post("/api/auth/register").send({ email: "sneaky@test.local", password: "Passw0rd!x", role: "SUPER_ADMIN" });
    expect(r.status).toBe(201);
    expect(r.body.data.user.role).toBe("USER");
  });

  it("rejects wrong password and duplicate email", async () => {
    expect((await api.post("/api/auth/login").send({ email: "user@test.local", password: "wrongwrong" })).status).toBe(401);
    expect((await api.post("/api/auth/register").send({ email: "user@test.local", password: "Passw0rd!x" })).status).toBe(409);
  });

  it("rotates refresh tokens and rejects reuse", async () => {
    const r1 = await api.post("/api/auth/refresh").send({ refreshToken: userRefresh });
    expect(r1.status).toBe(200);
    const reuse = await api.post("/api/auth/refresh").send({ refreshToken: userRefresh });
    expect(reuse.status).toBe(401);
    // logout revokes the new token
    await api.post("/api/auth/logout").send({ refreshToken: r1.body.data.refreshToken });
    expect((await api.post("/api/auth/refresh").send({ refreshToken: r1.body.data.refreshToken })).status).toBe(401);
  });

  it("/me requires a token", async () => {
    expect((await api.get("/api/auth/me")).status).toBe(401);
    const r = await api.get("/api/auth/me").set(auth(tokens.user));
    expect(r.status).toBe(200);
    expect(r.body.data.email).toBe("user@test.local");
  });
});

// Every write route in each content group: anonymous → 401, USER → 403, ADMIN → allowed.
const groups: Array<[string, Record<string, unknown>]> = [
  ["books", { title: "كتاب تجريبي", status: "published" }],
  ["categories", { name: "العقيدة" }],
  ["authors", { name: "مؤلف" }],
  ["videos", { title: "درس", youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }],
  ["video-channels", { name: "قناة" }],
  ["social-channels", { name: "تلغرام", url: "https://t.me/example", channelType: "telegram" }],
];

describe("role matrix for content routes", () => {
  for (const [path, body] of groups) {
    it(`${path}: public GET works, writes need ADMIN`, async () => {
      expect((await api.get(`/api/${path}`)).status).toBe(200);
      expect((await api.post(`/api/${path}`).send(body)).status).toBe(401);
      expect((await api.post(`/api/${path}`).set(auth(tokens.user)).send(body)).status).toBe(403);
      const created = await api.post(`/api/${path}`).set(auth(tokens.admin)).send(body);
      expect(created.status, JSON.stringify(created.body)).toBe(201);
      const id = created.body.data.id;
      expect((await api.put(`/api/${path}/${id}`).set(auth(tokens.user)).send(body)).status).toBe(403);
      expect((await api.put(`/api/${path}/${id}`).set(auth(tokens.admin)).send(body)).status).toBe(200);
      expect((await api.delete(`/api/${path}/${id}`)).status).toBe(401);
      expect((await api.delete(`/api/${path}/${id}`).set(auth(tokens.user))).status).toBe(403);
      expect((await api.delete(`/api/${path}/${id}`).set(auth(tokens.admin))).status).toBe(200);
    });
  }
});

describe("drafts and hidden items never leak publicly", () => {
  it("draft book hidden from anonymous list/get, visible to admin", async () => {
    const d = await api.post("/api/books").set(auth(tokens.admin)).send({ title: "مسودة", status: "draft" });
    const id = d.body.data.id;
    const pub = await api.get("/api/books");
    expect(pub.body.data.find((b: any) => b.id === id)).toBeUndefined();
    expect((await api.get("/api/books?status=draft")).body.data.length).toBe(0);
    expect((await api.get(`/api/books/${id}`)).status).toBe(404);
    expect((await api.get(`/api/books/${id}`).set(auth(tokens.user))).status).toBe(404);
    expect((await api.get(`/api/books/${id}`).set(auth(tokens.admin))).status).toBe(200);
  });

  it("hidden video excluded publicly", async () => {
    const v = await api.post("/api/videos").set(auth(tokens.admin)).send({ title: "مخفي", visible: false });
    expect(v.status).toBe(201);
    const pub = await api.get("/api/videos");
    expect(pub.body.data.find((x: any) => x.id === v.body.data.id)).toBeUndefined();
  });
});

describe("favorites (per user)", () => {
  it("requires auth and is idempotent", async () => {
    const b = await api.post("/api/books").set(auth(tokens.admin)).send({ title: "مفضل", status: "published" });
    const id = b.body.data.id;
    expect((await api.post(`/api/favorites/${id}`)).status).toBe(401);
    expect((await api.post(`/api/favorites/${id}`).set(auth(tokens.user))).status).toBeLessThan(300);
    expect((await api.post(`/api/favorites/${id}`).set(auth(tokens.user))).status).toBeLessThan(300);
    const ids = await api.get("/api/favorites/ids").set(auth(tokens.user));
    expect(ids.body.data).toEqual([id]);
    expect((await api.delete(`/api/favorites/${id}`).set(auth(tokens.user))).status).toBe(200);
  });
});

describe("settings", () => {
  it("public read, admin write", async () => {
    const body = { key: "primary_color", value: "#0d3b2e", type: "color" };
    expect((await api.put("/api/settings").set(auth(tokens.user)).send(body)).status).toBe(403);
    expect((await api.put("/api/settings").set(auth(tokens.admin)).send(body)).status).toBe(200);
    const r = await api.get("/api/settings");
    expect(r.body.data.primary_color.value).toBe("#0d3b2e");
  });
});

describe("users admin", () => {
  it("USER cannot list users; ADMIN can, without hashes", async () => {
    expect((await api.get("/api/users").set(auth(tokens.user))).status).toBe(403);
    const r = await api.get("/api/users").set(auth(tokens.admin));
    expect(r.status).toBe(200);
    expect(r.body.data.every((u: any) => u.passwordHash === undefined)).toBe(true);
  });

  it("ADMIN cannot escalate roles; SUPER_ADMIN can", async () => {
    const me = await api.get("/api/auth/me").set(auth(tokens.admin));
    expect((await api.put(`/api/users/${me.body.data.id}`).set(auth(tokens.admin)).send({ role: "SUPER_ADMIN" })).status).toBe(403);
    const u = await api.get("/api/auth/me").set(auth(tokens.user));
    expect((await api.put(`/api/users/${u.body.data.id}`).set(auth(tokens.super)).send({ role: "ADMIN" })).status).toBe(200);
    expect((await api.put(`/api/users/${u.body.data.id}`).set(auth(tokens.super)).send({ role: "GOD" })).status).toBe(400);
    await api.put(`/api/users/${u.body.data.id}`).set(auth(tokens.super)).send({ role: "USER" });
  });

  it("only SUPER_ADMIN can delete users", async () => {
    const s = await prisma.user.findUniqueOrThrow({ where: { email: "sneaky@test.local" } });
    expect((await api.delete(`/api/users/${s.id}`).set(auth(tokens.admin))).status).toBe(403);
    expect((await api.delete(`/api/users/${s.id}`).set(auth(tokens.super))).status).toBe(200);
  });
});

describe("uploads (local driver)", () => {
  it("rejects non-admin and unsupported types, accepts PDF for admin", async () => {
    const pdf = Buffer.from("%PDF-1.4\n%test\n");
    expect((await api.post("/api/uploads/books").set(auth(tokens.user)).attach("file", pdf, { filename: "a.pdf", contentType: "application/pdf" })).status).toBe(403);
    const bad = await api.post("/api/uploads/books").set(auth(tokens.admin)).attach("file", Buffer.from("MZ"), { filename: "a.exe", contentType: "application/x-msdownload" });
    expect(bad.status).toBe(415);
    const ok = await api.post("/api/uploads/books").set(auth(tokens.admin)).attach("file", pdf, { filename: "a.pdf", contentType: "application/pdf" });
    expect(ok.status).toBe(201);
    expect(ok.body.data.url).toMatch(/^\/uploads\/books\//);
    expect((await api.delete(`/api/uploads/${ok.body.data.mediaId}`).set(auth(tokens.admin))).status).toBe(200);
  });
});

describe("unknown routes", () => {
  it("404 JSON", async () => {
    const r = await api.get("/api/nope");
    expect(r.status).toBe(404);
    expect(r.body.success).toBe(false);
  });
});
