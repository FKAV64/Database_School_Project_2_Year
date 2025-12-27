// src/pages/StartExam.jsx
import { useState, useEffect } from "react";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";

const StartExam = () => {
  const navigate = useNavigate();

  // 1. DATA STATE (The Lists)
  const [lessons, setLessons] = useState([]);
  const [topics, setTopics] = useState([]);

  // 2. FORM STATE (The User's Choices)
  const [selectedLesson, setSelectedLesson] = useState("");
  const [selectedTopics, setSelectedTopics] = useState([]); // Array for multi-select
  const [difficulty, setDifficulty] = useState(""); // "" means Mixed/Null
  const [questionCount, setQuestionCount] = useState(10);
  const [duration, setDuration] = useState("");

  // 3. LOAD LESSONS ON STARTUP
  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const response = await api.get("/Exam/lessons");
        setLessons(response.data);
      } catch (err) {
        console.error("Failed to load lessons:", err);
        alert("Error loading lessons. Make sure you are logged in.");
      }
    };
    fetchLessons();
  }, []);

  // 4. LOAD TOPICS WHEN LESSON CHANGES
  const handleLessonChange = async (e) => {
    const lessonId = e.target.value;
    setSelectedLesson(lessonId);
    setSelectedTopics([]); // Reset topics when lesson changes

    if (!lessonId) {
        setTopics([]);
        return;
    }

    try {
      const response = await api.get(`/Exam/topics/${lessonId}`);
      setTopics(response.data);
    } catch (err) {
      console.error("Failed to load topics:", err);
    }
  };

  // 5. HANDLE TOPIC SELECTION (Multi-Select Checkboxes)
  const handleTopicToggle = (topicId) => {
    // If already selected, remove it. If not, add it.
    if (selectedTopics.includes(topicId.toString())) {
      setSelectedTopics(selectedTopics.filter(id => id !== topicId.toString()));
    } else {
      setSelectedTopics([...selectedTopics, topicId.toString()]);
    }
  };

  // 6. START THE EXAM (The Launch)
  const handleStart = async (e) => {
    e.preventDefault();
    
    if (!selectedLesson) {
        alert("Please select a lesson.");
        return;
    }
    if (!duration || parseInt(duration) <= 0) {
      alert("Please enter a valid exam duration (in minutes).");
      return;
  }

    const payload = {
      DersID: parseInt(selectedLesson),
      SoruSayisi: parseInt(questionCount),
      SureDakika: parseInt(duration),
      // If list is empty, send null (Server will treat as "All Topics")
      Konular: selectedTopics.length > 0 ? selectedTopics : null,
      // If empty string, send null (Server will treat as "Mixed Difficulty")
      ZorlukID: difficulty ? parseInt(difficulty) : null
    };

    try {
      const response = await api.post("/Exam/start", payload);

      // The API returns the list of questions immediately? 
      // OR does it return the Session ID? 
      // CHECK YOUR CONTROLLER: It returns "Ok(examQuestions)".
      // This means we have the questions NOW. We need to send them to the Exam Page.
      
      // We navigate to the Exam Page and pass the questions in the "state" packet
      
     navigate("/exam-room", { 
      state: { 
        examData: response.data, 
        duration: parseInt(duration) // Pass the duration separately
      } 
      });

    } catch (err) {
      console.error("Start Failed:", err);
      alert("Could not start exam. Check console.");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>Configure Your Exam</h2>
        <form onSubmit={handleStart}>
          
          {/* LESSON SELECT */}
          <div style={styles.group}>
            <label>Select Lesson:</label>
            <select value={selectedLesson} onChange={handleLessonChange} style={styles.input} required>
              <option value="">-- Choose Lesson --</option>
              {lessons.map(l => (
                <option key={l.dersID} value={l.dersID}>{l.dersAdi}</option>
              ))}
            </select>
          </div>

          {/* TOPIC SELECT (Conditional) */}
          {topics.length > 0 && (
            <div style={styles.group}>
              <label>Select Topics (Optional - Leave empty for All):</label>
              <div style={styles.checkboxContainer}>
                {topics.map(t => (
                  <div key={t.konuID} style={styles.checkboxItem}>
                    <input 
                      type="checkbox" 
                      value={t.konuID}
                      checked={selectedTopics.includes(t.konuID.toString())}
                      onChange={() => handleTopicToggle(t.konuID)}
                    />
                    <span>{t.konuAdi}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SETTINGS ROW */}
          <div style={styles.row}>
             <div style={styles.group}>
               <label>Difficulty:</label>
               <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} style={styles.input}>
                 <option value="">Mixed (Random)</option>
                 <option value="1">Easy</option>
                 <option value="2">Medium</option>
                 <option value="3">Hard</option>
               </select>
             </div>
             
             <div style={styles.group}>
               <label>Questions:</label>
               <input type="number" min="1" max="50" value={questionCount} onChange={(e) => setQuestionCount(e.target.value)} style={styles.input} />
             </div>

             <div style={styles.group}>
               <label>Minutes:</label>
               <input type="number" min="1" max="120" value={duration} onChange={(e) => setDuration(e.target.value)} style={styles.input} />
             </div>
          </div>

          <button type="submit" style={styles.button}>Start Exam</button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: { display: "flex", justifyContent: "center", padding: "2rem" },
  card: { width: "500px", padding: "2rem", border: "1px solid #ccc", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)" },
  group: { marginBottom: "1.5rem", textAlign: "left" },
  input: { width: "100%", padding: "0.5rem", marginTop: "0.5rem" },
  row: { display: "flex", gap: "1rem" },
  button: { width: "100%", padding: "1rem", backgroundColor: "#27ae60", color: "white", border: "none", borderRadius: "4px", fontSize: "1.1rem", cursor: "pointer" },
  checkboxContainer: { maxHeight: "150px", overflowY: "auto", border: "1px solid #eee", padding: "0.5rem" },
  checkboxItem: { display: "flex", gap: "0.5rem", padding: "0.2rem" }
};

export default StartExam;