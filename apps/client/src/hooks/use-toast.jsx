import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

// CSS (place in a separate .css file or use with a styling library)
/*
.toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 16px;
  background: #333;
  color: #fff;
  border-radius: 8px;
  max-width: 300px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  animation: slideIn 0.3s ease-out;
}
.toast-exit {
  animation: slideOut 0.3s ease-in forwards;
}
@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
@keyframes slideOut {
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(100%); opacity: 0; }
}
.toast h4 { margin: 0 0 8px; }
.toast p { margin: 0 0 8px; }
.toast button {
  background: #555;
  color: #fff;
  border: none;
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;
}
.toast button:hover { background: #666; }
*/

// Default configuration
const DEFAULT_CONFIG = {
  limit: 3,
  removeDelay: 5000,
};

const actionTypes = {
  ADD_TOAST: 'ADD_TOAST',
  UPDATE_TOAST: 'UPDATE_TOAST',
  DISMISS_TOAST: 'DISMISS_TOAST',
  REMOVE_TOAST: 'REMOVE_TOAST',
};

// Generate unique ID
function genId() {
  return crypto.randomUUID ? crypto.randomUUID() : `toast-${Date.now()}-${Math.random()}`;
}

// Reducer
const reducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, state.config.limit),
      };
    case 'UPDATE_TOAST':
      if (!action.toast.id) return state;
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };
    case 'DISMISS_TOAST': {
      const { toastId } = action;
      if (toastId) {
        state.addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast) => state.addToRemoveQueue(toast.id));
      }
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined ? { ...t, open: false } : t
        ),
      };
    }
    case 'REMOVE_TOAST':
      if (action.toastId === undefined) {
        return { ...state, toasts: [] };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
    default:
      return state;
  }
};

// Context
const ToastContext = createContext(null);

// Provider
/**
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {Object} [props.config]
 * @param {number} [props.config.limit=3]
 * @param {number} [props.config.removeDelay=5000]
 */
const ToastProvider = ({ children, config = DEFAULT_CONFIG }) => {
  const [state, setState] = useState({ toasts: [], config, addToRemoveQueue: () => {} });
  const toastTimeouts = useRef(new Map());

  const addToRemoveQueue = useCallback(
    (toastId) => {
      if (toastTimeouts.current.has(toastId)) return;
      const timeout = setTimeout(() => {
        toastTimeouts.current.delete(toastId);
        setState((prev) => reducer(prev, { type: 'REMOVE_TOAST', toastId }));
      }, state.config.removeDelay);
      toastTimeouts.current.set(toastId, timeout);
    },
    [state.config.removeDelay]
  );

  const dispatch = useCallback(
    (action) => {
      setState((prev) => reducer({ ...prev, addToRemoveQueue }, action));
    },
    [addToRemoveQueue]
  );

  /**
   * @param {Object} props
   * @param {React.ReactNode} [props.title]
   * @param {React.ReactNode} [props.description]
   * @param {Object} [props.action]
   * @param {React.ReactNode} [props.action.element]
   * @param {boolean} [props.open]
   * @param {(open: boolean) => void} [props.onOpenChange]
   */
  const toast = useCallback(
    ({ ...props }) => {
      const id = genId();
      const update = (props) => dispatch({ type: 'UPDATE_TOAST', toast: { ...props, id } });
      const dismiss = () => dispatch({ type: 'DISMISS_TOAST', toastId: id });
      dispatch({
        type: 'ADD_TOAST',
        toast: { ...props, id, open: true, onOpenChange: (open) => !open && dismiss() },
      });
      return { id, dismiss, update };
    },
    [dispatch]
  );

  const dismiss = useCallback(
    (toastId) => {
      dispatch({ type: 'DISMISS_TOAST', toastId });
    },
    [dispatch]
  );

  return (
    <ToastContext.Provider value={{ toast, dismiss, toasts: state.toasts }}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  );
};

// Hook
const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};

// Toast component
/**
 * @param {Object} props
 * @param {string} props.id
 * @param {React.ReactNode} [props.title]
 * @param {React.ReactNode} [props.description]
 * @param {Object} [props.action]
 * @param {React.ReactNode} [props.action.element]
 * @param {boolean} [props.open]
 * @param {(open: boolean) => void} [props.onOpenChange]
 */
const Toast = ({ title, description, action, open, id }) => {
  const { dismiss } = useToast();
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (!open) {
      setIsExiting(true);
      const timer = setTimeout(() => dismiss(id), 300); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [open, id, dismiss]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') dismiss(id);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [id, dismiss]);

  if (!open && !isExiting) return null;

  return (
    <div role="alert" aria-live="assertive" className={`toast ${isExiting ? 'toast-exit' : ''}`}>
      {title && <h4>{title}</h4>}
      {description && <p>{description}</p>}
      {action && <div>{action.element}</div>}
    </div>
  );
};

// Error boundary
class ToastErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

// Toaster component
const Toaster = () => {
  const { toasts } = useToast();
  return (
    <ToastErrorBoundary>
      <div>
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} />
        ))}
      </div>
    </ToastErrorBoundary>
  );
};

export { ToastProvider, useToast, Toaster };