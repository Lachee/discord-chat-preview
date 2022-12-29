import dotenv from 'dotenv';
dotenv.config();

import { Client, Intents } from 'discord.js';
import { createRouter } from './index.js';
import express from 'express';
import expressWebSocket from "express-ws";


// Create the discord client
const client = new Client({ 
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

// Create the express client
const app   = express();
const port  = process.env.EXPRESS_PORT || 3000;
expressWebSocket(app);    
app.use('/chat', createRouter(client));
app.listen(port, () => {
    console.log(`Application is listenting too http://localhost:${port}`);
    client.login(process.env.BOT_TOKEN);
});

