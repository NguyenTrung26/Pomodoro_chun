import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Coffee, Briefcase, Settings, History, Zap, TrendingUp, Target, Award, Flame, Music, Volume2, VolumeX, Moon, Sun, CheckSquare, List, Plus, BarChart2, Download } from 'lucide-react';

const PomodoroTimer = () => {
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [longBreakDuration, setLongBreakDuration] = useState(15);
  const [timeLeft, setTimeLeft] = useState(workDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isWorkSession, setIsWorkSession] = useState(true);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [sessions, setSessions] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showTasks, setShowTasks] = useState(false);
  const [showStats, setShowStats] = useState(false); // New state for stats modal
  const [tasks, setTasks] = useState([]);
  const [currentTaskId, setCurrentTaskId] = useState(null);
  const [newTaskText, setNewTaskText] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [dailyGoal, setDailyGoal] = useState(8);
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [totalFocusTime, setTotalFocusTime] = useState(0);
  const [backgroundMusic, setBackgroundMusic] = useState(null);
  const [musicVolume, setMusicVolume] = useState(0.3);
  const [autoStartBreak, setAutoStartBreak] = useState(false);
  const [autoStartWork, setAutoStartWork] = useState(false);
  const [theme, setTheme] = useState('dark');
  const intervalRef = useRef(null);
  const audioRef = useRef(null);
  const musicRef = useRef(null);

  useEffect(() => {
    // Load from localStorage
    const savedSessions = JSON.parse(localStorage.getItem('pomodoroSessions')) || [];
    const savedTasks = JSON.parse(localStorage.getItem('pomodoroTasks')) || [];
    const savedCurrentTaskId = localStorage.getItem('pomodoroCurrentTaskId') || null;
    const savedStreak = parseInt(localStorage.getItem('pomodoroStreak')) || 0;
    const savedLongestStreak = parseInt(localStorage.getItem('pomodoroLongestStreak')) || 0;
    const savedTotalTime = parseInt(localStorage.getItem('pomodoroTotalFocusTime')) || 0;
    const savedDailyGoal = parseInt(localStorage.getItem('pomodoroDailyGoal')) || 8;
    const savedWorkDuration = parseInt(localStorage.getItem('pomodoroWorkDuration')) || 25;
    const savedBreakDuration = parseInt(localStorage.getItem('pomodoroBreakDuration')) || 5;
    const savedLongBreakDuration = parseInt(localStorage.getItem('pomodoroLongBreakDuration')) || 15;
    const savedSoundEnabled = JSON.parse(localStorage.getItem('pomodoroSoundEnabled')) ?? true;
    const savedAutoStartBreak = JSON.parse(localStorage.getItem('pomodoroAutoStartBreak')) ?? false;
    const savedAutoStartWork = JSON.parse(localStorage.getItem('pomodoroAutoStartWork')) ?? false;
    const savedTheme = localStorage.getItem('pomodoroTheme') || 'dark';

    setSessions(savedSessions);
    setTasks(savedTasks);
    setCurrentTaskId(savedCurrentTaskId);
    setStreak(savedStreak);
    setLongestStreak(savedLongestStreak);
    setTotalFocusTime(savedTotalTime);
    setDailyGoal(savedDailyGoal);
    setWorkDuration(savedWorkDuration);
    setBreakDuration(savedBreakDuration);
    setLongBreakDuration(savedLongBreakDuration);
    setSoundEnabled(savedSoundEnabled);
    setAutoStartBreak(savedAutoStartBreak);
    setAutoStartWork(savedAutoStartWork);
    setTheme(savedTheme);
    setTimeLeft(savedWorkDuration * 60);
    
    calculateStreak(savedSessions);
  }, []);

  // Save to localStorage whenever relevant states change
  useEffect(() => {
    localStorage.setItem('pomodoroSessions', JSON.stringify(sessions));
    localStorage.setItem('pomodoroTasks', JSON.stringify(tasks));
    localStorage.setItem('pomodoroCurrentTaskId', currentTaskId);
    localStorage.setItem('pomodoroStreak', streak);
    localStorage.setItem('pomodoroLongestStreak', longestStreak);
    localStorage.setItem('pomodoroTotalFocusTime', totalFocusTime);
    localStorage.setItem('pomodoroDailyGoal', dailyGoal);
    localStorage.setItem('pomodoroWorkDuration', workDuration);
    localStorage.setItem('pomodoroBreakDuration', breakDuration);
    localStorage.setItem('pomodoroLongBreakDuration', longBreakDuration);
    localStorage.setItem('pomodoroSoundEnabled', JSON.stringify(soundEnabled));
    localStorage.setItem('pomodoroAutoStartBreak', JSON.stringify(autoStartBreak));
    localStorage.setItem('pomodoroAutoStartWork', JSON.stringify(autoStartWork));
    localStorage.setItem('pomodoroTheme', theme);
  }, [sessions, tasks, currentTaskId, streak, longestStreak, totalFocusTime, dailyGoal, workDuration, breakDuration, longBreakDuration, soundEnabled, autoStartBreak, autoStartWork, theme]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  const handleSessionComplete = () => {
    setIsRunning(false);
    
    const sessionDuration = isWorkSession ? workDuration : (pomodoroCount % 4 === 0 ? longBreakDuration : breakDuration);
    const newSession = {
      type: isWorkSession ? 'work' : 'break',
      duration: sessionDuration,
      completedAt: new Date().toISOString(),
      taskId: isWorkSession ? currentTaskId : null
    };
    
    const updatedSessions = [newSession, ...sessions].slice(0, 100); // Increased limit to 100 for better stats
    setSessions(updatedSessions);
    
    if (isWorkSession) {
      setTotalFocusTime(prev => prev + workDuration);
      setPomodoroCount(prev => prev + 1);
      if (currentTaskId) {
        setTasks(prevTasks => prevTasks.map(task => 
          task.id === currentTaskId ? { ...task, sessions: (task.sessions || 0) + 1 } : task
        ));
      }
      calculateStreak(updatedSessions);
    } else {
      if (pomodoroCount % 4 === 0) {
        setPomodoroCount(0);
      }
    }

    if (soundEnabled) {
      playNotificationSound();
    }

    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }

    showNotification();

    const nextIsWork = !isWorkSession;
    setIsWorkSession(nextIsWork);
    const nextDuration = nextIsWork ? workDuration : ((pomodoroCount + (isWorkSession ? 1 : 0)) % 4 === 0 ? longBreakDuration : breakDuration);
    setTimeLeft(nextDuration * 60);
    
    if ((nextIsWork && autoStartWork) || (!nextIsWork && autoStartBreak)) {
      setTimeout(() => setIsRunning(true), 2000);
    }
  };

  const playNotificationSound = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE=');
    }
    audioRef.current.play().catch(() => {});
  };

  const showNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(
        isWorkSession ? '⚡ Focus Mode Complete!' : '☕ Break Time Over!',
        {
          body: isWorkSession 
            ? 'Excellent work! Time to recharge.' 
            : 'Ready to dominate your next session?',
          icon: '🎯',
          tag: 'pomodoro'
        }
      );
    }
  };

  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const toggleTimer = () => {
    if (!isRunning) {
      requestNotificationPermission();
      if (backgroundMusic && !musicRef.current) {
        playBackgroundMusic();
      }
    } else {
      if (musicRef.current) {
        musicRef.current.pause();
      }
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(isWorkSession ? workDuration * 60 : ((pomodoroCount % 4 === 0 && !isWorkSession) ? longBreakDuration * 60 : breakDuration * 60));
  };

  const switchSession = () => {
    setIsRunning(false);
    const nextIsWork = !isWorkSession;
    setIsWorkSession(nextIsWork);
    const nextDuration = nextIsWork ? workDuration : ((pomodoroCount % 4 === 0) ? longBreakDuration : breakDuration);
    setTimeLeft(nextDuration * 60);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    const total = isWorkSession ? workDuration * 60 : (((pomodoroCount % 4 === 0) && !isWorkSession) ? longBreakDuration * 60 : breakDuration * 60);
    return ((total - timeLeft) / total) * 100;
  };

  const applySettings = (work, breakTime, longBreak, goal) => {
    setWorkDuration(work);
    setBreakDuration(breakTime);
    setLongBreakDuration(longBreak);
    setDailyGoal(goal);
    setIsRunning(false);
    const nextDuration = isWorkSession ? work : ((pomodoroCount % 4 === 0) ? longBreak : breakTime);
    setTimeLeft(nextDuration * 60);
    setShowSettings(false);
  };

  const getTodayStats = () => {
    const today = new Date().toDateString();
    return sessions.filter(s => 
      new Date(s.completedAt).toDateString() === today && s.type === 'work'
    ).length;
  };

  const calculateStreak = (sessionList) => {
    if (sessionList.length === 0) return;
    
    const workSessions = sessionList.filter(s => s.type === 'work');
    let currentStreak = 0;
    let checkDate = new Date();
    let consecutive = true;

    while (consecutive) {
      const dateStr = checkDate.toDateString();
      const daySessions = workSessions.filter(s => new Date(s.completedAt).toDateString() === dateStr);
      if (daySessions.length >= dailyGoal) {
        currentStreak++;
        checkDate = new Date(checkDate.getTime() - 86400000);
      } else {
        consecutive = false;
      }
    }
    
    setStreak(currentStreak);
    if (currentStreak > longestStreak) {
      setLongestStreak(currentStreak);
    }
  };

  const playBackgroundMusic = () => {
    if (backgroundMusic && !musicRef.current) {
      const musicUrls = {
        lofi: 'https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3',
        nature: 'https://assets.mixkit.co/music/preview/mixkit-forest-treasure-138.mp3',
        ambient: 'https://assets.mixkit.co/music/preview/mixkit-dreaming-big-31.mp3'
      };
      
      musicRef.current = new Audio(musicUrls[backgroundMusic] || musicUrls.lofi);
      musicRef.current.loop = true;
      musicRef.current.volume = musicVolume;
      musicRef.current.play().catch(() => {});
    } else if (musicRef.current && !isRunning) {
      musicRef.current.pause();
    } else if (musicRef.current && isRunning) {
      musicRef.current.play().catch(() => {});
    }
  };

  const stopBackgroundMusic = () => {
    if (musicRef.current) {
      musicRef.current.pause();
      musicRef.current = null;
    }
  };

  const getDailyProgress = () => {
    const today = getTodayStats();
    return Math.min((today / dailyGoal) * 100, 100);
  };

  const formatTotalTime = () => {
    const hours = Math.floor(totalFocusTime / 60);
    const minutes = totalFocusTime % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const addTask = () => {
    if (newTaskText.trim()) {
      const newTask = {
        id: Date.now().toString(),
        text: newTaskText.trim(),
        completed: false,
        sessions: 0
      };
      setTasks([newTask, ...tasks]);
      setNewTaskText('');
    }
  };

  const toggleTaskComplete = (id) => {
    setTasks(prevTasks => prevTasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const selectTask = (id) => {
    setCurrentTaskId(id);
    setShowTasks(false);
  };

  const currentTask = tasks.find(t => t.id === currentTaskId);

  // New functions for stats
  const getWeeklyFocusTime = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return sessions
      .filter(s => s.type === 'work' && new Date(s.completedAt) >= oneWeekAgo)
      .reduce((acc, s) => acc + s.duration, 0);
  };

  const getMonthlyFocusTime = () => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    return sessions
      .filter(s => s.type === 'work' && new Date(s.completedAt) >= oneMonthAgo)
      .reduce((acc, s) => acc + s.duration, 0);
  };

  const getAverageDailyFocus = () => {
    const uniqueDays = [...new Set(sessions.map(s => new Date(s.completedAt).toDateString()))].length;
    return uniqueDays > 0 ? Math.round(totalFocusTime / uniqueDays) : 0;
  };

  const exportData = () => {
    const data = {
      sessions,
      tasks,
      streak,
      longestStreak,
      totalFocusTime,
      dailyGoal
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pomodoro-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`min-h-screen relative overflow-hidden ${theme === 'dark' ? 'bg-slate-950' : 'bg-white text-slate-950'}`}>
      {/* Animated Background (only for dark mode) */}
      {theme === 'dark' && (
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
      )}

      {/* Grid Pattern (adjusted for theme) */}
      <div className={`absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px] ${theme === 'light' ? 'bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)]' : ''}`} />

      <div className="relative z-10 min-h-screen p-4 flex items-center justify-center">
        <div className="w-full max-w-md">
          {/* Settings Modal */}
          {showSettings && (
            <div className={`fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-4 ${theme === 'light' ? 'bg-white bg-opacity-80 text-slate-950' : ''}`}>
              <div className={`bg-gradient-to-br border rounded-3xl p-6 w-full max-w-sm shadow-2xl max-h-[90vh] overflow-y-auto ${theme === 'dark' ? 'from-slate-900 to-slate-800 border-purple-500/30 shadow-purple-500/20' : 'from-gray-100 to-white border-gray-300 shadow-gray-300/20'}`}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`text-xl font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>
                    <Settings className={`w-5 h-5 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`} />
                    Settings
                  </h3>
                  <button onClick={() => setShowSettings(false)} className={`${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-slate-950'}`}>
                    <span className="text-2xl">×</span>
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Focus Duration (minutes)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      defaultValue={workDuration}
                      id="work-input"
                      className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 ${theme === 'dark' ? 'bg-slate-800 border border-purple-500/30 text-white focus:border-purple-500 focus:ring-purple-500/20' : 'bg-white border border-gray-300 text-slate-950 focus:border-purple-600 focus:ring-purple-600/20'}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Break Duration (minutes)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      defaultValue={breakDuration}
                      id="break-input"
                      className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 ${theme === 'dark' ? 'bg-slate-800 border border-purple-500/30 text-white focus:border-purple-500 focus:ring-purple-500/20' : 'bg-white border border-gray-300 text-slate-950 focus:border-purple-600 focus:ring-purple-600/20'}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Long Break Duration (minutes)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      defaultValue={longBreakDuration}
                      id="long-break-input"
                      className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 ${theme === 'dark' ? 'bg-slate-800 border border-purple-500/30 text-white focus:border-purple-500 focus:ring-purple-500/20' : 'bg-white border border-gray-300 text-slate-950 focus:border-purple-600 focus:ring-purple-600/20'}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Daily Goal (sessions)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      defaultValue={dailyGoal}
                      id="goal-input"
                      className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 ${theme === 'dark' ? 'bg-slate-800 border border-purple-500/30 text-white focus:border-purple-500 focus:ring-purple-500/20' : 'bg-white border border-gray-300 text-slate-950 focus:border-purple-600 focus:ring-purple-600/20'}`}
                    />
                  </div>
                  <div className={`flex items-center justify-between p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/50 border-purple-500/20' : 'bg-gray-100 border-gray-200'}`}>
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Notification Sound</span>
                    <button
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className={`relative w-14 h-7 rounded-full transition-all ${soundEnabled ? 'bg-gradient-to-r from-purple-500 to-cyan-500' : (theme === 'dark' ? 'bg-slate-700' : 'bg-gray-300')}`}
                    >
                      <div className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform shadow-lg ${soundEnabled ? 'translate-x-7' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  <div className={`flex items-center justify-between p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/50 border-purple-500/20' : 'bg-gray-100 border-gray-200'}`}>
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Auto-start Breaks</span>
                    <button
                      onClick={() => setAutoStartBreak(!autoStartBreak)}
                      className={`relative w-14 h-7 rounded-full transition-all ${autoStartBreak ? 'bg-gradient-to-r from-purple-500 to-cyan-500' : (theme === 'dark' ? 'bg-slate-700' : 'bg-gray-300')}`}
                    >
                      <div className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform shadow-lg ${autoStartBreak ? 'translate-x-7' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  <div className={`flex items-center justify-between p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/50 border-purple-500/20' : 'bg-gray-100 border-gray-200'}`}>
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Auto-start Work</span>
                    <button
                      onClick={() => setAutoStartWork(!autoStartWork)}
                      className={`relative w-14 h-7 rounded-full transition-all ${autoStartWork ? 'bg-gradient-to-r from-purple-500 to-cyan-500' : (theme === 'dark' ? 'bg-slate-700' : 'bg-gray-300')}`}
                    >
                      <div className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform shadow-lg ${autoStartWork ? 'translate-x-7' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Background Music
                    </label>
                    <select
                      value={backgroundMusic || 'none'}
                      onChange={(e) => {
                        const value = e.target.value === 'none' ? null : e.target.value;
                        setBackgroundMusic(value);
                        stopBackgroundMusic();
                      }}
                      className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 ${theme === 'dark' ? 'bg-slate-800 border border-purple-500/30 text-white focus:border-purple-500 focus:ring-purple-500/20' : 'bg-white border border-gray-300 text-slate-950 focus:border-purple-600 focus:ring-purple-600/20'}`}
                    >
                      <option value="none">None</option>
                      <option value="lofi">Lo-fi Beats</option>
                      <option value="nature">Nature Sounds</option>
                      <option value="ambient">Ambient</option>
                    </select>
                  </div>
                  {backgroundMusic && (
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        Music Volume: {Math.round(musicVolume * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={musicVolume * 100}
                        onChange={(e) => {
                          const vol = e.target.value / 100;
                          setMusicVolume(vol);
                          if (musicRef.current) {
                            musicRef.current.volume = vol;
                          }
                        }}
                        className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${theme === 'dark' ? 'bg-slate-700' : 'bg-gray-300'}`}
                      />
                    </div>
                  )}
                  <div className={`flex items-center justify-between p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/50 border-purple-500/20' : 'bg-gray-100 border-gray-200'}`}>
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Theme</span>
                    <button
                      onClick={toggleTheme}
                      className={`p-2 rounded-lg transition ${theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-gray-200'}`}
                    >
                      {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                    </button>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setShowSettings(false)}
                      className={`flex-1 px-4 py-3 rounded-xl transition ${theme === 'dark' ? 'border border-gray-600 text-gray-300 hover:bg-slate-800' : 'border border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        const work = parseInt(document.getElementById('work-input').value);
                        const breakTime = parseInt(document.getElementById('break-input').value);
                        const longBreak = parseInt(document.getElementById('long-break-input').value);
                        const goal = parseInt(document.getElementById('goal-input').value);
                        applySettings(work, breakTime, longBreak, goal);
                      }}
                      className={`flex-1 px-4 py-3 rounded-xl transition shadow-lg ${theme === 'dark' ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white hover:from-purple-500 hover:to-cyan-500 shadow-purple-500/30' : 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white hover:from-purple-400 hover:to-cyan-400 shadow-purple-300/30'}`}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* History Modal */}
          {showHistory && (
            <div className={`fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-4 ${theme === 'light' ? 'bg-white bg-opacity-80 text-slate-950' : ''}`}>
              <div className={`bg-gradient-to-br border rounded-3xl p-6 w-full max-w-sm max-h-96 overflow-y-auto shadow-2xl ${theme === 'dark' ? 'from-slate-900 to-slate-800 border-purple-500/30 shadow-purple-500/20' : 'from-gray-100 to-white border-gray-300 shadow-gray-300/20'}`}>
                <div className="flex justify-between items-center mb-6">
                  <h3 className={`text-xl font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>
                    <History className={`w-5 h-5 ${theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'}`} />
                    Session History
                  </h3>
                  <button onClick={() => setShowHistory(false)} className={`${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-slate-950'}`}>
                    <span className="text-2xl">×</span>
                  </button>
                </div>
                {sessions.length === 0 ? (
                  <div className="text-center py-8">
                    <TrendingUp className={`w-12 h-12 mx-auto mb-3 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
                    <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>No sessions completed yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sessions.map((session, idx) => (
                      <div key={idx} className={`flex items-center justify-between p-3 rounded-xl transition ${theme === 'dark' ? 'bg-slate-800/50 border border-purple-500/20 hover:bg-slate-800' : 'bg-gray-100 border border-gray-200 hover:bg-gray-200'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${session.type === 'work' ? (theme === 'dark' ? 'bg-purple-500/20' : 'bg-purple-200') : (theme === 'dark' ? 'bg-cyan-500/20' : 'bg-cyan-200')}`}>
                            {session.type === 'work' ? (
                              <Zap className={`w-4 h-4 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`} />
                            ) : (
                              <Coffee className={`w-4 h-4 ${theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'}`} />
                            )}
                          </div>
                          <div>
                            <span className={`font-medium capitalize ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>{session.type}</span>
                            <span className={`text-sm ml-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{session.duration}m</span>
                            {session.taskId && (
                              <span className={`text-xs block ${theme === 'dark' ? 'text-gray-500' : 'text-gray-700'}`}>
                                Task: {tasks.find(t => t.id === session.taskId)?.text || 'Unknown'}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-700'}`}>
                          {new Date(session.completedAt).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tasks Modal */}
          {showTasks && (
            <div className={`fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-4 ${theme === 'light' ? 'bg-white bg-opacity-80 text-slate-950' : ''}`}>
              <div className={`bg-gradient-to-br border rounded-3xl p-6 w-full max-w-sm max-h-96 overflow-y-auto shadow-2xl ${theme === 'dark' ? 'from-slate-900 to-slate-800 border-purple-500/30 shadow-purple-500/20' : 'from-gray-100 to-white border-gray-300 shadow-gray-300/20'}`}>
                <div className="flex justify-between items-center mb-6">
                  <h3 className={`text-xl font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>
                    <List className={`w-5 h-5 ${theme === 'dark' ? 'text-pink-400' : 'text-pink-600'}`} />
                    Tasks
                  </h3>
                  <button onClick={() => setShowTasks(false)} className={`${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-slate-950'}`}>
                    <span className="text-2xl">×</span>
                  </button>
                </div>
                <div className="mb-4 flex gap-2">
                  <input
                    type="text"
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    placeholder="Add new task..."
                    className={`flex-1 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 ${theme === 'dark' ? 'bg-slate-800 border border-purple-500/30 text-white focus:border-purple-500 focus:ring-purple-500/20' : 'bg-white border border-gray-300 text-slate-950 focus:border-purple-600 focus:ring-purple-600/20'}`}
                  />
                  <button
                    onClick={addTask}
                    className={`p-3 rounded-xl transition ${theme === 'dark' ? 'bg-purple-600 hover:bg-purple-500' : 'bg-purple-500 hover:bg-purple-400'} text-white`}
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                {tasks.length === 0 ? (
                  <div className="text-center py-8">
                    <List className={`w-12 h-12 mx-auto mb-3 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
                    <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>No tasks yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition ${theme === 'dark' ? 'bg-slate-800/50 border border-purple-500/20 hover:bg-slate-800' : 'bg-gray-100 border border-gray-200 hover:bg-gray-200'} ${task.completed ? 'opacity-50' : ''}`}
                        onClick={() => !task.completed && selectTask(task.id)}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTaskComplete(task.id);
                            }}
                            className={`p-1 ${task.completed ? 'text-green-400' : 'text-gray-400'}`}
                          >
                            <CheckSquare className="w-5 h-5" />
                          </button>
                          <div>
                            <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-950'} ${task.completed ? 'line-through' : ''}`}>
                              {task.text}
                            </span>
                            <span className={`text-xs block ${theme === 'dark' ? 'text-gray-500' : 'text-gray-700'}`}>
                              Sessions: {task.sessions || 0}
                            </span>
                          </div>
                        </div>
                        {currentTaskId === task.id && (
                          <span className={`text-xs ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>Current</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stats Modal */}
          {showStats && (
            <div className={`fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-4 ${theme === 'light' ? 'bg-white bg-opacity-80 text-slate-950' : ''}`}>
              <div className={`bg-gradient-to-br border rounded-3xl p-6 w-full max-w-sm max-h-96 overflow-y-auto shadow-2xl ${theme === 'dark' ? 'from-slate-900 to-slate-800 border-purple-500/30 shadow-purple-500/20' : 'from-gray-100 to-white border-gray-300 shadow-gray-300/20'}`}>
                <div className="flex justify-between items-center mb-6">
                  <h3 className={`text-xl font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>
                    <BarChart2 className={`w-5 h-5 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
                    Statistics
                  </h3>
                  <button onClick={() => setShowStats(false)} className={`${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-slate-950'}`}>
                    <span className="text-2xl">×</span>
                  </button>
                </div>
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/50 border-green-500/20' : 'bg-gray-100 border-green-200'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Award className={`w-4 h-4 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
                      <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Total Focus Time</span>
                    </div>
                    <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>{formatTotalTime()}</div>
                  </div>
                  <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/50 border-green-500/20' : 'bg-gray-100 border-green-200'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className={`w-4 h-4 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
                      <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Weekly Focus</span>
                    </div>
                    <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>{getWeeklyFocusTime()}m</div>
                  </div>
                  <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/50 border-green-500/20' : 'bg-gray-100 border-green-200'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className={`w-4 h-4 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
                      <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Monthly Focus</span>
                    </div>
                    <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>{getMonthlyFocusTime()}m</div>
                  </div>
                  <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/50 border-green-500/20' : 'bg-gray-100 border-green-200'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Target className={`w-4 h-4 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
                      <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Avg Daily Focus</span>
                    </div>
                    <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>{getAverageDailyFocus()}m</div>
                  </div>
                  <button
                    onClick={exportData}
                    className={`w-full px-4 py-3 rounded-xl transition flex items-center justify-center gap-2 ${theme === 'dark' ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white hover:from-purple-500 hover:to-cyan-500' : 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white hover:from-purple-400 hover:to-cyan-400'}`}
                  >
                    <Download className="w-5 h-5" />
                    Export Data
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main Timer Card */}
          <div className={`bg-gradient-to-br backdrop-blur-xl border rounded-3xl shadow-2xl p-8 ${theme === 'dark' ? 'from-slate-900/90 to-slate-800/90 border-purple-500/30 shadow-purple-500/20' : 'from-gray-100/90 to-white/90 border-gray-300 shadow-gray-300/20'}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className={`relative p-2 rounded-xl ${isWorkSession ? (theme === 'dark' ? 'bg-gradient-to-br from-purple-600 to-pink-600' : 'bg-gradient-to-br from-purple-400 to-pink-400') : (theme === 'dark' ? 'bg-gradient-to-br from-cyan-600 to-blue-600' : 'bg-gradient-to-br from-cyan-400 to-blue-400')}`}>
                  {isWorkSession ? (
                    <Zap className="w-5 h-5 text-white" />
                  ) : (
                    <Coffee className="w-5 h-5 text-white" />
                  )}
                  {isRunning && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping" />
                  )}
                </div>
                <div>
                  <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>
                    {isWorkSession ? 'Focus Mode' : (pomodoroCount % 4 === 0 && !isWorkSession ? 'Long Break' : 'Break Time')}
                  </h2>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {isWorkSession ? 'Deep work session' : 'Recharge your energy'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowTasks(true)}
                  className={`p-2.5 rounded-xl transition border hover:border-purple-500/50 ${theme === 'dark' ? 'border-purple-500/20 hover:bg-slate-800' : 'border-gray-200 hover:bg-gray-100 hover:border-purple-300/50'}`}
                >
                  <List className={`w-5 h-5 transition ${theme === 'dark' ? 'text-gray-400 hover:text-pink-400' : 'text-gray-600 hover:text-pink-600'}`} />
                </button>
                <button
                  onClick={() => setShowHistory(true)}
                  className={`p-2.5 rounded-xl transition border hover:border-purple-500/50 ${theme === 'dark' ? 'border-purple-500/20 hover:bg-slate-800' : 'border-gray-200 hover:bg-gray-100 hover:border-purple-300/50'}`}
                >
                  <History className={`w-5 h-5 transition ${theme === 'dark' ? 'text-gray-400 hover:text-cyan-400' : 'text-gray-600 hover:text-cyan-600'}`} />
                </button>
                <button
                  onClick={() => setShowStats(true)}
                  className={`p-2.5 rounded-xl transition border hover:border-purple-500/50 ${theme === 'dark' ? 'border-purple-500/20 hover:bg-slate-800' : 'border-gray-200 hover:bg-gray-100 hover:border-purple-300/50'}`}
                >
                  <BarChart2 className={`w-5 h-5 transition ${theme === 'dark' ? 'text-gray-400 hover:text-green-400' : 'text-gray-600 hover:text-green-600'}`} />
                </button>
                <button
                  onClick={() => setShowSettings(true)}
                  className={`p-2.5 rounded-xl transition border hover:border-purple-500/50 ${theme === 'dark' ? 'border-purple-500/20 hover:bg-slate-800' : 'border-gray-200 hover:bg-gray-100 hover:border-purple-300/50'}`}
                >
                  <Settings className={`w-5 h-5 transition ${theme === 'dark' ? 'text-gray-400 hover:text-purple-400' : 'text-gray-600 hover:text-purple-600'}`} />
                </button>
              </div>
            </div>

            {/* Current Task Display */}
            {isWorkSession && currentTask && (
              <div className={`mb-4 p-3 rounded-xl ${theme === 'dark' ? 'bg-slate-800/50 border border-pink-500/20' : 'bg-gray-100 border border-pink-200'}`}>
                <div className="flex items-center gap-2">
                  <CheckSquare className={`w-4 h-4 ${theme === 'dark' ? 'text-pink-400' : 'text-pink-600'}`} />
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Current Task:</span>
                  <span className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>{currentTask.text}</span>
                </div>
              </div>
            )}

            {/* Progress Ring */}
            <div className="relative w-72 h-72 mx-auto mb-8">
              <div className={`absolute inset-0 rounded-full blur-2xl ${isWorkSession ? (theme === 'dark' ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20' : 'bg-gradient-to-br from-purple-300/20 to-pink-300/20') : (theme === 'dark' ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20' : 'bg-gradient-to-br from-cyan-300/20 to-blue-300/20')}`} />
              
              <svg className="w-full h-full transform -rotate-90 relative z-10">
                <defs>
                  <linearGradient id="workGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                  <linearGradient id="breakGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
                <circle
                  cx="144"
                  cy="144"
                  r="128"
                  fill="none"
                  stroke={`${theme === 'dark' ? '#1e293b' : '#d1d5db'}`}
                  strokeWidth="8"
                />
                <circle
                  cx="144"
                  cy="144"
                  r="128"
                  fill="none"
                  stroke={`url(#${isWorkSession ? 'workGradient' : 'breakGradient'})`}
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 128}`}
                  strokeDashoffset={`${2 * Math.PI * 128 * (1 - getProgress() / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                  filter="drop-shadow(0 0 8px rgba(168, 85, 247, 0.5))"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className={`text-6xl font-bold bg-clip-text text-transparent mb-2 tracking-tight ${theme === 'dark' ? 'bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400' : 'bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600'}`}>
                    {formatTime(timeLeft)}
                  </div>
                  <div className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {isWorkSession ? 'Deep Focus Active' : 'Recovery Mode'}
                  </div>
                  <div className={`mt-2 text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-700'}`}>
                    {Math.round(getProgress())}% Complete
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <button
                onClick={resetTimer}
                className={`p-4 rounded-2xl transition shadow-lg ${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 border border-purple-500/30' : 'bg-white hover:bg-gray-100 border border-gray-300'}`}
              >
                <RotateCcw className={`w-6 h-6 transition ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-slate-950'}`} />
              </button>
              <button
                onClick={toggleTimer}
                className={`relative p-8 rounded-2xl transition shadow-2xl group ${isWorkSession ? (theme === 'dark' ? 'bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-purple-500/50' : 'bg-gradient-to-br from-purple-400 to-pink-400 hover:from-purple-300 hover:to-pink-300 shadow-purple-300/50') : (theme === 'dark' ? 'bg-gradient-to-br from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-cyan-500/50' : 'bg-gradient-to-br from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 shadow-cyan-300/50')}`}
              >
                <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-20 transition blur ${theme === 'dark' ? 'bg-gradient-to-r from-purple-400 to-pink-400' : 'bg-gradient-to-r from-purple-300 to-pink-300'}`} />
                {isRunning ? (
                  <Pause className="w-8 h-8 text-white relative z-10" />
                ) : (
                  <Play className="w-8 h-8 text-white ml-1 relative z-10" />
                )}
              </button>
              <button
                onClick={switchSession}
                className={`p-4 rounded-2xl transition shadow-lg ${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 border border-purple-500/30' : 'bg-white hover:bg-gray-100 border border-gray-300'}`}
              >
                {isWorkSession ? (
                  <Coffee className={`w-6 h-6 transition ${theme === 'dark' ? 'text-gray-400 hover:text-cyan-400' : 'text-gray-600 hover:text-cyan-600'}`} />
                ) : (
                  <Zap className={`w-6 h-6 transition ${theme === 'dark' ? 'text-gray-400 hover:text-purple-400' : 'text-gray-600 hover:text-purple-600'}`} />
                )}
              </button>
            </div>

            {/* Stats */}
            <div className={`grid grid-cols-2 gap-3 pt-6 mb-6 border-t ${theme === 'dark' ? 'border-purple-500/20' : 'border-gray-200'}`}>
              <div className={`text-center p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/30 border-purple-500/20' : 'bg-gray-100 border-gray-200'}`}>
                <div className={`text-3xl font-bold bg-clip-text text-transparent ${theme === 'dark' ? 'bg-gradient-to-r from-purple-400 to-pink-400' : 'bg-gradient-to-r from-purple-600 to-pink-600'}`}>
                  {getTodayStats()}
                </div>
                <div className={`text-xs mt-1 font-medium ${theme === 'dark' ? 'text-gray-500' : 'text-gray-700'}`}>Today</div>
              </div>
              <div className={`text-center p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/30 border-cyan-500/20' : 'bg-gray-100 border-cyan-200'}`}>
                <div className={`text-3xl font-bold bg-clip-text text-transparent ${theme === 'dark' ? 'bg-gradient-to-r from-cyan-400 to-blue-400' : 'bg-gradient-to-r from-cyan-600 to-blue-600'}`}>
                  {sessions.filter(s => s.type === 'work').length}
                </div>
                <div className={`text-xs mt-1 font-medium ${theme === 'dark' ? 'text-gray-500' : 'text-gray-700'}`}>Total</div>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="space-y-3">
              {/* Daily Goal Progress */}
              <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/30 border-purple-500/20' : 'bg-gray-100 border-gray-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Target className={`w-4 h-4 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`} />
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Daily Goal</span>
                  </div>
                  <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{getTodayStats()}/{dailyGoal}</span>
                </div>
                <div className={`w-full h-2 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-slate-700' : 'bg-gray-200'}`}>
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                    style={{ width: `${getDailyProgress()}%` }}
                  />
                </div>
              </div>

              {/* Streak & Total Time */}
              <div className="grid grid-cols-2 gap-3">
                <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/30 border-orange-500/20' : 'bg-gray-100 border-orange-200'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Flame className={`w-4 h-4 ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`} />
                    <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Streak</span>
                  </div>
                  <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`}>{streak}</div>
                  <div className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-700'}`}>Best: {longestStreak}</div>
                </div>
                <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/30 border-green-500/20' : 'bg-gray-100 border-green-200'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Award className={`w-4 h-4 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
                    <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Focus Time</span>
                  </div>
                  <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>{formatTotalTime()}</div>
                </div>
              </div>

              {/* Background Music Control */}
              {backgroundMusic && (
                <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/30 border-cyan-500/20' : 'bg-gray-100 border-cyan-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Music className={`w-4 h-4 ${theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'}`} />
                      <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        {backgroundMusic === 'lofi' ? 'Lo-fi Beats' : backgroundMusic === 'nature' ? 'Nature Sounds' : 'Ambient'}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        if (musicRef.current) {
                          if (musicRef.current.paused) {
                            musicRef.current.play();
                          } else {
                            musicRef.current.pause();
                          }
                        }
                      }}
                      className={`p-2 rounded-lg transition ${theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-gray-200'}`}
                    >
                      {musicRef.current && !musicRef.current.paused ? (
                        <Volume2 className={`w-4 h-4 ${theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'}`} />
                      ) : (
                        <VolumeX className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info Note */}
          <div className="mt-6 text-center">
            <div className={`inline-flex items-center gap-2 px-4 py-2 backdrop-blur-sm border rounded-full ${theme === 'dark' ? 'bg-slate-900/50 border-purple-500/30' : 'bg-white/50 border-gray-300'}`}>
              <Zap className={`w-4 h-4 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`} />
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Powered by Pomodoro Technique</p>
            </div>
            <p className={`text-xs mt-3 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
              Background timer • Smart notifications • Progress tracking
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PomodoroTimer;