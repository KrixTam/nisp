import unittest
from nisp.datamodel import Command


class C01(Command):  # pragma: no cover

    def __init__(self, state):
        super().__init__(1, state)

    def init(self, **kwargs):
        self.state.next()
        return {'C01': 123}, 0

    def process(self, **kwargs):
        self.state.next()
        return {}, 0


class TestCommand(unittest.TestCase):
    def test_basic(self):
        a = Command(1)
        b = Command.get_command(1)
        self.assertEqual(a, b)
        b.next()
        self.assertNotEqual(a, b)
        self.assertEqual('00000000000001', str(a))
        self.assertEqual('01000000000001', str(b))
        self.assertEqual('CommandId(000000000001)\nCommandState(00)', repr(a))

    def test_next_01(self):
        a = Command(0, 0)
        b = Command(0, 1)
        self.assertNotEqual(a, b)
        a.next()
        self.assertEqual(a, b)
        a.next()
        self.assertEqual(a, b)

    def test_next_02(self):
        a = Command(0, 2)
        b = Command(0, 3)
        self.assertNotEqual(a, b)
        a.next()
        self.assertEqual(a, b)
        a.next()
        self.assertEqual(a, b)

    def test_error_01(self):
        with self.assertRaises(TypeError):
            Command(121) == 123

    def test_register(self):
        a = Command.get_command(1)
        self.assertTrue(Command.register(1, C01))
        b = Command.get_command(1)
        self.assertEqual(a, b)
        a_ret = a.next()
        b_ret = b.next()
        self.assertNotEqual(a_ret, b_ret)
        self.assertFalse(Command.register(1, Command))


if __name__ == '__main__':
    unittest.main()  # pragma: no cover
