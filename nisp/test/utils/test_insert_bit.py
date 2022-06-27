import unittest
from nisp.utils import insert_bit


class TestInsertBit(unittest.TestCase):
    def test_0(self):
        a = int('100100101011', 2)
        b = insert_bit(a, 3, True)
        b_dest = int('1001001011011', 2)
        self.assertEqual(b, b_dest)

    def test_1(self):
        a = int('100100100011', 2)
        b = insert_bit(a, 3, True)
        b_dest = int('1001001001011', 2)
        self.assertEqual(b, b_dest)

    def test_2(self):
        a = int('100100101011', 2)
        b = insert_bit(a, 3, False)
        b_dest = int('1001001010011', 2)
        self.assertEqual(b, b_dest)

    def test_3(self):
        a = int('100100100011', 2)
        b = insert_bit(a, 3, False)
        b_dest = int('1001001000011', 2)
        self.assertEqual(b, b_dest)

    def test_4(self):
        a = int('100100100011', 2)
        b = insert_bit(a, 0, True)
        b_dest = int('1001001000111', 2)
        self.assertEqual(b, b_dest)

    def test_5(self):
        a = int('100100100011', 2)
        b = insert_bit(a, 0, False)
        b_dest = int('1001001000110', 2)
        self.assertEqual(b, b_dest)

    def test_6(self):
        a = int('10010011', 2)
        b = insert_bit(a, 8, True)
        b_dest = int('110010011', 2)
        self.assertEqual(b, b_dest)

    def test_7(self):
        a = int('10010011', 2)
        b = insert_bit(a, 8, False)
        b_dest = int('10010011', 2)
        self.assertEqual(b, b_dest)

    def test_8(self):
        a = int('10010011', 2)
        b = insert_bit(a, 9, True)
        b_dest = int('1010010011', 2)
        self.assertEqual(b, b_dest)

    def test_9(self):
        a = int('10010011', 2)
        b = insert_bit(a, 9, False)
        self.assertEqual(b, a)

    def test_error_1(self):
        a = int('10010011', 2)
        with self.assertRaises(ValueError):
            insert_bit(a, -2)

    def test_error_2(self):
        with self.assertRaises(ValueError):
            insert_bit(0, 2)


if __name__ == '__main__':
    unittest.main()  # pragma: no cover
