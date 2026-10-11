import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import TokensPage from './pages/TokensPage';
import CreateClassroomPage from './pages/CreateClassroomPage';
import MyClassroomsPage from './pages/MyClassroomsPage';
import JoinedClassroomsPage from './pages/JoinedClassroomsPage';
import JoinClassroomPage from './pages/JoinClassroomPage';
import ClassroomDetailPage from './pages/ClassroomDetailPage';
import CreateAssignmentPage from './pages/CreateAssignmentPage';
import AssignmentDetailPage from './pages/AssignmentDetailPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/tokens" element={<TokensPage />} />

        {/* Classroom routes */}
        <Route path="/create-classroom" element={<CreateClassroomPage />} />
        <Route path="/classrooms/mine" element={<MyClassroomsPage />} />
        <Route path="/classrooms/joined" element={<JoinedClassroomsPage />} />
        <Route path="/join" element={<JoinClassroomPage />} />
        <Route path="/join/:inviteCode" element={<JoinClassroomPage />} />
        <Route path="/classrooms/:id" element={<ClassroomDetailPage />} />

        {/* Assignment routes */}
        <Route path="/classrooms/:id/create-assignment" element={<CreateAssignmentPage />} />
        <Route path="/assignments/:id" element={<AssignmentDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
