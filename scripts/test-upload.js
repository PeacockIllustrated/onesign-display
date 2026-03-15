const fs = require('fs');
const path = require('path');

async function upload() {
    const formData = new FormData();
    formData.append('clientId', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

    // Create a dummy file blob
    const fileContent = 'This is a test file content';
    const blob = new Blob([fileContent], { type: 'text/plain' });
    formData.append('files', blob, 'test_script_upload.txt');

    try {
        console.log('Sending request to http://localhost:3000/api/upload/ingest...');
        const res = await fetch('http://localhost:3000/api/upload/ingest', {
            method: 'POST',
            body: formData
        });

        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Response:', text);
    } catch (err) {
        console.error('Fetch failed:', err);
    }
}

upload();
