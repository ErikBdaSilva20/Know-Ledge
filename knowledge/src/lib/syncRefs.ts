import { extractWikiLinks, resolveWikiLink } from "./markdown";
import type { Scope } from "./types";
import { documentsRepo } from "./data/documents.repo";
import { sharedDocumentsRepo } from "./data/sharedDocuments.repo";
import { documentReferencesRepo } from "./data/documentReferences.repo";
import { sharedDocumentReferencesRepo } from "./data/sharedDocumentReferences.repo";

interface RefTarget {
  target_scope: Scope;
  target_document_id: string;
}

export async function syncAllRefsFor(scope: Scope, id: string): Promise<void> {
  if (scope === "personal") return syncPersonalRefs(id);
  return syncSharedRefs(id);
}

// Diff the desired edge set against what's already stored and only touch the
// ones that actually differ — a delete-all-then-recreate would mean N create +
// N remove HTTP round-trips on every save, even when nothing changed.
function refKey(t: RefTarget): string {
  return `${t.target_scope}:${t.target_document_id}`;
}

// Rebuild the references originating from a personal document's content.
export async function syncPersonalRefs(docId: string): Promise<void> {
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

// Rebuild the references originating from a shared document's content.
export async function syncSharedRefs(sharedId: string): Promise<void> {
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
