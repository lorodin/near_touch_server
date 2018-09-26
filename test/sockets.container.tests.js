const assert = require('assert');
const error_messages = require('../enums/error.messages');
const SocketsContainer = require('../models/SocketsContainer');

describe('Sockets container', () => {
    let socket_1 = {id: 1};
    let socket_2 = {id: 2};
    let incorrect_socket = {};
    let container = new SocketsContainer();
    beforeEach((done) => {
        container.push(socket_1, (err, socket) => {
            assert(err == null);
            assert(socket.id == socket_1.id);
            assert(container.sockets.length == 1);
            container.push(socket_2, (err, socket) => {
                assert(err == null);
                assert(socket.id == socket_2.id);
                assert(container.sockets.length == 2);
                done();
            });
        });
    });

    describe('Find socket', () => {
        it('Find correct socket', (done) => {
            container.get(socket_1.id, (err, socket) => {
                assert(err == null);
                assert(socket.id == socket_1.id);
                done();
            });
        });
        it('Not find icorrect socket', (done) => {
            container.get(incorrect_socket, (err, socket) => {
                assert(err == null);
                assert(socket == null);
                done();
            });
        });
    });

    it('Not add incorrect socket', (done) => {
        container.push(incorrect_socket, (err, socket) => {
            assert(err == error_messages.ERROR_MODEL);
            assert(socket == null);
            assert(container.sockets.length == 2);
            done();
        });
    });

    describe('Remove socket', () => {
        it('Remove correct socket', (done) => {
            container.remove(socket_1.id, (err, socket, index) => {
                assert(err == null);
                assert(socket.id == socket_1.id);
                assert(index == 0);
                assert(container.sockets.length == 1);
                done();
            });
        });
        it('Not remove incorrect socket', (done) => {
            container.remove(incorrect_socket.id, (err, socket, index) => {
                assert(err == null);
                assert(socket == null);
                assert(index == undefined);
                assert(container.sockets.length == 2);
                done();
            });
        });
    });

    afterEach(() => {
        container.sockets = [];
    })
});