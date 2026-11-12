import test from 'node:test';
import assert from 'node:assert/strict';
import {
  pmt,
  amortization,
  yearlySummary,
  loanApr,
  compound,
  monthlyForTarget,
  incomeTax,
  overtimePay,
  hourlyWage,
  pensionProjection,
  progressiveTax,
} from '../src/lib/finance.ts';
import { INCOME_TAX_115, YOUTH_MORTGAGE } from '../src/config/tw.ts';

const close = (a: number, b: number, tol = 1) => assert.ok(Math.abs(a - b) <= tol, `${a} ≠ ${b} (±${tol})`);

test('pmt: 1,000 萬、2%、30 年 ≈ 36,962/月', () => {
  close(pmt(10_000_000, 2, 360), 36_962, 2);
});

test('pmt: 零利率 = 本金平均', () => {
  assert.equal(pmt(1_200_000, 0, 12), 100_000);
});

test('amortization: 本息攤還總還款 = 期數 × 月付', () => {
  const r = amortization({ principal: 10_000_000, years: 30, annualRatePct: 2 });
  assert.equal(r.months, 360);
  close(r.totalPayment, 36_962 * 360, 1000);
  close(r.rows[359]!.balance, 0, 1);
  close(r.totalInterest, r.totalPayment - 10_000_000, 1);
});

test('amortization: 寬限期只繳利息', () => {
  const r = amortization({ principal: 6_000_000, years: 20, annualRatePct: 2.4, graceYears: 2 });
  close(r.rows[0]!.payment, 6_000_000 * 0.024 / 12, 0.01);
  assert.equal(r.rows[0]!.principal, 0);
  assert.ok(r.afterGracePayment > r.firstPayment);
  close(r.rows[239]!.balance, 0, 1);
});

test('amortization: 本金平均攤還 每期本金固定、月付遞減', () => {
  const r = amortization({ principal: 2_400_000, years: 20, annualRatePct: 3, method: 'equalPrincipal' });
  close(r.rows[0]!.principal, 10_000, 0.01);
  close(r.rows[100]!.principal, 10_000, 0.01);
  assert.ok(r.rows[0]!.payment > r.rows[239]!.payment);
});

test('amortization: 多段利率（青安 3.0 五段退場）', () => {
  const r = amortization({
    principal: 8_000_000,
    years: 40,
    graceYears: 5,
    stages: [...YOUTH_MORTGAGE.stages],
  });
  assert.equal(r.rows[0]!.ratePct, 1.775);
  assert.equal(r.rows[35]!.ratePct, 1.775);
  assert.equal(r.rows[36]!.ratePct, 1.9);
  assert.equal(r.rows[48]!.ratePct, 2.025);
  assert.equal(r.rows[60]!.ratePct, 2.15);
  assert.equal(r.rows[72]!.ratePct, 2.275);
  assert.equal(r.rows[59]!.principal, 0); // 寬限期最後一月
  assert.ok(r.rows[60]!.principal > 0);
  close(r.rows[479]!.balance, 0, 1);
});

test('yearlySummary: 年數正確', () => {
  const r = amortization({ principal: 1_000_000, years: 5, annualRatePct: 3 });
  const y = yearlySummary(r.rows);
  assert.equal(y.length, 5);
  close(y.reduce((a, b) => a + b.principal, 0), 1_000_000, 1);
});

test('loanApr: 無費用時 APR = 名目利率；有費用時更高', () => {
  close(loanApr(500_000, 5, 60, 0), 5, 0.001);
  const apr = loanApr(500_000, 5, 60, 9_000);
  assert.ok(apr > 5 && apr < 7, `apr=${apr}`);
});

test('compound: 每月 10,000、7%、20 年 ≈ 524 萬（期初投入）', () => {
  const r = compound({ initial: 0, monthly: 10_000, annualReturnPct: 7, years: 20 });
  assert.equal(r.years.length, 20);
  assert.equal(r.totalInvested, 2_400_000);
  close(r.finalValue, 5_240_000, 20_000);
});

test('monthlyForTarget: 反推後再正算能達標', () => {
  const m = monthlyForTarget(10_000_000, 500_000, 6, 25);
  const r = compound({ initial: 500_000, monthly: m, annualReturnPct: 6, years: 25 });
  close(r.finalValue, 10_000_000, 1);
});

