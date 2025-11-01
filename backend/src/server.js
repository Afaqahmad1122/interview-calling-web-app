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

// Get project root (go up from backend/src to project root)
const projectRoot = path.resolve(__dirname, "..", "..");

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Try multiple possible paths for frontend/dist
const possiblePaths = [
  path.join(projectRoot, "frontend", "dist"),
  path.join(process.cwd(), "frontend", "dist"),
  path.join(__dirname, "..", "..", "frontend", "dist"),
  path.join(process.cwd(), "dist"),
];

// Find the actual dist folder
const frontendDist = possiblePaths.find((p) => existsSync(p));

// Log paths for debugging
console.log("🔍 Checking for frontend/dist folder...");
console.log("NODE_ENV:", ENV.NODE_ENV);
console.log("Possible paths checked:");
possiblePaths.forEach((p) => {
  console.log(`  - ${p} ${existsSync(p) ? "✅ EXISTS" : "❌ NOT FOUND"}`);
});

// Serve static files if dist folder exists
if (frontendDist) {
  console.log(`✅ Serving static files from: ${frontendDist}`);
  app.use(express.static(frontendDist));

  // Catch-all: serve index.html for SPA routing
  app.get("*", (req, res) => {
    const indexPath = path.join(frontendDist, "index.html");
    if (existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).json({
        error: "index.html not found",
        path: indexPath,
        message:
          "Frontend build files not found. Please build the frontend first.",
      });
    }
  });
} else {
  console.log("⚠️  Frontend dist folder not found!");
  console.log("Please build the frontend: cd frontend && npm run build");

  // Fallback route when dist doesn't exist
  app.get("*", (req, res) => {
    res.status(404).json({
      error: "Frontend not built",
      message:
        "Frontend build files (dist folder) not found. Please build the frontend first.",
      checkedPaths: possiblePaths,
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
