import './index.scss';
import './hljs.scss';

import $ from "cash-dom";
import { BaseMode, createOptionsFromURLSearchParams } from './mode/BaseMode.js';
import { FullMode } from './mode/FullMode.js';
import { CompactMode } from './mode/CompactMode.js';

const LOG_PING_PONG = false;

const params = new URLSearchParams(window.location.search);
function get(name, defaultValue = null) {
    return params.get(name) ?? defaultValue;
}

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
                        default:
                            console.warn('unkown discord mode', content, data);
                            break;
                        case 'channel.update':
                            currentMode.updateChannelName(data);
                            break;
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
    
    const options = createOptionsFromURLSearchParams(params);
    console.log('initialize mode with options: ', options);
    switch(params.get('mode') || 'compact') {
        case 'full':
            currentMode = new FullMode(options);
            break;
            
        default:
        case 'compact':
            currentMode = new CompactMode(options);
            break;
    }
    currentMode.initialize(document.body);
}

/** @returns {Number} unix epoch time */
function now() 
{ 
    return Math.floor(+new Date());
}

document.addEventListener('DOMContentLoaded', () => {
    
    // Set the body configuration
    if (params.has('transparent'))
        $('body').addClass('transparent');

    initializeMode();
    initializeWebsocket();
});