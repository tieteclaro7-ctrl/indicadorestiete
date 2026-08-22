import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ALL_INDICATORS, CATEGORIES } from '../data/categories';
import { DailyEntry, MonthData, Seller } from '../types';
import { calculateIndicatorStats, calculateKPIStats, calculateSellerStats, formatDateBR, formatLongDateBR, formatMonthLabel } from './calculations';

export function exportDailyReportPDF(
  dateStr: string,
  dailyEntry: DailyEntry | undefined,
  sellers: Seller[],
  storeName: string = 'Claro — Shopping Tietê Plaza'
) {
  const activeSellers = sellers.filter((s) => s.active);
  // Landscape A4 for wide matrix table mirroring the daily spreadsheet
  const doc = new jsPDF({
    orientation: 'l',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 297;
  const pageHeight = 210;

  // Header Dark Banner (Matching Diário de Vendas top card)
  doc.setFillColor(24, 24, 27); // zinc-900
  doc.rect(0, 0, pageWidth, 22, 'F');

  // Red accent line
  doc.setFillColor(220, 38, 38); // red-600
  doc.rect(0, 22, pageWidth, 1.5, 'F');

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('DIÁRIO DE VENDAS — TIETÊ PLAZA', 14, 10);

  // Header Metadata
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(212, 212, 216); // zinc-300
  doc.text(
    `DATA: ${formatLongDateBR(dateStr).toUpperCase()}   •   SENHAS ATENDIDAS: ${dailyEntry?.passwordsCount || '0'}   •   VENDEDORES: ${activeSellers.length}   •   LOJA: ${storeName.toUpperCase()}`,
    14,
    17
  );

  doc.setFontSize(7.5);
  doc.setTextColor(161, 161, 170);
  doc.text(
    `SISTEMA DE INDICADORES  |  Emitido em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
    pageWidth - 14,
    17,
    { align: 'right' }
  );

  // Compute daily totals and category totals
  let dailyGrandTotal = 0;
  const sellerGrandTotals: Record<string, number> = {};
  activeSellers.forEach((s) => (sellerGrandTotals[s.id] = 0));

  const tableBody: any[] = [];

  CATEGORIES.forEach((cat) => {
    // 1. Category Header row
    tableBody.push([
      {
        content: `${cat.name.toUpperCase()}  (${cat.indicators.length} ${cat.indicators.length === 1 ? 'INDICADOR' : 'INDICADORES'})`,
        colSpan: activeSellers.length + 2,
        styles: {
          fillColor: [244, 244, 245], // zinc-100
          textColor: [185, 28, 28], // red-700
          fontStyle: 'bold',
          fontSize: 7.5,
          halign: 'left',
          cellPadding: 1.5,
        },
      },
    ]);

    const sellerCatTotals: Record<string, number> = {};
    activeSellers.forEach((s) => (sellerCatTotals[s.id] = 0));
    let categoryGrandTotal = 0;

    // 2. Each Indicator in Category
    cat.indicators.forEach((ind) => {
      let indTotal = 0;
      const row: any[] = [
        {
          content: ind.name + (ind.subtitle ? ` ${ind.subtitle}` : ''),
          styles: { fontStyle: 'bold', textColor: [39, 39, 42] },
        },
      ];

      activeSellers.forEach((s) => {
        const rawVal = dailyEntry?.values?.[ind.id]?.[s.id];
        const qty = Number(rawVal) || 0;
        indTotal += qty;
        sellerCatTotals[s.id] += qty;
        sellerGrandTotals[s.id] += qty;

        row.push({
          content: qty > 0 ? qty.toString() : '0',
          styles: {
            textColor: qty > 0 ? [15, 23, 42] : [161, 161, 170],
            fontStyle: qty > 0 ? 'bold' : 'normal',
          },
        });
      });

      row.push({
        content: indTotal.toString(),
        styles: {
          fontStyle: 'bold',
          textColor: indTotal > 0 ? [0, 0, 0] : [161, 161, 170],
          fillColor: [250, 250, 250],
        },
      });

      categoryGrandTotal += indTotal;
      dailyGrandTotal += indTotal;
      tableBody.push(row);
    });

    // 3. Category Total Row (TOTAL GROSS, TOTAL M-PLAY, etc.)
    const catTotalRow: any[] = [
      {
        content: `TOTAL ${cat.name.toUpperCase()}`,
        styles: {
          fontStyle: 'bold',
          fillColor: [228, 228, 231], // zinc-200
          textColor: [24, 24, 27],
          fontSize: 7.5,
        },
      },
    ];

    activeSellers.forEach((s) => {
      const sSum = sellerCatTotals[s.id] || 0;
      catTotalRow.push({
        content: sSum.toString(),
        styles: {
          fontStyle: 'bold',
          fillColor: [228, 228, 231],
          textColor: sSum > 0 ? [15, 23, 42] : [113, 113, 122],
        },
      });
    });

    catTotalRow.push({
      content: categoryGrandTotal.toString(),
      styles: {
        fontStyle: 'bold',
        fillColor: [212, 212, 216], // zinc-300
        textColor: [0, 0, 0],
        fontSize: 8,
      },
    });

    tableBody.push(catTotalRow);
  });

  // Footer Row: TOTAL GERAL DO DIA
  const grandTotalRow: any[] = [
    {
      content: 'TOTAL GERAL DO DIA',
      styles: {
        fontStyle: 'bold',
        fillColor: [24, 24, 27], // zinc-900
        textColor: [255, 255, 255],
        fontSize: 8,
      },
    },
  ];

  activeSellers.forEach((s) => {
    const total = sellerGrandTotals[s.id] || 0;
    grandTotalRow.push({
      content: total.toString(),
      styles: {
        fontStyle: 'bold',
        fillColor: [24, 24, 27],
        textColor: [252, 165, 165], // red-300
        fontSize: 8,
      },
    });
  });

  grandTotalRow.push({
    content: dailyGrandTotal.toString(),
    styles: {
      fontStyle: 'bold',
      fillColor: [220, 38, 38], // red-600
      textColor: [255, 255, 255],
      fontSize: 9,
    },
  });

  tableBody.push(grandTotalRow);

  const headRow = [
    'INDICADOR',
    ...activeSellers.map((s) => s.name.toUpperCase()),
    'TOTAL',
  ];

  autoTable(doc, {
    startY: 26,
    head: [headRow],
    body: tableBody,
    theme: 'grid',
    styles: {
      fontSize: 6.8,
      cellPadding: 1.1,
      halign: 'center',
      valign: 'middle',
      lineColor: [212, 212, 216],
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 58, fontStyle: 'bold' },
    },
    headStyles: {
      fillColor: [24, 24, 27], // zinc-900
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.2,
      halign: 'center',
    },
    didDrawPage: (data) => {
      // Footer page number
      doc.setFontSize(7);
      doc.setTextColor(161, 161, 170);
      doc.text(
        `Página ${data.pageNumber} — Espelho Diário Oficial • ${storeName}`,
        pageWidth / 2,
        pageHeight - 5,
        { align: 'center' }
      );
    },
  });

  doc.save(`Diario_de_Vendas_${dateStr}_Tiete_Plaza.pdf`);
}

export function exportMonthlyReportPDF(
  monthKey: string,
  monthData: MonthData | undefined,
  prevMonthData: MonthData | undefined,
  sellers: Seller[],
  storeName: string = 'Claro — Shopping Tietê Plaza'
) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const filters = { month: monthKey, day: 'all', sellerId: 'all', categoryId: 'all', indicatorId: 'all' };
  const kpis = calculateKPIStats(monthData, sellers, filters);
  const sellerStats = calculateSellerStats(monthData, sellers, filters);
  const indicatorStats = calculateIndicatorStats(monthData, prevMonthData, sellers, filters);

  // Header Banner
  doc.setFillColor(220, 38, 38);
  doc.rect(0, 0, 210, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('DASHBOARD DE VENDAS — TIETÊ PLAZA', 14, 12);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`RELATÓRIO MENSAL CONSOLIDADO • ${formatMonthLabel(monthKey).toUpperCase()}`, 14, 20);

  // Summary KPI Cards Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 32, 182, 22, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 32, 182, 22, 2, 2, 'S');

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.text('TOTAL VENDIDO', 20, 38);
  doc.text('MÉDIA DIÁRIA', 65, 38);
  doc.text('PROJEÇÃO MÊS', 110, 38);
  doc.text('MELHOR VENDEDOR', 155, 38);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`${kpis.totalSales} vendas`, 20, 47);
  doc.text(`${kpis.dailyAverage.toFixed(1)}/dia`, 65, 47);
  doc.text(`${kpis.projectedMonthEnd} vendas`, 110, 47);
  doc.text(`${kpis.bestSeller ? `${kpis.bestSeller.name} (${kpis.bestSeller.total})` : '—'}`, 155, 47);

  // Section 1: Ranking de Vendedores
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 38);
  doc.text('1. RANKING E RESULTADO POR VENDEDOR', 14, 62);

  const sellerRows = sellerStats.map((s, idx) => [
    `${idx + 1}º`,
    s.name,
    s.total.toString(),
    `${s.share}%`,
    s.dailyAverage.toString(),
    s.topIndicator,
    (s.categoryBreakdown['gross'] || 0).toString(),
    (s.categoryBreakdown['residenciais'] || 0).toString(),
    (s.categoryBreakdown['servicos'] || 0).toString(),
  ]);

  autoTable(doc, {
    startY: 66,
    head: [['POS', 'VENDEDOR', 'TOTAL', 'PART %', 'MÉD/DIA', 'PRINCIPAL PRODUTO', 'GROSS', 'FIBRA', 'SERV']],
    body: sellerRows,
    theme: 'grid',
    styles: { fontSize: 8, halign: 'center', cellPadding: 2 },
    columnStyles: { 1: { halign: 'left', fontStyle: 'bold' }, 5: { halign: 'left' } },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
  });

  // Section 2: Top Indicadores
  const nextY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 38);
  doc.text('2. PRINCIPAIS INDICADORES DO MÊS', 14, nextY);

  const indRows = indicatorStats.slice(0, 15).map((ind, idx) => [
    `${idx + 1}º`,
    ind.name + (ind.subtitle ? ` ${ind.subtitle}` : ''),
    ind.categoryName,
    ind.total.toString(),
    ind.dailyAverage.toString(),
    ind.bestSeller ? `${ind.bestSeller.name} (${ind.bestSeller.total})` : '—',
    ind.growthVsPreviousMonth !== undefined
      ? `${ind.growthVsPreviousMonth > 0 ? '+' : ''}${ind.growthVsPreviousMonth}%`
      : '—',
  ]);

  autoTable(doc, {
    startY: nextY + 4,
    head: [['POS', 'INDICADOR', 'CATEGORIA', 'TOTAL', 'MÉD/DIA', 'MELHOR VENDEDOR', 'EVOLUÇÃO MOM']],
    body: indRows,
    theme: 'grid',
    styles: { fontSize: 8, halign: 'center', cellPadding: 2 },
    columnStyles: { 1: { halign: 'left', fontStyle: 'bold' } },
    headStyles: { fillColor: [220, 38, 38], textColor: [255, 255, 255], fontStyle: 'bold' },
  });

  doc.save(`Relatorio_Mensal_${monthKey}_Tiete_Plaza.pdf`);
}
