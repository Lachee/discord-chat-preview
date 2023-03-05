import './FlexMode.scss';
import $ from 'cash-dom';
import { BaseMode } from './BaseMode.js';

export class FlexMode extends BaseMode {

    /** @type {Element} the dom container */
    container;

    previousMessage;

    /** Initializes the default box */
    initialize(parent) {
        $('<div class="chat-container"></div>');
        this.container = $('.chat-container').get(0);

        if (this.options.showChannelName)
            $(this.container).addClass('with-header');
    
        $('body').addClass('flex');
    }

    /** Creates a new message then updates it with content */
    createMessage(message) {
        const msg =     $(`<div class="message" id="${message.id}" type="${message.type}"`)
                            .appendTo(this.container)
                            .get(0);
        
        $('<div class="row reply"></div>').appendTo(msg);
        $('<div class="row name"></div>').appendTo(msg);
        $('<div class="row content"></div>').appendTo(msg);
        $('<div class="row reactions"></div>').appendTo(msg);
        this.updateMessage(message);
    }

    /** Updates an existing message */
    //updateMessage(message) {}
    
    /** Deletes a message */
    //deleteMessage(message) {}

    /** Updates a reaction */
    //updateReaction(reaction)  {}
}
