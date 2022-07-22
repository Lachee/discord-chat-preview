import { Router as expressRouter, static as expressStatic } from "express";
import expressWs from "express-ws";
import { Client, Message } from "discord.js";
import path from 'path';

/**
 * Converts a Discord.JS message into minimal information to render on a webpage
 * @param {Message<boolean>} message 
 */
async function convertDiscordMessage(message) {
    return { 
        content: message.content
    }
}

/**
 * Creates an express router that has the endpoints for live chat
 * @param {Client} discord 
 */
export function createRouter(discord, channels = []) {
    const router = expressRouter();
    if (router.ws === undefined)
        throw new Error('express does not have the WS enabled');

    /** @type {Connection[]} list of valid connections */
    let connections = [];
    
    // Check to insure the messages have ponged
    setInterval(() => {
        connections.forEach(connection => {
            if (!connection.isValid()) {
                console.log('terminating connection because it did not respond in time');
                connection.send('close', {}, 'did not respond to pong in time!');
                connection.ws.close();
            }
        });
    }, CONNECTION_MIN_PONGTIME);

    // Message create, we will broadcast to each and every valid object
    discord.on('messageCreate', async (message) => {
        if (message.author.bot) return;
        const minimalMsg    = await convertDiscordMessage(message);
        connections.forEach(connection => connection.send('discord', minimalMsg, minimalMsg.content));
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
        const connection = new Connection(ws);
        connections.push(connection);
                
        // On close remove the connection
        ws.on('close', function(msg) {
            connections = connections.filter(con => con.ws != ws);
            console.log("connection lost: ", connections.length);
        });

        // On a message, we will send a pong back and tell them when we expect them.
        ws.on('message', function(msg) {
            if (Date.now() < connection.ping) {
                console.log('terminating connection because it responded too fast!');
                connection.send('close', {}, 'connection responding too fast!');
                connection.ws.close();
            } else {
                // Otherwise just ping pong them again
                connection.pingPong();
            }
        })

        connection.pingPong();
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

const CONNECTION_MIN_PONGTIME = 1000;
const CONNECTION_MAX_PONGTIME = 3000;
class Connection {
    
    ws;
    ping;
    pong;

    constructor(ws) {
        this.ws = ws;
        this.ping = Date.now() + CONNECTION_MIN_PONGTIME;
        this.pong = this.ping + CONNECTION_MAX_PONGTIME;
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
    pingPong() {        
        this.ping = Date.now() + CONNECTION_MIN_PONGTIME;
        this.pong = this.ping + Math.floor(CONNECTION_MIN_PONGTIME + (Math.random() * CONNECTION_MAX_PONGTIME));
        
        const pingPong = { ping: this.ping, pong: this.pong };
        this.send('ping', pingPong, 'Ping! 🏓');
        return pingPong;
    }

    /**
     * Returns if the connection is valid
     * @returns {Boolean} validity of connection
     */
    isValid() {
        return this.ws && Date.now() < this.pong;
    }
}

/**
 * Sends a file
 * @param {Response} res 
 * @param {String} filename 
 */
function sendFile(res, filename)
{
    res.sendFile(filename, { root: path.dirname('dist') + '/dist' });
}