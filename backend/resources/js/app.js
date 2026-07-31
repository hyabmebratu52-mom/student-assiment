import React, { useState, useEffect } from 'react';

function App() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // ኦንላይን የተጫነውን የ Render HTTPS API አድራሻ መጠቀም
    fetch('https://student-assiment-4.onrender.com/api/students')
      .then((response) => {
        if (!response.ok) {
          throw new Error('የመረጃ ስህተት ተፈጽሟል');
        }
        return response.json();
      })
      .then((data) => {
        setStudents(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching students:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>የተማሪዎች ዝርዝር (Student List)</h1>

      {loading && <p>መረጃው እየተጫነ ነው (Loading...)...</p>}
      {error && <p style={{ color: 'red' }}>ስህተት፡ {error}</p>}

      {!loading && !error && (
        <ul>
          {students.map((student) => (
            <li key={student.id} style={{ marginBottom: '8px', fontSize: '18px' }}>
              <strong>{student.name}</strong>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;