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
		if (timestamp >= now) {
			throw new RangeError(logger.error([1001, event_id]));
		}
		return [cid, state, timestamp];
	} else {
		throw new RangeError(logger.error([1002, random_code, random_code_check]));
	}
};

var COMMAND_PROCESSORS = {};

var Command = function (cid, init_callback, process_callback, state = 0) {
	let cid_value = (typeof(cid) == 'number') ? cid : parseInt(cid, 2);
	let state_value = (typeof(state) == 'number') ? state : parseInt(state, 2);
	if ((cid_value > constants.COMMAND_ID_MAX) || (cid_value < constants.COMMAND_ID_MIN) || (state_value > constants.STATE_MAX) || (state_value < constants.STATE_MIN)) {
		throw new RangeError(logger.error([1003, cid_value, state_value]));
	} else {
		this.cid = digit_format(cid_value, constants.COMMAND_ID_BITS);
		this.state = digit_format(state_value, constants.COMMAND_STATE_BITS);
	}
	if (this.cid in COMMAND_PROCESSORS) {
		this.init_cb = COMMAND_PROCESSORS[this.cid][0];
		this.process_cb = COMMAND_PROCESSORS[this.cid][1];
	} else {
		if ((init_callback == null) || (process_callback == null)) {
			throw new Error(logger.error([1005, this.cid]));
		} else {
			this.register_command(this.cid, init_callback, process_callback);
			this.init_cb = init_callback;
			this.process_cb = process_callback;
		}
	}
};

Command.prototype.register_command = function (cid, init_callback, process_callback) {
	if (cid in COMMAND_PROCESSORS) {
		logger.warn([1006, cid]);
	} else {
		COMMAND_PROCESSORS[cid] = [init_callback, process_callback];
	}
};

Command.prototype.next = function (data) {
	let state_value = parseInt(this.state, 2);
	let result = null;
	if (state_value < constants.STATE_MAX) {
		if (state_value == constants.STATE_INIT) {
			result = this.init_cb(data);
		}
		if (state_value == constants.STATE_PROCESS_APPLY) {
			result = this.process_cb(data);
		}
		state_value = state_value + 1;
		this.state = digit_format(state_value, constants.COMMAND_STATE_BITS);
	}
	return result;
};

var Event = function (cid, state = 0, ts = null) {
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
};

Event.prototype.eid = function () {
	let eid_bin = this.random_code + this.timestamp_shadow + this.position_code + this.command.state + this.command.cid;
	return bin_to_hex(eid_bin);
};

Event.prototype.process = function () {
	let that = this;
	// let data = Commands[this.command.cid](that);
	// let 
	if (this.command.state == constants.STATE_INIT_END) {
		;
	}
	if (this.command.state == constants.STATE_PROCESS_END) {
		;
	}
};

const nisp = {
	unpack_event_id: unpack,
	Command: Command,
	Event: Event,
};

module.exports = nisp;