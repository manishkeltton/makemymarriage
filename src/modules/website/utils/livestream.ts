/**
 * YouTube Video ID pattern: exactly 11 characters of alphanumeric, hyphens, or underscores.
 */
const YOUTUBE_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

/**
 * Parses a raw YouTube input (URL, embed URL, short link, or raw ID) and extracts the 11-char Video ID.
 * Returns null if the input is invalid or cannot be safely parsed.
 */
export function parseYouTubeVideoId(input?: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // If already an 11-char ID
  if (YOUTUBE_ID_REGEX.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    const host = url.hostname.toLowerCase();

    if (host.includes("youtube.com")) {
      // Handle /watch?v=ID
      if (url.searchParams.has("v")) {
        const v = url.searchParams.get("v");
        if (v && YOUTUBE_ID_REGEX.test(v)) return v;
      }
      // Handle /embed/ID or /live/ID or /v/ID
      const pathSegments = url.pathname.split("/").filter(Boolean);
      if (pathSegments.length >= 2 && ["embed", "live", "v"].includes(pathSegments[0])) {
        const potentialId = pathSegments[1];
        if (potentialId && YOUTUBE_ID_REGEX.test(potentialId)) return potentialId;
      }
    } else if (host.includes("youtu.be")) {
      // Handle youtu.be/ID
      const pathSegments = url.pathname.split("/").filter(Boolean);
      if (pathSegments.length >= 1) {
        const potentialId = pathSegments[0];
        if (potentialId && YOUTUBE_ID_REGEX.test(potentialId)) return potentialId;
      }
    }
  } catch {
    // If not a valid URL structure, try regex matching anywhere in string
    const match = trimmed.match(/(?:v=|\/embed\/|\/live\/|\/v\/|youtu\.be\/|\/)([a-zA-Z0-9_-]{11})/);
    if (match && match[1] && YOUTUBE_ID_REGEX.test(match[1])) {
      return match[1];
    }
  }

  return null;
}

/**
 * Builds a safe HTTPS YouTube embed URL given a raw URL or video ID.
 * Returns null if input cannot be parsed.
 */
export function buildYouTubeEmbedUrl(input?: string): string | null {
  const videoId = parseYouTubeVideoId(input);
  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`;
}
