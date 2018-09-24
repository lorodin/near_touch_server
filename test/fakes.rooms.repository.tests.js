const FakeRoomsRepository = require('./fakes/fake.rooms.repository');
const FakeDataBase = require('./fakes/fake.database');
const error_messages = require('../enums/error.messages');
const assert = require('assert');

describe('Fake Rooms repository', () => {
    let user_1 = {
        id: '1',
        name: 'Vasy',
        phone: '333'
    };
    
    let user_2 = {
        id: '2',
        name: 'Igor',
        phone: '123'
    };

    let user_1_2 = {
        id: '3',
        name: 'Lol',
        phone: '444'
    };

    let user_2_2 = {
        id: '4',
        name: 'Kate',
        phone: '555'
    };

    let user_3_1 = {
        id: '5',
        name: 'Oleg',
        phone: '12333'
    }

    let room_1 = {
        id: '1',
        from: user_1.id,
        to: user_2.id
    };

    let room_2 = {
        id: '2',
        from: user_1_2.id,
        to: user_2_2.id
    }

    let incorrect_room_1 = {
        id: '4',
        from: '-1',
        to: user_3_1.id
    };

    let incorrect_room_2 = {
        id: '5',
        from: user_3_1.id,
        to: '-1'
    };

    let incorrect_room_3 = {
        id: '6',
        from: user_3_1.id,
        to: user_3_1.id
    };

    let incorrect_room_4 = {
        id: '7',
        from: user_1.id,
        to:user_3_1.id
    };

    let incorrect_room_5 = {
        id: '8',
        from: user_3_1.id,
        to: user_1.id
    };

    let fake_db = new FakeDataBase();


    let repository = new FakeRoomsRepository(fake_db);

    beforeEach((done) => {
        fake_db.users.push(user_1);
        fake_db.users.push(user_2);
        fake_db.users.push(user_1_2);
        fake_db.users.push(user_2_2);
        fake_db.users.push(user_3_1);

        repository.saveRoom(room_1, (err, r1) => {
            assert(err == null);
            assert(r1.from = room_1.from);
            assert(r1.to == room_1.to);
            assert(r1.confirm == false);
            assert(r1.points == 0);
            assert(r1.date_created);
            room_1 = r1;
            repository.saveRoom(room_2, (err, r2) => {
                assert(err == null);
                assert(r2.from == room_2.from);
                assert(r2.to == room_2.to);
                assert(r2.confirm == false);
                assert(r2.points == 0);
                assert(r2.date_created);
                room_2 = r2;
                done();
            });
        });
    });

    describe('Find room', () => {

        it('Find room by id', (done) => {
            repository.findRoomById(room_1.id, (err, room) => {
                assert(err == null);
                assert(room_1.id == room.id);
                assert(room_1.from == room.from);
                assert(room_1.to == room.to);
                assert(room_1.confirm == room.confirm);
                assert(room_1.points == room.points);
                assert(room_1.date_created.getDate() == room.date_created.getDate());
                done();
            });
        });
    
        it('Find room by user id', (done) => {
            repository.findRoomById(user_1.id, (err, room) => {
                assert(err == null);
                assert(room_1.id == room.id);
                assert(room_1.from == room.from);
                assert(room_1.to == room.to);
                assert(room_1.confirm == room.confirm);
                assert(room_1.points == room.points);
                assert(room_1.date_created.getDate() == room.date_created.getDate());
                done();
            });
        });
    
    })

    describe('Not save incorrect room', () => {
        it('Not save incorrect room model', (done) => {
            repository.saveRoom({}, (err, room) => {
                assert(err == error_messages.ERROR_MODEL);
                assert(room == null);
                done();
            });
        });

        it('Not save room with not existing user from', (done) => {
            repository.saveRoom(incorrect_room_1, (err, room) => {
                assert(err == error_messages.USER_NOT_FOUND);
                assert(room == null);
                done();
            });
        });

        it('Not save room with no existing user to', (done) => {
            repository.saveRoom(incorrect_room_2, (err, room) => {
                assert(err == error_messages.USER_NOT_FOUND);
                assert(room == null);
                done();
            });
        });

        it('Not save room with from and to ids equals', (done) => {
            repository.saveRoom(incorrect_room_3, (err, room) => {
                assert(err == error_messages.ERROR_MODEL);
                assert(room == null);
                done();
            });
        });

        it('Not save room if user alredy busy to', (done) => {
            repository.saveRoom(incorrect_room_4, (err, room) => {
                assert(err == error_messages.ROOM_CLIENT_BUSY);
                assert(room == null);
                done();
            });
        });

        it('Not save room if user alredy busy from', (done) => {
            repository.saveRoom(incorrect_room_5, (err, room) => {
                assert(err == error_messages.ROOM_CLIENT_BUSY);
                assert(room == null);
                done();
            });
        });
    })

    describe('Remove and update room', () => {
        it('Remove room by id', (done) => {
            repository.removeRoomById(room_1.id, (err, room) => {
                assert(err == null);
                assert(fake_db.rooms.length == 1);
                assert(room.id == room_1.id);
                assert(room.from == room_1.from);
                done();
            });
        });

        it('Remove room by user id', (done) => {
            repository.removeRoomByUserId(room_2.from, (err, room) => {
                assert(err == null, 'Error != null');
                assert(room != null, 'Room = null');
                assert(fake_db.rooms.length == 1, 'Error length db ' + trace_DataBase_Rooms(fake_db));
                assert(room.id == room_2.id, 'Error rooms ids: ' + room.id + ' ' + room_2.id);
                assert(room.from == room_2.from, 'Error rooms from: ' + room.from + ' ' + room_2.from);
                done();
            });
        });

        it('Update room', (done) => {
            room_1.points = 100;
            room_1.confirm = true;
            repository.saveRoom(room_1, (err, room) => {
                assert(err == null, 'Error != null');
                assert(fake_db.rooms.length == 2, 'Db.Rooms.Length != 2');
                assert(room_1.id == room.id, 'Room ids error: ' + room_1.id + ' ' + room.id);
                assert(room_1.from == room.from, 'Room from error: ' + room_1.from +' ' + room.from);
                assert(room_1.to == room.to, 'Room to error: ' + room_1.to + ' ' + room.to);
                assert(room_1.confirm == room.confirm, 'Room confirm error: ' + room_1.confirm + ' ' + room.confirm);
                assert(room_1.points == room.points, 'Room points error: ' + room_1.points + ' ' + room.points);
                assert(room.date_created.getDate() == room_1.date_created.getDate(), 'Room date error: ' + room.date_created.getDate() + ' ' + room_1.date_created.getDate());
                done();
            });
        });
    });



    afterEach(() => {
        fake_db.users = [];
        fake_db.rooms = [];
        fake_db.codes = [];
    })
});

let trace_DataBase_Rooms = (db) => {
    let result = '';
    for(let i = 0; i < db.rooms.length; i++){
        result += '{id: ' + db.rooms[i].id + ', ';
        result += 'from: ' + db.rooms[i].from + ', ';
        result += 'to: ' + db.rooms[i].to + ', ',
        result += 'points: '+ db.rooms[i].points + ', ' ;
        result += 'confirm: ' + db.rooms[i].confirm + ', ';
        result += 'date_created: ' + db.rooms[i].date_created.getDate() + '}\r\n';
    }
    return result;
}