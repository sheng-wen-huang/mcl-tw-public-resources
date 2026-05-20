import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { getAuditCollection, getFlowsCollection } from "../../../../lib/mongodb";
import { actorFromSession, normalizeFlow, toObjectId, validateFlowPayload } from "../../../../lib/flows";
import { authOptions, getPublicCorsHeaders } from "../../../../lib/auth";

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: getPublicCorsHeaders() });
}

export async function GET(_request, { params }) {
  const { id: rawId } = await params;
  const id = toObjectId(rawId);
  if (!id) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400, headers: getPublicCorsHeaders() });
  }

  const collection = await getFlowsCollection();
  const doc = await collection.findOne({ _id: id });
  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404, headers: getPublicCorsHeaders() });
  }

  return NextResponse.json(normalizeFlow(doc), { headers: getPublicCorsHeaders() });
}

export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: rawId } = await params;
  const id = toObjectId(rawId);
  if (!id) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const payload = await request.json();
  const { data, errors } = validateFlowPayload(payload);
  if (errors.length) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const now = new Date().toISOString();
  const actor = actorFromSession(session);
  const collection = await getFlowsCollection();
  const result = await collection.findOneAndUpdate(
    { _id: id },
    { $set: { ...data, ...actor, updatedAt: now } },
    { returnDocument: "after" }
  );

  if (!result) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const audit = await getAuditCollection();
  await audit.insertOne({
    action: "update",
    flowId: String(id),
    by: actor.updatedBy,
    byUserId: actor.updatedByUserId,
    at: now
  });

  return NextResponse.json(normalizeFlow(result));
}

export async function DELETE(_request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: rawId } = await params;
  const id = toObjectId(rawId);
  if (!id) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const actor = actorFromSession(session);
  const collection = await getFlowsCollection();
  const result = await collection.findOneAndUpdate(
    { _id: id },
    { $set: { status: "archived", ...actor, updatedAt: now } },
    { returnDocument: "after" }
  );

  if (!result) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const audit = await getAuditCollection();
  await audit.insertOne({
    action: "archive",
    flowId: String(id),
    by: actor.updatedBy,
    byUserId: actor.updatedByUserId,
    at: now
  });

  return NextResponse.json({ ok: true });
}
