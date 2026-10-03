import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { reactionCategoryColors, reactionNodes, reactionRegistry } from '../../data/reactions';
import type { ReactionNode, SourceReaction } from '../../data/reactions';
import { MasterLogo } from '../ui/BrandMarks';
import { useIronLabSession } from '../../state/IronLabSession';

const mapWidth = 36000;
const mapHeight = 24000;
const initialMapOffsetX = 17100;
const initialMapOffsetY = 11400;
const initialZoom = 1.05;
const layoutStorageKey = 'iron-lab-roshetta-layout-v3';
const previousLayoutStorageKeys = ['iron-lab-roshetta-layout-v2', 'iron-lab-roshetta-layout-v1'];

type Position = { x: number; y: number };
type OreMapLayout = { positions: Record<string, Position>; connections: string[]; version?: number };
type DragState = { nodeId: string; offsetX: number; offsetY: number; startX: number; startY: number };
type PanState = { pointerId: number; startX: number; startY: number; scrollLeft: number; scrollTop: number };

function defaultPositions() {
  return Object.fromEntries(reactionNodes.map((node) => [node.id, { x: node.x + initialMapOffsetX, y: node.y + initialMapOffsetY }])) as Record<string, Position>;
}

function readSavedLayouts(): Record<string, OreMapLayout> {
  if (typeof window === 'undefined') return {};
  try {
    const currentSaved = window.localStorage.getItem(layoutStorageKey);
    const previousSaved = previousLayoutStorageKeys.map((key) => window.localStorage.getItem(key)).find((value) => value !== null) ?? null;
    const saved = JSON.parse(currentSaved ?? previousSaved ?? '{}') as Record<string, Partial<OreMapLayout>>;
    return Object.fromEntries(Object.entries(saved).map(([oreId, layout]) => {
      const positions = layout.positions && typeof layout.positions === 'object' ? layout.positions : {};
      const validPositions = Object.fromEntries(Object.entries(positions).flatMap(([id, position]) => {
        if (!position || !Number.isFinite(position.x) || !Number.isFinite(position.y)) return [];
        if (id === 'FeOH3' && position.x === initialMapOffsetX + 500 && position.y === initialMapOffsetY + 760) return [];
        return [[id, { x: position.x, y: position.y }]];
      }));
      const mergedPositions = { ...defaultPositions(), ...validPositions };
      if (validPositions.Fe?.x === initialMapOffsetX + 850 && validPositions.Fe.y === initialMapOffsetY + 760) {
        mergedPositions.Fe = defaultPositions().Fe;
      }
      if ((layout.version ?? 1) < 2) {
        ['iron-chloride-product', 'iron-sulfide-product', 'iron-hcl-product', 'iron-sulfuric-product', 'iron-concentrated-sulfuric-product'].forEach((id) => {
          const savedPosition = validPositions[id];
          if (savedPosition) mergedPositions[id] = { ...savedPosition, y: savedPosition.y + 250 };
        });
      }
      if ((layout.version ?? 1) < 3) {
        ['iron-hcl-product', 'iron-sulfuric-product', 'iron-concentrated-sulfuric-product', 'iron-passivity-product'].forEach((id) => {
          const savedPosition = mergedPositions[id];
          if (savedPosition) mergedPositions[id] = { ...savedPosition, y: savedPosition.y + 250 };
        });
      }
      const savedConnections = Array.isArray(layout.connections)
        ? layout.connections.filter((id): id is string => typeof id === 'string' && reactionRegistry.some((reaction) => reaction.id === id))
        : [];
      const connectionsByRoute = new Map<string, string>();
      savedConnections.forEach((id) => {
        const reaction = reactionRegistry.find((item) => item.id === id);
        if (reaction) {
          const route = `${reaction.from}->${reaction.to}`;
          connectionsByRoute.set(reaction.parallel ? `${route}:${reaction.id}` : route, reaction.id);
        }
      });
      const connections = [...connectionsByRoute.values()];
      return [oreId, { positions: mergedPositions, connections, version: 3 }];
    }));
  } catch {
    return {};
  }
}

