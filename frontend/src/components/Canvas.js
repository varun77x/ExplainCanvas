import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';

const Canvas = forwardRef(({ tool, color, strokeWidth, panMode }, ref) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const contextRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPoint, setLastPoint] = useState(null);
  const [elements, setElements] = useState([]);
  const [currentElement, setCurrentElement] = useState(null);
  const [history, setHistory] = useState([[]]);
  const [historyStep, setHistoryStep] = useState(0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [startPanOffset, setStartPanOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [textInput, setTextInput] = useState(null);
  const [cursorPos, setCursorPos] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const isHistoryAction = useRef(false);
  const touchStartDistance = useRef(null);
  const lastTouchCenter = useRef(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Prevent all browser zoom behaviors
    const preventZoom = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };

    // Prevent pinch-to-zoom on the page
    const preventTouchZoom = (e) => {
      if (e.scale && e.scale !== 1) {
        e.preventDefault();
      }
    };

    // Add global styles to prevent zoom
    const style = document.createElement('style');
    style.textContent = `
      body {
        touch-action: pan-x pan-y !important;
      }
    `;
    document.head.appendChild(style);

    const updateCanvasSize = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      redrawCanvas();
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    window.addEventListener('wheel', preventZoom, { passive: false });
    document.addEventListener('gesturestart', preventZoom, { passive: false });
    document.addEventListener('gesturechange', preventZoom, { passive: false });
    document.addEventListener('gestureend', preventZoom, { passive: false });
    document.addEventListener('touchmove', preventTouchZoom, { passive: false });

    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.lineCap = 'round';
    context.lineJoin = 'round';
    contextRef.current = context;

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      window.removeEventListener('wheel', preventZoom);
      document.removeEventListener('gesturestart', preventZoom);
      document.removeEventListener('gesturechange', preventZoom);
      document.removeEventListener('gestureend', preventZoom);
      document.removeEventListener('touchmove', preventTouchZoom);
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
  }, []);

  // Redraw whenever elements or current element change
  useEffect(() => {
    redrawCanvas();
  }, [elements, currentElement, panOffset, zoom]);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // Save context state
    context.save();
    
    // Apply transformations
    context.translate(panOffset.x, panOffset.y);
    context.scale(zoom, zoom);

    // Draw all elements
    elements.forEach((element, index) => {
      drawElement(context, element);
      // Draw selection box if this element is selected
      if (selectedElement === index) {
        drawSelectionBox(context, element);
      }
    });

    // Draw current element being created
    if (currentElement) {
      drawElement(context, currentElement, true);
    }

    context.restore();
  };

  const drawElement = (context, element, isPreview = false) => {
    context.strokeStyle = element.color;
    context.lineWidth = element.strokeWidth;
    // Only use preview alpha for shapes, not for freehand drawing
    const useFadedPreview = isPreview && (element.type !== 'pencil' && element.type !== 'eraser');
    context.globalAlpha = useFadedPreview ? 0.5 : 1;

    switch (element.type) {
      case 'pencil':
      case 'eraser':
        context.beginPath();
        element.points.forEach((point, index) => {
          if (index === 0) {
            context.moveTo(point.x, point.y);
          } else {
            context.lineTo(point.x, point.y);
          }
        });
        context.stroke();
        break;

      case 'line':
        context.beginPath();
        context.moveTo(element.x1, element.y1);
        context.lineTo(element.x2, element.y2);
        context.stroke();
        break;

      case 'rectangle':
        context.strokeRect(
          element.x,
          element.y,
          element.width,
          element.height
        );
        break;

      case 'circle':
        context.beginPath();
        context.arc(
          element.x,
          element.y,
          element.radius,
          0,
          2 * Math.PI
        );
        context.stroke();
        break;

      case 'arrow':
        drawArrow(context, element.x1, element.y1, element.x2, element.y2);
        break;

      case 'text':
        context.font = element.font;
        context.fillStyle = element.color;
        context.fillText(element.text, element.x, element.y);
        break;
    }

    context.globalAlpha = 1;
  };

  const drawSelectionBox = (context, element) => {
    context.save();
    context.strokeStyle = '#1971c2';
    context.lineWidth = 2 / zoom;
    context.setLineDash([5 / zoom, 5 / zoom]);
    
    let bounds = getElementBounds(element);
    const padding = 10 / zoom;
    
    context.strokeRect(
      bounds.x - padding,
      bounds.y - padding,
      bounds.width + padding * 2,
      bounds.height + padding * 2
    );
    
    context.restore();
  };

  const getElementBounds = (element) => {
    switch (element.type) {
      case 'pencil':
      case 'eraser':
        const xs = element.points.map(p => p.x);
        const ys = element.points.map(p => p.y);
        return {
          x: Math.min(...xs),
          y: Math.min(...ys),
          width: Math.max(...xs) - Math.min(...xs),
          height: Math.max(...ys) - Math.min(...ys)
        };
      case 'line':
      case 'arrow':
        return {
          x: Math.min(element.x1, element.x2),
          y: Math.min(element.y1, element.y2),
          width: Math.abs(element.x2 - element.x1),
          height: Math.abs(element.y2 - element.y1)
        };
      case 'rectangle':
        return {
          x: element.width < 0 ? element.x + element.width : element.x,
          y: element.height < 0 ? element.y + element.height : element.y,
          width: Math.abs(element.width),
          height: Math.abs(element.height)
        };
      case 'circle':
        return {
          x: element.x - element.radius,
          y: element.y - element.radius,
          width: element.radius * 2,
          height: element.radius * 2
        };
      case 'text':
        return {
          x: element.x,
          y: element.y - element.strokeWidth * 8,
          width: element.text.length * element.strokeWidth * 4,
          height: element.strokeWidth * 10
        };
      default:
        return { x: 0, y: 0, width: 0, height: 0 };
    }
  };

  const isPointInElement = (point, element) => {
    const bounds = getElementBounds(element);
    const padding = 10 / zoom;
    return (
      point.x >= bounds.x - padding &&
      point.x <= bounds.x + bounds.width + padding &&
      point.y >= bounds.y - padding &&
      point.y <= bounds.y + bounds.height + padding
    );
  };

  const drawArrow = (context, x1, y1, x2, y2) => {
    const headLength = 15;
    const angle = Math.atan2(y2 - y1, x2 - x1);

    // Draw the line from start to end
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();

    // Draw arrowhead as filled triangle
    context.save();
    context.beginPath();
    context.moveTo(x2, y2);
    context.lineTo(
      x2 - headLength * Math.cos(angle - Math.PI / 6),
      y2 - headLength * Math.sin(angle - Math.PI / 6)
    );
    context.lineTo(
      x2 - headLength * Math.cos(angle + Math.PI / 6),
      y2 - headLength * Math.sin(angle + Math.PI / 6)
    );
    context.closePath();
    context.fillStyle = context.strokeStyle;
    context.fill();
    context.stroke();
    context.restore();
  };

  const screenToCanvas = (clientX, clientY) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left - panOffset.x) / zoom,
      y: (clientY - rect.top - panOffset.y) / zoom
    };
  };

  const handlePointerDown = (e) => {
    e.preventDefault();
    const point = screenToCanvas(e.clientX, e.clientY);

    // Middle mouse or pan mode for panning
    if (e.button === 1 || (e.button === 0 && panMode)) {
      setIsPanning(true);
      setStartPanOffset({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      return;
    }

    // Handle selection tool
    if (tool === 'select') {
      // Check if clicking on selected element to drag it
      if (selectedElement !== null && isPointInElement(point, elements[selectedElement])) {
        setDragging(true);
        const bounds = getElementBounds(elements[selectedElement]);
        setDragOffset({
          x: point.x - bounds.x,
          y: point.y - bounds.y
        });
        return;
      }
      
      // Find clicked element (search from top to bottom)
      let clickedIndex = -1;
      for (let i = elements.length - 1; i >= 0; i--) {
        if (isPointInElement(point, elements[i])) {
          clickedIndex = i;
          break;
        }
      }
      
      if (clickedIndex >= 0) {
        setSelectedElement(clickedIndex);
        
        // Enable dragging immediately for the newly selected element
        setDragging(true);
        const bounds = getElementBounds(elements[clickedIndex]);
        setDragOffset({ x: point.x - bounds.x, y: point.y - bounds.y });
      } else {
        setSelectedElement(null);
      }
      return;
    }

    // Clear selection when using other tools
    setSelectedElement(null);

    // Handle text tool separately
    if (tool === 'text') {
      setTextInput({
        x: point.x,
        y: point.y,
        screenX: e.clientX,
        screenY: e.clientY,
        value: ''
      });
      return;
    }

    setIsDrawing(true);
    setLastPoint(point);

    if (tool === 'pencil' || tool === 'eraser') {
      const newElement = {
        type: tool,
        color: tool === 'eraser' ? '#ffffff' : color,
        strokeWidth: tool === 'eraser' ? strokeWidth * 4 : strokeWidth,
        points: [point]
      };
      setCurrentElement(newElement);
    } else if (tool === 'line' || tool === 'arrow') {
      const newElement = {
        type: tool,
        color: color,
        strokeWidth: strokeWidth,
        x1: point.x,
        y1: point.y,
        x2: point.x,
        y2: point.y
      };
      setCurrentElement(newElement);
    } else if (tool === 'rectangle') {
      const newElement = {
        type: 'rectangle',
        color: color,
        strokeWidth: strokeWidth,
        x: point.x,
        y: point.y,
        width: 0,
        height: 0
      };
      setCurrentElement(newElement);
    } else if (tool === 'circle') {
      const newElement = {
        type: 'circle',
        color: color,
        strokeWidth: strokeWidth,
        x: point.x,
        y: point.y,
        radius: 0
      };
      setCurrentElement(newElement);
    }
  };

  const handlePointerMove = (e) => {
    e.preventDefault();

    // Always track cursor position for eraser indicator
    if (tool === 'eraser') {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }

    if (isPanning) {
      setPanOffset({
        x: e.clientX - startPanOffset.x,
        y: e.clientY - startPanOffset.y
      });
      return;
    }

    // Handle dragging selected element
    if (dragging && selectedElement !== null && tool === 'select') {
      const point = screenToCanvas(e.clientX, e.clientY);
      const element = elements[selectedElement];
      const newElements = [...elements];
      
      // Calculate new position
      const newX = point.x - dragOffset.x;
      const newY = point.y - dragOffset.y;
      const bounds = getElementBounds(element);
      const dx = newX - bounds.x;
      const dy = newY - bounds.y;
      
      // Update element position
      switch (element.type) {
        case 'pencil':
        case 'eraser':
          newElements[selectedElement] = {
            ...element,
            points: element.points.map(p => ({ x: p.x + dx, y: p.y + dy }))
          };
          break;
        case 'line':
        case 'arrow':
          newElements[selectedElement] = {
            ...element,
            x1: element.x1 + dx,
            y1: element.y1 + dy,
            x2: element.x2 + dx,
            y2: element.y2 + dy
          };
          break;
        case 'rectangle':
          newElements[selectedElement] = {
            ...element,
            x: element.x + dx,
            y: element.y + dy
          };
          break;
        case 'circle':
        case 'text':
          newElements[selectedElement] = {
            ...element,
            x: element.x + dx,
            y: element.y + dy
          };
          break;
      }
      
      setElements(newElements);
      return;
    }

    if (!isDrawing || !currentElement) return;

    const point = screenToCanvas(e.clientX, e.clientY);

    if (tool === 'pencil' || tool === 'eraser') {
      setCurrentElement(prev => ({
        ...prev,
        points: [...prev.points, point]
      }));
    } else if (tool === 'line' || tool === 'arrow') {
      setCurrentElement(prev => ({
        ...prev,
        x2: point.x,
        y2: point.y
      }));
    } else if (tool === 'rectangle') {
      setCurrentElement(prev => ({
        ...prev,
        width: point.x - prev.x,
        height: point.y - prev.y
      }));
    } else if (tool === 'circle') {
      const radius = Math.sqrt(
        Math.pow(point.x - currentElement.x, 2) +
        Math.pow(point.y - currentElement.y, 2)
      );
      setCurrentElement(prev => ({
        ...prev,
        radius: radius
      }));
    }
  };

  const handlePointerUp = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (dragging) {
      setDragging(false);
      return;
    }

    if (isDrawing && currentElement) {
      // Only add element if it has content
      if (
        (currentElement.type === 'pencil' || currentElement.type === 'eraser') && currentElement.points.length > 0 ||
        currentElement.type === 'line' || currentElement.type === 'arrow' ||
        currentElement.type === 'rectangle' || currentElement.type === 'circle'
      ) {
        setElements(prev => [...prev, currentElement]);
      }
      setCurrentElement(null);
    }

    setIsDrawing(false);
    setLastPoint(null);
  };

  const handlePointerLeave = () => {
    setCursorPos(null);
    handlePointerUp();
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(Math.max(0.1, zoom * delta), 5);
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const newPanOffset = {
      x: mouseX - (mouseX - panOffset.x) * (newZoom / zoom),
      y: mouseY - (mouseY - panOffset.y) * (newZoom / zoom)
    };
    
    setPanOffset(newPanOffset);
    setZoom(newZoom);
  };

  const getTouchDistance = (touch1, touch2) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getTouchCenter = (touch1, touch2) => {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    };
  };

  const handleTouchStart = (e) => {
    // Always prevent default on touch to stop browser zoom
    if (e.touches.length >= 2) {
      e.preventDefault();
      e.stopPropagation();
      const distance = getTouchDistance(e.touches[0], e.touches[1]);
      touchStartDistance.current = distance;
      lastTouchCenter.current = getTouchCenter(e.touches[0], e.touches[1]);
    }
  };

  const handleTouchMove = (e) => {
    // Prevent any multi-touch from zooming the page
    if (e.touches.length >= 2) {
      e.preventDefault();
      e.stopPropagation();
      
      if (touchStartDistance.current) {
        const currentDistance = getTouchDistance(e.touches[0], e.touches[1]);
        const scale = currentDistance / touchStartDistance.current;
        const newZoom = Math.min(Math.max(0.1, zoom * scale), 5);
        
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const center = getTouchCenter(e.touches[0], e.touches[1]);
        const canvasX = center.x - rect.left;
        const canvasY = center.y - rect.top;
        
        const newPanOffset = {
          x: canvasX - (canvasX - panOffset.x) * (newZoom / zoom),
          y: canvasY - (canvasY - panOffset.y) * (newZoom / zoom)
        };
        
        setPanOffset(newPanOffset);
        setZoom(newZoom);
        touchStartDistance.current = currentDistance;
        lastTouchCenter.current = center;
      }
    }
  };

  const handleTouchEnd = (e) => {
    if (e.touches.length < 2) {
      touchStartDistance.current = null;
      lastTouchCenter.current = null;
    }
  };

  // Update history when elements change (but not during drawing or undo/redo)
  useEffect(() => {
    if (!isDrawing && !isHistoryAction.current && elements.length >= 0) {
      setHistory(prev => {
        const newHistory = prev.slice(0, historyStep + 1);
        newHistory.push([...elements]);
        return newHistory;
      });
      setHistoryStep(prev => prev + 1);
    }
    isHistoryAction.current = false;
  }, [elements, isDrawing]);

  // Clear cursor position when tool changes
  useEffect(() => {
    if (tool !== 'eraser') {
      setCursorPos(null);
    }
  }, [tool]);

  // Add touch event listeners with passive: false to canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const touchStartCapture = (e) => {
      handleTouchStart(e);
    };
    const touchMoveCapture = (e) => {
      handleTouchMove(e);
    };
    const touchEndCapture = (e) => {
      handleTouchEnd(e);
    };

    canvas.addEventListener('touchstart', touchStartCapture, { passive: false });
    canvas.addEventListener('touchmove', touchMoveCapture, { passive: false });
    canvas.addEventListener('touchend', touchEndCapture, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', touchStartCapture);
      canvas.removeEventListener('touchmove', touchMoveCapture);
      canvas.removeEventListener('touchend', touchEndCapture);
    };
  }, [zoom, panOffset]);

  const handleTextSubmit = (e) => {
    if (e.key === 'Enter' && textInput && textInput.value.trim()) {
      const newElement = {
        type: 'text',
        text: textInput.value,
        x: textInput.x,
        y: textInput.y,
        color: color,
        font: `${strokeWidth * 8}px Arial`,
        strokeWidth: strokeWidth
      };
      setElements(prev => [...prev, newElement]);
      setTextInput(null);
    } else if (e.key === 'Escape') {
      setTextInput(null);
    }
  };

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current,
    undo: () => {
      if (historyStep > 0) {
        const newStep = historyStep - 1;
        isHistoryAction.current = true;
        setHistoryStep(newStep);
        setElements([...history[newStep]]);
      }
    },
    redo: () => {
      if (historyStep < history.length - 1) {
        const newStep = historyStep + 1;
        isHistoryAction.current = true;
        setHistoryStep(newStep);
        setElements([...history[newStep]]);
      }
    },
    clear: () => {
      setElements([]);
    },
    zoomIn: () => {
      setZoom(prev => Math.min(prev * 1.2, 5));
    },
    zoomOut: () => {
      setZoom(prev => Math.max(prev / 1.2, 0.1));
    },
    resetZoom: () => {
      setZoom(1);
      setPanOffset({ x: 0, y: 0 });
    }
  }));

  return (
    <div 
      ref={containerRef}
      className="w-full h-full relative overflow-hidden"
      style={{ 
        background: '#ffffff',
        touchAction: 'pan-x pan-y',
        userSelect: 'none',
        WebkitUserSelect: 'none'
      }}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onPointerCancel={handlePointerLeave}
        onWheel={handleWheel}
        className="absolute inset-0"
        style={{ 
          cursor: isPanning ? 'grabbing' : 
                 panMode ? 'grab' :
                 dragging ? 'move' :
                 tool === 'eraser' ? 'none' : 
                 tool === 'select' ? 'default' : 
                 'crosshair',
          touchAction: 'pan-x pan-y'
        }}
      />
      
      {/* Zoom indicator */}
      <div className="absolute bottom-4 left-4 bg-white border border-gray-300 rounded px-3 py-1 text-sm font-medium shadow-sm">
        {Math.round(zoom * 100)}%
      </div>

      {/* Eraser Cursor Indicator */}
      {tool === 'eraser' && cursorPos && (
        <div
          className="absolute pointer-events-none border-2 border-gray-400 rounded-full"
          style={{
            left: `${cursorPos.x}px`,
            top: `${cursorPos.y}px`,
            width: `${strokeWidth * 4 * zoom}px`,
            height: `${strokeWidth * 4 * zoom}px`,
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(255, 255, 255, 0.3)'
          }}
        />
      )}

      {/* Text Input */}
      {textInput && (
        <input
          type="text"
          autoFocus
          value={textInput.value}
          onChange={(e) => setTextInput({ ...textInput, value: e.target.value })}
          onKeyDown={handleTextSubmit}
          onBlur={() => setTextInput(null)}
          className="absolute border-2 border-blue-400 bg-transparent outline-none"
          style={{
            left: `${textInput.screenX}px`,
            top: `${textInput.screenY}px`,
            fontSize: `${strokeWidth * 8}px`,
            color: color,
            fontFamily: 'Arial',
            minWidth: '100px'
          }}
          placeholder="Type text..."
        />
      )}
    </div>
  );
});

export default Canvas;
