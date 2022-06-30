import unittest
from nisp.datamodel import CommandId


class TestCommandId(unittest.TestCase):
    def test_basic(self):
        cid_01 = CommandId(1)
        cid_02 = CommandId(20)
        self.assertEqual('CommandId(000000000001)', repr(cid_01))
        self.assertEqual('CommandId(000000010100)', repr(cid_02))
        self.assertNotEqual(cid_02, cid_01)
        self.assertEqual(1, cid_01)

    def test_error_01(self):
        CommandId(0)
        with self.assertRaises(ValueError):
            CommandId(-1)

    def test_error_02(self):
        CommandId(4095)
        with self.assertRaises(ValueError):
            CommandId(4096)

    def test_error_03(self):
        with self.assertRaises(TypeError):
            CommandId(2) == 'abc'


if __name__ == '__main__':
    unittest.main()  # pragma: no cover
