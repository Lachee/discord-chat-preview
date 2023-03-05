import './index.scss';
import './hljs.scss';

import $ from "cash-dom";
import { BaseMode, createOptionsFromURLSearchParams } from './mode/BaseMode.js';
import { FullMode } from './mode/FullMode.js';
import { CompactMode } from './mode/CompactMode.js';
import { FlexMode } from './mode/FlexMode.js';

const LOG_PING_PONG = false;

const params = new URLSearchParams(window.location.search);
function get(name, defaultValue = null) {
    return params.get(name) ?? defaultValue;
}

/** @type {BaseMode} current mode */
let currentMode;

/** @type {WebSocket} current websocket */
let currentSocket;

let _socketBackoffTimeMS = 1000;

function initializeWebsocket() {
    const protocol = 'ws';
    currentSocket = new WebSocket(`${protocol}://${window.location.host}${window.location.pathname}`);

    currentSocket.addEventListener('open', function(event) {
        console.log('socket has open');
        _socketBackoffTimeMS = 1000;
    });

    currentSocket.addEventListener('message', (event) => {
        processMessage(event.data);
    });

    currentSocket.addEventListener('close', function(event) {
        console.log('socket has closed! Attempting again in ', _socketBackoffTimeMS, 'ms');
        setTimeout(() => initializeWebsocket(), _socketBackoffTimeMS);
        _socketBackoffTimeMS *= 2;
    });
}

function initializeMode() {
    $('<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.6.0/highlight.min.js"></script>').appendTo(document.head);
    
    const options = createOptionsFromURLSearchParams(params);
    console.log('initialize mode with options: ', options);
    switch(params.get('mode')) {
        case 'full':
            currentMode = new FullMode(options);
            break;

        case 'compact':
            currentMode = new CompactMode(options);
            break;
            
        default:
        case 'flex':
            currentMode = new FlexMode(options);
            break;
    }
    currentMode.initialize(document.body);
}

/** @returns {Number} unix epoch time */
function now() 
{ 
    return Math.floor(+new Date());
}

/**
 * Processes a message received from the socket
 * @param {string} message 
 */
function processMessage(message) {
    const { origin, data, content } = typeof(message) === 'string' ? JSON.parse(message) : message;
    switch(origin) {
        case 'system':
            console.log('[SERVER]', content);
            break;

        case 'ping':
            if (currentSocket != null) {
                const { time, /* respondBy, delay */ } = data;
                const latency = (now() - time);
                if (LOG_PING_PONG) console.log(Date.now(), 'PONG 🏓', latency + "ms");
                currentSocket.send(JSON.stringify({origin: 'client', data: null, content: '🏓 PONG!'}));
            }
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
};

/**
 * Processes an array of message objects with an optional delay
 * @param {Array} messages 
 * @param {*} delay 
 */
function processMessages(messages, delay = 0) {
    let time = 0;
    for(const msg of messages) {
        time += delay;
        if (time > 0) {
            setTimeout(() => processMessage(msg), time);
        } else {
            processMessage(msg);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    
    // Set the body configuration
    if (params.has('transparent'))
        $('body').addClass('transparent');

    initializeMode();
    initializeWebsocket();
    document.simulateDiscordMessages = processMessages;
});