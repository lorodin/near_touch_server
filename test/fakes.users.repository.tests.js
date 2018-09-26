const FakeUsersRepository = require('./fakes/fakes.users.repository');
const error_messages = require('../enums/error.messages');
const assert = require('assert');
const FakeDataBase = require('./fakes/fake.database');

describe('Fake users repository', () => {
    let fake_db = new FakeDataBase();

    let repository = new FakeUsersRepository(fake_db);

    let user_1 = {
        name: 'Vasy',
        phone: '333'
    };
    
    let user_2 = {
        name: 'Igor',
        phone: '123'
    };
    
    let user_3 = {
        name: 'Larisa',
        phone: '333'
    };

    let incorrect_user = {};

    beforeEach((done) => {
        repository.saveUser(user_1, (err, user1) => {
            assert(err == null, '1 Error nut null');
            assert(user1 != null, '1 User model is null');
            assert(user1.id == user_1.id, '1 Id not equal: ' + user1.id + ' ' + user_1.id);
            assert(user1.name == user_1.name, '1 Name not equal: ' + user1.name + ' ' + user_1.name);
            assert(user1.phone == user_1.phone, '1 Phone not equal: ' + user1.phone + ' ' + user_1.phone);
            assert(!user1.phone_confirm, '1 Phone confirm is false ' + user1.phone_confirm);
            user_1 = user1;

            repository.saveUser(user_2, (err, user2) => {
                assert(err == null, '2 Error nut null');
                assert(user2 != null, '2 User model is null');
                assert(user2.name == user_2.name, '2 Name not equal: ' + user2.name + ' ' + user_2.name);
                assert(user2.id == user_2.id, '2 Id not equal: ' + user2.id + ' ' + user_2.id);
                assert(user2.phone == user_2.phone, '2 Phone not equal: ' + user2.phone + ' ' + user_2.phone);
                assert(!user2.phone_confirm, '1 Phone confirm is false ' + user2.phone_confirm);
                user_2 = user2;

                repository.saveUser(user_3, (err, user3) => {
                    assert(err == null);
                    assert(user3 != null);
                    user_3 = user3;
                    assert(fake_db.users.length == 3);
                    done();
                });
            });
        });
    });

    it('Find many by phone', (done) => {
        repository.findManyByPhone(user_1.phone, (err, users) => {
            assert(err == null);
            
            assert(users.length == 2, 'Users length not 2: ' + users.length);
            
            let u1 = users.find(u => u.id == user_1.id);
            let u2 = users.find(u => u.id == user_3.id);

            assert(u1.id == user_1.id);
            assert(u1.name == user_1.name);
            assert(u1.phone == user_1.phone);
            assert(u1.phone_confirm == user_1.phone_confirm);

            assert(u2.id == user_3.id);
            assert(u2.name == user_3.name);
            assert(u2.phone == user_3.phone);
            assert(u2.phone_confirm == user_3.phone_confirm);

            done();
        });
    });

    it('Find user by id', (done) => {
        repository.findUserById(user_1.id, (err, user) => {
            assert(err == null);
            assert(user.id == user_1.id);
            assert(user.name == user_1.name);
            assert(user.phone == user_1.phone);
            assert(user.phone_confirm == user_1.phone_confirm);
            done();
        });
    });

    it('Not save incorrect user', (done) => {
        repository.saveUser(incorrect_user, (err, user) => {
            assert(err == error_messages.ERROR_MODEL);
            assert(user == null);
            done();
        });
    });


    
    it('Update old user', (done) => {
        user_2.name = 'New name';
        user_2.phone_confirm = true;

        repository.saveUser(user_2, (err, user) => {
            assert(err == null);
            assert(user_2.id == user.id);
            assert(user_2.name == user.name);
            assert(user_2.phone == user.phone);
            assert(user_2.phone_confirm == user.phone_confirm);
            assert(repository.length() == 3);
            done();
        });
    });

    afterEach((done) => {
        repository.removeUserById(user_1.id, (err, user1) => {
            assert(err == null);
            assert(user1 != null);
            repository.removeUserById(user_2.id, (err, user2) => {
                assert(err == null)
                assert(user2 != null);
                repository.removeUserById(user_3.id, (err, user3) => {
                    assert(err == null);
                    assert(user3 != null);
                    done();
                });
            });
        });
    });
});