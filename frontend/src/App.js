import React, { useState, useRef } from 'react';
import Canvas from './components/Canvas';
import Toolbar from './components/Toolbar';
import Chat from './components/Chat';
import RecordingControls from './components/RecordingControls';

function App() {
  const canvasRef = useRef(null);
  
  // Drawing state
  const [tool, setTool] = useState('pencil');
  const [color, setColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  
  // Chat state
  const [messages, setMessages] = useState([]);
  const [previousContext, setPreviousContext] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // UI toggle states
  const [isToolbarOpen, setIsToolbarOpen] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [panMode, setPanMode] = useState(false);

  // Undo/Redo
  const handleUndo = () => {
    if (canvasRef.current) {
      canvasRef.current.undo();
    }
  };

  const handleRedo = () => {
    if (canvasRef.current) {
      canvasRef.current.redo();
    }
  };

  const handleClear = () => {
    if (canvasRef.current) {
      canvasRef.current.clear();
    }
  };

  // Pan mode toggle
  const handleTogglePanMode = () => {
    setPanMode(prev => !prev);
  };

  // Recording functions
  const startRecording = async () => {
    try {
      // Get canvas stream
      const canvas = canvasRef.current?.getCanvas();
      if (!canvas) return;
      
      const canvasStream = canvas.captureStream(30);
      
      // Get microphone stream
      const audioStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // Combine streams
      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioStream.getAudioTracks()
      ]);
      
      // Create recorder
      const recorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm;codecs=vp8,opus'
      });
      
      const chunks = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      recorder.onstop = () => {
        setRecordedChunks(chunks);
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Failed to start recording. Please ensure microphone permissions are granted.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      
      // Stop all tracks
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      
      setIsRecording(false);
    }
  };

  const sendQuery = async () => {
    if (recordedChunks.length === 0) {
      alert('Please record something first!');
      return;
    }

    if (!userQuery.trim()) {
      alert('Please enter a question or comment!');
      return;
    }

    setIsLoading(true);

    try {
      // Create video blob
      const videoBlob = new Blob(recordedChunks, { type: 'video/webm' });
      
      // Prepare form data
      const formData = new FormData();
      formData.append('video', videoBlob, 'recording.webm');
      formData.append('previous_context', previousContext);
      formData.append('user_query', userQuery);
      
      // Add user message to chat
      setMessages(prev => [...prev, {
        role: 'user',
        content: userQuery,
        timestamp: new Date().toLocaleTimeString()
      }]);
      
      // Send to backend
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Add AI response to chat
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString()
      }]);
      
      // Update context
      setPreviousContext(data.new_context_summary);
      
      // Clear query and recorded chunks
      setUserQuery('');
      setRecordedChunks([]);
      
    } catch (error) {
      console.error('Error sending query:', error);
      alert('Failed to send query. Please ensure the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex relative overflow-hidden bg-gray-50">
      {/* Fullscreen Canvas */}
      <div className="absolute inset-0 z-0">
        <Canvas
          ref={canvasRef}
          tool={tool}
          color={color}
          strokeWidth={strokeWidth}
          panMode={panMode}
        />
      </div>
      
      {/* Top-left Logo */}
      <div className="absolute top-4 left-4 z-40">
        <div className="flex items-center gap-2 bg-white rounded-lg shadow-md border border-gray-200 px-3 py-2">
          <span className="text-xl font-bold text-blue-600">ExplainCanvas</span>
        </div>
      </div>
      
      {/* Toolbar */}
      <Toolbar
        tool={tool}
        setTool={setTool}
        color={color}
        setColor={setColor}
        strokeWidth={strokeWidth}
        setStrokeWidth={setStrokeWidth}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClear={handleClear}
        panMode={panMode}
        onTogglePanMode={handleTogglePanMode}
      />
      
      {/* AI Chat Toggle Button */}
      <button 
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="absolute top-4 right-4 z-40 px-4 py-2 bg-white hover:bg-gray-100 text-gray-900 border border-gray-300 rounded-lg shadow-md transition-all flex items-center gap-2"
        title="Toggle AI Assistant"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        AI Chat
      </button>
      
      {/* Chat Panel */}
      {isChatOpen && (
        <div className="absolute top-16 right-4 bottom-4 w-96 z-40">
          <div className="h-full bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col">
            <Chat messages={messages} isLoading={isLoading} />
          </div>
        </div>
      )}
      
      {/* Recording Controls - Bottom Center */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40">
        <RecordingControls
          isRecording={isRecording}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          onSendQuery={sendQuery}
          hasRecording={recordedChunks.length > 0}
          userQuery={userQuery}
          setUserQuery={setUserQuery}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

export default App;
