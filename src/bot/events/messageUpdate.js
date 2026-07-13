// ============================================================
// ByteLens — Message Update Logger
// Logs when users edit messages
// Supports multiple servers via guild_settings.json
// ============================================================

const { Events } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { createLogger } = require('../../utils/logger');

const log = createLogger('MessageUpdate');

module.exports = {
    name: Events.MessageUpdate,
    once: false,

    async execute(oldMessage, newMessage) {
        // Ignore bot messages, partials, and content-identical updates (e.g., embed only updates)
        if (newMessage.partial || (newMessage.author && newMessage.author.bot) || oldMessage.content === newMessage.content) return;

        const guild = newMessage.guild;
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

        const author = newMessage.author;
        const username = author?.username || 'Unknown User';
        const userId = author?.id || 'Unknown ID';
        
        let oldContent = oldMessage.content || '*[Previous content not cached]*';
        let newContent = newMessage.content || '*[Content cleared]*';
        
        if (oldContent.length > 800) oldContent = oldContent.substring(0, 800) + '... [TRUNCATED]';
        if (newContent.length > 800) newContent = newContent.substring(0, 800) + '... [TRUNCATED]';

        const reportMsg = `\`\`\`fix
✏️ MESSAGE EDITED
👤 User    : ${username}
💬 Channel : ${newMessage.channel.name}
🔗 Link    : ${newMessage.url}

[BEFORE]:
${oldContent}

[AFTER]:
${newContent}
\`\`\`
🔍 **Profile Check:** <@${userId}>`;

        try {
            await adminChannel.send({ 
                content: reportMsg, 
                allowedMentions: { parse: [] } 
            });
        } catch (error) {
            log.error(`Failed to send message edit report in ${guild.name}: ${error.message}`);
        }
    },
};
