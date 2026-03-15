'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { SpecialsProject } from '@/components/specials/types';

export async function getSpecialsProjects(clientId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('display_specials_projects')
        .select('*')
        .eq('client_id', clientId)
        .order('updated_at', { ascending: false });

    if (error) {
        console.error('Error fetching specials:', error);
        return [];
    }

    return data as SpecialsProject[];
}

export async function getSpecialsProject(id: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('display_specials_projects')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching project:', error);
        return null;
    }
    return data as SpecialsProject;
}

export async function createSpecialsProject(clientId: string, name: string, preset: string, designJson: any) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('display_specials_projects')
        .insert({
            client_id: clientId,
            name,
            canvas_preset: preset,
            design_json: designJson
        })
        .select('id')
        .single();

    if (error) {
        console.error('CREATE PROJECT ERROR:', error);
        console.error('Payload:', { clientId, name, preset });
        throw new Error(`Failed to create project: ${error.message}`);
    }

    revalidatePath('/app/specials');
    return data.id;
}

export async function updateSpecialsProject(id: string, updates: { name?: string, design_json?: any, thumbnail_url?: string }) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('display_specials_projects')
        .update({
            ...updates,
            updated_at: new Date().toISOString()
        })
        .eq('id', id);

    if (error) {
        throw new Error(`Failed to update project: ${error.message}`);
    }

    revalidatePath(`/app/specials/${id}`);
}

export async function deleteSpecialsProject(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('display_specials_projects')
        .delete()
        .eq('id', id);

    if (error) throw error;
    revalidatePath('/app/specials');
}

export async function publishSpecialThumbnail(formData: FormData) {
    const file = formData.get('file') as File;
    const clientId = formData.get('clientId') as string;
    const filename = formData.get('filename') as string;
    const duration = parseInt(formData.get('duration') as string || '10');

    if (!file || !clientId || !filename) {
        throw new Error('Missing file, clientId, or filename');
    }

    // Use Admin Client to bypass RLS for storage and DB insert
    const supabase = await createAdminClient();
    const storagePath = `${clientId}/specials/${filename}`;

    // Upload to Storage (Admin)
    const { error: uploadError } = await supabase.storage
        .from('onesign-display')
        .upload(storagePath, file, {
            contentType: 'image/png',
            upsert: true
        });

    if (uploadError) {
        console.error('Storage Upload Error:', uploadError);
        throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // Insert into Media Assets (Admin)
    const { data, error: dbError } = await supabase
        .from('display_media_assets')
        .insert({
            client_id: clientId,
            filename: filename,
            storage_path: storagePath,
            mime: 'image/png',
            bytes: file.size,
            duration: duration
        })
        .select()
        .single();

    if (dbError) {
        console.error('DB Insert Error:', dbError);
        throw new Error(`DB Insert failed: ${dbError.message}`);
    }

    revalidatePath('/app/media');
    return { success: true, data };
}

export async function getTemplates(clientId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('display_specials_templates')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching templates:', error);
        return [];
    }
    return data;
}

export async function createTemplate(clientId: string, name: string, preset: string, designJson: any, thumbnailUrl?: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('display_specials_templates')
        .insert({
            client_id: clientId,
            name,
            canvas_preset: preset,
            design_json: designJson,
            thumbnail_url: thumbnailUrl
        })
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to create template: ${error.message}`);
    }

    revalidatePath('/app/specials/new');
    return data;
}

