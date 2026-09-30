import type { Context, Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

interface SessionData {
  id: string;
  title: string;
  promptQuestion: string;
  words: Record<string, number>;
  createdAt: number;
  updatedAt: number;
  participantCount: number;
  recentLogs: Array<{ word: string; time: number; by?: string }>;
  logoUrl?: string;
  customBlockedWords: string[];
  moderationMode: "auto" | "review";
  pendingWords: Record<string, number>;
  history: Array<{
    title: string;
    promptQuestion: string;
    words: Record<string, number>;
    participantCount: number;
    closedAt: number;
  }>;
  participantSubmissions: Record<string, number>;
}

interface SessionIndexEntry {
  id: string;
  title: string;
  promptQuestion: string;
  createdAt: number;
  updatedAt: number;
  participantCount: number;
  wordCount: number;
}

const initialDefaultWords: Record<string, number> = {
  "Innovación": 18,
  "Creatividad": 15,
  "Colaboración": 14,
  "Tecnología": 12,
  "Futuro": 11,
  "Liderazgo": 10,
  "Pasión": 9,
  "Estrategia": 9,
  "Agilidad": 8,
  "Impacto": 8,
  "Transformación": 8,
  "Comunidad": 7,
  "Diseño": 7,
  "Éxito": 6,
  "Sinergia": 6,
  "Visión": 6,
  "Empatía": 5,
  "Crecimiento": 5,
  "Compromiso": 5,
  "Inspiración": 4,
  "Calidad": 4,
  "Resiliencia": 4,
  "Autonomía": 4,
  "Aprendizaje": 4,
  "Confianza": 3,
  "Diversidad": 3,
  "Sostenibilidad": 3,
  "Excelencia": 3,
};

// Static blocklist for a lightweight profanity/spam filter.
// Normalized (lowercase, accent-stripped, non-alphanumeric stripped) before matching.
const BLOCKED_TERMS: string[] = [
  "puta", "puto", "putas", "putos", "mierda", "pendejo", "pendeja", "verga",
  "cabron", "coño", "cono", "joder", "polla", "carajo", "maricon", "gilipollas",
  "chinga", "chingar", "chingada", "culero", "culera", "pinche", "cagada",
  "hijueputa", "hijoputa", "malparido", "marica", "zorra", "perra", "concha",
  "pito", "chucha", "boludo",
  "fuck", "fucking", "fucker", "shit", "bitch", "asshole", "dick", "pussy",
  "cunt", "bastard", "nigger", "nigga", "faggot", "retard", "whore", "slut",
  "cock", "twat",
];

// A participant is identified by a random id the client keeps in localStorage
// (sent as the X-Participant-Id header). This is a soft, best-effort limit —
// not a security boundary — meant to stop one device from flooding a session.
const MAX_WORDS_PER_PARTICIPANT = 5;

const MAX_HISTORY_ROUNDS = 10;

function normalizeForFilter(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function isBlocked(word: string, session: SessionData): boolean {
  const normalized = normalizeForFilter(word);
  if (!normalized) return false;
  if (BLOCKED_TERMS.some((term) => normalized === term || normalized.includes(term))) {
    return true;
  }
  return (session.customBlockedWords || []).some((term) => {
    const normTerm = normalizeForFilter(term);
    return normTerm && (normalized === normTerm || normalized.includes(normTerm));
  });
}

function isAuthorized(req: Request): boolean {
  const expected = process.env.MODERATOR_PIN;
  if (!expected) return false;
  const provided = req.headers.get("x-admin-pin") || "";
  return provided === expected;
}

function getParticipantId(req: Request): string {
  return (req.headers.get("x-participant-id") || "").trim().slice(0, 100);
}

function defaultSession(id: string): SessionData {
  const base: SessionData = {
    id,
    title: `Sesión ${id}`,
    promptQuestion: "¿Qué palabra te viene a la mente?",
    words: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
    participantCount: 0,
    recentLogs: [],
    customBlockedWords: [],
    moderationMode: "auto",
    pendingWords: {},
    history: [],
    participantSubmissions: {},
  };

  if (id === "default") {
    return {
      ...base,
      title: "Sesión Interactiva en Vivo",
      promptQuestion: "¿Qué palabra define mejor nuestro próximo desafío?",
      words: { ...initialDefaultWords },
      participantCount: 36,
      recentLogs: [
        { word: "Innovación", time: Date.now() - 60000, by: "Participante" },
        { word: "Creatividad", time: Date.now() - 40000, by: "Participante" },
        { word: "Impacto", time: Date.now() - 15000, by: "Participante" },
      ],
    };
  }
  return base;
}

// Fills in any fields missing from a session blob written by an older
// version of this function, so old sessions keep working after a deploy.
function withDefaults(session: Partial<SessionData> & { id: string }): SessionData {
  return {
    ...defaultSession(session.id),
    ...session,
    customBlockedWords: session.customBlockedWords || [],
    moderationMode: session.moderationMode || "auto",
    pendingWords: session.pendingWords || {},
    history: session.history || [],
    participantSubmissions: session.participantSubmissions || {},
  };
}

function getSessionStore() {
  return getStore("nube-sessions");
}

function getLogoStore() {
  return getStore("nube-logos");
}

function getIndexStore() {
  return getStore("nube-index");
}

async function getOrCreateSession(id: string): Promise<SessionData> {
  const store = getSessionStore();
  const existing = await store.get(id, { type: "json" });
  if (existing) return withDefaults(existing as Partial<SessionData> & { id: string });
  const fresh = defaultSession(id);
  await saveSession(fresh);
  return fresh;
}

// Keeps a lightweight index of every session (id, title, counts) so the
// "Mis sesiones" panel can list past events without loading each one.
async function upsertIndexEntry(session: SessionData): Promise<void> {
  try {
    const store = getIndexStore();
    const list = ((await store.get("index", { type: "json" })) as SessionIndexEntry[]) || [];
    const entry: SessionIndexEntry = {
      id: session.id,
      title: session.title,
      promptQuestion: session.promptQuestion,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      participantCount: session.participantCount,
      wordCount: Object.keys(session.words).length,
    };
    const idx = list.findIndex((e) => e.id === session.id);
    if (idx >= 0) list[idx] = entry;
    else list.push(entry);
    // Keep the index from growing without bound.
    const trimmed = list.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 300);
    await store.setJSON("index", trimmed);
  } catch (err) {
    // The index is a convenience feature — never let it block a save.
    console.error("Index update failed:", err);
  }
}

async function removeIndexEntry(id: string): Promise<void> {
  try {
    const store = getIndexStore();
    const list = ((await store.get("index", { type: "json" })) as SessionIndexEntry[]) || [];
    await store.setJSON("index", list.filter((e) => e.id !== id));
  } catch (err) {
    console.error("Index removal failed:", err);
  }
}

async function saveSession(session: SessionData): Promise<void> {
  const store = getSessionStore();
  await store.setJSON(session.id, session);
  await upsertIndexEntry(session);
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default async (req: Request, _context: Context): Promise<Response> => {
  const url = new URL(req.url);
  // Strip the leading /api so segments are relative, e.g. ["sessions", ":id", "words"]
  const segments = url.pathname.replace(/^\/api\/?/, "").split("/").filter(Boolean);
  const method = req.method;

  try {
    // GET /api/health
    if (segments[0] === "health") {
      return json({ status: "ok", timestamp: Date.now() });
    }

    // Auth endpoints for the moderator PIN gate
    if (segments[0] === "auth") {
      if (segments[1] === "status" && method === "GET") {
        return json({ required: true });
      }
      if (segments[1] === "verify" && method === "POST") {
        const body = await req.json().catch(() => ({}));
        const { pin } = body || {};
        const expected = process.env.MODERATOR_PIN;
        if (expected && typeof pin === "string" && pin === expected) {
          return json({ success: true });
        }
        return json({ success: false, error: "PIN incorrecto" }, 401);
      }
      return json({ error: "Not found" }, 404);
    }

    if (segments[0] !== "sessions") {
      return json({ error: "Not found" }, 404);
    }

    // GET /api/sessions  (list — powers the "Mis sesiones" panel)
    if (segments.length === 1 && method === "GET") {
      if (!isAuthorized(req)) return json({ error: "No autorizado" }, 401);
      const store = getIndexStore();
      const list = ((await store.get("index", { type: "json" })) as SessionIndexEntry[]) || [];
      return json({ sessions: list.sort((a, b) => b.updatedAt - a.updatedAt) });
    }

    // POST /api/sessions  (create custom session)
    if (segments.length === 1 && method === "POST") {
      const body = await req.json().catch(() => ({}));
      const { title, promptQuestion } = body || {};
      const id = Math.random().toString(36).substring(2, 8).toUpperCase();
      const newSession: SessionData = {
        ...defaultSession(id),
        title: (title || `Sesión ${id}`).trim(),
        promptQuestion: (promptQuestion || "¿Qué palabra describe tu idea?").trim(),
        words: {},
        recentLogs: [],
        participantCount: 0,
      };
      await saveSession(newSession);
      return json(newSession, 201);
    }

    const id = segments[1];
    if (!id) return json({ error: "Falta el id de sesión" }, 400);

    // GET /api/sessions/:id
    if (segments.length === 2 && method === "GET") {
      const session = await getOrCreateSession(id);
      return json(session);
    }

    // DELETE /api/sessions/:id  (remove a past session from "Mis sesiones")
    if (segments.length === 2 && method === "DELETE") {
      if (!isAuthorized(req)) return json({ error: "No autorizado" }, 401);
      const sessionStore = getSessionStore();
      const logoStore = getLogoStore();
      await sessionStore.delete(id);
      await logoStore.delete(id).catch(() => {});
      await removeIndexEntry(id);
      return json({ success: true });
    }

    // POST /api/sessions/:id/words
    if (segments.length === 3 && segments[2] === "words" && method === "POST") {
      const session = await getOrCreateSession(id);
      const body = await req.json().catch(() => ({}));
      const { word, words, by } = body || {};
      const participantId = getParticipantId(req);

      // Anti-spam: a device that already used up its quota this session is
      // told plainly instead of having its words silently dropped.
      if (participantId) {
        const used = session.participantSubmissions[participantId] || 0;
        if (used >= MAX_WORDS_PER_PARTICIPANT) {
          return json(
            {
              error: "Ya enviaste tus palabras para esta sesión. ¡Gracias por participar!",
              limitReached: true,
            },
            429
          );
        }
      }

      const itemsToAdd: string[] = [];
      if (Array.isArray(words)) {
        itemsToAdd.push(...words.map((w: string) => String(w)));
      } else if (typeof word === "string" && word.trim()) {
        const split = word
          .split(/[,;\n]+/)
          .map((w: string) => w.trim())
          .filter((w: string) => w.length > 0);
        itemsToAdd.push(...split);
      }

      if (itemsToAdd.length === 0) {
        return json({ error: "No se proporcionaron palabras válidas" }, 400);
      }

      // Trim the batch to whatever quota room this participant has left.
      const remainingQuota = participantId
        ? Math.max(0, MAX_WORDS_PER_PARTICIPANT - (session.participantSubmissions[participantId] || 0))
        : Infinity;
      const itemsWithinQuota = itemsToAdd.slice(0, remainingQuota);
      const skippedByQuota = itemsToAdd.length - itemsWithinQuota.length;

      const addedWords: string[] = [];
      const blockedWords: string[] = [];
      const pendingAdded: string[] = [];

      itemsWithinQuota.forEach((rawWord) => {
        const clean = rawWord.trim().substring(0, 35);
        if (!clean) return;

        if (isBlocked(clean, session)) {
          blockedWords.push(clean);
          return;
        }

        if (session.moderationMode === "review") {
          let foundKey: string | null = null;
          for (const k of Object.keys(session.pendingWords)) {
            if (k.toLowerCase() === clean.toLowerCase()) {
              foundKey = k;
              break;
            }
          }
          const key = foundKey || clean;
          session.pendingWords[key] = (session.pendingWords[key] || 0) + 1;
          pendingAdded.push(key);
          return;
        }

        let foundKey: string | null = null;
        for (const k of Object.keys(session.words)) {
          if (k.toLowerCase() === clean.toLowerCase()) {
            foundKey = k;
            break;
          }
        }

        const key = foundKey || clean;
        session.words[key] = (session.words[key] || 0) + 1;
        addedWords.push(key);

        session.recentLogs.unshift({
          word: key,
          time: Date.now(),
          by: by || "Participante",
        });
      });

      if (session.recentLogs.length > 100) {
        session.recentLogs = session.recentLogs.slice(0, 100);
      }

      if (participantId && (addedWords.length > 0 || pendingAdded.length > 0)) {
        session.participantSubmissions[participantId] =
          (session.participantSubmissions[participantId] || 0) + addedWords.length + pendingAdded.length;
      }

      session.updatedAt = Date.now();
      session.participantCount += 1;
      await saveSession(session);

      return json({
        success: true,
        added: addedWords,
        blocked: blockedWords,
        pending: pendingAdded,
        skippedByQuota,
        session,
      });
    }

    // POST /api/sessions/:id/vote  (quick +1 on an existing/new word)
    if (segments.length === 3 && segments[2] === "vote" && method === "POST") {
      const session = await getOrCreateSession(id);
      const body = await req.json().catch(() => ({}));
      const { word } = body || {};
      if (typeof word !== "string" || !word.trim()) {
        return json({ error: "Falta la palabra a votar" }, 400);
      }
      const clean = word.trim().substring(0, 35);

      if (isBlocked(clean, session)) {
        return json({ error: "Esa palabra no está permitida" }, 400);
      }

      const participantId = getParticipantId(req);

      let foundKey: string | null = null;
      for (const k of Object.keys(session.words)) {
        if (k.toLowerCase() === clean.toLowerCase()) {
          foundKey = k;
          break;
        }
      }

      // Voting on an already-approved word is always allowed (it's not new
      // content); only a brand-new word goes through review, same as a
      // regular submission.
      if (!foundKey && session.moderationMode === "review") {
        if (participantId) {
          const used = session.participantSubmissions[participantId] || 0;
          if (used >= MAX_WORDS_PER_PARTICIPANT) {
            return json({ error: "Ya enviaste tus palabras para esta sesión.", limitReached: true }, 429);
          }
          session.participantSubmissions[participantId] = used + 1;
        }
        let foundPendingKey: string | null = null;
        for (const k of Object.keys(session.pendingWords)) {
          if (k.toLowerCase() === clean.toLowerCase()) {
            foundPendingKey = k;
            break;
          }
        }
        const key = foundPendingKey || clean;
        session.pendingWords[key] = (session.pendingWords[key] || 0) + 1;
        session.updatedAt = Date.now();
        await saveSession(session);
        return json({ success: true, pending: true, session });
      }

      if (participantId) {
        const used = session.participantSubmissions[participantId] || 0;
        if (used >= MAX_WORDS_PER_PARTICIPANT) {
          return json({ error: "Ya enviaste tus palabras para esta sesión.", limitReached: true }, 429);
        }
        session.participantSubmissions[participantId] = used + 1;
      }

      const key = foundKey || clean;
      session.words[key] = (session.words[key] || 0) + 1;
      session.recentLogs.unshift({ word: key, time: Date.now(), by: "Participante" });
      if (session.recentLogs.length > 100) {
        session.recentLogs = session.recentLogs.slice(0, 100);
      }
      session.updatedAt = Date.now();
      await saveSession(session);

      return json({ success: true, session });
    }

    // POST /api/sessions/:id/pending/:word/approve
    // POST /api/sessions/:id/pending/:word/reject
    if (segments.length === 5 && segments[2] === "pending" && method === "POST") {
      if (!isAuthorized(req)) return json({ error: "No autorizado" }, 401);
      const session = await getOrCreateSession(id);
      const decodedWord = decodeURIComponent(segments[3]);
      const action = segments[4];

      let foundKey: string | null = null;
      for (const k of Object.keys(session.pendingWords)) {
        if (k.toLowerCase() === decodedWord.toLowerCase()) {
          foundKey = k;
          break;
        }
      }
      if (!foundKey) return json({ error: "Palabra pendiente no encontrada" }, 404);

      const pendingCount = session.pendingWords[foundKey];
      delete session.pendingWords[foundKey];

      if (action === "approve") {
        let foundWordKey: string | null = null;
        for (const k of Object.keys(session.words)) {
          if (k.toLowerCase() === foundKey.toLowerCase()) {
            foundWordKey = k;
            break;
          }
        }
        const key = foundWordKey || foundKey;
        session.words[key] = (session.words[key] || 0) + pendingCount;
        session.recentLogs.unshift({ word: key, time: Date.now(), by: "Participante" });
      } else if (action !== "reject") {
        return json({ error: "Acción inválida" }, 400);
      }

      session.updatedAt = Date.now();
      await saveSession(session);
      return json({ success: true, session });
    }

    // PUT/POST /api/sessions/:id/settings  and  /config
    // (title, promptQuestion, resetWords, customBlockedWords, moderationMode)
    if (
      segments.length === 3 &&
      (segments[2] === "settings" || segments[2] === "config") &&
      (method === "PUT" || method === "POST")
    ) {
      if (!isAuthorized(req)) return json({ error: "No autorizado" }, 401);
      const session = await getOrCreateSession(id);
      const body = await req.json().catch(() => ({}));
      const { title, promptQuestion, resetWords, customBlockedWords, moderationMode } = body || {};

      if (typeof title === "string" && title.trim()) {
        session.title = title.trim();
      }
      if (typeof promptQuestion === "string" && promptQuestion.trim()) {
        session.promptQuestion = promptQuestion.trim();
      }
      if (Array.isArray(customBlockedWords)) {
        session.customBlockedWords = customBlockedWords
          .map((w: unknown) => String(w).trim())
          .filter((w: string) => w.length > 0)
          .slice(0, 200);
      }
      if (moderationMode === "auto" || moderationMode === "review") {
        session.moderationMode = moderationMode;
      }
      if (resetWords) {
        // Close out the current round into history before wiping the
        // canvas, so the facilitator can compare rounds at the end.
        if (Object.keys(session.words).length > 0 || session.participantCount > 0) {
          session.history.unshift({
            title: session.title,
            promptQuestion: session.promptQuestion,
            words: { ...session.words },
            participantCount: session.participantCount,
            closedAt: Date.now(),
          });
          session.history = session.history.slice(0, MAX_HISTORY_ROUNDS);
        }
        session.words = {};
        session.recentLogs = [];
        session.participantCount = 0;
        session.pendingWords = {};
        session.participantSubmissions = {};
      }
      session.updatedAt = Date.now();
      await saveSession(session);

      return json({ success: true, session });
    }

    // PUT /api/sessions/:id/logo  (upload a base64 data-url image)
    if (segments.length === 3 && segments[2] === "logo" && method === "PUT") {
      if (!isAuthorized(req)) return json({ error: "No autorizado" }, 401);
      const session = await getOrCreateSession(id);
      const body = await req.json().catch(() => ({}));
      const { dataUrl } = body || {};

      if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) {
        return json({ error: "Formato de imagen inválido" }, 400);
      }
      const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) {
        return json({ error: "Formato de imagen inválido" }, 400);
      }
      const contentType = match[1];
      const base64Data = match[2];
      if (!contentType.startsWith("image/")) {
        return json({ error: "El archivo debe ser una imagen" }, 400);
      }
      const approxBytes = (base64Data.length * 3) / 4;
      if (approxBytes > 3 * 1024 * 1024) {
        return json({ error: "La imagen es demasiado grande (máx. 3MB)" }, 400);
      }

      const nodeBuffer = Buffer.from(base64Data, "base64");
      const arrayBuffer = nodeBuffer.buffer.slice(
        nodeBuffer.byteOffset,
        nodeBuffer.byteOffset + nodeBuffer.byteLength
      ) as ArrayBuffer;
      const logoStore = getLogoStore();
      await logoStore.set(id, arrayBuffer, { metadata: { contentType } });

      session.logoUrl = `/api/sessions/${id}/logo?v=${Date.now()}`;
      session.updatedAt = Date.now();
      await saveSession(session);

      return json({ success: true, session });
    }

    // GET /api/sessions/:id/logo  (public — serves the raw image bytes)
    if (segments.length === 3 && segments[2] === "logo" && method === "GET") {
      const logoStore = getLogoStore();
      const data = await logoStore.get(id, { type: "arrayBuffer" });
      if (!data) return json({ error: "Logo no encontrado" }, 404);
      const metadata = await logoStore.getMetadata(id);
      const contentType = (metadata?.metadata?.contentType as string) || "image/png";
      return new Response(data, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=300",
        },
      });
    }

    // DELETE /api/sessions/:id/logo
    if (segments.length === 3 && segments[2] === "logo" && method === "DELETE") {
      if (!isAuthorized(req)) return json({ error: "No autorizado" }, 401);
      const session = await getOrCreateSession(id);
      const logoStore = getLogoStore();
      await logoStore.delete(id);
      session.logoUrl = undefined;
      session.updatedAt = Date.now();
      await saveSession(session);
      return json({ success: true, session });
    }

    // DELETE /api/sessions/:id/words/:word
    if (segments.length === 4 && segments[2] === "words" && method === "DELETE") {
      if (!isAuthorized(req)) return json({ error: "No autorizado" }, 401);
      const session = await getOrCreateSession(id);
      const decodedWord = decodeURIComponent(segments[3]);
      let deleted = false;

      for (const k of Object.keys(session.words)) {
        if (k.toLowerCase() === decodedWord.toLowerCase()) {
          delete session.words[k];
          deleted = true;
        }
      }

      if (deleted) {
        session.updatedAt = Date.now();
        session.recentLogs = session.recentLogs.filter(
          (l) => l.word.toLowerCase() !== decodedWord.toLowerCase()
        );
        await saveSession(session);
      }

      return json({ success: true, session });
    }

    // PUT/PATCH /api/sessions/:id/words/:word  (set count directly)
    if (
      segments.length === 4 &&
      segments[2] === "words" &&
      (method === "PUT" || method === "PATCH")
    ) {
      if (!isAuthorized(req)) return json({ error: "No autorizado" }, 401);
      const session = await getOrCreateSession(id);
      const decodedWord = decodeURIComponent(segments[3]);
      const body = await req.json().catch(() => ({}));
      const { count } = body || {};

      if (typeof count !== "number" || count < 0) {
        return json({ error: "Conteo inválido" }, 400);
      }

      if (count === 0) {
        delete session.words[decodedWord];
      } else {
        session.words[decodedWord] = count;
      }
      session.updatedAt = Date.now();
      await saveSession(session);

      return json({ success: true, session });
    }

    // POST /api/sessions/:id/reset
    if (segments.length === 3 && segments[2] === "reset" && method === "POST") {
      if (!isAuthorized(req)) return json({ error: "No autorizado" }, 401);
      const session = await getOrCreateSession(id);
      session.words = {};
      session.recentLogs = [];
      session.pendingWords = {};
      session.participantSubmissions = {};
      session.updatedAt = Date.now();
      await saveSession(session);
      return json({ success: true, session });
    }

    // POST /api/sessions/:id/seed
    if (segments.length === 3 && segments[2] === "seed" && method === "POST") {
      if (!isAuthorized(req)) return json({ error: "No autorizado" }, 401);
      const session = await getOrCreateSession(id);
      session.words = { ...initialDefaultWords };
      session.updatedAt = Date.now();
      await saveSession(session);
      return json({ success: true, session });
    }

    return json({ error: "Not found" }, 404);
  } catch (err) {
    console.error("API error:", err);
    return json({ error: "Error interno del servidor" }, 500);
  }
};

export const config: Config = {
  path: "/api/*",
};
