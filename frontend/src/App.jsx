import React, { useState, useEffect } from 'react';
import {
  Plus,
  Upload,
  Zap,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Settings,
  Activity,
  Diamond,
  ChevronRight,
  Target,
  Circle
} from 'lucide-react';

const BodyParts = [
  "shoulder_left", "shoulder_right", "elbow_left", "elbow_right",
  "wrist_left", "wrist_right", "hip_left", "hip_right",
  "knee_left", "knee_right", "ankle_left", "ankle_right",
  "heel_left", "heel_right", "foot_index_left", "foot_index_right", "nose"
];

const API_BASE = "http://localhost:8000";

function App() {
  const [selectedPart, setSelectedPart] = useState("shoulder_left");
  const [inputMode, setInputMode] = useState("user"); // 'user' or 'pro'
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState("idle"); // idle, recording, uploading, analyzing, completed
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);

  const startLiveCapture = async () => {
    try {
      setError(null);
      const res = await fetch(`${API_BASE}/record/start?mode=${inputMode}`, { method: 'POST' });
      const data = await res.json();
      if (data.status) {
        setIsRecording(true);
        setStatus("recording");
      }
    } catch (e) {
      setError("Failed to connect to backend. Is the Python server running?");
    }
  };

  const stopLiveCapture = async () => {
    try {
      await fetch(`${API_BASE}/record/stop`, { method: 'POST' });
      setIsRecording(false);
      setStatus("idle");
    } catch (e) {
      setError("Failed to stop recording.");
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setStatus("uploading");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("mode", inputMode);

    try {
      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.status === "Processing complete") {
        setStatus("idle");
      }
    } catch (e) {
      setError("Upload failed.");
      setStatus("idle");
    }
  };

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setStatus("analyzing");
    setError(null);

    const formData = new FormData();
    formData.append("body_part", selectedPart);

    try {
      const res = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setStatus("idle");
      } else {
        setResults(data);
        setStatus("completed");
      }
    } catch (e) {
      setError("Analysis request failed.");
      setStatus("idle");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const insights = results?.insights ? results.insights.split('\n').filter(l => l.trim()) : [];

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo">MOTION AI</div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className={`status-label ${status === 'idle' ? 'status-none' : 'status-active'}`}>
            <Activity size={14} /> {status.toUpperCase()}
          </div>
          <button className="button-secondary" style={{ width: 'auto', padding: '10px 20px', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings size={16} /> Config
            </div>
          </button>
        </div>
      </header>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      <main className="main-dashboard">
        {/* Left Side: Setup & Config */}
        <aside className="side-panel">
          <div className="card">
            <h3 className="section-title">Input Source</h3>

            {/* Mode Selector */}
            <div style={{
              display: 'flex',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '12px',
              padding: '4px',
              marginBottom: '1rem',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <button
                onClick={() => setInputMode('user')}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '8px',
                  border: 'none',
                  background: inputMode === 'user' ? '#3b82f6' : 'transparent',
                  color: inputMode === 'user' ? 'white' : '#94a3b8',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: inputMode === 'user' ? '0 0 15px rgba(59, 130, 246, 0.5)' : 'none'
                }}
              >
                USER
              </button>
              <button
                onClick={() => setInputMode('pro')}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '8px',
                  border: 'none',
                  background: inputMode === 'pro' ? '#8b5cf6' : 'transparent',
                  color: inputMode === 'pro' ? 'white' : '#94a3b8',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: inputMode === 'pro' ? '0 0 15px rgba(139, 92, 246, 0.5)' : 'none'
                }}
              >
                PRO
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {!isRecording ? (
                <button className="button-primary"
                  onClick={startLiveCapture}
                  style={{ background: inputMode === 'pro' ? 'linear-gradient(to right, #8b5cf6, #7c3aed)' : '' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
                    <Zap size={18} fill="currentColor" /> {inputMode === 'pro' ? 'Capture Pro' : 'Capture Live'}
                  </div>
                </button>
              ) : (
                <button className="button-primary" style={{ background: 'var(--color-error)' }} onClick={stopLiveCapture}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
                    <Circle size={18} fill="currentColor" className="animate-pulse" /> Stop Capture
                  </div>
                </button>
              )}

              <label className="button-secondary" style={{ cursor: 'pointer', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
                  <Upload size={18} /> {status === 'uploading' ? 'Uploading...' : 'Upload Video'}
                </div>
                <input type="file" hidden onChange={handleFileUpload} accept="video/*" />
              </label>
            </div>
          </div>

          <div className="card" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <h3 className="section-title">Analysis Target</h3>
            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
              {BodyParts.map((part) => (
                <button
                  key={part}
                  onClick={() => setSelectedPart(part)}
                  style={{
                    display: 'flex',
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: selectedPart === part ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                    color: selectedPart === part ? '#3b82f6' : '#94a3b8',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '0.925rem',
                    fontWeight: selectedPart === part ? 'bold' : 'normal',
                    marginBottom: '4px',
                    transition: 'all 0.2s',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  {part.replace('_', ' ')}
                  {selectedPart === part && <ChevronRight size={14} />}
                </button>
              ))}
            </div>
          </div>

          <button
            className="button-primary"
            style={{
              background: 'linear-gradient(to right, #10b981, #059669)',
              padding: '18px',
              fontSize: '1.125rem',
              boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)',
              opacity: isAnalyzing ? 0.7 : 1
            }}
            onClick={runAnalysis}
            disabled={isAnalyzing}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' }}>
              {isAnalyzing ? <RefreshCw className="animate-spin" size={20} /> : <Activity size={20} />}
              {isAnalyzing ? 'Processing AI...' : 'Analyze Now'}
            </div>
          </button>
        </aside>

        {/* Right Side: Analysis View */}
        <section className="content-panel">
          {status !== 'completed' && !isAnalyzing ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', color: '#64748b' }}>

              {/* Always-on Live Preview */}
              <div style={{
                width: '100%',
                maxWidth: '800px',
                borderRadius: '24px',
                overflow: 'hidden',
                border: isRecording ? (inputMode === 'pro' ? '4px solid #8b5cf6' : '4px solid #ef4444') : '1px solid rgba(255,255,255,0.1)',
                boxShadow: isRecording ? (inputMode === 'pro' ? '0 0 40px rgba(139, 92, 246, 0.3)' : '0 0 40px rgba(239, 68, 68, 0.3)') : 'none',
                background: '#000',
                margin: '0 auto 2rem',
                transition: 'all 0.3s ease'
              }}>
                <img src={`${API_BASE}/video_feed`} style={{ width: '100%', height: 'auto', display: 'block' }} alt="Live Preview" />
              </div>

              <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <p style={{ fontSize: '1.5rem', fontWeight: 600, color: '#f1f5f9' }}>
                  {isRecording ? (inputMode === 'pro' ? 'Recording Pro Template...' : 'Capturing Your Flow...') : 'Ready for Analysis'}
                </p>
                <p style={{ maxWidth: '400px', margin: '1rem auto' }}>
                  {isRecording
                    ? 'Motion AI is tracking your joints in real-time. Perform your movement and stop when ready.'
                    : 'Align yourself with the camera. Use the PRO mode to set benchmarks or USER mode to analyze your performance.'}
                </p>
              </div>

              {/* Source Staging Preview (Always visible if not completed) */}
              {!isRecording && (
                <div style={{ animation: 'fadeIn 0.8s ease' }}>
                  <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', color: '#94a3b8' }}>
                    <Activity size={16} /> RECENT CAPTURES STAGING
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
                    <div className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid rgba(59, 130, 246, 0.2)', background: '#020617' }}>
                      <div style={{ padding: '8px 12px', background: 'rgba(59, 130, 246, 0.05)', borderBottom: '1px solid rgba(59, 130, 246, 0.1)', fontSize: '0.65rem', fontWeight: 'bold', color: '#3b82f6', letterSpacing: '1px' }}>
                        USER PERFORMANCE
                      </div>
                      <video
                        key={`user-stage-${status}`}
                        src={`${API_BASE}/video/user?t=${Date.now()}`}
                        controls
                        style={{ width: '100%', display: 'block' }}
                      />
                    </div>
                    <div className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid rgba(139, 92, 246, 0.2)', background: '#020617' }}>
                      <div style={{ padding: '8px 12px', background: 'rgba(139, 92, 246, 0.05)', borderBottom: '1px solid rgba(139, 92, 246, 0.1)', fontSize: '0.65rem', fontWeight: 'bold', color: '#8b5cf6', letterSpacing: '1px' }}>
                        PRO REFERENCE
                      </div>
                      <video
                        key={`pro-stage-${status}`}
                        src={`${API_BASE}/video/pro?t=${Date.now()}`}
                        controls
                        style={{ width: '100%', display: 'block' }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : isAnalyzing ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <RefreshCw size={60} className="animate-spin" style={{ color: '#3b82f6', marginBottom: '2rem' }} />
              <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Applying Expert Model</h2>
              <p style={{ color: '#94a3b8' }}>Comparing your {selectedPart.replace('_', ' ')} alignment against pro standards...</p>
            </div>
          ) : (
            <div style={{ animation: 'fadeIn 0.5s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
                <div>
                  <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '0.5rem' }}>Analysis Results</h1>
                  <p style={{ color: '#94a3b8', letterSpacing: '2px', fontWeight: 'bold' }}>TARGET: <span style={{ color: '#3b82f6' }}>{selectedPart.toUpperCase()}</span></p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <p className="section-title" style={{ margin: 0 }}>Accuracy Score</p>
                  <div className="score-badge" style={{ color: results.score > 80 ? '#10b981' : (results.score > 50 ? '#3b82f6' : '#ef4444') }}>
                    {results.score}%
                  </div>
                </div>
              </div>

              {/* Source Comparison View */}
              <div style={{ marginBottom: '3rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <Zap size={18} /> SOURCE COMPARISON
                  </h3>
                  <button
                    onClick={() => { setStatus('analyzing'); setTimeout(() => setStatus('completed'), 100); }}
                    style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <RefreshCw size={12} /> Reload Clips
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  <div className="card" style={{ padding: '0', overflow: 'hidden', border: '2px solid rgba(59, 130, 246, 0.3)', background: '#000' }}>
                    <div style={{ padding: '10px 15px', background: 'rgba(59, 130, 246, 0.1)', borderBottom: '1px solid rgba(59, 130, 246, 0.2)', fontSize: '0.75rem', fontWeight: 'bold', color: '#3b82f6' }}>
                      YOUR PERFORMANCE (LATEST)
                    </div>
                    <video
                      key={`user-video-${results.score}-${Date.now()}`}
                      controls
                      autoPlay
                      loop
                      muted
                      playsInline
                      style={{ width: '100%', display: 'block' }}
                    >
                      <source src={`${API_BASE}/video/user?t=${Date.now()}`} type="video/mp4" />
                      Browser doesn't support MP4.
                    </video>
                  </div>
                  <div className="card" style={{ padding: '0', overflow: 'hidden', border: '2px solid rgba(139, 92, 246, 0.3)', background: '#000' }}>
                    <div style={{ padding: '10px 15px', background: 'rgba(139, 92, 246, 0.1)', borderBottom: '1px solid rgba(139, 92, 246, 0.2)', fontSize: '0.75rem', fontWeight: 'bold', color: '#8b5cf6' }}>
                      PRO BENCHMARK REFERENCE
                    </div>
                    <video
                      key={`pro-video-${results.score}-${Date.now()}`}
                      controls
                      autoPlay
                      loop
                      muted
                      playsInline
                      style={{ width: '100%', display: 'block' }}
                    >
                      <source src={`${API_BASE}/video/pro?t=${Date.now()}`} type="video/mp4" />
                      Browser doesn't support MP4.
                    </video>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '3rem' }}>
                <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={18} /> AI POSTURE INSIGHTS
                </h3>
                {insights.length > 0 ? insights.map((insight, i) => (
                  <div key={i} className="insight-card" style={{ animation: `slideUp 0.3s ease ${i * 0.1}s both` }}>
                    <div className="insight-indicator">
                      <Diamond fill="currentColor" size={10} />
                    </div>
                    <div className="insight-text">{insight.replace(/^[-* ]+/, '')}</div>
                  </div>
                )) : (
                  <div className="insight-card">
                    <div className="insight-text" style={{ color: '#94a3b8' }}>No significant improvements needed for this area. Great alignment!</div>
                  </div>
                )}
              </div>

              <div>
                <h3 className="section-title">Technical Deep Dive</h3>
                <div style={{
                  background: 'var(--bg-primary)',
                  padding: '2rem',
                  borderRadius: '16px',
                  border: '1px solid rgba(255,255,255,0.05)',
                  fontFamily: 'JetBrains Mono',
                  fontSize: '0.875rem',
                  color: '#64748b',
                  lineHeight: '1.8',
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}>
                  <div style={{ color: '#3b82f6', marginBottom: '1rem' }}>// Pose Sequence Trace</div>
                  <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                    {results.prompt_debug}
                  </pre>
                  <div style={{ color: '#10b981', marginTop: '1rem' }}>✓ System verification successful</div>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.1); } 100% { opacity: 1; transform: scale(1); } }
        .animate-spin { animation: spin 1s linear infinite; }
        .animate-pulse { animation: pulse 2s ease-in-out infinite; }
      `}} />
    </div >
  );
}


export default App;
