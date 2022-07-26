import './CompactMode.scss';
import $ from 'cash-dom';
import { FullMode } from './FullMode.js';

export class CompactMode extends FullMode {

    /** @type {Element} the dom container */
    container;

    /** Initializes the default box */
    initialize(parent) {
        console.log('initialize compact mode');
        this.container = $('<div id="chat" class="chat"></div>').appendTo(parent).get();
    }

    /** Creates a new message then updates it with content */
    createMessage(message) {
        const msg = $(`<div class="message" id="${message.id}" type="${message.type}"></div>`).appendTo(this.container).get(0);     
        $('<div class="name"></div><div class="content"><div class="reply"></div><div class="markdown"></div><div class="embeds"></div><div class="reactions"></div></div>').appendTo(msg);
        this.updateMessage(message);
    }
    
//    /** Updates an existing message */
//    updateMessage(message) {}
//    /** Deletes a message */
//    deleteMessage(message) {}
//
//    /** Updates a reaction */
//    updateReaction(reaction)  {}
}
