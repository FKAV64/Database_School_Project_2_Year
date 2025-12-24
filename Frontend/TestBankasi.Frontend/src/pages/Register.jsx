// src/pages/Register.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const navigate = useNavigate();

  // --- 1. STATE: FORM FIELDS ---
  const [ad, setAd] = useState("");
  const [soyad, setSoyad] = useState("");
  const [email, setEmail] = useState("");
  const [sifre, setSifre] = useState("");
  const [dogumTarihi, setDogumTarihi] = useState("");

  // --- 2. STATE: CASCADING DROPDOWNS ---
  const [fullList, setFullList] = useState([]); // The raw data from API
  const [schools, setSchools] = useState([]);   // Unique Schools (Dropdown 1)
  const [levels, setLevels] = useState([]);     // Filtered Classes (Dropdown 2)
  
  const [selectedSchool, setSelectedSchool] = useState(""); // User's choice 1
  const [selectedLevel, setSelectedLevel] = useState("");   // User's choice 2 (The one we send to DB)

  // --- 3. FETCH DATA ON LOAD ---
  useEffect(() => {
    const fetchEducationData = async () => {
      try {
        // NOTE: This is an open endpoint (no token needed usually, but check your AuthController)
        // If your GetEducationLevels requires [Authorize], you might need to allow Anonymous access in Controller
        // For now, let's assume it allows anonymous or we handle it.
        const response = await axios.get("http://localhost:5143/api/auth/education-levels");
        
        const data = response.data;
        setFullList(data);

        // LOGIC: Extract Unique Schools
        const unique = [];
        const seen = new Set();

        data.forEach(item => {
            // We use 'kurumID' (make sure casing matches your DTO!)
            if (!seen.has(item.kurumID)) {
                seen.add(item.kurumID);
                unique.push({ id: item.kurumID, name: item.kurumAdi });
            }
        });
        setSchools(unique);

      } catch (err) {
        console.error("Failed to load schools:", err);
        alert("Could not load school list.");
      }
    };
    
    fetchEducationData();
  }, []);

  // --- 4. HANDLE SCHOOL SELECTION ---
  const handleSchoolChange = (e) => {
      const schoolId = parseInt(e.target.value);
      setSelectedSchool(schoolId);
      
      // RESET Level selection because the list of levels is about to change
      setSelectedLevel(""); 

      // FILTER: Find levels belonging to this school
      const relevantLevels = fullList.filter(item => item.kurumID === schoolId);
      setLevels(relevantLevels);
  };

  // --- 5. SUBMIT FORM ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedLevel) {
        alert("Please select a class/grade.");
        return;
    }

    // Match the DTO in C# (UserRegisterDTO)
    const payload = {
        Ad: ad,
        Soyad: soyad,
        DogumTarihi: dogumTarihi,
        Email: email,
        Sifre: sifre,
        SeviyeID: parseInt(selectedLevel) // This effectively links user to School AND Class
    };

    try {
        await axios.post("http://localhost:5143/api/auth/register", payload);
        alert("Registration Successful! Please Login.");
        navigate("/login");
    } catch (err) {
        console.error("Register Error:", err);
        alert("Registration failed: " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>Student Registration</h2>
        <form onSubmit={handleSubmit}>
            
            {/* NAME & SURNAME */}
            <div style={styles.row}>
                <input placeholder="Name" value={ad} onChange={e => setAd(e.target.value)} style={styles.input} required />
                <input placeholder="Surname" value={soyad} onChange={e => setSoyad(e.target.value)} style={styles.input} required />
            </div>

            {/* EMAIL & PASSWORD */}
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={styles.input} required />
            <input type="password" placeholder="Password (Min 6 chars)" value={sifre} onChange={e => setSifre(e.target.value)} style={styles.input} required minLength={6} />

            {/* DATE OF BIRTH */}
            <label style={{display:"block", marginTop:"10px", textAlign:"left"}}>Date of Birth:</label>
            <input type="date" value={dogumTarihi} onChange={e => setDogumTarihi(e.target.value)} style={styles.input} required />

            {/* --- CASCADING DROPDOWNS --- */}
            
            {/* 1. SCHOOL SELECT */}
            <label style={{display:"block", marginTop:"10px", textAlign:"left"}}>Select School:</label>
            <select value={selectedSchool} onChange={handleSchoolChange} style={styles.select} required>
                <option value="">-- Choose School --</option>
                {schools.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                ))}
            </select>

            {/* 2. LEVEL SELECT (Disabled until school is chosen) */}
            <label style={{display:"block", marginTop:"10px", textAlign:"left"}}>Select Class:</label>
            <select 
                value={selectedLevel} 
                onChange={e => setSelectedLevel(e.target.value)} 
                style={styles.select} 
                required
                disabled={!selectedSchool} // Lock it if no school selected
            >
                <option value="">-- Choose Class --</option>
                {levels.map(l => (
                    <option key={l.seviyeID} value={l.seviyeID}>{l.seviyeAdi}</option>
                ))}
            </select>

            <button type="submit" style={styles.button}>Register</button>
        </form>
        
        <p style={{marginTop:"1rem"}}>
            Already have an account? <span style={{color:"blue", cursor:"pointer"}} onClick={() => navigate("/login")}>Login here</span>
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: { display: "flex", justifyContent: "center", marginTop: "50px" },
  card: { width: "450px", padding: "2rem", border: "1px solid #ddd", borderRadius: "8px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" },
  row: { display: "flex", gap: "10px" },
  input: { width: "100%", padding: "0.5rem", marginTop: "0.5rem", borderRadius: "4px", border: "1px solid #ccc", boxSizing: "border-box" },
  select: { width: "100%", padding: "0.5rem", marginTop: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" },
  button: { width: "100%", padding: "0.75rem", marginTop: "1.5rem", backgroundColor: "#27ae60", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "1rem" }
};

export default Register;