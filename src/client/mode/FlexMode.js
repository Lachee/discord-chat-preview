import './FlexMode.scss';
import $ from 'cash-dom';
import { autoScroll, BaseMode, copyElement, markdown, trimEmoji } from './BaseMode.js';
import { tagEmote } from '../markdown.js';

export class FlexMode extends BaseMode {

    /** @type {Element} the dom container */
    container;

    previousMessage;

    /** Initializes the default box */
    initialize(parent) {
        $('<div class="chat-container"></div>').appendTo('body');
        this.container = $('.chat-container').get(0);
        console.log(this.container);
        if (this.options.showChannelName)
            $(this.container).addClass('with-header');
    
        $('body').addClass('flex');
    }

    /** Creates a new message then updates it with content */
    createMessage(message) {
        const msg =     $(`<div class="message" id="${message.id}" type="${message.type}"></div>`)
                            .appendTo(this.container)
                            .get(0);
        
        $('<div class="row reply"></div>').appendTo(msg);
        $('<div class="row name"></div>').appendTo(msg);
        $('<div class="row content"></div>').appendTo(msg);
        $('<div class="row embeds"></div>').appendTo(msg);
        $('<div class="row reactions"></div>').appendTo(msg);
        this.updateMessage(message);
    }

    /** Updates an existing message */
    updateMessage(message) {
        const { id, member, reference , embeds } = message;

        // Write the name
        const name = this.options.trimEmoji ? trimEmoji(member.name) : member.name;
        $(`#${id}`).find('.name')
            .text(name)
            .css({ color: member.color === '#000000' ? 'inherit' : member.color });
            
        // Write the markdown
        if (this.options.allowMarkdown) {
            $(`#${id}`).find('.content')
                .html(markdown(message));
        } else {
            $(`#${id}`).find('.content')
                .text(message.content);
        }
        
         // If the content is only image tags then apply
         $(`#${id}`).find('.content').removeClass('image-only');
         if (this.options.allowBigEmotes && $(`#${id}`).find('.content').text().trim().length == 0)
            $(`#${id}`).find('.content').addClass('image-only');
     
        // Setup the reply
        const replyContainer = $(`#${id}`).find('.reply');
        replyContainer.html('').attr('ref', reference);
        if (this.options.allowReplies) {
            if (reference) {
                const refs = $(`#${reference}`).get();
                if (refs.length > 0) {
                    const namecon = $('<div class="name"></div>').appendTo(replyContainer);
                    copyElement($(refs).find('.name'), namecon);
        
                    const contentcon = $('<div class="content"></div>').appendTo(replyContainer);
                    copyElement($(refs).find('.content'), contentcon);
                }
            }
        } else {
            // Fix the reply width if we cannot allow replies
            $(`#${id}`).attr("type", 0);
        }

        // Setup the embeds 
        let foundEmbed = false;
        const embedContainer = $(`#${id}`).find('.embeds');
        embedContainer.html('');
        if (this.options.allowEmbeds) {
            for(let embed of embeds) {
                let videoURL = null;
                let thumbnailURL = null;

                // Determine the elements urls.
                // If we dont have the data object, we need to be in compat' mode
                if (!embed.data) {
                    // We have to use backwards compatability with d.js 13
                    console.warn("Failed to get any data from the embed");
                    continue;
                } else {
                    const { video, thumbnail } = embed.data;
                    if (video) 
                        videoURL = video.proxy_url;
                    if (thumbnail) 
                        thumbnailURL = thumbnail.proxy_url;
                }

                // Create the elemends
                if (videoURL) {
                    if (this.options.allowVideos) {
                        $(`<video autoplay loop muted src="${videoURL}"></video>`)
                            .one('play', () => { this.scroll(); })
                            .appendTo(embedContainer);
                        foundEmbed = true;
                    }
                } else if (thumbnailURL) {
                    $(`<img src="${thumbnailURL}"></img>`)
                        .one('load', () => { this.scroll(); })
                        .appendTo(embedContainer);
                    foundEmbed = true;
                } else {
                    console.warn("Failed to create the embed as it doesnt contain a video or thumbnail:", embed);
                }
            }
        }
    
        // Fix content if it is only a link and we have a embed
        if (foundEmbed && tryGetURL(message.content) !== false) {
            $(`#${id}`).find('.content').addClass('embed-only');
        }
    }
    
    /** Deletes a message */
    deleteMessage(message) {
        $(`#${message.id}`).remove();
    }

    /** Updates a reaction */
    updateReaction(reaction) {
        if (!this.options.allowReactions)
                return;

        const {id, emote, count} = reaction;

        // If it doesnt exist then we will add one
        let query = $(`#${id}`).find('.reactions').find(`[data-id="${emote.identifier}"]`);
        if (count == 0) {
            query.remove();
        } else {
            if (query.length == 0) {        
                $(`<div class="reaction" data-id="${emote.identifier}">${tagEmote(emote)}<span class="count">1</span></div>`).appendTo($(`#${id}`).find('.reactions'));
                query = $(`#${id}`).find('.reactions').find(`[data-id="${emote.identifier}"]`); 
            }
            query.find('.count').text(count);
        }
        this.scroll();
    }

    
    scroll() {
        if (!this.options.autoScroll)
            return false;
        autoScroll(this.container);
    }
}

function tryGetURL(str) {
    try {
        return new URL(str);
    } catch(_) {
        return false;
    }
}