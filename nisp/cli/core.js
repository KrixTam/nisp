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

const once = function (emitter, event_name, listener) {
    return new Promise(function (resolve) {
        emitter.once(event_name, (data) => {
        	let res = listener(data);
        	resolve(res);
        });
    });
};

var noop = function () {};

let HEARTBEAT = {};
HEARTBEAT[constants.HEARTBEAT_ID] = function (data) {};

init_commands(HEARTBEAT);

var NISPClient = function (fd_path, heartbeat_interval=5000) {
	this.connected = false;
	this.name = null;
	this.heartbeat_interval = heartbeat_interval;
	// this.heartBeatList = new Array();
	this._processings = {};
	this._emitter = new events.EventEmitter();
	this._fd = { path: fd_path };
	this._client = null;
	this.connect();
};

NISPClient.prototype.heartbeat = function () {
	if (this.connected) {
		console.log('j88888888888');
		var that = this;
		let evt = new datamodel.Event(constants.HEARTBEAT_ID);
		this.send(evt, that.name, () => {
			setTimeout(that.heartbeat, that.heartbeat_interval);
		});
	} else {
		logger.warn([1206]);
	}
};

NISPClient.prototype.send = function (event, data, callback) {
	// let evt = null;
	// if (null == event_id) {
	// 	evt = new datamodel.Event(command_id, state);
	// } else {
	// 	let [cid, state_bin, ts] = datamodel.unpack_event_id(event_id);
	// 	evt = new datamodel.Event(cid, state_bin, ts);
	// }
	console.log(data);
	let content = event.process(data);
	if (null != content) {
		let event_index = generate_event_index(event);
		this._processings[event_index] = null;
		console.log('999999999999999');
		logger.info([999, content]);
		this._client.write(content);
		this._emitter.once(event_index, callback);
	}
};

NISPClient.prototype.connect = function () {
	if (this.connected == false) {
		var that = this;
		this._client = net.createConnection(this._fd)
		.on('data', function (data) {
			console.log('======= 2222 ========');
			// console.log(data.toString());
			let response_content = JSON.parse(data.toString());
			if (constants.KEY_NAME in response_content) {
				that.name = response_content.name;
				console.log(that.heartbeat_interval);
				that.heartbeat();
			} else {
				if ((constants.KEY_EVENT_ID in response_content) && (constants.KEY_ERROR_CODE in response_content) && (constants.KEY_DATA in response_content)) {
					let [cid, state, timestamp] = datamodel.unpack_event_id(response_content.eid);
					logger.info([999, data.toString()]);
					let state_value = parseInt(state, 2);
					let event_index = generate_event_index(cid, timestamp);
					if (cid == constants.HEARTBEAT_ID) {
						console.log('state.......');
						console.log(state_value);
						if (state_value == constants.STATE_PROCESS_END) {
							that._emitter.emit(event_index);	
						} else {
							logger.warn([1205]);
							that.end();
						}
					} else {
						if (state_value == constants.STATE_INIT_END) {
							that._emitter.emit(event_index, response_content.data).then()
						} else {
							if (state_value == constants.STATE_PROCESS_END) {

							}
						}
					}
				} else {
					logger.warn([1200, data.toString()]);
				}
			}
		}).on('connect', function () {
			that.connected = true;
			logger.info([1000]);
		}).on('end', function () {
			that.connected = false;
			// that.clearHeartBeat();
			logger.warn([1203]);
		}).on('error', function (err) {
			/* istanbul ignore next */
			that.connected = false;
			logger.error([1201, err]);
		});
	}
};

NISPClient.prototype.reconnect = function () {
	this._client.destroy();
	this.connect();
};

// NISPClient.prototype.clearHeartBeat = function () {
// 	this.connected = false;
// 	var length = this.heartBeatList.length;
// 	this.heartBeatList.splice(0, length);
// };

NISPClient.prototype.end = function() {
	this.connected = false;
	this._client.end();
};

NISPClient.prototype.close = function() {
	this.end();
	this._client.destroy();
	this._client = null;
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


const core = {
	noop: noop,
	// NISPClient: nispClient,	
	NISPClient: NISPClient,
	default_init_cb: default_init_cb,
	init_commands: init_commands,
	generate_event_index: generate_event_index,
	once: once,
};

module.exports = core;