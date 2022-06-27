import unittest
from nisp.datamodel import EventId, Action
from moment import moment


class TestEventId(unittest.TestCase):
    def test_timestamp_shadow_01(self):
        ts = moment('2021-01-02 12:23:22')
        ts_shadow, timestamp_bin = EventId.timestamp_shadow('101100', 0, ts)
        self.assertEqual('000000010000100000000111101001111000101000100000', ts_shadow)

    def test_unpack(self):
        ts = moment('2021-01-02 12:23:22')
        ts_shadow = '000000010000100000000111101001111000101000100000'
        random_code = '101100'
        position_code = '0000'
        action_01 = Action(4)
        nic_01 = EventId.network_interface_controller()
        event_id = int(random_code + ts_shadow + position_code + str(action_01) + nic_01, 2)
        action_02, timestamp, nic_02 = EventId.unpack(event_id)
        self.assertEqual(action_01, action_01)
        self.assertEqual(nic_01, nic_02)
        self.assertEqual(ts, timestamp)


if __name__ == '__main__':
    unittest.main()  # pragma: no cover
