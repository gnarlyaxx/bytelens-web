// ============================================================
// ByteLens — /setup-storefront Slash Command
// Posts a persistent embed with service buttons in the channel
// Admin-only — run once in the storefront channel
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
const { BUTTON_IDS, SERVICE_TYPES, COLORS, DISCORD_IDS } = require('../../config/constants');
const { createLogger } = require('../../utils/logger');

const log = createLogger('SetupStorefront');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-storefront')
        .setDescription('Posts the service order embed with ticket buttons (Admin only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        // --- Admin role check ---
        if (!interaction.member.roles.cache.has(DISCORD_IDS.adminRoleId)) {
            return interaction.reply({
                content: '❌ You need the **Admin** role to use this command.',
                flags: MessageFlags.Ephemeral,
            });
        }

        // --- Build the storefront embed ---
        const storefrontEmbed = new EmbedBuilder()
            .setColor(COLORS.PRIMARY)
            .setTitle('📸 ByteLens — Digital Services')
            .setDescription(
                'Welcome to **ByteLens**! We offer premium photography, videography, and digital asset services.\n\n' +
                'Choose a service below to open a **private ticket** with our team. ' +
                'Our admin will discuss your needs and provide a custom quote.\n\n' +
                '─────────────────────────────'
            )
            .addFields(
                {
                    name: `${SERVICE_TYPES[BUTTON_IDS.TICKET_PHOTOGRAPHY].emoji} Photography`,
                    value: SERVICE_TYPES[BUTTON_IDS.TICKET_PHOTOGRAPHY].description,
                    inline: false,
                },
                {
                    name: `${SERVICE_TYPES[BUTTON_IDS.TICKET_VIDEOGRAPHY].emoji} Videography`,
                    value: SERVICE_TYPES[BUTTON_IDS.TICKET_VIDEOGRAPHY].description,
                    inline: false,
                },
                {
                    name: `${SERVICE_TYPES[BUTTON_IDS.TICKET_DIGITAL].emoji} Digital Assets`,
                    value: SERVICE_TYPES[BUTTON_IDS.TICKET_DIGITAL].description,
                    inline: false,
                }
            )
            .setFooter({ text: 'ByteLens — Capturing Moments, Delivering Excellence' })
            .setTimestamp();

        // --- Build buttons ---
        const buttonRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(BUTTON_IDS.TICKET_PHOTOGRAPHY)
                .setLabel('📷 Photography')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(BUTTON_IDS.TICKET_VIDEOGRAPHY)
                .setLabel('🎬 Videography')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(BUTTON_IDS.TICKET_DIGITAL)
                .setLabel('🖼️ Digital Assets')
                .setStyle(ButtonStyle.Secondary)
        );

        // --- Send the persistent message ---
        await interaction.channel.send({
            embeds: [storefrontEmbed],
            components: [buttonRow],
        });

        // Confirm to the admin (ephemeral, only they see it)
        await interaction.reply({
            content: '✅ Storefront embed posted successfully! This message will persist in this channel.',
            flags: MessageFlags.Ephemeral,
        });

        log.success(`Storefront posted in #${interaction.channel.name} by ${interaction.user.tag}`);
    },
};
