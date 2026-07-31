import { useEffect, useState } from 'react';

function App() {
  const [students, setStudents] = useState([]);

  // በ Render (Live) ሲሆን የ Renderን URL፡ በኮምፒውተርህ ሲሆን Localhost ይመርጣል
  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

  useEffect(() => {
    // ከ Backend መረጃ መጥራት
    fetch(`${API_URL}/students`)
      .then(response => response.json())
      .then(data => setStudents(data))
      .catch(error => console.error('Error fetching data:', error));
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>የተማሪዎች ዝርዝር</h1>
      <ul>
        {students.map(student => (
          <li key={student.id}>{student.name}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;