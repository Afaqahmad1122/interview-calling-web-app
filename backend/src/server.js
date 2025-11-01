import express from "express";
import { ENV } from "./lib/env.js";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { existsSync } from "fs";
import { connectDB } from "./lib/db.js";

const app = express();

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get project root (try going up from backend/src, fallback to process.cwd())
const projectRoot = path.resolve(__dirname, "..", "..");

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files in production
if (ENV.NODE_ENV === "production") {
  // Try multiple possible paths for frontend/dist
  const possiblePaths = [
    path.join(projectRoot, "frontend", "dist"),
    path.join(process.cwd(), "frontend", "dist"),
    path.join(__dirname, "..", "..", "frontend", "dist"),
  ];

  const frontendDist =
    possiblePaths.find((p) => existsSync(p)) || possiblePaths[0];

  app.use(express.static(frontendDist));

  // Catch-all: serve index.html for SPA routing
  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"), (err) => {
      if (err) {
        res.status(404).json({ error: "File not found" });
      }
    });
  });
}

async function startServer() {
  try {
    await connectDB();
    app.listen(ENV.PORT, () => {
      console.log(`🚀 Server is running on port ${ENV.PORT}`);
    });
  } catch (error) {
    console.error("\n❌ Failed to start server:");
    console.error(`Error: ${error.message}`);

    if (error.message.includes("DNS") || error.code === "ETIMEOUT") {
      console.error("\n💡 DNS/Network Troubleshooting:");
      console.error("1. Verify MongoDB Atlas cluster is ACTIVE (not paused)");
      console.error(
        "2. Check network/DNS settings (try: nslookup cluster0.0kkpqua.mongodb.net)"
      );
      console.error("3. Restart your router/modem");
      console.error("4. Try different network or VPN");
      console.error("5. Check system DNS settings");
    } else {
      console.error("\n💡 General Troubleshooting:");
      console.error("1. Verify MongoDB Atlas cluster is running");
      console.error("2. Check if your IP is whitelisted (0.0.0.0/0)");
      console.error("3. Verify MONGODB_URI in .env file");
      console.error("4. Check MongoDB Atlas dashboard for cluster status\n");
    }
    process.exit(1);
  }
}

startServer();
