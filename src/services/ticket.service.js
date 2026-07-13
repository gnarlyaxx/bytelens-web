// ============================================================
// ByteLens — Ticket Channel Service
// Creates private ticket channels from storefront button clicks
// Implements Priority Logic for Exclusive (returning) members
// ============================================================

const {
    ChannelType,
    PermissionFlagsBits,
    EmbedBuilder,
} = require('discord.js');
const { DISCORD_IDS, SERVICE_TYPES, COLORS } = require('../config/constants');
const { createLogger } = require('../utils/logger');

const log = createLogger('Ticket');

/**
 * Checks whether a guild member has the Exclusive role.
 *
 * @param {import('discord.js').GuildMember} member
 * @returns {boolean}
 */
function isExclusiveMember(member) {
    if (!DISCORD_IDS.exclusiveRoleId) return false;
    return member.roles.cache.has(DISCORD_IDS.exclusiveRoleId);
}

/**
 * Creates a private ticket text channel for the user based on
 * which storefront button they clicked.
 *
 * Priority Logic:
 * - Exclusive members get a "priority-<service>-<username>" channel
 *   with a gold embed and an immediate admin ping.
 * - Standard members get a "<service>-<username>" channel
 *   with the normal purple welcome embed.
 *
 * @param {import('discord.js').ButtonInteraction} interaction
 * @returns {Promise<{success: boolean, channelId?: string, message?: string}>}
 */
async function createTicketChannel(interaction) {
    const { guild, user, customId, member } = interaction;
    const serviceType = SERVICE_TYPES[customId];

    if (!serviceType) {
        log.error(`Unknown button customId: ${customId}`);
        return { success: false, message: 'Unknown service type.' };
    }

    // --- Determine if the user is an Exclusive member ---
    const isPriority = isExclusiveMember(member);

    // --- Build channel name based on priority status ---
    const channelName = isPriority
        ? `priority-${serviceType.channelPrefix}-${user.username}`
        : `${serviceType.channelPrefix}-${user.username}`;

    // --- Check for existing open ticket of the same type ---
    const existingChannel = guild.channels.cache.find(
        (ch) =>
            ch.parentId === DISCORD_IDS.ticketCategoryId &&
            (ch.name === `${serviceType.channelPrefix}-${user.username}` ||
             ch.name === `priority-${serviceType.channelPrefix}-${user.username}`)
    );

    if (existingChannel) {
        return {
            success: false,
            message: `You already have an open ticket for this service: <#${existingChannel.id}>`,
        };
    }

    // --- Create the private channel ---
    try {
        const ticketChannel = await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            parent: DISCORD_IDS.ticketCategoryId,
            permissionOverwrites: [
                {
                    // Deny @everyone from seeing the channel
                    id: guild.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    // Allow the ticket creator
                    id: user.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.AttachFiles,
                        PermissionFlagsBits.ReadMessageHistory,
                    ],
                },
                {
                    // Allow the Admin role
                    id: DISCORD_IDS.adminRoleId,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.AttachFiles,
                        PermissionFlagsBits.ReadMessageHistory,
                        PermissionFlagsBits.ManageMessages,
                    ],
                },
            ],
        });

        // --- Send embed based on priority status ---
        if (isPriority) {
            await sendPriorityWelcome(ticketChannel, user, serviceType);
        } else {
            await sendStandardWelcome(ticketChannel, user, serviceType);
        }

        const tierLabel = isPriority ? 'PRIORITY' : 'Standard';
        log.success(`Created ${tierLabel} ticket #${channelName} for ${user.tag} (${serviceType.label})`);

        return { success: true, channelId: ticketChannel.id };
    } catch (error) {
        log.error(`Failed to create ticket channel: ${error.message}`);
        return { success: false, message: 'Failed to create ticket channel. Please contact an admin.' };
    }
}

/**
 * Sends the priority welcome embed for Exclusive members.
 * Uses a gold color, VIP messaging, and an immediate admin ping.
 */
