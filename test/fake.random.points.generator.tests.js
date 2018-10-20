const FakeRandomPointsGenerator = require('./fakes/fake.random.points.generator');
const assert = require('assert');

describe('FakeRandomPointsGenerator', () => {
    it('First test', () => {
        let points = [
            {x: 1, y: 1},
            {x: 2, y: 2},
            {x: 3, y: 3},
            {x: 4, y: 4}
        ];
        let g = new FakeRandomPointsGenerator(points);
        for(let i = 0; i < 4; i++){
            let p = g.getNextPoint();
            assert(p.x == points[i].x);
            assert(p.y == points[i].y);
        }
        for(let i = 0; i < 4; i++){
            let p = g.getNextPoint();
            assert(p.x == points[i].x);
            assert(p.y == points[i].y);
        }
    })
});