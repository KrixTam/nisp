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
		let timestamp = constants.EPOCH_MOMENT.add(parseInt(ts, 2) + settings.epoch - constants.EPOCH_DEFAULT, 'ms');
		if (timestamp >= moment()) {
			throw new RangeError(logger.error([1001, event_id]));
		}
		return [cid, state, timestamp];
	} else {
		throw new RangeError(logger.error([1002, random_code, random_code_check]));
	}
};

var Command = function (cid, state = 0) {
	let cid_value = (typeof(cid) == 'number') ? cid : parseInt(cid, 2);
	let state_value = (typeof(state) == 'number') ? state : parseInt(state, 2);
	if ((cid_value > constants.COMMAND_ID_MAX) || (cid_value < constants.COMMAND_ID_MIN) || (state_value > constants.STATE_MAX) || (state_value < constants.STATE_MIN)) {
		throw new RangeError(logger.error([1003, cid_value, state_value]));
	} else {
		this.cid = digit_format(cid_value, constants.COMMAND_ID_BITS);
		this.state = digit_format(state_value, constants.COMMAND_STATE_BITS);
	}
};

Command.prototype.next = function () {
	let state_value = parseInt(this.state, 2);
	if (state_value < constants.STATE_MAX) {
		state_value = state_value + 1;
		this.state = digit_format(state_value, constants.COMMAND_STATE_BITS);
	}
};

const nisp = {
	unpack_event_id: unpack,
	Command: Command,
};

module.exports = nisp;