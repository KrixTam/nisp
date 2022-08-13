'use strict';

const winston = require('winston');
const constants = require('./constants');

String.prototype.format = function (messages) {
	return this.replace(/\{(\w*)\}/g, function(match, key) { 
		let message = messages[parseInt(key)];
		if (message == undefined) {
			return 'undefined';
		} else {
			return message;
		}
	}.bind(this));
};

Array.prototype.remove = function (element, all=false) {
	let index = this.indexOf(element);
	let that = this;
	if (index > -1) {
		if (all) {
			for (let i = 0; i <= index; i++) {
				this.splice(0, 1);
			}
			return true;
		} else {
			this.splice(index, 1);
			return true;
		}
	} else {
		return false;
	}
};

var NISPLogger = function (error_def, logger_name='nisp', log_file='nisp.log') {
	let that = this;
	this._name = logger_name;
	this._logger = winston.createLogger({
		transports: [
		new winston.transports.Console(),
		new winston.transports.File({
			filename: log_file,
			format: winston.format.combine(
				winston.format.timestamp({format: 'YYYY-MM-DD HH:mm:ss.SSS'}),
				winston.format.align(),
				winston.format.printf(info => `${that._name} | ${info.level} | ${[info.timestamp]} | ${info.message.trim()}`),
			)
		})
		]
	});
	this._error_def = {};
	Object.assign(this._error_def, error_def);
};

NISPLogger.prototype.info = function (messages) {
	let msg_id = messages[0].toString();
	if (msg_id in this._error_def) {
		let message = this._error_def[msg_id].format(messages);
		this._logger.info(message);
		return message;
	} else {
		return 'undefined';
	}
};

NISPLogger.prototype.warn = function (messages) {
	let msg_id = messages[0].toString();
	if (msg_id in this._error_def) {
		let message = this._error_def[msg_id].format(messages);
		this._logger.warn(message);
		return message;
	} else {
		return 'undefined';
	}
};

NISPLogger.prototype.error = function (messages) {
	let msg_id = messages[0].toString();
	if (msg_id in this._error_def) {
		let message = this._error_def[msg_id].format(messages);
		this._logger.error(message);
		return message;
	} else {
		return 'undefined';
	}
};

const _logger = new NISPLogger(constants.ERROR_DEF);

const utils = {
	logger: _logger,
	separate_bits: function (num, bits_length) {
		if (typeof(num) == 'number') {
			if ((num >= 0) && (bits_length > 0)) {
				var right = num & ((1 << bits_length) - 1);
				var left = num >> bits_length;
				return [left, right];
			} else {
				throw new RangeError(_logger.error([1100]));
			}
		} else {
			if (bits_length > 0) {
				return [num.slice(0, -bits_length), num.slice(-bits_length)];	
			} else {
				throw new RangeError(_logger.error([1100]));	
			}
		}
	},
	digit_format: function (num, bits_length, base=2) {
		return num.toString(base).padStart(bits_length, '0');
	},
	hex_to_bin: function (hex_str) {
		let bin_str = new Array();
		for (let i = 0; i < hex_str.length; i++) {
			bin_str.push(parseInt(hex_str[i], 16).toString(2).padStart(4, '0'));
		}
		return bin_str.join('');
	},
	bin_to_hex: function (bin_str) {
		let loop = Math.ceil(bin_str.length / 4);
		let left;
		let ori_str = bin_str;
		let hex_str = new Array();
		for (let i = 0; i < loop; i++) {
			left = ori_str.slice(0, -4);
			hex_str.push(parseInt(ori_str.slice(-4), 2).toString(16));
			ori_str = left;
		}
		hex_str.reverse();
		return hex_str.join('');
	},
	copy_json: function (dict) {
		if (typeof(dict) == 'string') {
			return JSON.parse(dict);
		} else {
			if (dict.constructor == Object) {
				return JSON.parse(JSON.stringify(dict));
			} else {
				return null;
			}
		}
	}
};

module.exports = utils;