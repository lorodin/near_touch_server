const TestClass = require('../nn/testClass');
const assert = require('assert');

describe('TestClass testing', () => {
    it('Test sum', () => {
        const testClass = new TestClass(4, 5);
        let result = testClass.sum();
        assert(result == 9);
    })
})