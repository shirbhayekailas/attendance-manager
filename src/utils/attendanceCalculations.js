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

export function calculateMonthlyPayrollStats({
  empId,
  attendanceData = {},
  baseSalary = 100000,
  year = new Date().getFullYear(),
  month = new Date().getMonth(), // 0-indexed (0 = Jan, 8 = Sep, 9 = Oct)
  statutoryType = 'pf_esic',
  siteAllowance = 0,
  advanceDeduction = 0
}) {
  const safeAttendance = attendanceData || {};
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthName = new Date(year, month, 1).toLocaleString('default', { month: 'long' });

  // EXACT PER-DAY FORMULA (As requested by user: 30 days -> /30, 31 days -> /31, etc.)
  const perDaySalary = Math.round((baseSalary / daysInMonth) * 100) / 100;
  const hourlyRate = Math.round((perDaySalary / 8) * 100) / 100;

  let inOffice = 0;
  let wfh = 0;
  let late = 0;
  let halfDay = 0;
  let paidLeave = 0;
  let unpaidAbsent = 0;
  let weekOff = 0;
  let holidays = 0;
  let weekOffDuty = 0; // Worked on a Week Off (WO Duty / Present)
  let totalOvertimeHours = 0;

  const dayLogs = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${monthPrefix}-${String(d).padStart(2, '0')}`;
    const dateObj = new Date(year, month, d);
    const dayOfWeek = dateObj.getDay();
    const isSunday = dayOfWeek === 0;
    const rec = safeAttendance[dateStr]?.[empId];

    let status = rec?.status || (isSunday ? 'week_off' : 'none');
    const ot = (rec?.overtimeHours !== undefined && rec?.overtimeHours !== null && rec?.overtimeHours !== '')
      ? Number(rec.overtimeHours)
      : ((rec?.clockIn && rec?.clockOut && rec.clockIn !== '--' && rec.clockOut !== '--')
        ? calculateWorkDuration(rec.clockIn, rec.clockOut).overtimeHours
        : 0);

    totalOvertimeHours += ot;

    if (rec && rec.status) {
      status = rec.status;
      const isWODuty = status === 'week_off_present' || status === 'wo_present' || rec.isWeekOffDuty || (status === 'present' && isSunday);

      if (status === 'present') {
        inOffice++;
        if (isWODuty) {
          weekOffDuty++;
        }
      } else if (status === 'wfh') {
        wfh++;
        if (isWODuty) {
          weekOffDuty++;
        }
      } else if (status === 'late') {
        inOffice++;
        late++;
        if (isWODuty) {
          weekOffDuty++;
        }
      } else if (status === 'half_day') {
        halfDay++;
      } else if (status === 'leave') {
        paidLeave++;
      } else if (status === 'absent') {
        unpaidAbsent++;
      } else if (status === 'week_off' || status === 'wo') {
        weekOff++;
      } else if (status === 'holiday' || status === 'ph') {
        holidays++;
      } else if (status === 'week_off_present' || status === 'wo_present') {
        inOffice++;
        weekOffDuty++;
      }
    } else {
      if (isSunday) {
        weekOff++;
      } else {
        const todayStr = new Date().toISOString().split('T')[0];
        if (dateStr <= todayStr) {
          unpaidAbsent++;
        }
      }
    }

    dayLogs.push({
      day: d,
      dateStr,
      weekday: dateObj.toLocaleDateString(undefined, { weekday: 'short' }),
      status,
      overtimeHours: ot,
      clockIn: rec?.clockIn || '--',
      clockOut: rec?.clockOut || '--',
    });
  }

  // Enterprise HRMS Standard (Keka / GreytHR / Darwinbox):
  // 1. Regular Cycle Payable Days: Weekday working days + paid leaves + all calendar week-offs + holidays
  const regularOffice = Math.max(0, inOffice - weekOffDuty);
  const totalCalendarWeekOffs = weekOff + weekOffDuty;
  const standardRegularPayable = Math.min(daysInMonth, regularOffice + wfh + paidLeave + totalCalendarWeekOffs + holidays + (halfDay * 0.5));
  
  // 2. Week Off Duty (WO-P / Rest Day Working): Adds +1 full payable day to total paid days!
  const payableDays = standardRegularPayable + weekOffDuty;
  const lopDays = Math.max(0, daysInMonth - standardRegularPayable);

  const lossOfPayDeduction = Math.round(lopDays * perDaySalary);
  const earnedBasic = Math.max(0, Math.round(baseSalary - lossOfPayDeduction));
  const overtimePay = Math.round(totalOvertimeHours * hourlyRate * 1.5);
  const weekOffDutyPay = Math.round(weekOffDuty * perDaySalary); // Extra 1.0x day pay for working on rest day

  const grossEarnings = earnedBasic + overtimePay + weekOffDutyPay + (Number(siteAllowance) || 0);

  // Statutory Deductions
  const isPfEsic = statutoryType !== 'non_pf_esic';
  let epf = 0;
  let esic = 0;
  if (isPfEsic) {
    epf = Math.min(Math.round(earnedBasic * 0.12), 1800);
    if (grossEarnings <= 21000) {
      esic = Math.round(grossEarnings * 0.0075);
    }
  }

  const pt = 200;
  const taxableSalary = Math.max(0, grossEarnings - (isPfEsic ? earnedBasic * 0.12 : 0) - 40000);
  const tds = taxableSalary > 30000 ? Math.round(taxableSalary * 0.05) : 0;
  const advances = Number(advanceDeduction) || 0;

  const totalDeductions = epf + esic + pt + tds + advances + lossOfPayDeduction;
  const netPayable = Math.max(0, grossEarnings - totalDeductions);

  return {
    year,
    month,
    monthName,
    monthYearStr: `${monthName} ${year}`,
    daysInMonth,
    perDaySalary,
    hourlyRate,
    inOffice,
    wfh,
    late,
    halfDay,
    paidLeave,
    unpaidAbsent: lopDays,
    weekOff,
    holidays,
    weekOffDuty,
    totalOvertimeHours: Number(totalOvertimeHours.toFixed(1)),
    payableDays,
    lopDays,
    baseSalary,
    earnedBasic,
    overtimePay,
    weekOffDutyPay,
    siteAllowance: Number(siteAllowance) || 0,
    grossEarnings,
    epf,
    esic,
    pt,
    tds,
    advanceDeduction: advances,
    lossOfPayDeduction,
    totalDeductions,
    netPayable,
    dayLogs,
  };
}

export function calculateEmployeeStats(empId, attendanceData = {}, baseSalary = 100000, totalCycleDays = null) {
  const safeAttendance = attendanceData || {};
  const dates = Object.keys(safeAttendance).sort();
  let totalWorkingDays = 0;
  let inOffice = 0;
  let wfh = 0;
  let late = 0;
  let halfDay = 0;
  let paidLeave = 0;
  let unpaidAbsent = 0;
  let weekOff = 0;
  let holidays = 0;
  let weekOffDuty = 0;
  let totalOvertimeHours = 0;

  const logs = [];

  dates.forEach((date) => {
    const record = safeAttendance[date]?.[empId];
    if (record && record.status) {
      totalWorkingDays++;
      const status = record.status;

      // Compute actual real working duration from punch in and punch out
      const actualDuration = (record.clockIn && record.clockOut && record.clockIn !== '--' && record.clockOut !== '--')
        ? calculateWorkDuration(record.clockIn, record.clockOut)
        : null;

      const workingHours = actualDuration ? actualDuration.workingHours : (record.workingHours || "--");
      const ot = (record.overtimeHours !== undefined && record.overtimeHours !== null && record.overtimeHours !== '')
        ? Number(record.overtimeHours)
        : (actualDuration ? actualDuration.overtimeHours : 0);
      totalOvertimeHours += ot;

      const dateObj = new Date(date + 'T00:00:00');
      const isSun = dateObj.getDay() === 0;
      const isWODuty = record.isWeekOffDuty || isSun || /week.?off|sunday|wo/i.test(record.note || '') || status === "week_off_present" || status === "wo_present";

      if (status === "present") {
        inOffice++;
        if (isWODuty) {
          weekOffDuty++;
        }
      }
      else if (status === "wfh") {
        wfh++;
        if (isWODuty) {
          weekOffDuty++;
        }
      }
      else if (status === "late") {
        inOffice++;
        late++;
        if (isWODuty) {
          weekOffDuty++;
        }
      } else if (status === "half_day") halfDay++;
      else if (status === "leave") paidLeave++;
      else if (status === "absent") unpaidAbsent++;
      else if (status === "week_off" || status === "wo") weekOff++;
      else if (status === "holiday" || status === "ph") holidays++;
      else if (status === "week_off_present" || status === "wo_present") {
        inOffice++;
        weekOffDuty++;
      }

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

  // Enterprise HRMS Standard: Working on a Week-Off adds +1.0 full day to total payable days
  const regularInOffice = Math.max(0, inOffice - weekOffDuty);
  const totalAllWeekOffs = weekOff + weekOffDuty;
  const payableDays = regularInOffice + wfh + paidLeave + totalAllWeekOffs + holidays + (halfDay * 0.5) + weekOffDuty;

  // Overall Attendance Percentage
  const attendanceRate = totalWorkingDays > 0 ? Number(((payableDays / totalWorkingDays) * 100).toFixed(1)) : 0;

  // Punctuality rate
  const totalInPersonDays = inOffice;
  const onTimeDays = Math.max(0, totalInPersonDays - late);
  const punctualityRate = totalInPersonDays > 0 ? Number(((onTimeDays / totalInPersonDays) * 100).toFixed(1)) : 100;

  // Financial Payroll Calculation: dynamically calculate days in current month if totalCycleDays not specified
  const currentMonthDays = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const standardMonthDays = (typeof totalCycleDays === 'number' && totalCycleDays > 0) ? totalCycleDays : currentMonthDays;
  const perDaySalary = Math.round((baseSalary / standardMonthDays) * 100) / 100;
  const hourlyRate = Math.round((perDaySalary / 8) * 100) / 100;
  const overtimePay = Math.round(totalOvertimeHours * hourlyRate * 1.5);
  const weekOffDutyPay = Math.round(weekOffDuty * perDaySalary);
  const lossOfPayDeduction = Math.round(unpaidAbsent * perDaySalary);
  const netEstimatedSalary = Math.max(0, Math.round((payableDays * perDaySalary) + overtimePay));

  // Streak
  let activeStreak = 0;
  for (let i = logs.length - 1; i >= 0; i--) {
    const st = logs[i].status;
    if (st === "present" || st === "wfh" || st === "late" || st === "week_off_present") {
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
    weekOff,
    holidays,
    weekOffDuty,
    totalOvertimeHours: Number(totalOvertimeHours.toFixed(1)),
    payableDays,
    attendanceRate,
    punctualityRate,
    activeStreak,
    perDaySalary,
    overtimePay,
    weekOffDutyPay,
    lossOfPayDeduction,
    netEstimatedSalary,
    historyList: logs.reverse(),
  };
}

export function getCompanyDailyOverview(dateStr, employees = [], attendanceData = {}) {
  const safeAttendance = attendanceData || {};
  const dayRecords = safeAttendance[dateStr] || {};
  const safeEmployees = employees || [];
  const totalEmployees = safeEmployees.length;
  let inOffice = 0;
  let wfh = 0;
  let late = 0;
  let halfDay = 0;
  let onLeave = 0;
  let absent = 0;
  let weekOff = 0;
  let holidays = 0;
  let unmarked = 0;

  safeEmployees.forEach((emp) => {
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
      else if (rec.status === "week_off" || rec.status === "wo") weekOff++;
      else if (rec.status === "holiday" || rec.status === "ph") holidays++;
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
    weekOff,
    holidays,
    unmarked,
    presentTotal,
    attendancePercentage,
  };
}

export function getCompanyRecentTrend(attendanceData = {}, employees = [], limit = 7) {
  const safeAttendance = attendanceData || {};
  const safeEmployees = employees || [];
  const dates = Object.keys(safeAttendance).sort().slice(-limit);
  return dates.map((date) => {
    const overview = getCompanyDailyOverview(date, safeEmployees, safeAttendance);
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
