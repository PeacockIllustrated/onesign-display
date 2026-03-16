'use client';

import { useState } from 'react';
import { X, Calendar, Check, Loader2 } from 'lucide-react';

interface DemoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PLAN_OPTIONS = [
    { id: 'static', name: 'Onesign Static', price: '£39', description: 'Single-location cafés' },
    { id: 'video', name: 'Onesign Video', price: '£59', description: 'Daily specials & rotating menus', popular: true },
    { id: 'pro', name: 'Onesign Pro', price: '£89', description: 'QSRs & multi-screen venues' },
    { id: 'enterprise', name: 'Onesign Enterprise', price: 'POA', description: 'Franchise groups' },
];

export function DemoModal({ isOpen, onClose }: DemoModalProps) {
    const [step, setStep] = useState<'form' | 'success'>('form');
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        company: '',
        plan: '',
        screens: '',
        message: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/demo-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setStep('success');
            }
        } catch (error) {
            console.error('Failed to submit demo request:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setStep('form');
        setFormData({ name: '', email: '', company: '', plan: '', screens: '', message: '' });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-neutral-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-neutral-950 rounded-full flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-neutral-950">Book a Demo</h2>
                            <p className="text-sm text-neutral-500">See Onesign Display in action</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
                    >
                        <X className="h-5 w-5 text-neutral-500" />
                    </button>
                </div>

                {step === 'form' ? (
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Contact Info */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Your Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:border-transparent"
                                    placeholder="John Smith"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Email Address *
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:border-transparent"
                                    placeholder="john@restaurant.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Company / Venue Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.company}
                                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                    className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:border-transparent"
                                    placeholder="The Coffee House"
                                />
                            </div>
                        </div>

                        {/* Plan Selection */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-3">
                                Which plan interests you?
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {PLAN_OPTIONS.map((plan) => (
                                    <button
                                        key={plan.id}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, plan: plan.id })}
                                        className={`relative p-4 border rounded-xl text-left transition-all ${formData.plan === plan.id
                                                ? 'border-neutral-950 bg-neutral-50 ring-1 ring-neutral-950'
                                                : 'border-neutral-200 hover:border-neutral-300'
                                            }`}
                                    >
                                        {plan.popular && (
                                            <span className="absolute -top-2 left-3 px-2 py-0.5 bg-neutral-950 text-white text-[10px] font-bold uppercase tracking-wider rounded">
                                                Popular
                                            </span>
                                        )}
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-semibold text-neutral-950 text-sm">{plan.name}</p>
                                                <p className="text-xs text-neutral-500 mt-0.5">{plan.description}</p>
                                            </div>
                                            {formData.plan === plan.id && (
                                                <Check className="h-4 w-4 text-neutral-950 shrink-0" />
                                            )}
                                        </div>
                                        <p className="text-lg font-bold text-neutral-950 mt-2">{plan.price}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Screen Count */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                How many screens do you need?
                            </label>
                            <select
                                value={formData.screens}
                                onChange={(e) => setFormData({ ...formData, screens: e.target.value })}
                                className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:border-transparent"
                            >
                                <option value="">Select...</option>
                                <option value="1-5">1-5 screens</option>
                                <option value="6-10">6-10 screens</option>
                                <option value="11-25">11-25 screens</option>
                                <option value="26-50">26-50 screens</option>
                                <option value="50+">50+ screens</option>
                            </select>
                        </div>

                        {/* Message */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Anything else we should know?
                            </label>
                            <textarea
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                rows={3}
                                className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:border-transparent resize-none"
                                placeholder="Tell us about your venue, current setup, or specific needs..."
                            />
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading || !formData.name || !formData.email}
                            className="w-full bg-neutral-950 text-white py-4 rounded-xl font-semibold hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                'Request Demo'
                            )}
                        </button>
                    </form>
                ) : (
                    <div className="p-8 text-center">
                        <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Check className="h-8 w-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold text-neutral-950 mb-2">Demo Request Sent!</h3>
                        <p className="text-neutral-500 mb-6">
                            Thanks {formData.name.split(' ')[0]}! We'll be in touch within 24 hours to schedule your personalized demo.
                        </p>
                        <button
                            onClick={handleClose}
                            className="px-8 py-3 bg-neutral-950 text-white rounded-xl font-medium hover:bg-neutral-800 transition-colors"
                        >
                            Done
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
