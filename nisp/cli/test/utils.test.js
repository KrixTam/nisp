const utils = require('../utils');

describe('测试String.format', () => {

	test('正常情况', () => {
		expect('[{0}] {1}值({2})异常，合理范围应为[{3}, {4}]。'.format([5001, 'abc', 1, 3, 4])).toBe('[5001] abc值(1)异常，合理范围应为[3, 4]。');
	});

	test('数量不匹配的情况', () => {
		expect('[{0}] {1}值({2})异常，合理范围应为[{3}, {4}]。'.format([5001, 'bcd'])).toBe('[5001] bcd值(undefined)异常，合理范围应为[undefined, undefined]。');
	});

});

describe('测试logger', () => {

	test('info', () => {
		expect(utils.logger.info([1000])).toBe('[1000] 连接建立。');
	});

	test('warn', () => {
		expect(utils.logger.warn([1000])).toBe('[1000] 连接建立。');
	});

	test('error', () => {
		expect(utils.logger.error([1000])).toBe('[1000] 连接建立。');
	});

	test('info undefined', () => {
		expect(utils.logger.info([0])).toBe('undefined');
	});

	test('warn undefined', () => {
		expect(utils.logger.warn([0])).toBe('undefined');
	});

	test('error undefined', () => {
		expect(utils.logger.error([0])).toBe('undefined');
	});

});

describe('测试separate_bits', () => {

	test('num为数字，正常情况', () => {
		let a = parseInt('1001110001111011111101', 2);
		let [l, r] = utils.separate_bits(a, 4);
		expect(l).toBe(parseInt('100111000111101111', 2));
		expect(r).toBe(parseInt('1101', 2));
	});

	test('num为数字，指定切割位大于原数值的位数', () => {
		let a = 1;
        let [l, r] = utils.separate_bits(a, 4);
        expect(l).toBe(0);
        expect(r).toBe(1);
	});

	test('num为数字，指定切割的原数值为0', () => {
		let a = 0;
        let [l, r] = utils.separate_bits(a, 4);
        expect(l).toBe(0);
        expect(r).toBe(0);
	});

	test('num为数字，error', () => {
		const t = () => {
			utils.separate_bits(0, 0);
		};
		expect(t).toThrow(RangeError);
	});

	test('num为二进制字符串，正常情况', () => {
		let a = '1001110001111011111101';
		let [l, r] = utils.separate_bits(a, 4);
		expect(l).toBe('100111000111101111');
		expect(r).toBe('1101');
	});

	test('num为二进制字符串，error', () => {
		const t = () => {
			utils.separate_bits('1001110001111011111101', 0);
		};
		expect(t).toThrow(RangeError);
	});

});

describe('测试digit_format', () => {

	test('正常情况', () => {
		expect(utils.digit_format(3, 4)).toBe('0011');
		expect(utils.digit_format(3, 4, 16)).toBe('0003');
	});

});

describe('测试hex_to_bin', () => {

	test('正常情况', () => {
		expect(utils.hex_to_bin('3')).toBe('0011');
		expect(utils.hex_to_bin('4a')).toBe('01001010');
	});

});

describe('测试bin_to_hex', () => {

	test('正常情况', () => {
		expect(utils.bin_to_hex('101100000000010000100000000111101001111000101000100000000000000000000100')).toBe('b004201e9e28800004');
		expect(utils.bin_to_hex('1001010')).toBe('4a');
		expect(utils.bin_to_hex('0011')).toBe('3');
	});

});