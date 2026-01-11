import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Custom hook for managing undo/redo history
 * @param {Object} initialState - Initial state {nodes, edges}
 * @param {number} maxHistory - Maximum number of history states to keep
 */
export const useHistory = (initialState, maxHistory = 50) => {
  // History stacks
  const [past, setPast] = useState([]);
  const [present, setPresent] = useState(initialState);
  const [future, setFuture] = useState([]);
  
  // Ref to track if we should record the next change
  const shouldRecord = useRef(true);
  
  // Debounce timer for batching rapid changes
  const debounceTimer = useRef(null);
  const pendingState = useRef(null);

  // Check if we can undo/redo
  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  // Record a new state (with debouncing for rapid changes)
  const record = useCallback((newState, immediate = false) => {
    if (!shouldRecord.current) return;
    
    if (immediate) {
      // Immediate recording (for discrete actions like delete, add template)
      setPast(prev => {
        const newPast = [...prev, present];
        // Limit history size
        if (newPast.length > maxHistory) {
          return newPast.slice(-maxHistory);
        }
        return newPast;
      });
      setPresent(newState);
      setFuture([]);
      pendingState.current = null;
    } else {
      // Debounced recording (for continuous changes like dragging)
      pendingState.current = newState;
      
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      
      debounceTimer.current = setTimeout(() => {
        if (pendingState.current) {
          setPast(prev => {
            const newPast = [...prev, present];
            if (newPast.length > maxHistory) {
              return newPast.slice(-maxHistory);
            }
            return newPast;
          });
          setPresent(pendingState.current);
          setFuture([]);
          pendingState.current = null;
        }
      }, 300); // 300ms debounce
    }
  }, [present, maxHistory]);

  // Undo action
  const undo = useCallback(() => {
    if (!canUndo) return null;
    
    // Flush any pending changes first
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    
    shouldRecord.current = false;
    
    const previous = past[past.length - 1];
    const newPast = past.slice(0, -1);
    
    setPast(newPast);
    setPresent(previous);
    setFuture([present, ...future]);
    
    // Re-enable recording after state update
    setTimeout(() => {
      shouldRecord.current = true;
    }, 0);
    
    return previous;
  }, [past, present, future, canUndo]);

  // Redo action
  const redo = useCallback(() => {
    if (!canRedo) return null;
    
    shouldRecord.current = false;
    
    const next = future[0];
    const newFuture = future.slice(1);
    
    setPast([...past, present]);
    setPresent(next);
    setFuture(newFuture);
    
    // Re-enable recording after state update
    setTimeout(() => {
      shouldRecord.current = true;
    }, 0);
    
    return next;
  }, [past, present, future, canRedo]);

  // Reset history
  const reset = useCallback((newState) => {
    setPast([]);
    setPresent(newState || initialState);
    setFuture([]);
    pendingState.current = null;
  }, [initialState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return {
    state: present,
    record,
    undo,
    redo,
    reset,
    canUndo,
    canRedo,
    historyLength: past.length,
    futureLength: future.length,
  };
};

export default useHistory;
