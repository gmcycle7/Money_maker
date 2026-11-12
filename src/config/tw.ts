/**
 * 台灣法規／稅務常數。
 * 每年 1 月與 5 月請對照官方公告更新一次（來源見每個區塊註解）。
 * 修改這個檔案即可讓所有計算機同步更新，不用改程式。
 */

export type TaxBracket = { upTo: number; rate: number; quick: number };

export type IncomeTaxParams = {
  /** 民國年度（所得年度） */
  taxYear: number;
  /** 申報年份（西元） */
  filingYear: number;
  /** 免稅額（每人） */
  exemption: number;
  /** 70 歲以上本人、配偶、直系尊親屬免稅額 */
  exemptionSenior: number;
  /** 標準扣除額 */
  standardDeductionSingle: number;
  standardDeductionMarried: number;
  /** 薪資所得特別扣除額（每人上限） */
  salaryDeduction: number;
  /** 身心障礙特別扣除額（每人） */
  disabilityDeduction: number;
  /** 幼兒學前特別扣除額：第 1 名 / 第 2 名起（6 歲以下） */
  preschoolFirst: number;
  preschoolAdditional: number;
  /** 長期照顧特別扣除額（每人） */
  longTermCare: number;
  /** 教育學費特別扣除額（每名大專以上子女上限） */
  tuition: number;
  /** 儲蓄投資特別扣除額（每戶上限） */
  savingsCap: number;
  /** 房屋租金支出特別扣除額（每戶上限） */
  rentCap: number;
  /** 基本生活費（每人） */
  basicLiving: number;
  /** 課稅級距（上限、稅率、累進差額） */
  brackets: TaxBracket[];
  /** 股利 8.5% 可抵減稅額，每戶上限 */
  dividendCreditRate: number;
  dividendCreditCap: number;
  /** 股利分開計稅稅率 */
  dividendSeparateRate: number;
  /** 資料來源／備註（顯示於頁面） */
  note: string;
};

/**
 * 綜合所得稅 114 年度所得（2026 年 5 月申報）
 * 來源：財政部 114.12.27 公告基本生活費 213,000；行政院公報 114 年度免稅額等公告
 */
export const INCOME_TAX_114: IncomeTaxParams = {
  taxYear: 114,
  filingYear: 2026,
  exemption: 97_000,
  exemptionSenior: 145_500,
  standardDeductionSingle: 131_000,
  standardDeductionMarried: 262_000,
  salaryDeduction: 218_000,
  disabilityDeduction: 218_000,
  preschoolFirst: 150_000,
  preschoolAdditional: 225_000,
  longTermCare: 180_000,
  tuition: 25_000,
  savingsCap: 270_000,
  rentCap: 180_000,
  basicLiving: 213_000,
  brackets: [
    { upTo: 590_000, rate: 0.05, quick: 0 },
    { upTo: 1_330_000, rate: 0.12, quick: 41_300 },
    { upTo: 2_660_000, rate: 0.2, quick: 147_700 },
    { upTo: 4_980_000, rate: 0.3, quick: 413_700 },
    { upTo: Infinity, rate: 0.4, quick: 911_700 },
  ],
  dividendCreditRate: 0.085,
  dividendCreditCap: 80_000,
  dividendSeparateRate: 0.28,
  note: '114 年度所得（2026 年 5 月申報）。基本生活費 213,000 依財政部 114 年 12 月公告。',
};

/**
 * 綜合所得稅 115 年度所得（2027 年 5 月申報）
 * 來源：財政部 114.11.27 公告（因 CPI 累計漲幅達標調高）。基本生活費待 2026 年底公告，暫沿用 114 年度。
 */
export const INCOME_TAX_115: IncomeTaxParams = {
  ...INCOME_TAX_114,
  taxYear: 115,
  filingYear: 2027,
  exemption: 101_000,
  exemptionSenior: 151_500,
  standardDeductionSingle: 136_000,
  standardDeductionMarried: 272_000,
  salaryDeduction: 227_000,
  disabilityDeduction: 227_000,
  brackets: [
    { upTo: 610_000, rate: 0.05, quick: 0 },
    { upTo: 1_380_000, rate: 0.12, quick: 42_700 },
    { upTo: 2_770_000, rate: 0.2, quick: 153_100 },
    { upTo: 5_190_000, rate: 0.3, quick: 430_100 },
    { upTo: Infinity, rate: 0.4, quick: 949_100 },
  ],
  note: '115 年度所得（2027 年 5 月申報）。免稅額、扣除額與級距依財政部 114 年 11 月公告；基本生活費尚未公告，暫以 213,000 估算。',
};

