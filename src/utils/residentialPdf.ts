import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ResidentialSale, ResidentialSummary } from '../types';
import { formatDateBR } from './calculations';

export function exportResidentialTrackingPDF(
  sales: ResidentialSale[],
  summary: ResidentialSummary,
  storeName: string = 'Claro — Shopping Tietê Plaza'
) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 297;
  const pageHeight = 210;

  // Header Dark Banner (Matching Claro Dashboard aesthetic)
  doc.setFillColor(24, 24, 27); // zinc-900
  doc.rect(0, 0, pageWidth, 22, 'F');

  // Red accent line
  doc.setFillColor(220, 38, 38); // red-600
  doc.rect(0, 22, pageWidth, 1.5, 'F');

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('ACOMPANHAMENTO DE VENDAS RESIDENCIAL — CLARO TIETÊ PLAZA', 14, 10);

  // Header Metadata
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(212, 212, 216); // zinc-300
  doc.text(
    `CONTROLE DE INSTALAÇÕES   •   LOJA: ${storeName.toUpperCase()}   •   REGISTROS: ${sales.length}`,
    14,
    17
  );

  doc.setFontSize(7.5);
  doc.setTextColor(161, 161, 170);
  doc.text(
    `EMITIDO EM: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
    pageWidth - 14,
    17,
    { align: 'right' }
  );

  // Summary Metrics Banner Box
  const summaryY = 27;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(14, summaryY, pageWidth - 28, 14, 2, 2, 'FD');

  const cardWidth = (pageWidth - 28) / 6;
  const metrics = [
    { label: 'TOTAL INSTALAÇÕES', value: `${summary.totalInstallations}`, color: [15, 23, 42] },
    { label: 'CONECTADOS', value: `${summary.connectedCount}`, color: [22, 163, 74] }, // green-600
    { label: 'DESCONECTADOS', value: `${summary.disconnectedCount}`, color: [220, 38, 38] }, // red-600
    { label: 'SOLAR', value: `${summary.solarCount}`, color: [202, 138, 4] }, // amber-600
    { label: 'M-PLAY', value: `${summary.mplayCount}`, color: [37, 99, 235] }, // blue-600
    { label: '2º PONTO VIRTUA', value: `${summary.secondPointVirtuaCount}`, color: [147, 51, 234] }, // purple-600
  ];

  metrics.forEach((m, idx) => {
    const xPos = 14 + idx * cardWidth + cardWidth / 2;
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(m.label, xPos, summaryY + 5, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(m.color[0], m.color[1], m.color[2]);
    doc.text(m.value, xPos, summaryY + 11, { align: 'center' });

    if (idx < metrics.length - 1) {
      doc.setDrawColor(226, 232, 240);
      doc.line(14 + (idx + 1) * cardWidth, summaryY + 2, 14 + (idx + 1) * cardWidth, summaryY + 12);
    }
  });

  // Table Data Mapping
  const head = [[
    'Contrato',
    'Data Instalação',
    'Período',
    'Solar',
    'M-Play',
    'Serviço',
    '2º Ponto Virtua',
    'CPF do Cliente',
    'Status',
  ]];

  const body = sales.map((sale) => [
    sale.contract || '—',
    formatDateBR(sale.installationDate),
    sale.period,
    sale.solar,
    sale.mplay,
    sale.service || '—',
    sale.secondPointVirtua,
    sale.cpf || '—',
    sale.status,
  ]);

  autoTable(doc, {
    startY: 45,
    head: head,
    body: body,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      font: 'helvetica',
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [220, 38, 38], // Claro Red
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', fontStyle: 'bold', cellWidth: 28 }, // Contrato
      1: { halign: 'center', cellWidth: 26 }, // Data
      2: { halign: 'center', cellWidth: 30 }, // Período
      3: { halign: 'center', cellWidth: 20 }, // Solar
      4: { halign: 'center', cellWidth: 20 }, // M-Play
      5: { halign: 'left', cellWidth: 'auto' }, // Serviço
      6: { halign: 'center', cellWidth: 28 }, // 2º Ponto
      7: { halign: 'center', cellWidth: 32 }, // CPF
      8: { halign: 'center', fontStyle: 'bold', cellWidth: 30 }, // Status
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didParseCell: (data) => {
      // Highlight Solar, M-Play, 2º Ponto and Status columns
      if (data.section === 'body') {
        const rawValue = data.cell.raw;
        // Status Column
        if (data.column.index === 8) {
          if (rawValue === 'CONECTADO') {
            data.cell.styles.textColor = [22, 163, 74]; // Green
            data.cell.styles.fillColor = [240, 253, 244]; // Light green
          } else if (rawValue === 'DESCONECTADO') {
            data.cell.styles.textColor = [220, 38, 38]; // Red
            data.cell.styles.fillColor = [254, 242, 242]; // Light red
          }
        }
        // SIM values
        if ([3, 4, 6].includes(data.column.index) && rawValue === 'SIM') {
          data.cell.styles.textColor = [15, 23, 42];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    didDrawPage: (data) => {
      // Footer on all pages
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Acompanhamento Residencial — Claro Shopping Tietê Plaza   •   Página ${data.pageNumber}`,
        14,
        pageHeight - 8
      );
      doc.text(
        'CONFIDENCIAL — USO INTERNO CLARO',
        pageWidth - 14,
        pageHeight - 8,
        { align: 'right' }
      );
    },
  });

  const dateSuffix = new Date().toISOString().slice(0, 10);
  doc.save(`relatorio_vendas_residencial_claro_${dateSuffix}.pdf`);
}
