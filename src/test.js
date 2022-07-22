import dotenv from 'dotenv';

import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { createRouter } from './index.js';
import express from 'express';
import expressWs from "express-ws";


const app = express();
expressWs(app);

dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds], partials: [Partials.Channel] });
const router = createRouter(client, []);
app.use('/chat', router);
