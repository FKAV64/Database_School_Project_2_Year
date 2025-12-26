import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const QuestionBank = () => {
  const navigate = useNavigate();

  // --- STATE ---
  const [lessons, setLessons] = useState([]);
  const [topics, setTopics] = useState([]);
  const [questions, setQuestions] = useState([]);

  // Filters
  const [selectedLesson, setSelectedLesson] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");

  // UI State
  const [loading, setLoading] = useState(false);

  // --- 1. INITIAL LOAD (Get Lessons) ---
  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const token = localStorage.getItem("token");
        // Reuse the endpoint we made for students (it works for teachers too!)
        const response = await axios.get("https://localhost:7125/api/exam/lessons", {
            headers: { Authorization: `Bearer ${token}` }
        });
        setLessons(response.data);
      } catch (err) {
        console.error("Lesson fetch error:", err);
        alert("Could not load lessons.");
      }
    };
    fetchLessons();
  }, []);

  // --- 2. HANDLE LESSON CHANGE ---
  const handleLessonChange = async (e) => {
      const lessonId = e.target.value;
      setSelectedLesson(lessonId);
      setSelectedTopic(""); // Reset topic
      setQuestions([]);     // Clear grid until loaded

      if (!lessonId) return;

      setLoading(true);
      try {
          const token = localStorage.getItem("token");
          
          // A. Fetch Topics for this Lesson
          const topicRes = await axios.get(`https://localhost:7125/api/exam/topics/${lessonId}`, {
              headers: { Authorization: `Bearer ${token}` }
          });
          setTopics(topicRes.data);

          // B. Fetch All Questions for this Lesson (Default view)
          fetchQuestions(lessonId, null);

      } catch (err) {
          console.error(err);
      } finally {
          setLoading(false);
      }
  };

  // --- 3. HANDLE TOPIC CHANGE ---
  const handleTopicChange = (e) => {
      const topicId = e.target.value;
      setSelectedTopic(topicId);
      
      if (selectedLesson) {
          // Fetch questions filtered by BOTH Lesson and Topic
          // If topicId is "", pass null
          fetchQuestions(selectedLesson, topicId || null);
      }
  };

  // --- HELPER: Fetch Questions (Reusable) ---
  const fetchQuestions = async (lessonId, topicId) => {
      setLoading(true);
      try {
          const token = localStorage.getItem("token");
          
          // Build Query String: ?dersId=1&konuId=5
          let url = `https://localhost:7125/api/question/list?dersId=${lessonId}`;
          if (topicId) url += `&konuId=${topicId}`;

          const response = await axios.get(url, {
              headers: { Authorization: `Bearer ${token}` }
          });
          setQuestions(response.data);
      } catch (err) {
          console.error("Grid load error:", err);
      } finally {
          setLoading(false);
      }
  };

  // --- DELETE LOGIC ---
  const handleDelete = async (id) => {
      if(!window.confirm("Delete this question?")) return;
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`https://localhost:7125/api/question/delete/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        // Optimistic UI Update (Remove from list without reload)
        setQuestions(prev => prev.map(q => q.soruID === id ? {...q, silinmeTarihi: new Date()} : q));
      } catch (err) {
          alert("Delete failed.");
      }
  };

  const handleRestore = async (id) => {
      try {
        const token = localStorage.getItem("token");
        await axios.patch(`https://localhost:7125/api/question/restore/${id}`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setQuestions(prev => prev.map(q => q.soruID === id ? {...q, silinmeTarihi: null} : q));
      } catch (err) {
          alert("Restore failed.");
      }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"2rem"}}>
          <h2>Manage Questions</h2>
          <button 
            style={btnStyle} 
            onClick={() => navigate("/edit-question/new")}
          >
            + Create New Question
          </button>
      </div>

      {/* --- FILTER BAR --- */}
      <div style={filterBarStyle}>
          <div style={{flex: 1}}>
              <label>Filter by Lesson:</label>
              <select value={selectedLesson} onChange={handleLessonChange} style={inputStyle}>
                  <option value="">-- Select Lesson --</option>
                  {lessons.map(l => (
                      <option key={l.dersID} value={l.dersID}>{l.dersAdi}</option>
                  ))}
              </select>
          </div>

          <div style={{flex: 1}}>
              <label>Filter by Topic:</label>
              <select 
                value={selectedTopic} 
                onChange={handleTopicChange} 
                style={inputStyle}
                disabled={!selectedLesson} // Disable if no lesson picked
              >
                  <option value="">-- All Topics --</option>
                  {topics.map(t => (
                      <option key={t.konuID} value={t.konuID}>{t.konuAdi}</option>
                  ))}
              </select>
          </div>
      </div>

      {/* --- DATA GRID --- */}
      {loading ? <p>Loading data...</p> : (
          questions.length === 0 ? <p style={{color:"#7f8c8d", marginTop:"2rem"}}>No questions found. Select a lesson to begin.</p> :
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <thead>
                <tr style={{ background: "#2c3e50", color: "white", textAlign:"left" }}>
                    <th style={{padding:"10px"}}>ID</th>
                    <th style={{padding:"10px"}}>Topic</th>
                    <th style={{padding:"10px"}}>Question Text</th>
                    <th style={{padding:"10px"}}>Difficulty</th>
                    <th style={{padding:"10px"}}>Status</th>
                    <th style={{padding:"10px"}}>Actions</th>
                </tr>
            </thead>
            <tbody>
                {questions.map(q => (
                    <tr key={q.soruID} style={{ borderBottom: "1px solid #ddd", background: q.silinmeTarihi ? "#ffebee" : "white" }}>
                        <td style={{padding:"10px"}}>{q.soruID}</td>
                        <td style={{padding:"10px"}}>{q.konuAdi}</td>
                        <td style={{padding:"10px"}}>{q.soruMetin.length > 60 ? q.soruMetin.substring(0, 60) + "..." : q.soruMetin}</td>
                        <td style={{padding:"10px"}}>
                            <span style={{
                                padding: "4px 8px", borderRadius: "4px", fontSize: "0.85rem", color: "white",
                                backgroundColor: q.zorlukAdi === "Zor" ? "#e74c3c" : q.zorlukAdi === "Orta" ? "#f39c12" : "#27ae60"
                            }}>
                                {q.zorlukAdi}
                            </span>
                        </td>
                        <td style={{padding:"10px", color: q.silinmeTarihi ? "red" : "green"}}>
                            {q.silinmeTarihi ? "Deleted" : "Active"}
                        </td>
                        <td style={{padding:"10px"}}>
                            <button onClick={() => navigate(`/edit-question/${q.soruID}`)} style={actionBtn}>✏️ Edit</button>
                            {q.silinmeTarihi ? (
                                <button onClick={() => handleRestore(q.soruID)} style={{...actionBtn, color: "green"}}>♻️ Restore</button>
                            ) : (
                                <button onClick={() => handleDelete(q.soruID)} style={{...actionBtn, color: "#c0392b"}}>🗑️ Delete</button>
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
          </table>
      )}
    </div>
  );
};

// Styles
const btnStyle = { padding: "10px 20px", background: "#27ae60", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight:"bold" };
const filterBarStyle = { display: "flex", gap: "20px", background: "#f8f9fa", padding: "1.5rem", borderRadius: "8px", border: "1px solid #eee" };
const inputStyle = { width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc", marginTop:"5px" };
const actionBtn = { background: "none", border: "none", cursor: "pointer", marginRight: "10px", fontSize: "0.9rem", fontWeight: "bold", color: "#34495e" };

export default QuestionBank;