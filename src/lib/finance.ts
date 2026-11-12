/**
 * 純函式計算核心：所有計算機（伺服端與瀏覽器端）共用。
 * 沒有任何 DOM 依賴，可直接以 node --test 測試。
 */
import { INCOME_TAX, OVERTIME, PENSION, type IncomeTaxParams } from '../config/tw.ts';

/* ------------------------------------------------------------------ */
/* 貸款 / 房貸                                                          */
/* ------------------------------------------------------------------ */

/** 年利率(%) → 月利率(小數) */
export function monthlyRate(annualRatePct: number): number {
  return annualRatePct / 100 / 12;
}

/** 本息平均攤還 每月應付金額 */
export function pmt(principal: number, annualRatePct: number, months: number): number {
  if (months <= 0) return 0;
  const r = monthlyRate(annualRatePct);
  if (r === 0) return principal / months;
  const f = Math.pow(1 + r, months);
  return (principal * r * f) / (f - 1);
}

export type RateStage = {
  /** 本階段持續月數；最後一階段可用 Infinity */
  months: number;
  annualRatePct: number;
};

export type AmortizationInput = {
  principal: number;
  years: number;
  /** 單一利率（若提供 stages 則忽略） */
  annualRatePct?: number;
  /** 多段利率（例：新青安 前 2 年 / 之後） */
  stages?: RateStage[];
  /** 寬限期（年），期間只繳利息 */
  graceYears?: number;
  method?: 'annuity' | 'equalPrincipal';
};

export type ScheduleRow = {
  month: number;
  payment: number;
  interest: number;
  principal: number;
  balance: number;
  ratePct: number;
};

export type AmortizationResult = {
  rows: ScheduleRow[];
  firstPayment: number;
  /** 寬限期後第一期（若無寬限期則同 firstPayment） */
  afterGracePayment: number;
  maxPayment: number;
  totalPayment: number;
  totalInterest: number;
  months: number;
};

function rateAt(month: number, input: AmortizationInput): number {
  if (input.stages && input.stages.length) {
    let acc = 0;
    for (const s of input.stages) {
      acc += s.months;
      if (month <= acc) return s.annualRatePct;
    }
    return input.stages[input.stages.length - 1]!.annualRatePct;
  }
  return input.annualRatePct ?? 0;
}

/** 產生完整攤還表（支援寬限期、多段利率、本息/本金攤還） */
export function amortization(input: AmortizationInput): AmortizationResult {
  const months = Math.round(input.years * 12);
  const graceMonths = Math.round((input.graceYears ?? 0) * 12);
  const method = input.method ?? 'annuity';
  const rows: ScheduleRow[] = [];
  let balance = input.principal;
  let totalInterest = 0;
  let totalPayment = 0;
  let afterGracePayment = 0;
  let maxPayment = 0;

  for (let m = 1; m <= months; m++) {
    const ratePct = rateAt(m, input);
    const r = ratePct / 100 / 12;
    const interest = balance * r;
    let principalPaid: number;
    let payment: number;

    if (m <= graceMonths) {
      principalPaid = 0;
      payment = interest;
    } else {
      const remaining = months - m + 1;
      if (method === 'equalPrincipal') {
        principalPaid = balance / remaining;
        payment = principalPaid + interest;
      } else {
        // 每月以剩餘本金、剩餘期數與當期利率重算（利率變動時自動調整）
        payment = pmt(balance, ratePct, remaining);
        principalPaid = payment - interest;
      }
      if (m === graceMonths + 1) afterGracePayment = payment;
    }

    balance = Math.max(0, balance - principalPaid);
    totalInterest += interest;
    totalPayment += payment;
    if (payment > maxPayment) maxPayment = payment;
    rows.push({ month: m, payment, interest, principal: principalPaid, balance, ratePct });
  }

  return {
    rows,
    firstPayment: rows[0]?.payment ?? 0,
    afterGracePayment: afterGracePayment || (rows[0]?.payment ?? 0),
    maxPayment,
    totalPayment,
    totalInterest,
    months,
  };
}

export type YearRow = { year: number; payment: number; interest: number; principal: number; balance: number };

