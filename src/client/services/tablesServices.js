import openSocket from 'socket.io-client';

const socket = openSocket('http://localhost:6701/');

export function subscribeForEvent(name, callback) {
    socket.on(name, callback);
}

export function unsubscribeForEvent(name, callback) {
    socket.removeListener(name, callback);
}