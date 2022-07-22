import { Router as expressRouter, static as expressStatic } from "express";
import expressWs from "express-ws";
import { Client } from "discord.js";
import path from 'path';

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

    // Create the websocket endpoint
    router.ws(`/:channel`,  function(ws, req) {
        if (channels.length && channels.indexOf(req.params.channel) < 0) {
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

/**
 * Sends a file
 * @param {Response} res 
 * @param {String} filename 
 */
function sendFile(res, filename)
{
    res.sendFile(filename, { root: path.dirname('dist') + '/dist' });
}