import './index.scss';
import $ from "cash-dom";
import  { toHTML as markdown } from 'discord-markdown'; // src: https://github.com/brussell98/discord-markdown
import { tagUser, tagChannel, tagRole } from './markdown.js';

const LOG_PING_PONG = false;

let container = null;
let currentSocket = null;

function createMessage(message) {
    const msg = $(`<div class="message" id="${message.id}"></div>`).appendTo(container).get(0);
    $('<div class="name"></div><div class="content"></div><div class="reactions"></div>').appendTo(msg);
    updateMessage(message);
}
function updateMessage(message) {
    const { id, member, content, createdAt } = message;
    const markdownOptions = {
        discordCallback: {
            user: ({id})    => tagUser(id, message.mentions?.members),
            channel: ({id}) => tagChannel(id, message.mentions?.channels),
            role: ({id})    => tagRole(id, message.mentions?.roles),
        }
    }

    $(`#${id}`).find('.name')
        .text(member.name)
        .css({ color: member.color === '#000000' ? 'inherit' : member.color });

    $(`#${id}`).find('.content')
        .html(markdown(content, markdownOptions));
        
}
function deleteMessage(message) {}

function addReaction(reaction) {}
function removeReaction(reaction) {}

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
                const delay = (data.ping - Date.now());
                if (LOG_PING_PONG) console.log(Date.now(), 'PING 🏓', delay, data);
                setTimeout(() => {
                    if (LOG_PING_PONG) console.log(Date.now(), 'PONG 🏓');
                    socket.send(JSON.stringify({origin: 'client', data: null, content: '🏓 PONG!'}));
                }, delay);
                break;

            case 'discord':
                console.log('[DISCORD]', content, data);
                switch(content) {
                    case 'message.create':
                        createMessage(data);
                        break;
                    case 'message.edit':
                        updateMessage(data);
                        break;
                    case 'message.delete':
                        deleteMessage(data);
                        break;
                    case 'reaction.add':
                        addReaction(data);
                        break;
                    case 'reaction.remove':
                        removeReaction(data);
                        break;
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

function initializeChatbox() {
    container = $('<div id="chat" class="chat"></div>').appendTo(document.body).get(0);
}

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    
    // Set the body configuration
    if (params.has('transparent'))
        $('body').addClass('transparent');

    initializeChatbox();
    initializeWebsocket();
});