import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			manifest: {
				name: '와디즈 - 크라우드펀딩',
				short_name: '와디즈',
				description: '당신의 아이디어를 현실로, 크라우드펀딩 플랫폼',
				theme_color: '#FF5C35',
				background_color: '#ffffff',
				display: 'standalone',
				lang: 'ko',
				start_url: '/',
				icons: [
					{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
					{ src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
					{ src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
				]
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/.*\.supabase\.co\/rest\//,
						handler: 'NetworkFirst',
						options: {
							cacheName: 'supabase-api',
							networkTimeoutSeconds: 5,
							expiration: { maxEntries: 100, maxAgeSeconds: 300 }
						}
					},
					{
						urlPattern: /^https:\/\/.*\.supabase\.co\/storage\//,
						handler: 'CacheFirst',
						options: {
							cacheName: 'supabase-storage',
							expiration: { maxEntries: 200, maxAgeSeconds: 604800 }
						}
					},
					{
						urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
						handler: 'CacheFirst',
						options: {
							cacheName: 'google-fonts',
							expiration: { maxEntries: 10, maxAgeSeconds: 31536000 }
						}
					}
				],
				navigateFallback: '/offline',
				navigateFallbackDenylist: [/^\/fund\//, /^\/auth\//]
			},
			devOptions: { enabled: false }
		})
	]
});
