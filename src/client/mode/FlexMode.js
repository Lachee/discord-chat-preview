import './FlexMode.scss';
import $ from 'cash-dom';
import { autoScroll, BaseMode, copyElement, markdown, trimEmoji } from './BaseMode.js';
import { tagEmote } from '../markdown.js';

export class FlexMode extends BaseMode {

    /** @type {Element} the dom container */
    container;    
    /** @type {Element} container for the channel name */
    channelNameContainer;

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
        this.scroll();

        // Auto hide names 
        if (this.previousMessage != null && 
            message.id != this.previousMessage.id && 
            message.member.id == this.previousMessage.member.id &&
            message.reference == null) 
        {
            $(`#${message.id}`)
                .find('.name')
                .css('display', 'none');
        }
        
        this.previousMessage = message;
    }

    /** Updates an existing message */
    updateMessage(message) {
        const { id, member, reference , embeds, attachments } = message;

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

            replyContainer.find('.name').css({display: 'inherit'});
        } else {
            // Fix the reply width if we cannot allow replies
            $(`#${id}`).attr("type", 0);
        }

        // Setup the embeds 
        let foundEmbed = false;
        const embedContainer = $(`#${id}`).find('.embeds');
        embedContainer.html('');
        if (this.options.allowEmbeds) {

            // Add the embed display
            if (embeds) {
                for(let embed of embeds) {
                    if (embed == null) continue;
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

            // Add the attatchment display
            if (attachments) {
                for(let attachment of attachments) {
                    if (attachment == null) continue;

                    switch(attachment.type) {
                        case 'image/jpeg':
                        case 'image/png':
                        case 'image/bitmap':
                        case 'image/gif':
                        case 'image/webm':
                            $(`<img src="${attachment.url}" alt="${attachment.description ?? ''}" title="${attachment.title ?? ''}"></img>`)
                                .one('load', () => { this.scroll(); })
                                .appendTo(embedContainer);
                            foundEmbed = true;
                            break;

                        case 'video/webm':
                        case 'video/mp4':
                            if (this.options.allowVideos) {
                                $(`<video autoplay loop muted src="${attachment.url}" alt="${attachment.description ?? ''}" title="${attachment.title ?? ''}"></video>`)
                                    .one('play', () => { this.scroll(); })
                                    .appendTo(embedContainer);
                                foundEmbed = true;
                            }
                            break;

                        default:
                            $(`<div class="attachment" data-type="${attachment.type}"><div class="icon file"></div><span class="title">${attachment.title}</span><span class="description">${attachment.description ?? ''}</span></div>`)
                                .appendTo(embedContainer);
                            foundEmbed = true;
                            break;
                    }
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

    
    createChannelName(channel) {
        if (this.channelNameContainer)
            this.channelNameContainer.remove();

        this.channelNameContainer = $('<div class="header"><div class="name"></div></div>')
            .prependTo(document.body)
            .get();
    }

    updateChannelName(channel) {
        if (!this.options.showChannelName) 
            return;

        if (this.channelNameContainer == null) 
            this.createChannelName(channel);
        
        $(this.channelNameContainer).find('.name').text(channel.name);
        this.scroll();
    }
    
    scroll() {
        if (!this.options.autoScroll)
            return false;
        try {
            document.body.scrollTo({
                top: 99_999_999,
                behavior: 'smooth'
            });
        }catch(error) {
            console.error(error, element);
        }
    }
}

function tryGetURL(str) {
    try {
        return new URL(str);
    } catch(_) {
        return false;
    }
}