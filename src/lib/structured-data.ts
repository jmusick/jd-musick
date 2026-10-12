import { ALBUM, TRACK_COUNT, toIsoDuration } from "../data/album";
import { ACTIVE_SOCIALS, SITE_GENRES, SITE_NAME, SITE_TAGLINE, SITE_URL } from "../config/site";

/** Stable identifiers shared by every page so crawlers can merge the entities. */
export const ARTIST_ID = `${SITE_URL}/#artist`;
export const ALBUM_ID = `${SITE_URL}/music/#album`;
export const ALBUM_URL = `${SITE_URL}/music/`;

const profileLinks = ACTIVE_SOCIALS.filter((s) => s.target !== "album").map((s) => s.href);
const albumLinks = ACTIVE_SOCIALS.filter((s) => s.target === "album").map((s) => s.href);

/** Reference form, safe to nest inside other entities. */
export const artistRef = { "@type": "MusicGroup", "@id": ARTIST_ID, name: SITE_NAME, url: SITE_URL };

export function artistEntity(description: string = SITE_TAGLINE) {
	return {
		"@context": "https://schema.org",
		...artistRef,
		genre: SITE_GENRES,
		description,
		// Null social profiles are filtered out upstream; omit the key when none remain.
		...(profileLinks.length > 0 && { sameAs: profileLinks }),
	};
}

/** Light album reference (no tracks), used from the artist entity. */
export const albumRef = {
	"@type": "MusicAlbum",
	"@id": ALBUM_ID,
	name: ALBUM.title,
	url: ALBUM_URL,
	byArtist: { "@id": ARTIST_ID },
};

/** `imageUrl` must be an absolute URL of the built cover. */
export function albumEntity(imageUrl: string) {
	return {
		"@context": "https://schema.org",
		"@type": "MusicAlbum",
		"@id": ALBUM_ID,
		name: ALBUM.title,
		url: ALBUM_URL,
		image: imageUrl,
		genre: SITE_GENRES,
		...(ALBUM.releaseDate && { datePublished: ALBUM.releaseDate }),
		numTracks: TRACK_COUNT,
		byArtist: artistRef,
		// Streaming pages for this album; deliberately not on the artist.
		...(albumLinks.length > 0 && { sameAs: albumLinks }),
		track: ALBUM.tracks.map((t) => ({
			"@type": "MusicRecording",
			"@id": `${ALBUM_ID}-track-${t.n}`,
			position: t.n,
			name: t.title,
			duration: toIsoDuration(t.duration),
			byArtist: { "@id": ARTIST_ID },
			inAlbum: { "@id": ALBUM_ID },
		})),
	};
}
