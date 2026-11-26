import path from 'node:path';

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	experimental: {
		// Importing one component from an index must not send the browser all of them
		optimizePackageImports: [
			'@/components/atoms',
			'@/components/cells',
			'@/components/molecules',
			'@/components/organisms',
			'@/components/sections',
			'@/components/motion',
			'@/icons',
			'@medusajs/ui',
			'@medusajs/icons',
			'react-icons/lu',
		],
	},
	async headers() {
		return [
			{
				headers: [
					{ key: 'X-Content-Type-Options', value: 'nosniff' },
					{ key: 'X-Frame-Options', value: 'SAMEORIGIN' },
					{ key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
				],
				source: '/:path*',
			},
		];
	},
	images: {
		remotePatterns: [
			{
				hostname: 'medusa-public-images.s3.eu-west-1.amazonaws.com',
				protocol: 'https',
			},
			{
				hostname: 'mercur-connect.s3.eu-central-1.amazonaws.com',
				protocol: 'https',
			},
			{
				hostname: 'api.mercurjs.com',
				protocol: 'https',
			},
			{
				hostname: 'localhost',
				protocol: 'http',
			},
			{
				hostname: 'api-sandbox.mercurjs.com',
				pathname: '/static/**',
				protocol: 'https',
			},
			{
				hostname: 'i.imgur.com',
				protocol: 'https',
			},
			{
				hostname: 's3.eu-central-1.amazonaws.com',
				protocol: 'https',
			},
		{
			hostname: 's3.ap-southeast-1.amazonaws.com',
			protocol: 'https',
		},
		{
			hostname: 'storage.googleapis.com',
			protocol: 'https',
		},
		{
			hostname: 'media.maretinda.com',
			protocol: 'https',
		},
	],
},
	logging: {
		fetches: {
			fullUrl: true,
		},
	},
	reactStrictMode: true,
	trailingSlash: false,
};

// Navigations could hang once their answer had arrived: see the loader. (Turbopack, in development, has no use for it.)
if (!process.env.TURBOPACK) {
	nextConfig.webpack = (config) => {
		config.module.rules.push({
			enforce: 'pre',
			loader: path.resolve(process.cwd(), 'scripts/react-lost-ping-loader.cjs'),
			test: /next[\\/]dist[\\/]compiled[\\/]react-dom[\\/]cjs[\\/]react-dom-client\.production\.js$/,
		});
		return config;
	};
}

module.exports = nextConfig;
