// src/pages/MyHistory.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const MyHistory = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem("token");
        // CALLING THE API (Port 5143 HTTP)
        const response = await axios.get("http://localhost:5143/api/Exam/my-history", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Debugging: Check the casing in the console!
        //console.log("History Data:", response.data);
        
        //setExams(response.data);
        setExams(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error("Fetch failed:", err);
        alert("Could not load history.");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) return <div style={{textAlign: "center", marginTop: "2rem"}}>Loading Records...</div>;


  // HELPER FUNCTION: Calculate "Time Taken" (Difference between Start and End)
  const calculateTimeTaken = (start, end, limit) => {
      if (!start || !end) return "-";
      const startTime = new Date(start);
      const endTime = new Date(end);
      let diffMs = endTime - startTime; // Difference in milliseconds
      if (limit) {
          const limitMs = limit * 60 * 1000;
          if (diffMs > limitMs) {
              diffMs = limitMs;
          }
      }

      if (diffMs < 0) return "0m 0s";
      const diffMins = Math.floor(diffMs / 60000); 
      const diffSecs = Math.floor((diffMs % 60000) / 1000);
      return `${diffMins}m ${diffSecs}s`;
  };

  // HELPER FUNCTION: Format nice date/time
  const formatDateTime = (dateString) => {
      if (!dateString) return "-";
      const date = new Date(dateString);
      // Returns: "12/10/2025 14:30"
      return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
      <div style={styles.container}>
        <h2>My Exam History</h2>
        
        {exams.length === 0 ? (
          <div style={styles.emptyState}>
            <p>You haven't taken any exams yet.</p>
            <button onClick={() => navigate("/start-exam")} style={styles.linkBtn}>Take a Test</button>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.headerRow}>
                <th>Date & Start Time</th>
                <th>Lesson</th>
                <th>Time Taken / Limit</th> {/* Merged column for compactness */}
                <th>Score</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((exam) => {
                  // Handle casing (Backend might send PascalCase or camelCase)
                  const start = exam.baslaZaman || exam.BaslaZaman;
                  const end = exam.bitirZaman || exam.BitirZaman;
                  const limit = exam.sureDakika || exam.SureDakika;
                  const score = exam.puan !== null ? (exam.puan !== undefined ? exam.puan : exam.Puan) : null;
                  const id = exam.oturumID || exam.OturumID;
                  const lesson = exam.dersAdi || exam.DersAdi;

                  return (
                    <tr key={id} style={styles.row}>
                      {/* 1. Exact Date & Time */}
                       <td>{formatDateTime(start)}</td>

                      {/* 2. Lesson Name */}
                      <td style={{fontWeight: "500"}}>{lesson}</td>


                      {/* Time Taken */}
                      <td>
                          <span style={{color: "#2c3e50", fontWeight: "bold"}}>
                              {calculateTimeTaken(start, end, limit)}
                          </span>
                          <span style={{color: "#7f8c8d", fontSize: "0.85rem", marginLeft: "5px"}}>
                              / {limit}m
                          </span>
                      </td>
                      
                      {/* 4. Score (Green/Red) */}
                      <td style={{ 
                          fontWeight: "bold", 
                          color: score >= 50 ? "#27ae60" : "#c0392b",
                          fontSize: "1.1rem"
                      }}>
                        {score ?? "-"}
                      </td>
                      
                      {/* 5. Action Button */}
                      <td>
                        <button 
                          onClick={() => navigate(`/exam-review/${id}`)}
                          style={styles.detailBtn}
                        >
                          Results 👁️
                        </button>
                      </td>
                    </tr>
                  );
              })}
            </tbody>
          </table>
        )}

        <button onClick={() => navigate("/student-dashboard")} style={styles.backBtn}>Back to Dashboard</button>
      </div>
  );
};

const styles = {
  container: { maxWidth: "900px", margin: "2rem auto", padding: "1rem", textAlign: "center" },
  table: { width: "100%", borderCollapse: "collapse", marginTop: "1rem", boxShadow: "0 2px 5px rgba(0,0,0,0.1)" },
  headerRow: { backgroundColor: "#2c3e50", color: "white" },
  row: { borderBottom: "1px solid #ddd" },
  backBtn: { marginTop: "2rem", padding: "0.8rem 1.5rem", cursor: "pointer", backgroundColor: "#34495e", color: "white", border: "none", borderRadius: "4px" },
  linkBtn: { color: "#2980b9", textDecoration: "underline", background: "none", border: "none", cursor: "pointer", fontSize: "1rem" },
  emptyState: { marginTop: "2rem", color: "#7f8c8d" },
  detailBtn: { padding: "5px 10px", backgroundColor: "#3498db", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }
};

export default MyHistory;