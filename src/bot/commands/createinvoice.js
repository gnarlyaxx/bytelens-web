// ============================================================
// ByteLens — /createinvoice Slash Command
// Admin-only command to generate a payment invoice in a ticket
// ============================================================

const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits,
    MessageFlags,
} = require('discord.js');
const { DISCORD_IDS, COLORS } = require('../../config/constants');
const { createInvoice } = require('../../services/payment.service');
const { createLogger } = require('../../utils/logger');

const log = createLogger('CreateInvoice');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('createinvoice')
        .setDescription('Create a payment invoice for the client in this ticket (Admin only)')
        .addIntegerOption((option) =>
            option
                .setName('amount')
                .setDescription('Amount in IDR (e.g., 500000)')
                .setRequired(true)
                .setMinValue(1000) // Midtrans minimum
        )
        .addStringOption((option) =>
            option
                .setName('description')
                .setDescription('Payment description (e.g., "DP Wedding Photoshoot")')
                .setRequired(true)
                .setMaxLength(200)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        // --- Admin role check ---
        if (!interaction.member.roles.cache.has(DISCORD_IDS.adminRoleId)) {
            return interaction.reply({
                content: '❌ You need the **Admin** role to use this command.',
                flags: MessageFlags.Ephemeral,
            });
        }

        // --- Check that this is being used inside a ticket channel ---
        const channel = interaction.channel;
        if (channel.parentId !== DISCORD_IDS.ticketCategoryId) {
            return interaction.reply({
                content: '❌ This command can only be used inside a **ticket channel**.',
                flags: MessageFlags.Ephemeral,
            });
        }

        await interaction.deferReply();

        const amount = interaction.options.getInteger('amount');
        const description = interaction.options.getString('description');

        // --- Find the ticket owner (first non-admin, non-bot member with ViewChannel) ---
        const ticketOwner = await findTicketOwner(channel, interaction.guild);

        if (!ticketOwner) {
            return interaction.editReply({
                content: '❌ Could not identify the ticket owner. Make sure the client has access to this channel.',
            });
        }

        // --- Create the invoice via payment service ---
        const result = await createInvoice({
            discordUserId: ticketOwner.id,
            discordChannelId: channel.id,
            discordGuildId: interaction.guild.id,
            amount: amount,
            description: description,
            buyerName: ticketOwner.displayName || ticketOwner.username,
        });

        if (!result.success) {
            return interaction.editReply({
                content: `❌ Failed to create invoice: ${result.error}`,
            });
        }

        // --- Send payment embed ---
        const paymentEmbed = new EmbedBuilder()
            .setColor(COLORS.WARNING)
            .setTitle('💳 Payment Invoice')
            .setDescription(
                `<@${ticketOwner.id}>, a payment invoice has been created for you.\n\n` +
                `Click the link below to complete your payment:`
            )
            .addFields(
                { name: '📝 Description', value: description, inline: false },
                { name: '💰 Amount', value: `**Rp ${amount.toLocaleString('id-ID')}**`, inline: true },
                { name: '🧾 Order ID', value: `\`${result.orderId}\``, inline: true },
                {
                    name: '🔗 Payment Link',
                    value: `**[Click here to pay](${result.paymentUrl})**`,
                    inline: false,
                }
            )
            .setFooter({ text: 'This link is valid for 24 hours • ByteLens' })
            .setTimestamp();

        await interaction.editReply({
            content: `<@${ticketOwner.id}>`,
            embeds: [paymentEmbed],
        });

        log.success(
            `Invoice created by ${interaction.user.tag}: ${result.orderId} — Rp${amount.toLocaleString('id-ID')} for ${ticketOwner.user.tag}`
        );
    },
};

/**
 * Finds the ticket owner by looking at channel permission overwrites.
 * The ticket owner is the non-admin, non-bot user with explicit ViewChannel permission.
 *
 * @param {import('discord.js').TextChannel} channel
 * @param {import('discord.js').Guild} guild
 * @returns {Promise<import('discord.js').GuildMember|null>}
 */
async function findTicketOwner(channel, guild) {
    const overwrites = channel.permissionOverwrites.cache;

    for (const [id, overwrite] of overwrites) {
        // Skip @everyone (guild.id) and role overwrites
        if (id === guild.id) continue;
        if (overwrite.type !== 1) continue; // 1 = member overwrite

        // Check if this member has ViewChannel allowed
        if (overwrite.allow.has(PermissionFlagsBits.ViewChannel)) {
            try {
                const member = await guild.members.fetch(id);

                // Skip bots and admins
                if (member.user.bot) continue;
                if (member.roles.cache.has(DISCORD_IDS.adminRoleId)) continue;

                return member;
            } catch {
                continue;
            }
        }
    }

    return null;
}
