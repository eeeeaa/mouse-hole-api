//In-memory mongodb database - can be used for testing

/*When to mock/test database operations
- standard operations -> no need to test since mongoose alrady test them already
- compliated/custom operations -> test to ensure it works correctly
*/

const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

async function initializeMongoServer() {
  const mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  await mongoose.connect(mongoUri, { dbName: "test" });

  mongoose.connection.on("error", (e) => {
    if (e.message.code === "ETIMEDOUT") {
      console.log(e);
      mongoose.connect(mongoUri);
    }
    console.log(e);
  });

  mongoose.connection.once("open", () => {
    console.log(`MongoDB successfully connected to ${mongoUri}`);
  });
}

async function closeServer() {
  await mongoose.connection.close();
}

module.exports = { initializeMongoServer, closeServer };
