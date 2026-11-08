import { useState, useEffect } from 'react';
import { MainView, GuruTab, ScheduleItem, StudentItem, TeacherItem } from './types/cbt';
import { getNowWib, WibTimeInfo, DEFAULT_CBT_EXIT_TOKEN, fetchBackendExitToken, updateBackendExitToken, syncTeachersToBackend, syncStudentsToBackend } from './utils/cbtLogic';
import {
  loadSchedules,
  saveSchedules,
  loadTeachers,
  saveTeachers,
  loadStudents,
  saveStudents,
  DEFAULT_SCHEDULES,
  DEFAULT_TEACHERS,
  DEFAULT_STUDENTS,
} from './data/defaultData';
import { HomeView } from './components/home/HomeView';
import { StudentView } from './components/student/StudentView';
import { GuruLayout } from './components/guru/GuruLayout';

export default function App() {
  // Navigation State
  const [currentView, setCurrentView] = useState<MainView>('home');
  const [initialGuruTab, setInitialGuruTab] = useState<GuruTab>('dashboard');

  // Time state (WIB)
  const [currentTime, setCurrentTime] = useState<WibTimeInfo>(getNowWib());

  // Data states with persistence
  const [schedules, setSchedules] = useState<ScheduleItem[]>(() => loadSchedules());
  const [teachers, setTeachers] = useState<TeacherItem[]>(() => loadTeachers());
  const [students, setStudents] = useState<StudentItem[]>(() => loadStudents());

  // CBT Exit Token state
  const [exitToken, setExitToken] = useState<string>(() => {
    return localStorage.getItem('cbt_exit_token') || DEFAULT_CBT_EXIT_TOKEN;
  });

  // Fetch token from backend on mount
  useEffect(() => {
    fetchBackendExitToken().then((token) => {
      if (token) {
        setExitToken(token);
        localStorage.setItem('cbt_exit_token', token);
      }
    });
  }, []);

  const handleUpdateExitToken = (newToken: string) => {
    const clean = newToken.trim().toUpperCase();
    setExitToken(clean);
    localStorage.setItem('cbt_exit_token', clean);
    updateBackendExitToken(clean);
  };

  // URL query parameter support for direct access (?view=guru, ?autostart=1)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    const tabParam = params.get('tab') as GuruTab | null;

    if (viewParam === 'guru' || params.get('autostart') === '1') {
      setCurrentView('guru');
      if (tabParam && ['dashboard', 'monitoring', 'master', 'schedule', 'poster'].includes(tabParam)) {
        setInitialGuruTab(tabParam);
      }
    } else if (viewParam === 'student') {
      setCurrentView('student');
    }
  }, []);

  // Update clock and auto-sync status every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getNowWib());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Sync to localStorage and write directly to disk database files
  useEffect(() => {
    saveSchedules(schedules);
  }, [schedules]);

  useEffect(() => {
    saveTeachers(teachers);
    syncTeachersToBackend(teachers);
  }, [teachers]);

  useEffect(() => {
    saveStudents(students);
    syncStudentsToBackend(students);
  }, [students]);

  // Schedule Actions
  const handleSaveSchedule = (newSchedule: Omit<ScheduleItem, 'id'>) => {
    const id = `SCH-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    setSchedules((prev) => [...prev, { ...newSchedule, id }]);
  };

  const handleUpdateExamUrl = (id: string, url: string) => {
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, schedule_exam_url: url } : s))
    );
  };

  const handleDeleteSchedule = (id: string) => {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
  };

  // Student Actions
  const handleSaveStudent = (newStudent: Omit<StudentItem, 'id'>) => {
    const id = `STD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    setStudents((prev) => {
      const existing = prev.find((s) => s.student_nisn === newStudent.student_nisn);
      if (existing) {
        return prev.map((s) => (s.student_nisn === newStudent.student_nisn ? { ...newStudent, id: existing.id } : s));
      }
      return [...prev, { ...newStudent, id }];
    });
  };

  const handleDeleteStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
  };

  const handleBatchImportStudents = (imported: Omit<StudentItem, 'id'>[]) => {
    setStudents((prev) => {
      const updated = [...prev];
      for (const item of imported) {
        const idx = updated.findIndex((s) => s.student_nisn === item.student_nisn);
        if (idx >= 0) {
          updated[idx] = { ...item, id: updated[idx].id };
        } else {
          updated.push({
            ...item,
            id: `STD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
          });
        }
      }
      return updated;
    });
  };

  // Teacher Actions
  const handleSaveTeacher = (newTeacher: Omit<TeacherItem, 'id'>) => {
    const id = `TCH-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    setTeachers((prev) => [...prev, { ...newTeacher, id }]);
  };

  const handleDeleteTeacher = (id: string) => {
    setTeachers((prev) => prev.filter((t) => t.id !== id));
  };

  const handleBatchImportTeachers = (imported: Omit<TeacherItem, 'id'>[]) => {
    setTeachers((prev) => {
      const newItems = imported.map((item) => ({
        ...item,
        id: `TCH-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      }));
      return [...prev, ...newItems];
    });
  };

  const handleSyncTeachers = (synced: Omit<TeacherItem, 'id'>[]) => {
    setTeachers(
      synced.map((item, idx) => ({
        ...item,
        id: `TCH-SYNC-${idx + 1}-${Date.now().toString(36)}`,
      }))
    );
  };

  const handleSyncStudents = (synced: Omit<StudentItem, 'id'>[]) => {
    setStudents(
      synced.map((item, idx) => ({
        ...item,
        id: `STD-SYNC-${idx + 1}-${Date.now().toString(36)}`,
      }))
    );
  };

  const handleResetData = () => {
    setSchedules(DEFAULT_SCHEDULES);
    setTeachers(DEFAULT_TEACHERS);
    setStudents(DEFAULT_STUDENTS);
  };

  return (
    <div className="w-full min-h-screen">
      {currentView === 'home' && (
        <HomeView
          currentTime={currentTime}
          onEnterStudent={() => setCurrentView('student')}
          onEnterGuru={() => setCurrentView('guru')}
        />
      )}

      {currentView === 'student' && (
        <StudentView
          schedules={schedules}
          students={students}
          currentTime={currentTime}
          onBackToHome={() => setCurrentView('home')}
          activeToken={exitToken}
        />
      )}

      {currentView === 'guru' && (
        <GuruLayout
          initialTab={initialGuruTab}
          schedules={schedules}
          students={students}
          teachers={teachers}
          currentTime={currentTime}
          onExit={() => setCurrentView('home')}
          onSaveSchedule={handleSaveSchedule}
          onUpdateExamUrl={handleUpdateExamUrl}
          onDeleteSchedule={handleDeleteSchedule}
          onSaveStudent={handleSaveStudent}
          onDeleteStudent={handleDeleteStudent}
          onSaveTeacher={handleSaveTeacher}
          onDeleteTeacher={handleDeleteTeacher}
          onBatchImportStudents={handleBatchImportStudents}
          onBatchImportTeachers={handleBatchImportTeachers}
          onSyncTeachers={handleSyncTeachers}
          onSyncStudents={handleSyncStudents}
          onResetData={handleResetData}
          exitToken={exitToken}
          onUpdateExitToken={handleUpdateExitToken}
        />
      )}
    </div>
  );
}
