import {countries} from '../data/model';
import {culture} from '../data/culture';
import {LineChart} from './Charts';
export default function CountryScene({id}:{id:string}){
 const c=countries.find(c=>c.id===id)!;
 const art=culture[id];
 return <div className="country-dashboard">
  <div className="country-kpis">{['Chỉ tiêu tài chính 01','Chỉ tiêu tài chính 02','Chỉ tiêu tài chính 03'].map((label)=><div key={label}><span>{label}</span><strong>—</strong><small>Chờ dữ liệu cung cấp</small></div>)}</div>
  <div className="chart-panel"><LineChart country={c}/><div className="source">Đường minh họa · Không phải số liệu tài chính thật</div></div>
  <div className="financial-note"><span>NỘI DUNG CÂU CHUYỆN</span><p>Phần phân tích của {c.name} sẽ xuất hiện tại đây sau khi nhận dữ liệu, nguồn và thông điệp từ nhóm nghiên cứu.</p></div>
  <figure className="culture-strip"><img src={art.image} alt={art.caption} onError={e=>{e.currentTarget.style.display='none'}}/><figcaption><b>{art.title}</b><span>{art.caption}</span></figcaption></figure>
 </div>
}