test('progressiveTax: 級距與累進差額', () => {
  assert.equal(progressiveTax(500_000).tax, 25_000);
  close(progressiveTax(1_000_000).tax, 1_000_000 * 0.12 - 41_300, 0.01);
  close(progressiveTax(3_000_000).tax, 3_000_000 * 0.3 - 413_700, 0.01);
});

test('incomeTax: 單身年薪 60 萬 → 淨額 = 60萬 − 9.7萬 − 13.1萬 − 21.8萬 = 15.4萬', () => {
  const r = incomeTax({
    salaryIncome: 600_000,
    salaryEarners: 1,
    otherIncome: 0,
    interestIncome: 0,
    dividendIncome: 0,
    married: false,
    dependentsUnder70: 0,
    seniors70Plus: 0,
    preschoolChildren: 0,
    collegeChildren: 0,
    disabled: 0,
    longTermCare: 0,
    itemizedDeductions: 0,
    withheld: 0,
  });
  assert.equal(r.exemptions, 97_000);
  assert.equal(r.generalDeduction, 131_000);
  assert.equal(r.specialDeductions.salary, 218_000);
  assert.equal(r.basicLivingDifference, 0); // 97,000+131,000 = 228,000 > 213,000
  assert.equal(r.netIncome, 154_000);
  assert.equal(r.taxPayable, 7_700);
  assert.equal(r.bracketRate, 0.05);
});

test('incomeTax: 115 年度參數（免稅額 101,000、標準 136,000、薪資 227,000）', () => {
  const r = incomeTax(
    {
      salaryIncome: 600_000,
      salaryEarners: 1,
      otherIncome: 0,
      interestIncome: 0,
      dividendIncome: 0,
      married: false,
      dependentsUnder70: 0,
      seniors70Plus: 0,
      preschoolChildren: 0,
      collegeChildren: 0,
      disabled: 0,
      longTermCare: 0,
      itemizedDeductions: 0,
      withheld: 0,
    },
    INCOME_TAX_115,
  );
  assert.equal(r.netIncome, 600_000 - 101_000 - 136_000 - 227_000);
  assert.equal(r.taxPayable, Math.round((600_000 - 101_000 - 136_000 - 227_000) * 0.05));
});

test('incomeTax: 房租特別扣除上限 18 萬，且列舉時不適用', () => {
  const base = {
    salaryIncome: 800_000,
    salaryEarners: 1 as const,
    otherIncome: 0,
    interestIncome: 0,
    dividendIncome: 0,
    married: false,
    dependentsUnder70: 0,
    seniors70Plus: 0,
    preschoolChildren: 0,
    collegeChildren: 0,
    disabled: 0,
    longTermCare: 0,
    rentPaid: 240_000,
    itemizedDeductions: 0,
    withheld: 0,
  };
  assert.equal(incomeTax(base).specialDeductions.rent, 180_000);
  assert.equal(incomeTax({ ...base, itemizedDeductions: 300_000 }).specialDeductions.rent, 0);
});

test('incomeTax: 單身低薪者基本生活費差額生效', () => {
  // 1 人：基本生活費 213,000 vs 免稅 97,000 + 標準 131,000 = 228,000 → 差額 0
  // 2 人（扶養 1 人）：426,000 vs 194,000 + 131,000 = 325,000 → 差額 101,000
  const r = incomeTax({
    salaryIncome: 700_000,
    salaryEarners: 1,
    otherIncome: 0,
    interestIncome: 0,
    dividendIncome: 0,
    married: false,
    dependentsUnder70: 1,
    seniors70Plus: 0,
    preschoolChildren: 0,
    collegeChildren: 0,
    disabled: 0,
    longTermCare: 0,
    itemizedDeductions: 0,
    withheld: 0,
  });
  assert.equal(r.basicLivingDifference, 101_000);
  assert.equal(r.netIncome, 700_000 - 194_000 - 131_000 - 218_000 - 101_000);
});

