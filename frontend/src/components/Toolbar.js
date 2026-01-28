import React from 'react';

const Toolbar = ({ 
  tool, 
  setTool, 
  color, 
  setColor, 
  strokeWidth, 
  setStrokeWidth,
  onUndo,
  onRedo,
  onClear,
  panMode,
  onTogglePanMode
}) => {
  const tools = [
    { id: 'select', icon: '↖', label: 'Selection' },
    { id: 'pencil', icon: '✏', label: 'Draw' },
    { id: 'rectangle', icon: '□', label: 'Rectangle' },
    { id: 'circle', icon: '○', label: 'Ellipse' },
    { id: 'arrow', icon: '→', label: 'Arrow' },
    { id: 'line', icon: '—', label: 'Line' },
    { id: 'text', icon: 'A', label: 'Text' },
    { id: 'eraser', icon: '⌫', label: 'Eraser' }
  ];

  const colors = [
    { value: '#000000', label: 'Black' },
    { value: '#e03131', label: 'Red' },
    { value: '#2f9e44', label: 'Green' },
    { value: '#1971c2', label: 'Blue' },
    { value: '#f08c00', label: 'Orange' },
    { value: '#e64980', label: 'Pink' },
    { value: '#9c36b5', label: 'Purple' },
  ];

  const strokeSizes = [
    { value: 1, label: 'Thin', display: 'S' },
    { value: 2, label: 'Medium', display: 'M' },
    { value: 4, label: 'Bold', display: 'L' },
    { value: 6, label: 'Extra Bold', display: 'XL' }
  ];

  return (
    <div className="absolute top-4 left-4 z-50">
      {/* Main Toolbar */}
      <div className="flex items-center gap-2 bg-white rounded-lg shadow-lg border border-gray-200 p-2">
        {/* Tools Section */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
          {tools.map(t => (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              title={t.label}
              className={`w-9 h-9 flex items-center justify-center rounded text-lg transition-all ${
                tool === t.id 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              {t.icon}
            </button>
          ))}
        </div>

        {/* History Controls */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
          <button
            onClick={onTogglePanMode}
            title={panMode ? "Pan Mode: ON (Click to disable)" : "Pan Mode: OFF (Click to enable)"}
            className={`w-9 h-9 flex items-center justify-center rounded transition-all ${
              panMode 
                ? 'bg-green-100 text-green-600' 
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            ✋
          </button>
          <button
            onClick={onUndo}
            title="Undo (Ctrl+Z)"
            className="w-9 h-9 flex items-center justify-center rounded hover:bg-gray-100 text-gray-700 transition-all"
          >
            ↶
          </button>
          <button
            onClick={onRedo}
            title="Redo (Ctrl+Y)"
            className="w-9 h-9 flex items-center justify-center rounded hover:bg-gray-100 text-gray-700 transition-all"
          >
            ↷
          </button>
        </div>

        {/* Stroke Color */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
          <div className="text-xs text-gray-500 font-medium px-1">Stroke</div>
          {colors.map(c => (
            <button
              key={c.value}
              onClick={() => setColor(c.value)}
              title={c.label}
              className={`w-7 h-7 rounded border-2 transition-all ${
                color === c.value 
                  ? 'border-blue-500 scale-110' 
                  : 'border-gray-300 hover:scale-110'
              }`}
              style={{ backgroundColor: c.value }}
            />
          ))}
        </div>

        {/* Stroke Width */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
          <div className="text-xs text-gray-500 font-medium px-1">Size</div>
          {strokeSizes.map(w => (
            <button
              key={w.value}
              onClick={() => setStrokeWidth(w.value)}
              title={w.label}
              className={`w-9 h-9 flex items-center justify-center rounded text-xs font-bold transition-all ${
                strokeWidth === w.value 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              {w.display}
            </button>
          ))}
        </div>

        {/* Clear Button */}
        <button
          onClick={onClear}
          title="Clear canvas"
          className="w-9 h-9 flex items-center justify-center rounded hover:bg-red-50 hover:text-red-600 text-gray-700 transition-all"
        >
          🗑
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
