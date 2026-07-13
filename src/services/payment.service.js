// ============================================================
// ByteLens — Payment Service
// Creates Midtrans transactions and records them in Supabase
// ============================================================

const { snap } = require('../config/midtrans');
const { supabase } = require('../config/supabase');
const { TX_STATUS } = require('../config/constants');
const { createLogger } = require('../utils/logger');
const crypto = require('crypto');

const log = createLogger('Payment');

/**
 * Generates a unique, collision-resistant order ID.
 * Format: BL-<timestamp>-<random4hex>
 * @returns {string}
 */
function generateOrderId() {
    const timestamp = Date.now();
    const random = crypto.randomBytes(2).toString('hex').toUpperCase();
    return `BL-${timestamp}-${random}`;
}

/**
 * Creates a Midtrans Snap transaction and records it in the Supabase
 * transactions table with status 'pending'.
 *
 * @param {object} params
 * @param {string} params.discordUserId - Discord user snowflake ID
 * @param {string} params.discordChannelId - Ticket channel ID
 * @param {string} params.discordGuildId - Guild/server ID
 * @param {number} params.amount - Amount in IDR
 * @param {string} params.description - Service description
 * @param {string} [params.serviceType] - e.g., 'photography', 'videography', 'digital_asset'
 * @param {string} [params.buyerName] - Discord username
 * @returns {Promise<{success: boolean, paymentUrl?: string, orderId?: string, error?: string}>}
 */
async function createInvoice({
    discordUserId,
    discordChannelId,
    discordGuildId,
    amount,
    description,
    serviceType,
    buyerName,
}) {
    const orderId = generateOrderId();

    try {
        // --- Step 1: Create Midtrans Snap transaction ---
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
                    name: (description || 'ByteLens Service').substring(0, 50),
                },
            ],
            customer_details: {
                first_name: buyerName || 'ByteLens Client',
                // No email required for Discord-based flow
            },
            callbacks: {
                finish: process.env.MIDTRANS_FINISH_REDIRECT || '/',
            },
        };

        const transaction = await snap.createTransaction(parameter);

        log.info(`Midtrans transaction created: ${orderId} — Rp${amount.toLocaleString('id-ID')}`);

        // --- Step 2: Save to Supabase ---
        const { data, error } = await supabase.from('transactions').insert({
            discord_user_id: discordUserId,
            discord_channel_id: discordChannelId,
            discord_guild_id: discordGuildId,
            midtrans_order_id: orderId,
            amount: amount,
            description: description,
            service_type: serviceType || null,
            status: TX_STATUS.PENDING,
            payment_url: transaction.redirect_url,
        }).select().single();

        if (error) {
            log.error(`Supabase insert failed: ${error.message}`);
            return { success: false, error: `Database error: ${error.message}` };
        }

        log.success(`Transaction saved to Supabase: ${orderId} (ID: ${data.id})`);

        return {
            success: true,
            paymentUrl: transaction.redirect_url,
            orderId: orderId,
        };
    } catch (error) {
        log.error(`Failed to create invoice: ${error.message}`);
        return { success: false, error: error.message };
    }
}

module.exports = { createInvoice, generateOrderId };