/** 攤還表依年彙總 */
export function yearlySummary(rows: ScheduleRow[]): YearRow[] {
  const out: YearRow[] = [];
  for (const r of rows) {
    const y = Math.ceil(r.month / 12);
    let row = out[y - 1];
    if (!row) {
      row = { year: y, payment: 0, interest: 0, principal: 0, balance: r.balance };
      out[y - 1] = row;
    }
    row.payment += r.payment;
    row.interest += r.interest;
    row.principal += r.principal;
    row.balance = r.balance;
  }
  return out;
}

/**
 * 總費用年百分率（APR）：把開辦費等一次性費用納入，求使現金流淨現值為 0 的年利率(%)。
 * 使用二分法，穩定不發散。
 */
export function loanApr(principal: number, annualRatePct: number, months: number, fees: number): number {
  const payment = pmt(principal, annualRatePct, months);
  const netReceived = principal - fees;
  if (netReceived <= 0 || months <= 0) return NaN;
  const npv = (rPct: number) => {
    const r = rPct / 100 / 12;
    if (r === 0) return payment * months - netReceived;
    return (payment * (1 - Math.pow(1 + r, -months))) / r - netReceived;
  };
  let lo = 0;
  let hi = 200;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (npv(mid) > 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/* ------------------------------------------------------------------ */
/* 複利 / 定期定額                                                      */
/* ------------------------------------------------------------------ */

export type CompoundInput = {
  initial: number;
  monthly: number;
  annualReturnPct: number;
  years: number;
  /** 每年增加投入金額的比例(%)，例：隨薪資成長 3% */
  annualIncreasePct?: number;
};

export type CompoundYear = { year: number; invested: number; value: number; gain: number };

export type CompoundResult = {
  years: CompoundYear[];
  finalValue: number;
  totalInvested: number;
  totalGain: number;
};

/** 定期定額（期初投入）複利試算，按月複利 */
export function compound(input: CompoundInput): CompoundResult {
  const r = input.annualReturnPct / 100 / 12;
  let value = input.initial;
  let invested = input.initial;
  let monthly = input.monthly;
  const years: CompoundYear[] = [];
  const totalMonths = Math.round(input.years * 12);
  for (let m = 1; m <= totalMonths; m++) {
    value = (value + monthly) * (1 + r);
    invested += monthly;
    if (m % 12 === 0) {
      years.push({ year: m / 12, invested, value, gain: value - invested });
      if (input.annualIncreasePct) monthly *= 1 + input.annualIncreasePct / 100;
    }
  }
  if (totalMonths % 12 !== 0) {
    years.push({ year: totalMonths / 12, invested, value, gain: value - invested });
  }
  return { years, finalValue: value, totalInvested: invested, totalGain: value - invested };
}

/** 反推：要在 N 年後達到目標金額，每月需投入多少 */
export function monthlyForTarget(target: number, initial: number, annualReturnPct: number, years: number): number {
  const r = annualReturnPct / 100 / 12;
  const n = Math.round(years * 12);
  if (n <= 0) return NaN;
  const fvInitial = initial * Math.pow(1 + r, n);
  const need = target - fvInitial;
  if (need <= 0) return 0;
  if (r === 0) return need / n;
  // 期初年金終值因子
  const factor = ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
  return need / factor;
}

/** 72 法則：資金翻倍所需年數 */
export function ruleOf72(annualReturnPct: number): number {
  return annualReturnPct > 0 ? 72 / annualReturnPct : Infinity;
}

/* ------------------------------------------------------------------ */
/* 綜合所得稅                                                           */
/* ------------------------------------------------------------------ */

export type IncomeTaxInput = {
  /** 薪資所得總額（本人＋配偶） */
  salaryIncome: number;
  /** 有薪資所得的人數（1 或 2），決定薪資特別扣除額上限 */
  salaryEarners: 1 | 2;
  /** 其他所得（租金、執行業務、利息以外的其他） */
  otherIncome: number;
  /** 利息所得（適用儲蓄投資特別扣除） */
  interestIncome: number;
  /** 股利所得 */
  dividendIncome: number;
  married: boolean;
  /** 扶養親屬（70 歲以下）人數，不含本人與配偶 */
  dependentsUnder70: number;
  /** 70 歲以上人數（含本人、配偶、直系尊親屬） */
  seniors70Plus: number;
  /** 6 歲以下子女人數 */
  preschoolChildren: number;
  /** 大專以上子女人數（教育學費） */
  collegeChildren: number;
  /** 身心障礙人數 */
  disabled: number;
  /** 長期照顧人數 */
  longTermCare: number;
  /** 全年房屋租金支出（適用房屋租金支出特別扣除額，無則 0） */
  rentPaid?: number;
  /** 列舉扣除額合計（0 = 採標準扣除額） */
  itemizedDeductions: number;
  /** 已扣繳稅額 */
  withheld: number;
};

export type IncomeTaxResult = {
  grossIncome: number;
  exemptions: number;
  generalDeduction: number;
  usedItemized: boolean;
  specialDeductions: {
    salary: number;
    savings: number;
    preschool: number;
    tuition: number;
    disability: number;
    longTermCare: number;
    rent: number;
    total: number;
  };
  basicLivingTotal: number;
  basicLivingDifference: number;
  netIncome: number;
  bracketRate: number;
  taxBeforeCredit: number;
  dividendMode: 'combined' | 'separate' | 'none';
  dividendCredit: number;
  dividendSeparateTax: number;
  taxPayable: number;
  balanceDue: number;
  effectiveRate: number;
};

function bracketFor(net: number, T: IncomeTaxParams) {
  for (const b of T.brackets) if (net <= b.upTo) return b;
  return T.brackets[T.brackets.length - 1]!;
}

export function progressiveTax(net: number, T: IncomeTaxParams = INCOME_TAX): { tax: number; rate: number } {
  if (net <= 0) return { tax: 0, rate: 0 };
  const b = bracketFor(net, T);
  return { tax: Math.max(0, net * b.rate - b.quick), rate: b.rate };
}

export function incomeTax(i: IncomeTaxInput, T: IncomeTaxParams = INCOME_TAX): IncomeTaxResult {
  const people = (i.married ? 2 : 1) + i.dependentsUnder70 + i.seniors70Plus;
  const under70 = people - i.seniors70Plus;
  const exemptions = under70 * T.exemption + i.seniors70Plus * T.exemptionSenior;

  const standard = i.married ? T.standardDeductionMarried : T.standardDeductionSingle;
  const usedItemized = i.itemizedDeductions > standard;
  const generalDeduction = usedItemized ? i.itemizedDeductions : standard;

  const salaryDed = Math.min(i.salaryIncome, T.salaryDeduction * i.salaryEarners);
  const savingsDed = Math.min(i.interestIncome, T.savingsCap);
  const preschoolDed =
    i.preschoolChildren > 0 ? T.preschoolFirst + Math.max(0, i.preschoolChildren - 1) * T.preschoolAdditional : 0;
  const tuitionDed = i.collegeChildren * T.tuition;
  const disabilityDed = i.disabled * T.disabilityDeduction;
  const ltcDed = i.longTermCare * T.longTermCare;
  // 房屋租金支出特別扣除額：本人、配偶或受扶養直系親屬無自有房屋且不採列舉購屋借款利息
  const rentDed = usedItemized ? 0 : Math.min(i.rentPaid ?? 0, T.rentCap);
  const specialTotal = salaryDed + savingsDed + preschoolDed + tuitionDed + disabilityDed + ltcDed + rentDed;

  // 基本生活費比較基礎：免稅額 + 一般扣除額 + 特別扣除額（不含薪資特別扣除額）
  const basicLivingTotal = T.basicLiving * people;
  const compareBase = exemptions + generalDeduction + (specialTotal - salaryDed);
  const basicLivingDifference = Math.max(0, basicLivingTotal - compareBase);

  const computeNet = (includeDividend: boolean) => {
    const gross = i.salaryIncome + i.otherIncome + i.interestIncome + (includeDividend ? i.dividendIncome : 0);
    return Math.max(0, gross - exemptions - generalDeduction - specialTotal - basicLivingDifference);
  };

  const grossIncome = i.salaryIncome + i.otherIncome + i.interestIncome + i.dividendIncome;

  // 方案 A：股利合併計稅，8.5% 可抵減（上限 8 萬）
  const netA = computeNet(true);
  const { tax: taxA, rate: rateA } = progressiveTax(netA, T);
  const creditA = Math.min(i.dividendIncome * T.dividendCreditRate, T.dividendCreditCap);
  const payableA = Math.max(0, taxA - creditA);

  // 方案 B：股利 28% 分開計稅
  const netB = computeNet(false);
  const { tax: taxB, rate: rateB } = progressiveTax(netB, T);
  const sepTax = i.dividendIncome * T.dividendSeparateRate;
  const payableB = taxB + sepTax;

  let result: Pick<
    IncomeTaxResult,
    'netIncome' | 'bracketRate' | 'taxBeforeCredit' | 'dividendMode' | 'dividendCredit' | 'dividendSeparateTax' | 'taxPayable'
  >;
  if (i.dividendIncome <= 0) {
    result = {
      netIncome: netA,
      bracketRate: rateA,
      taxBeforeCredit: taxA,
      dividendMode: 'none',
      dividendCredit: 0,
      dividendSeparateTax: 0,
      taxPayable: taxA,
    };
  } else if (payableA <= payableB) {
    result = {
      netIncome: netA,
      bracketRate: rateA,
      taxBeforeCredit: taxA,
      dividendMode: 'combined',
      dividendCredit: creditA,
      dividendSeparateTax: 0,
      taxPayable: payableA,
    };
  } else {
    result = {
      netIncome: netB,
      bracketRate: rateB,
      taxBeforeCredit: taxB,
      dividendMode: 'separate',
      dividendCredit: 0,
      dividendSeparateTax: sepTax,
      taxPayable: payableB,
    };
  }

  return {
    grossIncome,
    exemptions,
    generalDeduction,
    usedItemized,
    specialDeductions: {
      salary: salaryDed,
      savings: savingsDed,
      preschool: preschoolDed,
      tuition: tuitionDed,
      disability: disabilityDed,
      longTermCare: ltcDed,
      rent: rentDed,
      total: specialTotal,
    },
    basicLivingTotal,
    basicLivingDifference,
    ...result,
    balanceDue: result.taxPayable - i.withheld,
    effectiveRate: grossIncome > 0 ? result.taxPayable / grossIncome : 0,
  };
}

/* ------------------------------------------------------------------ */
/* 加班費                                                               */
/* ------------------------------------------------------------------ */

export type OvertimeInput = {
  monthlySalary: number;
  /** 平日延長工時（小時，單日最多 4） */
  weekdayHours: number;
  /** 休息日出勤（小時，單日最多 12） */
  restDayHours: number;
  /** 國定假日／特休出勤（小時，單日最多 12） */
  holidayHours: number;
};

export type OvertimeTier = { label: string; hours: number; multiplier: number; pay: number };

export type OvertimeResult = {
  hourlyWage: number;
  weekday: { tiers: OvertimeTier[]; total: number };
  restDay: { tiers: OvertimeTier[]; total: number };
  holiday: { tiers: OvertimeTier[]; total: number };
  total: number;
  warnings: string[];
};

function applyTiers(
  hours: number,
  tiers: ReadonlyArray<{ hours: number; multiplier: number }>,
  hourly: number,
  labels: string[],
): OvertimeTier[] {
  const out: OvertimeTier[] = [];
  let remaining = hours;
  tiers.forEach((t, idx) => {
    const h = Math.max(0, Math.min(remaining, t.hours));
    remaining -= h;
    if (h > 0) out.push({ label: labels[idx] ?? '', hours: h, multiplier: t.multiplier, pay: h * hourly * t.multiplier });
  });
  return out;
}

export function hourlyWage(monthlySalary: number): number {
  return monthlySalary / OVERTIME.hoursPerMonth;
}

export function overtimePay(i: OvertimeInput): OvertimeResult {
  const hourly = hourlyWage(i.monthlySalary);
  const warnings: string[] = [];

  const wkHours = Math.min(i.weekdayHours, 4);
  if (i.weekdayHours > 4) warnings.push('平日加班連同正常工時每日不得超過 12 小時，已以 4 小時計算。');
  const weekdayTiers = applyTiers(wkHours, OVERTIME.weekday, hourly, ['前 2 小時 ×1.34', '第 3–4 小時 ×1.67']);

  const rdHours = Math.min(i.restDayHours, OVERTIME.dailyCap);
  if (i.restDayHours > OVERTIME.dailyCap) warnings.push('休息日出勤每日不得超過 12 小時，已以 12 小時計算。');
  const restTiers = applyTiers(rdHours, OVERTIME.restDay, hourly, ['前 2 小時 ×1.34', '第 3–8 小時 ×1.67', '第 9–12 小時 ×2.67']);

  const hdHours = Math.min(i.holidayHours, OVERTIME.dailyCap);
  if (i.holidayHours > OVERTIME.dailyCap) warnings.push('國定假日出勤每日不得超過 12 小時，已以 12 小時計算。');
  const holidayTiers: OvertimeTier[] = [];
  if (hdHours > 0) {
    // 8 小時內：加發一日工資（不論實際出勤幾小時）
    holidayTiers.push({ label: '8 小時內加發 1 日工資', hours: Math.min(hdHours, 8), multiplier: 1, pay: hourly * 8 });
    const beyond = Math.max(0, hdHours - 8);
    holidayTiers.push(...applyTiers(beyond, OVERTIME.holidayBeyond8, hourly, ['第 9–10 小時 ×1.34', '第 11–12 小時 ×1.67']));
  }

  const sum = (t: OvertimeTier[]) => t.reduce((a, b) => a + b.pay, 0);
  const weekdayTotal = sum(weekdayTiers);
  const restTotal = sum(restTiers);
  const holidayTotal = sum(holidayTiers);

  return {
    hourlyWage: hourly,
    weekday: { tiers: weekdayTiers, total: weekdayTotal },
    restDay: { tiers: restTiers, total: restTotal },
    holiday: { tiers: holidayTiers, total: holidayTotal },
    total: weekdayTotal + restTotal + holidayTotal,
    warnings,
  };
}

/* ------------------------------------------------------------------ */
/* 勞退新制                                                             */
/* ------------------------------------------------------------------ */

export type PensionInput = {
  monthlySalary: number;
  /** 自提比例 %（0–6） */
  voluntaryRatePct: number;
  currentAge: number;
  retirementAge: number;
  /** 預估基金年化報酬 % */
  annualReturnPct: number;
  /** 每年薪資成長 % */
  salaryGrowthPct: number;
  /** 邊際稅率 %（用來估算自提節稅） */
  marginalTaxRatePct: number;
};

export type PensionResult = {
  years: number;
  contributionBase: number;
  employerMonthly: number;
  voluntaryMonthly: number;
  employerTotalContributed: number;
  voluntaryTotalContributed: number;
  employerFund: number;
  voluntaryFund: number;
  totalFund: number;
  /** 以保證利率、假設餘命估算的月退休金 */
  monthlyPension: number;
  /** 自提第一年節稅金額 */
  firstYearTaxSaving: number;
  /** 自提累計節稅（簡化：以目前邊際稅率估） */
  totalTaxSaving: number;
};

export function pensionProjection(i: PensionInput): PensionResult {
  const years = Math.max(0, i.retirementAge - i.currentAge);
  const months = years * 12;
  const r = i.annualReturnPct / 100 / 12;
  const vol = Math.max(0, Math.min(i.voluntaryRatePct, PENSION.maxVoluntaryRate * 100)) / 100;

  let salary = i.monthlySalary;
  let employerFund = 0;
  let voluntaryFund = 0;
  let employerContrib = 0;
  let voluntaryContrib = 0;
  let totalTaxSaving = 0;
  const base0 = Math.min(salary, PENSION.maxInsuredSalary);

  for (let m = 1; m <= months; m++) {
    const base = Math.min(salary, PENSION.maxInsuredSalary);
    const e = base * PENSION.employerRate;
    const v = base * vol;
    employerFund = (employerFund + e) * (1 + r);
    voluntaryFund = (voluntaryFund + v) * (1 + r);
    employerContrib += e;
    voluntaryContrib += v;
    totalTaxSaving += v * (i.marginalTaxRatePct / 100);
    if (m % 12 === 0) salary *= 1 + i.salaryGrowthPct / 100;
  }

  const totalFund = employerFund + voluntaryFund;
  const annuityMonths = PENSION.annuityYears * 12;
  const gr = PENSION.guaranteedRate / 12;
  const monthlyPension = gr === 0 ? totalFund / annuityMonths : (totalFund * gr) / (1 - Math.pow(1 + gr, -annuityMonths));

  return {
    years,
    contributionBase: base0,
    employerMonthly: base0 * PENSION.employerRate,
    voluntaryMonthly: base0 * vol,
    employerTotalContributed: employerContrib,
    voluntaryTotalContributed: voluntaryContrib,
    employerFund,
    voluntaryFund,
    totalFund,
    monthlyPension,
    firstYearTaxSaving: base0 * vol * 12 * (i.marginalTaxRatePct / 100),
    totalTaxSaving,
  };
}
