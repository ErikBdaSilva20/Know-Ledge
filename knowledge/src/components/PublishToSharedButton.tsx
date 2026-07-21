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

interface Props {
  documentId: string;
  /** Called after a successful publish — e.g. to refresh a shared-docs list. */
  onPublished?: () => void;
  /** Icon-only rendering for dense rows (admin vault tree). */
  compact?: boolean;
  className?: string;
}

// The single publish action, shared by the workspace toolbar and the admin
// vault view. Self-gates on `publishShared` (renders nothing for reps), disables
// itself while in flight so a double-click can't fire twice, and routes through
// sharedDocumentsRepo.publish → the idempotent /shared/publish route (audit M5).
export function PublishToSharedButton({ documentId, onPublished, compact, className }: Props) {
  const { user, can } = useSession();
  const navigate = useNavigate();
  const [publishing, setPublishing] = useState(false);

  if (!can("publishShared")) return null;

  const publish = async () => {
    if (!user || publishing) return;
    setPublishing(true);
    try {
      const shared = await sharedDocumentsRepo.publish(documentId, user.id);
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
