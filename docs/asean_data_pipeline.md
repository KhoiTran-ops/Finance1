# ASEAN data pipeline

Python 3.10+; install `pip install -r requirements-data.txt`.

```powershell
python scripts/asean_pipeline.py all
python scripts/asean_pipeline.py build
python -m unittest discover -s tests -p test_asean_pipeline.py
```

`all` downloads ADB/World Bank and builds outputs. `build` runs offline from the
last complete snapshot. `--snapshot NAME` rebuilds a specific version.
`--start 2005` obtains the extra year needed for 2006 growth and indexing.
`--end YEAR` is optional; omitted means use returned coverage, not a guessed latest year.
No API keys. Network access must be allowed. Never commit credentials.

Raw response bytes and SHA256 are stored in a new UTC snapshot directory.
Failed downloads do not replace the latest complete snapshot pointer.
No legacy sample is merged into research data. ADB catalog and status metadata
are saved with each snapshot. Fixed series selections are in `SERIES` and `fetch`.

Outputs:
- `data/processed/asean_comparison.csv`: country-year wide table.
- `data/processed/normalized_observations.csv`: source-level long table with units,
  source codes, row references, statuses, footnotes, and base years.
- `data/processed/p8_timeseries.csv`: stable chart contract.
- `data/processed/p8_covid_summary.csv`: strict observed COVID summaries.
- `reports/coverage_matrix.csv`: country-indicator-year availability/status.
- `reports/rejected_rows.csv`, `duplicate_keys.csv`, `outliers.csv`: QA detail.
- `metadata/data_dictionary.csv`: variables and formulas.
- `reports/qa_report.md`, `cross_check.md`: limitations and independent-source comparison.

Status: observed, estimated, forecast, provisional, unknown, missing.
Unknown does not mean observed. Missing stays blank, including in charts.
Currency levels are country-specific; only growth, ratios, and appropriately
normalized indices are compared across countries. World Bank reserves are
explicitly supplemental because no matching months-of-imports indicator was
found in the downloaded ADB catalog.

Pipeline completion is not analyst approval. P4–P8 must confirm ingestion;
the supplied P8 URL must be checked separately before claiming web parity.
