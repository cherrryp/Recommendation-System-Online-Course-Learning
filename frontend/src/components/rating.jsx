import imgRating from "../assets/content-rating.png"
import "./Rating.css"

function Rating() {
  return (
    <div className="content-rating">
        <img src={imgRating} alt="" width={500} height={350}/>
        <div className="rating">
            <div className="rating-1">
                <svg xmlns="http://www.w3.org/2000/svg" height="40px" viewBox="0 -960 960 960" width="40px" fill="#634FA2"><path d="m354-287 126-76 126 77-33-144 111-96-146-13-58-136-58 135-146 13 111 97-33 143ZM233-120l65-281L80-590l288-25 112-265 112 265 288 25-218 189 65 281-247-149-247 149Zm247-350Z"/></svg>
                <h2>4.8</h2>
                <p>Rating</p>
            </div>
            <div className="rating-2">
                <svg xmlns="http://www.w3.org/2000/svg" height="40px" viewBox="0 -960 960 960" width="40px" fill="#634FA2"><path d="M200-246q54-53 125.5-83.5T480-360q83 0 154.5 30.5T760-246v-514H200v514Zm379-235q41-41 41-99t-41-99q-41-41-99-41t-99 41q-41 41-41 99t41 99q41 41 99 41t99-41ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm69-80h422q-44-39-99.5-59.5T480-280q-56 0-112.5 20.5T269-200Zm168.5-337.5Q420-555 420-580t17.5-42.5Q455-640 480-640t42.5 17.5Q540-605 540-580t-17.5 42.5Q505-520 480-520t-42.5-17.5ZM480-503Z"/></svg>
                <h2>500+</h2>
                <p>Learners</p>
            </div>
            <div className="rating-3">
                <svg xmlns="http://www.w3.org/2000/svg" height="40px" viewBox="0 -960 960 960" width="40px" fill="#634FA2"><path d="M270-80q-45 0-77.5-29.92Q160-139.85 160-184v-562q0-37.04 22.58-66.29 22.58-29.24 59.09-37.04l385-78.67v626.67l-366.34 76.66q-14.43 3.13-24.04 14.86-9.62 11.73-9.62 25.81 0 16.33 13 26.83t30.33 10.5h463.33V-800H800v720H270Zm76.67-229.67L560-354v-492l-213.33 43v493.33ZM280-295.79V-789l-18.33 3.67q-15 3.33-25 13.71-10 10.39-10 25.62v466.33q7.7-4.13 16.18-7.23 8.48-3.1 17.48-4.77l19.67-4.12ZM226.67-781v501.33V-781Z"/></svg>
                <h2>100+</h2>
                <p>Courses</p>
            </div>
        </div>
    </div>
  )
}
export default Rating