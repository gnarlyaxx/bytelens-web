// ============================================================
// ByteLens — /setup-perks Slash Command
// Posts the membership verification embed with button
// Admin-only — run once in the bytelens-perks channel
// ============================================================

const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits,
    MessageFlags,
} = require('discord.js');
const { BUTTON_IDS, COLORS, DISCORD_IDS } = require('../../config/constants');
const { createLogger } = require('../../utils/logger');

const log = createLogger('SetupPerks');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-perks')
        .setDescription('Posts the membership verification embed with button (Admin only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        // --- Admin role check ---
        if (!interaction.member.roles.cache.has(DISCORD_IDS.adminRoleId)) {
            return interaction.reply({
                content: '❌ You need the **Admin** role to use this command.',
                flags: MessageFlags.Ephemeral,
            });
        }

        // --- Build the perks embed ---
        const perksEmbed = new EmbedBuilder()
            .setColor(COLORS.PRIORITY)
            .setTitle('⭐ ByteLens — Exclusive Membership')
            .setDescription(
                '### Are you a returning customer?\n\n' +
                'If you\'ve previously purchased our services, you may be eligible for **Exclusive Member** perks:\n\n' +
                '🎯 **Priority Tickets** — Your requests get handled first\n' +
                '💎 **Exclusive Role** — Stand out in the community\n' +
                '🏷️ **Special Discounts** — On future services\n\n' +
                'Click the button below and our team will verify your transaction history.\n\n' +
                '─────────────────────────────'
            )
            .setFooter({ text: 'ByteLens — Loyalty Rewarded' })
            .setTimestamp();

        // --- Build button ---
        const buttonRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(BUTTON_IDS.CHECK_MEMBERSHIP)
                .setLabel('🔍 Verify My Membership')
                .setStyle(ButtonStyle.Success)
        );

        // --- Send the persistent message ---
        await interaction.channel.send({
            embeds: [perksEmbed],
            components: [buttonRow],
        });

        await interaction.reply({
            content: '✅ Membership verification embed posted successfully!',
            flags: MessageFlags.Ephemeral,
        });

        log.success(`Perks embed posted in #${interaction.channel.name} by ${interaction.user.tag}`);
    },
};
