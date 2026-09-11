"""Reproducible ADB SDMX-CSV -> ASEAN panel. Python 3.10+, pandas, numpy.

Run: python scripts/asean_pipeline.py fetch
     python scripts/asean_pipeline.py build
Raw snapshots are immutable; build never accesses the network.
"""
from pathlib import Path
import argparse
import hashlib
import io
import json
import time
import urllib.request
from datetime import datetime, timezone
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
COUNTRIES = {'VIE': ('VNM', 'Viet Nam', 'VND'), 'THA': ('THA', 'Thailand', 'THB'),
             'INO': ('IDN', 'Indonesia', 'IDR'), 'MAL': ('MYS', 'Malaysia', 'MYR'),
             'SIN': ('SGP', 'Singapore', 'SGD')}
SERIES = {
 'NGDP_XDC': ('nominal_gdp_lcu', 'GDP at current prices', 'local_currency', 'current'),
 'NGDPVA_ISIC4_C_XDC': ('manufacturing_lcu', 'Manufacturing at current prices', 'local_currency', 'current'),
 'NEGS_XGDP_PS': ('exports_pct', 'Exports of goods and services', 'percent_gdp', 'current'),
 'NIGS_XGDP_PS': ('imports_pct', 'Imports of goods and services', 'percent_gdp', 'current'),
 'BCA_BP6_XGDP_PS': ('current_account_pct', 'Current account balance', 'percent_gdp', 'current'),
}
RETIRED_SOURCE_INDICATORS = {'NGDP_R_XDC', 'LP_PE_NUM_MOP'}
CORE = ['manufacturing_pct', 'exports_pct', 'imports_pct', 'current_account_pct', 'reserves_months']

def save_csv(frame, path):
    path = ROOT / path
    path.parent.mkdir(parents=True, exist_ok=True)
    frame.to_csv(path, index=False, encoding='utf-8', lineterminator='\n', float_format='%.12g')

def download(url):
    for attempt in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'ASEAN-research/1.0'}), timeout=120) as r:
                return r.read(), r.headers.get('Content-Type', '')
        except Exception:
            if attempt == 2:
                raise
            time.sleep(5 * (attempt + 1))

