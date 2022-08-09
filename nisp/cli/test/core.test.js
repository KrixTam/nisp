const moment = require('moment');
const net = require('net');
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

describe('测试NISPClient', () => {

	test('connect', done => {
		let server = net.createServer();
		let fd_path = './test.client.sock';
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

	// test('connect', done => {
	// 	let server = net.createServer();
	// 	let fd_path = './test.client.sock';
	// 	server.listen(fd_path);
	// 	server.on('connection', function (socket) {
	// 		socket.write('{"name": "test_abc"}');
	// 		setTimeout(() => {
	// 			expect(client.name).toBe('test_abc');
	// 			setTimeout(async () => {
	// 				socket.end();
	// 				server.close();
	// 				done();
	// 			}, 300);
	// 		}, 300);
	// 	});
	// 	let client = new core.NISPClient(fd_path);
	// });


});


