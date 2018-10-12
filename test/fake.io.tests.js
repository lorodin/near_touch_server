const FakeSocket = require('./fakes/fake.socket');
const FakeIO = require('./fakes/fake.io');
const assert = require('assert');

describe('FakeIO', () => {
    let socket_1 = new FakeSocket(1);
    let socket_2 = new FakeSocket(2);
    let io = new FakeIO(null);

    beforeEach(()=>{
        io.clear();
    });

    it('Connection', (done)=>{
        io.on('connection', (socket) => {
            assert(socket.id == socket_1.id);
            assert(io.sockets.length == 1);
            done();
        });
        io.connection(socket_1);
    });

    it('Socket command', (done) => {
        io.on('connection', (socket) => {
            assert(socket.id == socket_2.id);
            assert(io.sockets.length == 1);
            socket.on('test_cmd', (data) => {
                assert(data.id == 1);
                socket.emit('test_cmd_complete', {id: 2});
            });
            socket.on('disconnect', () => {
                done();
            });
        });

        socket_2.onClientEmit('connection', () => {
            socket_2.makeCmd('test_cmd', {id: 1});
        });

        socket_2.onClientEmit('test_cmd_complete', (data) => {
            assert(data.id == 2);
            socket_2.makeCmd('disconnect');
        })

        io.connection(socket_2);
    });
});