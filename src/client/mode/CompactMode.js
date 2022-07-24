import './CompactMode.scss';
import $ from 'cash-dom';
import { BaseMode, autoScroll, copyElement, markdown } from './BaseMode.js';

export class CompactMode extends BaseMode {

    /** @type {Element} the dom container */
    container;

    /** Initializes the default box */
    initialize(parent) {
        console.log('initialize compact mode');
        this.container = $('<div id="chat" class="chat"></div>').appendTo(parent).get();
    }

    /** Creates a new message then updates it with content */
    createMessage(message) {}
    /** Updates an existing message */
    updateMessage(message) {}
    /** Deletes a message */
    deleteMessage(message) {}

    /** Updates a reaction */
    updateReaction(reaction)  {}
}
