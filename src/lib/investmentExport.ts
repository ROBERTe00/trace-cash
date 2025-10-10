import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Investment } from './storage';
import { calculatePortfolioMetrics, getAssetAllocation } from './investmentMetrics';

export function exportInvestmentReport(investments: Investment[]): void {
  const doc = new jsPDF();
  const metrics = calculatePortfolioMetrics(investments);
  const allocation = getAssetAllocation(investments);

  // Header
  doc.setFontSize(20);
  doc.setTextColor(59, 130, 246);
  doc.text('Trace-Cash Investment Report', 14, 22);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);

  // Portfolio Summary
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Portfolio Summary', 14, 40);

  const summaryData = [
    ['Total Portfolio Value', `€${metrics.totalValue.toFixed(2)}`],
    ['Total Gain/Loss', `€${metrics.totalGainLoss.toFixed(2)} (${metrics.totalGainLossPercent.toFixed(2)}%)`],
    ['Annualized Return', `${metrics.annualizedReturn.toFixed(2)}%`],
    ['Portfolio Volatility', `${metrics.volatility.toFixed(2)}%`],
    ['Sharpe Ratio', metrics.sharpeRatio.toFixed(2)],
    ['Diversification (HHI)', metrics.diversification.herfindahlIndex.toFixed(4)],
  ];

  autoTable(doc, {
    startY: 45,
    head: [['Metric', 'Value']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
  });

  // Asset Allocation
  const finalY = (doc as any).lastAutoTable.finalY || 45;
  doc.setFontSize(14);
  doc.text('Asset Allocation', 14, finalY + 15);

  const allocationData = allocation.map(asset => [
    asset.name,
    asset.type,
    `€${asset.value.toFixed(2)}`,
    `${asset.percentage.toFixed(2)}%`,
  ]);

  autoTable(doc, {
    startY: finalY + 20,
    head: [['Asset', 'Type', 'Value', 'Allocation %']],
    body: allocationData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
  });

  // Holdings Detail
  const holdingsY = (doc as any).lastAutoTable.finalY || finalY + 20;
  
  if (holdingsY < 250) {
    doc.setFontSize(14);
    doc.text('Individual Holdings', 14, holdingsY + 15);

    const holdingsData = investments.map(inv => {
      const currentValue = inv.currentPrice * inv.quantity;
      const costBasis = inv.purchasePrice * inv.quantity;
      const gainLoss = currentValue - costBasis;
      const gainLossPercent = (gainLoss / costBasis) * 100;

      return [
        inv.name,
        inv.type,
        inv.quantity.toString(),
        `€${inv.purchasePrice.toFixed(2)}`,
        `€${inv.currentPrice.toFixed(2)}`,
        `€${gainLoss.toFixed(2)} (${gainLossPercent.toFixed(2)}%)`,
      ];
    });

    autoTable(doc, {
      startY: holdingsY + 20,
      head: [['Name', 'Type', 'Qty', 'Purchase', 'Current', 'Gain/Loss']],
      body: holdingsData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      columnStyles: {
        5: { textColor: [0, 150, 0] },
      },
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Page ${i} of ${pageCount} - Trace-Cash Investment Report`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Save
  doc.save(`trace-cash-investments-${new Date().toISOString().split('T')[0]}.pdf`);
}

export function exportInvestmentCSV(investments: Investment[]): void {
  const metrics = calculatePortfolioMetrics(investments);

  let csv = 'Trace-Cash Investment Export\n';
  csv += `Generated: ${new Date().toISOString()}\n\n`;

  csv += 'Portfolio Summary\n';
  csv += `Total Value,€${metrics.totalValue.toFixed(2)}\n`;
  csv += `Total Gain/Loss,€${metrics.totalGainLoss.toFixed(2)}\n`;
  csv += `Gain/Loss %,${metrics.totalGainLossPercent.toFixed(2)}%\n`;
  csv += `Annualized Return,${metrics.annualizedReturn.toFixed(2)}%\n`;
  csv += `Volatility,${metrics.volatility.toFixed(2)}%\n`;
  csv += `Sharpe Ratio,${metrics.sharpeRatio.toFixed(2)}\n\n`;

  csv += 'Individual Holdings\n';
  csv += 'Name,Type,Symbol,Quantity,Purchase Price,Current Price,Purchase Date,Total Cost,Current Value,Gain/Loss,Gain/Loss %\n';

  investments.forEach(inv => {
    const costBasis = inv.purchasePrice * inv.quantity;
    const currentValue = inv.currentPrice * inv.quantity;
    const gainLoss = currentValue - costBasis;
    const gainLossPercent = (gainLoss / costBasis) * 100;

    csv += `${inv.name},${inv.type},${inv.symbol || ''},${inv.quantity},€${inv.purchasePrice.toFixed(2)},€${inv.currentPrice.toFixed(2)},${inv.purchaseDate || ''},€${costBasis.toFixed(2)},€${currentValue.toFixed(2)},€${gainLoss.toFixed(2)},${gainLossPercent.toFixed(2)}%\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `trace-cash-investments-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
}
