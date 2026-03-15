'use client';

import React, { useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Text, Image as KonvaImage, Transformer, Circle } from 'react-konva';
import useImage from 'use-image';
import { SpecialNode, CANVAS_PRESETS } from './types';

export interface EditorProps {
    nodes: SpecialNode[];
    onNodesChange: (nodes: SpecialNode[]) => void;
    selectedId: string | null;
    onSelect: (id: string | null) => void;
    preset: 'landscape_1080' | 'portrait_1080';
    backgroundColor?: string;
}

export type EditorRef = {
    getStage: () => any;
};

const URLImage = ({ src, iconProps, isSelected, onSelect, onChange }: any) => {
    const [image, status] = useImage(src, 'anonymous');
    const shapeRef = useRef<any>(null);
    const trRef = useRef<any>(null);

    useEffect(() => {
        if (isSelected && trRef.current && shapeRef.current) {
            trRef.current.nodes([shapeRef.current]);
            trRef.current.getLayer().batchDraw();
        }
    }, [isSelected]);

    if (status === 'failed') {
        return (
            <>
                <Rect
                    ref={shapeRef}
                    {...iconProps}
                    fill="#fee2e2"
                    stroke="#ef4444"
                    strokeWidth={2}
                    draggable
                    onClick={onSelect}
                    onTap={onSelect}
                    onDragEnd={(e: any) => {
                        onChange({
                            ...iconProps,
                            x: e.target.x(),
                            y: e.target.y(),
                        });
                    }}
                />
                <Text
                    x={iconProps.x}
                    y={iconProps.y + iconProps.height / 2 - 10}
                    width={iconProps.width}
                    text="Image Error"
                    align="center"
                    fill="#ef4444"
                />
            </>
        );
    }

    return (
        <>
            <KonvaImage
                image={image}
                ref={shapeRef}
                {...iconProps}
                draggable
                onClick={onSelect}
                onTap={onSelect}
                onDragEnd={(e: any) => {
                    onChange({
                        ...iconProps,
                        x: e.target.x(),
                        y: e.target.y(),
                    });
                }}
                onTransformEnd={(e: any) => {
                    const node = shapeRef.current;
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();
                    node.scaleX(1);
                    node.scaleY(1);
                    onChange({
                        ...iconProps,
                        x: node.x(),
                        y: node.y(),
                        width: Math.max(5, node.width() * scaleX),
                        height: Math.max(5, node.height() * scaleY),
                        rotation: node.rotation(),
                    });
                }}
            />
            {isSelected && (
                <Transformer
                    ref={trRef}
                    boundBoxFunc={(oldBox, newBox) => {
                        if (newBox.width < 5 || newBox.height < 5) {
                            return oldBox;
                        }
                        return newBox;
                    }}
                />
            )}
        </>
    );
};

const EditableText = ({ textProps, isSelected, onSelect, onChange }: any) => {
    const shapeRef = useRef<any>(null);
    const trRef = useRef<any>(null);

    useEffect(() => {
        if (isSelected && trRef.current && shapeRef.current) {
            trRef.current.nodes([shapeRef.current]);
            trRef.current.getLayer().batchDraw();
        }
    }, [isSelected]);

    return (
        <>
            <Text
                ref={shapeRef}
                {...textProps}
                draggable
                onClick={onSelect}
                onTap={onSelect}
                onDragEnd={(e: any) => {
                    onChange({
                        ...textProps,
                        x: e.target.x(),
                        y: e.target.y(),
                    });
                }}
                onTransformEnd={(e: any) => {
                    const node = shapeRef.current;
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();
                    node.scaleX(1);
                    node.scaleY(1);
                    onChange({
                        ...textProps,
                        x: node.x(),
                        y: node.y(),
                        fontSize: node.fontSize() * scaleY,
                        width: node.width() * scaleX,
                        rotation: node.rotation(),
                    });
                }}
            />
            {isSelected && (
                <Transformer
                    ref={trRef}
                    boundBoxFunc={(oldBox, newBox) => {
                        newBox.width = Math.max(30, newBox.width);
                        return newBox;
                    }}
                />
            )}
        </>
    );
}

const EditableRect = ({ shapeProps, isSelected, onSelect, onChange }: any) => {
    const shapeRef = useRef<any>(null);
    const trRef = useRef<any>(null);

    useEffect(() => {
        if (isSelected && trRef.current && shapeRef.current) {
            trRef.current.nodes([shapeRef.current]);
            trRef.current.getLayer().batchDraw();
        }
    }, [isSelected]);

    return (
        <>
            <Rect
                ref={shapeRef}
                {...shapeProps}
                draggable
                onClick={onSelect}
                onTap={onSelect}
                onDragEnd={(e: any) => {
                    onChange({
                        ...shapeProps,
                        x: e.target.x(),
                        y: e.target.y(),
                    });
                }}
                onTransformEnd={(e: any) => {
                    const node = shapeRef.current;
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();
                    node.scaleX(1);
                    node.scaleY(1);
                    onChange({
                        ...shapeProps,
                        x: node.x(),
                        y: node.y(),
                        width: Math.max(5, node.width() * scaleX),
                        height: Math.max(5, node.height() * scaleY),
                        rotation: node.rotation(),
                    });
                }}
            />
            {isSelected && (
                <Transformer
                    ref={trRef}
                    boundBoxFunc={(oldBox, newBox) => {
                        if (newBox.width < 5 || newBox.height < 5) return oldBox;
                        return newBox;
                    }}
                />
            )}
        </>
    );
};

