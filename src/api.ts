import type { Poll, PollResults } from "./types";

const API_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ??
  "http://localhost:8080";

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = response.statusText;
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) {
        message = body.error;
      }
    } catch {
      // ignore parse errors
    }
    throw new Error(message || `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export async function listPolls(): Promise<Poll[]> {
  const response = await fetch(`${API_URL}/polls`);
  return parseJson<Poll[]>(response);
}

export async function createPoll(
  question: string,
  options: string[],
): Promise<Poll> {
  const response = await fetch(`${API_URL}/polls`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, options }),
  });
  return parseJson<Poll>(response);
}

export async function getPoll(id: string): Promise<Poll> {
  const response = await fetch(`${API_URL}/polls/${encodeURIComponent(id)}`);
  return parseJson<Poll>(response);
}

export async function vote(pollId: string, optionId: string): Promise<Poll> {
  const response = await fetch(
    `${API_URL}/polls/${encodeURIComponent(pollId)}/vote`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionId }),
    },
  );
  return parseJson<Poll>(response);
}

export async function getPollResults(id: string): Promise<PollResults> {
  const response = await fetch(
    `${API_URL}/polls/${encodeURIComponent(id)}/results`,
  );
  return parseJson<PollResults>(response);
}

function adminHeaders(adminKey: string): HeadersInit {
  return { "x-admin-key": adminKey };
}

export async function adminDeletePoll(
  id: string,
  adminKey: string,
): Promise<void> {
  const response = await fetch(`${API_URL}/polls/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: adminHeaders(adminKey),
  });
  if (!response.ok) {
    await parseJson<never>(response);
  }
}

export async function adminResetPollVotes(
  id: string,
  adminKey: string,
): Promise<Poll> {
  const response = await fetch(
    `${API_URL}/polls/${encodeURIComponent(id)}/reset-votes`,
    {
      method: "POST",
      headers: adminHeaders(adminKey),
    },
  );
  return parseJson<Poll>(response);
}

export async function adminResetAll(): Promise<Poll[]> {
  const response = await fetch(`${API_URL}/admin/reset-all`, {
    method: "POST",
  });
  return parseJson<Poll[]>(response);
}
