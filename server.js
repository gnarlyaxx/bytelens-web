// ============================================================
// ByteLens — Main Entry Point
// Boots Express.js API server + Discord Bot in a single process
// ============================================================

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const { MIDTRANS_CLIENT_KEY } = require('./src/config/midtrans');
const apiRoutes = require('./src/api');
const { startBot } = require('./src/bot');
const { createLogger } = require('./src/utils/logger');

const log = createLogger('Server');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Serve static files (HTML, CSS, JS, assets) for the frontend
app.use(express.static(path.join(__dirname)));

// ── API Routes ─────────────────────────────────────────────
// Existing frontend endpoint
app.get('/api/midtrans-client-key', (req, res) => {
    res.json({ clientKey: MIDTRANS_CLIENT_KEY });
});

// Ping endpoint for UptimeRobot to keep Render and Supabase alive
app.get('/api/ping', async (req, res) => {
    try {
        const { supabase } = require('./src/config/supabase');
        // Simple query to keep the database awake
        await supabase.from('transactions').select('id').limit(1);
        res.status(200).send('Pong! Server and Database are alive.');
    } catch (e) {
        res.status(500).send('Database error');
    }
});

// Mount all backend API routes under /api
app.use('/api', apiRoutes);

// ── Start Everything ───────────────────────────────────────
async function main() {
    // 1. Start Express server
    app.listen(PORT, () => {
        log.success(`Express server running at http://localhost:${PORT}`);
        log.info(
            `Midtrans mode: ${process.env.MIDTRANS_IS_PRODUCTION === 'true' ? 'PRODUCTION' : 'SANDBOX'}`
        );
    });

    // 2. Start Discord bot
    const botClient = await startBot();
    if (botClient) {
        log.success('Discord bot started successfully');
    } else {
        log.warn(
            'Discord bot did not start — check DISCORD_BOT_TOKEN in .env. Express API is still running.'
        );
    }
}

main().catch((error) => {
    log.error('Fatal startup error:', error);
    process.exit(1);
});
