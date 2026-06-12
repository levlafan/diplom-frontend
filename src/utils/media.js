export function resolveStorageUrl(path) {
  if (!path) return "/placeholder-cover.svg";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
  const baseUrl = apiUrl.replace(/\/api\/?$/, "");
  return `${baseUrl}/storage/${path}`;
}
