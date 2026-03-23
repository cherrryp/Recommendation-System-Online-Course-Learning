import "./Content_1.css"
import imgcon1 from "../assets/con1.png"
import { Link } from "react-router-dom"

function Content_1() {
  return (
    <div className="content-1">
      <div className="in-content-1">
        <div className="text-con1">
          <h3>ค้นหาคอร์สที่ใช่ สำหรับคุณโดยเฉพาะ</h3>
          <p>
            ระบบแนะนำคอร์สอัจฉริยะที่ช่วยวิเคราะห์ความสนใจของคุณ
            เพื่อคัดเลือกคอร์สที่เหมาะสมที่สุด ไม่ต้องเสียเวลาค้นหาเอง
            เรียนรู้ได้ตรงจุด และพัฒนาทักษะได้เร็วขึ้น
          </p>

          <div className="button-con">
            <Link to="/course" className="con1-btn start">สำรวจคอร์ส</Link>
            <Link to="/profile" className="con1-btn learn">ปรับความสนใจ</Link>
          </div>
        </div>

        <div className="img-con1">
          <img src={imgcon1} alt="content-1" width={500} height={350}/>
        </div>
      </div>
    </div>
  )
}

export default Content_1