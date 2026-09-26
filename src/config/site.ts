import pkg from "../../package.json";

/** Sourced from package.json — bump the version there (and tag the release to match) to update this everywhere. */
export const SITE_VERSION: string = pkg.version;

/**
 * Single source of truth for the public origin. Change this (and `site` in
 * astro.config.mjs) once the real domain is registered — nothing else
 * hardcodes a URL.
 */
export const SITE_URL = "https://jdmusick.band";
export const SITE_NAME = "JD Musick";
export const SITE_TAGLINE = "Electric blues, soul, and stories that stay after last call.";

/**
 * Cloudflare Turnstile site key for the contact form. The key is public by
 * design and committed so production cannot silently render a form-less page
 * when a build variable is missing. The matching secret must only exist in
 * Cloudflare or .dev.vars. PUBLIC_TURNSTILE_SITE_KEY remains an optional
 * override for another deployment.
 */
export const TURNSTILE_SITE_KEY: string =
	import.meta.env.PUBLIC_TURNSTILE_SITE_KEY ?? "0x4AAAAAAE2nkWqLS-ID_LUE";

/**
 * Social and streaming profiles.
 *
 * Spotify and Apple Music are live; the rest stay `href: null` until their
 * real URLs are known. The header, footer and Music page skip null entries
 * entirely, so a profile lights up the moment a URL is pasted in.
 */
export interface SocialLink {
	label: string;
	href: string | null;
	icon: string;
}

export const SOCIALS: SocialLink[] = [
	{ label: "Spotify", href: "https://open.spotify.com/album/1af7jVOhvyLZJTOLxoX3rx", icon: "simple-icons:spotify" },
	{ label: "Apple Music", href: "https://music.apple.com/us/album/the-road-still-knows/6806432947", icon: "simple-icons:applemusic" },
	{ label: "YouTube", href: null, icon: "simple-icons:youtube" },
	{ label: "SoundCloud", href: null, icon: "simple-icons:soundcloud" },
	{ label: "Instagram", href: null, icon: "simple-icons:instagram" },
	{ label: "TikTok", href: null, icon: "simple-icons:tiktok" },
	{ label: "Facebook", href: null, icon: "simple-icons:facebook" },
	{ label: "X", href: null, icon: "simple-icons:x" },
];

export const ACTIVE_SOCIALS = SOCIALS.filter(
	(s): s is SocialLink & { href: string } => s.href !== null,
);

/** Contact-form destination and fallback address when Turnstile is unavailable. */
export const CONTACT_EMAIL = "contact@jdmusick.band";