function nodeDimensions(node: ReactionNode) {
  return { width: node.kind === 'ore' ? 260 : 230, height: node.kind === 'ore' ? 100 : 90 };
}

function edgeGeometry(reaction: SourceReaction, positions: Record<string, Position>, index: number) {
  const sourceNode = reactionNodes.find((node) => node.id === reaction.from);
  const targetNode = reactionNodes.find((node) => node.id === reaction.to);
  const source = positions[reaction.from];
  const target = positions[reaction.to];
  if (!sourceNode || !targetNode || !source || !target) return null;
  const sourceSize = nodeDimensions(sourceNode);
  const targetSize = nodeDimensions(targetNode);
  const sourceCenterX = source.x + sourceSize.width / 2;
  const y1 = source.y + sourceSize.height / 2;
  const targetCenterX = target.x + targetSize.width / 2;
  const y2 = target.y + targetSize.height / 2;
  if (reaction.from === reaction.to) {
    return { path: `M ${sourceCenterX + 55} ${y1 - 18} C ${sourceCenterX + 145} ${y1 - 100} ${sourceCenterX + 145} ${y1 + 100} ${sourceCenterX + 55} ${y1 + 18}`, labelX: sourceCenterX + 140, labelY: y1 };
  }
  if (reaction.rightAngle) {
    const direction = targetCenterX >= sourceCenterX ? 1 : -1;
    const startX = sourceCenterX + direction * sourceSize.width / 2;
    const endX = targetCenterX - direction * targetSize.width / 2;
    if (Math.abs(y2 - y1) < 1) {
      const elbowY = y1 + 90;
      return {
        path: `M ${startX} ${y1} L ${startX} ${elbowY} L ${endX} ${elbowY} L ${endX} ${y2}`,
        labelX: (startX + endX) / 2,
        labelY: elbowY + (reaction.labelOffsetY ?? 0),
      };
    }
    const verticalFirst = direction < 0 && y2 > y1;
    return {
      path: verticalFirst
        ? `M ${startX} ${y1} L ${startX} ${y2} L ${endX} ${y2}`
        : `M ${startX} ${y1} L ${endX} ${y1} L ${endX} ${y2}`,
      labelX: verticalFirst ? startX + sourceSize.width : (startX + endX) / 2,
      labelY: (verticalFirst ? (y1 + y2) / 2 : y1) + (reaction.labelOffsetY ?? 0),
    };
  }
  if (reaction.from === 'Fe' && reaction.branchSide) {
    const startX = source.x + sourceSize.width * (reaction.sourceAnchor ?? 0.5);
    const startY = source.y + sourceSize.height;
    const endX = targetCenterX;
    const endY = target.y;
    const bendY = endY - 24;
    return {
      path: `M ${startX} ${startY} L ${startX} ${bendY} L ${endX} ${bendY} L ${endX} ${endY}`,
      labelX: (startX + endX) / 2,
      labelY: bendY,
    };
  }
  if (reaction.from === 'FeCl3Water' && reaction.to === 'FeOH3') {
    const dx = targetCenterX - sourceCenterX;
    const dy = y2 - y1;
    const sourceScale = Math.min(sourceSize.width / 2 / Math.abs(dx), sourceSize.height / 2 / Math.abs(dy));
    const startX = sourceCenterX + dx * sourceScale;
    const startY = y1 + dy * sourceScale;
    const endX = targetCenterX;
    const endY = target.y + targetSize.height;
    return {
      path: `M ${startX} ${startY} L ${endX} ${endY}`,
      labelX: (startX + endX) / 2,
      labelY: (startY + endY) / 2 + (reaction.labelOffsetY ?? 0),
    };
  }
  if (reaction.quickConnect && reaction.to === 'Fe2O3') {
    const direction = targetCenterX >= sourceCenterX ? 1 : -1;
    const x1 = sourceCenterX + direction * sourceSize.width / 2;
    const endX = targetCenterX;
    const endY = target.y;
    const controlX = (x1 + endX) / 2;
    const controlY = (y1 + endY) / 2;
    return {
      path: `M ${x1} ${y1} Q ${controlX} ${controlY} ${endX} ${endY}`,
      labelX: (x1 + 2 * controlX + endX) / 4,
      labelY: (y1 + 2 * controlY + endY) / 4,
    };
  }
  const direction = targetCenterX >= sourceCenterX ? 1 : -1;
  const x1 = sourceCenterX + direction * sourceSize.width / 2;
  const x2 = targetCenterX - direction * targetSize.width / 2;
  if (reaction.straight) {
    return {
      path: `M ${x1} ${y1} L ${x2} ${y2}`,
      labelX: (x1 + x2) / 2,
      labelY: (y1 + y2) / 2 + (reaction.labelOffsetY ?? 0),
    };
  }
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.max(1, Math.hypot(dx, dy));
  const side = reaction.curveSide === 'right' ? 1 : reaction.curveSide === 'left' ? -1 : index % 2 === 0 ? 1 : -1;
  const curve = Math.min(100, distance * 0.16) * side;
  const offsetX = (-dy / distance) * curve;
  const offsetY = (dx / distance) * curve;
  const controlX = (x1 + x2) / 2 + offsetX;
  const controlY = (y1 + y2) / 2 + offsetY;
  return {
    path: `M ${x1} ${y1} Q ${controlX} ${controlY} ${x2} ${y2}`,
    labelX: (x1 + 2 * controlX + x2) / 4,
    labelY: (y1 + 2 * controlY + y2) / 4 + (reaction.labelOffsetY ?? 0),
  };
}

