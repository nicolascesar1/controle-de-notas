import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};

export const formatDate = (date) => {
    if (!date) return "-";
    return format(date, "dd/MM/yyyy", { locale: ptBR });
};

export const formatMonthYear = (date) => {
    if (!date) return "-";
    // Ex: "março de 2026"
    return format(date, "MMMM 'de' yyyy", { locale: ptBR });
};
