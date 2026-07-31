<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">
    <title>Student Assignment</title>
    
    <!-- Direct React CDN (ከ Vite build ኤረር ነፃ የሆነ መፍትሔ) -->
    <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

    <style>
        body { font-family: Arial, sans-serif; padding: 40px; background-color: #f4f4f9; }
        .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 500px; margin: auto; }
        ul { list-style-type: none; padding: 0; }
        li { background: #eef2ff; margin: 8px 0; padding: 10px 15px; border-radius: 6px; color: #333; font-weight: bold; }
    </style>
</head>
<body>

    <div id="root"></div>

    <script type="text/babel">
        function App() {
            const [students, setStudents] = React.useState([]);
            const [loading, setLoading] = React.useState(true);

            React.useEffect(() => {
                fetch('/api/students')
                    .then(res => res.json())
                    .then(data => {
                        setStudents(data);
                        setLoading(false);
                    })
                    .catch(err => console.error(err));
            }, []);

            return (
                <div className="card">
                    <h2>🎓 የተማሪዎች ዝርዝር (Student List)</h2>
                    {loading ? (
                        <p>መረጃው እየተጫነ ነው...</p>
                    ) : (
                        <ul>
                            {students.map(student => (
                                <li key={student.id}>{student.name}</li>
                            ))}
                        </ul>
                    )}
                </div>
            );
        }

        ReactDOM.createRoot(document.getElementById('root')).render(<App />);
    </script>
</body>
</html>