// ============================================================
// ByteLens — Discord "ready" Event
// Fires once when the bot successfully connects to Discord
// Sets up Supabase Realtime subscription for payment updates
// ============================================================

const { Events } = require('discord.js');
const { supabase } = require('../../config/supabase');
const { DISCORD_IDS, COLORS, TX_STATUS } = require('../../config/constants');
const { createLogger } = require('../../utils/logger');
const { EmbedBuilder } = require('discord.js');

const log = createLogger('Ready');

module.exports = {
    name: Events.ClientReady,
    once: true,

    async execute(client) {
        log.success(`Bot online as ${client.user.tag}`);
        log.info(`Serving ${client.guilds.cache.size} guild(s)`);

        // --- Subscribe to Supabase Realtime: transactions table ---
        // Listens for UPDATE events where status changes to 'paid'
        const channel = supabase
            .channel('transactions-paid')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'transactions',
                    filter: `status=eq.${TX_STATUS.PAID}`,
                },
                async (payload) => {
                    await handlePaymentConfirmed(client, payload.new);
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    log.success('Subscribed to Supabase Realtime: transactions table');
                } else {
                    log.warn(`Realtime subscription status: ${status}`);
                }
            });

        // Store reference for cleanup if needed
        client.supabaseChannel = channel;
    },
};

/**
 * Handles a confirmed payment by sending a success embed in the
 * ticket channel and assigning the "Exclusive" role to the user.
 *
 * @param {import('discord.js').Client} client
 * @param {object} transaction - The updated transaction row from Supabase
 */
async function handlePaymentConfirmed(client, transaction) {
    const {
        discord_channel_id,
        discord_user_id,
        discord_guild_id,
        amount,
        description,
        midtrans_order_id,
        payment_type,
    } = transaction;

    log.info(`Payment confirmed: ${midtrans_order_id} — Rp${amount.toLocaleString('id-ID')}`);

    try {
        // --- Send confirmation embed in the ticket channel ---
        const guild = await client.guilds.fetch(discord_guild_id);
        const ticketChannel = await guild.channels.fetch(discord_channel_id);

        if (!ticketChannel) {
            log.error(`Ticket channel ${discord_channel_id} not found — cannot send confirmation`);
            return;
        }

        const confirmEmbed = new EmbedBuilder()
            .setColor(COLORS.SUCCESS)
            .setTitle('✅ Payment Confirmed!')
            .setDescription(
                `Payment for **${description || 'ByteLens Service'}** has been successfully received.`
            )
            .addFields(
                { name: '💰 Amount', value: `Rp ${amount.toLocaleString('id-ID')}`, inline: true },
                { name: '🧾 Order ID', value: `\`${midtrans_order_id}\``, inline: true },
                { name: '💳 Payment Method', value: payment_type || 'N/A', inline: true }
            )
            .setFooter({ text: 'ByteLens — Thank you for your purchase!' })
            .setTimestamp();

        await ticketChannel.send({ embeds: [confirmEmbed] });

        // --- Assign "Exclusive" role to the user ---
        if (DISCORD_IDS.exclusiveRoleId) {
            try {
                const member = await guild.members.fetch(discord_user_id);
                const exclusiveRole = guild.roles.cache.get(DISCORD_IDS.exclusiveRoleId);

                if (exclusiveRole && !member.roles.cache.has(exclusiveRole.id)) {
                    await member.roles.add(exclusiveRole);
                    log.success(`Assigned "Exclusive" role to ${member.user.tag}`);

                    await ticketChannel.send({
                        content: `🎉 <@${discord_user_id}> has been granted the **${exclusiveRole.name}** role!`,
                    });
                }
            } catch (roleError) {
                log.error(`Failed to assign Exclusive role: ${roleError.message}`);
            }
        }
    } catch (error) {
        log.error(`Failed to handle payment confirmation: ${error.message}`);
    }
}
