import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rate limiter: 100 requests per 15 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Parse JSON request bodies
  app.use(express.json());

  const rawBasePath = process.env.BASE_PATH || "/hivemind";
  const normalizedBasePath = rawBasePath.replace(/\/+$/, "");
  const basePath = normalizedBasePath === "" ? "/" : normalizedBasePath;
  const apiBasePath = basePath === "/" ? "" : basePath;

  const apiRouter = express.Router();

  // API Proxy Endpoints
  // POST /api/generate - Text generation proxy
  // Accepts the full Gemini API request body format
  apiRouter.post("/generate", apiLimiter, async (req, res) => {
    try {
      const { model, ...geminiRequestBody } = req.body;

      // Validate request
      if (!model) {
        return res.status(400).json({
          error: "Missing required field: model",
        });
      }

      if (!geminiRequestBody.contents) {
        return res.status(400).json({
          error: "Missing required field: contents",
        });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.error("GEMINI_API_KEY not configured");
        return res.status(500).json({ error: "API key not configured" });
      }

      // Proxy request to Gemini API with full request body
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(geminiRequestBody),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API error:", errorText);
        return res.status(response.status).json({
          error: "Failed to generate content",
          details: errorText,
        });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error in /api/generate:", error);
      res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // POST /api/generate-image - Image generation proxy (alias for /api/generate)
  // Both text and image generation use the same endpoint
  apiRouter.post("/generate-image", apiLimiter, async (req, res) => {
    try {
      const { model, ...geminiRequestBody } = req.body;

      // Validate request
      if (!model) {
        return res.status(400).json({
          error: "Missing required field: model",
        });
      }

      if (!geminiRequestBody.contents) {
        return res.status(400).json({
          error: "Missing required field: contents",
        });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.error("GEMINI_API_KEY not configured");
        return res.status(500).json({ error: "API key not configured" });
      }

      // Proxy request to Gemini API with full request body
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(geminiRequestBody),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API error:", errorText);
        return res.status(response.status).json({
          error: "Failed to generate image",
          details: errorText,
        });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error in /api/generate-image:", error);
      res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.use("/api", apiRouter);
  if (apiBasePath) {
    app.use(`${apiBasePath}/api`, apiRouter);
  }

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  // Base path for serving under the configured subpath
  // Serve static files at the base path
  app.use(basePath, express.static(staticPath));

  // Also serve at root for direct access
  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all routes under base path
  app.get(`${basePath}/*`, (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  // Also handle root for direct port access
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
