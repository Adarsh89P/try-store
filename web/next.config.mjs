// STATIC_EXPORT=1 builds plain files for GitHub Pages (npm run build:pages).
const staticExport = process.env.STATIC_EXPORT === "1";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Lets a second build (for API tests) sit next to the normal one.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  ...(staticExport ? { output: "export", trailingSlash: true, images: { unoptimized: true }, basePath } : {}),
};
export default nextConfig;
