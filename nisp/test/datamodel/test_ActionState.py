import unittest
from nisp.datamodel import ActionState


class TestActionState(unittest.TestCase):
    def test_basic(self):
        s_01 = ActionState()
        self.assertEqual(0, s_01)
        s_02 = ActionState(2)
        self.assertNotEqual(s_02, s_01)
        self.assertEqual('ActionState(00)', repr(s_01))
        self.assertEqual('ActionState(10)', repr(s_02))

    def test_next(self):
        s = ActionState(2)
        self.assertEqual(2, s)
        s.next()
        self.assertEqual(3, s)
        s.next()
        self.assertEqual(3, s)

    def test_error_01(self):
        ActionState(0)
        with self.assertRaises(ValueError):
            ActionState(-1)

    def test_error_02(self):
        ActionState(3)
        with self.assertRaises(ValueError):
            ActionState(4)

    def test_error_03(self):
        with self.assertRaises(TypeError):
            ActionState() == 'abc'


if __name__ == '__main__':
    unittest.main()  # pragma: no cover
