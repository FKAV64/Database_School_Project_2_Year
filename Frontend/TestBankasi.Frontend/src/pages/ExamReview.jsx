import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/api";

const ExamReview = () => {
  const { oturumId } = useParams(); // Grabs the ID from the URL
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReview = async () => {
      try {
        // Ensure Port 5143 (HTTP)
        const response = await api.get(`Exam/review-details/${oturumId}`);
        setQuestions(response.data);
      } catch (err) {
        console.error(err);
        alert("Failed to load review.");
        navigate("/my-history");
      } finally {
        setLoading(false);
      }
    };
    fetchReview();
  }, [oturumId, navigate]);

  if (loading) return <div style={{textAlign:"center", marginTop:"2rem"}}>Loading Review...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Exam Result Details</h2>
        <button onClick={() => navigate("/my-history")} style={styles.backBtn}>Back to History</button>
      </div>

      {questions.map((q, index) => {
        // --- THE TRAFFIC LIGHT LOGIC ---
        // 1. Find what the user picked (if any)
        const userSelection = q.secenekler.find(o => o.verilenCevap);
        // 2. Was that selection correct?
        const isCorrect = userSelection && userSelection.dogruMu;
        
        // 3. Determine Card Border Color
        let borderColor = "#f1c40f"; // Default: Yellow (Unanswered)
        if (userSelection) {
            borderColor = isCorrect ? "#27ae60" : "#c0392b"; // Green (Correct) vs Red (Wrong)
        }

        return (
            <div key={q.soruID} style={{ ...styles.card, borderLeft: `6px solid ${borderColor}` }}>
                
                {/* HEADER ROW: Question Number + Tags */}
                <div style={styles.questionHeader}>
                    <h4>Q{index + 1}.</h4>
                    
                    {/* NEW: Context Tags */}
                    <div style={styles.tagContainer}>
                        <span style={styles.tagTopic}>{q.konuAdi || q.KonuAdi}</span>
                        
                        <span style={{
                            ...styles.tagDifficulty,
                            // Color code difficulty: Easy=Green, Medium=Orange, Hard=Red
                            backgroundColor: (q.zorlukAdi === "Zor" || q.ZorlukAdi === "Zor") ? "#e74c3c" : 
                                            (q.zorlukAdi === "Orta" || q.ZorlukAdi === "Orta") ? "#f39c12" : "#27ae60"
                        }}>
                            {q.zorlukAdi || q.ZorlukAdi}
                        </span>
                    </div>
                </div>

                {/* Question Text */}
                <p style={styles.questionText}>{q.soruMetin}</p>
                {/* --- ERROR WAS HERE: NOW FIXED --- */}
            <div style={styles.grid}>
              {q.secenekler.map(opt => {
                // OPTION COLOR LOGIC
                let bgColor = "white"; 
                let textColor = "black";
                let fontWeight = "normal";

                if (opt.isCorrect) {
                    bgColor = "#d4edda"; // Light Green
                    textColor = "#155724";
                    fontWeight = "bold";
                } else if (opt.isSelected) {
                    bgColor = "#f8d7da"; // Light Red
                    textColor = "#721c24";
                }

                return (
                  <div key={opt.secenekID} style={{ ...styles.option, backgroundColor: bgColor, color: textColor, fontWeight }}>
                    {opt.secenekMetin}
                    
                    {/* Visual Markers */}
                    {opt.verilenCevap && <span style={{marginLeft:"10px"}}>📍 (You)</span>}
                    {opt.dogruMu && <span style={{marginLeft:"10px"}}>✅</span>}
                  </div>
                );
              })}
            </div>
            
            {/* Status Footer */}
            <div style={{marginTop: "1rem", fontWeight: "bold", color: borderColor}}>
                Result: {!userSelection ? "Unanswered (Yellow)" : isCorrect ? "Correct (Green)" : "Wrong (Red)"}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const styles = {
  container: { maxWidth: "800px", margin: "2rem auto", padding: "1rem" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" },
  card: { padding: "1.5rem", border: "1px solid #ddd", borderRadius: "8px", marginBottom: "1.5rem", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" },
  grid: { display: "flex", flexDirection: "column", gap: "0.5rem" },
  option: { padding: "0.8rem", borderRadius: "6px", border: "1px solid #eee" },
  backBtn: { padding: "0.5rem 1rem", cursor: "pointer", backgroundColor: "#34495e", color: "white", border: "none", borderRadius: "4px" },

  questionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.5rem",
    borderBottom: "1px solid #eee",
    paddingBottom: "0.5rem"
  },
  questionText: {
    fontSize: "1.1rem",
    marginBottom: "1rem"
  },
  tagContainer: {
    display: "flex",
    gap: "0.5rem"
  },
  tagTopic: {
    backgroundColor: "#ecf0f1",
    color: "#2c3e50",
    padding: "2px 8px",
    borderRadius: "4px",
    fontSize: "0.85rem",
    fontWeight: "bold"
  },
  tagDifficulty: {
    color: "white",
    padding: "2px 8px",
    borderRadius: "4px",
    fontSize: "0.85rem",
    fontWeight: "bold"
  }
};

export default ExamReview;