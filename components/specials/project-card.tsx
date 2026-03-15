'use client';

import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { deleteSpecialsProject } from '@/app/app/specials/actions';
import { useRouter } from 'next/navigation';

interface ProjectCardProps {
    project: any;
}

export function ProjectCard({ project }: ProjectCardProps) {
    const router = useRouter();

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!confirm('Are you sure you want to delete this special?')) return;

        try {
            await deleteSpecialsProject(project.id);
            router.refresh();
        } catch (error) {
            console.error('Failed to delete:', error);
            alert('Failed to delete project');
        }
    };

    const lastPublished = project.last_published_media_asset_id && project.updated_at ? new Date(project.updated_at) : null;
    const isPortrait = project.canvas_preset.includes('portrait');

    return (
        <Link href={`/app/specials/${project.id}`} className="block group relative">
            <div className="border rounded-lg overflow-hidden bg-white hover:shadow-lg transition-all hover:border-zinc-300">
                <div className="aspect-video bg-gray-100 flex items-center justify-center relative overflow-hidden">
                    {/* Orienttion Badge */}
                    <div className="absolute top-2 left-2 z-10 bg-black/60 backdrop-blur-md text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                        {isPortrait ? 'Portrait' : 'Landscape'}
                    </div>

                    {project.thumbnail_url ? (
                        <img
                            src={project.thumbnail_url}
                            alt={project.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="flex flex-col items-center gap-2 text-zinc-400">
                            <div className="w-10 h-10 rounded-sm bg-white shadow-sm flex items-center justify-center">
                                <div className={`bg-zinc-100 ${isPortrait ? 'w-4 h-6' : 'w-6 h-4'}`} />
                            </div>
                            <span className="text-xs font-medium">No Preview</span>
                        </div>
                    )}

                    {project.last_published_media_asset_id && (
                        <div className="absolute bottom-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm z-10 uppercase tracking-wide flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            Live
                        </div>
                    )}
                </div>
                <div className="p-4">
                    <div className="flex justify-between items-start">
                        <div className="overflow-hidden">
                            <h3 className="font-bold text-zinc-900 group-hover:text-black truncate">{project.name}</h3>
                            <div className="flex flex-col gap-0.5 mt-1">
                                <p className="text-[10px] text-zinc-500 uppercase tracking-wide font-medium">
                                    {project.canvas_preset.replace('_', ' ')}
                                </p>
                                {lastPublished ? (
                                    <p className="text-xs text-zinc-400 mt-1">
                                        Last published: {lastPublished.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                ) : (
                                    <p className="text-xs text-zinc-400 mt-1 italic">Draft - Never published</p>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={handleDelete}
                            className="text-zinc-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </Link>
    );
}
