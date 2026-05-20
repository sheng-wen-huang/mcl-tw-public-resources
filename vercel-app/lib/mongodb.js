import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "wms_config_explorer";

let cached = globalThis.__wmsMongo;

if (!cached) {
  cached = globalThis.__wmsMongo = { client: null, promise: null };
}

export async function getDb() {
  if (!uri) {
    throw new Error("Missing MONGODB_URI environment variable");
  }

  if (!cached.promise) {
    cached.promise = MongoClient.connect(uri, {});
  }

  cached.client = await cached.promise;
  return cached.client.db(dbName);
}

export async function getFlowsCollection() {
  const db = await getDb();
  return db.collection("flows");
}

export async function getAuditCollection() {
  const db = await getDb();
  return db.collection("auditLogs");
}
