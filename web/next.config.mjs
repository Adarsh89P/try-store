/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Lets a second build (for API tests) sit next to the normal one.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
};
export default nextConfig;
