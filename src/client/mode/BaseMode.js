
import $ from "cash-dom";
import  { toHTML } from 'discord-markdown'; // src: https://github.com/brussell98/discord-markdown
import { tagUser, tagChannel, tagRole } from '../markdown.js';
import emojiStrip from 'emoji-strip';
import './BaseMode.scss';

function checkParamsBoolean(params, name, defaultValue = false) {
    if (!params.has(name)) return defaultValue;
    const value = params.get(name) || defaultValue;
    return value == true || value == 'true' || value == '1';
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
    options.allowMarkdown   = checkParamsBoolean(params, 'allow_markdown', true);
    options.allowBigEmotes  = checkParamsBoolean(params, 'allow_big_emotes', true);
    options.trimEmoji       = checkParamsBoolean(params, 'trim_emoji', false);
    options.showChannelName = checkParamsBoolean(params, 'show_channel', true);
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
    /** @type {Boolean} enables markdown */
    allowMarkdown = true;
    /** @type {Boolean} allows emotes to grow when they are the only thing posted */
    allowBigEmotes = true;
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

    /** Updates the label of the chanel name */
    updateChannelName(channel) { }

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

export function autoScroll(element) {
    try {
        element.scrollTo({
            top: element.clientHeight * 100,
            behavior: 'smooth'
        });
    }catch(error) {
        console.error(error, element);
    }
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

export function trimEmoji(str) {
    return emojiStrip(str);
    //return str.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '');
}