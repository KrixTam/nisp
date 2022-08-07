const moment = require('moment');
const nisp = require('../nisp');
const utils = require('../utils')
const digit_format = utils.digit_format, bin_to_hex = utils.bin_to_hex;
const constants = require('../constants');


var add = function (data) {
    return data[0] + data[1];
};

var times = function (data) {
    return data[0] * data[1];
}

var add_adj = function (data) {
    return {
        'ec': 0,
        'data': data['a'] + data['b']
    };
};

var times_adj = function (data) {
    return {
        'ec': 0,
        'data': data['a'] * data['b']
    };
}


describe('测试unpack_event_id', () => {

	test('正常情况', () => {
		let ts = moment('2021-01-02 12:23:22');
        let ts_shadow = '000000010000100000000111101001111000101000100000';
        let random_code = '101100';
        let position_code = '0000';
        let command_01 = digit_format(4, constants.COMMAND_ID_BITS);
        let command_01_state = '00';
        let event_id = bin_to_hex(random_code + ts_shadow + position_code + command_01_state + command_01, 2);
        let [cid_02, state_02, timestamp] = nisp.unpack_event_id(event_id);
        expect(command_01).toBe(cid_02);
        expect(command_01_state).toBe(state_02);
        expect(timestamp.format('YYYYMMDD HHmmss.SSS')).toBe(ts.format('YYYYMMDD HHmmss.SSS'));
	});

    test('时间逆流', () => {
        const t = () => {
            nisp.unpack_event_id('58ca6e32b444000000');
        };
        expect(t).toThrow(RangeError);
    });

    test('random_code校验失败', () => {
        const t = () => {
            nisp.unpack_event_id('8080100e4e14c14000');
        };
        expect(t).toThrow(RangeError);
    });

});

describe('测试Command', () => {

    test('正常情况_01', () => {
        let c = new nisp.Command(1, add, times);
        expect(c.cid).toBe('000000000001');
        expect(c.state).toBe(constants.STATE_INIT_PRE);
    });

    test('正常情况_02', () => {
        let c = new nisp.Command(4, add, times, 1);
        expect(c.cid).toBe('000000000100');
        expect(c.state).toBe(constants.STATE_INIT_END);
    });

    test('正常情况_03', () => {
        let c1 = new nisp.Command('100', add, times, '11');
        let c2 = new nisp.Command(4, add, times, 3);
        expect(c1.cid).toBe(c2.cid);
        expect(c1.state).toBe(c2.state);
    });

    test('register_command', () => {
        let c = new nisp.Command('100', add, times);
        let r = c.register_command('000010000100', add, times);
        expect(r).toBe(true);
        r = c.register_command('000000000100', add, times);
        expect(r).toBe(false);
    });

    test('error_01', () => {
        const t = () => {
            new nisp.Command(4, add, times, 4);
        };
        expect(t).toThrow(RangeError);
    });

    test('error_02', () => {
        const t = () => {
            new nisp.Command(4096, add, times, 4);
        };
        expect(t).toThrow(RangeError);
    });

    test('error_03', () => {
        const t = () => {
            new nisp.Command(-1, add, times);
        };
        expect(t).toThrow(RangeError);
    });

    test('error_04', () => {
        const t = () => {
            new nisp.Command(0, add, times, -2);
        };
        expect(t).toThrow(RangeError);
    });

    test('error_05', () => {
        const t = () => {
            new nisp.Command(99, null, null);
        };
        expect(t).toThrow(Error);
    });

    test('next_01', () => {
        let c = new nisp.Command(1);
        expect(c.state).toBe(constants.STATE_INIT_PRE);
        let r = c.next([1, 2]);
        expect(c.state).toBe(constants.STATE_INIT);
        expect(r).toBe(3);
        r = c.next([1, 2]);
        expect(c.state).toBe(constants.STATE_INIT_END);
        expect(r).toBe(null);
        r = c.next([1, 2]);
        expect(c.state).toBe(constants.STATE_PROCESS_APPLY);
        expect(r).toBe(2);
    });

    test('next_02', () => {
        let c = new nisp.Command(8, add_adj, times_adj, 3);
        expect(c.state).toBe(constants.STATE_PROCESS_END);
        let r = c.next([1, 2]);
        expect(c.state).toBe(constants.STATE_PROCESS_END);
        expect(r).toBe(null);
    });

});

describe('测试Event', () => {

    test('正常情况_01', () => {
        let ts = moment('2021-01-02 12:23:22');
        let evt = new nisp.Event(4, 0, ts);
        let event_id = evt.eid();
        let [cid_02, state_02, timestamp] = nisp.unpack_event_id(event_id);
        expect(parseInt(evt.command.cid, 2)).toBe(4);
        expect(evt.command.cid).toBe(cid_02);
        expect(evt.command.state).toBe(parseInt(state_02, 2));
        expect(timestamp.format('YYYYMMDD HHmmss.SSS')).toBe(ts.format('YYYYMMDD HHmmss.SSS'));
    });

    test('正常情况_02', () => {
        let evt = new nisp.Event(4, 0);
        let event_id = evt.eid();
        let [cid_02, state_02, timestamp] = nisp.unpack_event_id(event_id);
        expect(parseInt(evt.command.cid, 2)).toBe(4);
        expect(evt.command.cid).toBe(cid_02);
        expect(evt.command.state).toBe(parseInt(state_02, 2));
        expect(timestamp.format('YYYYMMDD HHmmss.SSS')).toBe(evt.ts.format('YYYYMMDD HHmmss.SSS'));
    });

    test('error_01', () => {
        const t = () => {
            new nisp.Event(4, 0, moment('2019-01-02 12:23:22'));
        };
        expect(t).toThrow(RangeError);
    });

    test('process_01', () => {
        let evt = new nisp.Event(8);
        let res = JSON.parse(evt.process({'a': 2, 'b': 7}));
        expect(res.ec).toBe(0);
        expect(res.data).toBe(9);
        expect(res.eid).toBe(evt.eid());
        let [cid_02, state_02, timestamp] = nisp.unpack_event_id(res.eid);
        expect(evt.command.state).toBe(constants.STATE_INIT);
        expect(evt.command.cid).toBe(cid_02);
        expect(evt.command.state).toBe(parseInt(state_02, 2));
    });

    test('process_02', () => {
        let evt = new nisp.Event(8, constants.STATE_INIT);
        let res = JSON.parse(evt.process({'a': 2, 'b': 7}));
        expect(res).toBe(null);
        expect(evt.command.state).toBe(constants.STATE_INIT_END);
    });

    test('process_03', () => {
        let evt = new nisp.Event(8, constants.STATE_INIT_END);
        let res = JSON.parse(evt.process({'a': 2, 'b': 7}));
        expect(res.ec).toBe(0);
        expect(res.data).toBe(14);
        expect(res.eid).toBe(evt.eid());
        let [cid_02, state_02, timestamp] = nisp.unpack_event_id(res.eid);
        expect(evt.command.state).toBe(constants.STATE_PROCESS_APPLY);
        expect(evt.command.cid).toBe(cid_02);
        expect(evt.command.state).toBe(parseInt(state_02, 2));
    });

    test('process_04', () => {
        let evt = new nisp.Event(8);
        let res = JSON.parse(evt.process([2, 7]));
        expect(res).toBe(null);
        expect(evt.command.state).toBe(constants.STATE_INIT_PRE);
    });

});