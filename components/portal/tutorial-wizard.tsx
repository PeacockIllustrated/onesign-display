'use client'

/**
 * TUTORIAL WIZARD — Interactive walkthrough for Onesign Display
 *
 * NOTE TO FUTURE DEVELOPERS / CLAUDE:
 * When adding new features to the app, update the TUTORIAL_STEPS array
 * below to include a step explaining the new feature. Each step needs:
 *   - title: short heading
 *   - icon: Lucide icon component
 *   - content: 2-3 sentence explanation
 *   - tip: (optional) a practical tip
 *
 * Keep steps in logical workflow order:
 * Overview → Stores → Screens → Media → Playlists → Schedules → Specials → (new features here)
 */

import { useState } from 'react'
import {
    Home, Store, Monitor, Image, ListVideo, Calendar, LayoutTemplate,
    Layers, Play, Wifi, Upload, Clock, X, ChevronLeft, ChevronRight,
    Sparkles
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface TutorialStep {
    title: string
    icon: LucideIcon
    content: string
    tip?: string
}

const TUTORIAL_STEPS: TutorialStep[] = [
    {
        title: 'Welcome to Onesign Display',
        icon: Sparkles,
        content: 'Onesign Display streams your menus to every screen in your business. Upload content, schedule dayparts, and manage every location from one dashboard.',
        tip: 'This tutorial covers every feature. Use the arrows to navigate or press Escape to close.',
    },
    {
        title: 'Dashboard Overview',
        icon: Home,
        content: 'Your dashboard shows all your stores at a glance. Each store card shows how many screen sets and screens are inside. Click any store to manage it.',
        tip: 'Super Admins see all clients here. Client Admins see only their own stores.',
    },
    {
        title: 'Stores & Locations',
        icon: Store,
        content: 'A Store represents a physical location — your restaurant, cafe, or venue. Each store has its own timezone so schedules transition at the right local time.',
        tip: 'Create separate stores for each branch so you can manage content independently.',
    },
    {
        title: 'Screen Sets',
        icon: Layers,
        content: 'Screen Sets group your displays within a store. For example, "Front Counter Boards" and "Drive Through Screens" could be separate sets — letting you assign different content to each group.',
    },
    {
        title: 'Screens & Players',
        icon: Monitor,
        content: 'Each screen represents a physical display running the Onesign Player. When you add a screen, it generates a unique token. Open the player URL on your TV or PC and tap to start streaming.',
        tip: 'The player works on any device with a web browser — Smart TVs, Fire Sticks, PCs, Android boxes.',
    },
    {
        title: 'Pairing a Screen',
        icon: Wifi,
        content: 'To pair a screen: create it in the dashboard, copy the player URL, open it on your display device, and tap the screen to initialize. The player will go fullscreen and start streaming immediately.',
        tip: 'Screens show a green dot when online. If a screen goes offline, it keeps playing its last content.',
    },
    {
        title: 'Media Library',
        icon: Image,
        content: 'Upload your menu images and videos here. Supported formats: JPG, PNG for images and MP4 for video. For best results, upload at your screen\'s native resolution (usually 1920x1080 or 1080x1920).',
        tip: 'Once uploaded, media can be assigned to any screen or used in playlists and schedules.',
    },
    {
        title: 'Uploading Content',
        icon: Upload,
        content: 'Drag and drop files or click to browse. The system processes your upload and makes it available across all your stores and screens instantly.',
    },
    {
        title: 'Playlists',
        icon: ListVideo,
        content: 'Playlists let you rotate multiple pieces of content on a single screen. Add images and videos, set duration per slide, and choose transition effects (fade, cut, or slide).',
        tip: 'Video slides play to completion, then auto-advance. Image slides use the duration you set.',
    },
    {
        title: 'Scheduling',
        icon: Calendar,
        content: 'Schedules control when content appears. Set up dayparts like "Breakfast 6am-11am" and "Lunch 11am-3pm" — each with different menus. Onesign handles transitions automatically.',
        tip: 'Schedules are timezone-aware. Each store uses its own local time, so a "Lunch" schedule at 12pm works correctly across time zones.',
    },
    {
        title: 'Daypart Scheduling',
        icon: Clock,
        content: 'Assign different content to different times of day. Select which days of the week each schedule runs. The player checks for schedule changes every 30 seconds and transitions precisely.',
        tip: 'If no schedule is active, screens fall back to their default assigned content.',
    },
    {
        title: 'Specials Studio',
        icon: LayoutTemplate,
        content: 'Create eye-catching daily specials in seconds. Pick a designer-made template, customize the text and prices, and publish — it\'s immediately available as a media asset you can schedule.',
        tip: 'The Specials Editor works best on desktop. Templates are available in both landscape and portrait orientations.',
    },
    {
        title: 'Content Fit Mode',
        icon: Monitor,
        content: 'Each screen has a "Content Fit" setting. Contain fits the content within the screen (may show black bars). Cover fills the entire screen (may crop edges). Aspect ratio is always preserved.',
    },
    {
        title: 'Player Features',
        icon: Play,
        content: 'The Onesign Player is built for reliability. It auto-refreshes when content changes, caches content for offline playback, keeps screens awake, and hides the cursor during playback.',
        tip: 'If WiFi drops, screens keep playing their last known content until connectivity is restored.',
    },
    {
        title: 'You\'re ready!',
        icon: Sparkles,
        content: 'That covers everything you need to know. Start by uploading a menu image, assigning it to a screen, and watching it go live. You can reopen this tutorial anytime from the sidebar.',
    },
]

export function TutorialWizard({ onClose, onRunSetup }: { onClose: () => void; onRunSetup?: () => void }) {
    const [currentStep, setCurrentStep] = useState(0)
    const step = TUTORIAL_STEPS[currentStep]
    const Icon = step.icon
    const isFirst = currentStep === 0
    const isLast = currentStep === TUTORIAL_STEPS.length - 1
    const progress = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') onClose()
        if (e.key === 'ArrowRight' && !isLast) setCurrentStep(s => s + 1)
        if (e.key === 'ArrowLeft' && !isFirst) setCurrentStep(s => s - 1)
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onKeyDown={handleKeyDown}
            tabIndex={0}
        >
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
                {/* Progress bar */}
                <div className="h-1 bg-zinc-100">
                    <div
                        className="h-1 bg-black transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Close button */}
                <div className="flex justify-between items-center px-6 pt-4">
                    <span className="text-xs text-zinc-400 font-medium">
                        {currentStep + 1} of {TUTORIAL_STEPS.length}
                    </span>
                    <button
                        onClick={onClose}
                        className="p-1 text-zinc-400 hover:text-zinc-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-8 py-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center shrink-0">
                            <Icon className="w-5 h-5 text-zinc-700" />
                        </div>
                        <h2 className="text-lg font-bold text-zinc-900">{step.title}</h2>
                    </div>

                    <p className="text-sm text-zinc-600 leading-relaxed">
                        {step.content}
                    </p>

                    {step.tip && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                            <p className="text-xs text-amber-800">
                                <span className="font-semibold">Tip: </span>
                                {step.tip}
                            </p>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between px-8 pb-6">
                    <button
                        onClick={() => setCurrentStep(s => s - 1)}
                        disabled={isFirst}
                        className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back
                    </button>

                    {isLast ? (
                        <div className="flex items-center gap-2">
                            {onRunSetup && (
                                <button
                                    onClick={() => { onClose(); onRunSetup() }}
                                    className="px-4 py-2 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors"
                                >
                                    Run setup wizard
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="px-5 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 transition-colors"
                            >
                                Get started
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setCurrentStep(s => s + 1)}
                            className="flex items-center gap-1 px-5 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 transition-colors"
                        >
                            Next
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
