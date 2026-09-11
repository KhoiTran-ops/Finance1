import data from './adb-data.json';

export type MetricKey = keyof typeof data.indicators;
export type MetricPoint = {year:number; value:number|null; status:string};
export type Country = (typeof data.countries)[number];

export const countries = data.countries;
export const years = data.years;
export const meta = data.metadata;
export const indicators = data.indicators;
export const baseYearIndex = years.indexOf(meta.baseYear);

export const countryLabel = (id:string) => countries.find(c=>c.id===id)?.name ?? id;

export function latestMetric(country:Country, key:MetricKey):MetricPoint|null {
  const points = country.metrics[key] as MetricPoint[];
  return [...points].reverse().find(point=>point.value!==null) ?? null;
}

export function recovery(country:Country):number|null {
  const baseline = country.values[baseYearIndex];
  const latest = [...country.values].reverse().find(value=>value!==null);
  return baseline===null || latest===undefined ? null : latest-baseline;
}

export function formatValue(value:number|null|undefined, digits=1):string {
  return value===null || value===undefined
    ? '—'
    : new Intl.NumberFormat('vi-VN',{maximumFractionDigits:digits,minimumFractionDigits:digits}).format(value);
}
