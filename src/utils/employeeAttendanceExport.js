import { jsPDF } from 'jspdf';
import { calculateWorkDuration } from './attendanceCalculations';

/**
 * Compute day-by-day rows and summary stats for a single employee across a list of YYYY-MM-DD date strings.
 */
export function buildEmployeeAttendanceReportData(employee, dateStrings = [], attendance = {}) {
  const rows = [];
  let inOffice = 0;
  let wfh = 0;
  let late = 0;
  let halfDay = 0;
  let paidLeave = 0;
  let absent = 0;
  let weekOff = 0;
  let weekOffDuty = 0;
  let holiday = 0;
  let totalOt = 0;

  dateStrings.forEach((dateStr) => {
    const dObj = new Date(dateStr + 'T00:00:00');
    const dayOfWeek = dObj.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const weekday = dObj.toLocaleDateString('en-IN', { weekday: 'short' });

    const rec = attendance?.[dateStr]?.[employee?.id];
    const rawStatus = rec?.status || 'none';

    let statusLabel = 'Unmarked';
    let statusCode = 'none';

    if (rec?.status) {
      const isWODuty =
        rec.status === 'week_off_present' ||
        rec.status === 'wo_present' ||
        rec.isWeekOffDuty === true;

      if (rec.status === 'present') {
        inOffice++;
        if (isWODuty) {
          weekOffDuty++;
          statusLabel = 'WO Duty (Present)';
          statusCode = 'wo_duty';
        } else {
          statusLabel = 'Present';
          statusCode = 'present';
        }
      } else if (rec.status === 'week_off_present' || rec.status === 'wo_present') {
        inOffice++;
        weekOffDuty++;
        statusLabel = 'WO Duty (Present)';
        statusCode = 'wo_duty';
      } else if (rec.status === 'wfh') {
        wfh++;
        statusLabel = 'Work From Home';
        statusCode = 'wfh';
      } else if (rec.status === 'late') {
        inOffice++;
        late++;
        if (isWODuty) weekOffDuty++;
        statusLabel = 'Present (Late)';
        statusCode = 'late';
      } else if (rec.status === 'half_day') {
        halfDay++;
        statusLabel = 'Half Day';
        statusCode = 'half_day';
      } else if (rec.status === 'leave') {
        paidLeave++;
        statusLabel = 'Approved Leave';
        statusCode = 'leave';
      } else if (rec.status === 'absent') {
        absent++;
        statusLabel = 'Absent (LWP)';
        statusCode = 'absent';
      } else if (rec.status === 'week_off' || rec.status === 'wo') {
        weekOff++;
        statusLabel = 'Week Off';
        statusCode = 'week_off';
      } else if (rec.status === 'holiday' || rec.status === 'ph') {
        holiday++;
        statusLabel = 'Paid Holiday';
        statusCode = 'holiday';
      }
    }

    const otHours = Number(rec?.overtimeHours) || 0;
    totalOt += otHours;

    const clockIn = rec?.clockIn || '--';
    const clockOut = rec?.clockOut || '--';
    const workingHours =
      clockIn !== '--' && clockOut !== '--'
        ? calculateWorkDuration(clockIn, clockOut).workingHours
        : rec?.workingHours || '--';

    rows.push({
      dateStr,
      weekday,
      isWeekend,
      rawStatus,
      statusLabel,
      statusCode,
      clockIn,
      clockOut,
      workingHours,
      otHours,
      note: rec?.note || ''
    });
  });

  const earnedWeekOff = weekOff;

  const regularOffice = Math.max(0, inOffice - weekOffDuty);
  const payableDays =
    regularOffice +
    wfh +
    paidLeave +
    earnedWeekOff +
    holiday +
    halfDay * 0.5 +
    weekOffDuty * 2;

  return {
    rows,
    summary: {
      totalDays: dateStrings.length,
      inOffice,
      wfh,
      late,
      halfDay,
      paidLeave,
      absent,
      earnedWeekOff,
      weekOffDuty,
      holiday,
      totalOt,
      payableDays
    }
  };
}

/**
 * Download an individual employee's day-by-day attendance statement as a crisp A4 vector PDF.
 */
