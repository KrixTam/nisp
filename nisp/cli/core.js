'use strict';

const events = require('events');
const net = require('net');
const constants = require('./constants');
const datamodel = require('./datamodel');
const utils = require('./utils');
const logger = utils.logger;

const default_init_cb = function (name) {
	let data = {};
	data[constants.KEY_NAME] = name;
	return data;
};

const init_commands = function (commands) {
	if (commands.constructor == Object) {
		for (let cid in commands) {
			datamodel.register_command(cid, default_init_cb, commands[cid]);
		};
	} else {
		throw new Error(logger.error([1202, commands]));
	}
};

const generate_event_index = function (...args) {
	if (args.length == 1) {
		let event = args[0];
		return utils.bin_to_hex(event.command.cid) + utils.digit_format(event.ts.unix(), 8, 16);	
	} else {
		if (args.length == 2) {
			let cid = args[0], ts = args[1];
			return utils.bin_to_hex(cid) + utils.digit_format(ts.unix(), 8, 16);	
		} else {
			throw new RangeError(logger.error([1204]));
		}
	}
};

var NISPClient = function (fd_path) {
	var that = this;
	this.connected = false;
	this.name = null;
	this.heartBeatList = new Array();
	this._processings = {};
	this._emitter = new events.EventEmitter();
	this._fd = { path: fd_path };
	this._client = net.createConnection(this._fd);
	this._client.on('data', function (data) {
		console.log('======= 2222 ========');
		console.log(data.toString());
		let response_content = JSON.parse(data.toString());
		if (constants.KEY_NAME in response_content) {
			that.name = response_content.name;
		} else {
			if ((constants.KEY_EVENT_ID in response_content) && (constants.KEY_ERROR_CODE in response_content) && (constants.KEY_DATA in response_content)) {
				let [cid, state, timestamp] = datamodel.unpack_event_id(response_content.eid);
				if (cid == constants.HEARTBEAT_ID) {
					// TODO...
					that.heartBeatList.pop();
				} else {
					logger.info([999, data.toString()]);
				}
				let event_index = generate_event_index(cid, timestamp);
				that._processings[event_index] = content;
				that._emitter.emit(event_index);
			} else {
				logger.warn([1200, data.toString()]);
			}
		}
		
	});
	this._client.on('connect', function () {
		that.connected = true;
		logger.info([1000]);
	});
	this._client.on('end', function () {
		// that.clearHeartBeat();
		logger.warn([1203]);
	});
	this._client.on('error', function (err) {
		logger.error([1201, err]);
	});
};

NISPClient.prototype.sendHeartBeat = function (now) {
	this.write('HB0000' + now, 'HB0000', {}, noop);
};

NISPClient.prototype.send = function (req, res, event, data, callback) {
	var that = this;
	let event_index = generate_event_index(event);
	this.write(event, data, function () {
		var content = that._processings[event_index];
		delete that._processings[event_index];
		if (callback) {
			callback(req, res, content);
		};
	});
};

NISPClient.prototype.write = function (event, data, callback) {
	// let evt = null;
	// if (null == event_id) {
	// 	evt = new datamodel.Event(command_id, state);
	// } else {
	// 	let [cid, state_bin, ts] = datamodel.unpack_event_id(event_id);
	// 	evt = new datamodel.Event(cid, state_bin, ts);
	// }
	let event_index = generate_event_index(event);
	let content = event.process(data);
	if (null != content) {
		this._processings[event_index] = null;
		this._client.write(content);
		this._emitter.once(event_index, callback);
	}
};

NISPClient.prototype.reconnect = function () {
	this._client.connect(this._fd);
};

NISPClient.prototype.clearHeartBeat = function () {
	this.connected = false;
	var length = this.heartBeatList.length;
	this.heartBeatList.splice(0, length);
};

NISPClient.prototype.end = function() {
	this.connected = false;
	this._client.end();
};

// var config = require('./config').config;
// var nispClient = new NISPClient(config.socket);

// function sendHeartBeat () {
// 	if (nispClient.connected) {
// 		var now = moment().format('YYYYMMDDHHmmss');
// 		nispClient.heartBeatList.push(now);
// 		if (nispClient.heartBeatList.length > 1) {
// 			nispClient.clearHeartBeat();
// 			log(0, null, 999, 'Connection is idel.');
// 		} else {
// 			nispClient.sendHeartBeat(now);
// 		}
// 	} else {
// 		nispClient.reconnect();
// 	}
// };

// setInterval(sendHeartBeat, config.heartBeat);

var noop = function () {};


const core = {
	noop: noop,
	// NISPClient: nispClient,	
	NISPClient: NISPClient,
	default_init_cb: default_init_cb,
	init_commands: init_commands,
	generate_event_index: generate_event_index,
};

module.exports = core;