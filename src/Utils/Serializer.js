import LZString from "lz-string";

const HASH_PREFIX = "sheetsv1|"; // versioning for future

export function encodeState(state) {
  try {
    const json = JSON.stringify(state);
    const compressed = LZString.compressToEncodedURIComponent(json);
    return HASH_PREFIX + compressed;
  } catch (e) {
    console.error("encodeState error", e);
    return "";
  }
}

export function decodeState(hashStr) {
  try {
    if (!hashStr) return null;
    // Accept with or without leading '#'
    const raw = hashStr.startsWith("#") ? hashStr.slice(1) : hashStr;
    if (!raw.startsWith(HASH_PREFIX)) return null;
    const payload = raw.slice(HASH_PREFIX.length);
    const json = LZString.decompressFromEncodedURIComponent(payload);
    if (!json) return null;
    return JSON.parse(json);
  } catch (e) {
    console.error("decodeState error", e);
    return null;
  }
}