export function downloadEmployeeAttendancePdf(employee, dateStrings = [], attendance = {}, config = {}, periodTitle = '') {
  if (!employee) return;
  const { rows, summary } = buildEmployeeAttendanceReportData(employee, dateStrings, attendance);

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const companyName = (config?.companyName || 'SK ENTERPRISES').toUpperCase();
  const companyAddress =
    config?.companyAddress ||
    '303, Panchsheel CHS Ltd, Plot No 07, Sec-02, Taloja Phase-01, Navi Mumbai - 410208';

  // Top Header Band
  pdf.setFillColor(15, 23, 42);
  pdf.rect(10, 8, 190, 20, 'F');

  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.text(companyName, 15, 16);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(203, 213, 225);
  pdf.text(companyAddress, 15, 21);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  pdf.setTextColor(96, 165, 250);
  pdf.text('EMPLOYEE ATTENDANCE REPORT', 195, 15, { align: 'right' });

  pdf.setFontSize(8);
  pdf.setTextColor(255, 255, 255);
  pdf.text(`Period: ${periodTitle || 'Monthly Statement'}`, 195, 21, { align: 'right' });

  // Employee Identity Strip
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(203, 213, 225);
  pdf.rect(10, 30, 190, 14, 'FD');

  pdf.setTextColor(15, 23, 42);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  pdf.text(`${employee.name || 'Employee'} (${employee.id || ''})`, 14, 36);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(71, 85, 105);
  pdf.text(
    `Designation: ${employee.role || 'Staff'}   |   Department: ${employee.department || 'Operations'}   |   DOJ: ${employee.joiningDate || employee.joinDate || 'N/A'}`,
    14,
    41.5
  );

  // Summary KPI Strip
  pdf.setFillColor(239, 246, 255);
  pdf.setDrawColor(191, 219, 254);
  pdf.rect(10, 46, 190, 13, 'FD');

  const kpis = [
    { label: 'TOTAL DAYS', val: `${summary.totalDays}d` },
    { label: 'IN OFFICE', val: `${summary.inOffice}d` },
    { label: 'WFH', val: `${summary.wfh}d` },
    { label: 'WEEK OFF', val: `${summary.earnedWeekOff}d` },
    { label: 'HALF DAY', val: `${summary.halfDay}d` },
    { label: 'PAID LEAVE', val: `${summary.paidLeave}d` },
    { label: 'ABSENT', val: `${summary.absent}d` },
    { label: 'OT HOURS', val: `${summary.totalOt}h` },
    { label: 'PAYABLE DAYS', val: `${summary.payableDays}d` }
  ];

  const colW = 190 / kpis.length;
  kpis.forEach((k, idx) => {
    const cx = 10 + idx * colW + colW / 2;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.2);
    pdf.setTextColor(100, 116, 139);
    pdf.text(k.label, cx, 50.8, { align: 'center' });

    pdf.setFontSize(8.5);
    if (k.label === 'PAYABLE DAYS') {
      pdf.setTextColor(5, 150, 105);
    } else if (k.label === 'ABSENT') {
      pdf.setTextColor(225, 29, 72);
    } else {
      pdf.setTextColor(15, 23, 42);
    }
    pdf.text(k.val, cx, 56.5, { align: 'center' });
  });

  // Table Header
  let y = 62;
  const drawTableHeader = (topY) => {
    pdf.setFillColor(30, 41, 59);
    pdf.rect(10, topY, 190, 6.5, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.2);
    pdf.text('Date', 13, topY + 4.5);
    pdf.text('Day', 36, topY + 4.5);
    pdf.text('Attendance Status', 52, topY + 4.5);
    pdf.text('Check-In', 95, topY + 4.5);
    pdf.text('Check-Out', 118, topY + 4.5);
    pdf.text('Hours', 142, topY + 4.5);
    pdf.text('OT', 162, topY + 4.5);
    pdf.text('Remarks', 174, topY + 4.5);
    return topY + 6.5;
  };

  y = drawTableHeader(y);
  const rowH = rows.length <= 31 ? 6.2 : 5.8;

  rows.forEach((r, idx) => {
    if (y + rowH > 274) {
      pdf.addPage();
      y = drawTableHeader(12);
    }

    if (idx % 2 === 1) {
      pdf.setFillColor(248, 250, 252);
      pdf.rect(10, y, 190, rowH, 'F');
    }
    pdf.setDrawColor(226, 232, 240);
    pdf.line(10, y + rowH, 200, y + rowH);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.setTextColor(30, 41, 59);
    pdf.text(r.dateStr, 13, y + 4.2);

    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 116, 139);
    pdf.text(r.weekday, 36, y + 4.2);

    // Status Color
    pdf.setFont('helvetica', 'bold');
    if (r.statusCode === 'present' || r.statusCode === 'wo_duty') {
      pdf.setTextColor(5, 150, 105);
    } else if (r.statusCode === 'absent') {
      pdf.setTextColor(225, 29, 72);
    } else if (r.statusCode === 'week_off') {
      pdf.setTextColor(2, 132, 199);
    } else if (r.statusCode === 'half_day' || r.statusCode === 'late') {
      pdf.setTextColor(217, 119, 6);
    } else if (r.statusCode === 'leave' || r.statusCode === 'wfh') {
      pdf.setTextColor(124, 58, 237);
    } else {
      pdf.setTextColor(148, 163, 184);
    }
    pdf.text(r.statusLabel, 52, y + 4.2);

    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(51, 65, 85);
    pdf.text(String(r.clockIn), 95, y + 4.2);
    pdf.text(String(r.clockOut), 118, y + 4.2);
    pdf.text(String(r.workingHours), 142, y + 4.2);
    pdf.text(r.otHours > 0 ? `+${r.otHours}h` : '--', 162, y + 4.2);

    const shortNote = String(r.note || '').slice(0, 16);
    pdf.setFontSize(6.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text(shortNote, 174, y + 4.2);

    y += rowH;
  });

  // Footer Signature Lines
  const footerY = Math.min(285, Math.max(y + 10, 272));
  pdf.setDrawColor(148, 163, 184);
  pdf.line(15, footerY, 65, footerY);
  pdf.line(145, footerY, 195, footerY);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(71, 85, 105);
  pdf.text('Employee Signature', 40, footerY + 4, { align: 'center' });
  pdf.text(`Authorized Signatory (${companyName})`, 170, footerY + 4, { align: 'center' });

  const safePeriod = String(periodTitle || 'Report').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Attendance_${employee.name.replace(/\s+/g, '_')}_${employee.id}_${safePeriod}.pdf`;
  pdf.save(filename);
}

/**
 * Download an individual employee's day-by-day attendance statement as an Excel-compatible CSV file.
 */
export function downloadEmployeeAttendanceCsv(employee, dateStrings = [], attendance = {}, config = {}, periodTitle = '') {
  if (!employee) return;
  const { rows, summary } = buildEmployeeAttendanceReportData(employee, dateStrings, attendance);

  const lines = [
    [config?.companyName || 'SK ENTERPRISES', 'INDIVIDUAL EMPLOYEE ATTENDANCE REPORT'],
    ['Employee Name', employee.name, 'Employee ID', employee.id],
    ['Department', employee.department || 'Operations', 'Designation', employee.role || 'Staff'],
    ['Period', periodTitle || 'Monthly Report', 'Total Payable Days', summary.payableDays],
    [],
    ['Date', 'Day', 'Attendance Status', 'Check-In', 'Check-Out', 'Working Hours', 'Overtime (Hrs)', 'Remarks']
  ];

  rows.forEach((r) => {
    lines.push([
      r.dateStr,
      r.weekday,
      r.statusLabel,
      r.clockIn,
      r.clockOut,
      r.workingHours,
      r.otHours,
      `"${String(r.note || '').replace(/"/g, '""')}"`
    ]);
  });

  lines.push([]);
  lines.push([
    'SUMMARY TOTALS',
    `Total Days: ${summary.totalDays}`,
    `In Office: ${summary.inOffice}`,
    `WFH: ${summary.wfh}`,
    `Earned Week Off: ${summary.earnedWeekOff}`,
    `Half Days: ${summary.halfDay}`,
    `Paid Leaves: ${summary.paidLeave}`,
    `Absent: ${summary.absent}`,
    `Overtime Hours: ${summary.totalOt}`,
    `Payable Days: ${summary.payableDays}`
  ]);

  const csvContent = lines.map((r) => r.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const safePeriod = String(periodTitle || 'Report').replace(/[^a-zA-Z0-9_-]/g, '_');
  const a = document.createElement('a');
  a.href = url;
  a.download = `Attendance_${employee.name.replace(/\s+/g, '_')}_${employee.id}_${safePeriod}.csv`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1500);
}
