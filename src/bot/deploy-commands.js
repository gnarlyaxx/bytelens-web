// ============================================================
// ByteLens — Slash Command Deployment Script
// Run once: node src/bot/deploy-commands.js
// Registers all slash commands with the Discord API
// ============================================================

require('dotenv').config();

const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
    console.error('❌ Missing DISCORD_BOT_TOKEN, DISCORD_CLIENT_ID, or DISCORD_GUILD_ID in .env');
    process.exit(1);
}

async function deployCommands() {
    const commands = [];
    const commandsPath = path.join(__dirname, 'commands');
    const commandFiles = fs
        .readdirSync(commandsPath)
        .filter((file) => file.endsWith('.js'));

    for (const file of commandFiles) {
        const command = require(path.join(commandsPath, file));
        if ('data' in command) {
            commands.push(command.data.toJSON());
            console.log(`📦 Loaded: /${command.data.name}`);
        }
    }

    const rest = new REST({ version: '10' }).setToken(TOKEN);

    try {
        console.log(`\n🔄 Registering ${commands.length} command(s) to guild ${GUILD_ID}...\n`);

        // Guild-scoped registration (instant, good for development)
        const data = await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands }
        );

        console.log(`✅ Successfully registered ${data.length} command(s):`);
        data.forEach((cmd) => console.log(`   /${cmd.name}`));
    } catch (error) {
        console.error('❌ Failed to register commands:', error);
    }
}

deployCommands();
