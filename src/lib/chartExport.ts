// Chart Export Utilities - Export charts as PNG/PDF
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Export chart element as PNG image
 */
export async function exportChartAsPNG(
  element: HTMLElement,
  filename: string = 'chart.png',
  options: {
    backgroundColor?: string;
    scale?: number;
    quality?: number;
  } = {}
): Promise<void> {
  try {
    const {
      backgroundColor = '#ffffff',
      scale = 2,
      quality = 1
    } = options;

    const canvas = await html2canvas(element, {
      backgroundColor,
      scale,
      logging: false,
      useCORS: true,
      allowTaint: true
    });

    // Convert to blob and download
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          console.error('[chartExport] Failed to create blob');
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      },
      'image/png',
      quality
    );
  } catch (error) {
    console.error('[chartExport] Error exporting chart as PNG:', error);
    throw error;
  }
}

/**
 * Export chart element as PDF
 */
export async function exportChartAsPDF(
  element: HTMLElement,
  filename: string = 'chart.pdf',
  options: {
    title?: string;
    backgroundColor?: string;
    width?: number;
    height?: number;
  } = {}
): Promise<void> {
  try {
    const {
      title = 'Chart Export',
      backgroundColor = '#ffffff',
      width = 800,
      height = 600
    } = options;

    const canvas = await html2canvas(element, {
      backgroundColor,
      scale: 2,
      logging: false,
      useCORS: true,
      allowTaint: true,
      width,
      height
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: width > height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [width, height]
    });

    if (title) {
      pdf.setFontSize(16);
      pdf.text(title, 20, 30);
    }

    pdf.addImage(imgData, 'PNG', 0, title ? 50 : 0, width, height);
    pdf.save(filename);
  } catch (error) {
    console.error('[chartExport] Error exporting chart as PDF:', error);
    throw error;
  }
}

/**
 * Export multiple charts as PDF
 */
export async function exportMultipleChartsAsPDF(
  elements: Array<{ element: HTMLElement; title: string }>,
  filename: string = 'charts.pdf'
): Promise<void> {
  try {
    const pdf = new jsPDF('portrait', 'px', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < elements.length; i++) {
      if (i > 0) {
        pdf.addPage();
      }

      const { element, title } = elements[i];
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 1.5,
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pageWidth - 40;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Add title
      pdf.setFontSize(14);
      pdf.text(title, 20, 30);

      // Add chart
      pdf.addImage(imgData, 'PNG', 20, 50, imgWidth, Math.min(imgHeight, pageHeight - 80));
    }

    pdf.save(filename);
  } catch (error) {
    console.error('[chartExport] Error exporting multiple charts:', error);
    throw error;
  }
}

/**
 * Export chart data as CSV
 */
export function exportChartDataAsCSV(
  labels: string[],
  datasets: Array<{ label: string; data: number[] }>,
  filename: string = 'chart-data.csv'
): void {
  try {
    const rows: string[] = [];
    
    // Header
    rows.push(['Label', ...datasets.map(d => d.label)].join(','));

    // Data rows
    labels.forEach((label, index) => {
      const values = datasets.map(d => d.data[index] || 0);
      rows.push([label, ...values.map(v => v.toString())].join(','));
    });

    const csv = rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('[chartExport] Error exporting chart data as CSV:', error);
    throw error;
  }
}

