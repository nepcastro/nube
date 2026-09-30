// A lightweight, anonymous per-device identifier used only to enforce a soft
// per-session word limit (see MAX_WORDS_PER_PARTICIPANT in the API). It is
// not tied to any personal data and never leaves the device except as an
// opaque header on write requests to this app's own API.
const STORAGE_KEY = 'nube_participant_id';

export function getParticipantId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let id = window.localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `p_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      window.localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    // localStorage unavailable (private mode, etc.) — degrade gracefully,
    // the server simply won't be able to rate-limit this device.
    return '';
  }
}
