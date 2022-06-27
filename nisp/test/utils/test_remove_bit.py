import unittest
from nisp.utils import remove_bit


class TestRemoveBit(unittest.TestCase):
    def test_basic_01(self):
        a = int('1001110001111011111101', 2)
        r, b = remove_bit(a, 4)
        self.assertEqual('100111000111101111101', bin(r)[2:])
        self.assertEqual('1', b)

    def test_basic_02(self):
        a = int('1001110001111011111101', 2)
        r, b = remove_bit(a, 0)
        self.assertEqual('100111000111101111110', bin(r)[2:])
        self.assertEqual('1', b)

    def test_error(self):
        a = int('1001', 2)
        with self.assertRaises(ValueError):
            remove_bit(a, 4)


if __name__ == '__main__':
    unittest.main()  # pragma: no cover
