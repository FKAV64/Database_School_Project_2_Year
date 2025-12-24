// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar"; // Import our new brick
import Footer from "./components/Footer"; // Import our new brick
import Register from "./pages/Register";
import Login from "./pages/Login";
import TeacherDashboard from "./pages/TeacherDashboard";
import QuestionBank from "./pages/QuestionBank";
import QuestionEditor from "./pages/QuestionEditor";
import TeacherStats from "./pages/TeacherStats";
import StudentDashboard from "./pages/StudentDashboard";
import StartExam from "./pages/StartExam";
import ExamRoom from "./pages/ExamRoom";
import ExamResult from "./pages/ExamResult";
import ExamReview from "./pages/ExamReview";
import MyHistory from "./pages/MyHistory";
import MyPerformance from "./pages/MyPerformance";

function App() {
  return (
    <BrowserRouter>
      {/* CONTAINER: This div wraps the whole app.
        'minHeight: 100vh' means "take up 100% of the viewport height".
        'display: flex' + 'flexDirection: column' allows the Footer to stick to the bottom.
      */}
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        
        {/* 1. Header (Always Visible) */}
        <Navbar />

        {/* 2. Main Content Area (Dynamic) */}
        {/* 'flex: 1' makes this middle section expand to fill empty space */}
        <main style={{ flex: 1, padding: "2rem" }}>

        {/* THE SWITCHBOARD:
              React Router looks at the current URL and scans these Routes.
              It picks the FIRST one that matches and renders ONLY that component inside this <Routes> block.
          */}

          <Routes>
            {/* When URL is "/", show the Welcome Message */}
            <Route path="/" element={
               <div style={{ textAlign: "center" }}>
                 <h1>Welcome to the Exam System</h1>
                 <p>Select "Login" to begin</p>
               </div>
            } />
            <Route path="/register" element={<Register />} />

            {/* When URL is "/login", show the Login Page (We will build this next) */}
            <Route path="/login" element={<Login />} />

            <Route path="/teacher-dashboard" element={<TeacherDashboard />} />

            <Route path="/manage-questions" element={<QuestionBank />} />

            {/* The ":id" part tells React "capture whatever is here and call it 'id'"*/}
            <Route path="/edit-question/:id" element={<QuestionEditor />} />

            <Route path="/teacher-stats" element={<TeacherStats />} />

            <Route path="/student-dashboard" element={<StudentDashboard />} />

            <Route path="/start-exam" element={<StartExam />} />

            <Route path="/exam-room" element={<ExamRoom />} />

            <Route path="/exam-result/:oturumId" element={<ExamResult />} />

            <Route path="/exam-review/:oturumId" element={<ExamReview />} />

            <Route path="/my-history" element={<MyHistory />} />

            <Route path="/my-performance" element={<MyPerformance />} />
          </Routes>
        </main>

        {/* 3. Footer (Always Visible) */}
        <Footer />
        
      </div>
    </BrowserRouter>
  );
}

export default App;