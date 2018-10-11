
const PlayController = require('../controllers/play.controller');
const assert = require('assert');

const emits = require('../enums/emits.enum');
const cmds = require('../enums/cmd.enum');
const error_messages = require('../enums/error.messages');
const routings = require('../enums/routings.enum');

const FakeDataBase = require('./fakes/fake.database');
const FakeUsersRepository = require('./fakes/fakes.users.repository');
const FakeRoomsRepository = require('./fakes/fake.rooms.repository');
const FakeCodesRepository = require('./fakes/fake.codes.repository');
const FakeSocket = require('./fakes/fake.socket');

const IORoomsContainer = require('../models/IORoomsContainer');
const IOClientsContainer = require('../models/IOClientsContainer');
const SocketsContainer = require('../models/SocketsContainer');
const IOClient = require('../models/IOClient');
const IORoom = require('../models/IORoom');
const DataBaseService = require('../services/database.service');
const CacheService = require('../services/cache.service');
const ActionModel = require('../models/action.model');

describe('Play controller', () => {
    let db = new FakeDataBase();
    let u_repository = new FakeUsersRepository(db);
    let r_repository = new FakeRoomsRepository(db);
    let c_repository = new FakeCodesRepository(db);
    let db_service = new DataBaseService(u_repository, r_repository, c_repository);

    let io_r_container = new IORoomsContainer();
    let io_c_container = new IOClientsContainer();
    let io_s_container = new SocketsContainer();
    let cache_service = new CacheService(io_c_container, io_r_container, io_s_container);

    let configs = {'get_state_interval': 0, 
                   'intevals': [
                       {'length': 2,  'points': 10},
                       {'length': 5,  'points': 5},
                       {'length': 10, 'points': 1}
                   ]};
    
    let logger = new FakeLogger();

    let controller = new PlayController(db_service, cache_service, logger, configs);

    let user_1 = {
        'name': 'Igor',
        'phone': '111',
        'phone_confirm': true
    };

    let user_2 = {
        'name': 'Larisa',
        'phone': '222',
        'phone_confirm': true
    };

    let room = undefined;
    let io_room = undefined;

    let socket_1 = new FakeSocket(1);
    let socket_2 = new FakeSocket(2);

    let io_client_1 = undefined;
    let io_client_2 = undefined;

    beforeEach((done)=>{
        logger.history = [];
        io_s_container.push(socket_1, (err, socket1) => {
            assert(!err);
            socket_1 = socket1;
            io_s_container.push(socket_2, (err, socket2) => {
                assert(!err);
                socket_2 = socket2;
                u_repository.saveUser(user_1, (err, user1) => {
                    assert(!err);
                    user_1 = user1;
                    u_repository.saveUser(user_2, (err, user2) => {
                        assert(!err);
                        user_2 = user2;
                        room = {
                            'from': user_1.id,
                            'to': user_2.id,
                            'confirm': true,
                            'points': 0
                        };
                        r_repository.saveRoom(room, (err, r) => {
                            assert(!err);
                            room = r;
                            io_c_container.addClient(socket_1, user_1, (err, client1) => {
                                assert(!err);
                                client_1 = client1;
                                io_c_container.addClient(socket_2, user_2, (err, client2) => {
                                    assert(!err);
                                    client_2 = client2;
                                    io_room = new IORoom([client_1, client2], room);
                                    io_r_container.addRoom(io_room, (err, io_r) => {
                                        assert(!err);
                                        io_room = io_r;
                                        done();
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });

    it('Server on touch down', (done) => {
        let data_1 = {cmd: cmds.TOUCH_DOWN, x: 2, y: 2, room_id: room.id};
        let data_2 = {cmd: cmds.TOUCH_DOWN, x: 1, y: 1, room_id: room.id};
        
        let number_action = 0;

        socket_1.on(routings.PLAY, (req) => {
            let action = new ActionModel(socket_1.id, req.cmd, req.data);
            controller.setAction(action, () => {
                assert(logger.history.length == 0);
                let emit = socket_2.emit_history.pop();
                assert(emit.cmd == emits.COMPANON_TOUCH_DOWN);
                assert(emit.data.x == 2);
                assert(emit.data.y == 2);
                assert(emit.data.room.points == room.points);
                assert(emit.data.room.id == room.id);
                assert(emit.data.companon.id == user_1.id);
                if(number_action++ >= 2) done();
            });
        });
        
        socket_2.on(routings.PLAY, (req) => {
            let action = new ActionModel(socket_2.id, req.cmd, req.data);
            controller.setAction(action, () => {
                assert(logger.history.length == 0);
                let emit = socket_1.emit_history.pop();
                assert(emit.cmd == emits.COMPANON_TOUCH_DOWN);
                assert(emit.data.x == 1);
                assert(emit.data.y == 1);
                assert(emit.data.room.points == room.points);
                assert(emit.data.room.id == room.id);
                assert(emit.data.companon.id == user_2.id);
                if(number_action++ >= 2) done();
            });
        });

        socket_1.makeCmd(routings.PLAY, data_1);
        socket_2.makeCmd(routings.PLAY, data_2);
    });

    it('GET_STATE after CLIENT_REDY', (done) => {
        let data_1 = {cmd: cmds.TOUCH_DOWN, x: 3, y: 4, room_id: room.id};
        let data_2 = {cmd: cmds.TOUCH_UP, room_id: room.id};

        let num_actions = 0;

        socket_1.onClientEmit(emits.GET_STATE, () => {
            socket_1.makeCmd(routings.PLAY, data_1);
        });
        
        socket_2.onClientEmit(emits.GET_STATE, () => {
            socket_2.makeCmd(routings.PLAY, data_2);
        });

        socket_1.on(routings.PLAY, (req)=>{
            let action = new ActionModel(socket_1.id, req.cmd, req);
            controller.setAction(action, () => {
                assert(logger.history.length == 0);
                let emit = socket_2.emit_history.pop();
                assert(emit.cmd == emits.COMPANON_TOUCH_DOWN);
                assert(emit.data.x == data_1.x);
                assert(emit.data.y == data_1.y);
                if(num_actions++ >= 2) done();
            });
        });

        socket_2.on(routings.PLAY, (req) => {
            let action = new ActionModel(socket_2.id, req.cmd, req);
            controller.setAction(action, () => {
                assert(logger.history.length == 0);
                let emit = socket_1.emit_history.pop();
                assert(emit.cmd == emits.COMPANON_TOUCH_UP);
                if(num_actions++ >= 2) done();
            });
        });

        socket_1.makeCmd(routings.PLAY, {cmd: cmds.CLIENT_REDY_TO_PLAY});
        socket_2.makeCmd(routings.PLAY, {cmd: cmds.CLIENT_REDY_TO_PLAY});
    });

    it('Calculate room points', (done) => {
        let data_1 = {cmd: cmds.TOUCH_DOWN, x: 1, y: 1, room_id: room.id};
        let data_2 = {cmd: cmds.TOUCH_DOWN, x: 2, y: 2, room_id: room.id};

        let old_room_points = room.points;
        let num_actions = 0;

        socket_1.onClientEmit(emits.GET_STATE, () => {
            socket_1.makeCmd(routings.PLAY, data_1);
        });

        socket_2.onClientEmit(emits.GET_STATE, () => {
            socket_2.makeCmd(routings.PLAY, data_2);
        });

        socket_1.on(routings.PLAY, (req) => {
            let action = new ActionModel(socket_1.id, req.cmd, req);
            controller.setAction(action, () => {
                assert(logger.history.length == 0);
                let emit = socket_2.emit_history.pop();
                assert(emit.cmd == emits.COMPANON_TOUCH_DOWN);
                assert(emit.data.x == data_1.x);
                assert(emit.data.y == data_1.y);
                assert(emit.data.room_id == room.id);
                
                if(num_action++ >= 2){
                    assert(room.points == old_room_points + configs.intevals[0].points);
                    done();
                }else{
                    assert(room.points == old_room_points);
                }
            });
        });

        socket_2.on(routings.PLAY, (req) => {
            let action = new ActionModel(socket_2.id, req.cmd, req);
            controller.setAction(action, () => {
                assert(logger.history.length == 0);
                let emit = socket_1.emit_history.pop();
                assert(emit.cmd == emits.COMPANON_TOUCH_DOWN);
                assert(emit.data.x == data_1.x);
                assert(emit.data.y == data_1.y);
                assert(emit.data.room_id == room.id);
                if(num_actions++ >= 2){
                    assert(room.points == old_room_points + configs.intevals[0].points);
                    done();
                }else{
                    assert(room.points == old_room_points);
                }
            });
        });

        socket_1.makeCmd(routings.PLAY, {cmd: cmds.CLIENT_REDY_TO_PLAY});
        socket_2.makeCmd(routings.PLAY, {cmd: cmds.CLIENT_REDY_TO_PLAY});
    });

    afterEach(() => {
        logger.history = [];
        db.rooms = [];
        db.users = [];
        db.codes = [];
        io_r_container.rooms = {};
        io_s_container.sockets = [];
        io_c_container.clients = {};
        socket_1.clear();
        socket_2.clear();
    });
});