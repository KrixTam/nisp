const moment = require('moment');
const net = require('net');
const events = require('events');
const datamodel = require('../datamodel');
const utils = require('../utils');
const core = require('../core');
const constants = require('../constants');


// jest.setTimeout(10000);
// jest.useFakeTimers();

function log () {
	let msg = '==== timer: ' + moment().format('YYYY-MM-DD HH:mm:ss.SSS');
	console.log(msg);
}


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
		console.log(r);
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
		let client_id = 'abcd';
		let evt = new datamodel.Event(client_id, 4, 0, ts);
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

	test('connect测试', done => {
		let fd_path = './test.client.01.sock';
		let server = net.createServer().listen(fd_path);
		server.on('connection', (socket) => {
			socket.write('{"name": "test_abc"}');
			setTimeout(() => {
				expect(client.name).toBe('test_abc');
				setTimeout(() => {
					socket.end();
					server.close();
					done();
				}, 200);
			}, 200);
		});
		let client = new core.NISPClient(fd_path);
	});

	test('end测试', done => {
		let count = 0;
		let fd_path = './test.client.02.sock';
		let server = net.createServer((socket) => {
			socket.on('end', () => {
				count = count - 1;
			});
		}).listen(fd_path);
		server.on('connection', (socket) => {
				count = count + 2;
				client.end();
				setTimeout(() => {
					server.close();
					expect(count).toBe(1);
					done();
				}, 200);
			});
		let client = new core.NISPClient(fd_path);
	});

	test('reconnect测试', done => {
		let count = 0;
		let fd_path = './test.client.03.sock';
		let flag = true;
		let server = net.createServer((socket) => {
			socket.on('end', () => {
				count = count - 3;
			});
		}).listen(fd_path);
		server.on('connection', (socket) => {
			count = count + 4;
			if (flag) {
				flag = false;
				client.end();
				setTimeout(() => {
					client.reconnect();
				}, 200);
			} else {
				socket.write('{"name": "test_abc"}');
				setTimeout(() => {
					server.close();
					client.close();
					expect(count).toBe(5);
					done();
				}, 200);
			}
		});
		let client = new core.NISPClient(fd_path);
	});

	test('heartbeat测试_01', done => {
		let count = 0;
		let fd_path = './test.client.04.sock';
		let server = net.createServer((socket) => {
			socket.on('data', (msg) => {
				let req = JSON.parse(msg.toString());
				let [cid, state_bin, ts, client_id] = datamodel.unpack_event_id(req.eid);
				expect(cid).toBe(constants.HEARTBEAT_ID);
				let evt = new datamodel.Event(client.client_id, cid, constants.STATE_PROCESS_END, ts);
				let res = {};
				res[constants.KEY_EVENT_ID] = evt.eid();
				res[constants.KEY_DATA] = {};
				res[constants.KEY_ERROR_CODE] = 0;
				socket.write(JSON.stringify(res));
				count = count + 1;
			});
		}).listen(fd_path);
		server.on('connection', (socket) => {
			socket.write('{"name": "test_abc"}');
			setTimeout(() => {
				server.close();
				client.close();
				expect(count).toBe(4);
				done();
			}, 1900);
		});
		let client = new core.NISPClient(fd_path, 500);
	});

	test('heartbeat测试_02', done => {
		let count = 0;
		let fd_path = './test.client.05.sock';
		let server = net.createServer((socket) => {
			socket.on('data', (msg) => {
				let req = JSON.parse(msg.toString());
				let [cid, state_bin, ts, client_id] = datamodel.unpack_event_id(req.eid);
				expect(cid).toBe(constants.HEARTBEAT_ID);
				let evt = new datamodel.Event(client.client_id, cid, constants.STATE_PROCESS_END, ts);
				let res = {};
				res[constants.KEY_EVENT_ID] = evt.eid();
				res[constants.KEY_DATA] = {};
				res[constants.KEY_ERROR_CODE] = 0;
				socket.write(JSON.stringify(res));
				count = count + 1;
			});
		}).listen(fd_path);
		server.on('connection', (socket) => {
			socket.write('{"name": "test_abc"}');
			setTimeout(() => {
				socket.end();
				setTimeout(() => {
					client.heartbeat();
					server.close();
					client.close();
					expect(count).toBe(3);
					done();
				}, 300);
			}, 1200);
		});
		let client = new core.NISPClient(fd_path, 500);
	});

	test('heartbeat测试_03', done => {
		let count = 0;
		let fd_path = './test.client.06.sock';
		let server = net.createServer((socket) => {
			socket.on('data', (msg) => {
				let req = JSON.parse(msg.toString());
				let [cid, state_bin, ts, client_id] = datamodel.unpack_event_id(req.eid);
				expect(cid).toBe(constants.HEARTBEAT_ID);
				let evt = new datamodel.Event(client.client_id, cid, constants.STATE_PROCESS_APPLY, ts);
				let res = {};
				res[constants.KEY_EVENT_ID] = evt.eid();
				res[constants.KEY_DATA] = {};
				res[constants.KEY_ERROR_CODE] = 0;
				socket.write(JSON.stringify(res));
				count = count + 1;
			});
		}).listen(fd_path);
		server.on('connection', (socket) => {
			socket.write('{"name": "test_abc"}');
			setTimeout(() => {
				socket.end();
				setTimeout(() => {
					client.heartbeat();
					server.close();
					client.close();
					expect(count).toBe(1);
					done();
				}, 300);
			}, 1200);
		});
		let client = new core.NISPClient(fd_path, 500);
	});

	test('error测试_01', done => {
		let fd_path = './test.client.07.sock';
		let server = net.createServer().listen(fd_path);
		server.on('connection', (socket) => {
			socket.write('{"name": "test_abc"}');
			setTimeout(() => {
				server.close();
				expect(client.name).toBe('test_abc');
				setTimeout(() => {
					client._client.emit('error', new Error('ECONNRESET'));
					setTimeout(() => {
						client.close();
						done();
					}, 200);
				}, 200);
			}, 200);
		});
		let client = new core.NISPClient(fd_path);
	});

	test('error测试_02', done => {
		let count = 0;
		let fd_path = './test.client.07.sock';
		let server = net.createServer((socket) => {
			socket.on('data', (msg) => {
				let req = JSON.parse(msg.toString());
				let [cid, state_bin, ts, client_id] = datamodel.unpack_event_id(req.eid);
				expect(cid).toBe(constants.HEARTBEAT_ID);
				let evt = new datamodel.Event(client.client_id, cid, constants.STATE_PROCESS_END, ts);
				let res = {};
				res[constants.KEY_EVENT_ID] = evt.eid();
				res[constants.KEY_DATA] = {};
				socket.write(JSON.stringify(res));
				count = count + 1;
			});
		}).listen(fd_path);
		server.on('connection', (socket) => {
			socket.write('{"name": "test_abc"}');
			setTimeout(() => {
				socket.end();
				setTimeout(() => {
					client.heartbeat();
					server.close();
					client.close();
					expect(count).toBe(1);
					done();
				}, 300);
			}, 1200);
		});
		let client = new core.NISPClient(fd_path, 500);
	});

});