const EditableCircle = ({ shapeProps, isSelected, onSelect, onChange }: any) => {
    const shapeRef = useRef<any>(null);
    const trRef = useRef<any>(null);

    useEffect(() => {
        if (isSelected && trRef.current && shapeRef.current) {
            trRef.current.nodes([shapeRef.current]);
            trRef.current.getLayer().batchDraw();
        }
    }, [isSelected]);

    return (
        <>
            <Circle
                ref={shapeRef}
                {...shapeProps}
                draggable
                onClick={onSelect}
                onTap={onSelect}
                onDragEnd={(e: any) => {
                    onChange({
                        ...shapeProps,
                        x: e.target.x(),
                        y: e.target.y(),
                    });
                }}
                onTransformEnd={(e: any) => {
                    const node = shapeRef.current;
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();
                    node.scaleX(1);
                    node.scaleY(1);
                    const scale = Math.max(scaleX, scaleY);
                    onChange({
                        ...shapeProps,
                        x: node.x(),
                        y: node.y(),
                        radius: Math.max(5, node.radius() * scale),
                        rotation: node.rotation(),
                    });
                }}
            />
            {isSelected && (
                <Transformer
                    ref={trRef}
                    enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
                    boundBoxFunc={(oldBox, newBox) => {
                        if (newBox.width < 5 || newBox.height < 5) return oldBox;
                        return newBox;
                    }}
                />
            )}
        </>
    );
};

const Editor = React.forwardRef<EditorRef, EditorProps>(({ nodes, onNodesChange, selectedId, onSelect, preset, backgroundColor = '#ffffff' }, ref) => {
    const stageRef = useRef<any>(null);

    React.useImperativeHandle(ref, () => ({
        getStage: () => stageRef.current
    }));

    const stageSize = CANVAS_PRESETS[preset];
    // Simplistic scale for now
    const scale = 0.4;

    const checkDeselect = (e: any) => {
        const clickedOnEmpty = e.target === e.target.getStage();
        if (clickedOnEmpty) {
            onSelect(null);
        }
    };

    const handleUpdate = (updatedNode: SpecialNode) => {
        onNodesChange(nodes.map(n => n.id === updatedNode.id ? updatedNode : n));
    };

    return (
        <div className="flex h-full bg-gray-100 overflow-hidden relative justify-center items-center">
            <div className="shadow-lg bg-white" style={{ width: stageSize.width * scale, height: stageSize.height * scale }}>
                <Stage
                    ref={stageRef}
                    width={stageSize.width * scale}
                    height={stageSize.height * scale}
                    scaleX={scale}
                    scaleY={scale}
                    onMouseDown={checkDeselect}
                    onTouchStart={checkDeselect}
                >
                    <Layer>
                        <Rect
                            x={0}
                            y={0}
                            width={stageSize.width}
                            height={stageSize.height}
                            fill={backgroundColor}
                        />
                        {nodes.map((node) => {
                            if (node.type === 'text') {
                                return (
                                    <EditableText
                                        key={node.id}
                                        textProps={node}
                                        isSelected={node.id === selectedId}
                                        onSelect={() => onSelect(node.id)}
                                        onChange={handleUpdate}
                                    />
                                );
                            }
                            if (node.type === 'image') {
                                return (
                                    <URLImage
                                        key={node.id}
                                        iconProps={node}
                                        src={node.src}
                                        isSelected={node.id === selectedId}
                                        onSelect={() => onSelect(node.id)}
                                        onChange={handleUpdate}
                                    />
                                );
                            }
                            if (node.type === 'rect') {
                                return (
                                    <EditableRect
                                        key={node.id}
                                        shapeProps={node}
                                        isSelected={node.id === selectedId}
                                        onSelect={() => onSelect(node.id)}
                                        onChange={handleUpdate}
                                    />
                                );
                            }
                            if (node.type === 'circle') {
                                return (
                                    <EditableCircle
                                        key={node.id}
                                        shapeProps={node}
                                        isSelected={node.id === selectedId}
                                        onSelect={() => onSelect(node.id)}
                                        onChange={handleUpdate}
                                    />
                                );
                            }
                            return null;
                        })}
                    </Layer>
                </Stage>
            </div>
        </div>
    );
});

Editor.displayName = 'Editor';
export default Editor;
