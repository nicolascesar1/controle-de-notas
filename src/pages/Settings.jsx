import React, { useState } from 'react';
import { Download, Trash2, ShieldAlert, Upload, FileSpreadsheet } from 'lucide-react';
import { getInvoices, getBills, getRegisteredSuppliers } from '../services/storage';
import { format } from 'date-fns';
import { formatCurrency } from '../utils/format';
import { db } from '../firebase/config';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
    const [isExporting, setIsExporting] = useState(false);
    const { user } = useAuth();

    const handleExportJson = async () => {
        setIsExporting(true);
        try {
            const invoices = await getInvoices();
            const bills = await getBills();
            const suppliers = await getRegisteredSuppliers();

            const backupData = {
                version: "2.0.0",
                exportDate: new Date().toISOString(),
                collections: {
                    invoices,
                    bills,
                    suppliers
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

    const handleExportCsv = async () => {
        setIsExporting(true);
        try {
            const bills = await getBills();
            
            // CSV Header
            let csvContent = "Fornecedor,Categoria,Parcela,Vencimento,Valor,Status,Codigo de Barras\n";
            
            // CSV Rows
            bills.forEach(bill => {
                const row = [
                    `"${bill.supplier}"`,
                    `"${bill.category || ''}"`,
                    `"${bill.installment_number}"`,
                    `"${format(new Date(bill.due_date), 'dd/MM/yyyy')}"`,
                    `"${bill.amount.toFixed(2).replace('.', ',')}"`,
                    `"${bill.status === 'Paid' ? 'Pago' : 'Pendente'}"`,
                    `"${bill.barcode || ''}"`
                ].join(",");
                csvContent += row + "\n";
            });

            const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `financeiro_loja_${format(new Date(), 'yyyy-MM-dd')}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            alert("Planilha gerada com sucesso!");
        } catch (error) {
            console.error("Erro ao gerar planilha:", error);
            alert("Erro ao exportar dados para planilha.");
        } finally {
            setIsExporting(false);
        }
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file || !user) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const importedData = JSON.parse(event.target.result);
                
                if (!importedData.collections) {
                    throw new Error("Arquivo inválido.");
                }

                if (window.confirm("Atenção: A importação irá ADICIONAR os dados aos existentes no Firebase. Deseja continuar?")) {
                    const batch = writeBatch(db);
                    
                    // Import Suppliers
                    if (importedData.collections.suppliers) {
                        importedData.collections.suppliers.forEach(s => {
                            const ref = doc(collection(db, "suppliers"));
                            batch.set(ref, { ...s, userId: user.uid });
                        });
                    }

                    // Import Invoices
                    if (importedData.collections.invoices) {
                        importedData.collections.invoices.forEach(inv => {
                            const ref = doc(collection(db, "invoices"));
                            batch.set(ref, { ...inv, userId: user.uid });
                        });
                    }

                    // Import Bills
                    if (importedData.collections.bills) {
                        importedData.collections.bills.forEach(bill => {
                            const ref = doc(collection(db, "bills"));
                            batch.set(ref, { ...bill, userId: user.uid });
                        });
                    }

                    await batch.commit();
                    alert("Dados importados com sucesso!");
                    window.location.reload();
                }
            } catch (error) {
                console.error("Erro na importação:", error);
                alert("Erro ao importar dados.");
            }
        };
        reader.readAsText(file);
        e.target.value = null;
    };

    return (
        <div className="p-4">
            <header className="dashboard-header">
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Configurações</h2>
                    <p className="text-secondary">Gerencie dados e exportações</p>
                </div>
            </header>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <h3 className="section-title">Gerenciamento de Dados</h3>
                <p className="text-secondary" style={{ marginBottom: '1.5rem' }}>
                    Exporte suas contas para uma planilha Excel ou faça um backup completo dos dados do sistema.
                </p>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-primary" onClick={handleExportCsv} disabled={isExporting} style={{ backgroundColor: '#16a34a' }}>
                        <FileSpreadsheet size={18} />
                        <span>{isExporting ? 'Processando...' : 'Exportar Planilha (.csv)'}</span>
                    </button>

                    <button className="btn btn-ghost" onClick={handleExportJson} disabled={isExporting} style={{ border: '1px solid var(--border-color)' }}>
                        <Download size={18} />
                        <span>Backup Técnico (.json)</span>
                    </button>

                    <label className="btn btn-ghost" style={{ cursor: 'pointer', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)' }}>
                        <Upload size={18} />
                        <span>Restaurar Backup (.json)</span>
                        <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
                    </label>
                </div>
            </div>

            <div className="card">
                <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldAlert size={20} className="text-secondary" />
                    <span>Sobre o Sistema</span>
                </h3>
                <p className="text-secondary">
                    Versão 2.0.0 (Cloud) <br />
                    Armazenamento: Google Firebase <br />
                    Usuário: {user?.email}
                </p>
            </div>
        </div>
    );
};

export default Settings;
