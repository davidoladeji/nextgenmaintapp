/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize for M4 Pro Mac
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  }
}

module.exports = nextConfig