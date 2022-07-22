import dotenv from 'dotenv';
dotenv.config();

import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { createRouter } from './index.js';
import express from 'express';
import expressWebSocket from "express-ws";


// Create the discord client
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
    ], 
    partials: [Partials.GuildMember, Partials.Message] 
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

