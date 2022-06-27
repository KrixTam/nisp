import unittest
from nisp.datamodel import Action


class TestAction(unittest.TestCase):
    def test_basic(self):
        a = Action(1)
        b = Action(1)
        self.assertEqual(a, b)
        b.next()
        self.assertNotEqual(a, b)
        self.assertEqual('00000000000001', str(a))
        self.assertEqual('01000000000001', str(b))
        self.assertEqual('ActionId(000000000001)\nActionState(00)', repr(a))

    def test_next(self):
        a = Action(0, 2)
        b = Action(0, 3)
        self.assertNotEqual(a, b)
        a.next()
        self.assertEqual(a, b)
        a.next()
        self.assertEqual(a, b)

    def test_error_01(self):
        with self.assertRaises(TypeError):
            Action(121) == 123


if __name__ == '__main__':
    unittest.main()  # pragma: no cover
