// ============================================================
// ByteLens — Voice State Update Logger
// Logs when users join, leave, or switch voice channels
// Supports multiple servers via guild_settings.json
// ============================================================

const { Events } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { createLogger } = require('../../utils/logger');

const log = createLogger('VoiceLog');

module.exports = {
    name: Events.VoiceStateUpdate,
    once: false,

    async execute(oldState, newState) {
        const guild = newState.guild || oldState.guild;
        if (!guild) return;

        // Load multi-server settings
        const settingsPath = path.join(__dirname, '../../config/guild_settings.json');
        let settings = {};
        try {
            settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        } catch (err) {
            log.error('Failed to read guild_settings.json');
            return;
        }

        const guildConfig = settings[guild.id];
        if (!guildConfig || !guildConfig.reportChannelId) return; // No config for this server

        const channelTarget = guild.channels.cache.get(guildConfig.reportChannelId);
        if (!channelTarget) return;

        const member = newState.member || oldState.member;
        if (!member) return;
        
        const { displayName, user: { username, id: userId } } = member;

        const timestamp = new Intl.DateTimeFormat('id-ID', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            timeZone: 'Asia/Jakarta', timeZoneName: 'short'
        }).format(new Date());

        const profileCheck = `\n🔍 **Profile Check:** <@${userId}>`;

        try {
            if (!oldState.channelId && newState.channelId) {
                const msg = `\`\`\`diff\n+ 🟢 JOIN REPORT\n👤 User    : ${displayName} (${username})\n🔊 Channel : ${newState.channel.name}\n📅 Waktu   : ${timestamp}\n\`\`\`${profileCheck}`;
                await channelTarget.send({ content: msg, allowedMentions: { parse: [] } });
            } else if (oldState.channelId && !newState.channelId) {
                const msg = `\`\`\`diff\n- 🔴 LEAVE REPORT\n👤 User    : ${displayName} (${username})\n🔈 Channel : ${oldState.channel.name}\n📅 Waktu   : ${timestamp}\n\`\`\`${profileCheck}`;
                await channelTarget.send({ content: msg, allowedMentions: { parse: [] } });
            } else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
                const msg = `\`\`\`fix\n🟡 SWITCH REPORT\n👤 User    : ${displayName} (${username})\n➡️ Dari    : ${oldState.channel.name}\n🚪 Ke      : ${newState.channel.name}\n📅 Waktu   : ${timestamp}\n\`\`\`${profileCheck}`;
                await channelTarget.send({ content: msg, allowedMentions: { parse: [] } });
            }
        } catch (error) {
            log.error(`Failed to send voice report in ${guild.name}: ${error.message}`);
        }
    },
};
