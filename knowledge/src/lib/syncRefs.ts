import { genId, getState, isoNow, mutate } from "./mockDb";
import { extractWikiLinks, resolveWikiLink } from "./markdown";
import type { Scope } from "./types";
import { isGatewayMode } from "./data/dataSource";
import { documentsRepo } from "./data/documents.repo";
import { sharedDocumentsRepo } from "./data/sharedDocuments.repo";
import { documentReferencesRepo } from "./data/documentReferences.repo";
import { sharedDocumentReferencesRepo } from "./data/sharedDocumentReferences.repo";

interface RefTarget {
  target_scope: Scope;
  target_document_id: string;
}

// Rebuild references from a document's content
export async function syncPersonalRefs(docId: string): Promise<void> {
  if (isGatewayMode()) return syncPersonalRefsGateway(docId);
  syncPersonalRefsMock(docId);
}

export async function syncSharedRefs(sharedId: string): Promise<void> {
  if (isGatewayMode()) return syncSharedRefsGateway(sharedId);
  syncSharedRefsMock(sharedId);
}

export async function syncAllRefsFor(scope: Scope, id: string): Promise<void> {
  if (scope === "personal") return syncPersonalRefs(id);
  return syncSharedRefs(id);
}

function syncPersonalRefsMock(docId: string) {
  const s = getState();
  const doc = s.documents.find((d) => d.id === docId);
  if (!doc) return;
  const links = extractWikiLinks(doc.content);
  mutate((db) => {
    db.document_references = db.document_references.filter((r) => r.source_document_id !== docId);
    // A personal link only ever resolves within the same owner's own documents.
    const ownDocs = db.documents.filter((d) => d.owner_id === doc.owner_id);
    for (const link of links) {
      const resolved = resolveWikiLink(link, ownDocs, db.shared_documents);
      if (!resolved || (resolved.scope === "personal" && resolved.id === docId)) continue;
      db.document_references.push({
        id: genId("r"),
        owner_id: doc.owner_id,
        source_document_id: docId,
        target_scope: resolved.scope,
        target_document_id: resolved.id,
        created_at: isoNow(),
      });
    }
  });
}

function syncSharedRefsMock(sharedId: string) {
  const s = getState();
  const doc = s.shared_documents.find((d) => d.id === sharedId);
  if (!doc) return;
  const links = extractWikiLinks(doc.content);
  mutate((db) => {
    db.shared_document_references = db.shared_document_references.filter(
      (r) => r.source_shared_document_id !== sharedId,
    );
    for (const link of links) {
      // ADR-005 / Documento 01 §5.2: a shared document can only reference another shared document.
      const resolved = resolveWikiLink(link, [], db.shared_documents);
      if (!resolved || resolved.id === sharedId) continue;
      db.shared_document_references.push({
        id: genId("sr"),
        source_shared_document_id: sharedId,
        target_shared_document_id: resolved.id,
        created_at: isoNow(),
      });
    }
  });
}

// The mock path can afford delete-all-then-recreate — it's an in-memory
// filter+push. Against the real gateway that would mean N create + N remove
// HTTP round-trips on every single save, even when nothing changed. Diff the
// desired edge set against what's already there instead, and only touch the
// ones that actually differ.
function refKey(t: RefTarget): string {
  return `${t.target_scope}:${t.target_document_id}`;
}

async function syncPersonalRefsGateway(docId: string): Promise<void> {
  const allDocs = await documentsRepo.list();
  const doc = allDocs.find((d) => d.id === docId);
  if (!doc) return;

  const [sharedDocs, allRefs] = await Promise.all([
    sharedDocumentsRepo.list(),
    documentReferencesRepo.list(),
  ]);

  // A personal link only ever resolves within the same owner's own documents.
  const ownDocs = allDocs.filter((d) => d.owner_id === doc.owner_id);
  const links = extractWikiLinks(doc.content);

  const desired = new Map<string, RefTarget>();
  for (const link of links) {
    const resolved = resolveWikiLink(link, ownDocs, sharedDocs);
    if (!resolved || (resolved.scope === "personal" && resolved.id === docId)) continue;
    const target: RefTarget = { target_scope: resolved.scope, target_document_id: resolved.id };
    desired.set(refKey(target), target);
  }

  const current = allRefs.filter((r) => r.source_document_id === docId);
  const currentKeys = new Set(current.map((r) => refKey(r)));

  const toRemove = current.filter((r) => !desired.has(refKey(r)));
  const toCreate = Array.from(desired.values()).filter((t) => !currentKeys.has(refKey(t)));

  await Promise.all([
    ...toRemove.map((r) => documentReferencesRepo.remove(r.id)),
    ...toCreate.map((target) =>
      documentReferencesRepo.create({
        owner_id: doc.owner_id,
        source_document_id: docId,
        ...target,
      }),
    ),
  ]);
}

async function syncSharedRefsGateway(sharedId: string): Promise<void> {
  const sharedDocs = await sharedDocumentsRepo.list();
  const doc = sharedDocs.find((d) => d.id === sharedId);
  if (!doc) return;

  const allRefs = await sharedDocumentReferencesRepo.list();
  const links = extractWikiLinks(doc.content);

  const desired = new Set<string>();
  for (const link of links) {
    // ADR-005 / Documento 01 §5.2: a shared document can only reference another shared document.
    const resolved = resolveWikiLink(link, [], sharedDocs);
    if (!resolved || resolved.id === sharedId) continue;
    desired.add(resolved.id);
  }

  const current = allRefs.filter((r) => r.source_shared_document_id === sharedId);
  const currentTargets = new Set(current.map((r) => r.target_shared_document_id));

  const toRemove = current.filter((r) => !desired.has(r.target_shared_document_id));
  const toCreate = Array.from(desired).filter((targetId) => !currentTargets.has(targetId));

  await Promise.all([
    ...toRemove.map((r) => sharedDocumentReferencesRepo.remove(r.id)),
    ...toCreate.map((targetId) =>
      sharedDocumentReferencesRepo.create({
        source_shared_document_id: sharedId,
        target_shared_document_id: targetId,
      }),
    ),
  ]);
}
