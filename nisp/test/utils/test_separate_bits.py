import unittest
from nisp.utils import separate_bits


class TestSeparateBits(unittest.TestCase):
    def test_basic_01(self):
        a = int('1001110001111011111101', 2)
        l, r = separate_bits(a, 4)
        self.assertEqual(int('100111000111101111', 2), l)
        self.assertEqual(int('1101', 2), r)

    def test_basic_02(self):
        a = 1
        l, r = separate_bits(a, 4)
        self.assertEqual(0, l)
        self.assertEqual(1, r)

    def test_basic_03(self):
        a = 0
        l, r = separate_bits(a, 4)
        self.assertEqual(0, l)
        self.assertEqual(0, r)

    def test_error(self):
        with self.assertRaises(ValueError):
            separate_bits(0, 0)


if __name__ == '__main__':
    unittest.main()  # pragma: no cover
