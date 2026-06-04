import React, { useCallback, useMemo, useState } from "react";
import { CheckCircle2, Info, TriangleAlert, X, XCircle } from "lucide-react";
import { ToastContext } from "./toast";

const toastConfig = {
    success: { icon: CheckCircle2, title: "Sucesso" },
    error: { icon: XCircle, title: "Erro" },
    warning: { icon: TriangleAlert, title: "Atenção" },
    info: { icon: Info, title: "Aviso" }
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const dismiss = useCallback((id) => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
    }, []);

    const showToast = useCallback(({ type = "info", title, message, duration = 4200 }) => {
        const id = crypto.randomUUID();
        const nextToast = { id, type, title, message };
        setToasts((current) => [...current, nextToast]);
        window.setTimeout(() => dismiss(id), duration);
        return id;
    }, [dismiss]);

    const value = useMemo(() => ({
        showToast,
        success: (message, title) => showToast({ type: "success", title, message }),
        error: (message, title) => showToast({ type: "error", title, message, duration: 6500 }),
        warning: (message, title) => showToast({ type: "warning", title, message }),
        info: (message, title) => showToast({ type: "info", title, message })
    }), [showToast]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="toast-stack" aria-live="polite" aria-atomic="true">
                {toasts.map((toast) => {
                    const config = toastConfig[toast.type] || toastConfig.info;
                    const Icon = config.icon;
                    return (
                        <div key={toast.id} className={`toast toast-${toast.type}`}>
                            <Icon size={18} />
                            <div className="toast-content">
                                <strong>{toast.title || config.title}</strong>
                                {toast.message && <span>{toast.message}</span>}
                            </div>
                            <button type="button" onClick={() => dismiss(toast.id)} aria-label="Fechar aviso">
                                <X size={15} />
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
};
