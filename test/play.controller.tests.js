
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
const FakeLogger = require('./fakes/fake.logger');

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
                   'intervals': [
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
                                io_client_1 = client1;
                                io_c_container.addClient(socket_2, user_2, (err, client2) => {
                                    assert(!err);
                                    io_client_2 = client2;
                                    io_room = new IORoom([io_client_1, io_client_2], room);
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

    it('Close room', (done) => {
        let old_rooms_count = db.rooms.length;
        let old_activ_rooms = io_r_container.count();
        
        socket_2.onClientEmit(emits.COMPANON_CLOSE_ROOM, () => {
            assert(logger.history.length == 0);
            assert(db.rooms.length == old_rooms_count - 1);
            assert(io_r_container.count() == old_activ_rooms - 1);
            done();
        });

        socket_1.onClientEmit(emits.GET_STATE, () => {
            let action = new ActionModel(socket_1.id, cmds.CLOSE_ROOM, {room_id: room.id});
            controller.setAction(action);
        });

        controller.setAction(new ActionModel(socket_1.id, cmds.CLIENT_REDY_TO_PLAY, {room_id: room.id}));
        controller.setAction(new ActionModel(socket_2.id, cmds.CLIENT_REDY_TO_PLAY, {room_id: room.id}));
    });

    it('Exit room', (done) => {
        let old_rooms_count = db.rooms.length;
        let old_activ_rooms = io_r_container.count();

        socket_2.onClientEmit(emits.COMPANON_PAUSE, () => {
            assert(logger.history.length == 0);
            assert(db.rooms.length == old_rooms_count);
            assert(io_r_container.count() == old_activ_rooms);
            done();
        });

        socket_1.onClientEmit(emits.GET_STATE, () => {
            let action = new ActionModel(socket_1.id, cmds.PAUSE, 
                                        {room_id: room.id});
            controller.setAction(action);
        });

        controller.setAction(new ActionModel(socket_1.id, cmds.CLIENT_REDY_TO_PLAY, 
                                            {room_id: room.id}));
        controller.setAction(new ActionModel(socket_2.id, cmds.CLIENT_REDY_TO_PLAY, 
                                            {room_id: room.id}));
    });

    it('GET_STATE after CLIENT_REDY', (done) => {
        
        let done_complete = false;
        let index = 0;

        socket_1.onClientEmit(emits.GET_STATE, (data) => {
            let action = new ActionModel(socket_1.id, cmds.TOUCH_DOWN, 
                                {cmd: cmds.TOUCH_DOWN, room_id: room.id, point: {x: 1, y:1}});
            // console.log(data);
            if(data) assert(data.near.length == 3);
            if(data) assert(data.other.length == 0);
            controller.setAction(action, () => {
                index++;
                if(index == 4){
                    if(!done_complete){
                        done_complete = true;
                        return done();
                    }
                } 
            });
        });

        socket_2.onClientEmit(emits.GET_STATE, (data) => {
            let action = new ActionModel(socket_2.id, cmds.TOUCH_DOWN, 
                                {cmd: cmds.TOUCH_DOWN, room_id: room.id, point: {x: 1, y: 1}});
            if(data) assert(data.near.length == 3);
            if(data) assert(data.other.length == 0);
            
            controller.setAction(action, () => {
                index++;
                if(index == 4){
                    if(!done_complete){
                        done_complete = true;
                        return done();
                    }
                } 
            });
        });

        controller.setAction(new ActionModel(socket_1.id, cmds.CLIENT_REDY_TO_PLAY, 
            {room_id: room.id}));
        controller.setAction(new ActionModel(socket_2.id, cmds.CLIENT_REDY_TO_PLAY, 
            {room_id: room.id}));
    });

    afterEach(() => {
        logger.history = [];
        db.rooms = [];
        db.users = [];
        db.codes = [];
        io_r_container.rooms = {};
        io_s_container.sockets = [];
        if(io_c_container.clients != null) io_c_container.clients = {};
        socket_1.clear();
        socket_2.clear();
    });
});