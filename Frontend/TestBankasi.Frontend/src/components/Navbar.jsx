// IMPORT: We need this specific tool from the library.
// We DO NOT use standard HTML <a href="..."> tags.
// Why? Because <a> tags force the browser to refresh (the "blink").
import { Link, useNavigate } from "react-router-dom"; 

// COMPONENT: A React component is just a JavaScript function that returns UI.
// The name 'Navbar' must be Capitalized (React rule).
const Navbar = () => {
  const navigate = useNavigate();
  
  // Check if user is logged in
  const isLoggedIn = !!localStorage.getItem("token"); // "!!" converts string to boolean (true/false)

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/"); // Refresh page or redirect to update UI
    window.location.reload(); // Hard refresh to update the Navbar state (Simple fix for now)
  };
  return (
    // We use a semantic <nav> tag for accessibility.
    // style={styles.nav} refers to the object we defined at the bottom.
    <nav style={styles.nav}>
      
      {/* Logo Section 
      */}
      <div style={styles.logo}>
        {/* <Link> is the magic. 
            When clicked, it tells React Router: "Change the URL to '/', but DO NOT reload the page."
            React then looks at App.jsx to see what content belongs to '/'.
        */}
        <Link to="/" style={styles.link}>TestBankasi</Link>
      </div>

      {/* Menu Items 
      */}
      <ul style={styles.menu}>
        <li>
          <Link to="/" style={styles.link}>Home</Link>
        </li>
        {/* CONDITIONAL RENDERING */}
        {isLoggedIn ? (
          <>
            <li><Link to="/dashboard" style={styles.link}>Dashboard</Link></li>
            <li><button onClick={handleLogout} style={styles.logoutLink}>Logout</button></li>
          </>
        ) : (
          <li><Link to="/login" style={styles.link}>Login</Link></li>
        )}
      </ul>
    </nav>
  );
};

// STYLES: This is "CSS-in-JS".
// Instead of a separate .css file, we write styles as a JavaScript object.
// Notice we use camelCase (backgroundColor) instead of kebab-case (background-color).
const styles = {
  nav: {
    display: "flex",            // Flexbox: Lays out children (Logo, Menu) in a row
    justifyContent: "space-between", // Pushes Logo to left, Menu to right
    alignItems: "center",       // Vertically centers items
    padding: "1rem 2rem",       // Spacing inside the bar
    backgroundColor: "#2c3e50", // Dark Blue color
    color: "white",
  },
  logo: {
    fontSize: "1.5rem",
    fontWeight: "bold",
  },
  menu: {
    display: "flex",            // Flexbox: Lays out list items in a row
    listStyle: "none",          // Removes the bullet points (•)
    gap: "1.5rem",              // Adds 1.5rem space between 'Home' and 'Login'
    margin: 0,
    padding: 0,
  },
  link: {
    color: "white",
    textDecoration: "none",     // Removes the default blue underline from links
    fontSize: "1rem",
  },  
  logoutLink: {
    backgroundColor: "#c0392b",
    border: "none",
    color: "white",
    fontSize: "0.9rem",
    cursor: "pointer",
    textDecoration: "underline",
  }
  
};

export default Navbar;