import knowledgeLogoSvg from "@/components/ui/knowledge-logo.svg?raw";
import { cn } from "@/lib/utils";

// The SVG is entirely `currentColor` (fills, strokes, gradient stops), so
// inlining it (instead of <img src=...>) lets it inherit the wrapper's text
// color — pairs with `text-foreground`, which is already white in dark mode
// and near-black in light mode (styles.css), no hardcoded colors needed.
export function KnowledgeLogo({ className }: { className?: string }) {
  return (
    <div
      className={cn("text-foreground [&>svg]:h-full [&>svg]:w-full", className)}
      dangerouslySetInnerHTML={{ __html: knowledgeLogoSvg }}
    />
  );
}
