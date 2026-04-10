import { useState, useCallback, createContext, useContext, useRef } from "react";
import { COLOR, FONT, RADIUS } from "../tokens";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const TOAST_COLORS: Record<ToastType, string> = {
  success: "#34C759",
  error:   "#FF3B30",
  info:    COLOR.primary,
};

function ToastIcon({ type }: { type: ToastType }) {
  const color = "#fff";
  const size  = 16;
  if (type === "success") return <CheckCircle size={size} color={color} strokeWidth={2} />;
  if (type === "error")   return <AlertCircle size={size} color={color} strokeWidth={2} />;
  return <Info size={size} color={color} strokeWidth={2} />;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = `toast_${Date.now()}`;
    setToasts(prev => [...prev.slice(-2), { id, message, type }]);
    timers.current[id] = setTimeout(() => dismiss(id), 3200);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{
        position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)",
        display: "flex", flexDirection: "column", gap: 8, zIndex: 9999,
        width: "calc(100% - 40px)", maxWidth: 390, pointerEvents: "none",
      }}>
        {toasts.map(toast => (
          <div key={toast.id} style={{
            display: "flex", alignItems: "center", gap: 10,
            backgroundColor: TOAST_COLORS[toast.type],
            borderRadius: RADIUS.md, padding: "12px 14px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
            pointerEvents: "auto",
            animation: "slideUp 0.22s ease",
          }}>
            <ToastIcon type={toast.type} />
            <span style={{
              flex: 1, fontFamily: FONT.base, fontSize: 13, fontWeight: 600,
              color: "#fff", letterSpacing: "-0.2px", lineHeight: 1.4,
            }}>
              {toast.message}
            </span>
            <button
              onClick={() => dismiss(toast.id)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex", alignItems: "center" }}
            >
              <X size={14} color="rgba(255,255,255,0.8)" strokeWidth={2.5} />
            </button>
          </div>
        ))}
      </div>
      <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </ToastContext.Provider>
  );
}
