import React, { useState } from 'react';
import type { GraphNodePayload, GraphEdgePayload, CoreLabel } from '../types';
import { ENTITY_STYLES } from '../theme';
import {
  Tag,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Copy,
  Check,
  GitFork,
  X,
} from 'lucide-react';

interface EntityDetailPanelProps {
  node: GraphNodePayload;
  edges: GraphEdgePayload[];
  allNodes: GraphNodePayload[];
  onTraverseToNode: (elementId: string) => void;
  centerElementId?: string | null;
  onClose?: () => void;
}

export const EntityDetailPanel: React.FC<EntityDetailPanelProps> = ({
  node,
  edges,
  allNodes,
  onTraverseToNode,
  centerElementId,
  onClose,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const style = ENTITY_STYLES[node.label as CoreLabel];
  const Icon = style?.icon || Tag;

  const nodeMap = new Map(allNodes.map((n) => [n.elementId, n]));

  // Find all edges connected to this node
  const connectedEdges = edges.filter(
    (e) => e.sourceElementId === node.elementId || e.targetElementId === node.elementId
  );

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const isCenter = node.elementId === centerElementId;

  return (
    <div className="bg-[#FFFDF8] border border-[#E4DFD4] rounded-2xl p-5 shadow-sm flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="border-b border-[#E4DFD4] pb-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="px-2.5 py-0.5 rounded-md text-xs font-semibold flex items-center gap-1.5"
              style={{
                backgroundColor: style?.bgSoft || '#F7F5EF',
                color: style?.textColor || '#262B27',
                border: `1px solid ${style?.borderSoft || '#E4DFD4'}`,
              }}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{node.label}</span>
            </span>

            {isCenter && (
              <span className="px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-[#EBF1EA] text-[#426B52] border border-[#C8D8C4]">
                Active Center
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isCenter && (
              <button
                onClick={() => onTraverseToNode(node.elementId)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-[#426B52] hover:bg-[#31523E] text-[#FFFDF8] rounded-lg transition-all shadow-xs active:scale-95"
              >
                <span>Explore</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 text-[#74776F] hover:text-[#262B27] hover:bg-[#EEE9DE] rounded-md transition-colors"
                title="Close panel"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <h3 className="text-base font-bold text-[#262B27] mt-2.5 tracking-tight">
          {node.displayName}
        </h3>
        <p className="text-xs text-[#74776F] mt-0.5">
          {node.secondaryInfo || `${node.label} entity in Neo4j AuraDB`}
        </p>
      </div>

      {/* Properties Table */}
      <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[260px] pr-1">
        <div className="flex items-center justify-between text-xs text-[#74776F] font-semibold uppercase tracking-wider mb-1">
          <span className="flex items-center gap-1">
            <Tag className="w-3 h-3 text-[#426B52]" />
            <span>Properties</span>
          </span>
          <span className="text-[11px] font-mono text-[#9B9990]">
            {Object.keys(node.properties).length} fields
          </span>
        </div>

        <div className="bg-[#F7F5EF] rounded-xl border border-[#E4DFD4] divide-y divide-[#E4DFD4] overflow-hidden text-xs">
          {/* elementId */}
          <div className="flex items-center justify-between p-2 hover:bg-[#EEE9DE]/60 transition-colors">
            <span className="font-mono text-[#74776F]">elementId</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[#262B27] max-w-[170px] truncate" title={node.elementId}>
                {node.elementId}
              </span>
              <button
                onClick={() => handleCopy(node.elementId, 'elementId')}
                className="p-1 text-[#74776F] hover:text-[#262B27] transition-colors"
                title="Copy elementId"
              >
                {copiedKey === 'elementId' ? (
                  <Check className="w-3 h-3 text-[#426B52]" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
          </div>

          {/* Dynamic Properties */}
          {Object.entries(node.properties).map(([key, val]) => {
            const displayVal =
              val === null || val === undefined
                ? 'null'
                : typeof val === 'object'
                ? JSON.stringify(val)
                : String(val);

            return (
              <div
                key={key}
                className="flex items-center justify-between p-2 hover:bg-[#EEE9DE]/60 transition-colors"
              >
                <span className="font-mono text-[#74776F] truncate max-w-[110px]" title={key}>
                  {key}
                </span>
                <div className="flex items-center gap-1.5 max-w-[190px]">
                  <span
                    className="font-mono text-[#262B27] truncate font-medium text-right"
                    title={displayVal}
                  >
                    {displayVal}
                  </span>
                  <button
                    onClick={() => handleCopy(displayVal, key)}
                    className="p-1 text-[#74776F] hover:text-[#262B27] transition-colors shrink-0"
                    title={`Copy ${key}`}
                  >
                    {copiedKey === key ? (
                      <Check className="w-3 h-3 text-[#426B52]" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Connected Entities Traversal Section */}
      <div className="border-t border-[#E4DFD4] pt-3 space-y-2">
        <div className="flex items-center justify-between text-xs text-[#74776F] font-semibold uppercase tracking-wider">
          <span className="flex items-center gap-1">
            <GitFork className="w-3 h-3 text-[#426B52]" />
            <span>Connected ({connectedEdges.length})</span>
          </span>
          <span className="text-[11px] text-[#74776F]">1-Hop Traversal</span>
        </div>

        <div className="space-y-1.5 max-h-[170px] overflow-y-auto pr-1">
          {connectedEdges.length === 0 ? (
            <div className="p-3 text-center text-xs text-[#74776F] bg-[#F7F5EF] rounded-xl border border-dashed border-[#E4DFD4]">
              No active relationships connected to this entity
            </div>
          ) : (
            connectedEdges.map((edge) => {
              const isOutgoing = edge.sourceElementId === node.elementId;
              const targetNodeId = isOutgoing
                ? edge.targetElementId
                : edge.sourceElementId;
              const otherNode = nodeMap.get(targetNodeId);
              const otherStyle = otherNode
                ? ENTITY_STYLES[otherNode.label as CoreLabel]
                : null;

              return (
                <div
                  key={edge.elementId}
                  onClick={() => otherNode && onTraverseToNode(otherNode.elementId)}
                  className="flex items-center justify-between p-2 rounded-xl bg-[#F7F5EF] hover:bg-[#EEE9DE] border border-[#E4DFD4] text-xs cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="p-1 rounded-md shrink-0"
                      style={{
                        backgroundColor: isOutgoing ? '#EBF1EA' : '#FAF3EB',
                        color: isOutgoing ? '#426B52' : '#93581D',
                      }}
                      title={isOutgoing ? 'Outgoing [:TYPE]->' : '<-[:TYPE] Incoming'}
                    >
                      {isOutgoing ? (
                        <ArrowRight className="w-3 h-3" />
                      ) : (
                        <ArrowLeft className="w-3 h-3" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-[#262B27] truncate group-hover:text-[#426B52] transition-colors">
                        {otherNode?.displayName || targetNodeId}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-[#74776F] font-mono">
                        <span className="font-semibold text-[#426B52]">
                          [:{edge.type}]
                        </span>
                        <span>•</span>
                        <span
                          className="w-1.5 h-1.5 rounded-full inline-block"
                          style={{ backgroundColor: otherStyle?.color || '#74776F' }}
                        />
                        <span>{otherNode?.label || 'Node'}</span>
                      </div>
                    </div>
                  </div>

                  <span className="text-[#74776F] group-hover:text-[#426B52] transition-colors shrink-0 ml-1">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
