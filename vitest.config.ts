import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
    test: {
        environment: 'node',
        globals: true,
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, '.'),
            // The `server-only` marker throws on import outside a Server
            // Component. Next resolves it to a no-op via the `react-server`
            // export condition; do the same here so tests can import modules
            // that carry the marker (e.g. the HTML menu themes).
            'server-only': path.resolve(__dirname, 'node_modules/server-only/empty.js'),
        },
    },
})
