import React, { useState } from 'react';
import { Download, ShieldAlert, Upload, FileSpreadsheet } from 'lucide-react';
import { getInvoices, getBills, getRegisteredSuppliers } from '../services/storage';
import { format } from 'date-fns';
import { db } from '../firebase/config';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { useAuth } from '../context/useAuth';
import { useConfirm } from '../context/useConfirm';
import { useToast } from '../context/useToast';

const Settings = () => {
    const [isExporting, setIsExporting] = useState(false);
    const { user } = useAuth();
    const { confirm } = useConfirm();
    const toast = useToast();

    const stripId = (item) => {
        const rest = { ...(item || {}) };
        delete rest.id;
        return rest;
    };

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

            toast.success("Backup gerado com sucesso.");

        } catch (error) {
            console.error("Erro ao exportar:", error);
            toast.error("Não foi possível exportar os dados.");
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

            toast.success("Planilha gerada com sucesso.");
        } catch (error) {
            console.error("Erro ao gerar planilha:", error);
            toast.error("Não foi possível exportar a planilha.");
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

                const confirmed = await confirm({
                    title: "Restaurar backup?",
                    message: "A restauração irá mesclar o backup com os dados atuais. Registros com o mesmo ID serão atualizados para evitar duplicidade.",
                    confirmLabel: "Restaurar"
                });
                if (confirmed) {
                    const batch = writeBatch(db);
                    
                    // Import Suppliers
                    if (importedData.collections.suppliers) {
                        importedData.collections.suppliers.forEach(s => {
                            const ref = s.id ? doc(db, "suppliers", s.id) : doc(collection(db, "suppliers"));
                            batch.set(ref, { ...stripId(s), userId: user.uid }, { merge: true });
                        });
                    }

                    // Import Invoices
                    if (importedData.collections.invoices) {
                        importedData.collections.invoices.forEach(inv => {
                            const ref = inv.id ? doc(db, "invoices", inv.id) : doc(collection(db, "invoices"));
                            batch.set(ref, { ...stripId(inv), userId: user.uid }, { merge: true });
                        });
                    }

                    // Import Bills
                    if (importedData.collections.bills) {
                        importedData.collections.bills.forEach(bill => {
                            const ref = bill.id ? doc(db, "bills", bill.id) : doc(collection(db, "bills"));
                            batch.set(ref, { ...stripId(bill), userId: user.uid }, { merge: true });
                        });
                    }

                    await batch.commit();
                    toast.success("Dados importados com sucesso.");
                    window.location.reload();
                }
            } catch (error) {
                console.error("Erro na importação:", error);
                toast.error("Não foi possível importar o backup.");
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
                    <button className="btn btn-primary" onClick={handleExportCsv} disabled={isExporting} style={{ background: 'linear-gradient(135deg, var(--success), var(--accent-cyan))' }}>
                        <FileSpreadsheet size={18} />
                        <span>{isExporting ? 'Processando...' : 'Exportar Planilha (.csv)'}</span>
                    </button>

                    <button className="btn btn-ghost" onClick={handleExportJson} disabled={isExporting} style={{ border: '1px solid var(--border-color)' }}>
                        <Download size={18} />
                        <span>Backup Técnico (.json)</span>
                    </button>

                    <label className="btn btn-ghost" style={{ cursor: 'pointer' }}>
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
