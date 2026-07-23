const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

export async function apiFetch<T>(path: string, idToken: string | null): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: idToken ? { Authorization: `Bearer ${idToken}` } : {},
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(body.error ?? "Erro ao chamar a API.", res.status);
  }

  return res.json() as Promise<T>;
}
