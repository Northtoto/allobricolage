/**
 * AlloBricolage Database Initialization Script
 * 
 * This script initializes the database with sample data.
 * Run with: npm run db:init
 */

import { config } from "dotenv";
config();

async function initDatabase() {
  console.log("🚀 AlloBricolage Database Initialization");
  console.log("=========================================\n");

  try {
    // Import storage after dotenv is loaded
    const { storagePromise } = await import("./storage");
    
    console.log("⏳ Connecting to storage...\n");
    const storage = await storagePromise;
    
    console.log("✅ Database initialized successfully!");
    console.log("\n📊 Current data:");
    
    // Show stats
    const technicians = await storage.getAllTechnicians();
    const jobs = await storage.getAllJobs();
    const bookings = await storage.getAllBookings();
    
    console.log(`   - Technicians: ${technicians.length}`);
    console.log(`   - Jobs: ${jobs.length}`);
    console.log(`   - Bookings: ${bookings.length}`);
    
    console.log("\n🎉 AlloBricolage is ready to use!");
    console.log("   Run 'npm run dev' to start the development server\n");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    process.exit(1);
  }
}

initDatabase();





