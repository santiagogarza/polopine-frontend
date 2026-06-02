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

  it("getPoll encodes poll id in URL", async () => {
    const { getPoll } = await loadApi();
    const poll: Poll = {
      id: "poll/id",
      question: "Q?",
      createdAt: "2026-01-01T00:00:00.000Z",
      options: [],
    };
    mockFetch.mockResolvedValue(jsonResponse(poll));

    await getPoll("poll/id");

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/polls/poll%2Fid",
    );
  });

  it("vote POSTs optionId to vote endpoint", async () => {
    const { vote } = await loadApi();
    const poll: Poll = {
      id: "p1",
      question: "Q?",
      createdAt: "2026-01-01T00:00:00.000Z",
      options: [{ id: "opt-1", text: "A", votes: 1 }],
    };
    mockFetch.mockResolvedValue(jsonResponse(poll));

    await vote("p1", "opt-1");

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/polls/p1/vote",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId: "opt-1" }),
      },
    );
  });

  it("getPollResults fetches results endpoint", async () => {
    const { getPollResults } = await loadApi();
    const results: PollResults = {
      question: "Q?",
      totalVotes: 0,
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
});
