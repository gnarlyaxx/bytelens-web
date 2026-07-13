// ============================================================
// ByteLens — Discord "interactionCreate" Event
// Routes slash commands and button interactions to handlers
// ============================================================

const { Events, MessageFlags } = require('discord.js');
const { BUTTON_IDS, DISCORD_IDS } = require('../../config/constants');
const { createTicketChannel, createMembershipCheckTicket } = require('../../services/ticket.service');
const { createLogger } = require('../../utils/logger');

const log = createLogger('Interaction');

// Storefront ticket button IDs (excludes membership check)
const TICKET_BUTTON_IDS = new Set([
    BUTTON_IDS.TICKET_PHOTOGRAPHY,
    BUTTON_IDS.TICKET_VIDEOGRAPHY,
    BUTTON_IDS.TICKET_DIGITAL,
]);

module.exports = {
    name: Events.InteractionCreate,
    once: false,

    async execute(interaction) {
        // --- Handle Slash Commands ---
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                log.warn(`Unknown command: /${interaction.commandName}`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                log.error(`Error executing /${interaction.commandName}:`, error.message);

                const reply = {
                    content: '❌ An error occurred while executing this command.',
                    flags: MessageFlags.Ephemeral,
                };

                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(reply);
                } else {
                    await interaction.reply(reply);
                }
            }

            return;
        }

        // --- Handle Button Interactions ---
        if (interaction.isButton()) {
            // Storefront ticket buttons (Photography, Videography, Digital Assets)
            if (TICKET_BUTTON_IDS.has(interaction.customId)) {
                try {
                    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

                    const result = await createTicketChannel(interaction);

                    if (result.success) {
                        await interaction.editReply({
                            content: `✅ Your ticket has been created! Head over to <#${result.channelId}>`,
                        });
                    } else {
                        await interaction.editReply({
                            content: `⚠️ ${result.message}`,
                        });
                    }
                } catch (error) {
                    log.error(`Error handling button ${interaction.customId}:`, error.message);

                    await interaction.editReply({
                        content: '❌ Failed to create ticket. Please try again or contact an admin.',
                    });
                }

                return;
            }

            // Membership Verification button (bytelens-perks channel)
            if (interaction.customId === BUTTON_IDS.CHECK_MEMBERSHIP) {
                try {
                    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

                    const result = await createMembershipCheckTicket(interaction);

                    if (result.success) {
                        await interaction.editReply({
                            content: `✅ Your verification ticket has been created! Head over to <#${result.channelId}>`,
                        });
                    } else {
                        await interaction.editReply({
                            content: `⚠️ ${result.message}`,
                        });
                    }
                } catch (error) {
                    log.error(`Error handling membership check button:`, error.message);

                    await interaction.editReply({
                        content: '❌ Failed to create verification ticket. Please try again or contact an admin.',
                    });
                }

                return;
            }
        }
    },
};

