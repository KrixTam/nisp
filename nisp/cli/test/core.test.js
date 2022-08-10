const moment = require('moment');
const net = require('net');
const events = require('events');
const datamodel = require('../datamodel');
const utils = require('../utils');
const core = require('../core');
const constants = require('../constants');


function delay(time) {
	return new Promise(resolve => setTimeout(resolve, time));
};

var add_adj = function (data) {
    return data['a'] + data['b'];
};

var times_adj = function (data) {
    return data['a'] * data['b'];
};

describe('测试default_init_cb', () => {
	
	test('正常情况', () => {
		let n = 'my_call_back';
		let key = constants.KEY_NAME;
		let r = core.default_init_cb(n);
		expect(Object.keys(r).length).toBe(1);
		expect((key in r)).toBe(true);
		expect(r[key]).toBe(n);
	});

});

describe('测试init_commands', () => {

	test('正常情况', () => {
		core.init_commands({'000000000100': add_adj});
		let r = datamodel.register_command('000000000100', times_adj, add_adj);
        expect(r).toBe(false);
	});

	test('异常情况', () => {
		const t = () => {
            core.init_commands('100000000001');
        };
        expect(t).toThrow(Error);
	});

});

describe('测试generate_event_index', () => {

	test('正常情况_01', () => {
		let ts = new moment('2021-01-02 12:23:22');
		let evt = new datamodel.Event(4, 0, ts);
		let evt_index = core.generate_event_index(evt);
		expect(evt_index).toBe('0045feff53a');
	});

	test('正常情况_02', () => {
		let ts = new moment('2021-01-02 12:23:22');
		let cid = '000000000100';
		let evt_index = core.generate_event_index(cid, ts);
		expect(evt_index).toBe('0045feff53a');
	});

	test('异常情况', () => {
		const t = () => {
            let ts = new moment('2021-01-02 12:23:22');
			let cid = '000000000100';
			let evt_index = core.generate_event_index(cid, ts, 123);
        };
        expect(t).toThrow(RangeError);
	});

});

describe('测试once', () => {

	test('正常情况', () => {
		let emitter = new events.EventEmitter();
		let b = -1;
		core.once(emitter, 'a', (a) => { return a + 2; }).then((r) => { b = r * 3; });
		emitter.emit('a', 2);
		setTimeout(() => {
			expect(b).toBe(12);
		}, 200);
	});

});

describe('测试NISPClient', () => {

	test('connect', done => {
		let server = net.createServer();
		let fd_path = './test.client.01.sock';
		server.listen(fd_path);
		server.on('connection', function (socket) {
			socket.write('{"name": "test_abc"}');
			setTimeout(() => {
				expect(client.name).toBe('test_abc');
				setTimeout(async () => {
					socket.end();
					server.close();
					done();
				}, 200);
			}, 200);
		});
		let client = new core.NISPClient(fd_path);
	});

	test('end', done => {
		let count = 0;
		let server = net.createServer((stream) => {
			stream.on('end', () => {
				count = count - 1;
			});
		});
		let fd_path = './test.client.02.sock';
		server.listen(fd_path);
		server.on('connection', function (socket) {
			socket.write('{"name": "test_abc"}');
			count = count + 2;
			setTimeout(() => {
				client.end();
				setTimeout(async () => {
					server.close();
					expect(count).toBe(1);
					done();
				}, 200);
			}, 200);
		});
		let client = new core.NISPClient(fd_path);
	});

	test('reconnect', done => {
		let count = 0;
		let server = net.createServer((stream) => {
			stream.on('end', () => {
				count = count - 3;
			});
		});
		let fd_path = './test.client.03.sock';
		server.listen(fd_path);
		let flag = true;
		server.on('connection', function (socket) {
			socket.write('{"name": "test_abc"}');
			count = count + 4;
			if (flag) {
				flag = false;
				socket.end();
				setTimeout(() => {
					client.reconnect();
				}, 200);
			} else {
				setTimeout(async () => {
					server.close();
					client.end();
					expect(count).toBe(5);
					done();
				}, 200);
			}
		});
		let client = new core.NISPClient(fd_path);
	});

});


