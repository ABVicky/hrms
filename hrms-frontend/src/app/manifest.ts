import { MetadataRoute } from 'next';

export const dynamic = 'force-static';


export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'HRMS Digital Agency',
        short_name: 'HRMS',
        description: 'Progressive Web App for HR Management',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#0f172a', // Tailwind slate-900
        icons: [
            {
                src: '/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    }
}
