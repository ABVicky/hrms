import { MetadataRoute } from 'next';

export const dynamic = 'force-static';


export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'ASPIRE Digital Agency',
        short_name: 'ASPIRE',
        description: 'Progressive Web App for HR Management',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
        background_color: '#ffffff',
        theme_color: '#e11d48', // Rose-600 to match branding
        categories: ['business', 'productivity'],
        icons: [
            {
                src: '/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'maskable',
            },
            {
                src: '/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any',
            },
            {
                src: '/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
            },
            {
                src: '/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any',
            },
        ],
        shortcuts: [
            {
                name: 'Attendance',
                url: '/dashboard/attendance',
                icons: [{ src: '/icon-192x192.png', sizes: '192x192' }],
            },
            {
                name: 'Announcements',
                url: '/dashboard/announcements',
                icons: [{ src: '/icon-192x192.png', sizes: '192x192' }],
            }
        ]
    }
}
