import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

// export const lora = Lora({
// 	display: 'swap',
// 	subsets: ['latin'],
// 	variable: '--font-lora',
// 	weight: ['400', '500', '600', '700'],
// });

export default {
	content: [
		'./src/pages/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/components/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/app/**/*.{js,ts,jsx,tsx,mdx}',
		'./node_modules/@medusajs/ui/dist/**/*.{js,jsx,ts,tsx}',
	],
	darkMode: 'class',
	plugins: [
		plugin(({ addUtilities }) => {
			addUtilities({
				'.drag-none': {
					'-khtml-user-drag': 'none',
					'-moz-user-drag': 'none',
					'-o-user-drag': 'none',
					'-webkit-user-drag': 'none',
					'user-select': 'none',
				},
			});
		}),
	],
	presets: [require('@medusajs/ui-preset')],
	theme: {
		extend: {
			backgroundColor: {
				action: {
					DEFAULT: 'rgba(var(--bg-action-primary))',
					hover: 'rgba(var(--bg-action-primary-hover))',
					pressed: 'rgba(var(--bg-action-primary-pressed))',
					secondary: {
						DEFAULT: 'var(--bg-action-secondary)',
						hover: 'var(--bg-action-secondary-hover)',
						pressed: 'var(--bg-action-secondary-pressed)',
					},
					tertiary: {
						DEFAULT: 'var(--bg-action-tertiary)',
						hover: 'var(--bg-action-tertiary-hover)',
						pressed: 'var(--bg-action-tertiary-pressed)',
					},
				},
				brand: {
					cta: {
						400: 'rgba(var(--brand-cta-400))',
						500: 'rgba(var(--brand-cta-500))',
						600: 'rgba(var(--brand-cta-600))',
					},
					DEFAULT: 'var(--brand-bg)',
				},
				brandPurple: 'rgba(var(--bg-brand-purple))',
				brandPurpleLight: 'rgba(var(--bg-brand-purple-light))',
				brandPurpleLighten: 'rgba(var(--bg-brand-purple-lighten))',
				component: {
					DEFAULT: 'rgba(var(--bg-component-primary))',
					hover: 'rgba(var(--bg-component-primary-hover))',
					secondary: {
						DEFAULT: 'rgba(var(--bg-component-secondary))',
						hover: 'rgba(var(--bg-component-secondary-hover))',
					},
				},
				disabled: 'rgba(var(--bg-disabled))',
				negative: {
					DEFAULT: 'rgba(var(--bg-negative-primary))',
					hover: 'rgba(var(--bg-negative-primary-hover))',
					pressed: 'rgba(var(--bg-negative-primary-pressed))',
					secondary: {
						DEFAULT: 'rgba(var(--bg-negative-secondary))',
						hover: 'rgba(var(--bg-negative-secondary-hover))',
						pressed: 'rgba(var(--bg-negative-secondary-pressed))',
					},
				},
				positive: {
					DEFAULT: 'rgba(var(--bg-positive-primary))',
					hover: 'rgba(var(--bg-positive-primary-hover))',
					pressed: 'rgba(var(--bg-positive-primary-pressed))',
					secondary: {
						DEFAULT: 'rgba(var(--bg-positive-secondary))',
						hover: 'rgba(var(--bg-positive-secondary-hover))',
						pressed: 'rgba(var(--bg-positive-secondary-pressed))',
					},
				},
				primary: 'rgba(var(--bg-primary))',
				secondary: 'rgba(var(--bg-secondary))',
				tertiary: 'rgba(var(--bg-tertiary))',
				warning: {
					DEFAULT: 'rgba(var(--bg-warning-primary))',
					hover: 'rgba(var(--bg-warning-primary-hover))',
					pressed: 'rgba(var(--bg-warning-primary-pressed))',
					secondary: {
						DEFAULT: 'rgba(var(--bg-warning-secondary))',
						hover: 'rgba(var(--bg-warning-secondary-hover))',
						pressed: 'rgba(var(--bg-warning-secondary-pressed))',
					},
				},
			},
			borderColor: {
				action: 'rgba(var(--border-action))',
				brandPurple: 'rgba(var(--bg-brand-purple))',
				brandYellow: 'rgba(var(--border-action-primary))',
				DEFAULT: 'rgba(var(--border-primary))',
				disabled: 'rgba(var(--border-disabled))',
				negative: {
					DEFAULT: 'rgba(var(--border-negative-primary))',
					secondary: 'rgba(var(--border-negative-secondary))',
				},
				positive: {
					DEFAULT: 'rgba(var(--border-positive-primary))',
					secondary: 'rgba(var(--border-positive-secondary))',
				},
				secondary: 'rgba(var(--border-secondary))',
				warning: {
					DEFAULT: 'rgba(var(--border-warning-primary))',
					secondary: 'rgba(var(--border-warning-secondary))',
				},
			},
			borderRadius: {
				full: '1000px',
				md: '16px',
				sm: '8px',
				xs: '4px',
			},
			colors: {
				action: {
					DEFAULT: 'rgba(var(--content-action-primary))',
					hover: 'rgba(var(--content-action-primary-hover))',
					on: {
						primary: 'rgba(var(--content-action-on-primary))',
						secondary: 'rgba(var(--content-action-on-secondary))',
						tertiary: 'rgba(var(--content-action-on-tertiary))',
					},
					pressed: 'rgba(var(--content-action-primary-pressed))',
				},
				brand: {
					cta: 'rgba(var(--brand-cta-400))',
					purple: {
						900: 'rgba(var(--brand-purple-900))',
					},
					text: 'var(--brand-text)',
				},
				disabled: 'rgba(var(--content-disabled))',
				negative: {
					DEFAULT: 'rgba(var(--content-negative-primary))',
					on: {
						primary: 'rgba(var(--content-negative-on-primary))',
						secondary: 'rgba(var(--content-negative-on-secondary))',
					},
				},
				positive: {
					DEFAULT: 'rgba(var(--content-positive-primary))',
					on: {
						primary: 'rgba(var(--content-positive-on-primary))',
						secondary: 'rgba(var(--content-positive-on-secondary))',
					},
				},
				primary: 'rgba(var(--content-primary))',
				secondary: 'rgba(var(--content-secondary))',
				tertiary: 'rgba(var(--content-tertiary))',
				warning: {
					DEFAULT: 'rgba(var(--content-warning-primary))',
					on: {
						primary: 'rgba(var(--content-warning-on-primary))',
						secondary: 'rgba(var(--content-warning-on-secondary))',
					},
				},
			},
			fill: {
				brandYellow: 'rgba(var(--content-action-brand-yellow))',
				disabled: 'rgba(var(--content-disabled))',
				primary: 'rgba(var(--content-action-on-primary))',
				secondary: 'rgba(var(--content-action-on-secondary))',
			},
			fontFamily: {
				lora: [
					'var(--font-lora)',
					...require('tailwindcss/defaultTheme').fontFamily.serif,
				],
			},
		},
	},
} satisfies Config;
