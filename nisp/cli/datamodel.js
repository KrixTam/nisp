'use strict';

const moment = require('moment');
const events = require('events');
const constants = require('./constants');
const utils = require('./utils');
const logger = utils.logger, separate_bits = utils.separate_bits, digit_format = utils.digit_format, hex_to_bin = utils.hex_to_bin, bin_to_hex = utils.bin_to_hex;

const settings = {
	epoch: constants.EPOCH_DEFAULT
};

var Commands = {};

const unpack = function(event_id) {
	let eid_bin = hex_to_bin(event_id);
	let left, cid, state, position_code, position_code_value, right, package_bits;
	[left, cid] = separate_bits(eid_bin, constants.COMMAND_ID_BITS);
	[left, state] = separate_bits(left, constants.COMMAND_STATE_BITS);
	[left, position_code] = separate_bits(left, constants.POSITION_CODE_BITS);
	position_code_value = parseInt(position_code, 2);
	let [random_code_value, timestamp_shadow_value] = separate_bits(left, constants.TIMESTAMP_SHADOW_BITS);
	let random_code = digit_format(random_code_value, constants.RANDOM_CODE_BITS);
	left = timestamp_shadow_value;
	let random_code_check_list = new Array(), timestamp_list = new Array();
	for (let i = 0; i < constants.RANDOM_CODE_BITS; i++) {
		[left, right] = separate_bits(left, constants.TS_PACKAGE_LEN);
		package_bits = digit_format(right, constants.TS_PACKAGE_LEN).split('');
		package_bits.reverse();
		random_code_check_list.push(package_bits[position_code_value]);
		package_bits.splice(position_code_value, 1);
		package_bits.reverse();
		timestamp_list.push(package_bits.join(''));
	};
	timestamp_list.reverse();
	random_code_check_list.reverse();
	let random_code_check = random_code_check_list.join('');
	let ts = timestamp_list.join('');
	if (random_code == random_code_check) {
		let timestamp = new moment(constants.EPOCH_MOMENT).add(parseInt(ts, 2) + settings.epoch - constants.EPOCH_DEFAULT, 'ms');
		let now = new moment();
		if (timestamp > now) {
			throw new RangeError(logger.error([1001, event_id]));
		}
		return [cid, state, timestamp];
	} else {
		throw new RangeError(logger.error([1002, random_code, random_code_check]));
	}
};


const is_function = function (function_to_check) {
	return function_to_check && {}.toString.call(function_to_check) === '[object Function]';
};

var COMMAND_PROCESSORS = {};

const register_command = function (cid, init_callback, process_callback) {
	if (cid in COMMAND_PROCESSORS) {
		logger.warn([1006, cid]);
		return false;
	} else {
		if (is_function(init_callback) && is_function(process_callback)) {
			COMMAND_PROCESSORS[cid] = [init_callback, process_callback];
			return true;
		} else {
			logger.warn([1007]);
			return false;
		}
	}
};

var Command = function (cid, init_callback, process_callback, state = constants.STATE_INIT_PRE) {
	let cid_value = (typeof(cid) == 'number') ? cid : parseInt(cid, 2);
	let state_value = (typeof(state) == 'number') ? state : parseInt(state, 2);
	if ((cid_value > constants.COMMAND_ID_MAX) || (cid_value < constants.COMMAND_ID_MIN) || (state_value > constants.STATE_MAX) || (state_value < constants.STATE_MIN)) {
		throw new RangeError(logger.error([1003, cid_value, state_value]));
	} else {
		this.cid = digit_format(cid_value, constants.COMMAND_ID_BITS);
		this.state = state_value;
	}
	if (this.cid in COMMAND_PROCESSORS) {
		this.init_cb = COMMAND_PROCESSORS[this.cid][0];
		this.process_cb = COMMAND_PROCESSORS[this.cid][1];
	} else {
		if ((init_callback == null) || (process_callback == null)) {
			throw new Error(logger.error([1005, this.cid]));
		} else {
			register_command(this.cid, init_callback, process_callback);
			this.init_cb = init_callback;
			this.process_cb = process_callback;
		}
	}
};

