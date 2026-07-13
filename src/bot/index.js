// ============================================================
// ByteLens — Discord Bot Client Initialization
// Loads commands from commands/ and events from events/
// ============================================================

const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { createLogger } = require('../utils/logger');

const log = createLogger('Bot');

/**
 * Creates and configures the Discord bot client.
 * Dynamically loads all commands and events from their respective directories.
 * @returns {Client} Configured Discord.js client (not yet logged in)
 */
function createBot() {
    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildVoiceStates,
        ],
        partials: [
            Partials.Channel,
            Partials.GuildMember,
        ],
    });

    // --- Load Slash Commands ---
    client.commands = new Collection();
    const commandsPath = path.join(__dirname, 'commands');

    if (fs.existsSync(commandsPath)) {
        const commandFiles = fs
            .readdirSync(commandsPath)
            .filter((file) => file.endsWith('.js'));

        for (const file of commandFiles) {
            const command = require(path.join(commandsPath, file));

            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
                log.info(`Loaded command: /${command.data.name}`);
            } else {
                log.warn(`Skipped ${file} — missing "data" or "execute" export`);
            }
        }
    }

    // --- Load Event Handlers ---
    const eventsPath = path.join(__dirname, 'events');

    if (fs.existsSync(eventsPath)) {
        const eventFiles = fs
            .readdirSync(eventsPath)
            .filter((file) => file.endsWith('.js'));

        for (const file of eventFiles) {
            const event = require(path.join(eventsPath, file));

            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args));
            } else {
                client.on(event.name, (...args) => event.execute(...args));
            }

            log.info(`Loaded event: ${event.name} (${event.once ? 'once' : 'on'})`);
        }
    }

    return client;
}

/**
 * Starts the Discord bot by logging in with the bot token.
 * @returns {Promise<Client>} The logged-in client instance
 */
async function startBot() {
    const token = process.env.DISCORD_BOT_TOKEN;

    if (!token) {
        log.error('Missing DISCORD_BOT_TOKEN in .env — bot will not start.');
        return null;
    }

    const client = createBot();

    try {
        await client.login(token);
        return client;
    } catch (error) {
        log.error('Failed to login:', error.message);
        return null;
    }
}

module.exports = { createBot, startBot };
