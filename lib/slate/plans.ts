export type PlanCode =
    | 'static_design'
    | 'video_design_system'
    | 'pro_managed'
    | 'enterprise';

export interface PlanEntitlements {
    max_screens: number;
    video_enabled: boolean;
    specials_studio_enabled: boolean;
    scheduling_enabled: boolean;
    four_k_enabled: boolean;
    design_package_included: boolean;
    managed_design_support: boolean;
}

export interface Entitlements extends PlanEntitlements {
    plan_code: PlanCode;
    status: 'active' | 'past_due' | 'paused' | 'cancelled';
    client_id?: string;
}

export const PLAN_DEFS: Record<PlanCode, PlanEntitlements> = {
    static_design: {
        max_screens: 5,
        video_enabled: false,
        specials_studio_enabled: false,
        scheduling_enabled: true,
        four_k_enabled: false,
        design_package_included: true,
        managed_design_support: false,
    },
    video_design_system: {
        max_screens: 5,
        video_enabled: true,
        specials_studio_enabled: true,
        scheduling_enabled: true,
        four_k_enabled: false,
        design_package_included: true,
        managed_design_support: false,
    },
    pro_managed: {
        max_screens: 9999,
        video_enabled: true,
        specials_studio_enabled: true,
        scheduling_enabled: true,
        four_k_enabled: true,
        design_package_included: true,
        managed_design_support: true,
    },
    enterprise: {
        max_screens: 9999,
        video_enabled: true,
        specials_studio_enabled: true,
        scheduling_enabled: true,
        four_k_enabled: true,
        design_package_included: true,
        managed_design_support: true,
    },
};

// Self-serve plan metadata
export const PLAN_PRICES: Record<PlanCode, string> = {
    static_design: '39',
    video_design_system: '59',
    pro_managed: '89',
    enterprise: 'POA',
};

export const SELF_SERVE_PLANS: PlanCode[] = [
    'static_design',
    'video_design_system',
    'pro_managed',
];

export function getPlanShortName(code: string): string {
    switch (code) {
        case 'static_design': return 'Onesign Static';
        case 'video_design_system': return 'Onesign Video';
        case 'pro_managed': return 'Onesign Pro';
        case 'enterprise': return 'Onesign Enterprise';
        default: return code;
    }
}

export function getPlanDisplayName(code: string): string {
    switch (code) {
        case 'static_design': return 'Onesign Static + Menu Design';
        case 'video_design_system': return 'Onesign Video + Design System';
        case 'pro_managed': return 'Onesign Pro + Managed';
        case 'enterprise': return 'Onesign Enterprise';
        default: return code;
    }
}

export function getPlanIncludedFeatures(entitlements: PlanEntitlements): string[] {
    const features: string[] = [];
    if (entitlements.video_enabled) features.push('Video');
    if (entitlements.specials_studio_enabled) features.push('Specials Studio');
    if (entitlements.scheduling_enabled) features.push('Scheduling');
    if (entitlements.four_k_enabled) features.push('4K');
    if (entitlements.design_package_included) features.push('Design Package');
    if (entitlements.managed_design_support) features.push('Managed Support');
    return features;
}
