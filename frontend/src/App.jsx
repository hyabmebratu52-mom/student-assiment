import { useEffect, useState } from 'react';

function App() {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    // 1. ወደ Laravel ጥያቄ መላክ
    fetch('http://localhost:8000/api/students')
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