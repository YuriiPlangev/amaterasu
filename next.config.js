const createNextIntlPlugin = require('next-intl/plugin');
 
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  experimental: {
    // Зменшує агресивне кешування/повторні RSC-запити при навігації
    optimisticClientCache: false,
  },
  env: {
    _next_intl_trailing_slash: 'false',
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "3373259.gk610197.web.hosting-test.net",
        port: "",
        pathname: "/wp-content/uploads/**",
      },
      {
        protocol: "https",
        hostname: "3373259.gk610197.web.hosting-test.net",
        pathname: "/**",
      }
    ]
  }
};
module.exports = withNextIntl(nextConfig);
