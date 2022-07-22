import { Router as expressRouter } from "express";
import expressWs from "express-ws";
import { Client } from "discord.js";

/**
 * Creates an express router that has the endpoints for live chat
 * @param {Client} discord 
 */
export function createRouter(discord, channels = []) {
    const router = expressRouter();
    if (router.ws === undefined)
        throw new Error('express does not have the WS enabled');

    let connections = [];
    function broadcast(msg) {
        connections.forEach(ws => {
            ws.send(msg);
        });
    }

    discord.on('message', async (message) => {
        if (message.author.bot) return;
        broadcast({ origin: 'discord', data: message, content: '' });
    });

    // Gets a visual room that will connect to the ws for live messages
    router.get(`/:channel`, (req, res, next) => {
        if (channel.length && channels.indexOf(req.params.channel) < 0) {
            res.send('bad request: unkown channel');
            return;
        }

        res.send('ok');
    });

    // Create the websocket endpoint
    router.ws(`/:channel`,  function(ws, req) {
        if (channel.length && channels.indexOf(req.params.channel) < 0) {
            ws.send('bad request: unkown channel');
            ws.close();
            return;
        }

        // Add the connection
        connections.push(ws);
        ws.send({ origin: 'system', data: null, content: 'connected to channel' });
        console.log("new websocket connection created: ", connections.length);

        // On close remove the connection
        ws.on('close', function(msg) {
            connections = connections.filter(con => con != ws);
            console.log("connection lost: ", connections.length);
        });
    });

    return router;
}