export function ReactionMapScene() {
  const { session, discoverEquation, discoverObservation } = useIronLabSession();
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const panRef = useRef<PanState | null>(null);
  const didDragRef = useRef(false);
  const [zoom, setZoom] = useState(initialZoom);
  const [isPanning, setIsPanning] = useState(false);
  const [layouts, setLayouts] = useState<Record<string, OreMapLayout>>(readSavedLayouts);
  const [sourceNodeId, setSourceNodeId] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [hoveredConnectionId, setHoveredConnectionId] = useState<string | null>(null);
  const oreId = session.oreType ?? 'unassigned';
  const layout = layouts[oreId] ?? { positions: defaultPositions(), connections: [] };
  const positions = { ...defaultPositions(), ...layout.positions };
  const connections = layout.connections
    .map((id) => reactionRegistry.find((reaction) => reaction.id === id))
    .filter((reaction): reaction is SourceReaction => Boolean(reaction));
  const discoveredNodeIds = new Set(connections.flatMap((reaction) => [reaction.from, reaction.to]));
  const candidateNodeIds = new Set<string>();
  if (sourceNodeId && sourceNodeId !== 'Fe') {
    reactionRegistry.forEach((reaction) => {
      if (reaction.from === sourceNodeId) candidateNodeIds.add(reaction.to);
    });
  }
  const visibleNodes = reactionNodes.filter((node) => node.initialVisible || discoveredNodeIds.has(node.id) || candidateNodeIds.has(node.id));
  const feoNode = reactionNodes.find((node) => node.id === 'FeO')!;
  const hematiteNode = reactionNodes.find((node) => node.id === 'Fe2O3')!;
  const ferricChlorideNode = reactionNodes.find((node) => node.id === 'FeCl3Water')!;
  const magnetiteNode = reactionNodes.find((node) => node.id === 'magnetite')!;
  const ironNode = reactionNodes.find((node) => node.id === 'Fe')!;
  const reactionControlGroups = [
    { node: feoNode, reactions: reactionRegistry.filter((reaction) => reaction.from === feoNode.id && (reaction.category === 'acid' || reaction.category === 'oxidation')), isVisible: sourceNodeId === feoNode.id },
    { node: hematiteNode, reactions: reactionRegistry.filter((reaction) => reaction.from === hematiteNode.id && (reaction.category === 'acid' || reaction.category === 'reduction')), isVisible: sourceNodeId === hematiteNode.id },
    { node: ferricChlorideNode, reactions: reactionRegistry.filter((reaction) => reaction.from === ferricChlorideNode.id), isVisible: sourceNodeId === ferricChlorideNode.id },
    { node: magnetiteNode, reactions: reactionRegistry.filter((reaction) => reaction.from === magnetiteNode.id && (reaction.category === 'acid' || reaction.category === 'reduction' || reaction.category === 'oxidation')), isVisible: sourceNodeId === magnetiteNode.id },
    { node: ironNode, reactions: reactionRegistry.filter((reaction) => reaction.from === ironNode.id && reaction.branchSide), isVisible: sourceNodeId === ironNode.id },
    { node: ironNode, reactions: reactionRegistry.filter((reaction) => reaction.from === ironNode.id && reaction.buttonText), isVisible: sourceNodeId === ironNode.id },
  ];
  const hasGeneralReactions = reactionRegistry.some((reaction) => !reaction.quickConnect);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        window.localStorage.setItem(layoutStorageKey, JSON.stringify(layouts));
      } catch {
        // Keep the active map usable when browser storage is unavailable.
      }
    }, 120);
    return () => window.clearTimeout(timeout);
  }, [layouts]);

  useEffect(() => {
    setSourceNodeId(null);
    setSelectedConnectionId(null);
  }, [oreId]);

  const updateCurrentLayout = (update: (current: OreMapLayout) => OreMapLayout) => {
    setLayouts((current) => {
      const saved = current[oreId] ?? { positions: defaultPositions(), connections: [] };
      return { ...current, [oreId]: update(saved) };
    });
  };

  const saveConnection = (reaction: SourceReaction) => {
    if (layout.connections.includes(reaction.id)) return;
    updateCurrentLayout((current) => ({
      ...current,
      connections: [
        ...current.connections.filter((id) => {
          const existing = reactionRegistry.find((item) => item.id === id);
          return existing && (
            existing.from !== reaction.from ||
            existing.to !== reaction.to ||
            (existing.parallel && reaction.parallel)
          );
        }),
        reaction.id,
      ],
    }));
    if (reaction.equation) discoverEquation(reaction.equation);
    if (reaction.observation) discoverObservation(reaction.observation);
    setSelectedConnectionId(reaction.id);
    setSourceNodeId(null);
  };

  const connectSelectedSource = () => {
    if (!sourceNodeId) return;
    const reaction = reactionRegistry.find((item) => item.from === sourceNodeId && item.quickConnect);
    if (reaction) saveConnection(reaction);
  };

  const handleNodePointerDown = (event: ReactPointerEvent<HTMLButtonElement>, node: ReactionNode) => {
    if (event.button !== 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const position = positions[node.id];
    dragRef.current = {
      nodeId: node.id,
      offsetX: (event.clientX - rect.left) / zoom,
      offsetY: (event.clientY - rect.top) / zoom,
      startX: position.x,
      startY: position.y,
    };
    didDragRef.current = false;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Synthetic pointer events do not have a capturable pointer.
    }
  };

  const handleNodePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    const canvas = canvasRef.current;
    if (!drag || !canvas) return;
    const canvasRect = canvas.getBoundingClientRect();
    const node = reactionNodes.find((item) => item.id === drag.nodeId);
    if (!node) return;
    const nextX = (event.clientX - canvasRect.left) / zoom - drag.offsetX;
    const nextY = (event.clientY - canvasRect.top) / zoom - drag.offsetY;
    if (Math.hypot(nextX - drag.startX, nextY - drag.startY) > 3) didDragRef.current = true;
    updateCurrentLayout((current) => ({ ...current, positions: { ...current.positions, [drag.nodeId]: { x: nextX, y: nextY } } }));
  };

  const handleNodePointerUp = () => {
    dragRef.current = null;
  };

  const handleViewportPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !(event.target instanceof Element)) return;
    if (event.target.closest('button, path')) return;
    const viewport = event.currentTarget;
    panRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: viewport.scrollLeft,
      scrollTop: viewport.scrollTop,
    };
    setIsPanning(true);
    try {
      viewport.setPointerCapture(event.pointerId);
    } catch {
      // Synthetic pointer events do not have a capturable pointer.
    }
  };

  const handleViewportPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const pan = panRef.current;
    if (!pan || pan.pointerId !== event.pointerId) return;
    event.currentTarget.scrollLeft = pan.scrollLeft - (event.clientX - pan.startX);
    event.currentTarget.scrollTop = pan.scrollTop - (event.clientY - pan.startY);
  };

  const handleViewportPointerUp = () => {
    panRef.current = null;
    setIsPanning(false);
  };

  const selectNode = (id: string) => {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    setSourceNodeId((selectedId) => selectedId === id ? null : id);
  };

  const zoomAroundViewportCenter = (nextZoom: number) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const centerX = (viewport.scrollLeft + viewport.clientWidth / 2) / zoom;
    const centerY = (viewport.scrollTop + viewport.clientHeight / 2) / zoom;
    setZoom(nextZoom);
    window.requestAnimationFrame(() => {
      viewport.scrollTo({
        left: centerX * nextZoom - viewport.clientWidth / 2,
        top: centerY * nextZoom - viewport.clientHeight / 2,
        behavior: 'smooth',
      });
    });
  };

  const fitMap = () => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const ironProductIds = new Set(reactionRegistry.filter((reaction) => reaction.from === 'Fe' && reaction.branchSide).map((reaction) => reaction.to));
    const nodesToFit = sourceNodeId === 'Fe'
      ? reactionNodes.filter((node) => node.id === 'Fe' || ironProductIds.has(node.id))
      : reactionNodes;
    let bounds = nodesToFit.reduce((current, node) => {
      const position = positions[node.id];
      const size = nodeDimensions(node);
      return {
        minX: Math.min(current.minX, position.x),
        minY: Math.min(current.minY, position.y),
        maxX: Math.max(current.maxX, position.x + size.width),
        maxY: Math.max(current.maxY, position.y + size.height),
      };
    }, { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });
    const padding = 64;
    const width = Math.max(1, bounds.maxX - bounds.minX);
    const height = Math.max(1, bounds.maxY - bounds.minY);
    const fitZoom = Math.max(0.08, Math.min(1.25, (viewport.clientWidth - padding * 2) / width, (viewport.clientHeight - padding * 2) / height));
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    setZoom(fitZoom);
    window.requestAnimationFrame(() => {
      viewport.scrollLeft = centerX * fitZoom - viewport.clientWidth / 2;
      viewport.scrollTop = centerY * fitZoom - viewport.clientHeight / 2;
    });
  };

  useEffect(() => {
    const frame = window.requestAnimationFrame(fitMap);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const resetView = () => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    setZoom(initialZoom);
    window.requestAnimationFrame(() => {
      viewport.scrollTo({
        left: mapWidth / 2 * initialZoom - viewport.clientWidth / 2,
        top: mapHeight / 2 * initialZoom - viewport.clientHeight / 2,
        behavior: 'smooth',
      });
    });
  };

  return (
    <section className="roshetta" aria-labelledby="roshetta-title">
      <header className="roshetta-heading">
        <div>
          <p className="eyebrow">Iron formed · final laboratory stage</p>
          <h2 id="roshetta-title">IRON REACTION MAP</h2>
          <p className="roshetta-subtitle">Siderite and iron(II) oxalate lead to FeO</p>
        </div>
        <div className="roshetta-master-lockup"><MasterLogo className="roshetta-master-logo" /><span>DR NASSER EL-BATAL · HIGH-TECH ROSHETTA</span></div>
      </header>

      <div className="roshetta-workbench">
        <div className="roshetta-toolbar" aria-label="Map controls">
          <button type="button" onClick={() => zoomAroundViewportCenter(Math.min(1.25, Number((zoom + 0.1).toFixed(2))))} aria-label="Zoom in" title="Zoom in">+</button>
          <button type="button" onClick={() => zoomAroundViewportCenter(Math.max(0.08, Number((zoom - 0.1).toFixed(2))))} aria-label="Zoom out" title="Zoom out">−</button>
          <button type="button" onClick={resetView}>Reset view</button>
          <button type="button" onClick={fitMap}>Fit to map</button>
          {selectedConnectionId && <button type="button" onClick={() => setSelectedConnectionId(null)}>Deselect connection</button>}
          <span>{Math.round(zoom * 100)}%</span>
        </div>

        {hasGeneralReactions && <div className="roshetta-legend" aria-label="Arrow categories">
          {[...new Set(reactionRegistry.map((reaction) => reaction.category))].map((category) => (
            <span key={category}><i style={{ backgroundColor: reactionCategoryColors[category] }} />{category}</span>
          ))}
        </div>}

        <div
          ref={viewportRef}
          className={`roshetta-viewport${isPanning ? ' is-panning' : ''}`}
          aria-label="Scrollable, draggable iron reaction map"
          onPointerDown={handleViewportPointerDown}
          onPointerMove={handleViewportPointerMove}
          onPointerUp={handleViewportPointerUp}
          onPointerCancel={handleViewportPointerUp}
        >
          <div className="roshetta-canvas-frame" style={{ width: mapWidth * zoom, height: mapHeight * zoom }}>
            <div ref={canvasRef} className="roshetta-canvas" style={{ width: mapWidth, height: mapHeight, transform: `scale(${zoom})` }}>
              <svg className="roshetta-arrows" viewBox={`0 0 ${mapWidth} ${mapHeight}`}>
                <defs>
                  {Object.entries(reactionCategoryColors).map(([category, color]) => (
                    <marker key={category} id={`arrow-${category}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
                    </marker>
                  ))}
                  {reactionRegistry.filter((reaction) => reaction.arrowColor).map((reaction) => (
                    <marker key={reaction.id} id={`arrow-${reaction.id}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill={reaction.arrowColor} />
                    </marker>
                  ))}
                </defs>
                {connections.map((reaction, index) => {
                  const emphasized = reaction.id === selectedConnectionId || reaction.id === hoveredConnectionId;
                  const geometry = edgeGeometry(reaction, positions, index);
                  if (!geometry) return null;
                  return (
                    <path
                      key={reaction.id}
                      d={geometry.path}
                      className={`roshetta-arrow is-discovered${emphasized ? ' is-emphasized' : ''}`}
                      stroke={reaction.arrowColor ?? reactionCategoryColors[reaction.category]}
                      markerEnd={`url(#arrow-${reaction.arrowColor ? reaction.id : reaction.category})`}
                      role="button"
                      tabIndex={0}
                      aria-label={`${reaction.categoryLabel}${reaction.equation ? `: ${reaction.equation}` : ''}${reaction.condition ? `; ${reaction.condition}` : ''}`}
                      onClick={() => setSelectedConnectionId(reaction.id)}
                      onMouseEnter={() => setHoveredConnectionId(reaction.id)}
                      onMouseLeave={() => setHoveredConnectionId(null)}
                      onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setSelectedConnectionId(reaction.id); }}
                    />
                  );
                })}
              </svg>

              {visibleNodes.map((node) => {
                const position = positions[node.id];
                const isSource = sourceNodeId === node.id;
                const isLocked = !node.initialVisible && !discoveredNodeIds.has(node.id) && !candidateNodeIds.has(node.id);
                return (
                <button
                  key={node.id}
                  type="button"
                  data-node-id={node.id}
                  className={`roshetta-node${node.kind === 'ore' ? ' is-ore' : ''}${node.kind === 'metal' ? ' is-metal' : ''}${isSource ? ' is-source' : ''}`}
                  style={{ left: position.x, top: position.y, backgroundColor: node.color, backgroundImage: node.backgroundImage, color: node.textColor, opacity: isLocked ? 0.18 : 1 }}
                  onPointerDown={(event) => handleNodePointerDown(event, node)}
                  onPointerMove={handleNodePointerMove}
                  onPointerUp={handleNodePointerUp}
                  onPointerCancel={handleNodePointerUp}
                  onClick={() => selectNode(node.id)}
                  aria-pressed={isSource}
                  aria-label={`Drag or select ${node.label.replace('\n', ', ')}`}
                >
                  {node.label.split('\n').map((line) => <span key={line}>{line}</span>)}
                  {node.annotation && <small className="roshetta-node-note">{node.annotation}</small>}
                </button>
                );
              })}

              {reactionControlGroups.filter((group) => group.isVisible && group.reactions.length > 0).map(({ node, reactions }) => {
                const dimensions = nodeDimensions(node);
                return (
                  <div
                    key={node.id}
                    className="roshetta-feo-acid-controls"
                    role="group"
                    aria-label={`${node.label.split('\n')[0]} reactions`}
                    style={{ left: positions[node.id].x + dimensions.width / 2, top: positions[node.id].y + dimensions.height + 18 }}
                  >
                    {reactions.map((reaction) => (
                      <button
                        key={reaction.id}
                        type="button"
                        className="roshetta-acid-choice"
                        style={{ fontSize: `${12 / zoom}px` }}
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={() => saveConnection(reaction)}
                        disabled={layout.connections.includes(reaction.id)}
                        title={layout.connections.includes(reaction.id) ? 'Already connected' : reaction.condition}
                      >
                        {reaction.buttonText ?? reaction.condition}
                      </button>
                    ))}
                  </div>
                );
              })}

              {connections.map((reaction, index) => {
                const geometry = edgeGeometry(reaction, positions, index);
                if (!geometry || (!reaction.arrowText && !reaction.buttonText && !reaction.equation)) return null;
                return (
                  <button
                    key={reaction.id}
                    type="button"
                    className={`roshetta-connection-label${reaction.arrowText ? ' is-arrow-note' : ''}${!reaction.arrowText && reaction.id === selectedConnectionId ? ' is-selected' : ''}`}
                    style={{ left: geometry.labelX, top: geometry.labelY, borderColor: reactionCategoryColors[reaction.category] }}
                    onClick={() => setSelectedConnectionId(reaction.id)}
                    onMouseEnter={() => setHoveredConnectionId(reaction.id)}
                    onMouseLeave={() => setHoveredConnectionId(null)}
                      aria-label={`${reaction.categoryLabel}${reaction.arrowText || reaction.buttonText || reaction.equation ? `: ${reaction.arrowText ?? reaction.buttonText ?? reaction.equation}` : ''}${reaction.condition ? `; ${reaction.condition}` : ''}${reaction.heating ? '; heat required' : ''}`}
                  >
                    {reaction.arrowText || reaction.buttonText ? <strong style={{ color: reaction.arrowTextColor ?? reactionCategoryColors[reaction.category], fontSize: `${14 / zoom}px` }}>{reaction.heating && 'Δ '}{reaction.arrowText ?? reaction.buttonText}</strong> : <><span>{reaction.categoryLabel}</span><strong>{reaction.heating && 'Δ '}{reaction.equation}</strong></>}
                    {reaction.condition && reaction.condition !== reaction.arrowText && <small style={reaction.arrowText ? { fontSize: `${10 / zoom}px` } : undefined}>{reaction.condition}</small>}
                  </button>
                );
              })}

                {sourceNodeId && reactionRegistry.some((reaction) => reaction.from === sourceNodeId && reaction.quickConnect) && !layout.connections.some((id) => reactionRegistry.some((reaction) => reaction.id === id && reaction.from === sourceNodeId)) && (() => {
                  const source = reactionNodes.find((node) => node.id === sourceNodeId);
                  if (!source) return null;
                  const destinationReaction = reactionRegistry.find((reaction) => reaction.from === sourceNodeId && reaction.quickConnect);
                  const destination = destinationReaction && reactionNodes.find((node) => node.id === destinationReaction.to);
                  const sourcePosition = positions[source.id];
                  const dimensions = nodeDimensions(source);
                  return (
                    <button
                      type="button"
                      className="roshetta-connect-tip"
                      style={{ left: sourcePosition.x + dimensions.width + 18, top: sourcePosition.y + dimensions.height / 2 }}
                      aria-label={`Connect ${source.label.replace('\n', ' ')} to ${destination?.label.replace('\n', ' ') ?? 'product'}`}
                      title={`Connect to ${destination?.label.split('\n')[0] ?? 'product'}`}
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={(event) => { event.stopPropagation(); connectSelectedSource(); }}
                    ><span className="roshetta-heat-waves" aria-hidden="true">~ ~</span><span className="roshetta-heat-triangle" aria-hidden="true">Δ</span></button>
                  );
                })()}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
