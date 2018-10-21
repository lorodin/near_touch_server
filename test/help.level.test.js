const assert = require('assert');
const HelpLevel = require('../game/levels/help.level');
const FakePointsGenerator = require('./fakes/fake.random.points.generator');
const cmds = require('../enums/cmd.enum');
const MathHelper = require('../helpers/math.helper');

describe('Help level', () => {
    let points = [
        {x: 1, y: 1},
        {x: 10, y: 1}
    ];
    let sSpeed = 2;
    let sStart = {x: 1, y: 1};
    let inf = 0;
    let bonus = 2;
    let max_points = 30;
    let fine = 3;
    let w = 100;
    let h = 100;

    let generator = new FakePointsGenerator(points);

    let level = new HelpLevel(max_points, ['1', '2'], bonus, fine, inf, w, h, sSpeed, sStart, generator);

    beforeEach(() => {
        generator = new FakePointsGenerator(points);
        level = new HelpLevel(max_points, ['1', '2'], bonus, fine, inf, w, h, sSpeed, sStart, generator);
    });

    it('Hides/shows players', (done) => {
        let p1s = [
            {name: '1', action: cmds.TOUCH_UP, point: null},
            {name: '1', action: cmds.TOUCH_DOWN, point: {x: 0, y: 0}},
            {name: '1', action: cmds.TOUCH_DOWN, point: {x: 30, y: 1}}
        ];
        let p2s = [
            {name: '2', action: cmds.TOUCH_DOWN, point: {x: 10, y: 10}},
            {name: '2', action: cmds.TOUCH_UP, point: null},
            {name: '2', action: cmds.TOUCH_DOWN, point: {x: 2, y: 2}}
        ];
        let index = 0;
        let update = () => {
            level.update(1, p1s[index], p2s[index], (err, gameObject, point) => {
                assert(!err);
                switch(index++){
                    case 0:
                        assert(gameObject.near.length == 1);
                        assert(gameObject.near[0].name == 'server');
                        assert(gameObject.other.length == 1);
                        assert(gameObject.other[0].name == '2');
                        update();
                    break;
                    case 1:
                        assert(gameObject.near.length == 1);
                        assert(gameObject.shows.length == 1);
                        assert(gameObject.shows[0] == '1');
                        assert(gameObject.other.length == 1);
                        assert(gameObject.other[0].name == '1');
                        assert(gameObject.hides.length == 1);
                        assert(gameObject.hides[0] == '2');
                        update();
                    break;
                    default:
                        assert(gameObject.near.length == 1);
                        assert(gameObject.near[0].name == 'server');
                        assert(gameObject.shows.length == 1);
                        assert(gameObject.shows[0] == '2');
                        assert(gameObject.other.length == 2);
                        assert(gameObject.other[0].name == '1' || gameObject.other[1].name == '1');
                        assert(gameObject.other[0].name == '2' || gameObject.other[1].name == '2');
                        assert(gameObject.hides.length == 0);
                        return done();
                }
            });
        }
        update();
    })

    it('Correctly game', (done) => {

        generator.onPointsGetting((point)=>{
            assert(MathHelper.equelsPoints(point, points[0]) || MathHelper.equelsPoints(point, points[1]));
        })
        let index = 0;
        
        let point = level.s_player.s_p;

        let update = () => {
            let old_points = level.total_points;
            
            level.update(1, {name: '1', action: cmds.TOUCH_DOWN, point: point}, 
                            {name: '2', action: cmds.TOUCH_DOWN, point: point}, 
                            (err, gameObject, p) => {
                point = p;
                if(index++ < 2) return update();
                assert(!err);
                assert(old_points + bonus == gameObject.total_points);
                assert(gameObject.near.length == 3);
                assert(gameObject.other.length == 0);
                if(gameObject.total_points < max_points) update();
                else done();
            });
        }

        update();
    });
});

let printGameObject = (gameObject) => {
    console.log('Nears');
    for(let i = 0; i < gameObject.near.length; i++){
        console.log('\tname: ' + gameObject.near[i].name);
        console.log('\taction: ' + gameObject.near[i].action);
        console.log('\tpoint: x:' + gameObject.near[i].point.x + '; y: ' + gameObject.near[i].point.y);
        console.log('\t--------')
    }  
    console.log('Others: ');
    for(let i = 0; i < gameObject.other.length; i++){
        console.log('\tname: ' + gameObject.other[i].name);
        console.log('\taction: ' + gameObject.other[i].action);
        console.log('\tpoint: x:' + gameObject.other[i].point.x + '; y: ' + gameObject.other[i].point.y);
    }  
    console.log('Hides: ');
    for(let i = 0; i < gameObject.hides.length; i++){
        console.log('\tname: ' + gameObject.hides[i]);
    }  
    console.log('Shows: ');
    for(let i = 0; i < gameObject.shows.length; i++){
        console.log('\tname: ' + gameObject.shows[i]);
    }  

    console.log('Total points: ' + gameObject.total_points);
    console.log('-------------------------------------');
};