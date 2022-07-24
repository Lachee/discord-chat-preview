
import $ from "cash-dom";
import  { toHTML } from 'discord-markdown'; // src: https://github.com/brussell98/discord-markdown
import { tagUser, tagChannel, tagRole } from '../markdown.js';

export class BaseMode {

    /** @type {Boolean} should we autoscroll? */
    autoScroll;

    constructor() {
        this.setAutoScroll(true);
    }

    /** Initializes the default box */
    initialize(parent) {

    }

    /** Creates a new message then updates it with content */
    createMessage(message) {}
    /** Updates an existing message */
    updateMessage(message) {}
    /** Deletes a message */
    deleteMessage(message) {}

    /** Updates a reaction */
    updateReaction(reaction)  {}

    setAutoScroll(state) { this.autoScroll = state; }
    getAutoScroll() { return this.autoScroll;}
}

export function copyElement($target, $dest) {
    $dest.html($target.html());
    $target.each(function () {
        $.each(this.attributes, function() {
            if(this.specified) {
                $dest.attr(this.name, this.value);
            }
        });
    });
}

export function autoScroll() {
    window.scrollTo({
        top: document.body.clientHeight * 100,
        behavior: 'smooth'
    });
}

/** Creates a HTML representation of a message */
export function markdown(message) {
    const markdownOptions = {
        discordCallback: {
            user: ({id})    => tagUser(id, message.mentions?.members),
            channel: ({id}) => tagChannel(id, message.mentions?.channels),
            role: ({id})    => tagRole(id, message.mentions?.roles),
        }
    }

    return toHTML(message.content, markdownOptions);
}