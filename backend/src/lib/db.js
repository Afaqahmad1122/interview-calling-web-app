import mongoose from "mongoose";
import { ENV } from "./env.js";
import dns from "dns";

// Configure Node.js to use system DNS resolver
// This helps with SRV/TXT record resolution
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]); // Google and Cloudflare DNS

export const connectDB = async () => {
  try {
    console.log("Connecting to MongoDB...");

    // Verify connection string exists
    if (!ENV.MONGODB_URI) {
      throw new Error("MONGODB_URI is not set in .env file");
    }

    const isSRV = ENV.MONGODB_URI.startsWith("mongodb+srv://");

    if (isSRV) {
      console.log("Using MongoDB SRV connection (Atlas)...");
      console.log("Note: Using alternative DNS servers for SRV resolution...");
    }

    // Connect with additional options for better timeout handling
    await mongoose.connect(ENV.MONGODB_URI, {
      serverSelectionTimeoutMS: isSRV ? 45000 : 15000, // 45s for SRV (DNS), 15s for regular
      socketTimeoutMS: 45000,
      connectTimeoutMS: isSRV ? 45000 : 15000,
      retryWrites: true,
      w: "majority",
      // Force mongoose to use Node's DNS resolver
      family: 4, // Use IPv4
    });
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("\n❌ MongoDB connection error:");
    console.error(`Error code: ${error.code || "UNKNOWN"}`);
    console.error(`Error message: ${error.message}`);

    if (
      error.code === "ETIMEOUT" ||
      error.code === "ENOTFOUND" ||
      error.message.includes("queryTxt")
    ) {
      console.error("\n⚠️  DNS Resolution Timeout:");
      console.error("Node.js cannot resolve SRV/TXT DNS records.");
      console.error("\n💡 Alternative Solution:");
      console.error(
        "Try converting mongodb+srv:// to mongodb:// connection string."
      );
      console.error(
        "Get it from MongoDB Atlas: Connect > Connect your application"
      );
      console.error("Or try using a different network/VPN.");
    }

    throw error;
  }
};
