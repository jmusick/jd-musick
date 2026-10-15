/**
 * "The Road Still Knows" — the debut album.
 *
 * Track order is a proposed sequence, not a confirmed master order; durations
 * are read from the source WAVs in the project assets folder. Adjust `tracks`
 * here and the Music page follows.
 */

export interface Track {
	n: number;
	title: string;
	/** mm:ss, from the source WAV header. */
	duration: string;
	/** One line of context for the Music page. */
	note: string;
}

export const ALBUM = {
	title: "The Road Still Knows",
	kind: "Album",
	status: "Out now",
	year: 2026,
	releaseDate: "2026-09-04" as string | null,
	blurb:
		"Eleven late-night songs about regret, reckoning, reassurance, and hard-won love. Smoky guitar and warm organ back a weathered voice.",
	spotifyUrl: "https://open.spotify.com/album/1af7jVOhvyLZJTOLxoX3rx",
	tracks: [
		{ n: 1, title: "She Left Me the Jukebox", duration: "5:42", note: "Heartbreak with the bar still open." },
		{ n: 2, title: "Matchbook Man", duration: "6:41", note: "Fire, memory, and self-reckoning." },
		{ n: 3, title: "Sunday Shoes", duration: "4:05", note: "A polished face on an empty house." },
		{ n: 4, title: "The Bell Heard Me Lie", duration: "6:13", note: "Guilt rings longer than the truth." },
		{ n: 5, title: "Never Too Much for Me", duration: "5:27", note: "Reassurance without conditions." },
		{ n: 6, title: "The Devil Keeps My Change", duration: "5:24", note: "A debt paid in smoke and shadow." },
		{ n: 7, title: "Slide", duration: "3:14", note: "Lean, direct electric blues." },
		{ n: 8, title: "Love Done Found Me", duration: "5:24", note: "Warm soul-blues with the door left open." },
		{ n: 9, title: "Slow Fire", duration: "5:57", note: "Heat that knows how to wait." },
		{ n: 10, title: "They Carry You Gentle", duration: "5:59", note: "A dark hymn for the road home." },
		{ n: 11, title: "Everybody’s Somebody at Closing Time", duration: "7:59", note: "One last round for the lonely." },
	] satisfies Track[],
} as const;

export const TRACK_COUNT = ALBUM.tracks.length;

/** Total runtime, formatted as "Nh Nm" / "Nm". */
export const ALBUM_RUNTIME = (() => {
	const seconds = ALBUM.tracks.reduce((total, track) => {
		const [m, s] = track.duration.split(":").map(Number);
		return total + m * 60 + s;
	}, 0);
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.round((seconds % 3600) / 60);
	return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
})();

/** "5:42" -> "PT5M42S" (ISO 8601 duration, for structured data). */
export function toIsoDuration(duration: string): string {
	const [m, s] = duration.split(":").map(Number);
	return `PT${m}M${s}S`;
}

/** Long-form release date ("September 4, 2026"), or null while unannounced. */
export function formatReleaseDate(): string | null {
	return ALBUM.releaseDate
		? new Date(`${ALBUM.releaseDate}T00:00:00`).toLocaleDateString("en-US", {
				year: "numeric",
				month: "long",
				day: "numeric",
			})
		: null;
}
