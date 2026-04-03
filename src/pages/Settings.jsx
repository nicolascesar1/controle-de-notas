import React, { useState, useRef } from 'react';
import { Download, Trash2, ShieldAlert, Upload } from 'lucide-react';
import { getInvoices } from '../services/storage';
import { format } from 'date-fns';

const Settings = () => {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            // Fetch all core collections
            const invoices = JSON.parse(localStorage.getItem("finance_app_invoices") || "[]");
            const bills = JSON.parse(localStorage.getItem("finance_app_bills") || "[]");
            const suppliers = JSON.parse(localStorage.getItem("finance_app_registered_suppliers") || "[]");

            const backupData = {
                version: "1.0.0",
                exportDate: new Date().toISOString(),
                collections: {
                    finance_app_invoices: invoices,
                    finance_app_bills: bills,
                    finance_app_registered_suppliers: suppliers
                }
            };

            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
            const link = document.createElement("a");
            link.setAttribute("href", dataStr);
            link.setAttribute("download", `backup_financeiro_${format(new Date(), 'yyyy-MM-dd')}.json`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            alert("Backup realizado com sucesso!");

        } catch (error) {
            console.error("Erro ao exportar:", error);
            alert("Erro ao exportar dados.");
        } finally {
            setIsExporting(false);
        }
    };

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedData = JSON.parse(event.target.result);
                
                if (!importedData.collections) {
                    throw new Error("Arquivo inválido. Coleções ausentes.");
                }

                if (window.confirm("Atenção: A importação irá SOBRESCREVER E RESTAURAR os dados da sua aplicação de acordo com o arquivo. Você tem certeza?")) {
                    
                    if (importedData.collections.finance_app_invoices) {
                        localStorage.setItem("finance_app_invoices", JSON.stringify(importedData.collections.finance_app_invoices));
                    }
                    if (importedData.collections.finance_app_bills) {
                        localStorage.setItem("finance_app_bills", JSON.stringify(importedData.collections.finance_app_bills));
                    }
                    if (importedData.collections.finance_app_registered_suppliers) {
                        localStorage.setItem("finance_app_registered_suppliers", JSON.stringify(importedData.collections.finance_app_registered_suppliers));
                    }

                    alert("Backup restaurado com sucesso!");
                    window.location.reload();
                }
            } catch (error) {
                console.error("Erro na importação:", error);
                alert("Erro ao ler arquivo. Certifique-se de que é um .json de backup válido.");
            }
        };
        reader.readAsText(file);
        
        // Reset the input value so user can import same file again if aborted
        e.target.value = null;
    };

    const handleClearData = () => {
        if (window.confirm("ATENÇÃO: Isso apagará TODOS os dados cadastrados no navegador. Tem certeza?")) {
            localStorage.clear();
            window.location.reload();
        }
    };

    return (
        <div className="p-4">
            <header className="dashboard-header">
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Configurações</h2>
                    <p className="text-secondary">Gerencie dados e preferências</p>
                </div>
            </header>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <h3 className="section-title">Dados e Backup</h3>
                <p className="text-secondary" style={{ marginBottom: '1.5rem' }}>
                    Faça o download ou importe todos os seus dados em um pacote seguro (.json) para salvar na nuvem ou formatar seu PC. 
                </p>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-primary" onClick={handleExport} disabled={isExporting}>
                        <Download size={18} />
                        <span>{isExporting ? 'Gerando...' : 'Fazer Backup (.json)'}</span>
                    </button>

                    <label className="btn btn-ghost" style={{ cursor: 'pointer', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)' }}>
                        <Upload size={18} />
                        <span>Restaurar (.json)</span>
                        <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
                    </label>

                    <button className="btn btn-ghost" style={{ color: 'var(--danger)', border: '1px solid var(--danger-bg)', backgroundColor: 'var(--danger-bg)' }} onClick={handleClearData}>
                        <Trash2 size={18} />
                        <span>Limpar Tudo</span>
                    </button>
                </div>
            </div>

            <div className="card">
                <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldAlert size={20} className="text-secondary" />
                    <span>Sobre</span>
                </h3>
                <p className="text-secondary">
                    Versão 1.0.0 <br />
                    Armazenamento: LocalStorage (Navegador)
                </p>
            </div>
        </div>
    );
};

export default Settings;
