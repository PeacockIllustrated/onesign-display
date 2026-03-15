export type SpecialNodeType = 'text' | 'image' | 'rect' | 'circle';

export interface SpecialNode {
    id: string;
    type: SpecialNodeType;
    x: number;
    y: number;
    rotation?: number;
    width?: number; // Used for Rect, Image, Text width
    height?: number; // Used for Rect, Image
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    // Circle specific
    radius?: number; // Used for Circle (or we can use width/height for Ellipse)
    // Text specific
    text?: string;
    fontSize?: number;
    fontFamily?: string;
    fontStyle?: string;
    align?: 'left' | 'center' | 'right' | 'justify';
    lineHeight?: number;
    letterSpacing?: number;
    // Image specific
    src?: string;
    // Layering
    zIndex?: number;
}

export interface SpecialsProject {
    id: string;
    client_id: string;
    name: string;
    canvas_preset: 'landscape_1080' | 'portrait_1080';
    design_json: {
        nodes: SpecialNode[];
        backgroundColor: string;
    };
    last_published_media_asset_id?: string;
    thumbnail_url?: string;
    updated_at: string;
}

export const CANVAS_PRESETS = {
    landscape_1080: { width: 1920, height: 1080 },
    portrait_1080: { width: 1080, height: 1920 },
};
