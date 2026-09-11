import csv
import importlib.util
from pathlib import Path
import unittest
import numpy as np

spec = importlib.util.spec_from_file_location('pipeline', Path(__file__).resolve().parents[1] / 'scripts/asean_pipeline.py')
p = importlib.util.module_from_spec(spec)
spec.loader.exec_module(p)

class MetricsTests(unittest.TestCase):
    def test_real_gdp_per_capita_pipeline_is_retired(self):
        self.assertTrue({'NGDP_R_XDC', 'LP_PE_NUM_MOP'}.isdisjoint(p.SERIES))
        self.assertNotIn('real_gdp_pc', p.CORE)

        forbidden = {
            'real_gdp_lcu', 'population', 'real_gdp_pc', 'gdp_pc_growth',
            'gdp_pc_index_2006', 'cumulative_recovery_pct',
        }
        root = Path(__file__).resolve().parents[1]
        for relative_path in (
            'data/processed/asean_comparison.csv',
            'data/processed/p8_timeseries.csv',
        ):
            with (root / relative_path).open(encoding='utf-8', newline='') as source:
                header = next(csv.reader(source))
            self.assertTrue(forbidden.isdisjoint(header), relative_path)
        for relative_path, field in (
            ('data/processed/normalized_observations.csv', 'indicator'),
            ('metadata/data_dictionary.csv', 'column'),
        ):
            with (root / relative_path).open(encoding='utf-8', newline='') as source:
                values = {row[field] for row in csv.DictReader(source)}
            self.assertTrue(forbidden.isdisjoint(values), relative_path)
        self.assertFalse((root / 'data/processed/p8_covid_summary.csv').exists())

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
