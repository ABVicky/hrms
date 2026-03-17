import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
    dest: "public",
    disable: process.env.NODE_ENV === "development",
    register: true,
    skipWaiting: false,
    workboxOptions: {
        skipWaiting: false,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
    },
    reloadOnOnline: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    output: 'export',
    images: {
        unoptimized: true,
    },
};

export default withPWA(nextConfig);
