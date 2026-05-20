import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { getAuditCollection, getFlowsCollection } from "../../../lib/mongodb";
import { actorFromSession, normalizeFlow, validateFlowPayload } from "../../../lib/flows";
import { authOptions, getPublicCorsHeaders } from "../../../lib/auth";

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: getPublicCorsHeaders() });
}

export async function GET() {
  const collection = await getFlowsCollection();
  const docs = await collection
    .find({ status: { $ne: "archived" } })
    .sort({ configName: 1, spName: 1 })
    .toArray();

  return NextResponse.json(docs.map(normalizeFlow), {
    headers: getPublicCorsHeaders()
  });
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const { data, errors } = validateFlowPayload(payload);
  if (errors.length) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const now = new Date().toISOString();
  const actor = actorFromSession(session);
  const doc = {
    ...data,
    ...actor,
    createdAt: now,
    updatedAt: now
  };

  const collection = await getFlowsCollection();
  const result = await collection.insertOne(doc);

  const audit = await getAuditCollection();
  await audit.insertOne({
    action: "create",
    flowId: String(result.insertedId),
    by: actor.updatedBy,
    byUserId: actor.updatedByUserId,
    at: now
  });

  return NextResponse.json(normalizeFlow({ _id: result.insertedId, ...doc }), { status: 201 });
}
