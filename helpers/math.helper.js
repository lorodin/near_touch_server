module.exports = {
    equelsPoints: (p1, p2, sigma) => {
        if(!sigma) sigma = Number.MIN_VALUE * 10;
        return (Math.abs(p1.x - p2.x) <= sigma && Math.abs(p1.y - p2.y) <= sigma);
    },
    calcXYSpeed: (s_p, e_p, speed) => {
        let dx = e_p.x - s_p.x;
        
        let dy = e_p.y - s_p.y;
        
        let d = Math.sqrt(dx * dx + dy * dy);

        let n = d / speed;
        return {
            x: dx / n,
            y: dy / n
        };
    },
    randomPoints: (w, h, o_w, o_h) => {
        if(!o_w)
            return {
                x: Math.random() * w,
                y: Math.random() * h
            }
        
        return {
            x: Math.random() * (w - w / o_w) + w / (o_w * 2),
            y: Math.random() * (h - h / o_h) + h / (o_h * 2)
        }
    },
    sumVectors2: (v1, v2) => {
        return {
            x: v1.x + v2.x,
            y: v1.y + v2.y
        }
    },
    scaleVector: (v, s) => {
        return {
            x: v.x * s,
            y: v.y * s
        }
    },
    length: (v1, v2) => {
        let dx = v1.x - v2.x;
        let dy = v1.y - v2.y;
        return Math.sqrt(dx * dx + dy * dy);
    },
    max: (v1, v2) => {
        return v1 > v2 ? v1 : v2;
    },
    min: (v1, v2) => {
        return v1 < v2 ? v1 : v2;
    }
};