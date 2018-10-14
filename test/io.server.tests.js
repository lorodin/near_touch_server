const IOServer = require('../servers/io.server');
const assert = require('assert');

const emits = require('../enums/emits.enum');
const cmds = require('../enums/cmd.enum');
const error_messages = require('../enums/error.messages');
const routings = require('../enums/routings.enum');
const room_states = require('../enums/room.states.enum');

const FakeDB = require('./fakes/fake.database');
const FakeCodesRepository = require('./fakes/fake.codes.repository');
const FakeUsersRepository = require('./fakes/fakes.users.repository');
const FakeRoomsRepository = require('./fakes/fake.rooms.repository');
const FakeSMSService = require('./fakes/fake.sms.service');
const FakeSocket  = require('./fakes/fake.socket');
const FakeLogger = require('./fakes/fake.logger');
const FakeIO = require('./fakes/fake.io');

const ClientsContainer = require('../models/IOClientsContainer');
const RoomsContainer  = require('../models/IORoomsContainer');
const SocketsContainer = require('../models/SocketsContainer');
const IOClient = require('../models/IOClient');
const IORoom = require('../models/IORoom');
const ActionModel = require('../models/action.model');

const DataBaseService = require('../services/database.service');
const ServiceContainer = require('../services/services.container');
const CacheService = require('../services/cache.service');

const StartController = require('../controllers/start.controller');
const RegisterController = require('../controllers/register.controller');
const RoomsController = require('../controllers/room.confirm.controller');
const PlayController = require('../controllers/play.controller');
const DisconnectController = require('../controllers/disconnect.controller');
const ControllersContainer = require('../controllers/controllers.container');

