// EthioReco — Client API wrapper
// All calls go through here. Returns consistent { data, meta, errors } shape.

async function call<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<{ data: T; meta?: any; errors: any[] }> {
  const res = await fetch(path, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    ...options,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = (json as any).error ?? { code: "ERROR", message: "Request failed" };
    throw new Error(err.message ?? "Request failed");
  }
  return json as { data: T; meta?: any; errors: any[] };
}

export const api = {
  // AUTH
  register: (body: { name: string; email: string; password: string }) =>
    call("/api/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) =>
    call("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),
  logout: () => call("/api/auth/logout", { method: "POST" }),
  me: () => call("/api/auth/me"),

  // ITEMS
  listItems: (params: { type?: string; genre?: string; origin?: string; limit?: number } = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v && q.set(k, String(v)));
    return call(`/api/items?${q.toString()}`);
  },
  getItem: (id: string) => call(`/api/items/${id}`),
  searchItems: (q: string) => call(`/api/items/search?q=${encodeURIComponent(q)}`),
  crossDomainFor: (itemId: string) =>
    call(`/api/items/cross-domain?itemId=${encodeURIComponent(itemId)}`),

  // RATINGS
  rateItem: (itemId: string, score: number, review?: string) =>
    call("/api/ratings", { method: "POST", body: JSON.stringify({ itemId, score, review }) }),
  myRatings: () => call("/api/ratings/mine"),

  // RECOMMENDATIONS
  getRecs: () => call("/api/recommendations"),
  refreshRecs: () => call("/api/recommendations/refresh", { method: "POST" }),
  crossDomainRecs: () => call("/api/recommendations/cross-domain"),

  // ONBOARDING
  submitSurvey: (body: any) =>
    call("/api/onboarding", { method: "POST", body: JSON.stringify(body) }),

  // WISHLIST
  getWishlist: () => call("/api/wishlist"),
  addWishlist: (itemId: string, priority?: string) =>
    call("/api/wishlist", { method: "POST", body: JSON.stringify({ itemId, priority }) }),
  removeWishlist: (itemId: string) =>
    call(`/api/wishlist/${itemId}`, { method: "DELETE" }),

  // CREDITS
  getBalance: () => call("/api/credits/balance"),
  getHistory: () => call("/api/credits/history"),

  // ETHIOPIAN
  ethiopian: (type?: string) =>
    call(`/api/ethiopian${type ? `?type=${type}` : ""}`),

  // ADMIN
  adminUsers: () => call("/api/admin/users"),
  adminUserAction: (userId: string, action: "suspend" | "activate" | "delete") =>
    call("/api/admin/users", { method: "POST", body: JSON.stringify({ userId, action }) }),
  adminContent: () => call("/api/admin/content"),
  adminAddContent: (body: any) =>
    call("/api/admin/content", { method: "POST", body: JSON.stringify(body) }),
  adminLogs: () => call("/api/admin/logs"),

  // ITEMS — admin
  recomputeVectors: () =>
    call("/api/items/recompute-vectors", { method: "POST" }),
};
