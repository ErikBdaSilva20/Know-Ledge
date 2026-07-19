import { Graph } from "@/components/Graph";

export function GraphPage() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-6 py-3">
        <h1 className="text-lg font-semibold tracking-tight">Grafo de conhecimento</h1>
        <p className="text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ background: "var(--color-chart-4)" }}
            />{" "}
            pasta
          </span>
          <span className="mx-3 inline-flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-primary" /> doc. pessoal
          </span>
          <span className="mx-3 inline-flex items-center gap-1">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: "var(--color-chart-2)" }}
            />
            doc. compartilhado
          </span>
          — clique num documento para abrir.
        </p>
      </div>
      <div className="min-h-0 flex-1">
        <Graph />
      </div>
    </div>
  );
}
