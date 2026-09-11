import {countries,formatValue,indicators,latestMetric,meta,recovery,years,type Country} from '../data/model';

const left=52,right=610,top=28,bottom=258;
const xAt=(index:number)=>left+(index*Math.max(1,right-left))/Math.max(1,years.length-1);

function extent(values:(number|null)[],padding=.08){
 const finite=values.filter((value):value is number=>value!==null&&Number.isFinite(value));
 const low=Math.min(...finite),high=Math.max(...finite),range=Math.max(high-low,10);
 return [Math.floor((low-range*padding)/10)*10,Math.ceil((high+range*padding)/10)*10] as const;
}

function pathSegments(values:(number|null)[],yAt:(value:number)=>number){
 const segments:string[]=[];let current:string[]=[];
 values.forEach((value,index)=>{if(value===null){if(current.length>1)segments.push(current.join(' '));current=[]}else current.push(`${xAt(index)},${yAt(value)}`)});
 if(current.length>1)segments.push(current.join(' '));
 return segments;
}

export function Legend({series=countries}:{series?:Country[]}){return <div className="legend">{series.map(c=><span key={c.id}><i style={{background:c.color}}/>{c.name}</span>)}</div>}

export function LineChart({country}:{country?:Country}){
 const series=country?(country.id==='SG'?[country]:[country,countries.find(item=>item.id==='SG')!]):countries;
 const [min,max]=extent(series.flatMap(item=>item.values));
 const yAt=(value:number)=>bottom-((value-min)/(max-min))*(bottom-top);
 const ticks=Array.from({length:5},(_,index)=>min+((max-min)*index)/4);
 const shownYears=years.filter((_,index)=>index===0||index===years.length-1||years[index]===meta.baseYear||index%3===0);
 return <><div className="chart-top"><span>ĐỘ MỞ THƯƠNG MẠI · CHỈ SỐ</span><span>{meta.baseYear} = 100</span></div><svg viewBox="0 0 660 310" role="img" aria-label={`Chỉ số độ mở thương mại từ ${years[0]} đến ${years.at(-1)}`}><title>Dữ liệu ADB, xuất khẩu cộng nhập khẩu theo phần trăm GDP, quy về năm gốc {meta.baseYear}</title>{ticks.map(v=><g key={v}><line x1={left} x2={right} y1={yAt(v)} y2={yAt(v)} className={Math.abs(v-100)<.01?'baseline':'grid'}/><text x="8" y={yAt(v)+5}>{formatValue(v,0)}</text></g>)}{shownYears.map(y=><text key={y} x={xAt(years.indexOf(y))} y="292" textAnchor="middle">{y}</text>)}{series.map(c=><g key={c.id}>{pathSegments(c.values,yAt).map((points,index)=><polyline key={index} fill="none" stroke={c.color} strokeWidth="3" strokeDasharray={c.id==='SG'?'6 6':undefined} points={points}/>)}{c.values.map((v,index)=>v===null?null:<circle key={years[index]} cx={xAt(index)} cy={yAt(v)} r="3.5" fill={c.color}><title>{c.name}: {years[index]}, {formatValue(v,1)}</title></circle>)}</g>)}</svg><Legend series={series}/></>
}

export function RecoveryChart(){
 const values=countries.map(country=>({country,value:recovery(country)}));
 const max=Math.max(...values.map(item=>Math.abs(item.value??0)),1);
 return <><div className="chart-top"><span>THAY ĐỔI ĐỘ MỞ THƯƠNG MẠI</span><span>{years.at(-1)} so với {meta.baseYear} · điểm chỉ số</span></div><div className="bars">{values.map(({country,value})=><div className="bar-row" key={country.id}><span>{country.name}</span><div><div className="bar" style={{width:`${Math.abs(value??0)/max*100}%`,background:country.color,opacity:value===null?.25:1}}/></div><b>{value===null?'—':`${value>=0?'+':''}${formatValue(value,1)}`}</b></div>)}</div><p className="chart-note">Mốc {meta.baseYear} = 100. Thứ tự hiển thị cố định, không phải bảng xếp hạng.</p></>
}

export function ScatterPlot(){
 const points=countries.map(country=>({country,x:latestMetric(country,'manufacturing_pct'),y:latestMetric(country,'current_account_pct')})).filter(item=>item.x?.value!==null&&item.y?.value!==null);
 const xValues=points.map(item=>item.x!.value as number),yValues=points.map(item=>item.y!.value as number);
 const [xMin,xMax]=extent(xValues,0.15),[yMin,yMax]=extent(yValues,0.15);
 const px=(value:number)=>left+((value-xMin)/(xMax-xMin))*(right-left),py=(value:number)=>bottom-((value-yMin)/(yMax-yMin))*(bottom-top);
 return <><div className="chart-top"><span>CẤU TRÚC SẢN XUẤT & ĐỐI NGOẠI</span><span>Năm gần nhất có dữ liệu</span></div><svg viewBox="0 0 660 340" role="img" aria-label="Tỷ trọng chế biến chế tạo và cán cân vãng lai"><line className="grid" x1={left} x2={right} y1={bottom} y2={bottom}/><line className="grid" x1={left} x2={left} y1={top} y2={bottom}/><text x={left} y="18">Y: {indicators.current_account_pct.label} ({indicators.current_account_pct.unit})</text><text x="330" y="328" textAnchor="middle">X: {indicators.manufacturing_pct.label} ({indicators.manufacturing_pct.unit})</text><text x={left} y="282">{xMin}</text><text x={right} y="282" textAnchor="end">{xMax}</text><text x="12" y={top+5}>{yMax}</text><text x="12" y={bottom+5}>{yMin}</text>{points.map(({country,x,y})=><g key={country.id}><circle cx={px(x!.value as number)} cy={py(y!.value as number)} r="9" fill={country.color}><title>{country.name}: {x!.year} / {y!.year}</title></circle><text x={px(x!.value as number)} y={py(y!.value as number)-15} textAnchor="middle">{country.id==='SG'?'SG · benchmark':country.id}</text></g>)}</svg><Legend/><p className="chart-note">Hai chỉ tiêu có thể mang năm quan sát gần nhất khác nhau; biểu đồ chỉ mô tả, không suy luận quan hệ nhân quả.</p></>
}

export function SnapshotChart(){return <><div className="chart-top"><span>ẢNH CHỤP ĐỘ MỞ THƯƠNG MẠI</span><span>{years.at(-1)} · mốc {meta.baseYear} = 100</span></div><div className="snapshots">{countries.map(c=>{const latest=[...c.values].reverse().find(value=>value!==null);const [min,max]=extent(c.values);const sparkY=(value:number)=>32-((value-min)/(max-min))*28;return <div key={c.id}><span>{c.name}</span><strong style={{color:c.color}}>{formatValue(latest,1)}</strong><svg viewBox="0 0 100 35" aria-label={`Đường độ mở thương mại ${c.name}`}>{pathSegments(c.values,sparkY).map((points,index)=><polyline key={index} points={points.split(' ').map(point=>{const [x,y]=point.split(',').map(Number);return `${(x-left)/(right-left)*100},${y}`}).join(' ')} fill="none" stroke={c.color} strokeWidth="2"/>)}</svg></div>})}</div></>}
