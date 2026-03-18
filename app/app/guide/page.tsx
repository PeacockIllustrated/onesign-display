
import { CircleHelp, Calendar, Monitor, Image, Users, LayoutTemplate, Layers, Wifi, Play } from 'lucide-react'

export default function UserGuidePage() {
    return (
        <div className="max-w-4xl mx-auto py-8 space-y-12">
            <div className="space-y-4">
                <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 border-b pb-4">
                    Onesign Display User Guide
                </h1>
                <p className="text-lg text-zinc-600">
                    Welcome to Onesign Display. This platform allows you to manage digital content across your physical screen network with precision.
                </p>
            </div>

            {/* Quick Navigation */}
            <div className="bg-zinc-50 rounded-lg p-6 border border-zinc-200">
                <h2 className="text-lg font-bold mb-4">Quick Links</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 font-medium text-sm">
                    <a href="#concepts" className="text-zinc-600 hover:text-black hover:underline flex items-center gap-2"><Layers size={16} /> Core Concepts</a>
                    <a href="#schedules" className="text-zinc-600 hover:text-black hover:underline flex items-center gap-2"><Calendar size={16} /> Scheduling</a>
                    <a href="#specials" className="text-zinc-600 hover:text-black hover:underline flex items-center gap-2"><LayoutTemplate size={16} /> Specials Studio</a>
                    <a href="#screens" className="text-zinc-600 hover:text-black hover:underline flex items-center gap-2"><Monitor size={16} /> Screens & Players</a>
                    <a href="#media" className="text-zinc-600 hover:text-black hover:underline flex items-center gap-2"><Image size={16} /> Media Library</a>
                    <a href="#clients" className="text-zinc-600 hover:text-black hover:underline flex items-center gap-2"><Users size={16} /> Client Admin</a>
                </div>
            </div>

            {/* Content Sections */}

            <section id="concepts" className="scroll-mt-20 space-y-4">
                <div className="flex items-center gap-3 text-zinc-900">
                    <Layers className="w-8 h-8" />
                    <h2 className="text-2xl font-bold">Core Concepts</h2>
                </div>
                <div className="prose prose-zinc max-w-none text-zinc-600">
                    <p>
                        Understanding the Onesign Display hierarchy is key to managing your network effectively:
                    </p>
                    <ul className="list-disc pl-5 space-y-2 mt-2">
                        <li><strong>Clients:</strong> The top-level tenants using the system. Each client has its own media, stores, and screens.</li>
                        <li><strong>Stores:</strong> Physical locations (e.g., "Downtown Branch"). All screens belong to a store. Timezones are set at the store level.</li>
                        <li><strong>Screen Sets:</strong> Logical groups of screens within a store (e.g., "Menu Boards", "Window Displays"). This helps organize devices.</li>
                        <li><strong>Screens:</strong> The actual physical displays running the Onesign Display Player.</li>
                    </ul>
                </div>
            </section>

            <hr className="border-zinc-200" />

            <section id="schedules" className="scroll-mt-20 space-y-4">
                <div className="flex items-center gap-3 text-zinc-900">
                    <Calendar className="w-8 h-8" />
                    <h2 className="text-2xl font-bold">Scheduling</h2>
                </div>
                <div className="prose prose-zinc max-w-none text-zinc-600">
                    <p>
                        Schedules control <strong>when</strong> content appears. They are created for specific <strong>Stores</strong>.
                    </p>
                    <h3 className="text-lg font-bold text-zinc-900 mt-4">Creating a Schedule</h3>
                    <ul className="list-disc pl-5 space-y-2 mt-2">
                        <li><strong>Time & Validity:</strong> Set a Start and End date/time. You can also define recurring "Day Parts" (e.g., Breakfast from 6 AM - 11 AM) and select specific days of the week.</li>
                        <li><strong>Content Assignment:</strong> Once a schedule is created, you assign media to specific screens within that schedule context.</li>
                        <li><strong>Conflicts:</strong> If multiple schedules overlap, the system uses internal logic to determine priority. Ensure your time slots are distinct to avoid ambiguity.</li>
                    </ul>
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-4">
                        <p className="text-sm text-blue-700">
                            <strong>Tip:</strong> You can assign different content to different screens within the <em>same</em> schedule. For example, during "Lunch", Screen A shows Burgers while Screen B shows Salads.
                        </p>
                    </div>
                </div>
            </section>

            <hr className="border-zinc-200" />

            <section id="specials" className="scroll-mt-20 space-y-4">
                <div className="flex items-center gap-3 text-zinc-900">
                    <LayoutTemplate className="w-8 h-8" />
                    <h2 className="text-2xl font-bold">Specials Studio</h2>
                </div>
                <div className="prose prose-zinc max-w-none text-zinc-600">
                    <p>
                        The specials studio is a powerful built-in editor for creating dynamic signage content without external tools.
                    </p>
                    <ul className="list-disc pl-5 space-y-2 mt-2">
                        <li><strong>Templates:</strong> Start by selecting a designer-made template. We support both <strong>Landscape (16:9)</strong> and <strong>Portrait (9:16)</strong> orientations.</li>
                        <li><strong>Editor:</strong> Customize text, images, and prices directly in the browser.</li>
                        <li><strong>Publishing:</strong> Saving a project creates a media asset that can be immediately scheduled.</li>
                    </ul>
                    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mt-4">
                        <p className="text-sm text-yellow-700">
                            <strong>Note:</strong> The Specials Editor is optimized for <strong>Desktop</strong> use. Mobile functionality is currently in development and may be limited.
                        </p>
                    </div>
                </div>
            </section>

            <hr className="border-zinc-200" />

            <section id="screens" className="scroll-mt-20 space-y-4">
                <div className="flex items-center gap-3 text-zinc-900">
                    <Monitor className="w-8 h-8" />
                    <h2 className="text-2xl font-bold">Screens & Players</h2>
                </div>
                <div className="prose prose-zinc max-w-none text-zinc-600">
                    <p>
                        The <strong>Onesign Player</strong> turns any web-capable device into a digital sign.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        <div className="bg-zinc-50 p-4 rounded-lg">
                            <h4 className="font-bold flex items-center gap-2"><Wifi size={18} /> Pairing & Connectivity</h4>
                            <p className="text-sm mt-2">
                                New devices generate a unique pairing token. Enter this token in the admin portal to link the device to a specific Store and Screen slot.
                            </p>
                        </div>
                        <div className="bg-zinc-50 p-4 rounded-lg">
                            <h4 className="font-bold flex items-center gap-2"><Play size={18} /> Playback Engine</h4>
                            <p className="text-sm mt-2">
                                The player intelligently caches content for offline playback. It polls for updates every minute and performs precise, synchronized refreshes when schedules change.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <hr className="border-zinc-200" />

            <section id="media" className="scroll-mt-20 space-y-4">
                <div className="flex items-center gap-3 text-zinc-900">
                    <Image className="w-8 h-8" />
                    <h2 className="text-2xl font-bold">Media Library</h2>
                </div>
                <div className="prose prose-zinc max-w-none text-zinc-600">
                    <p>
                        A central repository for all your creative assets.
                    </p>
                    <ul className="list-disc pl-5 space-y-2 mt-2">
                        <li><strong>Formats:</strong> Supports high-definition Images (JPG, PNG) and Videos (MP4).</li>
                        <li><strong>Optimization:</strong> Always upload content that matches your screen's resolution (usually 1920x1080 or 1080x1920).</li>
                    </ul>
                </div>
            </section>

            <hr className="border-zinc-200" />

            <section id="clients" className="scroll-mt-20 space-y-4">
                <div className="flex items-center gap-3 text-zinc-900">
                    <Users className="w-8 h-8" />
                    <h2 className="text-2xl font-bold">Client Management</h2>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md text-sm text-yellow-800 mb-4">
                    <strong className="font-semibold block mb-1">Super Admin Feature</strong>
                    Only Super Admins can create and manage client tenants.
                </div>
                <div className="prose prose-zinc max-w-none text-zinc-600">
                    <p>
                        Use this section to onboard new businesses, manage their subscription plans, and configure global settings.
                    </p>
                </div>
            </section>

            <div className="pt-8 border-t border-zinc-200 text-center text-zinc-400 text-sm">
                <p>&copy; {new Date().getFullYear()} Onesign Display. All rights reserved.</p>
            </div>
        </div>
    )
}
