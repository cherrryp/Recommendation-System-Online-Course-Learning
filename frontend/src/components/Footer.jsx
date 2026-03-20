import Logo from "../assets/logo.png";
import "./Footer.css"

function Footer() {
  return (
    <div className="footer">
        <div className="footer-logo">
            <img src={Logo} alt="Logo" className="footer-logo" />
            <p className="footer-logo-text">LearningPath</p>
        </div>
        <div className="contact">
            <h3>Contact Us</h3>
            <p>Email: <a href="mailto:Aekmongkhon.p@kkumail.com">Aekmongkhon.p@kkumail.com</a> , <a href="mailto:Aekmongkhon.p@kkumail.com">xxxxxxx@kkumail.com</a></p>
            <p>Phone: <a href="tel:+1234567890">+1234567890</a> , <a href="tel:+1234567890">+1234567890</a></p>
            <p>Address: 123 Main Street, City, Country</p>
        </div>
    </div>
  )
}
export default Footer