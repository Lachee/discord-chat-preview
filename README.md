# Discord Chat Preview

Preview your Discord Chat LIVE. Useful for streams.

![GIF Example](https://raw.githubusercontent.com/Lachee/discord-chat-preview/4020aa08b6ff8387316f759397c65c3144541ebd/example.gif)


# Install
`npm install discord-chat-preview`

# Deps
- Discord.js >= 14
- Express
- Express-WS

# Usage
```js
// Import and configure dotenv.
import dotenv from 'dotenv';
dotenv.config();

// Import discord, express, and express-ws
import { Client, Intents, Partials } from 'discord.js';
import express from 'express';
import expressWebSocket from "express-ws";

// Import the createRouter method from the library
import { createRouter } from 'discord-chat-preview';


// Create the discord client
const client = new Client({ 
    intents: [
        Intents.FLAGS.GUILDS, 
        Intents.FLAGS.MESSAGE_CONTENT,           // This is REQUIRED
        Intents.FLAGS.GUILD_MESSAGES,            // This is REQUIRED
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,    // This is optional for reactions
    ], 
    partials: [Partials.GuildMember, Partials.Message] 
});

// Create the express client
const app   = express();
const port  = process.env.EXPRESS_PORT || 3000;
expressWebSocket(app);    // << Make sure you have WS support on your express

// Create the /chat middleware. 
// << THIS IS WHAT YOU ADD TO YOUR BOT >>
app.use('/chat', createRouter(client));

// Listen to the react and login with the bot
app.listen(port, () => {
    console.log(`Application is listenting too http://localhost:${port}`);
    client.login(process.env.BOT_TOKEN);
});
```

# Building
If you fork this package and make changes to how it renders, you need to rebuild it and install the dev dependencies (webpack).
```
npx webpack
```
