const BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export const getToken  = () => localStorage.getItem("falcom_token");
export const setToken  = (t) => localStorage.setItem("falcom_token", t);
export const clearToken = () => localStorage.removeItem("falcom_token");

const request = async (method, path, body = null, auth = true) => {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE}${path}`, {
    method, headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed.");
  return data;
};

// ── Auth ─────────────────────────────────────────────────────────────────────
export const login          = (email, password) => request("POST", "/auth/login", { email, password }, false);
export const forgotPassword = (email)            => request("POST", "/auth/forgot-password", { email }, false);
export const verifyCode     = (email, code)      => request("POST", "/auth/verify-code", { email, code }, false);
export const resetPassword  = (email, code, newPassword) => request("POST", "/auth/reset-password", { email, code, newPassword }, false);

// ── Users (admin) ─────────────────────────────────────────────────────────────
export const getUsers        = ()       => request("GET",    "/users");
export const getMe           = ()       => request("GET",    "/users/me");
export const createUser      = (data)   => request("POST",   "/users", data);
export const updateUser      = (id, data) => request("PUT",  `/users/${id}`, data);
export const toggleUserStatus = (id)    => request("PATCH",  `/users/${id}/status`);
export const deleteUser      = (id)     => request("DELETE", `/users/${id}`);

// ── Suggestions ──────────────────────────────────────────────────────────────
export const getSuggestions    = ()     => request("GET",    "/suggestions");
export const createSuggestion  = (data) => request("POST",   "/suggestions", data);
export const likeSuggestion    = (id)   => request("POST",   `/suggestions/${id}/like`);
export const deleteSuggestion  = (id)   => request("DELETE", `/suggestions/${id}`);

// ── Products ──────────────────────────────────────────────────────────────────
export const getProducts   = (owner_id) => request("GET", `/products${owner_id ? `?owner_id=${owner_id}` : ""}`);
export const createProduct = (data)     => request("POST",   "/products", data);
export const updateProduct = (id, data) => request("PUT",    `/products/${id}`, data);
export const deleteProduct = (id)       => request("DELETE", `/products/${id}`);

export const getSales      = (productId)         => request("GET",    `/products/${productId}/sales`);
export const addSale       = (productId, data)   => request("POST",   `/products/${productId}/sales`, data);
export const deleteSale    = (productId, saleId) => request("DELETE", `/products/${productId}/sales/${saleId}`);

export const changePassword = (currentPassword, newPassword) =>
  request("POST", "/auth/change-password", { currentPassword, newPassword });