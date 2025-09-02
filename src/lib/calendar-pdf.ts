import PDFDocument from 'pdfkit';
import { Event } from '@/lib/types';

export interface CalendarPDFOptions {
  months: { year: number; month: number }[];
  events: Event[];
  title?: string;
}

export function generateCalendarPDF(options: CalendarPDFOptions): Buffer {
  const doc = new PDFDocument({ autoFirstPage: false, margin: 32 });
  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));
  doc.on('end', () => {});

  // Add a page for each month
  for (const { year, month } of options.months) {
    doc.addPage();
    doc.fontSize(22).fillColor('#2563eb').text(options.title || 'PonyClub Events Calendar', { align: 'center', underline: true });
    doc.moveDown(0.5);
    doc.fontSize(16).fillColor('#222').text(`${year} - ${month}`, { align: 'center' });
    doc.moveDown(1);

    // Draw calendar grid (7 columns for days)
    const daysInWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const cellWidth = 72;
    const cellHeight = 64;
    const startX = doc.page.margins.left;
    let y = doc.y;

    // Draw day headers
    for (let i = 0; i < 7; i++) {
      doc.rect(startX + i * cellWidth, y, cellWidth, cellHeight / 2).fill('#e0e7ff').stroke();
      doc.fillColor('#222').fontSize(12).text(daysInWeek[i], startX + i * cellWidth + 8, y + 8);
    }
    y += cellHeight / 2;

    // Calculate first day of month
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    let dayOfWeek = firstDay.getDay();
    let dayNum = 1;
    let row = 0;
    while (dayNum <= lastDay.getDate()) {
      for (let col = 0; col < 7; col++) {
        const x = startX + col * cellWidth;
        if ((row === 0 && col < dayOfWeek) || dayNum > lastDay.getDate()) {
          // Empty cell
          doc.rect(x, y, cellWidth, cellHeight).stroke();
        } else {
          // Day cell
          doc.rect(x, y, cellWidth, cellHeight).fill(col === 0 || col === 6 ? '#dbeafe' : '#fff').stroke();
          doc.fillColor('#222').fontSize(11).text(dayNum.toString(), x + 6, y + 6);
          // Events for this day
          const dayEvents = options.events.filter(e => {
            const d = new Date(e.date);
            return d.getFullYear() === year && d.getMonth() + 1 === month && d.getDate() === dayNum;
          });
          let eventY = y + 22;
          for (const event of dayEvents) {
            doc.roundedRect(x + 4, eventY, cellWidth - 8, 18, 6).fill(event.status === 'approved' ? '#e0f7fa' : '#fffbe6').stroke();
            doc.fillColor('#2563eb').fontSize(9).text(event.name, x + 8, eventY + 2, { width: cellWidth - 16 });
            eventY += 20;
          }
          dayNum++;
        }
      }
      y += cellHeight;
      row++;
    }
    doc.moveDown(2);
  }

  doc.end();
  return Buffer.concat(chunks);
}
