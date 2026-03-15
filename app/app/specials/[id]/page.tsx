'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { notFound, useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { SpecialsProject, SpecialNode, CANVAS_PRESETS } from '@/components/specials/types';
import { updateSpecialsProject, deleteSpecialsProject, publishSpecialThumbnail, createTemplate } from '../actions';
import { LayersPanel } from '@/components/specials/LayersPanel';
import { PropertiesPanel } from '@/components/specials/PropertiesPanel';
import { Loader2, ArrowLeft, Save, Upload, Type, Image as ImageIcon, Square, Circle, Undo, Redo, Trash2, Layers, Settings, Monitor, Copy } from 'lucide-react';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';
import { EDITOR_FONTS } from '@/components/specials/fonts';
import { PublishModal } from '@/components/specials/PublishModal';

// Dynamically import Editor to avoid SSR issues with Konva
const Editor = dynamic(() => import('@/components/specials/Editor'), {
    ssr: false,
    loading: () => <div className="flex-1 flex items-center justify-center bg-gray-100">Loading Editor...</div>
});

const MAX_HISTORY = 20;

export default function EditSpecialPage() {
    const { id } = useParams();
    const router = useRouter();
    const [project, setProject] = useState<SpecialsProject | null>(null);
    const [projectName, setProjectName] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [templateName, setTemplateName] = useState('');

    // Node State & History
    const [nodes, setNodes] = useState<SpecialNode[]>([]);
    const [history, setHistory] = useState<SpecialNode[][]>([]);
    const [historyStep, setHistoryStep] = useState(0);

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const editorRef = useRef<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Mobile UI State
    const [showMobileLayers, setShowMobileLayers] = useState(false);
    const [showMobileProperties, setShowMobileProperties] = useState(false);

    useEffect(() => {
        const fetchProject = async () => {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('display_specials_projects')
                .select('*')
                .eq('id', id)
                .single();

            if (error || !data) {
                console.error(error);
            } else {
                setProject(data);
                setProjectName(data.name);
                setTemplateName(data.name + ' Template');
                const initialNodes = data.design_json?.nodes || [];
                setNodes(initialNodes);
                setHistory([initialNodes]);
                setHistoryStep(0);
            }
            setLoading(false);
        };
        fetchProject();
    }, [id]);

    // History Helpers
    const pushToHistory = useCallback((newNodes: SpecialNode[]) => {
        const newHistory = history.slice(0, historyStep + 1);
        newHistory.push(newNodes);
        if (newHistory.length > MAX_HISTORY) {
            newHistory.shift();
        }
        setHistory(newHistory);
        setHistoryStep(newHistory.length - 1);
        setNodes(newNodes);
    }, [history, historyStep]);

    const handleUndo = useCallback(() => {
        if (historyStep === 0) return;
        const newStep = historyStep - 1;
        setHistoryStep(newStep);
        setNodes(history[newStep]);
    }, [historyStep, history]);

    const handleRedo = useCallback(() => {
        if (historyStep === history.length - 1) return;
        const newStep = historyStep + 1;
        setHistoryStep(newStep);
        setNodes(history[newStep]);
    }, [historyStep, history]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    handleRedo();
                } else {
                    handleUndo();
                }
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault();
                handleRedo();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleUndo, handleRedo]);


    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length || !project) return;
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('clientId', project.client_id);
        formData.append('files', file);

        setSaving(true);
        try {
            const res = await fetch('/api/upload/ingest', {
                method: 'POST',
                body: formData
            });
            if (!res.ok) throw new Error('Upload failed');
            const json = await res.json();
            const result = json.results?.[0];

            if (result && result.publicUrl) {
                const newNode = {
                    id: uuidv4(),
                    type: 'image' as const,
                    x: 100,
                    y: 100,
                    src: result.publicUrl,
                    width: 300,
                    height: 300
                };
                pushToHistory([...nodes, newNode]);
                setSelectedId(newNode.id);
            } else {
                alert('Upload success but failed to get URL');
            }
        } catch (err: any) {
            console.error(err);
            alert('Image upload failed');
        } finally {
            setSaving(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSave = async () => {
        if (!project || !editorRef.current) return;
        setSaving(true);
        try {
            // 1. Generate Thumbnail
            const stage = editorRef.current.getStage();
            let thumbnailUrl = project.thumbnail_url;

            if (stage) {
                // Temporarily unselect to hide transformer
                const prevSelected = selectedId;
                setSelectedId(null);
                await new Promise(r => setTimeout(r, 50));

                // Calculate ratio for a width of 400px thumbnail
                const preset = CANVAS_PRESETS[project.canvas_preset as keyof typeof CANVAS_PRESETS];
                const targetWidth = 400;
                // We want final image width to be 400.
                // Current stage width is (preset.width * stage.scaleX()).
                // pixelRatio * (stage.width()) = 400
                // pixelRatio = 400 / (stage.width())
                const pixelRatio = targetWidth / (stage.width());

                const dataUrl = stage.toDataURL({
                    pixelRatio: pixelRatio,
                    mimeType: 'image/jpeg',
                    quality: 0.8
                });

                // Restore selection
                setSelectedId(prevSelected);

                const res = await fetch(dataUrl);
                const blob = await res.blob();
                const file = new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' });

                const supabase = createClient();
                const path = `${project.client_id}/thumbnails/${project.id}.jpg`;

                const { error: uploadError } = await supabase.storage
                    .from('onesign-display')
                    .upload(path, file, { upsert: true });

                if (uploadError) {
                    console.warn('Thumbnail upload failed:', uploadError);
                } else {
                    const { data: { publicUrl } } = supabase.storage
                        .from('onesign-display')
                        .getPublicUrl(path);
                    thumbnailUrl = publicUrl;
                }
            }

            // 2. Save Project
            const designJson = {
                ...project.design_json,
                nodes: nodes
            };

            await updateSpecialsProject(project.id, {
                name: projectName,
                design_json: designJson,
                thumbnail_url: thumbnailUrl
            });

        } catch (e) {
            console.error(e);
            alert('Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveTemplate = async () => {
        if (!project || !editorRef.current || !templateName) return;
        setSaving(true);
        try {
            // 1. Generate Thumbnail (Duplicate logic for simplicity/safety)
            const stage = editorRef.current.getStage();
            let thumbnailUrl = undefined;

            if (stage) {
                const prevSelected = selectedId;
                setSelectedId(null);
                await new Promise(r => setTimeout(r, 50));

                const preset = CANVAS_PRESETS[project.canvas_preset as keyof typeof CANVAS_PRESETS];
                const targetWidth = 400;
                const pixelRatio = targetWidth / (stage.width());

                const dataUrl = stage.toDataURL({
                    pixelRatio: pixelRatio,
                    mimeType: 'image/jpeg',
                    quality: 0.8
                });
                setSelectedId(prevSelected);

                const res = await fetch(dataUrl);
                const blob = await res.blob();
                const file = new File([blob], 'template-thumb.jpg', { type: 'image/jpeg' });

                const supabase = createClient();
                // Store in a templates folder? or reuse thumbnails folder
                // Use a unique ID for template thumbnail
                const thumbId = uuidv4();
                const path = `${project.client_id}/thumbnails/${thumbId}.jpg`;

                const { error: uploadError } = await supabase.storage
                    .from('onesign-display')
                    .upload(path, file, { upsert: true });

                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage
                        .from('onesign-display')
                        .getPublicUrl(path);
                    thumbnailUrl = publicUrl;
                }
            }

            const designJson = {
                ...project.design_json,
                nodes: nodes
            };

            await createTemplate(project.client_id, templateName, project.canvas_preset, designJson, thumbnailUrl);
            setShowTemplateModal(false);
            alert('Template created successfully!');

        } catch (e: any) {
            console.error(e);
            alert(`Failed to create template: ${e.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteProject = async () => {
        if (!project) return;
        if (!confirm('Are you sure you want to delete this specific project? This cannot be undone.')) return;
        setSaving(true);
        try {
            await deleteSpecialsProject(project.id);
            router.push('/app/specials');
        } catch (e: any) {
            console.error(e);
            alert('Failed to delete project: ' + e.message);
            setSaving(false);
        }
    };

    const handlePublish = async () => {
        if (!project || !editorRef.current) return;

        setSaving(true);
        try {
            const stage = editorRef.current.getStage();
            if (!stage) throw new Error("Stage not found");

            const prevSelected = selectedId;
            setSelectedId(null);
            await new Promise(r => setTimeout(r, 100));

            // EXPORT FULL RESOLUTION strategy: Unscale stage temporarily
            const preset = CANVAS_PRESETS[project.canvas_preset as keyof typeof CANVAS_PRESETS];

            const oldScale = stage.scaleX();
            const oldWidth = stage.width();
            const oldHeight = stage.height();

            // Set to natural size (1:1)
            stage.scale({ x: 1, y: 1 });
            stage.width(preset.width);
            stage.height(preset.height);
            // Redraw to ensure updates applied
            stage.batchDraw();

            const dataUrl = stage.toDataURL({
                pixelRatio: 1, // 1:1 export
                mimeType: 'image/png'
            });

            // Restore editor scale
            stage.scale({ x: oldScale, y: oldScale });
            stage.width(oldWidth);
            stage.height(oldHeight);
            stage.batchDraw();

            setSelectedId(prevSelected);

            const res = await fetch(dataUrl);
            const blob = await res.blob();
            const filename = `special-${projectName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.png`;
            const file = new File([blob], filename, { type: 'image/png' });

            // Upload Logic via Server Action (Bypasses RLS)
            const formData = new FormData();
            formData.append('file', file);
            formData.append('clientId', project.client_id);
            formData.append('filename', filename);
            formData.append('duration', '10');

            await publishSpecialThumbnail(formData);

            // Update Project
            const designJson = { ...project.design_json, nodes: nodes };
            await updateSpecialsProject(project.id, {
                name: projectName,
                design_json: designJson
            });

            setShowPublishModal(false);
            alert('Published successfully! The image is available in your Media Library.');

        } catch (e: any) {
            console.error(e);
            alert(`Publish failed: ${e.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleAddNode = (newNode: SpecialNode) => {
        pushToHistory([...nodes, newNode]);
        setSelectedId(newNode.id);
    };

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
    if (!project) return <div>Project not found</div>;

    const presetName = project?.canvas_preset || 'landscape_1080';
    const presetDimensions = CANVAS_PRESETS[presetName as keyof typeof CANVAS_PRESETS] || CANVAS_PRESETS.landscape_1080;
    const selectedNode = nodes.find(n => n.id === selectedId) || null;
    const isPortrait = presetName.includes('portrait');

    return (
        <div className="h-screen flex flex-col bg-zinc-50">
            <style jsx global>{`
                ${EDITOR_FONTS.map(font => `@import url('${font.url}');`).join('\n')}
            `}</style>

            <PublishModal
                isOpen={showPublishModal}
                onClose={() => setShowPublishModal(false)}
                onPublish={handlePublish}
                project={project}
                saving={saving}
            />

            {/* Template Modal */}
            {showTemplateModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                        <h3 className="text-lg font-bold mb-4">Save as Template</h3>
                        <p className="text-sm text-gray-500 mb-4">Create a reusable template from your current design.</p>
                        <div className="mb-4">
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Template Name</label>
                            <input
                                type="text"
                                value={templateName}
                                onChange={(e) => setTemplateName(e.target.value)}
                                className="w-full border rounded px-3 py-2 outline-none focus:border-black"
                                placeholder="Enter template name..."
                                autoFocus
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowTemplateModal(false)}
                                className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveTemplate}
                                disabled={saving || !templateName.trim()}
                                className="px-4 py-2 text-sm bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
                            >
                                {saving && <Loader2 size={14} className="animate-spin" />}
                                Create Template
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="h-14 border-b flex items-center justify-between px-2 md:px-4 bg-white z-10 shrink-0 gap-2 shadow-sm">
                <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
                    <Link href="/app/specials" className="p-2 hover:bg-zinc-100 rounded-full text-zinc-500 shrink-0">
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <input
                            type="text"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            onBlur={handleSave}
                            className="font-bold text-lg md:text-xl text-zinc-900 bg-transparent hover:bg-zinc-50 focus:bg-white border border-transparent focus:border-zinc-200 rounded px-2 py-0.5 outline-none transition-all w-full min-w-0 truncate"
                        />
                        <span className="hidden md:inline-block text-[10px] uppercase font-bold text-zinc-400 bg-zinc-50 px-2 py-1 rounded border border-zinc-100 whitespace-nowrap">
                            {isPortrait ? 'Portrait 1080x1920' : 'Landscape 1920x1080'}
                        </span>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-1 mx-4">
                    <button onClick={handleUndo} disabled={historyStep === 0} title="Undo (Ctrl+Z)" className="p-2 hover:bg-zinc-100 rounded text-zinc-600 disabled:opacity-30">
                        <Undo size={18} />
                    </button>
                    <button onClick={handleRedo} disabled={historyStep === history.length - 1} title="Redo (Ctrl+Shift+Z)" className="p-2 hover:bg-zinc-100 rounded text-zinc-600 disabled:opacity-30">
                        <Redo size={18} />
                    </button>
                    <div className="w-px h-6 bg-zinc-200 mx-1"></div>
                    <button onClick={handleDeleteProject} className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded" title="Delete Project">
                        <Trash2 size={18} />
                    </button>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => setShowTemplateModal(true)}
                        disabled={saving}
                        title="Save as Template"
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase text-zinc-600 bg-white border hover:bg-zinc-50 rounded shadow-sm transition-colors disabled:opacity-50 mr-2"
                    >
                        <Copy size={14} />
                        <span className="hidden md:inline">Save as Template</span>
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase text-zinc-600 bg-white border hover:bg-zinc-50 rounded shadow-sm transition-colors disabled:opacity-50"
                    >
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        <span className="hidden md:inline">Save Draft</span>
                    </button>
                    <button
                        onClick={() => setShowPublishModal(true)}
                        disabled={saving}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase text-white bg-black hover:bg-zinc-800 rounded shadow-sm transition-colors disabled:opacity-50 ml-2"
                    >
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                        <span className="hidden md:inline">Publish to Screens</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar */}
                <div className="w-64 border-r bg-white hidden md:flex flex-col shrink-0 z-10">
                    <div className="p-3 border-b bg-zinc-50/50">
                        <h3 className="font-bold text-xs uppercase tracking-wide text-zinc-500">Layers</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <LayersPanel
                            nodes={nodes}
                            selectedId={selectedId}
                            onSelect={setSelectedId}
                            onDelete={(id) => {
                                pushToHistory(nodes.filter(n => n.id !== id));
                                if (selectedId === id) setSelectedId(null);
                            }}
                            onDuplicate={(id) => {
                                const node = nodes.find(n => n.id === id);
                                if (node) {
                                    const newNode = { ...node, id: uuidv4(), x: node.x + 20, y: node.y + 20 };
                                    pushToHistory([...nodes, newNode]);
                                    setSelectedId(newNode.id);
                                }
                            }}
                            onReorder={() => { }}
                            onMoveLayer={(id, dir) => {
                                const idx = nodes.findIndex(n => n.id === id);
                                if (idx === -1) return;
                                const newNodes = [...nodes];
                                if (dir === 'up' && idx < newNodes.length - 1) {
                                    [newNodes[idx], newNodes[idx + 1]] = [newNodes[idx + 1], newNodes[idx]];
                                } else if (dir === 'down' && idx > 0) {
                                    [newNodes[idx], newNodes[idx - 1]] = [newNodes[idx - 1], newNodes[idx]];
                                }
                                pushToHistory(newNodes);
                            }}
                        />
                    </div>

                    {/* Toolbar */}
                    <div className="p-3 border-t bg-zinc-50 grid grid-cols-4 gap-2">
                        <button onClick={() => {
                            pushToHistory([...nodes, {
                                id: uuidv4(),
                                type: 'text',
                                x: 100, y: 100,
                                text: 'Double click to edit',
                                fontSize: 40,
                                fontFamily: 'Inter',
                                fill: '#000000',
                                width: 300
                            }]);
                        }} className="flex flex-col items-center gap-1 p-2 rounded hover:bg-white hover:shadow-sm transition-all text-zinc-600">
                            <Type size={16} />
                            <span className="text-[9px] font-medium uppercase">Text</span>
                        </button>
                        <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-1 p-2 rounded hover:bg-white hover:shadow-sm transition-all text-zinc-600">
                            <ImageIcon size={16} />
                            <span className="text-[9px] font-medium uppercase">Image</span>
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                        />
                        <button onClick={() => {
                            pushToHistory([...nodes, {
                                id: uuidv4(),
                                type: 'rect',
                                x: 150, y: 150,
                                width: 200, height: 200,
                                fill: '#e4e4e7'
                            }]);
                        }} className="flex flex-col items-center gap-1 p-2 rounded hover:bg-white hover:shadow-sm transition-all text-zinc-600">
                            <Square size={16} />
                            <span className="text-[9px] font-medium uppercase">Box</span>
                        </button>
                        <button onClick={() => {
                            pushToHistory([...nodes, {
                                id: uuidv4(),
                                type: 'circle',
                                x: 250, y: 250,
                                radius: 100,
                                fill: '#e4e4e7'
                            }]);
                        }} className="flex flex-col items-center gap-1 p-2 rounded hover:bg-white hover:shadow-sm transition-all text-zinc-600">
                            <Circle size={16} />
                            <span className="text-[9px] font-medium uppercase">Circle</span>
                        </button>
                    </div>
                </div>

                {/* Center - Canvas */}
                <div className="flex-1 bg-zinc-100 flex flex-col overflow-hidden relative">
                    <div className="absolute top-4 left-0 right-0 flex justify-center z-10 pointer-events-none">
                        <div className="bg-black/5 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2 border border-black/5">
                            <Monitor size={12} className="text-black/40" />
                            <span className="text-[10px] uppercase font-bold text-black/40">Live Screen Preview</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto flex items-center justify-center p-8 md:p-12">
                        {/* Screen Mock Container */}
                        <div className="relative shadow-2xl ring-1 ring-black/5 rounded-[2px] overflow-hidden bg-black">
                            {/* Bezel */}
                            <div className="absolute inset-0 border-[12px] border-zinc-900 pointer-events-none z-20 rounded-[2px]"></div>

                            {/* Editor */}
                            <div className="relative z-10">
                                <Editor
                                    ref={editorRef}
                                    nodes={nodes}
                                    onNodesChange={(newNodes) => {
                                        pushToHistory(newNodes);
                                    }}
                                    selectedId={selectedId}
                                    onSelect={setSelectedId}
                                    preset={project.canvas_preset as any}
                                    backgroundColor={project.design_json?.backgroundColor}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Properties */}
                <div className="w-80 border-l bg-white shrink-0 hidden md:flex flex-col z-10">
                    <div className="p-3 border-b bg-zinc-50/50">
                        <h3 className="font-bold text-xs uppercase tracking-wide text-zinc-500">Properties</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <PropertiesPanel
                            selectedNode={selectedNode}
                            onUpdate={(updates) => {
                                const newNodes = nodes.map(n => n.id === selectedId ? { ...n, ...updates } : n);
                                setNodes(newNodes);
                                pushToHistory(newNodes);
                            }}
                            canvasWidth={presetDimensions.width}
                            canvasHeight={presetDimensions.height}
                        />
                    </div>
                </div>
            </div>

            {/* Mobile Bottom Toolbar */}
            <div className="md:hidden h-16 bg-white border-t flex items-center justify-between px-4 shrink-0 z-20">
                <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
                    <button onClick={() => {
                        pushToHistory([...nodes, {
                            id: uuidv4(),
                            type: 'text',
                            x: 50, y: 50, // Closer to top-left for mobile
                            text: 'Text',
                            fontSize: 40,
                            fontFamily: 'Inter',
                            fill: '#000000',
                            width: 200
                        }]);
                    }} className="flex flex-col items-center gap-1 text-zinc-600">
                        <Type size={20} />
                        <span className="text-[10px]">Text</span>
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-1 text-zinc-600">
                        <ImageIcon size={20} />
                        <span className="text-[10px]">Image</span>
                    </button>
                    <button onClick={() => {
                        pushToHistory([...nodes, {
                            id: uuidv4(),
                            type: 'rect',
                            x: 50, y: 50,
                            width: 150, height: 150,
                            fill: '#e4e4e7'
                        }]);
                    }} className="flex flex-col items-center gap-1 text-zinc-600">
                        <Square size={20} />
                        <span className="text-[10px]">Rect</span>
                    </button>
                    <button onClick={() => {
                        pushToHistory([...nodes, {
                            id: uuidv4(),
                            type: 'circle',
                            x: 100, y: 100,
                            radius: 75,
                            fill: '#e4e4e7'
                        }]);
                    }} className="flex flex-col items-center gap-1 text-zinc-600">
                        <Circle size={20} />
                        <span className="text-[10px]">Circle</span>
                    </button>
                </div>

                <div className="w-px h-8 bg-zinc-200 mx-2"></div>

                <div className="flex items-center gap-1">
                    <button onClick={handleUndo} disabled={historyStep === 0} className="flex flex-col items-center gap-1 text-zinc-600 disabled:opacity-30">
                        <Undo size={18} />
                    </button>
                    <button onClick={handleRedo} disabled={historyStep === history.length - 1} className="flex flex-col items-center gap-1 text-zinc-600 disabled:opacity-30">
                        <Redo size={18} />
                    </button>
                </div>

                <div className="w-px h-8 bg-zinc-200 mx-2"></div>

                <button onClick={() => setShowMobileLayers(true)} className="flex flex-col items-center gap-1 text-zinc-600 relative">
                    <Layers size={20} />
                    <span className="text-[10px]">Layers</span>
                    <span className="absolute -top-1 -right-1 bg-black text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full">
                        {nodes.length}
                    </span>
                </button>
            </div>

            {/* Mobile Properties Floating Button (only if selected) */}
            {selectedId && !showMobileProperties && (
                <button
                    onClick={() => setShowMobileProperties(true)}
                    className="md:hidden absolute bottom-20 right-4 bg-black text-white p-3 rounded-full shadow-lg z-20 flex items-center justify-center"
                >
                    <Settings size={22} />
                </button>
            )}

            {/* Mobile Layers Modal */}
            {showMobileLayers && (
                <div className="fixed inset-0 bg-white z-50 md:hidden flex flex-col">
                    <div className="h-14 border-b flex items-center justify-between px-4 bg-white shrink-0">
                        <h3 className="font-bold">Layers</h3>
                        <button onClick={() => setShowMobileLayers(false)} className="text-sm font-medium">Done</button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                        <LayersPanel
                            nodes={nodes}
                            selectedId={selectedId}
                            onSelect={(id) => { setSelectedId(id); setShowMobileLayers(false); }}
                            onDelete={(id) => {
                                pushToHistory(nodes.filter(n => n.id !== id));
                                if (selectedId === id) setSelectedId(null);
                            }}
                            onDuplicate={(id) => {
                                const node = nodes.find(n => n.id === id);
                                if (node) {
                                    const newNode = { ...node, id: uuidv4(), x: node.x + 20, y: node.y + 20 };
                                    pushToHistory([...nodes, newNode]);
                                    setSelectedId(newNode.id);
                                }
                            }}
                            onReorder={() => { }}
                            onMoveLayer={(id, dir) => {
                                const idx = nodes.findIndex(n => n.id === id);
                                if (idx === -1) return;
                                const newNodes = [...nodes];
                                if (dir === 'up' && idx < newNodes.length - 1) {
                                    [newNodes[idx], newNodes[idx + 1]] = [newNodes[idx + 1], newNodes[idx]];
                                } else if (dir === 'down' && idx > 0) {
                                    [newNodes[idx], newNodes[idx - 1]] = [newNodes[idx - 1], newNodes[idx]];
                                }
                                pushToHistory(newNodes);
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Mobile Properties Modal */}
            {showMobileProperties && selectedNode && (
                <div className="fixed inset-0 bg-white z-50 md:hidden flex flex-col">
                    <div className="h-14 border-b flex items-center justify-between px-4 bg-white shrink-0">
                        <h3 className="font-bold">Properties</h3>
                        <button onClick={() => setShowMobileProperties(false)} className="text-sm font-medium">Done</button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-0">
                        <PropertiesPanel
                            selectedNode={selectedNode}
                            onUpdate={(updates) => {
                                const newNodes = nodes.map(n => n.id === selectedId ? { ...n, ...updates } : n);
                                setNodes(newNodes);
                                pushToHistory(newNodes);
                            }}
                            canvasWidth={presetDimensions.width}
                            canvasHeight={presetDimensions.height}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
