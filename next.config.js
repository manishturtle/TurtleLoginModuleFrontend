/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export", // Enables static export
  trailingSlash: true, // Helps with IIS routing
  reactStrictMode: true,
  swcMinify: true,
  async rewrites() {
    return [
      // Handle tenant-specific routes
      {
        source: "/:tenant/tenant-admin/:path*",
        destination: "/[tenant]/tenant-admin/:path*",
      },
      // Handle tenant root
      {
        source: "/:tenant",
        destination: "/[tenant]",
      },
    ];
  },
};

// module.exports = nextConfig;

// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   output: "export", // Required for static export
//   trailingSlash: true, // Helps with IIS routing
//   images: {
//     unoptimized: true, // Needed for static export if using next/image
//   },
// };

// module.exports = nextConfig;

// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   output: "export", // Required for static export
//   trailingSlash: true, // Ensures IIS routing works with trailing slashes
//   images: {
//     unoptimized: true, // Disables image optimization for static export
//   },
//   reactStrictMode: true,
//   swcMinify: true, // Enables minification for production builds
// };

// module.exports = nextConfig;
