import { Router as expressRouter } from "express";
import { Client, Message, MessageReaction, User, MessageMentions } from "discord.js";

import path from 'path';
import {fileURLToPath} from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const CONNECTION_MIN_PONG_DELAY = 1000;
const CONNECTION_MAX_PONG_DELAY = 5000;

/**
 * Converts a Discord.JS message into minimal information to render on a webpage
 * @param {Message<boolean>} message 
 */
function convertDiscordMessage(message) {
    if (message == null) return null;
    return { 
        id:         message.id,
        type:       message.type,
        content:    message.content,
        createdAt:  message.createdAt,
        editedAt:   message.editedAt,
        member:     convertDiscordMember(message.member), 
        mentions:   convertDiscordMentions(message.mentions),
        reference:  message.reference ? message.reference.messageId : null
    }
}

function convertDiscordMember(member) {
    if (member == null) return null;
    return {
        id:     member.id,
        name:   member.displayName,
        color:  member.displayHexColor,
        avatar: member.displayAvatarURL(),
    };
}

function convertDiscordUser(user) {
    if (user == null) return null;
    return {
        id:     user.id,
        name:   user.name,
        color: '#000000',
        avatar: user.avatarURL()
    };
}

function convertDiscordRole(role) {
    if (role == null) return null;
    return {
        id:         role.id,
        name:       role.name,
        color:      role.hexColor,
        emoji:      role.unicodeEmoji,
        icon:       role.iconURL(),
    };
}

function convertDiscordChannel(channel) {
    if (channel == null) return null;
    return {
        id:     channel.id,
        name:   channel.name,
        nsfw:   channel.nsfw,
        url:    channel.url,
    };
}


/**
 * 
 * @param {MessageMentions} mentions 
 * @returns 
 */
function convertDiscordMentions(mentions) {
    if (mentions == null) return null;
    let members = mentions.members ? mentions.members.map(member => convertDiscordMember(member)) : [];
    let users = mentions.users ? mentions.users.map(user => convertDiscordUser(user)) : [];
    let roles = mentions.roles ? mentions.roles.map(role => convertDiscordRole(role)) : [];
    let channels = mentions.channels ? mentions.channels.map(channel => convertDiscordChannel(channel)) : [];

    return {
        members: members.concat(users.filter(u => !members.filter(m => m.id == u.id).length)),
        channels: channels,
        roles: roles,
    };
}

/**
 * 
 * @param {MessageReaction} messageReaction 
 * @param {User} user
 */
function convertDiscordMessageReaction(messageReaction, user) {
    if (messageReaction == null) return messageReaction;
    return {
        id: messageReaction.message.id,
        count: messageReaction.count,
        emote: convertDiscordEmoji(messageReaction.emoji),
        member: user ? { id: user.id } : null,
    }
}

/**
 * 
 * @param {GuildEmoji|ReactionEmoji} emoji 
 * @returns 
 */
function convertDiscordEmoji(emoji) {
    if (emoji == null) return null;
    return {
        id: emoji.id,
        identifier: emoji.identifier,

        name: emoji.name,
        animated: emoji.animated,
        url: emoji.url,
    }
}

/**
 * Creates an express router that has the endpoints for live chat
 * @param {Client} discord 
 * @returns {Router} express router
 */
