import {useEffect,useState} from 'react';
import {scenes} from './scenes/story';
import ASEANMap from './components/ASEANMap';
import StoryNavigation from './components/StoryNavigation';
import CountryScene from './components/CountryScene';
import MethodPanel from './components/MethodPanel';
import {LineChart,RecoveryChart,ScatterPlot,SnapshotChart} from './components/Charts';
import {countryLabel,meta} from './data/model';
function initial(){const n=scenes.findIndex(s=>s.id===location.hash.slice(1));return n<0?0:n}
export default function App(){
 const [index,setIndex]=useState(initial);
 const [notice,setNotice]=useState('');
 const scene=scenes[index];
 const go=(n:number)=>{const next=Math.max(0,Math.min(scenes.length-1,n));setIndex(next);location.hash=scenes[next].id;setNotice('')};
 useEffect(()=>{const hash=()=>setIndex(initial());const key=(e:KeyboardEvent)=>{if((e.target as HTMLElement)?.closest?.('button,a,input,select,textarea'))return;if(e.key==='ArrowRight'||e.key==='PageDown'){e.preventDefault();go(index+1)}if(e.key==='ArrowLeft'||e.key==='PageUp'){e.preventDefault();go(index-1)}};window.addEventListener('hashchange',hash);window.addEventListener('keydown',key);return()=>{window.removeEventListener('hashchange',hash);window.removeEventListener('keydown',key)}},[index]);
 async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{setNotice('Trình duyệt chưa hỗ trợ toàn màn hình. Dùng F11 hoặc chế độ trình chiếu của trình duyệt.')}}
 return <div className="app"><header>
  <a href="#landing" className="brand" onClick={()=>go(0)}>atlas<span> / </span><small>ASIA · FINANCIAL STORIES</small></a>
  <div className="header-actions"><button className={index===0?'selected':''} onClick={()=>go(0)}>Bản đồ</button><button onClick={()=>go(9)}>Phương pháp ↗</button><button onClick={fullscreen} aria-label="Bật hoặc tắt toàn màn hình">⛶ <span>Trình chiếu</span></button></div>
 </header><div className="demo-banner"><span className="demo-badge">ADB DATA</span><span>{meta.title} · Kỳ {meta.period} · Dữ liệu thiếu không được nội suy</span></div>
 {notice&&<div role="status" className="notice">{notice}</div>}
 <main key={scene.id} className={`scene scene-${scene.id} ${scene.country?'country-scene':''}`}>
 {index===0?<><ASEANMap onSelect={id=>go(scenes.findIndex(s=>s.country===id))}/></>:<>
  <section className="story-copy"><button className="back-map" onClick={()=>go(0)}>← Trở về bản đồ</button><div className="eyebrow">{scene.eyebrow}</div><h1>{scene.country?countryLabel(scene.country):scene.title}</h1><p className="description">{scene.description}</p>{!scene.country&&<div className="editor-note"><span>GHI CHÚ CHO NGƯỜI XEM</span><p>{scene.id==='overview'?'Độ mở thương mại là thước đo quy mô tương đối của hoạt động xuất nhập khẩu hàng hóa và dịch vụ so với tổng sản phẩm quốc nội (GDP) của một quốc gia.':'Biểu đồ sử dụng dữ liệu ADB đã qua pipeline kiểm tra. Các chỉ số được mô tả theo nguồn và không được diễn giải như quan hệ nhân quả.'}</p></div>}<div className="chapter-index">{String(index).padStart(2,'0')}<span> / FINANCIAL ATLAS</span></div></section>
  <section className="visual-stage" aria-label={`Nội dung cảnh ${scene.label}`}>{scene.country?<CountryScene id={scene.country}/>:scene.id==='methodology'?<MethodPanel/>:<div className="chart-panel">{scene.id==='overview'?<><LineChart/><SnapshotChart/></>:scene.id==='comparison'?<RecoveryChart/>:<ScatterPlot/>}<div className="source">Nguồn: <a href={meta.sourceUrl} target="_blank" rel="noreferrer">ADB Key Indicators Database</a>{scene.id==='surprise'?' · Năm gần nhất có dữ liệu':''}</div></div>}</section>
 </>}
 </main><StoryNavigation index={index} onChange={go}/></div>
}
