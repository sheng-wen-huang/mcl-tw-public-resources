import { ObjectId } from "mongodb";

export function normalizeFlow(doc) {
  if (!doc) return null;
  return {
    id: String(doc._id),
    configName: doc.configName || "",
    spName: doc.spName || "",
    client: doc.client || "",
    logicType: doc.logicType || "Allocation",
    status: doc.status || "published",
    overview: doc.overview || "",
    description: doc.description || doc.overview || "",
    whenItApplies: doc.whenItApplies || "",
    mermaid: doc.mermaid || "",
    examples: Array.isArray(doc.examples) ? doc.examples : [],
    knownExceptions: Array.isArray(doc.knownExceptions) ? doc.knownExceptions : [],
    hashtags: Array.isArray(doc.hashtags) ? doc.hashtags : (Array.isArray(doc.relatedConfigs) ? doc.relatedConfigs : []),
    relatedConfigs: Array.isArray(doc.relatedConfigs) ? doc.relatedConfigs : [],
    updatedBy: doc.updatedBy || "",
    updatedByUserId: doc.updatedByUserId || "",
    updatedAt: doc.updatedAt || "",
    createdAt: doc.createdAt || ""
  };
}

export function toObjectId(id) {
  if (!ObjectId.isValid(id)) return null;
  return new ObjectId(id);
}

export function validateFlowPayload(payload) {
  const errors = [];

  const data = {
    configName: String(payload.configName || "").trim(),
    spName: String(payload.spName || "").trim(),
    client: String(payload.client || "").trim(),
    logicType: String(payload.logicType || "Allocation").trim(),
    status: String(payload.status || "published").trim(),
    overview: String(payload.overview || "").trim(),
    description: String(payload.description || payload.overview || "").trim(),
    whenItApplies: String(payload.whenItApplies || "").trim(),
    mermaid: String(payload.mermaid || "").trim(),
    examples: Array.isArray(payload.examples) ? payload.examples : [],
    knownExceptions: Array.isArray(payload.knownExceptions) ? payload.knownExceptions : [],
    hashtags: Array.isArray(payload.hashtags) ? payload.hashtags : (Array.isArray(payload.relatedConfigs) ? payload.relatedConfigs : []),
    relatedConfigs: Array.isArray(payload.relatedConfigs) ? payload.relatedConfigs : []
  };

  if (!data.configName) errors.push("Config name is required.");
  if (!data.spName) errors.push("SP name is required.");
  if (!data.mermaid) errors.push("Mermaid source is required.");
  if (!data.mermaid.startsWith("flowchart") && !data.mermaid.startsWith("graph")) {
    errors.push("Mermaid source should start with flowchart or graph.");
  }

  data.examples = data.examples.map((example) => ({
    title: String(example.title || "").trim(),
    scenario: String(example.scenario || "").trim(),
    expectedResult: String(example.expectedResult || "").trim()
  })).filter((example) => example.title || example.scenario || example.expectedResult);

  data.knownExceptions = data.knownExceptions
    .map((item) => String(item || "").trim())
    .filter(Boolean);

  data.hashtags = data.hashtags
    .map((item) => String(item || "").trim())
    .map((item) => item.replace(/^#+/, ""))
    .filter(Boolean);

  data.relatedConfigs = data.hashtags;

  return { data, errors };
}

export function actorFromSession(session) {
  const username = session?.user?.githubUsername;
  return {
    updatedBy: session?.user?.name || username || "Unknown admin",
    updatedByUserId: username ? `github:${username}` : "github:unknown"
  };
}