async function sendPriorityWelcome(channel, user, serviceType) {
    const priorityEmbed = new EmbedBuilder()
        .setColor(COLORS.PRIORITY)
        .setTitle(`⭐ ${serviceType.emoji} ${serviceType.label} — Priority Ticket`)
        .setDescription(
            `Welcome back, <@${user.id}>! 🌟\n\n` +
            `As an **Exclusive Member**, your request is being **prioritized** by our team.\n\n` +
            `Please describe what you need — an admin will respond to you shortly.\n\n` +
            '─────────────────────────────'
        )
        .addFields(
            { name: '📋 Service', value: serviceType.label, inline: true },
            { name: '👤 Client', value: `<@${user.id}>`, inline: true },
            { name: '📌 Status', value: '🟠 Priority — Admin Notified', inline: true },
            { name: '⭐ Tier', value: '**Exclusive Member**', inline: true }
        )
        .setFooter({ text: `Priority Ticket ID: ${channel.id}` })
        .setTimestamp();

    // Immediate admin ping with urgency marker
    await channel.send({
        content: `🚨 <@&${DISCORD_IDS.adminRoleId}> — **PRIORITY** ticket from Exclusive member <@${user.id}>!`,
        embeds: [priorityEmbed],
    });
}

/**
 * Sends the standard welcome embed for regular members.
 */
async function sendStandardWelcome(channel, user, serviceType) {
    const welcomeEmbed = new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setTitle(`${serviceType.emoji} ${serviceType.label} — New Ticket`)
        .setDescription(
            `Hello <@${user.id}>! 👋\n\n` +
            `Thank you for your interest in our **${serviceType.label}** service.\n\n` +
            `Please describe what you need and our team will get back to you shortly with a quote.\n\n` +
            '─────────────────────────────'
        )
        .addFields(
            { name: '📋 Service', value: serviceType.label, inline: true },
            { name: '👤 Client', value: `<@${user.id}>`, inline: true },
            { name: '📌 Status', value: '🟡 Waiting for Admin', inline: true }
        )
        .setFooter({ text: `Ticket ID: ${channel.id}` })
        .setTimestamp();

    await channel.send({
        content: `<@&${DISCORD_IDS.adminRoleId}> — New ticket from <@${user.id}>`,
        embeds: [welcomeEmbed],
    });
}

/**
 * Creates a membership verification ticket when a user clicks the
 * "Check Membership" button in the bytelens-perks channel.
 *
 * This creates a private channel for admins to manually verify
 * the user's transaction history in Supabase.
 *
 * @param {import('discord.js').ButtonInteraction} interaction
 * @returns {Promise<{success: boolean, channelId?: string, message?: string}>}
 */
async function createMembershipCheckTicket(interaction) {
    const { guild, user } = interaction;
    const channelName = `check-member-${user.username}`;

    // --- Check for existing verification ticket ---
    const existingChannel = guild.channels.cache.find(
        (ch) =>
            ch.parentId === DISCORD_IDS.ticketCategoryId &&
            ch.name === channelName
    );

    if (existingChannel) {
        return {
            success: false,
            message: `You already have an open verification ticket: <#${existingChannel.id}>`,
        };
    }

    try {
        // --- Create the private verification channel ---
        const ticketChannel = await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            parent: DISCORD_IDS.ticketCategoryId,
            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: user.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.AttachFiles,
                        PermissionFlagsBits.ReadMessageHistory,
                    ],
                },
                {
                    id: DISCORD_IDS.adminRoleId,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.AttachFiles,
                        PermissionFlagsBits.ReadMessageHistory,
                        PermissionFlagsBits.ManageMessages,
                    ],
                },
            ],
        });

        // --- Send verification embed ---
        const verifyEmbed = new EmbedBuilder()
            .setColor(COLORS.INFO)
            .setTitle('🔍 Membership Verification Request')
            .setDescription(
                `Hello <@${user.id}>! 👋\n\n` +
                `**Awaiting Admin Verification.** Please wait while we check your transaction history in our database.\n\n` +
                `An admin has been notified and will review your membership status shortly.\n\n` +
                '─────────────────────────────'
            )
            .addFields(
                { name: '👤 Requester', value: `<@${user.id}>`, inline: true },
                { name: '📌 Status', value: '🔵 Awaiting Verification', inline: true },
                { name: '🆔 User ID', value: `\`${user.id}\``, inline: true }
            )
            .setFooter({ text: `Verification Ticket ID: ${ticketChannel.id}` })
            .setTimestamp();

        // Immediate admin ping
        await ticketChannel.send({
            content: `🔍 <@&${DISCORD_IDS.adminRoleId}> — **Membership verification** requested by <@${user.id}>. Please check their transaction history in Supabase.`,
            embeds: [verifyEmbed],
        });

        log.success(`Created membership verification ticket #${channelName} for ${user.tag}`);

        return { success: true, channelId: ticketChannel.id };
    } catch (error) {
        log.error(`Failed to create membership check ticket: ${error.message}`);
        return { success: false, message: 'Failed to create verification ticket. Please contact an admin.' };
    }
}

module.exports = { createTicketChannel, createMembershipCheckTicket };