export function createRouter(discord, channels = []) {
    const router = expressRouter();
    if (router.ws === undefined)
        throw new Error('express does not have the WS enabled');

    /** @type {Connection[]} list of valid connections */
    let connections = [];
    
    // Check to insure the messages have ponged
    setInterval(() => {
        const n = now();
        connections.forEach(connection => {
            // If we have passed the minimum ping time, check if they have pinged.
            // Kick them if they pinged too late or not at all.
            if (n >= connection.pongBefore) {
                if (connection.pongTime > connection.pongBefore || connection.pongTime < 0) {
                    console.log('terminating connection because it did not respond in time');
                    connection.send('close', {}, 'did not respond to pong in time!');
                    connection.ws.close();
                }
                connection.ping();
            }
        });
    }, CONNECTION_MIN_PONG_DELAY);

    // Message create, we will broadcast to each and every valid object
    discord.on('messageCreate', async (message) => {
        if (message.author.bot) return;
        const converted    = await convertDiscordMessage(message);
        connections.forEach(connection => {
            if (connection.channelId == message.channelId) 
                connection.send('discord', converted, 'message.create');
        });
    });

    
    // Message create, we will broadcast to each and every valid object
    discord.on('messageUpdate', async (oldMessage, newMessage) => {
        if (!newMessage.author || newMessage.author.bot) return;
        const converted    = await convertDiscordMessage(newMessage);
        connections.forEach(connection => {
            if (connection.channelId == newMessage.channelId) 
                connection.send('discord', converted, 'message.edit');
        });
    });
    

    // Message create, we will broadcast to each and every valid object
    discord.on('messageDelete', async (message) => {
        connections.forEach(connection => {
            if (connection.channelId == message.channelId) 
                connection.send('discord',  { id: message.id }, 'message.delete');
        });
    });

    discord.on('messageReactionAdd', async (messageReaction, user) => {
        if (user.bot) return;
        const converted = await convertDiscordMessageReaction(messageReaction, user);
        connections.forEach(connection => {
            if (connection.channelId == messageReaction.message.channelId) 
                connection.send('discord',  converted, 'reaction.add');
        });
    });

    discord.on('messageReactionRemove', async (messageReaction, user) => {
        if (user.bot) return;
        const converted = await convertDiscordMessageReaction(messageReaction, user);
        connections.forEach(connection => {
            if (connection.channelId == messageReaction.message.channelId) 
                connection.send('discord',  converted, 'reaction.remove');
        });
    });
    
    // Create the websocket endpoint
    router.ws(`/:channel`,  function(ws, req) {
        console.log('new channel ws');
        if (channels.length && channels.indexOf(req.params.channel) < 0) {
            console.log('bad request for WS, dont know jack shit');
            ws.send('bad request: unkown channel');
            ws.close();
            return;
        }
        
        // Add the connection
        const connection = new Connection(ws, req.params.channel);
        connections.push(connection);
                
        // On close remove the connection
        ws.on('close', function(msg) {
            connections = connections.filter(con => con.ws != ws);
            console.log("connection lost: ", connections.length);
        });

        // On a message, we will send a pong back and tell them when we expect them.
        ws.on('message', function(msg) {
            connection.pongTime = now(); 
        });

        connection.ping();
        console.log('connection established: ', connections.length);
    });

    
    //=== File Routes
    // Default, lets return the file
    router.get('/*.*', (req, res, next) => {
        console.log('sending', req.path);
        sendFile(res, req.path);
    });

    //=== Status Route
    // Default router with information about our configuration
    router.get('/stats', (req, res, next) => {
        res.json({
            connections:    connections.length,
            channels:       channels,
        });
    });

    //=== Channel Serve route
    // Gets a visual room that will connect to the ws for live messages
    router.get(`/:channel`, (req, res, next) => {
        if (channels.length && channels.indexOf(req.params.channel) < 0) {
            res.send('bad request: unkown channel');
            return;
        }
        res.setHeader('X-Channel', req.params.channel);
        sendFile(res, 'index.html');
    });

    return router;
}

class Connection {
    
    channelId;
    ws;
    pingTime;

    pongDelay;
    pongBefore;
    pongTime;

    constructor(ws, channel) {
        this.ws = ws;
        this.channelId = channel;

        this.pingTime = now();
        this.pongTime = now();
        this.pongBefore = this.pingTime + CONNECTION_MAX_PONG_DELAY;
    }

    /**
     * Sends a payload to the connection
     * @param {String} origin 
     * @param {any} data 
     * @param {String} content 
     */
    send(origin, data, content = '') {
        this.ws.send(JSON.stringify({origin, data, content}));
    }

    /** Sends a new ping to the client with the expected response time */
    ping() {        
        this.pingTime       = now();
        this.pongTime       = -1;

        const delay         = random(CONNECTION_MIN_PONG_DELAY, CONNECTION_MAX_PONG_DELAY);
        this.pongBefore     = this.pingTime + delay;

        const pingPong = { time: this.pingTime, respondBy: this.pongBefore, delay: delay };
        this.send('ping', pingPong, 'Ping! 🏓');
        return pingPong;
    }
}

/**
 * Sends a file
 * @param {Response} res 
 * @param {String} filename 
 */
function sendFile(res, filename)
{
    res.sendFile(filename, { root: __dirname + '/../dist' });
}

/**
 * 
 * @returns {Number} unix epoch time
 */
function now() 
{ 
    return Math.floor(+new Date());
}

function random(min, max) {
    return Math.floor((Math.random() * max) + min);
}