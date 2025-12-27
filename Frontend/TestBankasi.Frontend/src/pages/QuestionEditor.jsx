import { useState, useEffect } from "react";
import api from "../utils/api";
import { useParams, useNavigate } from "react-router-dom";

const QuestionEditor = () => {
  const { id } = useParams(); // Gets the ID from URL (e.g., "105" or "new")
  const navigate = useNavigate();
  
  // Logic: If ID is "new", we are creating. Otherwise, we are editing.
  const isEditing = id !== "new";

  // --- STATE ---
  const [lessons, setLessons] = useState([]);
  const [topics, setTopics] = useState([]);
  const [difficulties, setDifficulties] = useState([]);

  // Form Fields
  const [lessonId, setLessonId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [difficultyId, setDifficultyId] = useState("");
  const [questionText, setQuestionText] = useState("");
  
  // Options State (Initialized with 4 empty placeholders)
  const [options, setOptions] = useState([
      { secenekMetin: "", dogruMu: false },
      { secenekMetin: "", dogruMu: false },
      { secenekMetin: "", dogruMu: false },
      { secenekMetin: "", dogruMu: false }
  ]);

  // --- 1. INITIAL LOAD (The "Orchestrator") ---
  useEffect(() => {
    const initPage = async () => {
        try {
            // A. Fetch Static Dictionaries (Lessons & Difficulties)
            // Promise.all runs both requests at the same time (Faster!)
            const [lessRes, diffRes] = await Promise.all([
                api.get("/exam/lessons"),
                api.get("/question/difficultyLevels")
            ]);

            setLessons(lessRes.data);
            setDifficulties(diffRes.data);

            // B. IF EDITING: Fetch the Question & Sync Logic
            if (isEditing) {
                const qRes = await api.get(`/question/${id}`);
                const q = qRes.data;

                // 1. Fill basic fields
                setLessonId(q.dersID);
                setDifficultyId(q.zorlukID);
                setQuestionText(q.soruMetin);
                
                // 2. Load the options (ensure we handle cases with < 4 options gracefully)
                // We overwrite our default empty options with the real ones
                if (q.secenekler && q.secenekler.length > 0) {
                    setOptions(q.secenekler);
                }

                // 3. THE CRITICAL SYNC: Load Topics manually
                // We cannot wait for a "change event". We must fetch topics NOW so we can set the Topic ID.
                await fetchTopics(q.dersID, token);
                
                // 4. Now that topics are loaded, select the correct topic
                setTopicId(q.konuID); 
            }

        } catch (err) {
            console.error("Initialization Error:", err);
            alert("Error loading page data.");
            navigate("/manage-questions");
        }
    };

    initPage();
  }, [id, isEditing, navigate]);

  // --- 2. HELPER: Fetch Topics ---
  const fetchTopics = async (dersId, tokenArg) => {
      if(!dersId) { setTopics([]); return; }
      try {
          const response = await api.get(`/exam/topics/${dersId}`);
          setTopics(response.data);
      } catch (err) { console.error(err); }
  };

  // --- 3. HANDLERS ---
  
  // User changes Lesson -> We must reload Topics and clear current Topic
  const handleLessonChange = (e) => {
      const val = e.target.value;
      setLessonId(val);
      setTopicId(""); // Reset topic because it belongs to the old lesson
      fetchTopics(val);
  };

  // User types in an Option box
  const handleOptionChange = (index, text) => {
      // 1. Make a copy of the array (Immutable pattern)
      const newOpts = [...options];
      // 2. Change the specific item
      newOpts[index].secenekMetin = text;
      // 3. Save state
      setOptions(newOpts);
  };

  // User selects the Correct Answer (Radio Button behavior)
  const handleCorrectSelect = (index) => {
      const newOpts = options.map((opt, i) => ({
          ...opt,
          // Set True for the clicked index, False for everyone else
          dogruMu: i === index 
      }));
      setOptions(newOpts);
  };

  // --- 4. SUBMIT (Create or Update) ---
  const handleSubmit = async (e) => {
      e.preventDefault();

      // Basic Validation
      if (!topicId || !difficultyId) { alert("Please select Topic and Difficulty."); return; }
      
      // Ensure exactly one correct answer
      const correctCount = options.filter(o => o.dogruMu).length;
      if (correctCount !== 1) { alert("Please mark exactly ONE correct answer."); return; }

      try {
          if (isEditing) {
              // --- UPDATE MODE (PUT) ---
              const payload = {
                  SoruID: parseInt(id),
                  SoruMetin: questionText,
                  ZorlukID: parseInt(difficultyId),
                  // Send options exactly as they are (ID is included if editing)
                  Secenekler: options 
              };
              await api.put("/question/update", payload);
              alert("Question Updated Successfully!");
          } else {
              // --- CREATE MODE (POST) ---
              const payload = {
                  KonuID: parseInt(topicId),
                  ZorlukID: parseInt(difficultyId),
                  SoruMetin: questionText,
                  // Strip out IDs (if any existed) because creating new options doesn't need IDs
                  Secenekler: options.map(o => ({ SecenekMetin: o.secenekMetin, DogruMu: o.dogruMu })) 
              };
              await api.post("/question/add", payload);
              alert("New Question Created!");
          }
          // Redirect back to list
          navigate("/manage-questions");

      } catch (err) {
          console.error(err);
          alert("Operation Failed: " + (err.response?.data?.error || err.message));
      }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <h2>{isEditing ? "Edit Question" : "Create New Question"}</h2>
      
      <form onSubmit={handleSubmit} style={{display:"flex", flexDirection:"column", gap:"1.5rem"}}>
          
          {/* TOP ROW: DROPDOWNS */}
          <div style={{display:"flex", gap:"1rem"}}>
              <div style={{flex: 1}}>
                  <label>Lesson</label>
                  <select 
                    value={lessonId} 
                    onChange={handleLessonChange} 
                    style={inputStyle} 
                    required 
                    // Optional: Disable Lesson change during Edit to prevent complex state issues
                    // disabled={isEditing} 
                  >
                      <option value="">-- Select --</option>
                      {lessons.map(l => <option key={l.dersID} value={l.dersID}>{l.dersAdi}</option>)}
                  </select>
              </div>

              <div style={{flex: 1}}>
                  <label>Topic</label>
                  <select 
                    value={topicId} 
                    onChange={e => setTopicId(e.target.value)} 
                    style={inputStyle} 
                    required
                    disabled={!lessonId}
                  >
                      <option value="">-- Select --</option>
                      {topics.map(t => <option key={t.konuID} value={t.konuID}>{t.konuAdi}</option>)}
                  </select>
              </div>

              <div style={{flex: 1}}>
                  <label>Difficulty</label>
                  <select value={difficultyId} onChange={e => setDifficultyId(e.target.value)} style={inputStyle} required>
                      <option value="">-- Select --</option>
                      {difficulties.map(d => <option key={d.zorlukID} value={d.zorlukID}>{d.zorlukAdi}</option>)}
                  </select>
              </div>
          </div>

          {/* QUESTION TEXT */}
          <div>
            <label>Question Text</label>
            <textarea 
                value={questionText} 
                onChange={e => setQuestionText(e.target.value)}
                style={{...inputStyle, height:"100px", fontFamily:"sans-serif"}}
                required
            />
          </div>

          {/* OPTIONS GRID */}
          <div style={{background: "#f9f9f9", padding: "1rem", borderRadius: "8px"}}>
              <h4 style={{marginTop: 0}}>Answers</h4>
              <p style={{fontSize: "0.85rem", color: "#666"}}>Enter options and select the radio button for the correct one.</p>
              
              {options.map((opt, idx) => (
                  <div key={idx} style={{display:"flex", alignItems:"center", gap:"10px", marginBottom:"10px"}}>
                      <input 
                        type="radio" 
                        name="correctAnswer" // Grouping them ensures only one can be checked
                        checked={opt.dogruMu} 
                        onChange={() => handleCorrectSelect(idx)}
                        style={{width:"20px", height:"20px", cursor:"pointer"}}
                      />
                      <input 
                        type="text" 
                        placeholder={`Option ${idx + 1}`}
                        value={opt.secenekMetin}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        style={inputStyle}
                        required
                      />
                  </div>
              ))}
          </div>

          {/* BUTTONS */}
          <div style={{display:"flex", gap:"1rem"}}>
              <button type="submit" style={saveBtn}>
                  {isEditing ? "Update Question" : "Create Question"}
              </button>
              <button type="button" onClick={() => navigate("/manage-questions")} style={cancelBtn}>
                  Cancel
              </button>
          </div>

      </form>
    </div>
  );
};

// Styles
const inputStyle = { width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #ccc", boxSizing: "border-box" };
const saveBtn = { flex: 2, padding: "12px", background: "#27ae60", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize:"1rem", fontWeight: "bold" };
const cancelBtn = { flex: 1, padding: "12px", background: "#95a5a6", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize:"1rem" };

export default QuestionEditor;