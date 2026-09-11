import {meta} from '../data/model';

function retrievalDate(value:string|null){
 if(!value)return 'Không có trong manifest';
 const match=value.match(/^(\d{4})(\d{2})(\d{2})T/);
 return match?`${match[3]}/${match[2]}/${match[1]}`:value;
}

export default function MethodPanel(){return <div className="method-grid">{[
 ['Trạng thái','Đã kết nối dữ liệu quan sát từ pipeline ADB'],
 ['Nguồn chỉ số',meta.source],
 ['Nguồn bổ sung',meta.supplementalSource],
 ['Kỳ dữ liệu & ngày tải',`${meta.period}; tải ngày ${retrievalDate(meta.retrievedAt)}`],
 ['Cách tính',`Độ mở thương mại = xuất khẩu + nhập khẩu (% GDP). Chỉ số = giá trị năm t / giá trị năm ${meta.baseYear} × 100.`],
 ['Dữ liệu thiếu',meta.notes],
 ['Vai trò Singapore','Benchmark riêng; không dùng để tạo thứ hạng bốn quốc gia trọng tâm.'],
 ['Giới hạn','Năm gần nhất giữa các chỉ tiêu có thể khác nhau. Dữ liệu quan sát không tự nó chứng minh quan hệ nhân quả.'],
 ['Bản đồ','Natural Earth qua datasets/geo-countries (Public Domain). Hình học khái quát, không thể hiện quan điểm về ranh giới.']
 ].map(([title,copy])=><section key={title}><h3>{title}</h3><p>{copy}</p></section>)}</div>}
