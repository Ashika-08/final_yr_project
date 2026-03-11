const API_BASE = "/api";

async function request(endpoint, options = {}) {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || "Something went wrong");
  }

  // 204 No Content
  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  // Auth
  register: (username, email, password) =>
    request("/auth/register", { method: "POST", body: JSON.stringify({ username, email, password }) }),

  login: (username, password) =>
    request("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),

  me: () => request("/auth/me"),

  // Conversations
  createConversation: () =>
    request("/conversations", { method: "POST" }),

  listConversations: () =>
    request("/conversations"),

  getMessages: (conversationId) =>
    request(`/conversations/${conversationId}/messages`),

  deleteConversation: (conversationId) =>
    request(`/conversations/${conversationId}`, { method: "DELETE" }),

  // Chat
  chat: (query, conversationId = null) =>
    request("/chat", {
      method: "POST",
      body: JSON.stringify({ query, conversation_id: conversationId }),
    }),
};
