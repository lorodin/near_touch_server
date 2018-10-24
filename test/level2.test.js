const Level2 = require('../game/levels/level2');
const FakeRandomPointsGenerator = require('./fakes/fake.random.points.generator');
const assert = require('assert');
const cmds = require('../enums/cmd.enum');

describe('Level2', () => {
    let points = [
        {x: 1, y: 1}
    ];
    let index = 0;
    
    let player1 = [
        {name: '1', action: cmds.TOUCH_DOWN, point: {x: 1, y: 1}}, // 0
        {name: '1', action: cmds.TOUCH_DOWN, point: {x: 2, y: 3}}, // 1
        {name: '1', action: cmds.TOUCH_UP, point:   null},         // 2
        {name: '1', action: cmds.TOUCH_DOWN, point: {x: 4, y: 4}}, // 3
        {name: '1', action: cmds.TOUCH_DOWN, point: {x: 4, y: 4}}, // 4
        {name: '1', action: cmds.TOUCH_DOWN, point: {x: 5, y: 5}}, // 5
        {name: '1', action: cmds.TOUCH_DOWN, point: {x: 6, y: 6}}, // 6
        {name: '1', action: cmds.TOUCH_DOWN, point: {x: 7, y: 7}}, // 7
        {name: '1', action: cmds.TOUCH_DOWN, point: {x: 7, y: 7}}, // 8
        {name: '1', action: cmds.TOUCH_DOWN, point: {x: 2, y: 2}}, // 9
        {name: '1', action: cmds.TOUCH_DOWN, point: {x: 1, y: 1}}, // 10
        {name: '1', action: cmds.TOUCH_DOWN, point: {x: 1, y: 1}}  // 11
    ];
    
    let player2 = [
        {name: '2', action: cmds.TOUCH_DOWN, point: {x: 1, y: 1}}, // 0
        {name: '2', action: cmds.TOUCH_DOWN, point: {x: 2, y: 3}}, // 1
        {name: '2', action: cmds.TOUCH_DOWN, point: {x: 3, y: 10}},// 2
        {name: '2', action: cmds.TOUCH_DOWN, point: {x: 4, y: 4}}, // 3
        {name: '2', action: cmds.TOUCH_DOWN, point: {x: 4, y: 4}}, // 4
        {name: '2', action: cmds.TOUCH_DOWN, point: {x: 6, y: 6}}, // 5
        {name: '2', action: cmds.TOUCH_UP,   point: null},         // 6
        {name: '2', action: cmds.TOUCH_DOWN, point: {x: 7, y: 7}}, // 7
        {name: '2', action: cmds.TOUCH_DOWN, point: {x: 6, y: 6}}, // 8
        {name: '2', action: cmds.TOUCH_DOWN, point: {x: 2, y: 2}}, // 9
        {name: '2', action: cmds.TOUCH_DOWN, point: {x: 1, y: 1}}, // 10
        {name: '2', action: cmds.TOUCH_DOWN, point: {x: 1, y: 1}}  // 11
    ];
    //              0  1  2  3  4  5  6  7  8  9  10 11
    let c_points = [3, 6, 5, 8, 8, 7, 6, 9, 8, 9, 9, 9];

    // index == 2 => player1.action == cmds.TOUCH_UP
    // index == 4 => old_total_points == total_points
    // index == 5 => player1.point  != player2.point
    // index == 6 => player2.action == cmds.TOUCH_UP

    let max_points = 9;
    let bonus = 3;
    let fine = 1;
    let inf = 0;

    let generator = new FakeRandomPointsGenerator(points);
    let level = new Level2(max_points, ['1', '2'], bonus, fine, inf, generator);

    beforeEach(() => {
        generator = new FakeRandomPointsGenerator(points);
        level = new Level2(max_points, ['1', '2'], bonus, fine, inf, generator);
    });

    it('Corectly game', (done) => {
        let update = () => {
            level.update(1, player1[index], player2[index], (err, go, point) =>{ 
                assert(!err);
                switch(index){
                    case 0:
                        assert(go.near.length == 2);
                        assert(go.shows.length == 2);
                        assert(go.hides.length == 0);
                        assert(go.other.length == 0);
                        assert(!level.bonus_model.enabled);
                        assert(level.total_points == c_points[index], 'Total points: ' + level.total_points + '; Points[index]: ' + c_points[index]);
                        assert(!go.level_up);
                    break;
                    case 1:
                        assert(go.near.length == 2);
                        assert(go.shows.length == 0);
                        assert(go.other.length == 0);
                        assert(!level.bonus_model.enabled);
                        assert(level.total_points == c_points[index]);
                        assert(!go.level_up);
                    break;
                    case 2:
                        assert(go.near.length == 0);
                        assert(go.other.length == 1);
                        assert(go.shows.length == 0);
                        assert(go.hides.length == 1);
                        assert(go.hides[0] == '1');
                        assert(level.total_points == c_points[index]);
                        assert(!go.level_up);
                    break;
                    case 3:
                        assert(go.near.length == 2);
                        assert(go.other.length == 0);
                        assert(go.shows.length == 1);
                        assert(go.hides.length == 0);
                        assert(go.shows[0] == '1');
                        assert(level.total_points == c_points[index]);
                        assert(!go.level_up);
                    break;
                    case 4:
                        assert(go.near.length == 2);
                        assert(go.other.length == 0);
                        assert(go.shows.length == 0);
                        assert(go.hides.length == 0);
                        assert(level.total_points == c_points[index]);
                        assert(!go.level_up);
                    break;
                    case 5:
                        assert(go.near.length == 0);
                        assert(go.other.length == 2);
                        assert(go.shows.length == 0);
                        assert(go.hides.length == 0);
                        assert(level.total_points == c_points[index]);
                        assert(!go.level_up);
                    break;
                    case 6:
                        assert(go.near.length == 0);
                        assert(go.other.length == 1);
                        assert(go.hides.length == 1);
                        assert(go.hides[0] == '2');
                        assert(go.shows.length == 0);
                        assert(level.total_points == c_points[index]);
                        assert(!go.level_up);
                    break;
                    case 7:
                        assert(go.near.length == 2);
                        assert(go.other.length == 1);
                        assert(go.hides.length == 0);
                        assert(go.shows.length == 2);
                        assert(level.total_points == c_points[index]);
                        assert(!go.level_up);
                        assert(level.bonus_model.enabled);
                    break;
                    case 8:
                        assert(go.near.length == 0);
                        assert(go.other.length == 2);
                        assert(go.hides.length == 1);
                        assert(go.hides[0] == 'bonus');
                        assert(go.shows.length == 0);
                        assert(level.total_points == c_points[index]);
                        assert(!go.level_up);
                        assert(!level.bonus_model.enabled);
                    break;
                    case 9:
                        assert(go.near.length == 2);
                        assert(go.other.length == 1);
                        assert(go.hides.length == 0);
                        assert(go.shows.length == 1);
                        assert(go.shows[0] == 'bonus');

                        assert(level.total_points == c_points[index]);
                        assert(!go.level_up);
                        assert(level.bonus_model.enabled);
                    break;
                    case 10:
                        assert(go.near.length == 3);
                        assert(go.other.length == 0);
                        assert(go.hides.length == 0);
                        assert(go.shows.length == 0);
                        assert(level.total_points == c_points[index]);
                        assert(go.level_up);
                        assert(level.bonus_model.enabled);
                    break;
                    default: return done();
                }
                index++;
                return update();
            });
        };

        update();
    });
});