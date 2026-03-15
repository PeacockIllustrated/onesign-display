import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role for public submissions
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, email, company, plan, screens, message } = body;

        // Validate required fields
        if (!name || !email) {
            return NextResponse.json(
                { error: 'Name and email are required' },
                { status: 400 }
            );
        }

        // Insert prospect into database
        const { data, error } = await supabase
            .from('prospects')
            .insert({
                name,
                email,
                company: company || null,
                plan: plan || null,
                screens: screens || null,
                message: message || null,
                status: 'new',
            })
            .select()
            .single();

        if (error) {
            console.error('Failed to save prospect:', error);
            return NextResponse.json(
                { error: 'Failed to save demo request' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, id: data.id });
    } catch (error) {
        console.error('Demo request error:', error);
        return NextResponse.json(
            { error: 'Failed to process demo request' },
            { status: 500 }
        );
    }
}
