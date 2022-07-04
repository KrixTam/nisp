import unittest
from nisp.datamodel import EventId, Command
from moment import moment


class TestEventId(unittest.TestCase):
    def test_timestamp_shadow_01(self):
        ts = moment('2021-01-02 12:23:22')
        ts_shadow, timestamp_bin = EventId.timestamp_shadow('101100', 0, ts)
        self.assertEqual('000000010000100000000111101001111000101000100000', ts_shadow)

    def test_timestamp_shadow_02(self):
        ts = moment('2011-01-02 12:23:22')
        with self.assertRaises(ValueError):
            EventId.timestamp_shadow('101100', 0, ts)

    def test_unpack(self):
        ts = moment('2021-01-02 12:23:22')
        ts_shadow = '000000010000100000000111101001111000101000100000'
        random_code = '101100'
        position_code = '0000'
        command_01 = Command(4)
        nic_01 = EventId.network_interface_controller()
        event_id = int(random_code + ts_shadow + position_code + str(command_01) + nic_01, 2)
        cid_02, state_02, timestamp, nic_02 = EventId.unpack(event_id)
        command_02 = Command(cid_02.value, state_02.value)
        self.assertEqual(command_01, command_02)
        self.assertEqual(nic_01, nic_02)
        self.assertEqual(ts, timestamp)

    def test_basic_01(self):
        ts = moment('2021-01-02 12:23:22')
        nic = EventId.network_interface_controller()
        eid = EventId(0, 0, nic, ts)
        cid_01, state_01, timestamp_01, nic_01 = EventId.unpack(str(eid))
        eid_01 = EventId(cid_01.value, state_01.value, nic_01, timestamp_01)
        self.assertEqual(eid_01.core, eid.core)

    def test_basic_02(self):
        ts = moment('2021-01-02 12:23:22')
        nic = EventId.network_interface_controller()
        eid = EventId(0, 0, nic, ts)
        cid_01, state_01, timestamp_01, nic_01 = EventId.unpack(eid)
        eid_01 = EventId(cid_01.value, state_01.value, nic_01, timestamp_01)
        self.assertTrue(eid_01.equal(eid))

    def test_basic_03(self):
        ts = moment('2021-01-02 12:23:22')
        nic = EventId.network_interface_controller()
        eid = EventId(0, 0, nic, ts)
        cid_01, state_01, timestamp_01, nic_01 = EventId.unpack(eid)
        eid_01 = EventId(cid_01.value, state_01.value, nic_01, timestamp_01)
        self.assertTrue(eid_01 == str(eid_01))
        self.assertNotEqual(eid, eid_01)
        self.assertTrue(eid_01.equal(eid))

    def test_basic_04(self):
        ts = moment('2021-01-02 12:23:22')
        nic = EventId.network_interface_controller()
        eid = EventId(0, 0, nic, ts)
        cid_01, state_01, timestamp_01, nic_01 = EventId.unpack(eid)
        eid_01 = EventId(cid_01.value, state_01.value, nic_01, timestamp_01)
        self.assertTrue(eid_01 == eid_01.value)
        self.assertNotEqual(eid, eid_01)
        self.assertTrue(eid_01.equal(eid))

    def test_error_01(self):
        with self.assertRaises(TypeError):
            EventId.unpack(['1231'])

    def test_error_02(self):
        eid = EventId(cid=1)
        with self.assertRaises(TypeError):
            eid.__ne__([123])

    def test_error_03(self):
        eid = EventId(cid=1)
        with self.assertRaises(TypeError):
            eid.equal([123])

    def test_error_04(self):
        with self.assertRaises(ValueError):
            EventId.unpack('8080100e4e14c14000271efe')

    def test_error_05(self):
        # from moment import moment
        # EventId._epoch = moment('1990-12-11').unix()
        # print(EventId(timestamp=moment('2018-10-28')))
        with self.assertRaises(ValueError):
            EventId.unpack('58ca6e32b444000000271efe')

    def test_error_06(self):
        ts = moment('2021-01-02 12:23:22')
        ts_shadow = '000000010000100000000111101001111000101000100000'
        random_code = '101100'
        position_code = '0000'
        command_01 = Command(8)
        nic_01 = EventId.network_interface_controller()
        nic_01_01 = list(nic_01)
        for i in range(4):
            nic_01_01[i] = '1'
        nic_01_02 = ''.join(nic_01_01)
        event_id = int(random_code + ts_shadow + position_code + str(command_01) + nic_01_02, 2)
        with self.assertRaises(ValueError):
            EventId.unpack(event_id, False)

    def test_next(self):
        eid = EventId(cid=12)
        a = eid.core
        a_37 = a[-37]
        eid.next()
        b = eid.core
        b_37 = b[-37]
        self.assertEqual(a[:-37], b[:-37])
        self.assertEqual(a[-36:], b[-36:])
        self.assertEqual(a_37, '0')
        self.assertEqual(b_37, '1')


if __name__ == '__main__':
    unittest.main()  # pragma: no cover
