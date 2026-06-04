import React, { useCallback, useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { ConfirmContext } from "./confirm";

export const ConfirmProvider = ({ children }) => {
    const [request, setRequest] = useState(null);

    const confirm = useCallback((options) => new Promise((resolve) => {
        setRequest({
            title: "Confirmar ação",
            confirmLabel: "Confirmar",
            cancelLabel: "Cancelar",
            variant: "danger",
            ...options,
            resolve
        });
    }), []);

    const close = useCallback((result) => {
        setRequest((current) => {
            if (current) current.resolve(result);
            return null;
        });
    }, []);

    const value = useMemo(() => ({ confirm }), [confirm]);

    return (
        <ConfirmContext.Provider value={value}>
            {children}
            {request && (
                <div className="modal-overlay confirm-overlay" onClick={(event) => {
                    if (event.target === event.currentTarget) close(false);
                }}>
                    <div className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
                        <div className={`confirm-icon confirm-${request.variant}`}>
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <h3 id="confirm-title">{request.title}</h3>
                            {request.message && <p>{request.message}</p>}
                        </div>
                        <div className="confirm-actions">
                            <button type="button" className="btn btn-ghost" onClick={() => close(false)}>
                                {request.cancelLabel}
                            </button>
                            <button type="button" className="btn btn-primary" onClick={() => close(true)}>
                                {request.confirmLabel}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmContext.Provider>
    );
};
