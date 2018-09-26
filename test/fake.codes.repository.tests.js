const FakeCodesRepository = require('./fakes/fake.codes.repository');
const assert = require('assert');
const FakeDataBase = require('./fakes/fake.database');
const error_messages = require('../enums/error.messages');

describe('Fake codes repository', () => {
    let fake_db = new FakeDataBase();
    let repository = new FakeCodesRepository(fake_db);

    let user_1 = {
        id: '1',
        name: 'Vany',
        phone: '123',
        phone_confirm: false
    };

    let user_2 = {
        id: '2',
        name: 'Igor',
        phone: '333',
        phone_confirm: false
    };

    let code = {
        user_id: user_1.id,
        code: '5555'
    };

    // С ID несуществующего пользователя
    let incorrect_code_1 = {
        user_id: '-1',
        code: '11111'
    };

    // Без необходимых полей
    let incorrect_code_2 = {

    }

    beforeEach((done) => {
        fake_db.users.push(user_1);
        fake_db.users.push(user_2);
        repository.saveCode(code, (err, c) => {
            assert(err == null);
            assert(c.code == code.code);
            assert(c.user_id == code.user_id);
            assert(fake_db.users.length == 2);
            assert(fake_db.codes.length == 1);
            assert(c.date_created);
            code = c;
            done();
        });
    });

    describe('Not save incorrect codes', ()=>{
        it('Not save incorrect code', (done) => {
            repository.saveCode(incorrect_code_2, (err, code) => {
                assert(err == error_messages.ERROR_MODEL);
                assert(code == null);
                assert(fake_db.codes.length == 1);
                done();
            });
        });

        it('Not save code with incorrect user id', (done) => {
            repository.saveCode(incorrect_code_1, (err, code) => {
                assert(err == error_messages.USER_NOT_FOUND);
                assert(code == null);
                assert(fake_db.codes.length == 1);
                done();
            })
        });
    });


    describe('Remove code', () => {
        it('Not remove incorrect code', (done) => {
            repository.removeCode(incorrect_code_2, (err, code) => {
                assert(err == null);
                assert(code == null);
                assert(fake_db.codes.length == 1);
                done();
            });
        });
        it('Remove code', (done) => {
            repository.removeCode(code, (err, c) => {
                assert(err == null);
                assert(code.id == c.id);
                assert(code.user_id == c.user_id);
                assert(code.date_created.getDate() == c.date_created.getDate());
                assert(fake_db.codes.length == 0);
                done();
            });
        });
    });

    describe('Save and update codes', () => {
        it('Save code', (done) => {
            let new_code = {
                id: '3',
                user_id: user_2.id,
                code: '3333'
            };
            repository.saveCode(new_code, (err, code) => {
                assert(err == null);
                assert(code.id == new_code.id);
                assert(code.user_id == new_code.user_id);
                assert(code.code == new_code.code);
                assert(code.date_created);
                assert(fake_db.codes.length == 2);
                done();
            });
        });
        it('Update code', (done) => {
            code.code == '6666';
            repository.saveCode(code, (err, c) => {
                assert(err == null);
                assert(c != null);
                assert(c.id == code.id);
                assert(c.user_id == code.user_id);
                assert(c.code == code.code);
                assert(c.date_created.getDate() == code.date_created.getDate());
                assert(fake_db.codes.length == 1);
                done();
            });
        });
    });

    describe('Find code', () => {
        it('Find code by user phone', (done) => {
            repository.findCodeByPhone(user_1.phone, (err, c) => {
                assert(err == null);
                assert(c != null);
                assert(c.code == code.code);
                assert(c.id == code.id);
                assert(c.user_id == code.user_id);
                assert(c.date_created.getDate() == code.date_created.getDate());
                done();
            });
        });
        it('Find code by user id', (done) => {
            repository.findCodeByUserId(user_1.id, (err, c) => {
                assert(err == null);
                assert(c != null);
                assert(c.code == code.code);
                assert(c.id == code.id);
                assert(c.user_id == code.user_id);
                assert(c.date_created.getDate() == code.date_created.getDate());
                done();
            });
        });
    });

    afterEach(() => {
        fake_db.users = [];
        fake_db.codes = [];
    })
});