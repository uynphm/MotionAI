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

  const [selectedInsight, setSelectedInsight] = useState(null);

  const insights = results?.insights
    ? results.insights.split('\n')
      .filter(l => {
        const line = l.trim();
        // Skip empty lines, lines ending with colon (headers), or lines that are just headers
        if (!line) return false;
        if (line.endsWith(':')) return false;
        if (line.toLowerCase().includes('postural strength') && line.length < 25) return false;
        if (line.toLowerCase().includes('form correction') && line.length < 25) return false;
        return true;
      })
      .map(l => l.replace(/^\s*[-*•\d+.]\s*/, '').replace(/\*\*/g, '').trim())
    : [];

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

              {/* Coaching Board (Grid Layout) */}
              <div style={{ marginBottom: '3.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
                  <ShieldCheck size={28} color="#3b82f6" />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#f1f5f9', fontWeight: '800' }}>COACHING BOARD</h3>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Skeletal alignment breakdown for your {selectedPart.replace('_', ' ')}</p>
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                  gap: '1.5rem'
                }}>
                  {insights.length > 0 ? insights.slice(0, 10).map((insight, i) => {
                    const isCorrection = insight.toLowerCase().includes('should') || insight.toLowerCase().includes('not') || insight.toLowerCase().includes('mismatch') || insight.toLowerCase().includes('error') || insight.toLowerCase().includes('correction') || insight.toLowerCase().includes('incorrect');
                    return (
                      <div
                        key={i}
                        className="card"
                        onClick={() => setSelectedInsight({ text: insight, isCorrection })}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '16px',
                          padding: '24px',
                          cursor: 'pointer',
                          border: isCorrection ? '1px solid rgba(239, 68, 68, 0.1)' : '1px solid rgba(16, 185, 129, 0.1)',
                          background: isCorrection ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.05), transparent)' : 'linear-gradient(135deg, rgba(16, 185, 129, 0.05), transparent)',
                          animation: `slideUp 0.4s ease ${i * 0.1}s both`,
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-5px)';
                          e.currentTarget.style.boxShadow = isCorrection ? '0 10px 30px rgba(239, 68, 68, 0.1)' : '0 10px 30px rgba(16, 185, 129, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '0.65rem',
                          fontWeight: 'bold',
                          letterSpacing: '0.5px',
                          alignSelf: 'flex-start',
                          background: isCorrection ? '#ef4444' : '#10b981',
                          color: 'white'
                        }}>
                          {isCorrection ? <AlertCircle size={10} /> : <ShieldCheck size={10} />}
                          {isCorrection ? 'CORRECTION' : 'STRENGTH'}
                        </div>
                        <div style={{ fontSize: '1.05rem', color: '#f1f5f9', lineHeight: '1.6', fontWeight: '500' }}>
                          {insight}
                        </div>
                        <div style={{ marginTop: 'auto', fontSize: '0.7rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          Click to expand <ChevronRight size={10} />
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: '#64748b' }}>
                      <Activity size={40} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                      <p>No anomalies detected. Performance is within acceptable professional margins.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Insight Modal */}
              {selectedInsight && (
                <div style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(2, 6, 23, 0.95)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1000,
                  padding: '2rem',
                  backdropFilter: 'blur(10px)',
                  animation: 'fadeIn 0.2s ease'
                }} onClick={() => setSelectedInsight(null)}>
                  <div style={{
                    maxWidth: '600px',
                    width: '100%',
                    background: '#0f172a',
                    borderRadius: '24px',
                    border: `1px solid ${selectedInsight.isCorrection ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`,
                    padding: '3rem',
                    position: 'relative',
                    boxShadow: `0 30px 60px rgba(0,0,0,0.5), 0 0 100px ${selectedInsight.isCorrection ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.05)'}`,
                    animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                  }} onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => setSelectedInsight(null)}
                      style={{
                        position: 'absolute',
                        top: '1.5rem',
                        right: '1.5rem',
                        background: 'rgba(255,255,255,0.05)',
                        border: 'none',
                        color: '#94a3b8',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Plus style={{ transform: 'rotate(45deg)' }} />
                    </button>

                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      background: selectedInsight.isCorrection ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      color: selectedInsight.isCorrection ? '#ef4444' : '#10b981',
                      marginBottom: '2rem'
                    }}>
                      {selectedInsight.isCorrection ? <AlertCircle size={14} /> : <ShieldCheck size={14} />}
                      {selectedInsight.isCorrection ? 'CORRECTIVE ACTION' : 'STRENGTH IDENTIFIED'}
                    </div>

                    <h2 style={{ fontSize: '1.75rem', color: '#f8fafc', lineHeight: '1.4', margin: 0, fontWeight: '700' }}>
                      {selectedInsight.text}
                    </h2>

                    <div style={{ marginTop: '3rem', padding: '1.5rem', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#475569', letterSpacing: '1px', marginBottom: '1rem' }}>ANALYSIS CONTEXT</div>
                      <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.6' }}>
                        This feedback was generated by comparing your <strong>{selectedPart.replace('_', ' ')}</strong> coordinates against high-precision DTW paths in the pro benchmark. Focus on this specific area during your next recording.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Technical Details (Collapsed at very bottom) */}
              <details style={{ opacity: 0.4 }}>
                <summary style={{ fontSize: '0.7rem', color: '#475569', cursor: 'pointer', listStyle: 'none' }}>
                  Technical Trace
                </summary>
                <pre style={{
                  fontSize: '0.65rem',
                  padding: '1rem',
                  whiteSpace: 'pre-wrap',
                  background: '#000',
                  borderRadius: '8px',
                  marginTop: '0.5rem'
                }}>
                  {results.prompt_debug}
                </pre>
              </details>
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
