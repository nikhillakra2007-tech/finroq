/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      { source: '/budgets', destination: '/app/budgeting', permanent: true },
      { source: '/transactions', destination: '/app/expense-tracking', permanent: true },
      { source: '/net-worth', destination: '/app/net-worth', permanent: true },
      { source: '/insights', destination: '/app/spend-leak-detector', permanent: true },
      { source: '/credit-health', destination: '/app/credit-health', permanent: true },
      { source: '/debt-watchdog', destination: '/app/debt-watchdog', permanent: true },
      { source: '/emergency-cushion', destination: '/app/emergency-cushion', permanent: true },
      { source: '/financial-health', destination: '/app/financial-health', permanent: true },
      { source: '/guides', destination: '/app/money-guides', permanent: true },
      { source: '/pre-spend-check', destination: '/app/pre-spend-check', permanent: true },
      { source: '/recurring', destination: '/app/spend-leak-detector', permanent: true },
      { source: '/spend-leaks', destination: '/app/spend-leak-detector', permanent: true },
      { source: '/splitter', destination: '/app/splitter', permanent: true },
      { source: '/summary', destination: '/app/financial-health', permanent: true },
      { source: '/accounts', destination: '/app/expense-tracking', permanent: true },
    ];
  },
};

module.exports = nextConfig;