// ============================================================
// ByteLens — Message Delete Logger
// Logs when users delete messages
// Supports multiple servers via guild_settings.json
// ============================================================

const { Events } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { createLogger } = require('../../utils/logger');

const log = createLogger('MessageDelete');

module.exports = {
    name: Events.MessageDelete,
    once: false,

    async execute(message) {
        // Ignore bot messages or partial uncached messages
        if (message.partial || (message.author && message.author.bot)) return;

        const guild = message.guild;
        if (!guild) return;

        // Load multi-server settings
        const settingsPath = path.join(__dirname, '../../config/guild_settings.json');
        let settings = {};
        try {
            settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        } catch (err) {
            return;
        }

        const guildConfig = settings[guild.id];
        if (!guildConfig || !guildConfig.adminLogChannelId) return;

        const adminChannel = guild.channels.cache.get(guildConfig.adminLogChannelId);
        if (!adminChannel) return;

        const author = message.author;
        const username = author?.username || 'Unknown User';
        const userId = author?.id || 'Unknown ID';
        
        let content = message.content || '*[Content unavailable or media-only]*';
        if (content.length > 1500) content = content.substring(0, 1500) + '... [TRUNCATED]';

        const reportMsg = `\`\`\`diff
- 🗑️ MESSAGE DELETED
👤 User    : ${username}
💬 Channel : ${message.channel.name}

[DELETED CONTENT]:
${content}
\`\`\`
🔍 **Profile Check:** <@${userId}>`;

        try {
            await adminChannel.send({ 
                content: reportMsg, 
                allowedMentions: { parse: [] } 
            });
        } catch (error) {
            log.error(`Failed to send message delete report in ${guild.name}: ${error.message}`);
        }
    },
};
