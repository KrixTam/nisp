import unittest
from io import StringIO
from contextlib import redirect_stdout
import re

from nisp.datamodel import Event, EventId
from nisp.const import KEY_NAME, TIMEOUT_DEFAULT, STATE_INIT
from moment import moment


class TestEventTimeout(unittest.TestCase):

    def test_event_timeout_branch(self):
        ts = moment('2021-01-02 12:23:22')
        eid = EventId('abcd', cid=999, state=STATE_INIT, timestamp=ts)
        eid_str = str(eid)
        e = Event(eid_str)
        data = {'test_name': 'time_out'}

        buf = StringIO()
        with redirect_stdout(buf):
            res = e.process(data)

        output = buf.getvalue().strip()

        self.assertIsNone(res)
        pattern = r'\[(.*?)\]'
        matches = re.findall(pattern, output)
        self.assertTrue(eid == matches[0])
        self.assertIn(f'事件超时（>{TIMEOUT_DEFAULT}s）', output)


if __name__ == '__main__':
    unittest.main()  # pragma: no cover