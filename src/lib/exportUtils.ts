import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Expense, Investment, FinancialGoal } from './storage';
import { format } from 'date-fns';

export interface ExportData {
  expenses: Expense[];
  investments: Investment[];
  goals: FinancialGoal[];
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netBalance: number;
    portfolioValue: number;
  };
}

export function exportToCSV(data: ExportData) {
  const { expenses, investments, summary } = data;
  
  // Create CSV content
  let csv = 'MyFinance Tracker - Monthly Report\n';
  csv += `Generated on: ${format(new Date(), 'PPP')}\n\n`;
  
  // Summary section
  csv += 'FINANCIAL SUMMARY\n';
  csv += `Total Income,€${summary.totalIncome.toFixed(2)}\n`;
  csv += `Total Expenses,€${summary.totalExpenses.toFixed(2)}\n`;
  csv += `Net Balance,€${summary.netBalance.toFixed(2)}\n`;
  csv += `Portfolio Value,€${summary.portfolioValue.toFixed(2)}\n\n`;
  
  // Expenses section
  csv += 'EXPENSES\n';
  csv += 'Date,Description,Category,Amount\n';
  expenses
    .filter(e => e.type === 'Expense')
    .forEach(e => {
      csv += `${e.date},"${e.description}",${e.category},€${e.amount.toFixed(2)}\n`;
    });
  csv += '\n';
  
  // Income section
  csv += 'INCOME\n';
  csv += 'Date,Description,Category,Amount\n';
  expenses
    .filter(e => e.type === 'Income')
    .forEach(e => {
      csv += `${e.date},"${e.description}",${e.category},€${e.amount.toFixed(2)}\n`;
    });
  csv += '\n';
  
  // Investments section
  csv += 'INVESTMENTS\n';
  csv += 'Name,Type,Quantity,Purchase Price,Current Price,Value,Gain/Loss\n';
  investments.forEach(inv => {
    const value = inv.quantity * inv.currentPrice;
    const cost = inv.quantity * inv.purchasePrice;
    const gainLoss = value - cost;
    csv += `"${inv.name}",${inv.type},${inv.quantity},€${inv.purchasePrice.toFixed(2)},€${inv.currentPrice.toFixed(2)},€${value.toFixed(2)},€${gainLoss.toFixed(2)}\n`;
  });
  
  // Download CSV
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `myfinance-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  link.click();
}

export function exportToPDF(data: ExportData) {
  const { expenses, investments, goals, summary } = data;
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.setTextColor(33, 150, 243);
  doc.text('MyFinance Tracker', 14, 20);
  
  doc.setFontSize(14);
  doc.setTextColor(100);
  doc.text('Monthly Financial Report', 14, 28);
  
  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text(`Generated on ${format(new Date(), 'PPP')}`, 14, 34);
  
  let yPos = 45;
  
  // Financial Summary
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text('Financial Summary', 14, yPos);
  yPos += 5;
  
  autoTable(doc, {
    startY: yPos,
    head: [['Metric', 'Value']],
    body: [
      ['Total Income', `€${summary.totalIncome.toFixed(2)}`],
      ['Total Expenses', `€${summary.totalExpenses.toFixed(2)}`],
      ['Net Balance', `€${summary.netBalance.toFixed(2)}`],
      ['Portfolio Value', `€${summary.portfolioValue.toFixed(2)}`],
    ],
    theme: 'striped',
    headStyles: { fillColor: [33, 150, 243] },
    margin: { left: 14 },
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 10;
  
  // Expenses by Category
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }
  
  doc.setFontSize(12);
  doc.text('Expenses by Category', 14, yPos);
  yPos += 5;
  
  const categoryData = expenses
    .filter(e => e.type === 'Expense')
    .reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>);
  
  autoTable(doc, {
    startY: yPos,
    head: [['Category', 'Amount', 'Percentage']],
    body: Object.entries(categoryData)
      .sort(([, a], [, b]) => b - a)
      .map(([cat, amt]) => [
        cat,
        `€${amt.toFixed(2)}`,
        `${((amt / summary.totalExpenses) * 100).toFixed(1)}%`
      ]),
    theme: 'striped',
    headStyles: { fillColor: [33, 150, 243] },
    margin: { left: 14 },
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 10;
  
  // Investment Portfolio
  if (investments.length > 0) {
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(12);
    doc.text('Investment Portfolio', 14, yPos);
    yPos += 5;
    
    autoTable(doc, {
      startY: yPos,
      head: [['Investment', 'Type', 'Quantity', 'Current Value', 'Gain/Loss']],
      body: investments.map(inv => {
        const value = inv.quantity * inv.currentPrice;
        const cost = inv.quantity * inv.purchasePrice;
        const gainLoss = value - cost;
        const gainLossPercent = ((gainLoss / cost) * 100).toFixed(2);
        
        return [
          inv.name,
          inv.type,
          inv.quantity.toString(),
          `€${value.toFixed(2)}`,
          `€${gainLoss.toFixed(2)} (${gainLossPercent}%)`
        ];
      }),
      theme: 'striped',
      headStyles: { fillColor: [33, 150, 243] },
      margin: { left: 14 },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 10;
  }
  
  // Financial Goals
  if (goals.length > 0) {
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(12);
    doc.text('Financial Goals', 14, yPos);
    yPos += 5;
    
    autoTable(doc, {
      startY: yPos,
      head: [['Goal', 'Target', 'Current', 'Progress']],
      body: goals.map(goal => [
        goal.name,
        `€${goal.targetAmount.toFixed(2)}`,
        `€${goal.currentAmount.toFixed(2)}`,
        `${((goal.currentAmount / goal.targetAmount) * 100).toFixed(1)}%`
      ]),
      theme: 'striped',
      headStyles: { fillColor: [33, 150, 243] },
      margin: { left: 14 },
    });
  }
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  // Save PDF
  doc.save(`myfinance-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}