test('incomeTax: 雙薪 4 口之家（2 幼兒）基本生活費差額有效', () => {
  const r = incomeTax({
    salaryIncome: 1_500_000,
    salaryEarners: 2,
    otherIncome: 0,
    interestIncome: 0,
    dividendIncome: 0,
    married: true,
    dependentsUnder70: 2,
    seniors70Plus: 0,
    preschoolChildren: 2,
    collegeChildren: 0,
    disabled: 0,
    longTermCare: 0,
    itemizedDeductions: 0,
    withheld: 0,
  });
  assert.equal(r.exemptions, 97_000 * 4);
  assert.equal(r.generalDeduction, 262_000);
  assert.equal(r.specialDeductions.preschool, 150_000 + 225_000);
  assert.equal(r.specialDeductions.salary, 436_000);
  assert.equal(r.basicLivingTotal, 852_000);
  // 比較基礎 = 388,000 + 262,000 + 375,000 = 1,025,000 > 852,000 → 差額 0
  assert.equal(r.basicLivingDifference, 0);
  assert.equal(r.netIncome, 1_500_000 - 388_000 - 262_000 - 436_000 - 375_000);
  assert.equal(r.netIncome, 39_000);
});

test('incomeTax: 股利自動選較低稅負方案', () => {
  const base = {
    salaryIncome: 800_000,
    salaryEarners: 1 as const,
    otherIncome: 0,
    interestIncome: 0,
    married: false,
    dependentsUnder70: 0,
    seniors70Plus: 0,
    preschoolChildren: 0,
    collegeChildren: 0,
    disabled: 0,
    longTermCare: 0,
    itemizedDeductions: 0,
    withheld: 0,
  };
  const low = incomeTax({ ...base, dividendIncome: 200_000 });
  assert.equal(low.dividendMode, 'combined');
  assert.equal(low.dividendCredit, 17_000);
  const high = incomeTax({ ...base, salaryIncome: 6_000_000, dividendIncome: 3_000_000 });
  assert.equal(high.dividendMode, 'separate');
});

test('hourlyWage: 月薪 36,000 → 時薪 150', () => {
  assert.equal(hourlyWage(36_000), 150);
});

test('overtimePay: 平日 3 小時 = 150×(2×1.34+1×1.67) = 652.5', () => {
  const r = overtimePay({ monthlySalary: 36_000, weekdayHours: 3, restDayHours: 0, holidayHours: 0 });
  close(r.weekday.total, 652.5, 0.01);
  assert.equal(r.total, r.weekday.total);
});

test('overtimePay: 休息日 10 小時三段倍率 = 402 + 1503 + 801', () => {
  const r = overtimePay({ monthlySalary: 36_000, weekdayHours: 0, restDayHours: 10, holidayHours: 0 });
  close(r.restDay.total, 150 * (2 * 1.34 + 6 * 1.67 + 2 * 2.67), 0.01);
  close(r.restDay.total, 2_706, 0.01);
});

test('overtimePay: 國定假日 3 小時仍加發一日工資；10 小時加計延長', () => {
  const a = overtimePay({ monthlySalary: 36_000, weekdayHours: 0, restDayHours: 0, holidayHours: 3 });
  assert.equal(a.holiday.total, 1_200);
  const b = overtimePay({ monthlySalary: 36_000, weekdayHours: 0, restDayHours: 0, holidayHours: 10 });
  close(b.holiday.total, 1_200 + 2 * 150 * 1.34, 0.01);
});

test('overtimePay: 超時給警告並封頂', () => {
  const r = overtimePay({ monthlySalary: 36_000, weekdayHours: 6, restDayHours: 14, holidayHours: 0 });
  assert.equal(r.warnings.length, 2);
});

test('pensionProjection: 自提 6% 與雇主 6% 金額相同；上限 15 萬', () => {
  const r = pensionProjection({
    monthlySalary: 200_000,
    voluntaryRatePct: 6,
    currentAge: 30,
    retirementAge: 60,
    annualReturnPct: 4,
    salaryGrowthPct: 0,
    marginalTaxRatePct: 20,
  });
  assert.equal(r.contributionBase, 150_000);
  assert.equal(r.employerMonthly, 9_000);
  assert.equal(r.voluntaryMonthly, 9_000);
  assert.equal(r.years, 30);
  close(r.employerFund, r.voluntaryFund, 0.01);
  assert.equal(r.firstYearTaxSaving, 9_000 * 12 * 0.2);
  assert.ok(r.totalFund > r.employerTotalContributed + r.voluntaryTotalContributed);
  assert.ok(r.monthlyPension > 0);
});
