import dotenv from 'dotenv';
dotenv.config();

import djs from "discord.js";

/** @type {djs.Client} client */
let client = null;

if (djs.Intents) {
    console.log('creating DJS 1.13 bot');
    const { Client, Intents } = djs;
    client = new Client({ 
    intents: [ 
        Intents.FLAGS.GUILDS, 
        Intents.FLAGS.GUILD_INVITES, 
        Intents.FLAGS.GUILD_MEMBERS, 
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS, 
        Intents.FLAGS.GUILD_PRESENCES,
        Intents.FLAGS.GUILD_MESSAGES, 
        Intents.FLAGS.GUILD_VOICE_STATES,
        Intents.FLAGS.GUILD_SCHEDULED_EVENTS,
        Intents.FLAGS.DIRECT_MESSAGES,
    ],partials: ["CHANNEL"],
      fetchAllMembers: true
    });
} else {
    console.log('creating DJS 1.14 bot');
    const { Client, GatewayIntentBits, Partials }  = djs;
    client = new Client({ 
        intents: [
            GatewayIntentBits.Guilds, 
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.GuildMessageReactions,
        ], 
        partials: [Partials.GuildMember, Partials.Message] 
    });
}

import { createRouter } from './index.js';
import express from 'express';
import expressWebSocket from 'express-ws';

// Create the express client
const app   = express();
const port  = process.env.EXPRESS_PORT || 3000;
expressWebSocket(app);    
app.use('/chat', createRouter(client));
app.listen(port, () => {
    console.log(`Application is listenting too http://localhost:${port}`);
    client.login(process.env.BOT_TOKEN);
});

