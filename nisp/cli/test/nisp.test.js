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


describe('测试unpack_event_id', () => {

	test('正常情况', () => {
		let ts = moment('2021-01-02 12:23:22');
        let ts_shadow = '000000010000100000000111101001111000101000100000';
        let random_code = '101100';
        let position_code = '0000';
        let command_01 = digit_format(4, constants.COMMAND_ID_BITS);
        // console.log(command_01);
        let command_01_state = '00';
        let event_id = bin_to_hex(random_code + ts_shadow + position_code + command_01_state + command_01, 2);
        // console.log(event_id);
        let [cid_02, state_02, timestamp] = nisp.unpack_event_id(event_id);
        // console.log([cid_02, state_02, timestamp]);
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
        expect(c.state).toBe('00');
    });

    test('正常情况_02', () => {
        let c = new nisp.Command(4, add, times, 1);
        expect(c.cid).toBe('000000000100');
        expect(c.state).toBe('01');
    });

    test('正常情况_03', () => {
        let c1 = new nisp.Command('100', add, times, '11');
        let c2 = new nisp.Command(4, add, times, 3);
        expect(c1.cid).toBe(c2.cid);
        expect(c1.state).toBe(c2.state);
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
            new nisp.Command(0, add, times, -1);
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
        expect(c.state).toBe('00');
        let r = c.next([1, 2]);
        expect(c.state).toBe('01');
        expect(r).toBe(3);
        r = c.next([1, 2]);
        expect(c.state).toBe('10');
        expect(r).toBe(null);
        r = c.next([1, 2]);
        expect(c.state).toBe('11');
        expect(r).toBe(2);
    });

    test('next_02', () => {
        let c = new nisp.Command(1, add, times, 3);
        expect(c.state).toBe('11');
        let r = c.next([1, 2]);
        expect(c.state).toBe('11');
        expect(r).toBe(null);
    });

});

describe('测试Event', () => {

    test('正常情况_01', () => {
        let ts = moment('2021-01-02 12:23:22');
        let evt = new nisp.Event(4, 0, ts);
        let event_id = evt.eid();
        console.log(event_id);
        let [cid_02, state_02, timestamp] = nisp.unpack_event_id(event_id);
        expect(evt.command.cid).toBe(cid_02);
        expect(evt.command.state).toBe(state_02);
        expect(timestamp.format('YYYYMMDD HHmmss.SSS')).toBe(ts.format('YYYYMMDD HHmmss.SSS'));
    });

});