import unittest
from nisp.datamodel import CommandState


class TestCommandState(unittest.TestCase):
    def test_basic(self):
        s_01 = CommandState()
        self.assertEqual(0, s_01)
        s_02 = CommandState(2)
        self.assertNotEqual(s_02, s_01)
        self.assertEqual('CommandState(00)', repr(s_01))
        self.assertEqual('CommandState(10)', repr(s_02))

    def test_next(self):
        s = CommandState(2)
        self.assertEqual(2, s)
        s.next()
        self.assertEqual(3, s)
        s.next()
        self.assertEqual(3, s)

    def test_error_01(self):
        CommandState(0)
        with self.assertRaises(ValueError):
            CommandState(-1)

    def test_error_02(self):
        CommandState(3)
        with self.assertRaises(ValueError):
            CommandState(4)

    def test_error_03(self):
        with self.assertRaises(TypeError):
            CommandState() == 'abc'


if __name__ == '__main__':
    unittest.main()  # pragma: no cover
