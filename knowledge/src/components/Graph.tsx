import {
  useMemo,
  useRef,
  useState,
  useEffect,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useNavigate } from "react-router-dom";
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

interface GNode {
  key: string;
  kind: NodeKind;
  id: string; // underlying id (folder id or doc id)
  title: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

interface GEdge {
  source: string;
  target: string;
  kind: "contain" | "ref";
}

const folderKey = (id: string) => `folder:${id}`;
const docKey = (scope: "personal" | "shared", id: string) => `doc-${scope}:${id}`;

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

  const svgRef = useRef<SVGSVGElement>(null);
  const [dims, setDims] = useState({ w: 800, h: 600 });

  useEffect(() => {
    const update = () => {
      if (svgRef.current) {
        const r = svgRef.current.getBoundingClientRect();
        setDims({ w: r.width, h: r.height });
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const seeAll = can("seeAllDocs");
  const visibleDocs = useMemo(
    () => (seeAll ? documents : documents.filter((d) => d.owner_id === user?.id)),
    [documents, seeAll, user?.id],
  );
  const visibleFolders = useMemo(
    () => (seeAll ? folders : folders.filter((f) => f.owner_id === user?.id)),
    [folders, seeAll, user?.id],
  );

  const { nodes, edges } = useMemo(() => {
    const nodeMap = new Map<string, GNode>();
    const w = dims.w;
    const h = dims.h;
    const rand = (base: number, spread: number) => base + (Math.random() - 0.5) * spread;

    visibleFolders.forEach((f) => {
      nodeMap.set(folderKey(f.id), {
        key: folderKey(f.id),
        kind: "folder",
        id: f.id,
        title: f.name,
        x: rand(w / 2, w * 0.6),
        y: rand(h / 2, h * 0.6),
        vx: 0,
        vy: 0,
        r: 11,
      });
    });
    visibleDocs.forEach((d) => {
      nodeMap.set(docKey("personal", d.id), {
        key: docKey("personal", d.id),
        kind: "doc-personal",
        id: d.id,
        title: d.title,
        x: rand(w / 2, w * 0.7),
        y: rand(h / 2, h * 0.7),
        vx: 0,
        vy: 0,
        r: 6,
      });
    });
    sharedDocs.forEach((d) => {
      nodeMap.set(docKey("shared", d.id), {
        key: docKey("shared", d.id),
        kind: "doc-shared",
        id: d.id,
        title: d.title,
        x: rand(w / 2, w * 0.7),
        y: rand(h / 2, h * 0.7),
        vx: 0,
        vy: 0,
        r: 6,
      });
    });

    const edges: GEdge[] = [];
    // folder -> subfolder
    for (const f of visibleFolders) {
      if (f.parent_id && nodeMap.has(folderKey(f.parent_id))) {
        edges.push({ source: folderKey(f.parent_id), target: folderKey(f.id), kind: "contain" });
      }
    }
    // folder -> personal doc
    for (const d of visibleDocs) {
      if (d.folder_id && nodeMap.has(folderKey(d.folder_id))) {
        edges.push({
          source: folderKey(d.folder_id),
          target: docKey("personal", d.id),
          kind: "contain",
        });
      }
    }
    const visiblePersonal = new Set(visibleDocs.map((d) => d.id));
    for (const r of personalRefs) {
      if (!visiblePersonal.has(r.source_document_id)) continue;
      const s = docKey("personal", r.source_document_id);
      const t =
        r.target_scope === "shared"
          ? docKey("shared", r.target_document_id)
          : docKey("personal", r.target_document_id);
      if (nodeMap.has(s) && nodeMap.has(t)) edges.push({ source: s, target: t, kind: "ref" });
    }
    for (const r of sharedRefs) {
      const s = docKey("shared", r.source_shared_document_id);
      const t = docKey("shared", r.target_shared_document_id);
      if (nodeMap.has(s) && nodeMap.has(t)) edges.push({ source: s, target: t, kind: "ref" });
    }
    return { nodes: Array.from(nodeMap.values()), edges };
  }, [visibleDocs, visibleFolders, sharedDocs, personalRefs, sharedRefs, dims.w, dims.h]);

  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  // Nodes held fixed while dragged; the force sim reads this each frame so it
  // never pulls a grabbed node back.
  const pinnedRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  useEffect(() => {
    const local: GNode[] = nodes.map((n) => ({ ...n }));
    const byKey = new Map(local.map((n) => [n.key, n]));
    let frame = 0;
    let alive = true;
    const step = () => {
      for (let i = 0; i < local.length; i++) {
        for (let j = i + 1; j < local.length; j++) {
          const a = local[i];
          const b = local[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
          const force = 1800 / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          a.vx -= fx;
          a.vy -= fy;
          b.vx += fx;
          b.vy += fy;
        }
      }
      for (const e of edges) {
        const a = byKey.get(e.source);
        const b = byKey.get(e.target);
        if (!a || !b) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
        const target = e.kind === "contain" ? 70 : 140;
        const strength = e.kind === "contain" ? 0.04 : 0.02;
        const force = (dist - target) * strength;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        a.vx += fx;
        a.vy += fy;
        b.vx -= fx;
        b.vy -= fy;
      }
      for (const n of local) {
        const pin = pinnedRef.current.get(n.key);
        if (pin) {
          n.x = pin.x;
          n.y = pin.y;
          n.vx = 0;
          n.vy = 0;
          continue;
        }
        n.vx += (dims.w / 2 - n.x) * 0.005;
        n.vy += (dims.h / 2 - n.y) * 0.005;
        n.vx *= 0.72;
        n.vy *= 0.72;
        n.x += n.vx;
        n.y += n.vy;
      }
      const snap: Record<string, { x: number; y: number }> = {};
      for (const n of local) snap[n.key] = { x: n.x, y: n.y };
      setPositions(snap);
      frame++;
      if (alive && frame < 160) requestAnimationFrame(step);
    };
    if (local.length > 0) requestAnimationFrame(step);
    return () => {
      alive = false;
    };
  }, [nodes.length, edges.length, dims.w, dims.h]);

  // Direct (1-hop) neighbours, so dragging a node carries its immediate cluster
  // without dragging the whole graph.
  const adjacency = useMemo(() => {
    const m = new Map<string, Set<string>>();
    const link = (a: string, b: string) => {
      let set = m.get(a);
      if (!set) m.set(a, (set = new Set()));
      set.add(b);
    };
    for (const e of edges) {
      link(e.source, e.target);
      link(e.target, e.source);
    }
    return m;
  }, [edges]);
  const nodeByKey = useMemo(() => new Map(nodes.map((n) => [n.key, n])), [nodes]);

  const dragRef = useRef<{
    pointerId: number;
    node: GNode;
    keys: string[];
    start: Map<string, { x: number; y: number }>;
    clientX: number;
    clientY: number;
    moved: boolean;
  } | null>(null);
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const navigateTo = (n: GNode) => {
    if (n.kind === "doc-personal") navigate(`/workspace/${n.id}`);
    else if (n.kind === "doc-shared") navigate(`/shared/${n.id}`);
  };

  const onNodePointerDown = (e: ReactPointerEvent, n: GNode) => {
    const keys = [n.key, ...(adjacency.get(n.key) ?? [])];
    const start = new Map<string, { x: number; y: number }>();
    for (const k of keys) {
      const p = positions[k];
      if (p) {
        start.set(k, { ...p });
        pinnedRef.current.set(k, { ...p });
      }
    }
    dragRef.current = {
      pointerId: e.pointerId,
      node: n,
      keys,
      start,
      clientX: e.clientX,
      clientY: e.clientY,
      moved: false,
    };
    svgRef.current?.setPointerCapture(e.pointerId);
    setDraggingKey(n.key);
  };

  const onSvgPointerMove = (e: ReactPointerEvent) => {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    const dx = e.clientX - d.clientX;
    const dy = e.clientY - d.clientY;
    if (!d.moved && Math.hypot(dx, dy) > 4) d.moved = true;
    if (!d.moved) return;
    setPositions((prev) => {
      const next = { ...prev };
      for (const k of d.keys) {
        const s = d.start.get(k);
        if (!s) continue;
        const r = nodeByKey.get(k)?.r ?? 6;
        const p = {
          x: Math.max(r, Math.min(dims.w - r, s.x + dx)),
          y: Math.max(r, Math.min(dims.h - r, s.y + dy)),
        };
        next[k] = p;
        pinnedRef.current.set(k, p);
      }
      return next;
    });
  };

  const onSvgPointerUp = (e: ReactPointerEvent) => {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    svgRef.current?.releasePointerCapture(e.pointerId);
    for (const k of d.keys) pinnedRef.current.delete(k);
    dragRef.current = null;
    setDraggingKey(null);
    if (!d.moved) navigateTo(d.node); // a grab that never moved is a click
  };

  const lineColor = theme === "dark" ? "oklch(1 0 0 / 55%)" : "oklch(0.2 0 0 / 65%)";
  const containColor = theme === "dark" ? "oklch(1 0 0 / 30%)" : "oklch(0.2 0 0 / 30%)";

  const colorFor = (kind: NodeKind) => {
    if (kind === "folder") return "var(--color-chart-4)";
    if (kind === "doc-shared") return "var(--color-chart-2)";
    return "var(--color-primary)";
  };

  // Paint the active node last so it sits on top (SVG has no z-index).
  const raisedKey = draggingKey ?? hoveredKey;
  const orderedNodes = raisedKey
    ? [...nodes].sort((a, b) => (a.key === raisedKey ? 1 : 0) - (b.key === raisedKey ? 1 : 0))
    : nodes;

  return (
    <svg
      ref={svgRef}
      className="h-full w-full select-none bg-muted/20"
      style={{ touchAction: "none" }}
      onPointerMove={onSvgPointerMove}
      onPointerUp={onSvgPointerUp}
      onPointerCancel={onSvgPointerUp}
    >
      {edges.map((e, i) => {
        const s = positions[e.source];
        const t = positions[e.target];
        if (!s || !t) return null;
        // Curved edge: quadratic Bezier with perpendicular offset
        const dx = t.x - s.x;
        const dy = t.y - s.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const curvature = e.kind === "contain" ? 0.08 : 0.18;
        const nx = -dy / dist;
        const ny = dx / dist;
        const mx = (s.x + t.x) / 2 + nx * dist * curvature;
        const my = (s.y + t.y) / 2 + ny * dist * curvature;
        return (
          <path
            key={i}
            d={`M ${s.x} ${s.y} Q ${mx} ${my} ${t.x} ${t.y}`}
            fill="none"
            stroke={e.kind === "contain" ? containColor : lineColor}
            strokeWidth={e.kind === "contain" ? 1 : 1.25}
            strokeDasharray={e.kind === "contain" ? "3 3" : undefined}
          />
        );
      })}
      {orderedNodes.map((n) => {
        const p = positions[n.key];
        if (!p) return null;
        const raised = n.key === raisedKey;
        const label = n.title.length > 22 ? n.title.slice(0, 22) + "…" : n.title;
        const labelW = label.length * 6.3 + 10;
        return (
          <g
            key={n.key}
            transform={`translate(${p.x}, ${p.y})`}
            className={n.key === draggingKey ? "cursor-grabbing" : "cursor-grab"}
            onPointerDown={(e) => onNodePointerDown(e, n)}
            onPointerEnter={() => {
              if (!dragRef.current) setHoveredKey(n.key);
            }}
            onPointerLeave={() => {
              if (!dragRef.current) setHoveredKey((k) => (k === n.key ? null : k));
            }}
          >
            <circle
              r={n.r}
              fill={colorFor(n.kind)}
              stroke="var(--color-background)"
              strokeWidth={2}
              opacity={n.kind === "folder" ? 0.95 : 1}
            />
            {raised && (
              <rect
                x={-labelW / 2}
                y={-(n.r + 6) - 11}
                width={labelW}
                height={15}
                rx={3}
                fill="var(--color-background)"
                opacity={0.9}
              />
            )}
            <text
              y={-(n.r + 6)}
              textAnchor="middle"
              opacity={raised ? 1 : 0.55}
              className={
                n.kind === "folder"
                  ? "fill-foreground text-[11px] font-semibold"
                  : "fill-foreground text-[11px]"
              }
            >
              {label}
            </text>
          </g>
        );
      })}
      {nodes.length === 0 && (
        <text
          x={dims.w / 2}
          y={dims.h / 2}
          textAnchor="middle"
          className="fill-muted-foreground text-sm"
        >
          Nenhum documento para visualizar ainda.
        </text>
      )}
    </svg>
  );
}
