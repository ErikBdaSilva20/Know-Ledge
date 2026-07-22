import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  forceLink,
  forceManyBody,
  forceCollide,
  forceSimulation,
  forceX,
  forceY,
  type Simulation,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
  type ForceLink,
} from "d3-force";
import { zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from "d3-zoom";
import { select } from "d3-selection";
import { useDb } from "@/lib/useDb";
import { useGatewayList } from "@/lib/useGatewayList";
import { documentsRepo } from "@/lib/data/documents.repo";
import { foldersRepo } from "@/lib/data/folders.repo";
import { sharedDocumentsRepo } from "@/lib/data/sharedDocuments.repo";
import { documentReferencesRepo } from "@/lib/data/documentReferences.repo";
import { sharedDocumentReferencesRepo } from "@/lib/data/sharedDocumentReferences.repo";
import { useSession } from "@/lib/session";
import { useTheme } from "@/lib/theme";

type NodeKind = "folder" | "doc-personal" | "doc-shared";

interface GNode extends SimulationNodeDatum {
  key: string;
  kind: NodeKind;
  id: string; // underlying id (folder id or doc id)
  title: string;
  r: number;
}

interface GEdge extends SimulationLinkDatum<GNode> {
  kind: "contain" | "ref";
}

interface DragState {
  pointerId: number;
  node: GNode;
  component: Set<string>;
  start: Map<string, { x: number; y: number }>;
  startWorld: { x: number; y: number };
  clientX: number;
  clientY: number;
  moved: boolean;
}

const folderKey = (id: string) => `folder:${id}`;
const docKey = (scope: "personal" | "shared", id: string) => `doc-${scope}:${id}`;

interface Colors {
  foreground: string;
  background: string;
  chart4: string;
  chart2: string;
  primary: string;
  mutedForeground: string;
}

function readColors(): Colors {
  if (typeof document === "undefined") {
    return {
      foreground: "#111",
      background: "#fff",
      chart4: "#999",
      chart2: "#999",
      primary: "#3b82f6",
      mutedForeground: "#666",
    };
  }
  const style = getComputedStyle(document.documentElement);
  const get = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
  return {
    foreground: get("--foreground", "#111"),
    background: get("--background", "#fff"),
    chart4: get("--chart-4", "#999"),
    chart2: get("--chart-2", "#999"),
    primary: get("--primary", "#3b82f6"),
    mutedForeground: get("--muted-foreground", "#666"),
  };
}

function drawArrowHead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  color: string,
  k: number,
) {
  const size = 5 / k;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-size, -size * 0.5);
  ctx.lineTo(-size, size * 0.5);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function drawNode(
  ctx: CanvasRenderingContext2D,
  n: GNode,
  colors: Colors,
  isRaised: boolean,
  k: number,
) {
  if (n.x == null || n.y == null) return;
  ctx.beginPath();
  ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
  ctx.fillStyle =
    n.kind === "folder" ? colors.chart4 : n.kind === "doc-shared" ? colors.chart2 : colors.primary;
  ctx.globalAlpha = n.kind === "folder" ? 0.95 : 1;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.lineWidth = 2 / k;
  ctx.strokeStyle = colors.background;
  ctx.stroke();

  const showLabel = isRaised || k > 0.9;
  if (!showLabel) return;
  const label = n.title.length > 22 ? n.title.slice(0, 22) + "…" : n.title;
  ctx.font = `${n.kind === "folder" ? "600 " : ""}${11 / k}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const labelY = n.y - (n.r + 6) / k;
  if (isRaised) {
    const w = ctx.measureText(label).width + 10 / k;
    ctx.fillStyle = colors.background;
    ctx.globalAlpha = 0.9;
    ctx.fillRect(n.x - w / 2, labelY - 11 / k, w, 15 / k);
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = colors.foreground;
  ctx.globalAlpha = isRaised ? 1 : 0.55;
  ctx.fillText(label, n.x, labelY);
  ctx.globalAlpha = 1;
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  cssH: number,
  colors: Colors,
  refColor: string,
  containColor: string,
) {
  ctx.save();
  ctx.font = "11px system-ui, sans-serif";
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  const x0 = 14;
  const y0 = cssH - 34;

  ctx.strokeStyle = refColor;
  ctx.lineWidth = 1.75;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x0 + 22, y0);
  ctx.stroke();
  drawArrowHead(ctx, x0 + 22, y0, 0, refColor, 1);
  ctx.fillStyle = colors.mutedForeground;
  ctx.fillText("referência", x0 + 30, y0);

  ctx.strokeStyle = containColor;
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(x0, y0 + 17);
  ctx.lineTo(x0 + 22, y0 + 17);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillText("contido em", x0 + 30, y0 + 17);
  ctx.restore();
}

export function Graph() {
  const { user, can } = useSession();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const mockDocuments = useDb((s) => s.documents);
  const mockFolders = useDb((s) => s.folders);
  const mockSharedDocs = useDb((s) => s.shared_documents);
  const mockPersonalRefs = useDb((s) => s.document_references);
  const mockSharedRefs = useDb((s) => s.shared_document_references);
  const { data: documents } = useGatewayList(mockDocuments, documentsRepo.list);
  const { data: folders } = useGatewayList(mockFolders, foldersRepo.list);
  const { data: sharedDocs } = useGatewayList(mockSharedDocs, sharedDocumentsRepo.list);
  const { data: personalRefs } = useGatewayList(mockPersonalRefs, documentReferencesRepo.list);
  const { data: sharedRefs } = useGatewayList(mockSharedRefs, sharedDocumentReferencesRepo.list);

  const seeAll = can("seeAllDocs");
  const visibleDocs = useMemo(
    () => (seeAll ? documents : documents.filter((d) => d.owner_id === user?.id)),
    [documents, seeAll, user?.id],
  );
  const visibleFolders = useMemo(
    () => (seeAll ? folders : folders.filter((f) => f.owner_id === user?.id)),
    [folders, seeAll, user?.id],
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Node identity persists across data refetches (a Map keyed by node key, not
  // a fresh array), so an updated doc list doesn't reset everyone's position.
  const nodeStoreRef = useRef<Map<string, GNode>>(new Map());
  const edgesRef = useRef<GEdge[]>([]);
  const adjacencyRef = useRef<Map<string, Set<string>>>(new Map());
  const simRef = useRef<Simulation<GNode, GEdge> | null>(null);

  const transformRef = useRef<ZoomTransform>(zoomIdentity);
  const zoomBehaviorRef = useRef<ZoomBehavior<HTMLCanvasElement, unknown> | null>(null);
  const dprRef = useRef(1);
  const cssWRef = useRef(0);
  const cssHRef = useRef(0);
  const initializedRef = useRef(false);

  const dragRef = useRef<DragState | null>(null);
  const hoveredKeyRef = useRef<string | null>(null);
  const rafPendingRef = useRef(false);
  const drawRef = useRef<() => void>(() => {});
  const colorsRef = useRef<Colors>(readColors());

  const scheduleDraw = useCallback(() => {
    if (rafPendingRef.current) return;
    rafPendingRef.current = true;
    requestAnimationFrame(() => {
      rafPendingRef.current = false;
      drawRef.current();
    });
  }, []);

  const hitNodeAtClient = useCallback((clientX: number, clientY: number): GNode | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const [wx, wy] = transformRef.current.invert([clientX - rect.left, clientY - rect.top]);
    let best: GNode | null = null;
    let bestDist = Infinity;
    for (const n of nodeStoreRef.current.values()) {
      if (n.x == null || n.y == null) continue;
      const d = Math.hypot(n.x - wx, n.y - wy);
      if (d <= n.r + 4 && d < bestDist) {
        bestDist = d;
        best = n;
      }
    }
    return best;
  }, []);

  const componentOf = useCallback((startKey: string): Set<string> => {
    const seen = new Set<string>([startKey]);
    const stack = [startKey];
    while (stack.length) {
      const cur = stack.pop()!;
      for (const nb of adjacencyRef.current.get(cur) ?? []) {
        if (!seen.has(nb)) {
          seen.add(nb);
          stack.push(nb);
        }
      }
    }
    return seen;
  }, []);

  const navigateTo = useCallback(
    (n: GNode) => {
      if (n.kind === "doc-personal") navigate(`/workspace/${n.id}`);
      else if (n.kind === "doc-shared") navigate(`/shared/${n.id}`);
    },
    [navigate],
  );

  // Palette is monochrome (chart tokens go grayscale in dark mode), so reference
  // vs containment is distinguished by form, not hue.
  useEffect(() => {
    colorsRef.current = readColors();
    scheduleDraw();
  }, [theme, scheduleDraw]);

  // Mount-once: canvas sizing, zoom/pan wiring. Pointer-down on a node blocks
  // d3-zoom's own pan-start so our node drag handles that gesture instead.
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const zb = zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([0.03, 8])
      .filter((event: Event) => {
        if (event.type === "wheel") return true;
        if (dragRef.current) return false;
        const me = event as MouseEvent;
        if (me.button) return false;
        return !hitNodeAtClient(me.clientX, me.clientY);
      })
      .on("zoom", (event) => {
        transformRef.current = event.transform;
        scheduleDraw();
      });
    zoomBehaviorRef.current = zb;
    select(canvas).call(zb);

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      cssWRef.current = width;
      cssHRef.current = height;
      const dpr = window.devicePixelRatio || 1;
      dprRef.current = dpr;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      if (!initializedRef.current && width > 0 && height > 0) {
        initializedRef.current = true;
        const initial = zoomIdentity.translate(width / 2, height / 2);
        transformRef.current = initial;
        select(canvas).call(zb.transform, initial);
      }
      scheduleDraw();
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
      select(canvas).on(".zoom", null);
      simRef.current?.stop();
    };
  }, [hitNodeAtClient, scheduleDraw]);

  // Reconcile the persistent node store with the latest data, then (re)seed
  // the force simulation without discarding existing node positions.
  useEffect(() => {
    const store = nodeStoreRef.current;
    const seen = new Set<string>();
    const ensure = (key: string, kind: NodeKind, id: string, title: string, r: number) => {
      seen.add(key);
      const existing = store.get(key);
      if (existing) {
        existing.title = title;
        existing.r = r;
        return;
      }
      const spread = 260;
      store.set(key, {
        key,
        kind,
        id,
        title,
        r,
        x: (Math.random() - 0.5) * spread,
        y: (Math.random() - 0.5) * spread,
      });
    };
    visibleFolders.forEach((f) => ensure(folderKey(f.id), "folder", f.id, f.name, 11));
    visibleDocs.forEach((d) => ensure(docKey("personal", d.id), "doc-personal", d.id, d.title, 6));
    sharedDocs.forEach((d) => ensure(docKey("shared", d.id), "doc-shared", d.id, d.title, 6));
    for (const key of Array.from(store.keys())) {
      if (!seen.has(key)) store.delete(key);
    }

    const edges: GEdge[] = [];
    for (const f of visibleFolders) {
      if (f.parent_id && store.has(folderKey(f.parent_id))) {
        edges.push({ source: folderKey(f.parent_id), target: folderKey(f.id), kind: "contain" });
      }
    }
    for (const d of visibleDocs) {
      if (d.folder_id && store.has(folderKey(d.folder_id))) {
        edges.push({
          source: folderKey(d.folder_id),
          target: docKey("personal", d.id),
          kind: "contain",
        });
      }
    }
    const visiblePersonalIds = new Set(visibleDocs.map((d) => d.id));
    for (const r of personalRefs) {
      if (!visiblePersonalIds.has(r.source_document_id)) continue;
      const s = docKey("personal", r.source_document_id);
      const t =
        r.target_scope === "shared"
          ? docKey("shared", r.target_document_id)
          : docKey("personal", r.target_document_id);
      if (store.has(s) && store.has(t)) edges.push({ source: s, target: t, kind: "ref" });
    }
    for (const r of sharedRefs) {
      const s = docKey("shared", r.source_shared_document_id);
      const t = docKey("shared", r.target_shared_document_id);
      if (store.has(s) && store.has(t)) edges.push({ source: s, target: t, kind: "ref" });
    }
    edgesRef.current = edges;

    const adjacency = new Map<string, Set<string>>();
    const link = (a: string, b: string) => {
      let set = adjacency.get(a);
      if (!set) adjacency.set(a, (set = new Set()));
      set.add(b);
    };
    for (const e of edges) {
      link(e.source as string, e.target as string);
      link(e.target as string, e.source as string);
    }
    adjacencyRef.current = adjacency;

    const nodesArr = Array.from(store.values());
    let sim = simRef.current;
    if (!sim) {
      sim = forceSimulation<GNode>(nodesArr)
        .force(
          "charge",
          forceManyBody<GNode>().strength((n) => (n.kind === "folder" ? -300 : -130)),
        )
        .force(
          "link",
          forceLink<GNode, GEdge>(edges)
            .id((n) => n.key)
            .distance((e) => ((e as GEdge).kind === "contain" ? 70 : 140))
            .strength((e) => ((e as GEdge).kind === "contain" ? 0.7 : 0.25)),
        )
        .force(
          "collide",
          forceCollide<GNode>((n) => n.r + 8),
        )
        .force("x", forceX(0).strength(0.02))
        .force("y", forceY(0).strength(0.02))
        .alphaDecay(0.02)
        .on("tick", () => drawRef.current());
      simRef.current = sim;
    } else {
      sim.nodes(nodesArr);
      (sim.force("link") as ForceLink<GNode, GEdge>).links(edges);
    }
    sim.alpha(0.6).restart();
    scheduleDraw();
  }, [visibleFolders, visibleDocs, sharedDocs, personalRefs, sharedRefs, scheduleDraw]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = dprRef.current || 1;
    const cssW = cssWRef.current;
    const cssH = cssHRef.current;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    const colors = colorsRef.current;
    const refColor = colors.foreground;
    const containColor = theme === "dark" ? "oklch(1 0 0 / 30%)" : "oklch(0.2 0 0 / 30%)";

    if (nodeStoreRef.current.size === 0) {
      ctx.fillStyle = colors.mutedForeground;
      ctx.font = "13px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Nenhum documento para visualizar ainda.", cssW / 2, cssH / 2);
      return;
    }

    const t = transformRef.current;
    const hovered = hoveredKeyRef.current;
    const dragging = dragRef.current?.node.key ?? null;
    const raised = dragging ?? hovered;

    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.scale(t.k, t.k);
    ctx.lineCap = "round";

    for (const e of edgesRef.current) {
      const s = e.source as GNode;
      const tg = e.target as GNode;
      if (typeof s !== "object" || typeof tg !== "object") continue;
      if (s.x == null || s.y == null || tg.x == null || tg.y == null) continue;
      const isRef = e.kind === "ref";
      const dx = tg.x - s.x;
      const dy = tg.y - s.y;
      const dist = Math.hypot(dx, dy) || 1;
      const curvature = isRef ? 0.18 : 0.08;
      const nx = -dy / dist;
      const ny = dx / dist;
      const mx = (s.x + tg.x) / 2 + nx * dist * curvature;
      const my = (s.y + tg.y) / 2 + ny * dist * curvature;
      let ex = tg.x;
      let ey = tg.y;
      if (isRef) {
        const tdx = tg.x - mx;
        const tdy = tg.y - my;
        const tl = Math.hypot(tdx, tdy) || 1;
        ex = tg.x - (tdx / tl) * (tg.r + 3);
        ey = tg.y - (tdy / tl) * (tg.r + 3);
      }
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.quadraticCurveTo(mx, my, ex, ey);
      ctx.strokeStyle = isRef ? refColor : containColor;
      ctx.lineWidth = (isRef ? 1.75 : 1) / t.k;
      ctx.setLineDash(isRef ? [] : [3 / t.k, 3 / t.k]);
      ctx.stroke();
      if (isRef) drawArrowHead(ctx, ex, ey, Math.atan2(ey - my, ex - mx), refColor, t.k);
    }
    ctx.setLineDash([]);

    for (const n of nodeStoreRef.current.values()) {
      if (n.key === raised) continue;
      drawNode(ctx, n, colors, false, t.k);
    }
    const raisedNode = raised ? nodeStoreRef.current.get(raised) : undefined;
    if (raisedNode) drawNode(ctx, raisedNode, colors, true, t.k);

    ctx.restore();

    drawLegend(ctx, cssH, colors, refColor, containColor);
  };
  useEffect(() => {
    drawRef.current = draw;
    scheduleDraw();
  });

  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    const hit = hitNodeAtClient(e.clientX, e.clientY);
    if (!hit) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const [wx, wy] = transformRef.current.invert([e.clientX - rect.left, e.clientY - rect.top]);
    // Full connected component (not just 1-hop neighbours) so grabbing a node
    // carries its whole cluster, like dragging a note-web in Obsidian.
    const component = componentOf(hit.key);
    const start = new Map<string, { x: number; y: number }>();
    for (const k of component) {
      const n = nodeStoreRef.current.get(k);
      if (!n) continue;
      start.set(k, { x: n.x ?? 0, y: n.y ?? 0 });
      n.fx = n.x;
      n.fy = n.y;
    }
    dragRef.current = {
      pointerId: e.pointerId,
      node: hit,
      component,
      start,
      startWorld: { x: wx, y: wy },
      clientX: e.clientX,
      clientY: e.clientY,
      moved: false,
    };
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = "grabbing";
    simRef.current?.alphaTarget(0.3).restart();
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const d = dragRef.current;
    const canvas = canvasRef.current;
    if (d && e.pointerId === d.pointerId) {
      const dx = e.clientX - d.clientX;
      const dy = e.clientY - d.clientY;
      if (!d.moved && Math.hypot(dx, dy) > 4) d.moved = true;
      if (d.moved && canvas) {
        const rect = canvas.getBoundingClientRect();
        const [wx, wy] = transformRef.current.invert([e.clientX - rect.left, e.clientY - rect.top]);
        const deltaX = wx - d.startWorld.x;
        const deltaY = wy - d.startWorld.y;
        for (const k of d.component) {
          const n = nodeStoreRef.current.get(k);
          const s = d.start.get(k);
          if (n && s) {
            n.fx = s.x + deltaX;
            n.fy = s.y + deltaY;
          }
        }
      }
      return;
    }
    const hit = hitNodeAtClient(e.clientX, e.clientY);
    hoveredKeyRef.current = hit?.key ?? null;
    if (canvas) canvas.style.cursor = hit ? "grab" : "default";
    scheduleDraw();
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    canvasRef.current?.releasePointerCapture(e.pointerId);
    for (const k of d.component) {
      const n = nodeStoreRef.current.get(k);
      if (n) {
        n.fx = null;
        n.fy = null;
      }
    }
    simRef.current?.alphaTarget(0);
    dragRef.current = null;
    if (canvasRef.current) canvasRef.current.style.cursor = "default";
    if (!d.moved) navigateTo(d.node); // a grab that never moved is a click
  };

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-muted/20">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full select-none"
        style={{ touchAction: "none" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
    </div>
  );
}
