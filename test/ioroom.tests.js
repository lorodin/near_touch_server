const IORoom = require('../models/IORoom');
const IOClient = require('../models/IOClient');

const RoomsRepository = require('./fakes/fake.rooms.repository');
const UsersRepository = require('./fakes/fakes.users.repository');
const FakeDataBase = require('./fakes/fake.database');
const FakeSocket = require('./fakes/fake.socket');

const assert = require('assert');
const MathHelper = require('../helpers/math.helper');
const FakePointsGenerator = require('./fakes/fake.random.points.generator');

describe('IORoom', () => {
    let u1 = {
        name: 'u1',
        phone: '1111',
        phone_confirm: true
    };
    let u2 = {
        name: 'u2',
        phone: '2222',
        phone_confirm: true
    };

    let f_s_1 = new FakeSocket(1);
    let f_s_2 = new FakeSocket(2);

    let db = new FakeDataBase();

    let u_repository = new UsersRepository(db);
    let r_repository = new RoomsRepository(db);

    let room = {};

    let client_1 = new IOClient();
    let client_2 = new IOClient();

    let io_r = new IORoom();

    let configs = {
        'points_for_helper': 100,
        'lvl_points': [120, 140, 180, 230, 290],
        'points_for_near': 3,
        'inf': 3,
        'width': 100,
        'height': 100
    };

    let points = [
        {x: 60, y: 50},
        {x: 50, y: 50},
        {x: 50, y: 60},
        {x: 50, y: 50},

        {x: 60, y: 60},
        {x: 50, y: 50},
        {x: 40, y: 60},
        {x: 90, y: 30},
        {x: 50, y: 50}
    ];

    let generator = new FakePointsGenerator(points);

    beforeEach((done) => {
        db.rooms = [];
        db.users = [];
        db.codes = [];
        
        u_repository.saveUser(u1, (err, user1) => {
            assert(!err);
            u1 = user1;
            u_repository.saveUser(u2, (err, user2) => {
                assert(!err);
                u2 = user2;
                room = {
                    from: user1.id,
                    to: user2.id,
                    confirm: true
                };
                r_repository.saveRoom(room, (err, r) => {
                    assert(!err);
                    room = r;
                    client_1 = new IOClient(user1, f_s_1);
                    client_2 = new IOClient(user2, f_s_2);
                    io_r = new IORoom([client_1, client_2], room, configs, generator);
                    done();
                })
            })
        })        
    });

});