describe('IOServer', () => {
    let db = new FakeDB();
    let u_repository = new FakeUsersRepository(db);
    let c_repository = new FakeCodesRepository(db);
    let r_repository = new FakeRoomsRepository(db);
    let logger = new FakeLogger();
    let io = new FakeIO(null);
    let sms = new FakeSMSService();
    let c_container = new ClientsContainer();
    let r_container = new RoomsContainer();
    let s_container = new SocketsContainer();
    let db_service = new DataBaseService(u_repository, r_repository, c_repository);
    let cache_service = new CacheService(c_container, r_container, s_container);
    let configs = {
        'code_live': 100,
        'phone_confirm_length': 5,
        'get_state_interval': 0, 
                   'intervals': [
                       {'length': 2,  'points': 10},
                       {'length': 5,  'points': 5},
                       {'length': 10, 'points': 1}
                   ]
    };
    let start_controller = new StartController(cache_service, db_service, logger, configs);
    let register_controller = new RegisterController(cache_service, db_service, sms, logger, configs);
    let room_controller = new RoomsController(cache_service, db_service, logger);
    let play_controller = new PlayController(db_service, cache_service, logger, configs);
    let disconnect_controller = new DisconnectController(cache_service, db_service, logger);

    let controllers = new ControllersContainer(start_controller, register_controller, room_controller, play_controller, disconnect_controller);

    let io_server = new IOServer(io, controllers, cache_service, logger, configs);
    
    let user_1 = {
        name: 'Vasy',
        phone: '1111'
    };

    let user_2 = {
        name: 'Igor',
        phone: '2222'
    };

    let user_3 = {
        name: 'Larisa',
        phone: '3333'
    };

    let user_4 = {
        name: 'Olga',
        phone: '4444'
    };

    beforeEach(()=>{
        user_1.phone_confirm = false;
        user_2.phone_confirm = false;
        user_3.phone_confirm = false;
        user_4.phone_confirm = false;
        r_container.rooms = {};
        s_container.sockets = [];
        c_container.clients = {};
        db.rooms = [];
        db.users = [];
        db.codes = [];
        logger.history = [];
        io.clear();
        io_server.start();
    });

    describe('Start actions', () => {
        it('User unregistrate', (done) => {

            let f_socket = new FakeSocket(1);
            
            f_socket.onClientEmit(emits.USER_UNREGISTRATE, () => {
                done();
            });
            
            f_socket.onClientEmit('connection', () => {
                f_socket.makeCmd(routings.START, {});
            });

            io.connection(f_socket);
        });
        it('User not confirm phone', (done) => {
            let f_socket = new FakeSocket(1);
            
            u_repository.saveUser(user_1, (err, user) => {
                c_repository.saveCode({user_id: user.id, code: '1111'}, (err, code) => {
                    assert(!err);
               
                    f_socket.onClientEmit(emits.PHONE_UNCONFIRMED, () => {
                        done();
                    });

                    f_socket.onClientEmit(emits.CONNECTION, () => {
                        f_socket.makeCmd(routings.START, {phone: user.phone, user_id: user.id});
                    });

                    io.connection(f_socket);
                });
            });
        });
        it('User has`t room', (done) => {
            let f_socket = new FakeSocket(1);
            user_1.phone_confirm = true;
            u_repository.saveUser(user_1, (err, user) => {
                assert(!err);
                
                f_socket.onClientEmit(emits.USER_UNREGISTRATE, () => {
                    assert(false);
                });
                
                f_socket.onClientEmit(emits.NO_ROOM, () => {
                    done();
                });
                
                f_socket.onClientEmit(emits.CONNECTION, () => {
                    f_socket.makeCmd(routings.START, {phone: user.phone, user_id: user.id});
                });

                io.connection(f_socket);
            });
        });
        it('User has room, but room not active', (done) => {
            let f_socket = new FakeSocket(1);
            user_1.phone_confirm = true;
            user_2.phone_confirm = true;
            u_repository.saveUser(user_1, (err, u1) => {
                assert(!err);
                u_repository.saveUser(user_2, (err, u2) => {
                    assert(!err);
                    let room = {from: u1.id, to: u2.id, confirm: true, points: 0};
                    r_repository.saveRoom(room, (err, r)=>{
                        assert(!err, 'Error not null: ' + err);
                        f_socket.onClientEmit(emits.HAS_ROOM_0, (data) => {
                            assert(data.room_id == r.id);
                            done();
                        });
                        f_socket.onClientEmit(emits.CONNECTION, () => {
                            f_socket.makeCmd(routings.START, {user_id: u1.id, phone: u1.phone});
                        });
                        io.connection(f_socket);
                    })
                });
            });
        });
        it('User has room, and room active', (done) => {
            let f_socket1 = new FakeSocket(1);
            let f_socket2 = new FakeSocket(2);
            let num_users_in_room = 0;
            
            user_1.phone_confirm = true;
            user_2.phone_confirm = true;

            u_repository.saveUser(user_1, (err, u1) => {
                assert(!err);
                u_repository.saveUser(user_2, (err, u2) => {
                    assert(!err);
                    let room = {from: u1.id, to: u2.id, confirm: true};
                    r_repository.saveRoom(room, (err, r) => {
                        assert(!err);
                        f_socket1.onClientEmit(emits.HAS_ROOM_1, (data) => {
                            assert(data.room_id == r.id);
                            num_users_in_room++;
                            if(num_users_in_room == 2) done();
                        });
                        f_socket2.onClientEmit(emits.HAS_ROOM_1, (data) => {
                            assert(data.room_id == r.id);
                            num_users_in_room++;
                            if(num_users_in_room == 2) done();
                        });
                        f_socket1.onClientEmit(emits.HAS_ROOM_0, (data) => {
                            assert(data.room_id == room.id);
                        });
                        f_socket2.onClientEmit(emits.HAS_ROOM_0, (data) => {
                            assert(data.room_id == room.id);
                        });
                        f_socket1.onClientEmit(emits.CONNECTION, () => {
                            f_socket1.makeCmd(routings.START, {user_id: u1.id, phone: u1.phone});
                        });
                        f_socket2.onClientEmit(emits.CONNECTION, () => {
                            f_socket2.makeCmd(routings.START, {user_id: u2.id, phone: u2.phone});
                        });
                        io.connection(f_socket1);
                        io.connection(f_socket2);
                    });
                });
            });
        });
        it('User send sentence but it`s not confirmed', (done) => {
            let f_socket = new FakeSocket(1);

            user_1.phone_confirm = true;
            user_2.phone_confirm = true;

            u_repository.saveUser(user_1, (err, u1) => {
                assert(!err);
                u_repository.saveUser(user_2, (err, u2) => {
                    assert(!err);
                    let room = {from: u1.id, to: u2.id, confirm: false};
                    r_repository.saveRoom(room, (err, r) => {
                        assert(!err);
                        f_socket.onClientEmit(emits.YOUR_SENTENCE_NOT_CONFIRM, () => {
                            done();
                        });
                        f_socket.onClientEmit(emits.CONNECTION, () => {
                            f_socket.makeCmd(routings.START, {user_id: u1.id, phone: u1.phone});
                        });
                        io.connection(f_socket);
                    });
                });
            });
        });
        it('User has sentence', (done) => {
            let f_socket = new FakeSocket(1);
            user_1.phone_confirm = true;
            user_2.phone_confirm = true;
            u_repository.saveUser(user_1, (err, u1) => {
                assert(!err);
                u_repository.saveUser(user_2, (err, u2) => {
                    assert(!err);
                    let room = {from: u1.id, to: u2.id, confirm: false};
                    r_repository.saveRoom(room, (err, r) => {
                        f_socket.onClientEmit(emits.HAS_SENTENCE, () => {
                            done();
                        });
                        f_socket.onClientEmit(emits.CONNECTION, () => {
                            f_socket.makeCmd(routings.START, {user_id: u2.id, phone: u2.phone});
                        });
                        io.connection(f_socket);
                    });
                })
            })
        });
    });
    
    describe('Register actions', () => {
        it('Error model', (done) => {
            let f_socket = new FakeSocket(1);

            f_socket.onClientEmit(emits.ERROR, (data) => {
                assert(data.msg == error_messages.ERROR_MODEL);
                done();
            });

            f_socket.onClientEmit(emits.CONNECTION, () => {
                f_socket.makeCmd(routings.REGISTER, {cmd: cmds.REGISTER, 
                    data: {name:  '', phone: ''}});
            });
            io.connection(f_socket);
        });

        it('Registrate user', (done) => {
            let f_socket = new FakeSocket(1);

            f_socket.onClientEmit(emits.NO_ROOM, () => {
                assert(db.users.length == 1);
                assert(db.codes.length == 0);
                assert(db.users[0].phone_confirm);
                done();
            });

            f_socket.onClientEmit(emits.INPUT_PHONE_CONFIRM_CODE, () => {
                let code = sms.msgs.pop().msg;
                assert(db.codes.length == 1);
                assert(db.codes[0].code == code);
                f_socket.makeCmd(routings.REGISTER, {cmd: cmds.VALIDATE_CODE, 
                                                     data: {code: code, 
                                                            user_id: db.users[0].id, 
                                                            phone: db.users[0].phone}});
            });

            f_socket.onClientEmit(emits.PHONE_UNCONFIRMED, () => {
                assert(db.users.length == 1);
                assert(db.users[0].name == user_1.name);
                assert(db.users[0].phone == user_1.phone);
                assert(db.users[0].phone_confirm == false);
                f_socket.makeCmd(routings.REGISTER, {
                    cmd: cmds.GET_CODE,
                    data: {
                        user_id: db.users[0].id,
                        phone: db.users[0].phone
                    }
                });
            });
            
            f_socket.onClientEmit(emits.CONNECTION, () => {
                f_socket.makeCmd(routings.REGISTER, {cmd: cmds.REGISTER, data: {name: user_1.name, phone: user_1.phone}});
            });
            
            io.connection(f_socket);
        });
    });

    describe('Rooms created/confirms/cancel', () => {
        it('Room created and confirms', (done) => {
    
            let f_socket1 = new FakeSocket(1);
            let f_socket2 = new FakeSocket(2);
            
            user_1.phone_confirm = true;
            user_2.phone_confirm = true;
            
            let count_querys = 0;
    
            u_repository.saveUser(user_1, (err, u1) => {
                assert(!err);
                u_repository.saveUser(user_2, (err, u2) => {
                    assert(!err);
                    
                    f_socket1.onClientEmit(emits.HAS_ROOM_1, (data) => {
                        assert(db.rooms.length == 1);
                        let room = db.rooms[0];
                        assert(room.id == data.room_id);
                        assert(r_container.count() == 1);
                        count_querys++;
                        if(count_querys >= 2) done();
                    });
    
                    f_socket2.onClientEmit(emits.HAS_ROOM_1, (data) => {
                        assert(db.rooms.length == 1);
                        let room = db.rooms[0];
                        assert(room.id == data.room_id);
                        assert(r_container.count() == 1);
                        count_querys++;
                        if(count_querys >= 2) done();
                    })
    
                    f_socket2.onClientEmit(emits.HAS_SENTENCE, (data) => {
                        assert(db.rooms.length == 1);
                        let room = db.rooms[0];
                        assert(data.from_phone == u1.phone);
                        assert(data.room_id == room.id);
                        f_socket2.makeCmd(routings.ROOM, {
                            cmd: cmds.CONFIRM_ROOM,
                            data: {
                                user_id: u2.id,
                                room_id: room.id
                            }
                        });
                    });
    
                    let count_not_rooms = 0;
    
                    f_socket1.onClientEmit(emits.NO_ROOM, () => {
                        count_not_rooms++;
                        if(count_not_rooms == 2){
                            f_socket1.makeCmd(routings.ROOM, {
                                cmd: cmds.CREATE_ROOM,
                                data: {
                                    from: u1.id,
                                    to_phone: u2.phone
                                }
                            });
                        }
                    });
                    
                    f_socket2.onClientEmit(emits.NO_ROOM, () => {
                        count_not_rooms++;
                        if(count_not_rooms == 2){
                            f_socket1.makeCmd(routings.ROOM, {
                                cmd: cmds.CREATE_ROOM,
                                data: {
                                    from: u1.id,
                                    to_phone: u2.phone
                                }
                            });
                        }
                    });
    
                    f_socket1.onClientEmit(emits.CONNECTION, () => {
                        assert(logger.history.length == 0, logger.history[0]);
                        f_socket1.makeCmd(routings.START, {user_id: u1.id, phone: u1.phone});
                    });
                    
                    f_socket2.onClientEmit(emits.CONNECTION, () => {
                        assert(logger.history.length == 0);
                        f_socket2.makeCmd(routings.START, {user_id: u2.id, phone: u2.phone});
                    });
    
                    io.connection(f_socket2);
                    io.connection(f_socket1);
                });
            });
        });
        it('Room create and cancel', (done) => {
            user_1.phone_confirm = true;
            user_2.phone_confirm = true;
            let f_socket1 = new FakeSocket(1);
            let f_socket2 = new FakeSocket(2);
            u_repository.saveUser(user_1, (err, u1) => {
                assert(!err);
                u_repository.saveUser(user_2, (err, u2) => {
                    assert(!err);

                    let count_no_room_1 = 0;
                    let count_no_room_2 = 0;

                    f_socket2.onClientEmit(emits.HAS_SENTENCE, (data) => {
                        assert(db.rooms.length == 1);
                        let room = db.rooms[0];
                        assert(room.id = data.room_id);
                        assert(data.from_phone == u1.phone);
                        f_socket2.makeCmd(routings.ROOM, {
                            cmd: cmds.CANCEL_ROOM,
                            data: {
                                room_id: room.id,
                                user_id: u2.id
                            }
                        });
                    });

                    f_socket1.onClientEmit(emits.NO_ROOM, () => {
                        if(count_no_room_1 == 0){
                            count_no_room_1++;
                            f_socket1.makeCmd(routings.ROOM, {
                                cmd: cmds.CREATE_ROOM,
                                data: {
                                    from: u1.id,
                                    to_phone: u2.phone
                                }
                            })
                        }else{
                            assert(db.rooms.length == 0);
                            assert(r_container.count() == 0);
                            count_no_room_1 = 2;
                            if(count_no_room_2 == 2) done();
                        }
                    });

                    f_socket2.onClientEmit(emits.NO_ROOM, () => {
                        if(count_no_room_2 == 0) count_no_room_2 = 1;
                        else{
                            assert(db.rooms.length == 0);
                            assert(r_container.count() == 0);
                            count_no_room_2 = 2;
                            if(count_no_room_1 == 2) done();
                        }
                    });

                    f_socket1.onClientEmit(emits.CONNECTION, () => {
                        assert(logger.history.length == 0);
                        f_socket1.makeCmd(routings.START, {user_id: u1.id, phone: u1.phone});
                    });

                    f_socket2.onClientEmit(emits.CONNECTION, () => {
                        assert(logger.history.length == 0);
                        f_socket2.makeCmd(routings.START, {user_id: u2.id, phone: u2.phone});
                    });

                    io.connection(f_socket1);
                    io.connection(f_socket2);
                });
            });
        });
        it('Room created and cancel created user', (done) => {
            user_1.phone_confirm = true;
            user_2.phone_confirm = true;

            u_repository.saveUser(user_1, (err, u1) => {
                assert(!err);
                u_repository.saveUser(user_2, (err, u2) => {
                    let f_socket1 = new FakeSocket(1);
                    let f_socket2 = new FakeSocket(2);
        
                    let count_no_room_1 = 0;
                    let count_no_room_2 = 0;
        
                    let companon_has_sentence = false;

                    f_socket1.onClientEmit(emits.YOUR_SENTENCE_NOT_CONFIRM, (data) => {
                        let find_room = db.rooms.find(r => r.id == data.room_id);
                        assert(data.to_phone == u2.phone);
                        assert(find_room);
                        f_socket1.makeCmd(routings.ROOM, {
                            cmd: cmds.CANCEL_ROOM,
                            data: {
                                room_id: data.room_id,
                                user_id: u1.id
                            }
                        });
                    });

                    f_socket2.onClientEmit(emits.HAS_SENTENCE, (data) => {
                        assert(db.rooms.length == 1);
                        let room = db.rooms[0];
                        assert(room.id = data.room_id);
                        assert(data.from_phone == u1.phone);
                        companon_has_sentence = true;
                    });

                    f_socket1.onClientEmit(emits.NO_ROOM, () => {
                        if(count_no_room_1 == 0){
                            count_no_room_1++;
                            f_socket1.makeCmd(routings.ROOM, {
                                cmd: cmds.CREATE_ROOM,
                                data: {
                                    from: u1.id,
                                    to_phone: u2.phone
                                }
                            });
                        }else{
                            assert(db.rooms.length == 0);
                            assert(r_container.count() == 0);
                            count_no_room_1 = 2;
                            if(count_no_room_2 == 2){
                                assert(companon_has_sentence);
                                done();
                            } 
                        }
                    });

                    f_socket2.onClientEmit(emits.NO_ROOM, () => {
                        if(count_no_room_2 == 0) count_no_room_2 = 1;
                        else{
                            assert(db.rooms.length == 0);
                            assert(r_container.count() == 0);
                            count_no_room_2 = 2;
                            if(count_no_room_1 == 2) {
                                assert(companon_has_sentence);
                                done();
                            }
                        }
                    });

                    f_socket1.onClientEmit(emits.CONNECTION, () => {
                        assert(logger.history.length == 0);
                        f_socket1.makeCmd(routings.START, {user_id: u1.id, phone: u1.phone});
                    });

                    f_socket2.onClientEmit(emits.CONNECTION, () => {
                        assert(logger.history.length == 0);
                        f_socket2.makeCmd(routings.START, {user_id: u2.id, phone: u2.phone});
                    });

                    io.connection(f_socket1);
                    io.connection(f_socket2);
                });
            });
        })
    });
    
    describe('Play/pause/resume/exit room', () => {
        it('Start with exist room', (done) => {
            user_1.phone_confirm = true;
            user_2.phone_confirm = true;
            register_two_users(user_1, user_2, (u1, u2) => {
                let room = {
                    from: u1.id,
                    to: u2.id,
                    confirm: true
                };
                r_repository.saveRoom(room, (err, r) => {
                    assert(!err);
                    room = r;

                    let s1 = new FakeSocket(1);
                    let s2 = new FakeSocket(2);

                    let count_get_state_1 = 0;
                    let count_get_state_2 = 0;
                    let pause_fix = false;
                    
                    s2.onClientEmit(emits.COMPANON_PAUSE, () => {
                        pause_fix = true;
                        r_container.findRoomById(room.id, (err, r) => {
                            assert(!err);
                            assert(r.state == room_states.PAUSE);
                            s1.makeCmd(routings.PLAY, {
                                cmd: cmds.CLIENT_REDY_TO_PLAY,
                                data: {
                                    room_id: room.id
                                }
                            })
                        })
                    });

                    s1.onClientEmit(emits.GET_STATE, () => {
                        count_get_state_1++;
                        if(count_get_state_1 == 1){
                            s1.makeCmd(routings.PLAY, {
                                cmd: cmds.PAUSE,
                                data: {
                                    room_id: room.id
                                }
                            });
                        }else{
                            assert(pause_fix);
                            r_container.findRoomById(room.id, (err, r) => {
                                assert(!err);
                                assert(r.state == room_states.PLAY);
                                if(count_get_state_2 >= 2) done();
                            });
                        }
                    });

                    s2.onClientEmit(emits.GET_STATE, () => {
                        count_get_state_2++;
                        if(count_get_state_2 >= 2){
                            assert(pause_fix);
                            r_container.findRoomById(room.id, (err, r) => {
                                assert(!err);
                                assert(r.state == room_states.PLAY);
                                if(count_get_state_1 >= 2) done();
                            })
                        }
                    }); 

                    s1.onClientEmit(emits.HAS_ROOM_1, (data) => {
                        assert(room.id == data.room_id);
                        s1.makeCmd(routings.PLAY, {
                            cmd: cmds.CLIENT_REDY_TO_PLAY,
                            data: {
                                room_id: room.id
                            }
                        })
                    });

                    s2.onClientEmit(emits.HAS_ROOM_1, (data) => {
                        assert(room.id == data.room_id);
                        s2.makeCmd(routings.PLAY, {
                            cmd: cmds.CLIENT_REDY_TO_PLAY,
                            data: {
                                room_id: room.id
                            }
                        });
                    });

                    s1.onClientEmit(emits.CONNECTION, () => {
                        s1.makeCmd(routings.START, {
                            user_id: u1.id,
                            phone: u1.phone
                        });
                    });

                    s2.onClientEmit(emits.CONNECTION, () => {
                        s2.makeCmd(routings.START, {
                            user_id: u2.id,
                            phone: u2.phone
                        });
                    });

                    io.connection(s1);
                    io.connection(s2);
                })
            });
        });
        
        it('Pause together and resume', (done) => {
            user_1.phone_confirm = true;
            user_2.phone_confirm = true;
            register_two_users(user_1, user_2, (u1, u2) => {
                let s1 = new FakeSocket(1);
                let s2 = new FakeSocket(2);

                let room = {
                    from: u1.id,
                    to: u2.id,
                    confirm: true
                };

                r_repository.saveRoom(room, (err, r) => {
                    assert(!err);
                    room = r;

                    let count_get_state_1 = 0;
                    let count_get_state_2 = 0;

                    let count_pause = 0;

                    s1.onClientEmit(emits.COMPANON_PAUSE, (data) => {
                        count_pause++;
                        r_container.findRoomById(room.id, (err, r) => {
                            assert(!err);
                            assert(r.state == room_states.PAUSE);
                            s2.makeCmd(routings.PLAY, {
                                cmd: cmds.CLIENT_REDY_TO_PLAY,
                                data: {
                                    user_id: u2.id,
                                    room_id: room.id
                                }
                            });
                        })
                    });

                    s2.onClientEmit(emits.COMPANON_PAUSE, (data) => {
                        count_pause++;
                        r_container.findRoomById(room.id, (err, r) => {
                            assert(!err);
                            assert(r.state == room_states.PAUSE);
                            s1.makeCmd(routings.PLAY, {
                                cmds: cmds.CLIENT_REDY_TO_PLAY,
                                data: {
                                    user_id: u1.id,
                                    room_id: room.id
                                }
                            })
                        })
                    });

                    s1.onClientEmit(emits.GET_STATE, () => {
                        count_get_state_1++;
                        if(count_get_state_1 == 1){
                            setTimeout(() => {
                                s1.makeCmd(routings.PLAY, {
                                    cmd: cmds.PAUSE,
                                    data:{
                                        user_id: u1.id,
                                        room_id: room.id
                                    }
                                });
                            }, 0);
                        }else{
                            r_container.findRoomById(room.id, (err, r) => {
                                assert(!err);
                                assert(r.state == room_states.PLAY);
                                if(count_get_state_2 >= 2){
                                    assert(count_pause == 2, 'Count pause not 2: ' + count_pause);
                                    done();
                                } 
                            });
                        }
                    });

                    s2.onClientEmit(emits.GET_STATE, () => {
                        count_get_state_2++;
                        if(count_get_state_2 == 1){
                            setTimeout(() => {
                                s2.makeCmd(routings.PLAY, {
                                    cmd: cmds.PAUSE,
                                    data: {
                                        room_id: room.id,
                                        user_id: u2.id
                                    }
                                });
                            }, 0);
                        }else{
                            r_container.findRoomById(room.id, (err, r) => {
                                assert(!err);
                                assert(r.state == room_states.PLAY);
                                if(count_get_state_1 >= 2){
                                    assert(count_pause == 2, 'Count pause not 2: ' + count_pause);
                                    done();
                                } 
                            })
                        }
                    })

                    s1.onClientEmit(emits.HAS_ROOM_1, (data) => {
                        assert(data.room_id == room.id);
                        s1.makeCmd(routings.PLAY, {
                            cmd: cmds.CLIENT_REDY_TO_PLAY,
                            data: {
                                user_id: u1.id,
                                room_id: data.room_id
                            }
                        });
                    });

                    s2.onClientEmit(emits.HAS_ROOM_1, (data) => {
                        assert(data.room_id == room.id);
                        s2.makeCmd(routings.PLAY, {
                            cmd: cmds.CLIENT_REDY_TO_PLAY,
                            data:{
                                user_id: u1.id,
                                room_id: data.room_id
                            }
                        })
                    })

                    s1.onClientEmit(emits.CONNECTION, () => {
                        s1.makeCmd(routings.START, {
                            user_id: u1.id,
                            phone: u1.phone
                        });
                    });

                    s2.onClientEmit(emits.CONNECTION, () => {
                        s2.makeCmd(routings.START, {
                            user_id: u2.id,
                            phone: u2.phone
                        });
                    });

                    io.connection(s1);
                    io.connection(s2);
                })
            });
        });

        // it('Close room', (done) => {

        // });

        // it('Something play', (done) => {

        // });
    });

    let register_two_users = (u1, u2, cb) => {
        u_repository.saveUser(u1, (err, u_1) => {
            assert(!err);
            u_repository.saveUser(u2, (err, u_2) => {
                assert(!err);
                cb(u_1, u_2);
            })
        })
    }
});

