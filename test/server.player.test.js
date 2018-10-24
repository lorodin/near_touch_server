const ServerPlayer = require('../game/server.player');
const MathHelper = require('../helpers/math.helper');
const assert = require('assert');
const FakePointsGenerator = require('./fakes/fake.random.points.generator');

describe('ServerPlayer', () => {
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
    
    let player = null;
    
    beforeEach(() => {
        player = new ServerPlayer(100, 100, {x: 50, y: 50}, 2, generator);
    });

    
    describe('Server plaing', () => {
        it('Playing', (done)=>{
            let index = 0;
            
            player.enabled = true;

            generator.onPointsGetting((point) => {
                assert(MathHelper.equelsPoints(point, points[index++]));
            });

            let update = () => {
                player.update(1, (err, point) => {
                    assert(!err);
                    assert(point);
                    
                    if(index >= points.length){
                        done();
                    }else{
                        update();
                    }  
                });
            };
            update();
        });
    })
});

let printVectors = (vs) => {
    let msg = '';
    for(let i = 0; i < vs.length; i++){
        msg += '(' + vs[i].x + ', ' + vs[i].y + ')';
    }
    return msg;
}
