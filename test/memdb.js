const memdb = require('..');
const assert = require('assert');

describe('memdb', () => {
    beforeEach(()=>{
        memdb.clear();
    });
    describe('synchronous .sabeSync(doc)', () => {
        it('should save the document', () => {
            const pet = {name:'Tobi'};
            memdb.saveSync(pet);
            const ret = memdb.first({name: 'Tobi'});
            assert(pet == ret);
        })
    });
    describe('.first(obj)', () => {
        it('should return the first matching doc', () => {
            const toby = {name: 'Tobi'};
            const loki = {name: 'Loki'};
            memdb.saveSync(toby);
            memdb.saveSync(loki);
            let ret = memdb.first({name: 'Tobi'});
            assert(ret == toby);
            ret = memdb.first({name:'Loki'});
            assert(ret == loki);
        });
        it('should return null when no doc matches', () => {
            const ret = memdb.first({name: 'Manny'});
            assert(ret == null);
        })
    });
    describe('save(doc, cb)', () => {
        it('should save the document', (done) => {
            const pet = { name: 'Tobi' };
            memdb.save(pet, () => {
                const ret = memdb.first({name: 'Tobi'});
                assert(pet == ret);
                done();
            });
        });
    });
})