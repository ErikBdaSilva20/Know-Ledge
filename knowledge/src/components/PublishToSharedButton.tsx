import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sharedDocumentsRepo } from "@/lib/data/sharedDocuments.repo";
import { syncSharedRefs } from "@/lib/syncRefs";
import { handleDomainError } from "@/lib/handleError";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Document } from "@/lib/types";

type PublishableDoc = Pick<Document, "id" | "title" | "content">;

interface Props {
  doc: PublishableDoc;
  /** Called after a successful publish — e.g. to refresh a shared-docs list. */
  onPublished?: () => void;
  /** Icon-only rendering for dense rows (admin vault tree). */
  compact?: boolean;
  className?: string;
}

// The single-document publish action, shared by the workspace toolbar and the
// admin vault view. Self-gates on `publishShared` (renders nothing for reps)
// and disables itself while in flight so a double-click can't fire twice.
export function PublishToSharedButton({ doc, onPublished, compact, className }: Props) {
  const { user, can } = useSession();
  const navigate = useNavigate();
  const [publishing, setPublishing] = useState(false);

  if (!can("publishShared")) return null;

  const publish = async () => {
    if (!user || publishing) return;
    setPublishing(true);
    try {
      const shared = await sharedDocumentsRepo.publish(doc, user.id, user.name);
      // Best-effort: the shared doc already exists, so a ref-sync failure
      // shouldn't block the success toast — surface it separately.
      syncSharedRefs(shared.id).catch((err) => handleDomainError(err, navigate));
      toast.success("Publicado na Base Compartilhada");
      onPublished?.();
    } catch (err) {
      handleDomainError(err, navigate);
    } finally {
      setPublishing(false);
    }
  };

  if (compact) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-7 w-7", className)}
        disabled={publishing}
        onClick={publish}
        title="Publicar na Base Compartilhada"
      >
        <Upload className="h-3.5 w-3.5" />
      </Button>
    );
  }

  return (
    <Button variant="ghost" size="sm" className={className} disabled={publishing} onClick={publish}>
      <Upload className="mr-1 h-3.5 w-3.5" />
      {publishing ? "Publicando…" : "Publicar na Base Compartilhada"}
    </Button>
  );
}

interface PublishManyProps {
  docs: PublishableDoc[];
  label: string;
  onPublished?: () => void;
  compact?: boolean;
  className?: string;
}

// Batch publish (Bloco 5, "jogar um vault/pasta inteira"). The Base
// Compartilhada is flat (no folder concept), so this publishes each document
// as its own shared_document — same sharedDocumentsRepo.publish() as the
// single-doc button above, just looped sequentially so a live "N/total"
// progress can be shown and one failure doesn't abort the rest of the batch.
export function PublishManyButton({
  docs,
  label,
  onPublished,
  compact,
  className,
}: PublishManyProps) {
  const { user, can } = useSession();
  const navigate = useNavigate();
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  if (!can("publishShared") || docs.length === 0) return null;
  const publishing = progress !== null;

  const publishAll = async () => {
    if (!user || publishing) return;
    let ok = 0;
    let failed = 0;
    setProgress({ done: 0, total: docs.length });
    for (const doc of docs) {
      try {
        const shared = await sharedDocumentsRepo.publish(doc, user.id, user.name);
        syncSharedRefs(shared.id).catch((err) => handleDomainError(err, navigate));
        ok++;
      } catch (err) {
        failed++;
        handleDomainError(err, navigate);
      }
      setProgress({ done: ok + failed, total: docs.length });
    }
    setProgress(null);
    onPublished?.();
    if (failed === 0) toast.success(`${ok} de ${docs.length} publicados`);
    else toast.error(`${ok} de ${docs.length} publicados — ${failed} falharam`);
  };

  const progressLabel = progress ? `Publicando… ${progress.done}/${progress.total}` : label;

  if (compact) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-7 w-7", className)}
        disabled={publishing}
        onClick={publishAll}
        title={progressLabel}
      >
        <Upload className="h-3.5 w-3.5" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={className}
      disabled={publishing}
      onClick={publishAll}
    >
      <Upload className="mr-1 h-3.5 w-3.5" />
      {progressLabel}
    </Button>
  );
}
