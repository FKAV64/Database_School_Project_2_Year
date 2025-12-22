import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const ExamResult = () => {
  const { oturumId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const token = localStorage.getItem("token");
        // CALL THE NEW ENDPOINT
        const response = await axios.get(`http://localhost:5143/api/Exam/result-summary/${oturumId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setResult(response.data);
      } catch (err) {
        console.error(err);
        alert("Error loading result.");
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [oturumId, navigate]);

  if (loading) return <div style={{textAlign:"center", marginTop:"2rem"}}>Calculating Score...</div>;
  if (!result) return null;

  // We check for 'puan' (lowercase) OR 'Puan' (uppercase)
  // 1. Inspect the raw data in console to be sure
  console.log("RAW DATA:", result);

  // 2. Dual-Check for Properties (Handles "puan" AND "Puan")
  const score = result.puan !== undefined ? result.puan : (result.Puan !== undefined ? result.Puan : 0);
  
  // 3. Lesson Name Check
  const dersAdi = result.dersAdi || result.DersAdi || "Unknown Lesson";
  
  // 4. Time Check
  const baslaZaman = result.baslaZaman || result.BaslaZaman;
  const bitirZaman = result.bitirZaman || result.BitirZaman;
  const sureDakika = result.sureDakika || result.SureDakika;
  
  const isPass = score >= 50;

  // Calculate Time Taken
  let timeDisplay = "-";
  if (baslaZaman && bitirZaman) {
      const s = new Date(baslaZaman);
      const e = new Date(bitirZaman);
      let diff = e - s;
      
      // Visual Clamp (Don't show time > limit)
      if (sureDakika && diff > sureDakika * 60000) diff = sureDakika * 60000;
      if (diff < 0) diff = 0;

      const m = Math.floor(diff / 60000);
      const sec = Math.floor((diff % 60000) / 1000);
      timeDisplay = `${m}m ${sec}s`;
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>Exam Finished!</h2>
        <p style={styles.lesson}>{dersAdi}</p>
        
        {/* SCORE BUBBLE */}
        <div style={{...styles.scoreCircle, borderColor: isPass ? "#27ae60" : "#e74c3c"}}>
            <span style={styles.scoreText}>{score}</span>
            <span style={styles.totalText}>/ 100</span>
        </div>

        {/* STATS GRID */}
        <div style={styles.statsRow}>
            <div style={styles.stat}>
                <span>Time Taken:</span>
                <strong>{timeDisplay}</strong>
            </div>
            <div style={styles.stat}>
                <span>Status:</span>
                <strong style={{color: isPass ? "#27ae60" : "#e74c3c"}}>
                    {isPass ? "PASSED" : "FAILED"}
                </strong>
            </div>
        </div>

        {/* ACTIONS */}
        <div style={styles.buttonGroup}>
            <button 
                onClick={() => navigate(`/exam-review/${oturumId}`)} 
                style={styles.reviewBtn}
            >
                See Detail Results
            </button>
            
            <button 
                onClick={() => navigate("/dashboard")} 
                style={styles.homeBtn}
            >
                Back to Dashboard
            </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { display: "flex", justifyContent: "center", padding: "2rem" },
  card: { width: "400px", padding: "2rem", textAlign: "center", border: "1px solid #ddd", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" },
  lesson: { fontSize: "1.2rem", color: "#7f8c8d", marginBottom: "1.5rem" },
  scoreCircle: { width: "120px", height: "120px", borderRadius: "50%", border: "5px solid", margin: "0 auto 2rem auto", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" },
  scoreText: { fontSize: "2.5rem", fontWeight: "bold", color: "#2c3e50" },
  totalText: { fontSize: "0.9rem", color: "#95a5a6" },
  statsRow: { display: "flex", justifyContent: "space-around", marginBottom: "2rem" },
  stat: { display: "flex", flexDirection: "column", gap: "5px" },
  buttonGroup: { display: "flex", flexDirection: "column", gap: "1rem" },
  reviewBtn: { padding: "1rem", backgroundColor: "#3498db", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "1rem" },
  homeBtn: { padding: "1rem", backgroundColor: "transparent", color: "#7f8c8d", border: "1px solid #bdc3c7", borderRadius: "6px", cursor: "pointer" }
};

export default ExamResult;