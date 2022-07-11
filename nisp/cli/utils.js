const winston = require('winston');
const constants = require('./constants');

String.prototype.format = function(messages) {
	return this.replace(/\{(\w*)\}/g, function(match, key) { 
		let message = messages[parseInt(key)];
		// console.log(match);
		return message !== 'undefined' ? message : match;
	}.bind(this));
};

var NISPLogger = function(error_def, logger_name='nisp', log_file='nisp.log') {
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
			    )})
		]
	});
	this._error_def = {};
	Object.assign(this._error_def, error_def);
};

NISPLogger.prototype.info = function(messages) {
	let msg_id = messages[0].toString();
	if (msg_id in this._error_def) {
		let message = this._error_def[msg_id].format(messages);
		this._logger.info(message);
		return message;
	} else {
		return 'undefined';
	}
};

NISPLogger.prototype.warn = function(messages) {
	let msg_id = messages[0].toString();
	if (msg_id in this._error_def) {
		let message = this._error_def[msg_id].format(messages);
		this._logger.warn(message);
		return message;
	} else {
		return 'undefined';
	}
};

NISPLogger.prototype.error = function(messages) {
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
		if ((num >= 0) && (bits_length > 0)) {
			right = num & ((1 << bits_length) - 1);
			left = num >> bits_length;
			return [left, right];
		} else {
			throw new RangeError(_logger.error([1100]))
		}
	}
};

module.exports = utils;