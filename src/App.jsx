import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Coffee, Briefcase, Settings, History, Zap, TrendingUp, Target, Award, Flame, Music, Volume2, VolumeX, Moon, Sun } from 'lucide-react';

const PomodoroTimer = () => {
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [timeLeft, setTimeLeft] = useState(workDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isWorkSession, setIsWorkSession] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [dailyGoal, setDailyGoal] = useState(8);
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [totalFocusTime, setTotalFocusTime] = useState(0);
  const [backgroundMusic, setBackgroundMusic] = useState(null);
  const [musicVolume, setMusicVolume] = useState(0.3);
  const [autoStartBreak, setAutoStartBreak] = useState(false);
  const [autoStartWork, setAutoStartWork] = useState(false);
  const intervalRef = useRef(null);
  const audioRef = useRef(null);
  const musicRef = useRef(null);

  useEffect(() => {
    const savedSessions = [];
    const savedStreak = 0;
    const savedLongestStreak = 0;
    const savedTotalTime = 0;
    const savedDailyGoal = 8;
    
    setSessions(savedSessions);
    setStreak(savedStreak);
    setLongestStreak(savedLongestStreak);
    setTotalFocusTime(savedTotalTime);
    setDailyGoal(savedDailyGoal);
    
    calculateStreak(savedSessions);
  }, []);

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
    
    const newSession = {
      type: isWorkSession ? 'work' : 'break',
      duration: isWorkSession ? workDuration : breakDuration,
      completedAt: new Date().toISOString()
    };
    
    const updatedSessions = [newSession, ...sessions].slice(0, 50);
    setSessions(updatedSessions);
    
    if (isWorkSession) {
      setTotalFocusTime(prev => prev + workDuration);
      calculateStreak(updatedSessions);
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
    setTimeLeft(nextIsWork ? workDuration * 60 : breakDuration * 60);
    
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
    setTimeLeft(isWorkSession ? workDuration * 60 : breakDuration * 60);
  };

  const switchSession = () => {
    setIsRunning(false);
    const nextIsWork = !isWorkSession;
    setIsWorkSession(nextIsWork);
    setTimeLeft(nextIsWork ? workDuration * 60 : breakDuration * 60);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    const total = isWorkSession ? workDuration * 60 : breakDuration * 60;
    return ((total - timeLeft) / total) * 100;
  };

  const applySettings = (work, breakTime, goal) => {
    setWorkDuration(work);
    setBreakDuration(breakTime);
    setDailyGoal(goal);
    setIsRunning(false);
    setTimeLeft(isWorkSession ? work * 60 : breakTime * 60);
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
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    const todaySessions = workSessions.filter(s => new Date(s.completedAt).toDateString() === today);
    const yesterdaySessions = workSessions.filter(s => new Date(s.completedAt).toDateString() === yesterday);
    
    let currentStreak = 0;
    if (todaySessions.length >= dailyGoal) {
      currentStreak++;
      if (yesterdaySessions.length >= dailyGoal) {
        let checkDate = new Date(Date.now() - 172800000);
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

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />

      <div className="relative z-10 min-h-screen p-4 flex items-center justify-center">
        <div className="w-full max-w-md">
          {/* Settings Modal */}
          {showSettings && (
            <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-purple-500/30 rounded-3xl p-6 w-full max-w-sm shadow-2xl shadow-purple-500/20 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Settings className="w-5 h-5 text-purple-400" />
                    Settings
                  </h3>
                  <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white">
                    <span className="text-2xl">×</span>
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">
                      Focus Duration (minutes)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      defaultValue={workDuration}
                      id="work-input"
                      className="w-full px-4 py-3 bg-slate-800 border border-purple-500/30 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">
                      Break Duration (minutes)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      defaultValue={breakDuration}
                      id="break-input"
                      className="w-full px-4 py-3 bg-slate-800 border border-purple-500/30 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">
                      Daily Goal (sessions)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      defaultValue={dailyGoal}
                      id="goal-input"
                      className="w-full px-4 py-3 bg-slate-800 border border-purple-500/30 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-purple-500/20">
                    <span className="text-sm font-medium text-gray-300">Notification Sound</span>
                    <button
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className={`relative w-14 h-7 rounded-full transition-all ${
                        soundEnabled ? 'bg-gradient-to-r from-purple-500 to-cyan-500' : 'bg-slate-700'
                      }`}
                    >
                      <div className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform shadow-lg ${
                        soundEnabled ? 'translate-x-7' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-purple-500/20">
                    <span className="text-sm font-medium text-gray-300">Auto-start Breaks</span>
                    <button
                      onClick={() => setAutoStartBreak(!autoStartBreak)}
                      className={`relative w-14 h-7 rounded-full transition-all ${
                        autoStartBreak ? 'bg-gradient-to-r from-purple-500 to-cyan-500' : 'bg-slate-700'
                      }`}
                    >
                      <div className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform shadow-lg ${
                        autoStartBreak ? 'translate-x-7' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-purple-500/20">
                    <span className="text-sm font-medium text-gray-300">Auto-start Work</span>
                    <button
                      onClick={() => setAutoStartWork(!autoStartWork)}
                      className={`relative w-14 h-7 rounded-full transition-all ${
                        autoStartWork ? 'bg-gradient-to-r from-purple-500 to-cyan-500' : 'bg-slate-700'
                      }`}
                    >
                      <div className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform shadow-lg ${
                        autoStartWork ? 'translate-x-7' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">
                      Background Music
                    </label>
                    <select
                      value={backgroundMusic || 'none'}
                      onChange={(e) => {
                        const value = e.target.value === 'none' ? null : e.target.value;
                        setBackgroundMusic(value);
                        stopBackgroundMusic();
                      }}
                      className="w-full px-4 py-3 bg-slate-800 border border-purple-500/30 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                    >
                      <option value="none">None</option>
                      <option value="lofi">Lo-fi Beats</option>
                      <option value="nature">Nature Sounds</option>
                      <option value="ambient">Ambient</option>
                    </select>
                  </div>
                  {backgroundMusic && (
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">
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
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  )}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setShowSettings(false)}
                      className="flex-1 px-4 py-3 border border-gray-600 text-gray-300 rounded-xl hover:bg-slate-800 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        const work = parseInt(document.getElementById('work-input').value);
                        const breakTime = parseInt(document.getElementById('break-input').value);
                        const goal = parseInt(document.getElementById('goal-input').value);
                        applySettings(work, breakTime, goal);
                      }}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-xl hover:from-purple-500 hover:to-cyan-500 transition shadow-lg shadow-purple-500/30"
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
            <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-purple-500/30 rounded-3xl p-6 w-full max-w-sm max-h-96 overflow-y-auto shadow-2xl shadow-purple-500/20">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <History className="w-5 h-5 text-cyan-400" />
                    Session History
                  </h3>
                  <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-white">
                    <span className="text-2xl">×</span>
                  </button>
                </div>
                {sessions.length === 0 ? (
                  <div className="text-center py-8">
                    <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No sessions completed yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sessions.map((session, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/50 border border-purple-500/20 rounded-xl hover:bg-slate-800 transition">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${session.type === 'work' ? 'bg-purple-500/20' : 'bg-cyan-500/20'}`}>
                            {session.type === 'work' ? (
                              <Zap className="w-4 h-4 text-purple-400" />
                            ) : (
                              <Coffee className="w-4 h-4 text-cyan-400" />
                            )}
                          </div>
                          <div>
                            <span className="font-medium text-white capitalize">{session.type}</span>
                            <span className="text-sm text-gray-400 ml-2">{session.duration}m</span>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(session.completedAt).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Main Timer Card */}
          <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-purple-500/30 rounded-3xl shadow-2xl shadow-purple-500/20 p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className={`relative p-2 rounded-xl ${isWorkSession ? 'bg-gradient-to-br from-purple-600 to-pink-600' : 'bg-gradient-to-br from-cyan-600 to-blue-600'}`}>
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
                  <h2 className="text-lg font-bold text-white">
                    {isWorkSession ? 'Focus Mode' : 'Break Time'}
                  </h2>
                  <p className="text-xs text-gray-400">
                    {isWorkSession ? 'Deep work session' : 'Recharge your energy'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowHistory(true)}
                  className="p-2.5 hover:bg-slate-800 rounded-xl transition border border-purple-500/20 hover:border-purple-500/50"
                >
                  <History className="w-5 h-5 text-gray-400 hover:text-cyan-400 transition" />
                </button>
                <button
                  onClick={() => setShowSettings(true)}
                  className="p-2.5 hover:bg-slate-800 rounded-xl transition border border-purple-500/20 hover:border-purple-500/50"
                >
                  <Settings className="w-5 h-5 text-gray-400 hover:text-purple-400 transition" />
                </button>
              </div>
            </div>

            {/* Progress Ring */}
            <div className="relative w-72 h-72 mx-auto mb-8">
              <div className={`absolute inset-0 rounded-full ${isWorkSession ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20' : 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20'} blur-2xl`} />
              
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
                  stroke="#1e293b"
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
                  <div className="text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent mb-2 tracking-tight">
                    {formatTime(timeLeft)}
                  </div>
                  <div className="text-sm text-gray-400 font-medium">
                    {isWorkSession ? 'Deep Focus Active' : 'Recovery Mode'}
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    {Math.round(getProgress())}% Complete
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <button
                onClick={resetTimer}
                className="p-4 bg-slate-800 hover:bg-slate-700 border border-purple-500/30 rounded-2xl transition shadow-lg"
              >
                <RotateCcw className="w-6 h-6 text-gray-400 hover:text-white transition" />
              </button>
              <button
                onClick={toggleTimer}
                className={`relative p-8 rounded-2xl transition shadow-2xl group ${
                  isWorkSession 
                    ? 'bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-purple-500/50' 
                    : 'bg-gradient-to-br from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-cyan-500/50'
                }`}
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 group-hover:opacity-20 transition blur" />
                {isRunning ? (
                  <Pause className="w-8 h-8 text-white relative z-10" />
                ) : (
                  <Play className="w-8 h-8 text-white ml-1 relative z-10" />
                )}
              </button>
              <button
                onClick={switchSession}
                className="p-4 bg-slate-800 hover:bg-slate-700 border border-purple-500/30 rounded-2xl transition shadow-lg"
              >
                {isWorkSession ? (
                  <Coffee className="w-6 h-6 text-gray-400 hover:text-cyan-400 transition" />
                ) : (
                  <Zap className="w-6 h-6 text-gray-400 hover:text-purple-400 transition" />
                )}
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 pt-6 border-t border-purple-500/20 mb-6">
              <div className="text-center p-4 bg-slate-800/30 rounded-xl border border-purple-500/20">
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {getTodayStats()}
                </div>
                <div className="text-xs text-gray-500 mt-1 font-medium">Today</div>
              </div>
              <div className="text-center p-4 bg-slate-800/30 rounded-xl border border-cyan-500/20">
                <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  {sessions.filter(s => s.type === 'work').length}
                </div>
                <div className="text-xs text-gray-500 mt-1 font-medium">Total</div>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="space-y-3">
              {/* Daily Goal Progress */}
              <div className="p-4 bg-slate-800/30 rounded-xl border border-purple-500/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-medium text-gray-300">Daily Goal</span>
                  </div>
                  <span className="text-sm text-gray-400">{getTodayStats()}/{dailyGoal}</span>
                </div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                    style={{ width: `${getDailyProgress()}%` }}
                  />
                </div>
              </div>

              {/* Streak & Total Time */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-slate-800/30 rounded-xl border border-orange-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span className="text-xs text-gray-400">Streak</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-400">{streak}</div>
                  <div className="text-xs text-gray-500">Best: {longestStreak}</div>
                </div>
                <div className="p-4 bg-slate-800/30 rounded-xl border border-green-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Award className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-gray-400">Focus Time</span>
                  </div>
                  <div className="text-2xl font-bold text-green-400">{formatTotalTime()}</div>
                </div>
              </div>

              {/* Background Music Control */}
              {backgroundMusic && (
                <div className="p-4 bg-slate-800/30 rounded-xl border border-cyan-500/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Music className="w-4 h-4 text-cyan-400" />
                      <span className="text-sm font-medium text-gray-300">
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
                      className="p-2 hover:bg-slate-700 rounded-lg transition"
                    >
                      {musicRef.current && !musicRef.current.paused ? (
                        <Volume2 className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <VolumeX className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info Note */}
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900/50 backdrop-blur-sm border border-purple-500/30 rounded-full">
              <Zap className="w-4 h-4 text-purple-400" />
              <p className="text-sm text-gray-300">Powered by Pomodoro Technique</p>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Background timer • Smart notifications • Progress tracking
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PomodoroTimer;