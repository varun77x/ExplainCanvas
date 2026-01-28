import React from 'react';

const RecordingControls = ({ 
  isRecording, 
  onStartRecording, 
  onStopRecording, 
  onSendQuery,
  hasRecording,
  userQuery,
  setUserQuery,
  isLoading
}) => {
  return (
    <div className="px-3 py-2 bg-transparent">
      <div className="min-h-[30px] flex items-center justify-center mb-3 hidden">
        {isRecording && (
          <div className="flex items-center gap-3 text-red-400 font-bold">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></span>
            <span>Recording...</span>
          </div>
        )}
        {!isRecording && hasRecording && (
          <div className="flex items-center gap-2 text-green-400 font-bold">
            <span>✓</span>
            <span>Recording ready to send</span>
          </div>
        )}
      </div>

      <div className="flex justify-center mb-3">
        {!isRecording ? (
          <button 
            className="flex items-center gap-2 px-6 py-1 bg-gray-200 text-gray-900 rounded-lg font-bold shadow-xl hover:shadow-2xl hover:scale-105 transform transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onStartRecording}
            disabled={isLoading}
          >
            🎤 Start Recording
          </button>
        ) : (
          <button 
            className="flex items-center gap-2 px-6 py-1 bg-gray-200 text-gray-900 rounded-lg font-bold shadow-xl hover:shadow-2xl hover:scale-105 transform transition-all duration-200"
            onClick={onStopRecording}
          >
            ⏹️ Stop Recording
          </button>
        )}
      </div>

      {hasRecording && !isRecording && (
        <div className="space-y-3">
          <textarea
            className="w-full px-4 py-3 border border-gray-600 bg-gray-900 text-white rounded-lg focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 outline-none transition-all resize-none disabled:opacity-50 placeholder-gray-500"
            placeholder="Ask a question or add a comment about your diagram..."
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            disabled={isLoading}
            rows={3}
          />
          <button 
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-bold shadow-xl hover:shadow-2xl hover:scale-105 transform transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            onClick={onSendQuery}
            disabled={isLoading || !userQuery.trim()}
          >
            {isLoading ? '⏳ Sending...' : '🚀 Stop & Send Query'}
          </button>
        </div>
      )}
    </div>
  );
};

export default RecordingControls;
