import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface SessionData {
  id: string;
  title: string;
  promptQuestion: string;
  words: Record<string, number>;
  createdAt: number;
  updatedAt: number;
  participantCount: number;
  recentLogs: Array<{ word: string; time: number; by?: string }>;
}

const sessions: Map<string, SessionData> = new Map();

// Initialize default session with rich inspirational words for initial display
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

sessions.set("default", {
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
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "5mb" }));

  // API Routes
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
  });

  // Get session info
  app.get("/api/sessions/:id", (req, res) => {
    const { id } = req.params;
    let session = sessions.get(id);

    if (!session) {
      if (id === "default") {
        session = {
          id: "default",
          title: "Sesión Interactiva en Vivo",
          promptQuestion: "¿Qué palabra define mejor nuestro próximo desafío?",
          words: { ...initialDefaultWords },
          createdAt: Date.now(),
          updatedAt: Date.now(),
          participantCount: 36,
          recentLogs: [],
        };
        sessions.set("default", session);
      } else {
        // Automatically provision new session
        session = {
          id,
          title: `Sesión ${id}`,
          promptQuestion: "¿Qué palabra te viene a la mente?",
          words: {},
          createdAt: Date.now(),
          updatedAt: Date.now(),
          participantCount: 0,
          recentLogs: [],
        };
        sessions.set(id, session);
      }
    }

    res.json(session);
  });

  // Create custom session
  app.post("/api/sessions", (req, res) => {
    const { title, promptQuestion } = req.body || {};
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
    sessions.set(id, newSession);
    res.status(201).json(newSession);
  });

  // Add word(s) to a session
  app.post("/api/sessions/:id/words", (req, res) => {
    const { id } = req.params;
    const { word, words, by } = req.body || {};

    let session = sessions.get(id);
    if (!session) {
      session = {
        id,
        title: `Sesión ${id}`,
        promptQuestion: "¿Qué palabra te viene a la mente?",
        words: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
        participantCount: 0,
        recentLogs: [],
      };
      sessions.set(id, session);
    }

    const itemsToAdd: string[] = [];

    if (Array.isArray(words)) {
      itemsToAdd.push(...words.map((w: string) => String(w)));
    } else if (typeof word === "string" && word.trim()) {
      // Allow comma or space separated words if entered together
      const split = word
        .split(/[,;\n]+/)
        .map((w) => w.trim())
        .filter((w) => w.length > 0);
      itemsToAdd.push(...split);
    }

    if (itemsToAdd.length === 0) {
      return res.status(400).json({ error: "No se proporcionaron palabras válidas" });
    }

    const addedWords: string[] = [];

    itemsToAdd.forEach((rawWord) => {
      // Clean word, trim whitespace, normalize max length to 35 chars
      const clean = rawWord.trim().substring(0, 35);
      if (!clean) return;

      // Find existing case-insensitive match or format nicely
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

    res.json({
      success: true,
      added: addedWords,
      session,
    });
  });

  // Update session settings, title or prompt question
  const handleUpdateSession = (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    const { title, promptQuestion, resetWords } = req.body || {};

    let session = sessions.get(id);
    if (!session) {
      if (id === "default") {
        session = {
          id: "default",
          title: "Sesión Interactiva en Vivo",
          promptQuestion: "¿Qué palabra define mejor nuestro próximo desafío?",
          words: { ...initialDefaultWords },
          createdAt: Date.now(),
          updatedAt: Date.now(),
          participantCount: 36,
          recentLogs: [],
        };
        sessions.set("default", session);
      } else {
        return res.status(404).json({ error: "Sesión no encontrada" });
      }
    }

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

    res.json({ success: true, session });
  };

  app.put("/api/sessions/:id/settings", handleUpdateSession);
  app.post("/api/sessions/:id/config", handleUpdateSession);
  app.put("/api/sessions/:id/config", handleUpdateSession);

  // Delete a specific word (moderation)
  app.delete("/api/sessions/:id/words/:word", (req, res) => {
    const { id, word } = req.params;
    const session = sessions.get(id);
    if (!session) {
      return res.status(404).json({ error: "Sesión no encontrada" });
    }

    const decodedWord = decodeURIComponent(word);
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
    }

    res.json({ success: true, session });
  });

  // Modify word frequency directly (+ / -)
  app.patch("/api/sessions/:id/words/:word", (req, res) => {
    const { id, word } = req.params;
    const { count } = req.body || {};
    const session = sessions.get(id);
    if (!session) {
      return res.status(404).json({ error: "Sesión no encontrada" });
    }

    const decodedWord = decodeURIComponent(word);
    if (typeof count !== "number" || count < 0) {
      return res.status(400).json({ error: "Conteo inválido" });
    }

    if (count === 0) {
      delete session.words[decodedWord];
    } else {
      session.words[decodedWord] = count;
    }
    session.updatedAt = Date.now();

    res.json({ success: true, session });
  });

  // Clear / Reset all words in a session
  app.post("/api/sessions/:id/reset", (req, res) => {
    const { id } = req.params;
    const session = sessions.get(id);
    if (!session) {
      return res.status(404).json({ error: "Sesión no encontrada" });
    }

    session.words = {};
    session.recentLogs = [];
    session.updatedAt = Date.now();

    res.json({ success: true, session });
  });

  // Reset to default sample words
  app.post("/api/sessions/:id/seed", (req, res) => {
    const { id } = req.params;
    const session = sessions.get(id);
    if (!session) {
      return res.status(404).json({ error: "Sesión no encontrada" });
    }

    session.words = { ...initialDefaultWords };
    session.updatedAt = Date.now();

    res.json({ success: true, session });
  });

  // Vite middleware for development vs static for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Error starting server:", err);
});
