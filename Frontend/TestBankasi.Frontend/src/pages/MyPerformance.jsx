import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const MyPerformance = () => {
  const [rawData, setRawData] = useState([]);
  const [viewMode, setViewMode] = useState("LESSON"); // Options: LESSON, SUBJECT, FULL
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 1. FETCH THE MASTER LIST (Run Once)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        // Ensure this matches your actual endpoint URL
        const response = await axios.get("http://localhost:5143/api/stats/my-performance", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRawData(response.data);
      } catch (err) {
        console.error("Fetch error:", err);
        alert("Could not load performance data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 2. THE HELPER FUNCTION: "Slice and Dice"
  const getAggregatedData = () => {
    if (viewMode === "FULL") return rawData; // No math needed for full detail

    const groups = {};

    rawData.forEach(item => {
      // Create a unique Key based on the View Mode
      let key = item.dersAdi || item.DersAdi; // Default to Lesson
      
      if (viewMode === "SUBJECT") {
        const subject = item.konuAdi || item.KonuAdi;
        key = `${key} > ${subject}`;
      }

      // Initialize group if not exists
      if (!groups[key]) {
        groups[key] = {
          label: key,
          total: 0,
          correct: 0,
          // Keep raw names for display
          lesson: item.dersAdi || item.DersAdi,
          subject: item.konuAdi || item.KonuAdi
        };
      }

      // SUM THE COUNTS (The Secret Sauce)
      // Check casing: backend might send PascalCase (ToplamSoru) or camelCase (toplamSoru)
      const total = item.toplamSoru !== undefined ? item.toplamSoru : (item.ToplamSoru || 0);
      const correct = item.dogruSayisi !== undefined ? item.dogruSayisi : (item.DogruSayisi || 0);

      groups[key].total += total;
      groups[key].correct += correct;
    });

    // Convert Object back to Array for the table
    return Object.values(groups).map(g => ({
        ...g,
        percentage: g.total === 0 ? 0 : Math.round((g.correct / g.total) * 100)
    }));
  };

  const displayData = getAggregatedData();

  if (loading) return <div style={{textAlign: "center", marginTop: "2rem"}}>Loading Stats...</div>;

  return (
    <div style={styles.container}>
      <h2>My Performance 📊</h2>

      {/* 3. TOGGLE BUTTONS */}
      <div style={styles.tabContainer}>
        <button 
            style={viewMode === "LESSON" ? styles.activeTab : styles.tab} 
            onClick={() => setViewMode("LESSON")}
        >
            By Lesson
        </button>
        <button 
            style={viewMode === "SUBJECT" ? styles.activeTab : styles.tab} 
            onClick={() => setViewMode("SUBJECT")}
        >
            By Subject
        </button>
        <button 
            style={viewMode === "FULL" ? styles.activeTab : styles.tab} 
            onClick={() => setViewMode("FULL")}
        >
            Full Detail (Difficulty)
        </button>
      </div>

      {/* 4. DATA TABLE */}
      {displayData.length === 0 ? (
        <p>No performance data found. Take some exams first!</p>
      ) : (
        <table style={styles.table}>
            <thead>
                <tr style={styles.headerRow}>
                    <th style={{textAlign:"left"}}>Category</th>
                    {viewMode === "FULL" && <th>Difficulty</th>}
                    <th>Success Rate</th>
                    <th>Correct / Total</th>
                </tr>
            </thead>
            <tbody>
                {displayData.map((row, index) => {
                    // Logic for Full View vs Aggregated View
                    let label = row.label;
                    let diff = null;
                    let pct = row.percentage;
                    let correct = row.correct;
                    let total = row.total;

                    // If FULL mode, properties are direct
                    if (viewMode === "FULL") {
                        label = `${row.dersAdi || row.DersAdi} > ${row.konuAdi || row.KonuAdi}`;
                        diff = row.zorlukAdi || row.ZorlukAdi;
                        
                        const t = row.toplamSoru !== undefined ? row.toplamSoru : row.ToplamSoru;
                        const c = row.dogruSayisi !== undefined ? row.dogruSayisi : row.DogruSayisi;
                        
                        total = t;
                        correct = c;
                        pct = t === 0 ? 0 : Math.round((c / t) * 100);
                    }

                    // Dynamic Color for Progress Bar
                    let color = "#e74c3c"; // Red
                    if (pct >= 50) color = "#f1c40f"; // Yellow
                    if (pct >= 75) color = "#27ae60"; // Green

                    return (
                        <tr key={index} style={styles.row}>
                            <td style={{fontWeight: "500", textAlign:"left"}}>{label}</td>
                            
                            {viewMode === "FULL" && <td>{diff}</td>}
                            
                            {/* Progress Bar Column */}
                            <td style={{width: "40%"}}>
                                <div style={styles.progressContainer}>
                                    <div style={{...styles.progressBar, width: `${pct}%`, backgroundColor: color}}></div>
                                </div>
                                <span style={{fontSize: "0.85rem", marginLeft: "10px"}}>{pct}%</span>
                            </td>

                            <td>{correct} / {total}</td>
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
  container: { maxWidth: "800px", margin: "2rem auto", padding: "1rem", textAlign: "center" },
  tabContainer: { display: "flex", justifyContent: "center", gap: "10px", marginBottom: "2rem" },
  tab: { padding: "10px 20px", border: "1px solid #ddd", background: "#f9f9f9", cursor: "pointer", borderRadius: "5px" },
  activeTab: { padding: "10px 20px", border: "1px solid #3498db", background: "#3498db", color: "white", cursor: "pointer", borderRadius: "5px" },
  table: { width: "100%", borderCollapse: "collapse", boxShadow: "0 2px 5px rgba(0,0,0,0.1)" },
  headerRow: { backgroundColor: "#2c3e50", color: "white", padding: "10px" },
  row: { borderBottom: "1px solid #eee", height: "50px" },
  backBtn: { marginTop: "2rem", padding: "10px 20px", background: "transparent", border: "1px solid #aaa", borderRadius: "5px", cursor: "pointer" },
  progressContainer: { width: "70%", height: "10px", backgroundColor: "#ecf0f1", borderRadius: "5px", display: "inline-block", verticalAlign: "middle" },
  progressBar: { height: "100%", borderRadius: "5px", transition: "width 0.3s ease" }
};

export default MyPerformance;