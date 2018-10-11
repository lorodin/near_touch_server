const FakeSocket = require('./fakes/fake.socket');
const assert = require('assert');

describe('Test fake socket.io', () => {
    let socket = new FakeSocket('111');
    
    beforeEach(() => {
        socket.clear();
    });

    // Проверка добавления/удаления слушателя для клиента
    it('Add and remove emit listener', () => {
        socket.onClientEmit('test_cmd_1', (data) => {});
        assert(socket.emit_listeners['test_cmd_1'] != null);
        socket.removeEmitListener('test_cmd_1');
        assert(socket.emit_listeners['test_cmd_1'] == null);
    });

    // Проверка работы ClientEmitListener
    it('Test client emit listener', (done) => {
        let test_data = {id: 1};

        socket.onClientEmit('test_cmd_1', (data) => {
            assert(data.id == 1);
            done();
        });

        socket.emit('test_cmd_1', test_data);
    });

    // Проверка добавления/удаления слушателя в фейковый соккет
    it('Add and remove listener', () => {
        socket.on('test_cmd_1', (data) => {});

        assert(socket.listeners['test_cmd_1'] != null);

        socket.removeListener('test_cmd_1');

        assert(socket.listeners['test_cmd_1'] == null);
    });

    // Проверка получения сообщений и ведения истории получения сообщений
    it('On listeners', (done) => {
        let data_1 = {id: '1'};
        let data_2 = {id: '2'};
        let tests = 0;

        socket.on('test_cmd_1', (data) => {
            assert(data.id == data_1.id, 'Test first listener');
            tests++;
            let find_cmd = socket.commands_history.find(c => c.cmd == 'test_cmd_1');
            assert(find_cmd != null, 'CMD Not found');
            if(tests == 3) done();
        });

        socket.on('test_cmd_1', (data) => {
            assert(data.id == data_1.id, 'Test first listener');
            tests++;
            let find_cmd = socket.commands_history.find(c => c.cmd == 'test_cmd_1');
            assert(find_cmd != null, 'CMD Not found');
            if(tests == 3) done();
        });

        socket.on('test_cmd_2', (data) => {
            assert(data.id == data_2.id, 'Test second listener');
            tests++;
            let find_cmd = socket.commands_history.find(c => c.cmd == 'test_cmd_2');
            assert(find_cmd != null);
            if(tests == 3) done();
        });

        socket.makeCmd('test_cmd_1', data_1);
        socket.makeCmd('test_cmd_2', data_2);
    })

    // Проверка отправки сообщения и ведения истории отправки сообщений
    it('Correct emits and make emits history', () => {
        socket.emit('emit_1', {id: '1'}, (data1) => {
            socket.emit('emit_2', {id: '2'}, (data2) => {
                let t_data_2 = socket.emit_history.pop();
                let t_data_1 = socket.emit_history.pop();
                
                assert(t_data_1.data.id == data1.data.id, 'Ids not equal: ' + t_data_1.data.id + ' ' + data1.data.id);
                
                assert(t_data_2.data.id == data2.data.id, 'Ids not equal: ' + t_data_2.data.id + ' ' + data2.data.id);
            });
        });
    });
});