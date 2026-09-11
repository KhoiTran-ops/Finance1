import demo from './demo-data.json';
import metadata from './metadata.json';
export type Country = typeof demo.countries[number];
export const countries = demo.countries;
export const years = demo.years;
export const meta = metadata;
export const countryLabel = (id:string) => countries.find(c=>c.id===id)?.name ?? id;
export const recovery = (c:Country) => c.values[c.values.length-1] - c.values[0];
