import './index.scss';
import './hljs.scss';

import $ from "cash-dom";
import { BaseMode } from './mode/BaseMode.js';
import { FullMode } from './mode/FullMode.js';

const LOG_PING_PONG = true;

/** @type {BaseMode} current mode */
let currentMode;

/** @type {WebSocket} current websocket */
let currentSocket;

function initializeWebsocket() {
    const protocol = 'ws';
    const socket = new WebSocket(`${protocol}://${window.location.host}${window.location.pathname}`);
    currentSocket = socket;

    socket.addEventListener('open', function(event) {
        console.log('socket has open');
    });

    socket.addEventListener('message', function(event) {
        const { origin, data, content } = JSON.parse(event.data);
        switch(origin) {
            case 'system':
                console.log('[SERVER]', content);
                break;

            case 'ping':
                const { time, /* respondBy, delay */ } = data;
                const latency = (now() - time);
                if (LOG_PING_PONG) console.log(Date.now(), 'PONG 🏓', latency + "ms");
                socket.send(JSON.stringify({origin: 'client', data: null, content: '🏓 PONG!'}));
                break;

            case 'discord':
                console.log('[DISCORD]', content, data);
                if (currentMode != null) {
                    switch(content) {
                        case 'message.create':
                            currentMode.createMessage(data);
                            break;
                        case 'message.edit':
                            currentMode.updateMessage(data);
                            break;
                        case 'message.delete':
                            currentMode.deleteMessage(data);
                            break;
                        case 'reaction.add':
                        case 'reaction.remove':
                            currentMode.updateReaction(data);
                            break;
                    }
                }
                break;

            default:
                console.warn('[UNKOWN]', origin, data, content);
                break;

        }
    });

    socket.addEventListener('close', function(event) {
        console.log('socket has closed! Attempting again in 1s');
        setTimeout(() => initializeWebsocket(), 1000);

    });
}

function initializeMode() {
    $('<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.6.0/highlight.min.js"></script>').appendTo(document.head);
    currentMode = new FullMode();
    currentMode.initialize(document.body);
}

/** @returns {Number} unix epoch time */
function now() 
{ 
    return Math.floor(+new Date());
}

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    
    // Set the body configuration
    if (params.has('transparent'))
        $('body').addClass('transparent');

    initializeMode();
    initializeWebsocket();
});