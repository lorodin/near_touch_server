const DisconnectController = require('../controllers/disconnect.controller');

const ActionModel = require('../models/action.model');

const FakeDataBase = require('./fakes/fake.database');
const FakeCodesRepository = require('./fakes/fake.codes.repository');
const FakeUsersRepository = require('./fakes/fakes.users.repository');
const FakeRoomsRepository = require('./fakes/fake.rooms.repository');
const FakeSocket = require('./fakes/fake.socket');
const FakeLogger = require('./fakes/fake.logger');

const IORoomsContainer = require('../models/IORoomsContainer');
const IOClientsContainer = require('../models/IOClientsContainer');
const SocketsContainer = require('../models/SocketsContainer');

const DataBaseService = require('../services/database.service');
const CacheService = require('../services/cache.service');

const IORoom = require('../models/IORoom');
const IOClients = require('../models/IOClient');

const emits = require('../enums/emits.enum');
const cmds = require('../enums/cmd.enum');
const error_messages = require('../enums/error.messages');

const assert = require('assert');

describe('Disconnect controller', () => {
    let logger = new FakeLogger();
    
    let db = new FakeDataBase();
    let c_repository = new FakeCodesRepository(db);
    let u_repository = new FakeUsersRepository(db);
    let r_repository = new FakeRoomsRepository(db);
    
    let db_service = new DataBaseService(u_repository, r_repository, c_repository);
    
    let r_container = new IORoomsContainer();
    let c_container = new IOClientsContainer();
    let s_container = new SocketsContainer();

    let cache_service = new CacheService(c_container, r_container, s_container);

    let controller = new DisconnectController(cache_service, db_service, logger);



    //1) before В подготовке создается активная комната с двумя пользователями
    //   при отключение пользователя, он удаляется из кэша, второму пользователю
    //   отправляется сообщение HAS_ROOM_0 (комната есть, но она не активна)
    //   состояние комнаты сохраняется в базу, комната удаляется из кэша
    //2) before Создается пользователь с комнатой но не активной
    //   пользователь удаляется из кэша
    //3) before Создается пользователь без комнаты
    //   пользователь удаляется из кэша и из sockets.container
    
    let users = [
        {'id': 1, 'name': 'Vasy', 'phone': '123', 'phone_confirm': true},
        {'id': 2, 'name': 'Igor', 'phone': '321', 'phone_confirm': true},
        {'id': 3, 'name': 'Larisa', 'phone': '222', 'phone_confirm': true},
        {'id': 4, 'name': 'Nasty', 'phone': '333', 'phone_confirm': true},
        {'id': 5, 'name': 'Oleg', 'phone': '444', 'phone_confirm': true}
    ];

    let sockets = [
        new FakeSocket(1),
        new FakeSocket(2),
        new FakeSocket(3),
        new FakeSocket(4)
    ];

    let rooms = [
        {'id': 1, 'from': 1, 'to': 2, 'confirm': true, 'points': 0},
        {'id': 2, 'from': 3, 'to': 5, 'confirm': true, 'points': 0}
    ];

    let io_clients = [
        new IOClients(users[0], sockets[0]),
        new IOClients(users[1], sockets[1]),
        new IOClients(users[2], sockets[2]),
        new IOClients(users[3], sockets[3])
    ];

    let io_rooms = [
        new IORoom([io_clients[0], io_clients[1]], rooms[0])
    ];

    beforeEach(() => {
        db.users = users;
        db.rooms = rooms;
        s_container.sockets = sockets;
        c_container.clients = io_clients;
        r_container.rooms = io_rooms;
    });

    describe('Disconnect client from active room', () => {
        it('Disconnect and save room state', (done) => {
            let action = new ActionModel(sockets[0].id, cmds.DISCONNECT);
            let s_length = s_container.count();
            let c_length = c_container.count();
            let r_length = r_container.count();
            rooms[0].points = 100;
            controller.setAction(action, () => {
                assert(logger.history.length == 0);
                assert(sockets[0].emit_history.length == 0);
                let emit_2 = sockets[1].emit_history.pop();
                assert(emit_2.cmd == emits.HAS_ROOM_0);
                assert(r_length - 1 == r_container.count());
                assert(c_length - 1 == c_container.count());
                assert(s_length - 1 == s_container.count());
                assert(db.rooms[0].points == 100);
                done();
            });
        });
    });

    describe('Disconnect client from not active room', () => {
        it('Disconnect client', (done) => {
            let action = new ActionModel(sockets[2].id, cmds.DISCONNECT);
            let s_length = s_container.count();
            let c_length = c_container.count();
            let r_length = r_container.count();
            controller.setAction(action, () => {
                assert(logger.history.length == 0);
                assert(sockets[2].emit_history.length == 0);
                assert(r_length == r_container.count());
                assert(c_length - 1 == c_container.count());
                assert(s_length - 1 == s_container.count());
                done();
            });
        });
    });

    describe('Disconnect client without room', () => {
        it('Disconnect client', (done) => {
            let action = new ActionModel(sockets[3].id, cmds.DISCONNECT);
            let s_length = s_container.count();
            let r_length = r_container.count();
            let c_length = c_container.count();
            controller.setAction(action, () => {
                assert(logger.history.length == 0);
                assert(sockets[3].emit_history.length == 0);
                assert(s_length == s_container.count());
                assert(r_length == r_container.count());
                assert(c_length == c_container.count());
                done();
            });
        });
    });

    afterEach(() => {
        db.users = [];
        db.rooms = [];
        s_container.sockets = [];
        c_container.clients = [];
        r_container.rooms = [];
    });
});

let lengthPropertyes = (obj) => {
    return Object.keys(obj).length;
}