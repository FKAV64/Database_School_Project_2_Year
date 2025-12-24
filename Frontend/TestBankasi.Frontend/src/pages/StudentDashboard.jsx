// src/pages
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState("");

  // SECURITY CHECK: Run this immediately when the page loads
  useEffect(() => {
    // 1. Get the token from "The Pocket" (Local Storage)
    const token = localStorage.getItem("token");

    // 2. If no token, KICK THEM OUT
    if (!token) {
      navigate("/login");
      return;
    }

    // 3. (Optional) We can decode the token here to get the Name/Role
    // For now, we assume they are a student.
    setUserRole("Student");
    
  }, [navigate]);

  // LOGOUT LOGIC
  const handleLogout = () => {
    // Destroy the token (Burn the Badge)
    localStorage.removeItem("token");
    // Redirect to home
    navigate("/");
  };

  return (
    <div style={styles.container}>
      <h1>Dashboard</h1>
      <p>Welcome, {userRole}!</p>

      <div style={styles.grid}>
        
        {/* CARD 1: Start Exam */}
       <div style={styles.card} onClick={() => navigate("/start-exam")}>
          <h3>📝 Start Exam</h3>
          <p>Take a new test based on your level.</p>
        </div>

        {/* CARD 2: My History */}
        <div style={styles.card} onClick={() => navigate("/my-history")}>
          <h3>My History</h3>
          <p>View all past exam records.</p>
        </div>

      {/* CARD 3: My Performance */}
        <div style={styles.card} onClick={() => navigate("/my-performance")}>
          <h3>My Performance</h3>
          <p>View stats by Lesson & Subject & Difficulty.</p>
        </div>
    </div>
      <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
    </div>
  );
};

const styles = {
  container: {
    textAlign: "center",
    padding: "2rem",
  },
  grid: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "2rem",
    marginTop: "2rem",
    marginBottom: "2rem",
  },
  card: {
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "2rem",
    width: "25%",
    minWidth: "200px",
    cursor: "pointer",
    backgroundColor: "white",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
    transition: "transform 0.2s", // smooth hover effect
  },
  logoutBtn: {
    padding: "0.5rem 1rem",
    backgroundColor: "#c44233ff",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  }
};

export default Dashboard;