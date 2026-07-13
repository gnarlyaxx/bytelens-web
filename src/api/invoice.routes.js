// ============================================================
// ByteLens — Invoice API Route
// POST /api/discord/create-invoice
// Internal API called by the Discord bot's /createinvoice command
// ============================================================

const express = require('express');
const router = express.Router();
const { createInvoice } = require('../services/payment.service');
const { createLogger } = require('../utils/logger');

const log = createLogger('InvoiceAPI');

/**
 * Creates a Midtrans invoice and records it in Supabase.
 *
 * This endpoint is designed for internal use by the Discord bot,
 * not for public-facing clients. In the current architecture the
 * bot calls payment.service directly, but this route exists as an
 * HTTP alternative if the bot and Express run as separate processes.
 *
 * Body: { discordUserId, discordChannelId, discordGuildId, amount, description, serviceType, buyerName }
 */
router.post('/discord/create-invoice', async (req, res) => {
    try {
        const {
            discordUserId,
            discordChannelId,
            discordGuildId,
            amount,
            description,
            serviceType,
            buyerName,
        } = req.body;

        // --- Validate required fields ---
        if (!discordUserId || !discordChannelId || !discordGuildId || !amount) {
            return res.status(400).json({
                error: 'Missing required fields: discordUserId, discordChannelId, discordGuildId, amount',
            });
        }

        if (typeof amount !== 'number' || amount < 1000) {
            return res.status(400).json({
                error: 'Amount must be a number >= 1000 (Midtrans minimum)',
            });
        }

        const result = await createInvoice({
            discordUserId,
            discordChannelId,
            discordGuildId,
            amount,
            description: description || 'ByteLens Service',
            serviceType,
            buyerName,
        });

        if (!result.success) {
            log.error(`Invoice creation failed: ${result.error}`);
            return res.status(500).json({ error: result.error });
        }

        log.success(`Invoice created via API: ${result.orderId}`);

        res.status(201).json({
            orderId: result.orderId,
            paymentUrl: result.paymentUrl,
        });
    } catch (error) {
        log.error(`Invoice API error: ${error.message}`);
        res.status(500).json({ error: 'Failed to create invoice' });
    }
});

/**
 * Creates a Midtrans Snap transaction for the Frontend Website.
 * This restores the original website payment flow.
 */
router.post('/create-transaction', async (req, res) => {
    try {
        const { orderId, amount, photoTitle, buyerEmail, buyerName } = req.body;

        if (!orderId || !amount || !photoTitle) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const parameter = {
            transaction_details: {
                order_id: orderId,
                gross_amount: amount,
            },
            item_details: [
                {
                    id: orderId,
                    price: amount,
                    quantity: 1,
                    name: photoTitle.substring(0, 50),
                },
            ],
            customer_details: {
                email: buyerEmail || 'buyer@bytelens.com',
                first_name: buyerName || 'ByteLens User',
            },
            callbacks: {
                finish: '/',
            },
        };

        const { snap } = require('../config/midtrans');
        const transaction = await snap.createTransaction(parameter);

        res.json({
            token: transaction.token,
            redirect_url: transaction.redirect_url,
        });
    } catch (error) {
        log.error(`Web Transaction error: ${error.message}`);
        res.status(500).json({ error: 'Failed to create transaction' });
    }
});

module.exports = router;
