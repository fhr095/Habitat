import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import FaceDetection from './components/FaceDetection';
import Reports from './components/Reports';
import './styles/styles.css'; // Ajuste o caminho conforme necessário

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<FaceDetection />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>
    </Router>
  );
}

export default App;
