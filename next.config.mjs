/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  
  // Добавь эту секцию
  async redirects() {
    return [
      {
        source: '/',
        destination: '/home',
        permanent: true,  // true = 301 редирект (навсегда), false = 302
      },
    ];
  },
};

export default nextConfig;