const GameCore = require('../game/game.core');
const cmds = require('../enums/cmd.enum');
const assert = require('assert');
const FakePointsGenerator = require('./fakes/fake.random.points.generator');

describe('GameCore', () => {
    const configs = {
        'lvl_points': [30, 50],
        'bonus': 1,
        'fine': 2,
        'inv': 0,
        'sSpeed': 5,
        'sPoint': {x: 1, y: 1}
    };
    
    const points = [];

    for(let i = 0; i < 100; i++) points.push({x: i + 1, y: i + 1});
    
    let generator = new FakePointsGenerator(points);
    let generator2 = new FakePointsGenerator(points);

    let game = new GameCore(configs, ['1', '2'], generator);

    beforeEach(() => {
        generator = new FakePointsGenerator(points);

        game = new GameCore(configs, ['1', '2'], generator);
    })

    it('Correctly game', (done) => {
        let level = 1;
        let pp = game.c_level.s_player.s_p;
        let index = 0;
        let update = () => {
            
            let old_points = game.c_level.total_points;
            game.update(1, {name: '1', action: cmds.TOUCH_DOWN, point: pp}, 
                           {name: '2', action: cmds.TOUCH_DOWN, point: pp}, (err, go, point) => {
                assert(!err);
                if(index++ < 3) return update(); 
                if(go.level_up){
                    level++;
                    index = 0;
                    if(level == 2) return done();
                    else return update();
                }

                let new_points = old_points + configs.bonus;

                pp = level == 1 ? game.c_level.s_player.s_p : generator2.getNextPoint();
                
                assert(new_points == game.c_level.total_points, 'Not points equels: ')
                
                return update();
            });
        }

        update();
    })
})