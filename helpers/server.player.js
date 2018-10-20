let MathHelper = require('./math.helper');

class ServerPlayer{
    constructor(width, height, sPoint, sSpeed, pointsGenerator){
        this.width = width;
        this.height = height;
        this.enabled = false;
        this.sSpeed = sSpeed;
        this.s_x = 0;
        this.s_y = 0;
        this.s_p = sPoint;
        this.e_p = sPoint;
        this.p_generator = pointsGenerator;
    }

    update(dt, cb){
        if(!this.enabled) return cb(null, null);
        
        if(MathHelper.equelsPoints(this.s_p, this.e_p)){
            this.e_p = this.p_generator.getNextPoint();
            let l = MathHelper.length(this.s_p, this.e_p);
            let dx = this.e_p.x - this.s_p.x;
            let dy = this.e_p.y - this.s_p.y;
            this.s_x = this.sSpeed * dx / l;
            this.s_y = this.sSpeed * dy / l;
        }

        let scale_speed_x = dt * this.s_x;
        let scale_speed_y = dt * this.s_y;

        let x_edit = false;
        let y_edit = false;

        if(this.s_p.x < this.e_p.x && this.s_p.x + scale_speed_x >= this.e_p.x ||
            this.s_p.x > this.e_p.x && this.s_p.x + scale_speed_x <= this.e_p.x){
                this.s_p.x = this.e_p.x;
                x_edit = true;
            }

        if(this.s_p.y < this.e_p.y && this.s_p.y + scale_speed_y >= this.e_p.y ||
            this.s_p.y > this.e_p.y && this.s_p.y + scale_speed_y <= this.e_p.y){
                this.s_p.y = this.e_p.y;
                y_edit = true;
            }
        if(!x_edit) this.s_p.x += scale_speed_x;
        if(!y_edit) this.s_p.y += scale_speed_y;
        
        return cb(null, this.s_p);
    }
}

module.exports = ServerPlayer;