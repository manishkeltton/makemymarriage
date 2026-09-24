import { MongoMemoryServer } from "mongodb-memory-server";

async function startLocalMongo() {
  console.log("Starting in-memory MongoDB instance...");
  const mongoServer = await MongoMemoryServer.create({
    instance: {
      port: 27017,
      dbName: "MakeMyMarriageDB",
    },
  });

  const uri = mongoServer.getUri();
  console.log(`🚀 Local In-Memory MongoDB running at: ${uri}`);
  
  process.on("SIGINT", async () => {
    await mongoServer.stop();
    process.exit(0);
  });

  // Keep process alive
  setInterval(() => {}, 1000);
}

startLocalMongo().catch(err => {
  console.error("Failed to start MongoMemoryServer:", err);
  process.exit(1);
});
