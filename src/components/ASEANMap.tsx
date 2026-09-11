import {useState} from 'react';
import geography from '../data/globe-paths.json';
import {countries} from '../data/model';
const markers=[{id:'VN',x:350,y:302,color:'#ff7467',flag:'🇻🇳'},{id:'TH',x:324,y:322,color:'#55dfff',flag:'🇹🇭'},{id:'MY',x:328,y:382,color:'#ffcf64',flag:'🇲🇾'},{id:'SG',x:338,y:395,color:'#c596ff',flag:'🇸🇬'},{id:'ID',x:406,y:418,color:'#66ffc2',flag:'🇮🇩'}];
export default function ASEANMap({onSelect}:{onSelect:(id:string)=>void}){
 const [hover,setHover]=useState<string|null>(null);
 const select=(e:React.KeyboardEvent,id:string)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(id)}};
 return <div className="globe-experience">
  <div className="globe-copy"><span>FIVE ECONOMIES.<br/>ONE REGION.<br/>DIFFERENT JOURNEYS.</span><div><h1>EXPLORE <br/><strong>ASEAN</strong></h1><p>Chọn một quốc gia để khám phá<br/>câu chuyện và dashboard tài chính.</p></div></div>
  <svg className="earth-globe" viewBox="0 0 760 710" aria-label="Quả địa cầu tương tác, tập trung vào châu Á">
   <defs><radialGradient id="ocean" cx="38%" cy="26%"><stop stopColor="#174767"/><stop offset=".52" stopColor="#08263b"/><stop offset=".91" stopColor="#031423"/><stop offset="1" stopColor="#18628a"/></radialGradient><radialGradient id="earth-light" cx="30%" cy="15%" r="85%"><stop stopColor="#a1e2ff" stopOpacity=".23"/><stop offset=".5" stopColor="#041421" stopOpacity="0"/><stop offset="1" stopColor="#00101e" stopOpacity=".45"/></radialGradient><filter id="atmosphere" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation="12"/></filter><filter id="beacon" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="4"/></filter><clipPath id="sphere-clip"><circle cx="380" cy="340" r="302"/></clipPath></defs>
   <circle cx="380" cy="340" r="306" fill="none" stroke="#35a9ef" strokeWidth="9" opacity=".42" filter="url(#atmosphere)"/>
   <circle cx="380" cy="340" r="302" fill="url(#ocean)" stroke="#56b6e8" strokeWidth="1.5"/>
   <g clipPath="url(#sphere-clip)">
    <g className="globe-graticule">{[130,235,340,445,550].map(y=><ellipse key={y} cx="380" cy={y} rx={Math.sqrt(302**2-(y-340)**2)} ry="23"/>)}{[85,185,265].map(rx=><ellipse key={rx} cx="380" cy="340" rx={rx} ry="302"/>)}</g>
    {geography.filter(f=>f.path).map(f=>{const marker=markers.find(m=>m.id===f.id);const name=countries.find(c=>c.id===f.id)?.name;return <path key={f.id+f.name} d={f.path??''} className={`globe-land ${marker?'globe-target':''} ${hover===f.id?'raised':''}`} style={marker?{'--territory-color':marker.color} as React.CSSProperties:undefined} role={marker?'button':undefined} tabIndex={marker?0:undefined} aria-label={name} onMouseEnter={()=>marker&&setHover(f.id)} onMouseLeave={()=>setHover(null)} onFocus={()=>marker&&setHover(f.id)} onBlur={()=>setHover(null)} onClick={()=>marker&&onSelect(f.id)} onKeyDown={e=>marker&&select(e,f.id)}><title>{name??f.name}</title></path>})}
    <circle className="globe-light" cx="380" cy="340" r="301" fill="url(#earth-light)"/>
   </g>
   <g className="earth-geography-labels"><text x="337" y="245">CHINA</text><text x="205" y="309">INDIA</text><text x="447" y="553">AUSTRALIA</text><text x="570" y="375">PACIFIC</text><text x="574" y="388">OCEAN</text><text x="192" y="469">INDIAN</text><text x="194" y="482">OCEAN</text></g>
   {markers.map(m=>{const c=countries.find(c=>c.id===m.id)!;return <g className={`globe-pin ${hover===m.id?'active':''}`} key={m.id} role="button" tabIndex={0} aria-label={`Mở ${c.name}`} onMouseEnter={()=>setHover(m.id)} onMouseLeave={()=>setHover(null)} onFocus={()=>setHover(m.id)} onBlur={()=>setHover(null)} onClick={()=>onSelect(m.id)} onKeyDown={e=>select(e,m.id)} style={{'--territory-color':m.color} as React.CSSProperties}><circle className="beacon-halo" cx={m.x} cy={m.y} r="11" fill={m.color} filter="url(#beacon)"/><circle cx={m.x} cy={m.y} r="4" fill="#fff"/><circle cx={m.x} cy={m.y} r="13" fill="transparent"/><text x={m.x+12} y={m.y+4}>{c.name}</text></g>})}
  </svg>
  <aside className="asean-context"><span>◎ &nbsp; THE ASEAN CONTEXT</span><p>Năm nền kinh tế, những góc nhìn kết nối trong một khu vực.</p><small>Singapore · benchmark<br/>Dữ liệu tài chính đang chờ bổ sung.</small></aside>
  <div className="globe-countries">{markers.map(m=><button key={m.id} onClick={()=>onSelect(m.id)} onMouseEnter={()=>setHover(m.id)} onMouseLeave={()=>setHover(null)} onFocus={()=>setHover(m.id)} onBlur={()=>setHover(null)}><span className="flag-orb" style={{'--territory-color':m.color} as React.CSSProperties}>{m.flag}</span><span>{countries.find(c=>c.id===m.id)?.name}</span></button>)}</div>
  <div className="globe-footnote">BẢN ĐỒ MINH HỌA · RANH GIỚI KHÁI QUÁT · DEMO DATA</div>
 </div>
}
