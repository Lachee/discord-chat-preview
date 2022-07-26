
import $ from "cash-dom";
import  { toHTML } from 'discord-markdown'; // src: https://github.com/brussell98/discord-markdown
import { tagUser, tagChannel, tagRole } from '../markdown.js';

function checkParamsBoolean(params, name, defaultValue = false) {
    if (!params.has(name)) return defaultValue;
    return (params.get(name) ?? defaultValue) == true;
}

/** Creates a new options object from the search params
 * @param {URLSearchParams} params the search parameters
 * @returns {Options} options from the query params */
export function createOptionsFromURLSearchParams(params) {
    const options = new Options();
    options.allowEmbeds     = checkParamsBoolean(params, 'allow_embeds', true);
    options.allowVideos     = checkParamsBoolean(params, 'allow_videos', true);
    options.allowReplies    = checkParamsBoolean(params, 'allow_replies', true);
    options.allowReactions  = checkParamsBoolean(params, 'allow_reactions', true);
    options.trimEmoji       = checkParamsBoolean(params, 'trim_emoji', false);
    options.showChannelName = checkParamsBoolean(params, 'show_channel', false);
    options.autoScroll      = checkParamsBoolean(params, 'scroll', true);
    return options;
}
export class Options {
    
    /** @type {Boolean} enables embeded content (images, gifs, videos) */
    allowEmbeds = true;
    /** @type {Boolean|String} enables embdeded videos/gifs. If a non-bool value is given, it serves as a whitelist of domains. */
    allowVideos = true;
    /** @type {Boolean} enables reply visualisation */
    allowReplies = true;
    /** @type {Boolean} enables reactions */
    allowReactions = true;
    /** @type {Boolean} automatically trims the emojis from user names */
    trimEmoji = false;
    /** @type {Boolean} display the channel name at the top of the screen */
    showChannelName = true;
    /** @type {Boolean} enables autoscrolling */
    autoScroll = true;
}

export class BaseMode {

    /** @type {Options} options */
    options;

    /** Creates a new instance of the mode
     * @param {Options} options 
     */
    constructor(options) {
        if (options == null) options = new Options();
        this.options = options;
    }

    /** Initializes the default box */
    initialize(parent) {}

    /** Creates a new message then updates it with content */
    createMessage(message) {}
    /** Updates an existing message */
    updateMessage(message) {}
    /** Deletes a message */
    deleteMessage(message) {}

    /** Updates a reaction */
    updateReaction(reaction)  {}

    setAutoScroll(state) { this.options.autoScroll = state; }
    getAutoScroll() { return this.options.autoScroll; }
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