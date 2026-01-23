import React, { useState } from 'react';
import { Download, Trash2, ShieldAlert } from 'lucide-react';
import { getInvoices } from '../services/storage';
import { format } from 'date-fns';

const Settings = () => {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            // Fetch all data
            const invoices = await getInvoices();
            const bills = JSON.parse(localStorage.getItem("finance_app_bills") || "[]");

            // Prepare CSV Content
            // Headers
            let csvContent = "data:text/csv;charset=utf-8,";
            csvContent += "Tipo,ID,Fornecedor,Data,Valor,Status,Parcela/Descricao\n";

            // Add Invoices
            invoices.forEach(inv => {
                const date = format(new Date(inv.purchase_date), 'dd/MM/yyyy');
                const line = `Nota Fiscal,${inv.id},${inv.supplier},${date},${inv.total_value},Registrada,${inv.invoice_number || ''}`;
                csvContent += line + "\n";
            });

            // Add Bills (Contas a Pagar)
            bills.forEach(bill => {
                const date = format(new Date(bill.due_date), 'dd/MM/yyyy');
                const line = `Parcela,${bill.id},${bill.supplier},${date},${bill.amount},${bill.status},${bill.installment_number}`;
                csvContent += line + "\n";
            });

            // Trigger Download
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `backup_financeiro_${format(new Date(), 'yyyy-MM-dd')}.csv`);
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
                    Faça o download de todos os seus dados para uma planilha (Excel/Google Sheets) ou limpe o armazenamento local.
                </p>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-primary" onClick={handleExport} disabled={isExporting}>
                        <Download size={18} />
                        <span>{isExporting ? 'Gerando...' : 'Exportar para Planilha (CSV)'}</span>
                    </button>

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
