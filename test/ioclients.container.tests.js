const IOClientsContainer = require('../models/IOClientsContainer');
const assert = require('assert');
const error_messages = require('../enums/error.messages');

describe('Test IOClientsContainer', ()=>{
    let user = {
        id: '11',
        name: 'vasy',
        phone: '333'
    };

    let socket = {
        id: '111'
    };

    let container = new IOClientsContainer();

    let client = undefined;

    // Добавляем клиента в контэйнер
    beforeEach((done)=>{
        container.addClient(socket, user, (err, c) => {
            assert(err == null);
            assert(c != null);
            client = c;
            done();
        });
    });

    // Поиск клиента по id соккета
    it('Find client by socket id', (done) => {
        container.findClientBySocketId(socket.id, (err, c) => {
            assert(err == null);
            assert(c != null);
            assert(c.user.id == user.id);
            assert(c.user.name == user.name);
            assert(c.user.phone == user.phone);
            assert(c.socket.id == socket.id);
            done();
        });
    });

    // Поиск клиента по id пользователя
    it('Find client by user id', (done) => {
        container.findClientByUserId(user.id, (err, c) => {
            assert(err == null);
            assert(c != null);
            assert(c.user.id == user.id);
            assert(c.user.name == user.name);
            assert(c.user.phone == user.phone);
            assert(c.socket.id == socket.id);
            done();
        });
    });

    // Запрет на добавление клиента, если пользователь уже существует в контейнере
    it('Not add new client whith exists user', (done)=>{
        container.addClient({id: '321'}, user, (err, c) => {
            assert(err == error_messages.CLIENT_USER_EXISTS);
            assert(c == null);
            done();
        });
    });

    // Зепрет на добавление клиента по уже существующему id соккета
    it('Not add new client if id exists', (done) => {
        container.addClient(socket, null, (err, c) => {
            assert(err == error_messages.CLIENT_EXISTS);
            assert(c == null);
            done();
        });
    });

    // Ошибка, при попытке удаления не существующего клиента
    it('Not error removed not exists client', (done) => {
        container.removeClient({socket: {id: '321'}}, (err, c) => {
            assert(err == error_messages.CLIENT_NOT_FOUND);
            assert(c == null);
            done();
        });
    })

    // Удаление временных данных
    afterEach((done) => {
        container.removeClient(client, (err, c) => {
            assert(err == null);
            assert(c != null);
            container.findClientBySocketId(socket.id, (err, c) => {
                assert(err == null);
                assert(c == null);
                done();
            });
        });
    })
})