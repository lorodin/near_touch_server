class BonusModel{

    constructor(){
        this.point = null;
        this.enabled = false;
    }

    show(){
        this.enabled = true;
    }

    hide(){
        this.enabled = false;
    }
}

module.exports = BonusModel;