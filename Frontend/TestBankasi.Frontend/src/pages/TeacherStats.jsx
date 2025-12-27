import { useState, useEffect } from "react";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";

const TeacherStats = () => {
  const navigate = useNavigate();
  
  // --- STATE ---
  const [activeTab, setActiveTab] = useState("TOPICS"); // TOPICS, SCORES, STUDENTS
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter State
  const [lessons, setLessons] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(""); // "" means All Lessons

  // --- 1. INITIAL LOAD: GET LESSONS ---
  useEffect(() => {
      const fetchLessons = async () => {
          try {
              const response = await api.get("/Exam/lessons");
              setLessons(response.data);
          } catch (err) {
              console.error("Lesson fetch error:", err);
          }
      };
      fetchLessons();
  }, []);

  // --- 2. FETCH STATS (Depends on Tab AND Lesson) ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setData([]); 
      
      try {
        
        let baseUrl = "/Stats/dashboard";
        let endpoint = "";

        if (activeTab === "TOPICS") endpoint = "/preferred-topics";
        else if (activeTab === "SCORES") endpoint = "/high-scores";
        else if (activeTab === "STUDENTS") endpoint = "/top-students";

        // Append Query String for Filter
        // If selectedLesson is "5", url becomes "...?dersId=5"
        // If selectedLesson is "", url becomes "...?dersId=" (API handles null)
        const url = `${baseUrl}${endpoint}?dersId=${selectedLesson}`;

        const response = await api.get(url);
        setData(response.data);

      } catch (err) {
        console.error("Stats Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab, selectedLesson]); // <--- Re-run when Lesson OR Tab changes

  // --- RENDER HELPERS ---
  const renderTable = () => {
      if (loading) return <p style={{marginTop:"2rem"}}>Loading data...</p>;
      if (data.length === 0) return <p style={{marginTop:"2rem", color:"#7f8c8d"}}>No records found for this selection.</p>;

      return (
        <table style={styles.table}>
            <thead style={styles.thead}>
                <tr>
                    {activeTab === "TOPICS" && <><th>Topic Name</th><th>Times Taken</th></>}
                    {activeTab === "SCORES" && <><th>Topic Name</th><th>Avg Success Rate %</th></>}
                    {activeTab === "STUDENTS" && <><th style={{width:"80px"}}>ID</th><th>Student Name</th><th>Lesson</th><th>Avg Score %</th></>}
                </tr>
            </thead>
            <tbody>
                {data.map((row, index) => (
                    <tr key={index} style={styles.tr}>
                        {activeTab === "TOPICS" && (
                            <>
                                <td>{row.konuAdi}</td>
                                <td>{row.yapilanSayisi}</td>
                            </>
                        )}
                        {activeTab === "SCORES" && (
                            <>
                                <td>{row.konuAdi}</td>
                                <td style={{color: row.basariOrani > 70 ? "#27ae60" : "#c0392b", fontWeight:"bold"}}>
                                    {row.basariOrani}
                                </td>
                            </>
                        )}
                        {activeTab === "STUDENTS" && (
                            <>
                                <td>{row.kullaniciID}</td>
                                <td>{row.ogrenciIsim}</td>
                                {/* LOGIC: If row.dersAdi is null/empty, use "General" */}
                                <td style={{fontStyle: !row.dersAdi ? 'italic' : 'normal'}}>
                                    {row.dersAdi || "General (GPA)"}
                                </td>
                                <td style={{fontWeight:"bold"}}>{row.basariOrani}</td>
                            </>
                        )}
                    </tr>
                ))}
            </tbody>
        </table>
      );
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
          <h2>Class Statistics 📊</h2>
          <button onClick={() => navigate("/teacher-dashboard")} style={styles.backBtn}>Back</button>
      </div>

      {/* --- FILTER BAR --- */}
      <div style={styles.filterBar}>
          <label style={{fontWeight:"bold"}}>Filter by Lesson: </label>
          <select 
            value={selectedLesson} 
            onChange={(e) => setSelectedLesson(e.target.value)}
            style={styles.select}
          >
              <option value="">-- All Lessons (Mixed) --</option>
              {lessons.map(l => (
                  <option key={l.dersID} value={l.dersID}>{l.dersAdi}</option>
              ))}
          </select>
      </div>

      {/* --- TABS --- */}
      <div style={styles.tabs}>
          <button 
            style={activeTab === "TOPICS" ? styles.activeTab : styles.tab} 
            onClick={() => setActiveTab("TOPICS")}
          >
            Most Popular Topics
          </button>
          <button 
            style={activeTab === "SCORES" ? styles.activeTab : styles.tab} 
            onClick={() => setActiveTab("SCORES")}
          >
            Highest Scoring Topics
          </button>
          <button 
            style={activeTab === "STUDENTS" ? styles.activeTab : styles.tab} 
            onClick={() => setActiveTab("STUDENTS")}
          >
            Top Students
          </button>
      </div>

      {/* --- CONTENT --- */}
      <div style={styles.content}>
          {renderTable()}
      </div>
    </div>
  );
};

const styles = {
  container: { padding: "2rem", maxWidth: "1000px", margin: "0 auto", textAlign: "center" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" },
  backBtn: { padding: "8px 16px", background: "#34495e", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" },
  
  filterBar: { marginBottom: "2rem", background: "#f8f9fa", padding: "1rem", borderRadius: "8px", border: "1px solid #eee" },
  select: { marginLeft: "10px", padding: "8px", borderRadius: "4px", border: "1px solid #ccc", minWidth: "200px" },

  tabs: { display: "flex", justifyContent: "center", gap: "10px", marginBottom: "0" }, // marginBottom 0 so tabs sit on content
  tab: { padding: "12px 20px", background: "#ecf0f1", border: "1px solid #ddd", borderBottom: "none", borderRadius: "8px 8px 0 0", cursor: "pointer", color: "#7f8c8d" },
  activeTab: { padding: "12px 20px", background: "white", color: "#2c3e50", border: "1px solid #ddd", borderBottom: "1px solid white", borderRadius: "8px 8px 0 0", cursor: "pointer", fontWeight: "bold", position: "relative", top: "1px" },
  
  content: { border: "1px solid #ddd", padding: "2rem", borderRadius: "0 8px 8px 8px", background: "white", minHeight: "300px", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" },
  table: { width: "100%", borderCollapse: "collapse", marginTop: "10px" },
  thead: { background: "#2c3e50", color: "white" },
  tr: { borderBottom: "1px solid #eee", height: "45px" }
};

export default TeacherStats;