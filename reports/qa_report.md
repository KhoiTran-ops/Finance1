# QA report

Raw snapshot: 20260911T072427563129Z. SHA256 verified for every downloaded response.
Normalized rows: 840. Panel rows: 105. Rejected rows: 0.
Duplicate rows: 0 (fatal if nonzero). Outlier flags: 0 (retained, not winsorized).
Common years across 6 indicators and 5 countries, regardless of status: [2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024].
Common strictly observed years across all 6 indicators: [].
Status mapping from downloaded ADB codelists: {'S': 'unknown', 'M': 'unknown', 'W': 'unknown', 'D': 'unknown', 'L': 'unknown', 'P': 'provisional', 'Q': 'unknown', 'E': 'estimated', 'F': 'forecast', 'N': 'unknown', 'C': 'unknown', 'A': 'observed', 'O': 'unknown', 'T': 'unknown', 'G': 'unknown', 'B': 'unknown', 'H': 'unknown', 'I': 'unknown', 'J': 'unknown', 'K': 'unknown', 'U': 'unknown', 'V': 'unknown'}.

## Rules
- Blank = missing. No interpolation, carry forward, zero fill, or forecast synthesis.
- World Bank reserves are explicitly supplemental. Missing observation status stays unknown.
- ADB UNIT_MULT is applied exactly once. Local currency is never relabeled USD.
- Real GDP per capita is constant-price GDP / population, not current PPP GDP.
- Cross-country absolute GDPpc comparisons/catch-up gaps are disabled: units and base years differ.
- Growth/index/recovery require the same nonempty base year; structural breaks can remain in footnotes and need review.
- Population definitions may differ (resident/total); inspect source footnotes before inference.
- Post-COVID window is explicitly 2021–2023; all years required. Shock = 2020 log growth minus 2017–2019 mean.
- Cumulative recovery is level change versus 2019, not a causal estimate or recovery of lost trend.
- Model eligibility uses observed inputs only. Supplementary unknown reserves do not automatically discard the core model.
- Coverage matrix includes every requested country/indicator/year, including missing cells.

## Handoff
- P8 files: data/processed/p8_timeseries.csv and p8_covid_summary.csv.
- CSV UTF-8, comma delimiter, stable column names; nulls are empty strings. Treat nulls as null, never zero.
- P4–P8 human confirmation: PENDING. No analyst sessions were provided.
- Website display cross-check: PENDING; no P8 page/URL supplied.
- Review rejected_rows.csv, outliers.csv and cross_check.md before publication.
