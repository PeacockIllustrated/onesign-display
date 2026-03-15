'use client';

import React from 'react';
import { SpecialNode } from './types';
import { EDITOR_FONTS } from './fonts';
import { AlignLeft, AlignCenter, AlignRight, Type, Move, Maximize } from 'lucide-react';

interface PropertiesPanelProps {
    selectedNode: SpecialNode | null;
    onUpdate: (updates: Partial<SpecialNode>) => void;
    canvasWidth: number;
    canvasHeight: number;
}

export function PropertiesPanel({ selectedNode, onUpdate, canvasWidth, canvasHeight }: PropertiesPanelProps) {
    if (!selectedNode) {
        return (
            <div className="p-4 text-sm text-gray-500">
                Select an element to edit its properties.
            </div>
        );
    }

    const handleFillScreen = () => {
        onUpdate({
            x: 0,
            y: 0,
            width: canvasWidth,
            height: canvasHeight
        });
    };

    return (
        <div className="p-4 space-y-6">
            <h3 className="font-semibold text-lg text-zinc-950">Properties</h3>

            {/* Common Properties */}
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                    {/* ... existing X/Y inputs ... */}
                    <div>
                        <label className="text-xs font-medium text-zinc-500 mb-1 block">X</label>
                        <input
                            type="number"
                            value={Math.round(selectedNode.x)}
                            onChange={e => onUpdate({ x: Number(e.target.value) })}
                            className="w-full border border-zinc-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-zinc-500 mb-1 block">Y</label>
                        <input
                            type="number"
                            value={Math.round(selectedNode.y)}
                            onChange={e => onUpdate({ y: Number(e.target.value) })}
                            className="w-full border border-zinc-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                        />
                    </div>
                </div>

                {(selectedNode.type === 'rect' || selectedNode.type === 'image') && (
                    <button
                        onClick={handleFillScreen}
                        className="w-full flex items-center justify-center gap-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 py-1.5 rounded text-xs font-medium transition-colors"
                        title="Stretch to fill the entire canvas"
                    >
                        <Maximize size={14} />
                        Fill Screen
                    </button>
                )}
            </div>

            {/* Text Specific */}
            {selectedNode.type === 'text' && (
                <div className="space-y-4">
                    <h4 className="font-semibold text-sm text-zinc-900 border-b pb-1 mb-3">Text Style</h4>

                    <div className="mb-4">
                        <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Content</label>
                        <textarea
                            value={selectedNode.text}
                            onChange={e => onUpdate({ text: e.target.value })}
                            className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 transition-shadow resize-none"
                            rows={3}
                        />
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Font Family</label>
                            <select
                                value={selectedNode.fontFamily || 'Inter'}
                                onChange={e => onUpdate({ fontFamily: e.target.value })}
                                className="w-full border border-zinc-200 rounded-md px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 bg-white"
                            >
                                {EDITOR_FONTS.map(font => (
                                    <option key={font.name} value={font.value} style={{ fontFamily: font.value }}>
                                        {font.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Size</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={Math.round(selectedNode.fontSize || 0)}
                                        onChange={e => onUpdate({ fontSize: Number(e.target.value) })}
                                        className="w-full border border-zinc-200 rounded-md pl-3 pr-8 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900"
                                    />
                                    <span className="absolute right-2 top-1.5 text-xs text-zinc-400">px</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Color</label>
                                <div className="flex items-center gap-2 border border-zinc-200 rounded-md p-1.5 bg-white">
                                    <input
                                        type="color"
                                        value={selectedNode.fill}
                                        onChange={e => onUpdate({ fill: e.target.value })}
                                        className="w-6 h-6 rounded cursor-pointer border-0 p-0"
                                    />
                                    <span className="text-xs text-zinc-600 font-mono uppercase truncate">{selectedNode.fill}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Alignment & Style</label>
                            <div className="flex bg-zinc-100 rounded-md p-1 gap-1">
                                <button
                                    onClick={() => onUpdate({ align: 'left' })}
                                    className={`flex-1 flex justify-center py-1.5 rounded text-zinc-500 transition-all ${(!selectedNode.align || selectedNode.align === 'left') ? 'bg-white shadow-sm text-zinc-900' : 'hover:bg-zinc-200'}`}
                                    title="Align Left"
                                >
                                    <AlignLeft size={14} />
                                </button>
                                <button
                                    onClick={() => onUpdate({ align: 'center' })}
                                    className={`flex-1 flex justify-center py-1.5 rounded text-zinc-500 transition-all ${selectedNode.align === 'center' ? 'bg-white shadow-sm text-zinc-900' : 'hover:bg-zinc-200'}`}
                                    title="Align Center"
                                >
                                    <AlignCenter size={14} />
                                </button>
                                <button
                                    onClick={() => onUpdate({ align: 'right' })}
                                    className={`flex-1 flex justify-center py-1.5 rounded text-zinc-500 transition-all ${selectedNode.align === 'right' ? 'bg-white shadow-sm text-zinc-900' : 'hover:bg-zinc-200'}`}
                                    title="Align Right"
                                >
                                    <AlignRight size={14} />
                                </button>
                                <div className="w-px bg-zinc-200 mx-1 my-1"></div>
                                <button
                                    onClick={() => {
                                        const current = selectedNode.fontStyle || 'normal';
                                        let next = 'normal';
                                        if (current.includes('bold')) {
                                            next = current.replace('bold', '').trim();
                                        } else {
                                            next = (current + ' bold').trim();
                                        }
                                        onUpdate({ fontStyle: next || 'normal' });
                                    }}
                                    className={`flex-1 flex justify-center py-1.5 rounded font-bold text-xs transition-colors ${selectedNode.fontStyle?.includes('bold') ? 'bg-white shadow-sm text-black' : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200'}`}
                                >
                                    B
                                </button>
                                <button
                                    onClick={() => {
                                        const current = selectedNode.fontStyle || 'normal';
                                        let next = 'normal';
                                        if (current.includes('italic')) {
                                            next = current.replace('italic', '').trim();
                                        } else {
                                            next = (current + ' italic').trim();
                                        }
                                        onUpdate({ fontStyle: next || 'normal' });
                                    }}
                                    className={`flex-1 flex justify-center py-1.5 rounded italic text-xs font-serif transition-colors ${selectedNode.fontStyle?.includes('italic') ? 'bg-white shadow-sm text-black' : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200'}`}
                                >
                                    I
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Line Height</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={selectedNode.lineHeight || 1}
                                    onChange={e => onUpdate({ lineHeight: Number(e.target.value) })}
                                    className="w-full border border-zinc-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Spacing</label>
                                <input
                                    type="number"
                                    value={selectedNode.letterSpacing || 0}
                                    onChange={e => onUpdate({ letterSpacing: Number(e.target.value) })}
                                    className="w-full border border-zinc-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900"
                                />
                            </div>
                        </div>
                    </div>

                </div>
            )}

            {/* Shape Specific */}
            {(selectedNode.type === 'rect' || selectedNode.type === 'circle') && (
                <div className="space-y-4">
                    <h4 className="font-semibold text-sm text-zinc-900 border-b pb-1 mb-3">Shape Style</h4>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Fill</label>
                            <div className="flex items-center gap-2 border border-zinc-200 rounded-md p-1.5 bg-white">
                                <input
                                    type="color"
                                    value={selectedNode.fill || '#ffffff'}
                                    onChange={e => onUpdate({ fill: e.target.value })}
                                    className="w-6 h-6 rounded cursor-pointer border-0 p-0"
                                />
                                <span className="text-xs text-zinc-600 font-mono uppercase truncate">{selectedNode.fill}</span>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Stroke</label>
                            <div className="flex items-center gap-2 border border-zinc-200 rounded-md p-1.5 bg-white">
                                <input
                                    type="color"
                                    value={selectedNode.stroke || '#000000'}
                                    onChange={e => onUpdate({ stroke: e.target.value })}
                                    className="w-6 h-6 rounded cursor-pointer border-0 p-0"
                                />
                                <span className="text-xs text-zinc-600 font-mono uppercase truncate">{selectedNode.stroke}</span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Stroke Width</label>
                        <input
                            type="number"
                            value={selectedNode.strokeWidth || 0}
                            onChange={e => onUpdate({ strokeWidth: Number(e.target.value) })}
                            className="w-full border border-zinc-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900"
                        />
                    </div>
                    {selectedNode.type === 'rect' && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Width</label>
                                <input
                                    type="number"
                                    value={Math.round(selectedNode.width || 0)}
                                    onChange={e => onUpdate({ width: Number(e.target.value) })}
                                    className="w-full border border-zinc-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Height</label>
                                <input
                                    type="number"
                                    value={Math.round(selectedNode.height || 0)}
                                    onChange={e => onUpdate({ height: Number(e.target.value) })}
                                    className="w-full border border-zinc-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900"
                                />
                            </div>
                        </div>
                    )}
                    {selectedNode.type === 'circle' && (
                        <div>
                            <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Radius</label>
                            <input
                                type="number"
                                value={Math.round(selectedNode.radius || 0)}
                                onChange={e => onUpdate({ radius: Number(e.target.value) })}
                                className="w-full border border-zinc-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900"
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Image Specific */}
            {selectedNode.type === 'image' && (
                <div className="space-y-4">
                    <h4 className="font-medium text-sm text-zinc-900 border-b pb-1">Image</h4>
                    <div className="text-xs text-zinc-400 truncate bg-zinc-50 p-2 rounded border border-zinc-100">
                        Source: {selectedNode.src ? selectedNode.src.split('/').pop() : 'None'}
                    </div>
                </div>
            )}
        </div>
    );
}