Command.prototype.to_bin = function () {
	let state = digit_format(this.state, constants.COMMAND_STATE_BITS);
	return state + this.cid;
}

Command.prototype.next = function (...data) {
	let result = null;
	if (this.state < constants.STATE_MAX) {
		if (this.state == constants.STATE_INIT_PRE) {
			result = this.init_cb(...data);
		}
		if (this.state == constants.STATE_INIT_END) {
			result = this.process_cb(...data);
		}
		this.state = this.state + 1;
	}
	return result;
};

var Event = function (clientId, cid, state = constants.STATE_INIT_PRE, ts = null) {
	this.command = new Command(cid, null, null, state);
	this.ts = ts;
	if (ts == null) {
		this.ts = new moment();
	}
	this.random_code = digit_format(Math.floor(Math.random() * (constants.RANDOM_CODE_MAX + 1)), constants.RANDOM_CODE_BITS);
	let position_code_value = Math.floor(Math.random() * (constants.POSITION_CODE_MAX + 1));
	this.position_code = digit_format(position_code_value, constants.POSITION_CODE_BITS);
	if (this.ts.unix() < settings.epoch) {
		throw new RangeError(logger.error([1004, this.ts.format('YYYY-MM-DD HH:mm:ss.SSS')]));
	}
	let ts_value = (this.ts - moment(constants.EPOCH_MOMENT));
	ts_value = ts_value - settings.epoch + constants.EPOCH_DEFAULT;
	let timestamp_bin = digit_format(ts_value, constants.TIMESTAMP_BITS);
	let length = constants.TS_PACKAGE_LEN - 1;
	let timestamp_shadow_list = new Array();
	let random_code_list = this.random_code.split('');
	random_code_list.reverse();
	let position = length - position_code_value;
	let left = timestamp_bin;
    let right, bits;
    for (let i = 0; i < constants.RANDOM_CODE_BITS; i++) {
    	[left, right] = separate_bits(left, length);
        timestamp_shadow_list.push([right.slice(0, position), random_code_list[i], right.slice(position)].join(''));
    }
    timestamp_shadow_list.reverse();
    this.timestamp_shadow = timestamp_shadow_list.join('');
	// 新增：保存clientId并规范化为4位小写hex
    this.clientId = utils.normalize_clientid(clientId);
};

Event.prototype.eid = function () {
	let eid_bin = this.random_code + this.timestamp_shadow + this.position_code + this.command.to_bin();
	// 原有逻辑生成18位事件编码
    const base18 = bin_to_hex(eid_bin);
	// 追加4位clientId，形成22位eid
	return base18 + this.clientId;
};

Event.prototype.process = function (...data) {
	let result = this.command.next(...data);
	if (result == null) {
		return null;
	} else {
		let request_content = {};
		request_content[constants.KEY_EVENT_ID] = this.eid();
		request_content[constants.KEY_DATA] = result;
		return JSON.stringify(request_content);
	}
};

// 修改：unpack返回clientId
function unpack_event_id(eid) {
    if (typeof eid !== 'string') throw new TypeError('[1204] unpack_event_id only accepts string');
    if (!/^[a-f0-9]{22}$/.test(eid)) throw new RangeError('[1001] illegal eid length or pattern');

    const base18 = eid.slice(0, 18);
    const clientId = eid.slice(18, 22);

    // 原有的18位解析逻辑
    const [cid_bin, state_bin, ts] = unpack(base18);
    // 返回四元组，兼容旧调用可只解构前三个
    return [cid_bin, state_bin, ts, clientId];
}

const datamodel = {
	unpack_event_id: unpack_event_id,
	Command: Command,
	Event: Event,
	register_command: register_command,
	is_function: is_function,
};

module.exports = datamodel;