import unittest
from nisp.datamodel import Event, EventId, Command
import yaml


class C01(Command):  # pragma: no cover

    def __init__(self, state):
        super().__init__(1, state)

    def init(self, **kwargs):
        self.state.next()
        return {'C01': 123}, 0

    def process(self, **kwargs):
        self.state.next()
        return {}, 0


class TestEvent(unittest.TestCase):
    def test_basic_01(self):
        eid = EventId()
        e = Event(str(eid))
        self.assertEqual(None, e.process({}))

    def test_basic_02(self):
        Command.register(1, C01)
        eid = EventId(cid=1)
        e = Event(str(eid))
        a = e.process({})
        b = eid.core
        received_data = yaml.safe_load(a)
        cid, state, timestamp, nic = EventId.unpack(received_data['eid'])
        eid.next()
        eid_02 = EventId(cid.value, state.value, nic, timestamp)
        self.assertEqual(eid_02.core, eid.core)
        self.assertNotEqual(eid_02.core, b)
        self.assertEqual({'C01': 123}, received_data['data'])


if __name__ == '__main__':
    unittest.main()  # pragma: no cover
