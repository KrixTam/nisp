import os
import shutil
import coverage
import unittest


def run_all_tests(test_modules):
    suite = unittest.TestSuite()
    for t in test_modules:
        try:
            # If the module defines a suite() function, call it to get the suite.
            mod = __import__(t, globals(), locals(), ['suite'])
            suite_fn = getattr(mod, 'suite')
            suite.addTest(suite_fn())
        except (ImportError, AttributeError):
            # else, just load all the test cases from the module.
            suite.addTest(unittest.defaultTestLoader.loadTestsFromName(t))
    unittest.TextTestRunner().run(suite)


# 删除测试输出目录
dirs = ['log', 'output', 'htmlcov']
for d in dirs:
    if os.path.exists(d):
        shutil.rmtree(d)

test_modules = [
    'nisp.test.utils.test_insert_bit',
    'nisp.test.utils.test_separate_bits',
    'nisp.test.utils.test_remove_bit',
    'nisp.test.datamodel.test_CommandId',
    'nisp.test.datamodel.test_CommandState',
    'nisp.test.datamodel.test_Command',
    'nisp.test.datamodel.test_EventId',
    'nisp.test.datamodel.test_Event',
    'nisp.test.server.test_Server',
    'nisp.test.server.test_HeartbeatTimeout',
    'nisp.test.datamodel.test_EventTimeout',
]

# 执行测试用例
cov = coverage.Coverage(source=["./nisp"])
cov.start()

run_all_tests(test_modules)

cov.stop()
cov.save()

cov.html_report(directory='htmlcov')