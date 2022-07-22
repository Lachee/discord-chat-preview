import './index.scss';
import $ from "cash-dom";

const LOG_PING_PONG = false;

function pushMessage(message) {

}

function initializeWebsocket() {
    const protocol = 'ws';
    const socket = new WebSocket(`${protocol}://${window.location.host}${window.location.pathname}`);
    socket.addEventListener('open', function(event) {
        console.log('socket has open');
    });

    socket.addEventListener('message', function(event) {
        const { origin, data, content } = JSON.parse(event.data);
        switch(origin) {
            case 'system':
                console.log('[SERVER]', content);
                break;

            case 'ping':
                const delay = (data.ping - Date.now());
                if (LOG_PING_PONG) console.log(Date.now(), 'PING 🏓', delay, data);
                setTimeout(() => {
                    if (LOG_PING_PONG) console.log(Date.now(), 'PONG 🏓');
                    socket.send(JSON.stringify({origin: 'client', data: null, content: '🏓 PONG!'}));
                }, delay);
                break;

            case 'discord':
                console.log('[DISCORD]', content, data);
                pushMessage(data);
                break;

            default:
                console.warn('[UNKOWN]', origin, data, content);
                break;

        }
    });

    socket.addEventListener('close', function(event) {
        console.log('socket has closed! Attempting again in 1s');
        setTimeout(() => initializeWebsocket(), 1000);

    });
}

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    
    // Set the body configuration
    if (params.has('transparent'))
        $('body').addClass('transparent');

    initializeWebsocket();
});