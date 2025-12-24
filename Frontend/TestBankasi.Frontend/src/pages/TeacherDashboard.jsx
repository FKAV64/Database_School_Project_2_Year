import { useNavigate } from "react-router-dom";

const TeacherDashboard = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: "3rem", textAlign: "center" }}>
      <h1>Teacher Dashboard 🎓</h1>
      <p style={{color: "#7f8c8d", marginBottom: "3rem"}}>Welcome back, Instructor.</p>
      
      <div style={{ display: "flex", gap: "30px", justifyContent: "center" }}>
        
        {/* BUTTON: Manage Questions */}
        <div 
            style={cardStyle}
            onClick={() => navigate("/manage-questions")}
            onMouseOver={e => e.currentTarget.style.transform = "translateY(-5px)"}
            onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}
        >
            <div style={{fontSize: "3rem", marginBottom: "1rem"}}>✏️</div>
            <h3>Question Bank</h3>
            <p>Add, Update, or Delete questions from your lessons.</p>
        </div>

        {/* BUTTON: Statistics */}
        <div 
            style={cardStyle} 
            onClick={() => navigate("/teacher-stats")}
            onMouseOver={e => e.currentTarget.style.transform = "translateY(-5px)"}
            onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}
        >
            <div style={{fontSize: "3rem", marginBottom: "1rem"}}>📊</div>
            <h3>Class Statistics</h3>
            <p>View Popular Topics & Top Students</p>
        </div>

      </div>
    </div>
  );
};

const cardStyle = {
    border: "1px solid #eee", 
    padding: "2rem", 
    borderRadius: "12px", 
    cursor: "pointer", 
    width: "250px", 
    backgroundColor: "white",
    boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
    transition: "transform 0.2s ease"
};

export default TeacherDashboard;