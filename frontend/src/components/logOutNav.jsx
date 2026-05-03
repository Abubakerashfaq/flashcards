import {Link} from "react-router-dom";
import "../css/Navbar.css"

function logOutNav(){
    return <nav className = "navbar">
        <div className = "navbar-brand">
            <Link to = "/">Home</Link>
        </div>
        <div className = "navbar-links">
            <Link to = "/cardeditor">Create</Link>
            <Link to = "/cardeditor">Login</Link>
            <Link to = "/cardeditor">Get Started</Link>
        </div>
    </nav>
}

export default logOutNav;