'use client';

import React from 'react';
import { SpecialNode } from './types';
import { Trash2, Copy, ArrowUp, ArrowDown } from 'lucide-react';

interface LayersPanelProps {
    nodes: SpecialNode[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onReorder: (dragIndex: number, hoverIndex: number) => void; // Keeping simple for now, maybe just move up/down
    onDelete: (id: string) => void;
    onDuplicate: (id: string) => void;
    onMoveLayer: (id: string, direction: 'up' | 'down') => void;
}

export function LayersPanel({ nodes, selectedId, onSelect, onDelete, onDuplicate, onMoveLayer }: LayersPanelProps) {
    // We want to show the top-most layer at the top of the list, so we reverse the nodes array for display
    // But we need to keep track of original indices if we implemented drag-n-drop (skipping for now)
    const displayNodes = [...nodes].reverse();

    return (
        <div className="p-4 flex flex-col h-full">
            <h3 className="font-semibold text-sm text-zinc-950 border-b border-zinc-200 pb-2 mb-3">Layers</h3>
            <div className="flex-1 overflow-y-auto space-y-1">
                {displayNodes.map((node) => (
                    <div
                        key={node.id}
                        onClick={() => onSelect(node.id)}
                        className={`flex items-center justify-between p-2 rounded-md cursor-pointer text-sm transition-colors ${selectedId === node.id ? 'bg-zinc-100 font-medium text-zinc-900 ring-1 ring-zinc-200' : 'hover:bg-zinc-50 text-zinc-600'}`}
                    >
                        <div className="truncate w-24">
                            {node.type === 'text' ? <span className="flex items-center gap-2"><span className="text-xs text-zinc-400">T</span> {node.text}</span> : <span className="flex items-center gap-2"><span className="text-xs text-zinc-400">IMG</span> Image</span>}
                        </div>

                        {selectedId === node.id && (
                            <div className="flex items-center space-x-1">
                                <button title="Move Up" onClick={(e) => { e.stopPropagation(); onMoveLayer(node.id, 'up'); }} className="p-1 hover:bg-zinc-200 rounded text-zinc-500 hover:text-zinc-900">
                                    <ArrowUp size={12} />
                                </button>
                                <button title="Move Down" onClick={(e) => { e.stopPropagation(); onMoveLayer(node.id, 'down'); }} className="p-1 hover:bg-zinc-200 rounded text-zinc-500 hover:text-zinc-900">
                                    <ArrowDown size={12} />
                                </button>
                                <button title="Duplicate" onClick={(e) => { e.stopPropagation(); onDuplicate(node.id); }} className="p-1 hover:bg-zinc-200 rounded text-zinc-500 hover:text-blue-600">
                                    <Copy size={12} />
                                </button>
                                <button title="Delete" onClick={(e) => { e.stopPropagation(); onDelete(node.id); }} className="p-1 hover:bg-zinc-200 rounded text-zinc-500 hover:text-red-600">
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        )}
                    </div>
                ))}
                {nodes.length === 0 && <div className="text-zinc-400 text-sm text-center py-8 italic">No elements added</div>}
            </div>
        </div>
    );
}
