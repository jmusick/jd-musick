// @ts-check
import { defineConfig } from 'astro/config';
import icon from 'astro-icon';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
	site: 'https://jdmusick.band',
	// Astro 7 defaults to 'jsx' whitespace rules, which drop the space between
	// a line of text and a following inline link (e.g. "the privacy policy").
	// Keep the Astro 6 behavior so copy renders as written.
	compressHTML: true,
	server: {
		host: true,
		port: 4321,
	},
	integrations: [icon(), sitemap()],
});
