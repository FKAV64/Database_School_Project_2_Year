// src/pages/Login.jsx
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Login = () => {
  // 1. STATE (The Memory)
  // We need two variables to hold what the user types.
  // setEmail is the function we MUST use to update the email variable.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // 2. NAVIGATION (The Redirect)
  // This tool lets us force the user to a new page (like Dashboard) after success.
  const navigate = useNavigate();

  // 3. THE HANDLE SUBMIT (The Engine)
  // This runs when the user clicks "Login".
  // e stands for "Event". It is a JavaScript object that contains information about "what just happened".
  const handleSubmit = async (e) => {
    e.preventDefault(); // Stop the browser from reloading the page (Default HTML behavior)
    setError(""); // Clear previous errors

    try {
      // THE API CALL
      // We are calling the C# Endpoint: [HttpPost("login")]
      // Payload matches UserLoginDTO: { Email: "...", Sifre: "..." }
      // NOTE: Replace '5143' with your actual API port if different!
      const response = await axios.post("http://localhost:5143/api/auth/login", {
        Email: email,
        Sifre: password,
      });
      // We define 'token' here so we can use it immediately
      const token = response.data.token;
      localStorage.setItem("token", token);

      // 3. DECODE & DISPATCH (Nested inside Success Block)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const role = payload["role"] || payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

        if (role === "Ogretmen" || role === "Admin") {
            navigate("/teacher-dashboard");
        } else {
            navigate("/student-dashboard");
        }
        
        //alert("Welcome back!");

      } catch (decodeError) {
        console.error("Token Decode Error:", decodeError);
        setError("Invalid email or password.");
      }

    } catch (err) {
      // IF FAILURE (Code 401, 500, etc):
      console.error("Login Failed:", err);
      setError("Invalid email or password.");
    }
  };
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>Student Login</h2>
        
        {/* Conditional Rendering: Only show this red box if error is not empty */}
        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit}>
          
          {/* EMAIL INPUT */}
          <div style={styles.inputGroup}>
            <label>Email:</label>
            <input
              type="email"
              value={email}
              // EVENT LISTENER:
              // Whenever the user types a key, 'e.target.value' gets the text.
              // setEmail updates the state, which updates the UI.
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
            />
          </div>

          {/* PASSWORD INPUT */}
          <div style={styles.inputGroup}>
            <label>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
            />
          </div>

          <button type="submit" style={styles.button}>Login</button>
        </form>
        {/* Register Button */}
        <div style={{marginTop: "1rem", textAlign: "center"}}>
          <p>Don't have an account?</p>
          <button 
              type="button" // Important: type="button" prevents form submission
              onClick={() => navigate("/register")}
              style={{...styles.button, backgroundColor: "#7f8c8d"}}
          >
              Register New Student
          </button>
        </div>
      </div>
    </div>
  );
};

// Internal CSS for this page
const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    marginTop: "50px",
  },
  card: {
    width: "400px",
    padding: "2rem",
    border: "1px solid #ddd",
    borderRadius: "8px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
  },
  inputGroup: {
    marginBottom: "1rem",
  },
  input: {
    width: "100%",
    padding: "0.5rem",
    marginTop: "0.5rem",
    borderRadius: "4px",
    border: "1px solid #ccc",
  },
  button: {
    width: "100%",
    padding: "0.75rem",
    backgroundColor: "#2c3e50",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "1rem",
  },
  errorBox: {
    backgroundColor: "#e74c3c",
    color: "white",
    padding: "0.5rem",
    marginBottom: "1rem",
    borderRadius: "4px",
    textAlign: "center",
  }
};

export default Login;