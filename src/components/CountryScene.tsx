import {countries,formatValue,indicators,latestMetric} from '../data/model';
import {culture} from '../data/culture';
import {LineChart} from './Charts';

const kpis=['trade_openness','manufacturing_pct','current_account_pct'] as const;

export default function CountryScene({id}:{id:string}){
 const country=countries.find(item=>item.id===id)!;
 const art=culture[id];
 return <div className="country-dashboard">
  <div className="country-kpis">{kpis.map(key=>{const point=latestMetric(country,key);const definition=indicators[key];return <div key={key}><span>{definition.label}</span><strong>{formatValue(point?.value,1)}</strong><small>{definition.unit} · {point?.year??'chưa có kỳ'}</small></div>})}</div>
  <div className="chart-panel"><LineChart country={country}/><div className="source">Nguồn: ADB Key Indicators Database · Độ mở = xuất khẩu + nhập khẩu (% GDP)</div></div>
  <div className="financial-note"><span>GHI CHÚ DỮ LIỆU</span><p>Các giá trị của {country.name} là quan sát từ pipeline dữ liệu; ô thiếu được giữ trống, không nội suy và không thay bằng 0.</p></div>
  <figure className="culture-strip"><img src={art.image} alt={art.caption} onError={e=>{e.currentTarget.style.display='none'}}/><figcaption><b>{art.title}</b><span>{art.caption}</span></figcaption></figure>
 </div>
}
