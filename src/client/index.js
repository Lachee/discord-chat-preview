import './index.scss';
import './hljs.scss';

import $ from "cash-dom";
import  { toHTML as markdown } from 'discord-markdown'; // src: https://github.com/brussell98/discord-markdown
import { tagUser, tagChannel, tagRole, tagEmote } from './markdown.js';

const LOG_PING_PONG = true;

let container = null;
let currentSocket = null;

function autoscroll() {
    window.scrollTo({
        top: document.body.clientHeight * 100,
        behavior: 'smooth'
    });
}

function createMessage(message) {
    const msg = $(`<tr class="message" id="${message.id}" type="${message.type}"></tr>`).appendTo(container).get(0);
    $('<td class="name"></td><td class="content"><div class="reply"></div><div class="markdown"></div><div class="reactions"></div></td>').appendTo(msg);
    updateMessage(message);    
}
function updateMessage(message) {
    const { id, member, content, createdAt, reference } = message;
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

    $(`#${id}`).find('.content > .markdown')
        .html(markdown(content, markdownOptions));
        
    // If the content is only image tags then apply
    $(`#${id}`).find('.content > .markdown').removeClass('image-only');
    if ($(`#${id}`).find('.content > .markdown').text().trim().length == 0)
        $(`#${id}`).find('.content > .markdown').addClass('image-only');

    // Setup the reply
    const replyContainer = $(`#${id}`).find('.content > .reply');
    replyContainer.html('').attr('ref', reference);
    if (reference) {
        const refs = $(`#${reference}`).get();
        if (refs.length > 0) {
            const namecon = $('<div class="name"></div>').appendTo(replyContainer);
            copyElement($(refs).find('.name'), namecon);

            const contentcon = $('<div class="content"></div>').appendTo(replyContainer);
            copyElement($(refs).find('.content'), contentcon);
        }
    }

    autoscroll();
}


function copyElement($target, $dest) {
    $dest.html($target.html());
    $target.each(function () {
        $.each(this.attributes, function() {
            if(this.specified) {
                $dest.attr(this.name, this.value);
            }
        });
    });
}


function deleteMessage(message) {
    const {id} = message;
    $(`#${id}`).remove();
    autoscroll();
}

function updateReaction(reaction) {
    const {id, emote, count} = reaction;


    // If it doesnt exist then we will add one
    let query = $(`#${id}`).find('.content .reactions').find(`[data-id="${emote.identifier}"]`);
    if (count == 0) {
        query.remove();
    } else {
        if (query.length == 0) {        
            $(`<div class="reaction" data-id="${emote.identifier}">${tagEmote(emote)}<span class="count">1</span></div>`).appendTo($(`#${id}`).find('.content .reactions'));
            query = $(`#${id}`).find('.content .reactions').find(`[data-id="${emote.identifier}"]`); 
        }
        query.find('.count').text(count);
    }
    
    autoscroll();
}

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
                    case 'reaction.remove':
                        updateReaction(data);
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
    $('<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.6.0/highlight.min.js"></script>').appendTo(document.head);
    container = $('<table id="chat" class="chat"></table>').appendTo(document.body).get();
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

    initializeChatbox();
    initializeWebsocket();
});