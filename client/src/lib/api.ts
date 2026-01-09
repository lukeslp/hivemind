const normalizeBasePath = (basePath: string) => {
  if (!basePath || basePath === "/") return "";
  return basePath.endsWith("/") ? basePath.slice(0, -1) : basePath;
};

export const buildApiUrl = (path: string) => {
  const basePath = normalizeBasePath(import.meta.env.BASE_URL || "/");
  const cleanPath = path.replace(/^\/+/, "");
  return `${basePath}/api/${cleanPath}`;
};
