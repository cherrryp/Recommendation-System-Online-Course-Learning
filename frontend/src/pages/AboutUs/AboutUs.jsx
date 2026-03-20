import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import "../../index.css";

function AboutUs() {
  return (
    <div className="about">
      <Navbar />
      <div className="content-about">
        <div className="title">
          <h3 className="title-about">
            About Us
          </h3>
        </div>
        <div className="members">
          <div className="member">
            <div className="image-member poo"></div>
            <div className="detail-opinion">
              <div className="opinion-member">
                <h3>Opinion</h3>
                <p>
                  Learning is a process that helps develop our thinking, skills,
                  and new perspectives, enabling us to adapt better to changes
                  in the world and apply knowledge effectively in real-life
                  situations.
                </p>
                <h3>Detail</h3>
                <p>Name : Aekmongkhon Phonsena</p>
                <p>Student ID: 663380515-0</p>
                <a href="mailto:aekmongkhon.p@kkumail.com">
                  aekmongkhon.p@kkumail.com
                </a>
              </div>
            </div>
          </div>
          <div className="member">
            <div className="image-member guy"></div>
            <div className="detail-opinion">
              <div className="opinion-member">
                <h3>Opinion</h3>
                <p>
                  Learning is a process that helps develop our thinking, skills,
                  and new perspectives, enabling us to adapt better to changes
                  in the world and apply knowledge effectively in real-life
                  situations.
                </p>
                <h3>Detail</h3>
                <p>Name : Aekmongkhon Phonsena</p>
                <p>Student ID: 663380515-0</p>
                <a href="mailto:aekmongkhon.p@kkumail.com">
                  aekmongkhon.p@kkumail.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
export default AboutUs;
