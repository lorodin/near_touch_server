class TestClass{
    constructor(a, b){
        this.a = a;
        this.b = b;
    }
    sum(){
        return this.a + this.b;
    }
    razn(){
        return this.a - this.b;
    }
    mul(){
        return this.a * this.b;
    }
    rel(){
        return this.a / this.b;
    }
}

module.exports = TestClass;