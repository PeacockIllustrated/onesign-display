const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = fs.readFileSync(envPath, 'utf8');
const envLines = envConfig.split('\n');
const env = {};
envLines.forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

console.log('URL:', env.NEXT_PUBLIC_SUPABASE_URL);
// console.log('Key:', env.SUPABASE_SERVICE_ROLE_KEY); // Don't log key

if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    console.log('--- Checking Buckets ---');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) console.error('Bucket Error:', bucketError);
    else console.log('Buckets:', buckets ? buckets.map(b => b.name) : 'None');

    console.log('\n--- Checking Media Assets (DB) ---');
    const { data: assets, error: dbError } = await supabase
        .from('media_assets')
        .select('*')
        .limit(5)
        .order('created_at', { ascending: false });

    if (dbError) console.error('DB Error:', dbError);
    else {
        console.log(`Found ${assets.length} assets.`);
        assets.forEach(a => console.log(`- [${a.created_at}] ${a.filename} (Path: ${a.storage_path})`));
    }

    if (assets && assets.length > 0) {
        console.log('\n--- Checking File Existence in Storage ---');
        // Check the first asset's folder
        const firstAsset = assets[0];
        const folder = firstAsset.storage_path.split('/')[0]; // clientId
        console.log(`Listing files in 'onesign-display' folder: ${folder}`);

        const { data: files, error: fileError } = await supabase.storage.from('onesign-display').list(folder);
        if (fileError) console.error('Storage List Error:', fileError);
        else {
            console.log(`Files in ${folder}:`, files ? files.map(f => f.name) : 'None');
        }
    }
}

check();
