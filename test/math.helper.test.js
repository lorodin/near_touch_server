const assert = require('assert');
const MathHelper = require('../helpers/math.helper');

describe('MathHelper', () => {
    describe('Points equels', () => {
        it('Equels', () => {
            let r1 = MathHelper.equelsPoints(
                {x: 0, y: 0}, {x: Number.MIN_VALUE, y: Number.MIN_VALUE});
            assert(r1);
            let r2 = MathHelper.equelsPoints(
                {x: 0, y: 0}, {x: 10, y: 10}, 10
            );
            assert(r2);
        });
        it('Not equels', () => {
            let r1 = MathHelper.equelsPoints(
                {x: 0, y: 0}, {x: Number.MIN_VALUE, y: 10}
            );
            assert(!r1);
            let r2 = MathHelper.equelsPoints(
                {x: 0, y: 0}, {x: 10, y: 10}, 5
            );
            assert(!r2);
        });
    });
    describe('Calc XY Speed', () => {
        it('Calc for speed = 2.5 y.e. p1(1, 1) p2(4, 5)', () => {
            /*  
                 +
                /
            */
            let p1 = {x: 1, y: 1};
            let p2 = {x: 4, y: 5};
            let r_x_s = 1.5;
            let r_y_s = 2;
            let s  = 2.5;
            let xySpeed = MathHelper.calcXYSpeed(p1, p2, s);
            assert(xySpeed.x == r_x_s, 'xSpeed = ' + xySpeed.x + ' teor xs: ' + r_x_s);
            assert(xySpeed.y == r_y_s, 'ySpeed = ' + xySpeed.y + ' teor ys: ' + r_y_s);
        });
        it('Calc for speed = 2.5 y.e. p1(-1, 0) p2(2, 4)', () => {
            /*  
                 +
                /
            */
            let p1 = {x: -1, y: 0};
            let p2 = {x: 2, y: 4};
            let s = 2.5;
            let r_s = {x: 1.5, y: 2};
            let xys = MathHelper.calcXYSpeed(p1, p2, s);
            assert(MathHelper.equelsPoints(xys, r_s), 'Realspeed: x: ' + xys.x + '; y:' + xys.y
                                                     + '; Theretic: x: ' + r_s.x + '; y: ' + r_s.y);
        });
        it('Calc for speed = 2.5 y.e. p1(4, 4) p2(1, 0)', () => {
            /*
                /
               + 
            */
            let p1 = {x: 4, y: 4};
            let p2 = {x: 1, y: 0};
            let s = 2.5;
            let r_s = {x: -1.5, y: -2};
            
            let xys = MathHelper.calcXYSpeed(p1, p2, s);
            assert(MathHelper.equelsPoints(xys, r_s), 'Realspeed: x: ' + xys.x + '; y:' + xys.y
                                                     + '; Theretic: x: ' + r_s.x + '; y: ' + r_s.y);
        });
        it('Calc for speed=2.5y.e. p1(0, 4) p2(1, 0)', () => {
            /*
                \
                 +
            */
            let p1 = {x: 0, y: 4};
            let p2 = {x: 3, y: 0};
            let s = 2.5;
            let r_s = {x: 1.5, y: -2};
            let xys = MathHelper.calcXYSpeed(p1, p2, s);
            assert(MathHelper.equelsPoints(xys, r_s), 'Realspeed: x: ' + xys.x + '; y:' + xys.y
                                                     + '; Theretic: x: ' + r_s.x + '; y: ' + r_s.y);
        });
        if('Calc for speed=2.5y.e. p1(3, 0) p2(0, 4)', () => {
            /*
                +
                 \
            */
            let p1 = {x: 3, y: 0};
            let p2 = {x: 0, y: 4};
            let s = 2.5;
            let r_s = {x: -1.5, y: 2};
            let xys = MathHelper.calcXYSpeed(p1, p2, s);
            assert(MathHelper.equelsPoints(xys, r_s), 'Realspeed: x: ' + xys.x + '; y:' + xys.y
                                                     + '; Theretic: x: ' + r_s.x + '; y: ' + r_s.y);
        })
        it('Calc for speed=2.5y.e. p1(1, 1) p2(1, 6)', () => {
            /*
                +
                |
            */
            let p1 = {x: 1, y: 1};
            let p2 = {x: 1, y: 6};
            let s = 2.5;
            let r_s = {x: 0, y: 2.5};
            let xys = MathHelper.calcXYSpeed(p1, p2, s);
            assert(MathHelper.equelsPoints(xys, r_s), 'Realspeed: x: ' + xys.x + '; y:' + xys.y
                                                     + '; Theretic: x: ' + r_s.x + '; y: ' + r_s.y);
        });
        it('Calc for speed=2.5y.e. p1(1, 6) p2(1, 1)', () =>{ 
            /*
                |
                +
            */
           let p1 = {x: 1, y: 6};
           let p2 = {x: 1, y: 1};
           let s = 2.5;
           let r_s = {x: 0, y: -2.5};
           let xys = MathHelper.calcXYSpeed(p1, p2, s);
            assert(MathHelper.equelsPoints(xys, r_s), 'Realspeed: x: ' + xys.x + '; y:' + xys.y
                                                     + '; Theretic: x: ' + r_s.x + '; y: ' + r_s.y);
        });
        it('Calc for speed=2.5y.e. p1(1, 1) p2(6, 1)', () => {
            /*
                ---+
            */
           let p1 = {x: 1, y: 1};
           let p2 = {x: 6, y: 1};
           let s  = 2.5;
           let r_s = {x: 2.5, y: 0};
           let xys = MathHelper.calcXYSpeed(p1, p2, s);
            assert(MathHelper.equelsPoints(xys, r_s), 'Realspeed: x: ' + xys.x + '; y:' + xys.y
                                                     + '; Theretic: x: ' + r_s.x + '; y: ' + r_s.y);
        });
        it('Calc for speed=2.5y.e. p1(6, 1) p2(1, 1)', () => {
            /*
                +---
            */
           let p1 = {x: 6, y: 1};
           let p2 = {x: 1, y: 1};
           let s = 2.5;
           let r_s = {x: -2.5, y: 0};
           let xys = MathHelper.calcXYSpeed(p1, p2, s);
            assert(MathHelper.equelsPoints(xys, r_s), 'Realspeed: x: ' + xys.x + '; y:' + xys.y
                                                     + '; Theretic: x: ' + r_s.x + '; y: ' + r_s.y);
        })
    });
    describe('Random point', () => {
        it('Random point for w: 10, y: 10, o_w: 2, o_h: 2', () => {
            let w = 10;
            let h = 10;
            let o_w = 2;
            let o_h = 2;
            for(let i = 0; i < 1000; i++){
                let r_point = MathHelper.randomPoints(w, h, o_w, o_h);
                assert(r_point.x >= 2 && r_point.x <= 8, 'Error: point.x=' + r_point.x);
                assert(r_point.y >= 2 && r_point.y <= 8, 'Error: point.y=' + r_point.y);
            }
        });
    });
    describe('Vectors algebra', () => {
        it('Scale vector', () => {
            let v = {x: 1, y: 1};
            let s1 = 0.5;
            let n_v = MathHelper.scaleVector(v, s1);
            assert(n_v.x == 0.5, 'N_x: ' + n_v.x);
            assert(n_v.y == 0.5, 'N_y: ' + n_v.y);
            let s2 = -0.5;
            let n_v_s = MathHelper.scaleVector(v, s2);
            assert(n_v_s.x == -0.5, 'N_x: ' + n_v_s.x);
            assert(n_v_s.y == -0.5, 'N_y: ' + n_v_s.y);
        });
        it('Sum vectors', () => {
            let v1 = {x: 1, y: 1};
            let v2 = {x: 2, y: 2};
            let vr = {x: 3, y: 3};
            let r = MathHelper.sumVectors2(v1, v2);
            assert(MathHelper.equelsPoints(vr, r));
        });
        it('Length', () => {
            let p1 = {x: 0, y: 0};
            let p2 = {x: 3, y: 4};
            let l = MathHelper.length(p1, p2);
            assert(l == 5);
        });
    })
});