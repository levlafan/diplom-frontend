export function getAdminToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("eiry_token") || "";
}

export function adminHeaders() {
  return { Authorization: `Bearer ${getAdminToken()}` };
}

export function getApiUrl() {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
}
