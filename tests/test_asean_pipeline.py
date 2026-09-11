import importlib.util
from pathlib import Path
import unittest
import numpy as np

spec = importlib.util.spec_from_file_location('pipeline', Path(__file__).resolve().parents[1] / 'scripts/asean_pipeline.py')
p = importlib.util.module_from_spec(spec)
spec.loader.exec_module(p)

class MetricsTests(unittest.TestCase):
    def test_log_growth(self):
        self.assertAlmostEqual(p.log_growth(110, 100), 9.5310179804)
        self.assertTrue(np.isnan(p.log_growth(110, 0)))
        self.assertTrue(np.isnan(p.log_growth(np.nan, 100)))

    def test_recovery_is_compounded_level_change(self):
        self.assertAlmostEqual(p.recovery(100*.9*1.2, 100), 8)
        self.assertTrue(np.isnan(p.recovery(100, 0)))

    def test_strict_average(self):
        self.assertEqual(p.strict_average([1,2,6]), 3)
        self.assertTrue(np.isnan(p.strict_average([1,np.nan,6])))

    def test_numeric(self):
        self.assertEqual(p.numeric('0'), 0)
        self.assertTrue(np.isnan(p.numeric('..')))
        for bad in ['garbage','12x','inf']:
            with self.assertRaises(ValueError): p.numeric(bad)

    def test_unknown_never_becomes_observed(self):
        self.assertEqual(p.combine_status('observed','unknown'), 'unknown')
        self.assertEqual(p.combine_status('observed','estimated'), 'estimated')
        self.assertEqual(p.combine_status('observed','observed'), 'observed')

if __name__ == '__main__': unittest.main()
