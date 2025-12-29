// src/pages/ExamRoom.jsx
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../utils/api";

const ExamRoom = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // 1. GET DATA FROM PREVIOUS PAGE
  // We passed the questions via 'navigate(..., { state: ... })' in StartExam.jsx
 const { examData, duration } = location.state || {};

  // 2. STATE MANAGEMENT
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0); // Which question are we viewing?
  const [userAnswers, setUserAnswers] = useState({});  // Map: { SoruID: SecenekID }
  const [timeLeft, setTimeLeft] = useState(0);         // Seconds remaining

  // 3. INITIALIZATION (Run once)
  useEffect(() => {
    if (!examData || examData.length === 0) {
      alert("No exam data found. Redirecting to dashboard.");
      navigate("/student-dashboard");
      return;
    }
    //console.log("DEBUG: Exam Data Structure:", examData[0]);
    setQuestions(examData);
    
    // We assume the first question carries the correct duration (or passed separately)
    // For now, let's just set a default or calculate from props if you passed 'duration'
    // Let's assume 15 minutes (900 seconds) if not provided.
    setTimeLeft(duration * 60); 

  }, [examData, duration, navigate]);

  // 4. TIMER LOGIC
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timerId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000); // 1000ms = 1 second that is runs setTimeLeft every second

    // Cleanup: Stop timer if user leaves page
    return () => clearInterval(timerId);
  }, [timeLeft]);

  // Auto-Submit if time runs out
  useEffect(() => {
    if (timeLeft === 0 && questions.length > 0) {
        alert("Time is up! Submitting your exam.");
        handleSubmit();
    }

  }, [timeLeft, questions]);

  // 5. HELPER FUNCTIONS
  const handleOptionSelect = (questionId, optionId) => {
    setUserAnswers({
      ...userAnswers,
      [questionId]: optionId // Update only this specific question
    });
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;     // To the the remaining seconds
    return `${m}:${s < 10 ? '0' : ''}${s}`; // means if the remaining seconds are less than 10, add a zero infornt 08
  };

  const handleSubmit = async () => {
    // PREPARE THE PAYLOAD
    // We need OturumID (From the first question)
   const oturumId = questions[0].oturumID || questions[0].OturumID;

    // Convert our answer map { 101: 5, 102: 9 } to the List format API expects
    const answerList = Object.keys(userAnswers).map(qId => ({
        SoruID: parseInt(qId),
        SecenekID: parseInt(userAnswers[qId])
    }));

    const payload = {
        OturumID: oturumId,
        Cevaplar: answerList
    };
    //console.log("SUBMITTING EXAM:", JSON.stringify(payload, null, 2));

    try {
        await api.post("/Exam/submit", payload);

        //alert("Exam Submitted Successfully!");
        navigate("/exam-result/" + payload.OturumID)

    } catch (err) {
        console.error("Submission Failed:", err);
        alert("Error submitting exam.");
    }
  };

  // 6. RENDER (The UI)
  if (questions.length === 0) return <div>Loading Exam...</div>;

  const currentQ = questions[currentIndex];

  return (
    <div style={styles.container}>
      {/* HEADER: Timer & Progress */}
      <div style={styles.header}>
        <h3>Question {currentIndex + 1} / {questions.length}</h3>
        <div style={{ ...styles.timer, color: timeLeft < 60 ? 'red' : 'black' }}>
            ⏱ {formatTime(timeLeft)}
        </div>
      </div>

      {/* QUESTION CARD */}
      <div style={styles.card}>
        <h4 style={styles.questionText}>{currentQ.soruMetin}</h4>
        
        <div style={styles.optionsGrid}>
            {currentQ.secenekler.map(opt => (
                <div 
                    key={opt.secenekID} 
                    style={{
                        ...styles.option,
                        // Highlight if selected
                        backgroundColor: userAnswers[currentQ.soruID] === opt.secenekID ? "#d1e7dd" : "#f8f9fa",
                        borderColor: userAnswers[currentQ.soruID] === opt.secenekID ? "#0f5132" : "#ddd"
                    }}
                    onClick={() => handleOptionSelect(currentQ.soruID, opt.secenekID)}
                >
                    {opt.secenekMetin}
                </div>
            ))}
        </div>
      </div>

      {/* FOOTER: Navigation Buttons */}
      <div style={styles.footer}>
        <button 
            disabled={currentIndex === 0} 
            onClick={() => setCurrentIndex(currentIndex - 1)}
            style={styles.navBtn}
        >
            Previous
        </button>

        {currentIndex < questions.length - 1 ? (
            <button 
                onClick={() => setCurrentIndex(currentIndex + 1)}
                style={styles.navBtn}
            >
                Next
            </button>
        ) : (
            <button 
                onClick={handleSubmit}
                style={styles.submitBtn}
            >
                Submit Exam
            </button>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: { maxWidth: "800px", margin: "2rem auto", padding: "1rem" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" },
  timer: { fontSize: "1.5rem", fontWeight: "bold" },
  card: { padding: "2rem", border: "1px solid #ddd", borderRadius: "8px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" },
  questionText: { fontSize: "1.2rem", marginBottom: "1.5rem", whiteSpace: "pre-wrap", lineHeight: "1.5" },
  optionsGrid: { display: "flex", flexDirection: "column", gap: "1rem" },
  option: { padding: "1rem", border: "2px solid #ddd", borderRadius: "6px", cursor: "pointer", fontSize: "1rem", transition: "all 0.2s" },
  footer: { display: "flex", justifyContent: "space-between", marginTop: "2rem" },
  navBtn: { padding: "0.8rem 1.5rem", fontSize: "1rem", cursor: "pointer" },
  submitBtn: { padding: "0.8rem 1.5rem", fontSize: "1rem", cursor: "pointer", backgroundColor: "#e74c3c", color: "white", border: "none", borderRadius: "4px" }
};

export default ExamRoom;