/** 目前預設使用的年度（申報季 5 月後可切換成下一年度） */
export const INCOME_TAX = INCOME_TAX_114;
export const INCOME_TAX_YEARS: IncomeTaxParams[] = [INCOME_TAX_114, INCOME_TAX_115];

/** 勞動基準法 加班費倍率  來源：勞基法 §24、§39；勞動部「加班費試算系統」 */
export const OVERTIME = {
  /** 時薪 = 月薪 ÷ 30 ÷ 8 */
  hoursPerMonth: 240,
  /**
   * 倍率採勞動部加班費試算系統慣用之 1.34 / 1.67 / 2.67
   * （法定為「加給三分之一以上」，1.33 會低於下限，實務以 1.34 計）。
   */
  weekday: [
    { hours: 2, multiplier: 1.34 }, // 前 2 小時（加給 1/3 以上）
    { hours: 2, multiplier: 1.67 }, // 第 3–4 小時（加給 2/3 以上）
  ],
  restDay: [
    { hours: 2, multiplier: 1.34 }, // 前 2 小時
    { hours: 6, multiplier: 1.67 }, // 第 3–8 小時
    { hours: 4, multiplier: 2.67 }, // 第 9–12 小時
  ],
  /** 國定假日／特休出勤：8 小時內加發 1 日工資，超過 8 小時依平日延長工時倍率 */
  holidayBeyond8: [
    { hours: 2, multiplier: 1.34 },
    { hours: 2, multiplier: 1.67 },
  ],
  /** 每日工時上限（含加班） */
  dailyCap: 12,
  /** 每月延長工時上限（一般） */
  monthlyCap: 46,
} as const;

/** 勞工保險  來源：勞保局 115/1/1 施行之投保薪資分級表（11 級） */
export const LABOR_INSURANCE = {
  minInsuredSalary: 29_500,
  maxInsuredSalary: 45_800,
  /** 職災保險投保薪資上限 */
  maxOccupationalSalary: 72_800,
} as const;

/** 勞工退休金新制  來源：勞動部勞工保險局 */
export const PENSION = {
  employerRate: 0.06,
  maxVoluntaryRate: 0.06,
  /** 月提繳工資分級表上限（第 62 級） */
  maxInsuredSalary: 150_000,
  /** 自提免稅上限（每年）= 150,000 × 6% × 12 */
  maxVoluntaryTaxFreePerYear: 108_000,
  /** 法定請領年齡 */
  retirementAge: 60,
  /** 勞退基金保證收益（以 2 年期定存利率為準，此為假設值供試算） */
  guaranteedRate: 0.0165,
  /** 月退休金假設的年金平均餘命（年）供估算用 */
  annuityYears: 24,
} as const;

/** 基本工資  來源：勞動部 114.10.21 公告（2026）、115.10.16 公告（2027） */
export const MIN_WAGE = {
  year: 2026,
  monthly: 29_500,
  hourly: 196,
  next: { year: 2027, monthly: 30_900, hourly: 205 },
} as const;

/** 常見利率預設值（僅供表單預設，非即時行情） */
export const RATE_DEFAULTS = {
  /** 一般房貸 %（央行統計 2026/9 五大銀行新承做平均 2.315%） */
  mortgage: 2.3,
  personalLoan: 4.5, // 信貸 %
  carLoan: 5.5, // 車貸 %
  investmentReturn: 7, // 長期股票 ETF 年化 %
  deposit: 1.6, // 定存 %
} as const;

/**
 * 青年安心成家購屋優惠貸款 3.0（2026/8/1–2029/7/31）
 * 一段式機動利率：前 3 年 1.775%，補貼逐年退場，第 7 年起回到 2.275%（以基準利率不變為前提）。
 * 來源：財政部／公股銀行公告（2026/7）
 */
export const YOUTH_MORTGAGE = {
  name: '青安貸款 3.0',
  maxYears: 40,
  maxGraceYears: 5,
  /** 額度：一般 / 新婚 / 育兒 */
  limits: { general: 10_000_000, newlywed: 12_000_000, parenting: 15_000_000 },
  stages: [
    { months: 36, annualRatePct: 1.775 },
    { months: 12, annualRatePct: 1.9 },
    { months: 12, annualRatePct: 2.025 },
    { months: 12, annualRatePct: 2.15 },
    { months: Infinity, annualRatePct: 2.275 },
  ],
} as const;
