import './CompactMode.scss';
import $ from 'cash-dom';
import { FullMode } from './FullMode.js';

export class CompactMode extends FullMode {

    /** @type {Element} the dom container */
    container;

    previousMessage;

    /** Initializes the default box */
    initialize(parent) {
        console.log('initialize compact mode');
        this.container = $('<div id="chat" class="chat chat-compact"></div>').appendTo(parent).get(0);

        if (this.options.showChannelName)
            $(this.container).addClass('with-header');
    
        $('body').addClass('full').addClass('compact');
    }

    /** Creates a new message then updates it with content */
    createMessage(message) {
        const msg = $(`<div class="message" id="${message.id}" type="${message.type}"></div>`).appendTo(this.container).get(0);     
        $('<div class="name"></div><div class="content"><div class="reply"></div><div class="markdown"></div><div class="embeds"></div><div class="reactions"></div></div>').appendTo(msg);
        this.updateMessage(message);
        
        if (this.previousMessage != null && 
            message.id != this.previousMessage.id && 
            message.member.id == this.previousMessage.member.id) {
            $(`#${message.id}`).find('.name').css('display', 'none');
        }
        
        this.previousMessage = message;
    }

//    /** Updates an existing message */
//    updateMessage(message) {}
//    /** Deletes a message */
//    deleteMessage(message) {}
//
//    /** Updates a reaction */
//    updateReaction(reaction)  {}
}
