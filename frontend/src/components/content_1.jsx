import "./Content_1.css"
import imgcon1 from "../assets/con1.png"
import { Link } from "react-router-dom"

function Content_1() {
  return (
    <div className="content-1">
      <div className="in-content-1">
        <div className="text-con1">
          <h3>Personalized Learning, Designed for Your Growth</h3>
          <p>
            Unlock your full potential with our intelligent course recommendation system.
            Learn smarter, achieve faster, and start your journey to success today.
          </p>

          <div className="button-con">
            <Link to="/course" className="con1-btn start">Get Started</Link>
            <Link to="/about" className="con1-btn learn">Learn More</Link>
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