import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const input = path.join(root, 'data', 'processed', 'p8_timeseries.csv');
const output = path.join(root, 'src', 'data', 'adb-data.json');
const startYear = 2012;
const baseYear = 2019;

const countryDefinitions = {
  VNM: { id: 'VN', name: 'Việt Nam', color: '#a37219' },
  IDN: { id: 'ID', name: 'Indonesia', color: '#497f76' },
  THA: { id: 'TH', name: 'Thái Lan', color: '#b26e47' },
  MYS: { id: 'MY', name: 'Malaysia', color: '#80769a' },
  SGP: { id: 'SG', name: 'Singapore · benchmark', color: '#65696b' },
};

const indicators = {
  manufacturing_pct: {
    label: 'Chế biến, chế tạo',
    unit: '% GDP',
    source: 'ADB',
  },
  exports_pct: { label: 'Xuất khẩu', unit: '% GDP', source: 'ADB' },
  imports_pct: { label: 'Nhập khẩu', unit: '% GDP', source: 'ADB' },
  current_account_pct: {
    label: 'Cán cân vãng lai',
    unit: '% GDP',
    source: 'ADB',
  },
  reserves_months: {
    label: 'Dự trữ ngoại hối',
    unit: 'tháng nhập khẩu',
    source: 'World Bank WDI (nguồn bổ sung)',
  },
  trade_openness: {
    label: 'Độ mở thương mại',
    unit: '% GDP',
    source: 'Tính từ ADB: xuất khẩu + nhập khẩu',
  },
};

function parseCsv(text) {
  const records = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ',') {
      row.push(field);
      field = '';
    } else if (character === '\n') {
      row.push(field.replace(/\r$/, ''));
      records.push(row);
      row = [];
      field = '';
    } else {
      field += character;
    }
  }
  if (field || row.length) {
    row.push(field.replace(/\r$/, ''));
    records.push(row);
  }
  const [header, ...dataRows] = records.filter((record) => record.some(Boolean));
  return dataRows.map((values) =>
    Object.fromEntries(header.map((column, index) => [column, values[index] ?? ''])),
  );
}

function numeric(value) {
  if (value === '') return null;
  const result = Number(value);
  if (!Number.isFinite(result)) throw new Error(`Giá trị không hợp lệ: ${value}`);
  return result;
}

const rows = parseCsv(await readFile(input, 'utf8'));
const years = [...new Set(rows.map((row) => Number(row.year)))]
  .filter((year) => year >= startYear)
  .sort((left, right) => left - right);

if (!years.includes(baseYear)) throw new Error(`Thiếu năm gốc ${baseYear}`);

const countries = Object.entries(countryDefinitions).map(([iso3, definition]) => {
  const countryRows = rows
    .filter((row) => row.country === iso3 && years.includes(Number(row.year)))
    .sort((left, right) => Number(left.year) - Number(right.year));
  if (countryRows.length !== years.length) {
    throw new Error(`${iso3}: cần ${years.length} dòng, nhận được ${countryRows.length}`);
  }

  const metrics = Object.fromEntries(
    Object.keys(indicators).map((indicator) => [
      indicator,
      countryRows.map((row) => ({
        year: Number(row.year),
        value: numeric(row[indicator]),
        status: row[`${indicator}_status`] || 'unknown',
      })),
    ]),
  );
  const baseline = metrics.trade_openness.find((item) => item.year === baseYear)?.value;
  if (baseline === null || baseline === undefined || baseline === 0) {
    throw new Error(`${iso3}: thiếu giá trị độ mở thương mại năm ${baseYear}`);
  }

  return {
    ...definition,
    iso3,
    values: metrics.trade_openness.map((item) =>
      item.value === null ? null : Number(((item.value / baseline) * 100).toFixed(4)),
    ),
    metrics,
  };
});

let retrievedAt = null;
try {
  const latest = JSON.parse(await readFile(path.join(root, 'data', 'raw', 'latest.json'), 'utf8'));
  const manifest = JSON.parse(
    await readFile(path.join(root, 'data', 'raw', latest.snapshot, 'manifest.json'), 'utf8'),
  );
  retrievedAt = manifest.retrieved_at ?? latest.snapshot;
} catch {
  // The processed file remains usable; the UI explicitly reports a missing retrieval date.
}

const payload = {
  metadata: {
    mode: 'observed-data',
    title: 'Dữ liệu kinh tế ASEAN từ ADB',
    source: 'Asian Development Bank (ADB), Key Indicators Database',
    supplementalSource: 'World Bank WDI — chỉ tiêu dự trữ ngoại hối theo tháng nhập khẩu',
    sourceUrl: 'https://kidb.adb.org/',
    retrievedAt,
    period: `${years[0]}–${years.at(-1)}`,
    baseYear,
    primaryIndicator: 'trade_openness',
    notes: 'Ô trống được giữ là null; không nội suy và không thay bằng 0.',
  },
  indicators,
  years,
  countries,
};

await writeFile(output, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
console.log(`Đã tạo ${path.relative(root, output)}: ${countries.length} quốc gia, ${years.length} năm.`);
