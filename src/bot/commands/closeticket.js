// ============================================================
// ByteLens — /closeticket Slash Command
// Admin-only command to archive and delete a ticket channel
// ============================================================

const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits,
    MessageFlags,
} = require('discord.js');
const { DISCORD_IDS, COLORS } = require('../../config/constants');
const { createLogger } = require('../../utils/logger');

const log = createLogger('CloseTicket');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('closeticket')
        .setDescription('Close and delete this ticket channel (Admin only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        // --- Admin role check ---
        if (!interaction.member.roles.cache.has(DISCORD_IDS.adminRoleId)) {
            return interaction.reply({
                content: '❌ You need the **Admin** role to use this command.',
                flags: MessageFlags.Ephemeral,
            });
        }

        // --- Check that this is a ticket channel ---
        const channel = interaction.channel;
        if (channel.parentId !== DISCORD_IDS.ticketCategoryId) {
            return interaction.reply({
                content: '❌ This command can only be used inside a **ticket channel**.',
                flags: MessageFlags.Ephemeral,
            });
        }

        // --- Send closing notice ---
        const closingEmbed = new EmbedBuilder()
            .setColor(COLORS.ERROR)
            .setTitle('🔒 Ticket Closing')
            .setDescription(
                `This ticket is being closed by <@${interaction.user.id}>.\n\n` +
                'This channel will be deleted in **5 seconds**.'
            )
            .setFooter({ text: 'ByteLens — Thank you for choosing our services!' })
            .setTimestamp();

        await interaction.reply({ embeds: [closingEmbed] });

        log.info(`Ticket #${channel.name} closing by ${interaction.user.tag}`);

        // --- Delay then delete ---
        setTimeout(async () => {
            try {
                await channel.delete(`Ticket closed by ${interaction.user.tag}`);
                log.success(`Ticket #${channel.name} deleted`);
            } catch (error) {
                log.error(`Failed to delete ticket channel: ${error.message}`);
            }
        }, 5000);
    },
};
