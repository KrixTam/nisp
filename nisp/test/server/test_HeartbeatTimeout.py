import unittest
from io import StringIO
from contextlib import redirect_stdout

from nisp.server import HeartBeat, NISProtocol
from nisp.const import *
from nisp.const import moment


class TestHeartbeatTimeout(unittest.TestCase):

    def setUp(self):
        # 备份并隔离 clients 状态，设置较小的超时阈值
        self._backup_clients = dict(NISProtocol._clients)
        NISProtocol._clients.clear()
        NISProtocol.timeout = 1  # 1秒超时

    def tearDown(self):
        # 恢复 clients 状态
        NISProtocol._clients.clear()
        NISProtocol._clients.update(self._backup_clients)

    def test_timeout_branch(self):
        client_id = 'abcd'  # 符合 PV_HEARTBEAT 的 4 位小写 hex 格式
        # 设置最近心跳时间为 2 秒前，触发超时
        NISProtocol._clients[client_id] = moment().add(-2, 'seconds')

        hb = HeartBeat(STATE_INIT)

        buf = StringIO()
        with redirect_stdout(buf):
            data, ec = hb.init(**{KEY_NAME: client_id})

        output = buf.getvalue().strip()
        self.assertIsNone(data)
        self.assertEqual(ec, 0)
        self.assertIn(f'[{client_id}] 心跳超时（>1s），断开连接。', output)


if __name__ == '__main__':
    unittest.main()  # pragma: no cover