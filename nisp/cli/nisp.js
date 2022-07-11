const moment = require('moment');
const events = require('events');
const constants = require('./constants');
const logger = require('./utils').logger;


/*
function unpack_event_id(event_id, ignore_nic = true) {
	value = parseInt(event_id);
	[left, nic_value] = separate_bits(value, NIC_BITS);
	[left, cid_value] = separate_bits(left, COMMAND_ID_BITS)
	left, state_value = separate_bits(left, COMMAND_STATE_BITS)
	cid = CommandId(cid_value)
	state = CommandState(state_value)
	left, position_code_value = separate_bits(left, POSITION_CODE_BITS)
	random_code_value, timestamp_shadow_value = separate_bits(left, TIMESTAMP_SHADOW_BITS)
	random_code = BIN_REG.format(random_code_value, RANDOM_CODE_BITS)
	left = timestamp_shadow_value
	random_code_check_list = []
	timestamp_list = []
	for i in range(RANDOM_CODE_BITS):
		left, right = separate_bits(left, TS_PACKAGE_LEN)
	package_bits = list(BIN_REG.format(right, TS_PACKAGE_LEN))
	package_bits.reverse()
	random_code_check_list.append(package_bits[position_code_value])
	del package_bits[position_code_value]
	package_bits.reverse()
	timestamp_list.append(''.join(package_bits))
	timestamp_list.reverse()
	random_code_check_list.reverse()
	random_code_check = ''.join(random_code_check_list)
	ts = ''.join(timestamp_list)
	if random_code == random_code_check:
		timestamp = EPOCH_MOMENT.add(int(ts, 2) + EventId._epoch - EPOCH_DEFAULT, 'ms')
	if timestamp >= moment():
		raise ValueError(logger.error([1205]))
	else:
		nic = BIN_REG.format(nic_value, NIC_BITS)
	nic_check = EventId.network_interface_controller()
	if ignore_nic:
		pass
	else:
		if nic != nic_check:
			raise ValueError(logger.error([1207, nic, nic_check]))
		return cid, state, timestamp, nic
		else:
			raise ValueError(logger.error([1206, random_code, random_code_check]))
	};

*/