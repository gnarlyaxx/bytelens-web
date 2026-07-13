// ============================================================
// ByteLens — Shared Constants & Discord IDs
// All Discord snowflake IDs loaded from environment variables
// ============================================================

// --- Discord IDs ---
const DISCORD_IDS = {
    guildId: process.env.DISCORD_GUILD_ID,
    ticketCategoryId: process.env.DISCORD_TICKET_CATEGORY_ID,
    adminRoleId: process.env.DISCORD_ADMIN_ROLE_ID,
    exclusiveRoleId: process.env.DISCORD_EXCLUSIVE_ROLE_ID,
};

// --- Button Custom IDs (used in storefront embed & interaction handler) ---
const BUTTON_IDS = {
    TICKET_PHOTOGRAPHY: 'ticket_photography',
    TICKET_VIDEOGRAPHY: 'ticket_videography',
    TICKET_DIGITAL: 'ticket_digital_asset',
    CHECK_MEMBERSHIP: 'btn_check_membership',
};

// --- Service Types (maps button IDs to human-readable names & DB values) ---
const SERVICE_TYPES = {
    [BUTTON_IDS.TICKET_PHOTOGRAPHY]: {
        label: 'Photography',
        emoji: '📷',
        dbValue: 'photography',
        channelPrefix: 'photo',
        description: 'Events, portraits, product shots & more',
    },
    [BUTTON_IDS.TICKET_VIDEOGRAPHY]: {
        label: 'Videography',
        emoji: '🎬',
        dbValue: 'videography',
        channelPrefix: 'video',
        description: 'Cinematic videos, promos, events coverage',
    },
    [BUTTON_IDS.TICKET_DIGITAL]: {
        label: 'Digital Assets',
        emoji: '🖼️',
        dbValue: 'digital_asset',
        channelPrefix: 'digital',
        description: 'Pre-made photos, presets, templates',
    },
};

// --- Embed Colors (hex) ---
const COLORS = {
    PRIMARY: 0x6C5CE7,    // Purple — brand color
    SUCCESS: 0x00B894,    // Green — payment success
    WARNING: 0xFDAA5E,    // Orange — pending/action needed
    ERROR: 0xE17055,      // Red — errors/failures
    INFO: 0x0984E3,       // Blue — informational
    PRIORITY: 0xFFD700,   // Gold — exclusive/priority members
};

// --- Transaction Statuses ---
const TX_STATUS = {
    PENDING: 'pending',
    PAID: 'paid',
    EXPIRED: 'expired',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded',
};

module.exports = {
    DISCORD_IDS,
    BUTTON_IDS,
    SERVICE_TYPES,
    COLORS,
    TX_STATUS,
};
