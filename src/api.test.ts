import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Poll, PollResults } from "./types";

const mockFetch = vi.fn();

function jsonResponse<T>(body: T, init?: { ok?: boolean; status?: number; statusText?: string }) {
  const ok = init?.ok ?? true;
  return {
    ok,
    status: init?.status ?? (ok ? 200 : 400),
    statusText: init?.statusText ?? (ok ? "OK" : "Bad Request"),
    json: async () => body,
  } as Response;
}

describe("api", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  async function loadApi() {
    vi.resetModules();
    return import("./api");
  }

  it("listPolls fetches /polls from trimmed VITE_API_URL", async () => {
    vi.stubEnv("VITE_API_URL", "http://api.example.com/");
    const { listPolls } = await loadApi();
    const polls: Poll[] = [
      {
        id: "p1",
        question: "Q?",
        createdAt: "2026-01-01T00:00:00.000Z",
        accentColor: "orange",
        options: [],
      },
    ];
    mockFetch.mockResolvedValue(jsonResponse(polls));

    const result = await listPolls();

    expect(mockFetch).toHaveBeenCalledWith("http://api.example.com/polls");
    expect(result).toEqual(polls);
  });

  it("createPoll POSTs question and options", async () => {
    const { createPoll } = await loadApi();
    const poll: Poll = {
      id: "new",
      question: "Lunch?",
      createdAt: "2026-01-01T00:00:00.000Z",
      accentColor: "orange",
      options: [
        { id: "a", text: "Pizza", votes: 0 },
        { id: "b", text: "Salad", votes: 0 },
      ],
    };
    mockFetch.mockResolvedValue(jsonResponse(poll));

    const result = await createPoll("Lunch?", ["Pizza", "Salad"]);

    expect(mockFetch).toHaveBeenCalledWith("http://localhost:8080/polls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: "Lunch?", options: ["Pizza", "Salad"] }),
    });
    expect(result).toEqual(poll);
  });

  it("createPoll forwards selected accentColor when provided", async () => {
    const { createPoll } = await loadApi();
    const poll: Poll = {
      id: "new",
      question: "Lunch?",
      createdAt: "2026-01-01T00:00:00.000Z",
      accentColor: "violet",
      options: [
        { id: "a", text: "Pizza", votes: 0 },
        { id: "b", text: "Salad", votes: 0 },
      ],
    };
    mockFetch.mockResolvedValue(jsonResponse(poll));

    await createPoll("Lunch?", ["Pizza", "Salad"], "violet");

    expect(mockFetch).toHaveBeenCalledWith("http://localhost:8080/polls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: "Lunch?",
        options: ["Pizza", "Salad"],
        accentColor: "violet",
      }),
    });
  });

  it("getPoll encodes poll id in URL", async () => {
    const { getPoll } = await loadApi();
    const poll: Poll = {
      id: "poll/id",
      question: "Q?",
      createdAt: "2026-01-01T00:00:00.000Z",
      accentColor: "orange",
      options: [],
    };
    mockFetch.mockResolvedValue(jsonResponse(poll));

    await getPoll("poll/id");

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/polls/poll%2Fid",
    );
  });

  it("vote POSTs optionId and x-voter-id header to vote endpoint", async () => {
    localStorage.setItem("polopine:voter-id", "voter-fixture-1");
    const { vote } = await loadApi();
    const poll: Poll = {
      id: "p1",
      question: "Q?",
      createdAt: "2026-01-01T00:00:00.000Z",
      accentColor: "orange",
      options: [{ id: "opt-1", text: "A", votes: 1 }],
    };
    mockFetch.mockResolvedValue(jsonResponse(poll));

    await vote("p1", "opt-1");

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/polls/p1/vote",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-voter-id": "voter-fixture-1",
        },
        body: JSON.stringify({ optionId: "opt-1" }),
      },
    );
  });

  it("vote mints a voter id when none is in storage", async () => {
    const { vote } = await loadApi();
    const poll: Poll = {
      id: "p1",
      question: "Q?",
      createdAt: "2026-01-01T00:00:00.000Z",
      accentColor: "orange",
      options: [{ id: "opt-1", text: "A", votes: 1 }],
    };
    mockFetch.mockResolvedValue(jsonResponse(poll));

    expect(localStorage.getItem("polopine:voter-id")).toBeNull();
    await vote("p1", "opt-1");

    const minted = localStorage.getItem("polopine:voter-id");
    expect(minted).toBeTruthy();
    const call = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = call[1].headers as Record<string, string>;
    expect(headers["x-voter-id"]).toBe(minted);
  });

  it("getPollResults fetches results endpoint", async () => {
    const { getPollResults } = await loadApi();
    const results: PollResults = {
      question: "Q?",
      totalVotes: 0,
      accentColor: "orange",
      options: [],
    };
    mockFetch.mockResolvedValue(jsonResponse(results));

    const result = await getPollResults("p1");

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/polls/p1/results",
    );
    expect(result).toEqual(results);
  });

  it("adminDeletePoll sends DELETE with x-admin-key", async () => {
    const { adminDeletePoll } = await loadApi();
    mockFetch.mockResolvedValue(jsonResponse(null, { ok: true, status: 204 }));

    await adminDeletePoll("p1", "secret-key");

    expect(mockFetch).toHaveBeenCalledWith("http://localhost:8080/polls/p1", {
      method: "DELETE",
      headers: { "x-admin-key": "secret-key" },
    });
  });

  it("adminResetPollVotes POSTs reset-votes with admin key", async () => {
    const { adminResetPollVotes } = await loadApi();
    const poll: Poll = {
      id: "p1",
      question: "Q?",
      createdAt: "2026-01-01T00:00:00.000Z",
      accentColor: "orange",
      options: [{ id: "a", text: "A", votes: 0 }],
    };
    mockFetch.mockResolvedValue(jsonResponse(poll));

    await adminResetPollVotes("p1", "secret-key");

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/polls/p1/reset-votes",
      {
        method: "POST",
        headers: { "x-admin-key": "secret-key" },
      },
    );
  });

  it("adminResetAll POSTs admin reset-all", async () => {
    const { adminResetAll } = await loadApi();
    mockFetch.mockResolvedValue(jsonResponse([]));

    await adminResetAll();

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/admin/reset-all",
      { method: "POST" },
    );
  });

  it("throws server error message from JSON body when present", async () => {
    const { getPoll } = await loadApi();
    mockFetch.mockResolvedValue(
      jsonResponse({ error: "Poll not found" }, {
        ok: false,
        status: 404,
        statusText: "Not Found",
      }),
    );

    await expect(getPoll("missing")).rejects.toThrow("Poll not found");
  });

  it("falls back to statusText when error body has no error field", async () => {
    const { getPoll } = await loadApi();
    mockFetch.mockResolvedValue(
      jsonResponse({}, {
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      }),
    );

    await expect(getPoll("x")).rejects.toThrow("Internal Server Error");
  });

  it("adminDeletePoll propagates parseJson errors on failure", async () => {
    const { adminDeletePoll } = await loadApi();
    mockFetch.mockResolvedValue(
      jsonResponse({ error: "Unauthorized" }, {
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      }),
    );

    await expect(adminDeletePoll("p1", "bad")).rejects.toThrow("Unauthorized");
  });

  it("verifyAdminKey POSTs admin key and returns true on 204", async () => {
    const { verifyAdminKey } = await loadApi();
    mockFetch.mockResolvedValue(jsonResponse(null, { ok: true, status: 204 }));

    await expect(verifyAdminKey("good-key")).resolves.toBe(true);

    expect(mockFetch).toHaveBeenCalledWith("http://localhost:8080/admin/verify", {
      method: "POST",
      headers: { "x-admin-key": "good-key" },
    });
  });

  it("verifyAdminKey returns false on 401", async () => {
    const { verifyAdminKey } = await loadApi();
    mockFetch.mockResolvedValue(
      jsonResponse({ error: "Unauthorized" }, {
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      }),
    );

    await expect(verifyAdminKey("bad-key")).resolves.toBe(false);
  });

  it("verifyAdminKey throws on 429 rate-limit responses", async () => {
    const { verifyAdminKey } = await loadApi();
    mockFetch.mockResolvedValue(
      jsonResponse({ error: "Too many requests" }, {
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
      }),
    );

    await expect(verifyAdminKey("any-key")).rejects.toThrow(
      "Too many requests",
    );
  });
});
