import unittest
from nisp.datamodel import ActionId


class TestActionId(unittest.TestCase):
    def test_basic(self):
        aid_01 = ActionId(1)
        aid_02 = ActionId(20)
        self.assertEqual('ActionId(000000000001)', repr(aid_01))
        self.assertEqual('ActionId(000000010100)', repr(aid_02))
        self.assertNotEqual(aid_02, aid_01)
        self.assertEqual(1, aid_01)

    def test_error_01(self):
        ActionId(0)
        with self.assertRaises(ValueError):
            ActionId(-1)

    def test_error_02(self):
        ActionId(4095)
        with self.assertRaises(ValueError):
            ActionId(4096)

    def test_error_03(self):
        with self.assertRaises(TypeError):
            ActionId(2) == 'abc'


if __name__ == '__main__':
    unittest.main()  # pragma: no cover
