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

function normalizeForFilter(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function isBlocked(word: string): boolean {
  const normalized = normalizeForFilter(word);
  if (!normalized) return false;
  return BLOCKED_TERMS.some((term) => normalized === term || normalized.includes(term));
}

function isAuthorized(req: Request): boolean {
  const expected = process.env.MODERATOR_PIN;
  if (!expected) return false;
  const provided = req.headers.get("x-admin-pin") || "";
  return provided === expected;
}

function defaultSession(id: string): SessionData {
  if (id === "default") {
    return {
      id: "default",
      title: "Sesión Interactiva en Vivo",
      promptQuestion: "¿Qué palabra define mejor nuestro próximo desafío?",
      words: { ...initialDefaultWords },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      participantCount: 36,
      recentLogs: [
        { word: "Innovación", time: Date.now() - 60000, by: "Participante" },
        { word: "Creatividad", time: Date.now() - 40000, by: "Participante" },
        { word: "Impacto", time: Date.now() - 15000, by: "Participante" },
      ],
    };
  }
  return {
    id,
    title: `Sesión ${id}`,
    promptQuestion: "¿Qué palabra te viene a la mente?",
    words: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
    participantCount: 0,
    recentLogs: [],
  };
}

function getSessionStore() {
  return getStore("nube-sessions");
}

function getLogoStore() {
  return getStore("nube-logos");
}

async function getOrCreateSession(id: string): Promise<SessionData> {
  const store = getSessionStore();
  const existing = await store.get(id, { type: "json" });
  if (existing) return existing as SessionData;
  const fresh = defaultSession(id);
  await store.setJSON(id, fresh);
  return fresh;
}

async function saveSession(session: SessionData): Promise<void> {
  const store = getSessionStore();
  await store.setJSON(session.id, session);
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

    // POST /api/sessions  (create custom session)
    if (segments.length === 1 && method === "POST") {
      const body = await req.json().catch(() => ({}));
      const { title, promptQuestion } = body || {};
      const id = Math.random().toString(36).substring(2, 8).toUpperCase();
      const newSession: SessionData = {
        id,
        title: (title || `Sesión ${id}`).trim(),
        promptQuestion: (promptQuestion || "¿Qué palabra describe tu idea?").trim(),
        words: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
        participantCount: 0,
        recentLogs: [],
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

    // POST /api/sessions/:id/words
    if (segments.length === 3 && segments[2] === "words" && method === "POST") {
      const session = await getOrCreateSession(id);
      const body = await req.json().catch(() => ({}));
      const { word, words, by } = body || {};

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

      const addedWords: string[] = [];
      const blockedWords: string[] = [];
      itemsToAdd.forEach((rawWord) => {
        const clean = rawWord.trim().substring(0, 35);
        if (!clean) return;

        if (isBlocked(clean)) {
          blockedWords.push(clean);
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

      session.updatedAt = Date.now();
      session.participantCount += 1;
      await saveSession(session);

      return json({ success: true, added: addedWords, blocked: blockedWords, session });
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

      if (isBlocked(clean)) {
        return json({ error: "Esa palabra no está permitida" }, 400);
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
      session.recentLogs.unshift({ word: key, time: Date.now(), by: "Participante" });
      if (session.recentLogs.length > 100) {
        session.recentLogs = session.recentLogs.slice(0, 100);
      }
      session.updatedAt = Date.now();
      await saveSession(session);

      return json({ success: true, session });
    }

    // PUT/POST /api/sessions/:id/settings  and  /config  (title, promptQuestion, resetWords)
    if (
      segments.length === 3 &&
      (segments[2] === "settings" || segments[2] === "config") &&
      (method === "PUT" || method === "POST")
    ) {
      if (!isAuthorized(req)) return json({ error: "No autorizado" }, 401);
      const session = await getOrCreateSession(id);
      const body = await req.json().catch(() => ({}));
      const { title, promptQuestion, resetWords } = body || {};

      if (typeof title === "string" && title.trim()) {
        session.title = title.trim();
      }
      if (typeof promptQuestion === "string" && promptQuestion.trim()) {
        session.promptQuestion = promptQuestion.trim();
      }
      if (resetWords) {
        session.words = {};
        session.recentLogs = [];
        session.participantCount = 0;
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
