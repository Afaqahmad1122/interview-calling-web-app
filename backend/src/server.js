import express from "express";
import { ENV } from "./lib/env.js";
import path from "path";
import { connectDB } from "./lib/db.js";

const app = express();

const __dirname = path.resolve();

// make for deployement

if (ENV.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "frontend", "dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "frontend", "dist", "index.html"));
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