def fetch(start=2005, end=None):
    stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
    folder = ROOT / 'data/raw' / stamp
    folder.mkdir(parents=True)
    manifest = {'retrieved_at': stamp, 'start': start, 'requested_end': end, 'files': []}
    def get(name, url, csv=False):
        body, content_type = download(url)
        if csv and ('csv' not in content_type or b'OBS_VALUE' not in body[:1000]):
            raise ValueError(f'Unexpected SDMX response: {name} {content_type}')
        if not csv:
            json.loads(body)
        (folder / name).write_bytes(body)
        manifest['files'].append({'file': name, 'url': url, 'sha256': hashlib.sha256(body).hexdigest(), 'content_type': content_type})
        (folder / 'manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
        print('Downloaded', name, len(body), flush=True)
        time.sleep(3.2)
    base = 'https://kidb.adb.org/api'
    for label, path in [('indicators', 'codelist/ADB/CL_KIDB_INDICATORS'), ('countries', 'codelist/ADB/CL_ECONOMY_CODES'), ('statuses', 'codelist/all/all')]:
        get(label + '.json', f'{base}/v5/sdmx/structure/{path}/+?format=sdmx-json')
    groups = {'DF_NA': list(SERIES)[:4], 'DF_GLOB_BOP': ['BCA_BP6_XGDP_PS']}
    for flow, codes in groups.items():
        key = 'A.' + '+'.join(codes) + '.' + '+'.join(COUNTRIES)
        url = f'{base}/v5/sdmx/data/ADB,{flow}/{key}?startPeriod={start}&format=sdmx-csv'
        if end is not None:
            url += f'&endPeriod={end}'
        get(flow + '.csv', url, True)
    wb_end = end or datetime.now(timezone.utc).year
    get('wb_reserves.json', 'https://api.worldbank.org/v2/country/VNM;THA;IDN;MYS;SGP/indicator/FI.RES.TOTL.MO?format=json&per_page=20000&date=' + f'{start}:{wb_end}')
    get('wb_crosscheck.json', 'https://api.worldbank.org/v2/country/SGP/indicator/NY.GDP.MKTP.CN?format=json&per_page=100&date=2020:2024')
    manifest['complete'] = True
    (folder / 'manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
    (ROOT / 'data/raw/latest.json').write_text(json.dumps({'snapshot': stamp}), encoding='utf-8')
    return folder

def numeric(value):
    if str(value).strip() in ('', '..', '...', 'NA', 'NaN', 'nan', 'None'):
        return np.nan
    result = float(value)
    if not np.isfinite(result):
        raise ValueError('nonfinite value')
    return result

def status_map(metadata):
    result = {}
    for cl in metadata['data']['codelists']:
        if 'STATUS' not in cl['id'].upper():
            continue
        for c in cl.get('codes', []):
            name = c.get('name', '').lower()
            status = ('forecast' if 'forecast' in name else 'estimated' if 'estimat' in name else
                      'provisional' if 'provisional' in name else 'observed' if ('normal' in name or 'observed' in name or 'actual' in name) else 'unknown')
            result[c['id']] = status
    return result

def combine_status(*states):
    for state in ['missing', 'unknown', 'forecast', 'estimated', 'provisional']:
        if state in states:
            return state
    return 'observed'

def build(snapshot=None):
    if snapshot is None:
        snapshot = json.loads((ROOT / 'data/raw/latest.json').read_text())['snapshot']
    folder = ROOT / 'data/raw' / snapshot
    manifest = json.loads((folder / 'manifest.json').read_text())
    if not manifest.get('complete'):
        raise ValueError('Incomplete raw snapshot')
    for item in manifest['files']:
        if hashlib.sha256((folder / item['file']).read_bytes()).hexdigest() != item['sha256']:
            raise ValueError('Raw hash mismatch: ' + item['file'])
    sources = {f['file']: f['url'] for f in manifest['files']}
    statuses = status_map(json.loads((folder / 'statuses.json').read_bytes()))
    issues, rows = [], []
    for file in sorted(folder.glob('*.csv')):
        raw = pd.read_csv(file, dtype=str, keep_default_na=False)
        for idx, r in raw.iterrows():
            try:
                if r['INDICATOR'] in RETIRED_SOURCE_INDICATORS:
                    continue
                if r['ECONOMY_CODE'] not in COUNTRIES or r['INDICATOR'] not in SERIES or r['FREQ'] != 'A':
                    raise ValueError('Unrecognized country/indicator/frequency')
                country, name, currency = COUNTRIES[r['ECONOMY_CODE']]
                code, label, unit, price = SERIES[r['INDICATOR']]
                value = numeric(r['OBS_VALUE'])
                mult = int(r['UNIT_MULT'])
                if unit == 'local_currency' and r['UNIT'] != currency:
                    raise ValueError('Unexpected currency: ' + r['UNIT'])
                if unit == 'percent_gdp' and (r['UNIT'] not in ('%', 'PERCENT', 'PC', 'PT', 'PCT', 'PCT_GDP') or mult != 0):
                    raise ValueError('Unexpected percent unit/multiplier: ' + r['UNIT'] + '/' + str(mult))
                rows.append(dict(country=country, country_name=name, indicator=code, indicator_name=label,
                    year=int(r['TIME_PERIOD']), frequency='A', value=value * 10.0 ** mult,
                    unit=currency if unit == 'local_currency' else unit, price_basis=price,
                    base_year=r.get('BASE_YEAR', ''), status=statuses.get(r.get('OBS_STATUS'), 'unknown'),
                    source_status=r.get('OBS_STATUS', ''), source_indicator=r['INDICATOR'],
                    source='ADB', source_url=sources[file.name], source_file=file.name, raw_row=idx+2,
                    footnote=r.get('FOOTNOTE', ''), data_source=r.get('DATA_SOURCE', ''),
                    reference_year=r.get('REF_YEAR', ''), methodology=r.get('METHODOLOGY', '')))
            except (ValueError, KeyError, OverflowError) as e:
                issues.append({'file': file.name, 'row': idx+2, 'reason': str(e), 'raw': json.dumps(r.to_dict())})
    wb = json.loads((folder / 'wb_reserves.json').read_bytes())
    if not isinstance(wb, list) or len(wb) < 2 or wb[0]['pages'] != 1:
        raise ValueError('Unexpected/paginated World Bank response')
    names = {v[0]: v[1] for v in COUNTRIES.values()}
    for r in wb[1] or []:
        rows.append(dict(country=r['countryiso3code'], country_name=names[r['countryiso3code']],
            indicator='reserves_months', indicator_name='Total reserves in months of imports', year=int(r['date']), frequency='A',
            value=numeric(r['value']), unit='months', price_basis='not_applicable', base_year='', status='unknown',
            source_status=r.get('obs_status', ''), source_indicator='FI.RES.TOTL.MO', source='World Bank WDI',
            source_url=sources['wb_reserves.json'], source_file='wb_reserves.json', raw_row='', footnote='',
            data_source='WDI', reference_year='', methodology=''))
    clean = pd.DataFrame(rows)
    keys = ['country', 'indicator', 'year']
    duplicates = clean[clean.duplicated(keys, keep=False)]
    save_csv(duplicates, 'reports/duplicate_keys.csv')
    save_csv(pd.DataFrame(issues, columns=['file','row','reason','raw']), 'reports/rejected_rows.csv')
    if not duplicates.empty:
        raise ValueError('Duplicate keys require explicit resolution; see reports/duplicate_keys.csv')
    clean = clean.sort_values(keys)
    save_csv(clean, 'data/processed/normalized_observations.csv')
    lookup = {(r.country, r.indicator, r.year): r for r in clean.itertuples()}
    years = range(manifest['start'], int(clean.year.max()) + 1)
    panel = []
    def cell(country, indicator, year):
        r = lookup.get((country, indicator, year))
        return (r.value, r.status) if r is not None and pd.notna(r.value) else (np.nan, 'missing')
    for country in sorted(names):
        for year in years:
            row = {'country': country, 'country_name': names[country], 'year': year, 'frequency': 'A'}
            for indicator in [s[0] for s in SERIES.values()] + ['reserves_months']:
                row[indicator], row[indicator+'_status'] = cell(country, indicator, year)
            a, b = row['manufacturing_lcu'], row['nominal_gdp_lcu']
            row['manufacturing_pct'] = 100*a/b if pd.notna(a) and pd.notna(b) and b > 0 else np.nan
            row['manufacturing_pct_status'] = combine_status(row['manufacturing_lcu_status'], row['nominal_gdp_lcu_status']) if pd.notna(row['manufacturing_pct']) else 'missing'
            row['trade_openness'] = row['exports_pct'] + row['imports_pct']
            row['trade_balance'] = row['exports_pct'] - row['imports_pct']
            for metric in ['trade_openness','trade_balance']:
                row[metric+'_status'] = combine_status(row['exports_pct_status'],row['imports_pct_status'])
            panel.append(row)
    p = pd.DataFrame(panel).sort_values(['country','year'])
    save_csv(p, 'data/processed/asean_comparison.csv')
    coverage=[]
    for row in p.to_dict('records'):
        for indicator in CORE:
            coverage.append({'country':row['country'],'year':row['year'],'indicator':indicator,'available':pd.notna(row[indicator]),'status':row[indicator+'_status']})
    cov=pd.DataFrame(coverage)
    save_csv(cov,'reports/coverage_matrix.csv')
    common = cov.groupby('year').available.all()
    common_years = [int(y) for y, available in common.items() if available]
    observed = cov.assign(ok=lambda d: d.available & d.status.eq('observed')).groupby('year').ok.all()
    observed_years = [int(y) for y, ok in observed.items() if ok]
    save_csv(p[['country','country_name','year'] + CORE + ['trade_openness'] + [x+'_status' for x in CORE]],'data/processed/p8_timeseries.csv')
    outliers = p[(p.manufacturing_pct<0) | (p.manufacturing_pct>100) | (p.reserves_months<0)]
    save_csv(outliers,'reports/outliers.csv')
    dictionary=[]
    formulas={'manufacturing_pct':'100 * manufacturing_lcu / nominal_gdp_lcu',
      'trade_openness':'exports_pct + imports_pct','trade_balance':'exports_pct - imports_pct',
    }
    for column in p.columns:
        if any(x['column']==column for x in dictionary): continue
        source='World Bank WDI FI.RES.TOTL.MO' if column.startswith('reserves_months') else 'ADB / derived; see normalized_observations.csv'
        unit='metadata'
        if column in CORE or column in formulas:
            unit='percent / percentage points' if ('pct' in column or 'growth' in column or 'openness' in column or 'balance' in column or 'shock' in column) else 'see formula'
        if column=='reserves_months': unit='months of imports'
        dictionary.append(dict(column=column,unit=unit,formula_or_definition=formulas.get(column, 'Source field or status; see normalized source lineage'),source=source,missing_rule='Blank CSV = missing; no imputation; unknown status is not observed'))
    save_csv(pd.DataFrame(dictionary),'metadata/data_dictionary.csv')
    wbcheck=json.loads((folder/'wb_crosscheck.json').read_bytes())
    comparisons=[]
    for r in wbcheck[1] or []:
        adb=lookup.get(('SGP','nominal_gdp_lcu',int(r['date'])))
        if adb and r['value'] is not None:
            comparisons.append({'year':int(r['date']),'adb_sgd':adb.value,'wb_sgd':r['value'],'difference_pct':100*(adb.value/r['value']-1)})
    save_csv(pd.DataFrame(comparisons),'reports/cross_check_values.csv')
    report = '# Cross-check\n\nSingapore GDP at current prices: ADB NGDP_XDC (SGD × 10^UNIT_MULT) versus World Bank NY.GDP.MKTP.CN (current LCU = SGD). This validates units and nominal source data.\n\n'
    report += 'Snapshot: '+snapshot+'; World Bank lastupdated: '+str(wbcheck[0].get('lastupdated'))+'\n\n'
    report += '| Year | ADB SGD | WB SGD | Difference % |\n|---|---:|---:|---:|\n'
    for r in comparisons: report+=f"| {r['year']} | {r['adb_sgd']:.0f} | {r['wb_sgd']:.0f} | {r['difference_pct']:.6f} |\n"
    report += '\nDifferences may reflect revisions and release dates. Neither series is overwritten to force agreement. Differences >1% require review; no claim of independence where both use the same national statistical source.\n\n'+sources['DF_NA.csv']+'\n\n'+sources['wb_crosscheck.json']+'\n'
    (ROOT/'reports/cross_check.md').write_text(report,encoding='utf-8')
    qa=f'''# QA report

Raw snapshot: {snapshot}. SHA256 verified for every downloaded response.
Normalized rows: {len(clean)}. Panel rows: {len(p)}. Rejected rows: {len(issues)}.
Duplicate rows: {len(duplicates)} (fatal if nonzero). Outlier flags: {len(outliers)} (retained, not winsorized).
Common years across 5 indicators and 5 countries, regardless of status: {common_years}.
Common strictly observed years across all 5 indicators: {observed_years}.
Status mapping from downloaded ADB codelists: {statuses}.

## Rules
- Blank = missing. No interpolation, carry forward, zero fill, or forecast synthesis.
- World Bank reserves are explicitly supplemental. Missing observation status stays unknown.
- ADB UNIT_MULT is applied exactly once. Local currency is never relabeled USD.
- Coverage matrix includes every requested country/indicator/year, including missing cells.

## Handoff
- P8 file: data/processed/p8_timeseries.csv.
- CSV UTF-8, comma delimiter, stable column names; nulls are empty strings. Treat nulls as null, never zero.
- P4–P8 human confirmation: PENDING. No analyst sessions were provided.
- Website display cross-check: PENDING; no P8 page/URL supplied.
- Review rejected_rows.csv, outliers.csv and cross_check.md before publication.
'''
    (ROOT/'reports/qa_report.md').write_text(qa,encoding='utf-8')
    print(f'Built {len(p)} panel rows; rejected={len(issues)}; common years={common_years}',flush=True)
    if issues:
        raise ValueError('Rows quarantined: inspect reports/rejected_rows.csv')

if __name__ == '__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('command', choices=['fetch','build','all'])
    parser.add_argument('--start',type=int,default=2005)
    parser.add_argument('--end',type=int)
    parser.add_argument('--snapshot')
    args=parser.parse_args()
    if args.command in ('fetch','all'): fetch(args.start,args.end)
    if args.command in ('build','all'): build(args.snapshot)
