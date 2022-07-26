import './FullMode.scss';
import $ from 'cash-dom';
import { BaseMode, autoScroll, copyElement, markdown, trimEmoji, createOptionsFromURLSearchParams } from './BaseMode.js';
import { tagEmote } from '../markdown.js';

export class FullMode extends BaseMode {

    /** @type {Element} the dom container */
    container;
    /** @type {Element} container for the channel name */
    channelNameContainer;

    initialize(parent) {
        console.log('initialize full mode');
        $('<table class="chat-container"><thead><tr><th></th><th></th></tr></thead><tbody class="chat chat-full" id="chat"></tbody></table>').appendTo(parent);
        this.container = $('#chat').get(0);
        
        if (this.options.showChannelName)
            $(this.container).addClass('with-header');
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

    createMessage(message) {
        const msg = $(`<tr class="message" id="${message.id}" type="${message.type}"></tr>`).appendTo(this.container).get(0);
        $('<td class="name"></td><td class="content"><div class="reply"></div><div class="markdown"></div><div class="embeds"></div><div class="reactions"></div></td>').appendTo(msg);
        this.updateMessage(message);    
    }
    updateMessage(message) {
        const { id, member, reference , embeds } = message;

        // Write the name
        const name = this.options.trimEmoji ? trimEmoji(member.name) : member.name;
        $(`#${id}`).find('.name')
            .text(name)
            .css({ color: member.color === '#000000' ? 'inherit' : member.color });
    
        // Write the markdown
        if (this.options.allowMarkdown) {
            $(`#${id}`).find('.content > .markdown')
                .html(markdown(message));
        } else {
            $(`#${id}`).find('.content > .markdown')
                .text(message.content);
        }
            
        // If the content is only image tags then apply
        $(`#${id}`).find('.content > .markdown').removeClass('image-only');
        if (this.options.allowBigEmotes && $(`#${id}`).find('.content > .markdown').text().trim().length == 0)
            $(`#${id}`).find('.content > .markdown').addClass('image-only');
    
        // Setup the reply
        const replyContainer = $(`#${id}`).find('.content > .reply');
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
        const embedContainer = $(`#${id}`).find('.content > .embeds');
        embedContainer.html('');
        if (this.options.allowEmbeds) {
            for(let { data } of embeds) {
                const { video, url, thumbnail } = data;
                if (video) {
                    if (this.options.allowVideos) {
                        $(`<video autoplay loop muted src="${video.proxy_url}"></video>`)
                            .one('play', () => { this.scroll(); })
                            .appendTo(embedContainer);
                    }
                } else if (thumbnail) {
                    $(`<img src="${thumbnail.proxy_url}"></img>`)
                        .one('load', () => { this.scroll(); })
                        .appendTo(embedContainer);
                }
            }
        }
    
        // Autoscroll
        this.scroll();
    }
    
    deleteMessage(message) {
        const {id} = message;
        $(`#${id}`).remove();
        this.scroll();
    }
    
    updateReaction(reaction) {
        if (!this.options.allowReactions)
            return;

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
        this.scroll();
    }

    scroll() {
        if (!this.options.autoScroll)
            return false;
        autoScroll(this.container);
    }
}