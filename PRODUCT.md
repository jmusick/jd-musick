# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: listeners. That means fans and curious people who hear of JD Musick, search the name or follow a shared link, and want to know what the music sounds like and where to play it. Many arrive on a phone from a social or streaming link.

Secondary: booking, press, licensing and collaboration contacts. They reach the artist through the Contact page. They are served, but the site is not organized around them.

## Product Purpose

jdmusick.band is the official home of JD Musick, a solo electric blues and soul recording artist. It presents the debut album, **The Road Still Knows** (released September 4, 2026), and sends visitors to listen to it.

Success means, in order:

1. **Album streams.** Visitors play The Road Still Knows on Spotify or Apple Music, either in the on-page Spotify embed or by following the outbound links.
2. **Follows.** Visitors follow the artist's social profiles. This goal is blocked for now, because every social profile stays hidden until its real URL is recorded (see Capabilities and Constraints).

Contact inquiries are a supported path, not a primary success measure.

## Positioning

The album is built from story songs. Each track is a scene with a character: the man with the matchbook, the bar near last call, the Sunday shoes that can't hide what happened at home. Its themes are regret, self-reckoning, reassurance and hard-won love, played on smoky guitar and Hammond organ behind a weathered voice. The confirmed tagline is "Electric blues, soul, and stories that stay after last call."

The positioning rests on these specific songs and this specific record, not on blues-genre convention in general. Any act could claim "authentic blues." Only this one has these eleven songs.

## Operating Context

- Visitors usually come from a link: a streaming profile, a social post, a share card (`public/og.png`, built from the album cover) or a name search. They often arrive mid-scroll on a phone.
- Listening happens off-site or in the embedded Spotify player. The site doesn't host audio.
- Booking, press and licensing contacts use the Contact form. Submissions go by email to the inbox set in `CONTACT_TO_EMAIL`.
- The routes are Home, Music (release details and tracklist), About, Contact, Privacy Policy and 404.

## Capabilities and Constraints

- Static Astro site on Cloudflare Pages. The only server-side route is `POST /api/contact`, protected by Turnstile and delivered through Cloudflare Email Sending. Don't add server routes or client-side data fetching without an explicit requirement (see AGENTS.md).
- A strict CSP in `public/_headers` allows only Google Fonts, Cloudflare Turnstile and the Spotify embed. Any new third-party origin has to be added there on purpose.
- Content has one source each: site identity, links and socials live in `src/config/site.ts`, and album and track data live in `src/data/album.ts`. The released Spotify listing is the authority for track order and timings.
- Live links: Spotify and Apple Music. YouTube, SoundCloud, Instagram, TikTok, Facebook and X are listed with `href: null` and stay hidden until real URLs exist. Never invent profiles or link to similarly named artists.
- Terminology: "JD Musick" is one solo artist, not a band, even though the domain is `.band`. The release is an "Album", the debut, with the status "Out now."

## Brand Commitments

- Name: **JD Musick**. Album: **The Road Still Knows**.
- Voice: third person for biographical copy.
- Assets: the album cover (`src/assets/the-road-still-knows-cover.png`). Original logos and wordmarks live in the separate media project (`C:\Users\JD\projects\jd-musick\assets\brand\`) and aren't yet used on the site.
- README.md's "Visual direction" section and `public/universal.css` describe the visual system now in use. That system is the incumbent design, recorded in the code, not a product commitment captured here.

## Evidence on Hand

- The album: 11 tracks, each with a title, duration and a one-line note (`src/data/album.ts`), plus the album blurb, the cover art and the release date.
- Live Spotify and Apple Music album listings.
- **The About page bio is placeholder copy and is not approved.** Don't treat it as fact. Don't add biographical claims (hometown, influences, history, collaborators) without the artist's approval.
- The repository holds no press quotes, testimonials, reviews, tour dates, streaming numbers or awards. Don't fabricate any of them. Add them only when the artist supplies them.

## Product Principles

1. **Get to the music fast.** Every page should make playing The Road Still Knows the obvious next step.
2. **The songs are the story.** Draw copy and emphasis from the actual tracks, their themes and the album, not from generic blues-artist tropes.
3. **Only what's true.** Show real links, real data and approved copy. Leave something hidden or out rather than fill it with a placeholder claim.
4. **One source for content.** Album and identity facts come from the config and data files, so the site never contradicts the released record.
