// Enterprise Corporate HR Attendance & Payroll Analytics Engine

export function parseTimeToSeconds(timeStr) {
  if (!timeStr || timeStr === '--') return null;
  const clean = timeStr.replace(/[^0-9:APMapm ]/g, '').trim();
  const isPM = /PM/i.test(clean);
  const isAM = /AM/i.test(clean);
  const parts = clean.replace(/[APMapm]/g, '').trim().split(':');
  if (parts.length < 2) return null;

  let hours = parseInt(parts[0], 10);
  let minutes = parseInt(parts[1], 10) || 0;
  let seconds = parts[2] ? parseInt(parts[2], 10) : 0;

  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;

  return hours * 3600 + minutes * 60 + seconds;
}

export function calculateWorkDuration(clockIn, clockOut) {
  if (!clockIn || !clockOut || clockIn === '--' || clockOut === '--') {
    return { workingHours: '--', overtimeHours: 0, totalSeconds: 0 };
  }

  const inSec = parseTimeToSeconds(clockIn);
  const outSec = parseTimeToSeconds(clockOut);

  if (inSec === null || outSec === null) {
    return { workingHours: '--', overtimeHours: 0, totalSeconds: 0 };
  }

  let diffSec = outSec - inSec;
  if (diffSec < 0) {
    // Crosses midnight shift
    diffSec += 24 * 3600;
  }

  const hours = Math.floor(diffSec / 3600);
  const minutes = Math.floor((diffSec % 3600) / 60);
  const seconds = diffSec % 60;

  let workingHours;
  if (hours > 0) {
    workingHours = `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    workingHours = `${minutes}m ${seconds}s`;
  } else {
    workingHours = `${seconds}s`;
  }

  // Standard full day is 8 hours (28800 seconds)
  const standardDaySec = 8 * 3600;
  let overtimeHours = 0;
  if (diffSec > standardDaySec) {
    overtimeHours = Number(((diffSec - standardDaySec) / 3600).toFixed(2));
  }

  return {
    workingHours,
    overtimeHours,
    totalSeconds: diffSec,
    hours,
    minutes,
    seconds,
  };
}

export function calculateEmployeeStats(empId, attendanceData, baseSalary = 100000, totalCycleDays = 22) {
  const dates = Object.keys(attendanceData).sort();
  let totalWorkingDays = 0;
  let inOffice = 0;
  let wfh = 0;
  let late = 0;
  let halfDay = 0;
  let paidLeave = 0;
  let unpaidAbsent = 0;
  let totalOvertimeHours = 0;

  const logs = [];

  dates.forEach((date) => {
    const record = attendanceData[date]?.[empId];
    if (record && record.status) {
      totalWorkingDays++;
      const status = record.status;

      // Compute actual real working duration from punch in and punch out
      const actualDuration = (record.clockIn && record.clockOut && record.clockIn !== '--' && record.clockOut !== '--')
        ? calculateWorkDuration(record.clockIn, record.clockOut)
        : null;

      const workingHours = actualDuration ? actualDuration.workingHours : (record.workingHours || "--");
      const ot = actualDuration ? actualDuration.overtimeHours : (record.overtimeHours || 0);
      totalOvertimeHours += ot;

      if (status === "present") inOffice++;
      else if (status === "wfh") wfh++;
      else if (status === "late") {
        inOffice++;
        late++;
      } else if (status === "half_day") halfDay++;
      else if (status === "leave") paidLeave++;
      else if (status === "absent") unpaidAbsent++;

      logs.push({
        date,
        status,
        clockIn: record.clockIn || "--",
        clockOut: record.clockOut || "--",
        workingHours,
        overtimeHours: ot,
        note: record.note || "",
      });
    }
  });

  // Payable Days = In-Office + WFH + Paid Leaves + 0.5 * HalfDay
  const payableDays = inOffice + wfh + paidLeave + (halfDay * 0.5);

  // Overall Attendance Percentage
  const attendanceRate = totalWorkingDays > 0 ? Number(((payableDays / totalWorkingDays) * 100).toFixed(1)) : 0;

  // Punctuality rate
  const totalInPersonDays = inOffice;
  const onTimeDays = Math.max(0, totalInPersonDays - late);
  const punctualityRate = totalInPersonDays > 0 ? Number(((onTimeDays / totalInPersonDays) * 100).toFixed(1)) : 100;

  // Financial Payroll Calculation
  const standardMonthDays = totalCycleDays || 22;
  const perDaySalary = Math.round(baseSalary / standardMonthDays);
  const hourlyRate = Math.round(perDaySalary / 8);
  const overtimePay = Math.round(totalOvertimeHours * hourlyRate * 1.5); // 1.5x Overtime rate
  const lossOfPayDeduction = Math.round(unpaidAbsent * perDaySalary);
  const netEstimatedSalary = Math.max(0, Math.round((payableDays * perDaySalary) + overtimePay));

  // Streak
  let activeStreak = 0;
  for (let i = logs.length - 1; i >= 0; i--) {
    const st = logs[i].status;
    if (st === "present" || st === "wfh" || st === "late") {
      activeStreak++;
    } else {
      break;
    }
  }

  return {
    totalWorkingDays,
    inOffice,
    wfh,
    late,
    halfDay,
    paidLeave,
    unpaidAbsent,
    totalOvertimeHours: Number(totalOvertimeHours.toFixed(1)),
    payableDays,
    attendanceRate,
    punctualityRate,
    activeStreak,
    perDaySalary,
    overtimePay,
    lossOfPayDeduction,
    netEstimatedSalary,
    historyList: logs.reverse(),
  };
}

export function getCompanyDailyOverview(dateStr, employees, attendanceData) {
  const dayRecords = attendanceData[dateStr] || {};
  const totalEmployees = employees.length;
  let inOffice = 0;
  let wfh = 0;
  let late = 0;
  let halfDay = 0;
  let onLeave = 0;
  let absent = 0;
  let unmarked = 0;

  employees.forEach((emp) => {
    const rec = dayRecords[emp.id];
    if (!rec || !rec.status) {
      unmarked++;
    } else {
      if (rec.status === "present") inOffice++;
      else if (rec.status === "wfh") wfh++;
      else if (rec.status === "late") {
        inOffice++;
        late++;
      }
      else if (rec.status === "half_day") halfDay++;
      else if (rec.status === "leave") onLeave++;
      else if (rec.status === "absent") absent++;
    }
  });

  const presentTotal = inOffice + wfh;
  const markedTotal = totalEmployees - unmarked;
  const attendancePercentage = markedTotal > 0 
    ? Number(((presentTotal + halfDay * 0.5) / markedTotal * 100).toFixed(1)) 
    : 0;

  return {
    date: dateStr,
    totalEmployees,
    inOffice,
    wfh,
    late,
    halfDay,
    onLeave,
    absent,
    unmarked,
    presentTotal,
    attendancePercentage,
  };
}

export function getCompanyRecentTrend(attendanceData, employees, limit = 7) {
  const dates = Object.keys(attendanceData).sort().slice(-limit);
  return dates.map((date) => {
    const overview = getCompanyDailyOverview(date, employees, attendanceData);
    return {
      date,
      displayDate: new Date(date + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" }),
      inOffice: overview.inOffice,
      wfh: overview.wfh,
      late: overview.late,
      onLeave: overview.onLeave,
      absent: overview.absent,
      rate: overview.attendancePercentage,
    };
  });
}

// Indian Statutory PF & ESIC Compliance Calculator (Base Salary = Basic Salary 100%)
export function calculateStatutoryComponents(baseMonthly = 100000, statutoryType = 'pf_esic', overtimePay = 0) {
  const isPfEsic = statutoryType !== 'non_pf_esic';

  // Base Salary and Basic Salary are ONE AND THE SAME (100%)
  const basic = Number(baseMonthly) || 0;
  const grossEarnings = basic + (overtimePay || 0);

  let epf = 0;
  let esic = 0;

  if (isPfEsic) {
    // EPF: 12% of Basic Salary, statutory ceiling capped at ₹1,800/mo (12% of ₹15,000 wage limit)
    epf = Math.min(Math.round(basic * 0.12), 1800);

    // ESIC: Applicable if gross earnings <= ₹21,000/month; employee contribution is 0.75% of gross
    if (grossEarnings <= 21000) {
      esic = Math.round(grossEarnings * 0.0075);
    } else {
      esic = 0;
    }
  }

  return {
    basic,
    grossEarnings,
    epf,
    esic,
    isPfEsic,
    esicApplicable: isPfEsic && grossEarnings <= 21000,
  };
}
