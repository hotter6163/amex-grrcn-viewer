import type {
  GrrcnFile,
  GrrcnHeader,
  GrrcnTrailer,
  GrrcnSummary,
  GrrcnSubmission,
  GrrcnTransaction,
  GrrcnTxnPricing,
  GrrcnChargeback,
  GrrcnAdjustment,
  GrrcnFeeRevenue,
} from './grrcn-types.ts';

/**
 * Parse a CSV line respecting double-quoted fields.
 * Fields are enclosed in double quotes and separated by commas.
 */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let i = 0;
  const len = line.length;

  while (i < len) {
    // Skip leading whitespace
    while (i < len && line[i] === ' ') i++;

    if (i >= len) {
      fields.push('');
      break;
    }

    if (line[i] === '"') {
      // Quoted field
      i++; // skip opening quote
      let field = '';
      while (i < len) {
        if (line[i] === '"') {
          if (i + 1 < len && line[i + 1] === '"') {
            // Escaped quote
            field += '"';
            i += 2;
          } else {
            // End of quoted field
            i++; // skip closing quote
            break;
          }
        } else {
          field += line[i];
          i++;
        }
      }
      fields.push(field);
      // Skip comma after field
      if (i < len && line[i] === ',') i++;
    } else {
      // Unquoted field
      let field = '';
      while (i < len && line[i] !== ',') {
        field += line[i];
        i++;
      }
      fields.push(field);
      if (i < len && line[i] === ',') i++;
    }
  }

  return fields;
}

/** Get the number of decimal places for a currency */
function getCurrencyDecimals(currency: string): number {
  const zeroDecimalCurrencies = ['JPY', 'KRW', 'VND', 'CLP', 'ISK'];
  return zeroDecimalCurrencies.includes(currency.toUpperCase()) ? 0 : 2;
}

/**
 * Parse a 16-byte amount string: CNNNNNNNNNNNNNNN
 * C = sign (space = positive, '-' = negative)
 * N = 15 digits
 */
function parseAmount16(raw: string, currency: string): number {
  if (!raw || raw.trim() === '') return 0;
  const sign = raw[0] === '-' ? -1 : 1;
  const digits = raw.substring(1).replace(/\s/g, '0');
  const num = parseInt(digits, 10);
  if (isNaN(num)) return 0;
  const decimals = getCurrencyDecimals(currency);
  return sign * num / Math.pow(10, decimals);
}

/**
 * Parse a 22-byte pricing amount: ANNNNNNNNNNNNNNNNNNNNN
 * A = sign (space = positive, '-' = negative)
 * Positions 2-16 = 15 whole number digits
 * Positions 17-22 = 6 decimal digits
 */
function parseAmount22(raw: string, _currency: string): number {
  if (!raw || raw.trim() === '') return 0;
  const sign = raw[0] === '-' ? -1 : 1;
  const digits = raw.substring(1).replace(/\s/g, '0');
  const num = parseInt(digits, 10);
  if (isNaN(num)) return 0;
  return sign * num / 1_000_000;
}

/**
 * Parse a 7-byte rate: SWDDDDD
 * S = sign, W = 1 whole digit, DDDDD = 5 decimal digits
 * e.g. " 001750" = 0.01750
 */
function parseRate7(raw: string): number {
  if (!raw || raw.trim() === '') return 0;
  const sign = raw[0] === '-' ? -1 : 1;
  const digits = raw.substring(1).replace(/\s/g, '0');
  const num = parseInt(digits, 10);
  if (isNaN(num)) return 0;
  return sign * num / 100_000;
}

/**
 * Parse a 15-char exchange rate: WWWWWWWDDDDDDDD
 * 7 whole + 8 decimal
 */
function parseExchangeRate(raw: string): number {
  if (!raw || raw.trim() === '') return 0;
  const digits = raw.replace(/\s/g, '0');
  const num = parseInt(digits, 10);
  if (isNaN(num)) return 0;
  return num / 100_000_000;
}

function safeGet(fields: string[], idx: number): string {
  return idx < fields.length ? fields[idx] : '';
}

function parseHeader(fields: string[]): GrrcnHeader {
  return {
    recordType: 'HEADER',
    fileCreationDate: safeGet(fields, 1),
    fileCreationTime: safeGet(fields, 2),
    sequentialNumber: safeGet(fields, 3),
    fileId: safeGet(fields, 4),
    fileName: safeGet(fields, 5),
    fileVersionNumber: safeGet(fields, 6),
  };
}

function parseTrailer(fields: string[]): GrrcnTrailer {
  return {
    recordType: 'TRAILER',
    sequentialNumber: safeGet(fields, 1),
    totalRecordCount: safeGet(fields, 2),
  };
}

function parseSummary(fields: string[]): GrrcnSummary {
  const currency = safeGet(fields, 5);
  return {
    recordType: 'SUMMARY',
    payeeMerchantId: safeGet(fields, 1),
    settlementAccountTypeCode: safeGet(fields, 2),
    americanExpressPaymentNumber: safeGet(fields, 3),
    paymentDate: safeGet(fields, 4),
    paymentCurrency: currency,
    uniquePaymentReferenceNumber: safeGet(fields, 6),
    paymentNetAmount: safeGet(fields, 7),
    paymentGrossAmount: safeGet(fields, 8),
    paymentDiscountAmount: safeGet(fields, 9),
    paymentServiceFeeAmount: safeGet(fields, 10),
    paymentAdjustmentAmount: safeGet(fields, 11),
    paymentTaxAmount: safeGet(fields, 12),
    openingDebitBalanceAmount: safeGet(fields, 13),
    payeeDirectDepositNumber: safeGet(fields, 14),
    bankAccountNumber: safeGet(fields, 15),
    internationalBankAccountNumber: safeGet(fields, 16),
    bankIdentifierCode: safeGet(fields, 17),
    paymentStatus: safeGet(fields, 18),
    _paymentNetAmount: parseAmount16(safeGet(fields, 7), currency),
    _paymentGrossAmount: parseAmount16(safeGet(fields, 8), currency),
    _paymentDiscountAmount: parseAmount16(safeGet(fields, 9), currency),
    _paymentServiceFeeAmount: parseAmount16(safeGet(fields, 10), currency),
    _paymentAdjustmentAmount: parseAmount16(safeGet(fields, 11), currency),
    _paymentTaxAmount: parseAmount16(safeGet(fields, 12), currency),
    _openingDebitBalanceAmount: parseAmount16(safeGet(fields, 13), currency),
    submissions: [],
    chargebacks: [],
    adjustments: [],
    feeRevenues: [],
  };
}

function parseSubmission(fields: string[]): GrrcnSubmission {
  const paymentCurrency = safeGet(fields, 5);
  const submissionCurrency = safeGet(fields, 10);
  return {
    recordType: 'SUBMISSION',
    payeeMerchantId: safeGet(fields, 1),
    settlementAccountTypeCode: safeGet(fields, 2),
    americanExpressPaymentNumber: safeGet(fields, 3),
    paymentDate: safeGet(fields, 4),
    paymentCurrency: paymentCurrency,
    submissionMerchantId: safeGet(fields, 6),
    businessSubmissionDate: safeGet(fields, 7),
    americanExpressProcessingDate: safeGet(fields, 8),
    submissionInvoiceNumber: safeGet(fields, 9),
    submissionCurrency: submissionCurrency,
    submissionBranchId: safeGet(fields, 11),
    submissionExchangeRate: safeGet(fields, 12),
    submissionGrossAmountInSubmissionCurrency: safeGet(fields, 13),
    submissionGrossAmountInPaymentCurrency: safeGet(fields, 14),
    submissionDiscountAmount: safeGet(fields, 15),
    submissionServiceFeeAmount: safeGet(fields, 16),
    submissionTaxAmount: safeGet(fields, 17),
    submissionNetAmount: safeGet(fields, 18),
    submissionDiscountRate: safeGet(fields, 19),
    submissionTaxRate: safeGet(fields, 20),
    transactionCount: safeGet(fields, 21),
    trackingId: safeGet(fields, 22),
    submissionDebitGrossAmount: safeGet(fields, 30),
    submissionCreditGrossAmount: safeGet(fields, 31),
    submitterId: safeGet(fields, 32),
    paymentStatus: safeGet(fields, 33),
    _submissionExchangeRate: parseExchangeRate(safeGet(fields, 12)),
    _submissionGrossAmountInSubmissionCurrency: parseAmount16(safeGet(fields, 13), submissionCurrency),
    _submissionGrossAmountInPaymentCurrency: parseAmount16(safeGet(fields, 14), paymentCurrency),
    _submissionDiscountAmount: parseAmount16(safeGet(fields, 15), paymentCurrency),
    _submissionServiceFeeAmount: parseAmount16(safeGet(fields, 16), paymentCurrency),
    _submissionTaxAmount: parseAmount16(safeGet(fields, 17), paymentCurrency),
    _submissionNetAmount: parseAmount16(safeGet(fields, 18), paymentCurrency),
    _submissionDiscountRate: parseRate7(safeGet(fields, 19)),
    _submissionDebitGrossAmount: parseAmount16(safeGet(fields, 30), paymentCurrency),
    _submissionCreditGrossAmount: parseAmount16(safeGet(fields, 31), paymentCurrency),
    transactions: [],
  };
}

function parseTransaction(fields: string[]): GrrcnTransaction {
  const paymentCurrency = safeGet(fields, 5);
  return {
    recordType: 'TRANSACTN',
    payeeMerchantId: safeGet(fields, 1),
    settlementAccountTypeCode: safeGet(fields, 2),
    americanExpressPaymentNumber: safeGet(fields, 3),
    paymentDate: safeGet(fields, 4),
    paymentCurrency: paymentCurrency,
    submissionMerchantId: safeGet(fields, 6),
    businessSubmissionDate: safeGet(fields, 7),
    americanExpressProcessingDate: safeGet(fields, 8),
    submissionInvoiceNumber: safeGet(fields, 9),
    submissionCurrency: safeGet(fields, 10),
    merchantLocationId: safeGet(fields, 11),
    invoiceReferenceNumber: safeGet(fields, 12),
    sellerId: safeGet(fields, 13),
    cardmemberAccountNumber: safeGet(fields, 14),
    industrySpecificReferenceNumber: safeGet(fields, 15),
    submissionGrossAmountInPaymentCurrency: safeGet(fields, 16),
    transactionAmount: safeGet(fields, 17),
    transactionDate: safeGet(fields, 18),
    transactionTime: safeGet(fields, 19),
    transactionId: safeGet(fields, 20),
    approvalCode: safeGet(fields, 21),
    terminalId: safeGet(fields, 22),
    merchantCategoryCode: safeGet(fields, 23),
    cardmemberReferenceNumber: safeGet(fields, 24),
    acquirerReferenceNumber: safeGet(fields, 25),
    dataQualityNonCompliantIndicator: safeGet(fields, 26),
    dataQualityErrorCode1: safeGet(fields, 27),
    dataQualityErrorCode2: safeGet(fields, 28),
    dataQualityErrorCode3: safeGet(fields, 29),
    dataQualityErrorCode4: safeGet(fields, 30),
    nonSwipedIndicator: safeGet(fields, 31),
    transactionRejectedIndicator: safeGet(fields, 32),
    installmentPaymentCount: safeGet(fields, 33),
    installmentPaymentIndicator: safeGet(fields, 34),
    installmentPlanNumber: safeGet(fields, 35),
    installmentPaymentGrossAmount: safeGet(fields, 36),
    vatInvoiceSequenceNumber: safeGet(fields, 37),
    serviceFeeAmount: safeGet(fields, 38),
    accelerationAmount: safeGet(fields, 39),
    marketSpecificRef1: safeGet(fields, 40),
    marketSpecificRef2: safeGet(fields, 41),
    submissionBranchId: safeGet(fields, 42),
    paymentStatus: safeGet(fields, 43),
    filler1: safeGet(fields, 44),
    paymentAccountReference: safeGet(fields, 45),
    _submissionGrossAmountInPaymentCurrency: parseAmount16(safeGet(fields, 16), paymentCurrency),
    _transactionAmount: parseAmount16(safeGet(fields, 17), paymentCurrency),
    _serviceFeeAmount: parseAmount16(safeGet(fields, 38), paymentCurrency),
    _accelerationAmount: parseAmount16(safeGet(fields, 39), paymentCurrency),
    txnPricings: [],
  };
}

function parseTxnPricing(fields: string[]): GrrcnTxnPricing {
  const paymentCurrency = safeGet(fields, 5);
  return {
    recordType: 'TXNPRICING',
    payeeMerchantId: safeGet(fields, 1),
    settlementAccountTypeCode: safeGet(fields, 2),
    americanExpressPaymentNumber: safeGet(fields, 3),
    paymentDate: safeGet(fields, 4),
    paymentCurrency: paymentCurrency,
    submissionMerchantId: safeGet(fields, 6),
    merchantLocationId: safeGet(fields, 7),
    filler1: safeGet(fields, 8),
    invoiceReferenceNumber: safeGet(fields, 9),
    sellerId: safeGet(fields, 10),
    cardmemberAccountNumber: safeGet(fields, 11),
    transactionAmount: safeGet(fields, 12),
    transactionDate: safeGet(fields, 13),
    feeCode: safeGet(fields, 14),
    filler2: safeGet(fields, 15),
    feeAmount: safeGet(fields, 16),
    discountRate: safeGet(fields, 17),
    discountAmount: safeGet(fields, 18),
    roundedFeeAmountSettlementCurrency: safeGet(fields, 19),
    roundedDiscountAmountSettlementCurrency: safeGet(fields, 20),
    feeAmountSettlementCurrency: safeGet(fields, 21),
    discountAmountSettlementCurrency: safeGet(fields, 22),
    transactionAmountSettlementCurrency: safeGet(fields, 23),
    marketSpecificRef1: safeGet(fields, 24),
    marketSpecificRef2: safeGet(fields, 25),
    paymentStatus: safeGet(fields, 26),
    _transactionAmount: parseAmount16(safeGet(fields, 12), paymentCurrency),
    _feeAmount: parseAmount22(safeGet(fields, 16), paymentCurrency),
    _discountRate: parseRate7(safeGet(fields, 17)),
    _discountAmount: parseAmount22(safeGet(fields, 18), paymentCurrency),
    _roundedFeeAmountSettlementCurrency: parseAmount16(safeGet(fields, 19), paymentCurrency),
    _roundedDiscountAmountSettlementCurrency: parseAmount16(safeGet(fields, 20), paymentCurrency),
    _feeAmountSettlementCurrency: parseAmount22(safeGet(fields, 21), paymentCurrency),
    _discountAmountSettlementCurrency: parseAmount22(safeGet(fields, 22), paymentCurrency),
    _transactionAmountSettlementCurrency: parseAmount16(safeGet(fields, 23), paymentCurrency),
  };
}

function parseChargeback(fields: string[]): GrrcnChargeback {
  const paymentCurrency = safeGet(fields, 5);
  return {
    recordType: 'CHARGEBACK',
    payeeMerchantId: safeGet(fields, 1),
    settlementAccountTypeCode: safeGet(fields, 2),
    americanExpressPaymentNumber: safeGet(fields, 3),
    paymentDate: safeGet(fields, 4),
    paymentCurrency: paymentCurrency,
    submissionMerchantId: safeGet(fields, 6),
    businessSubmissionDate: safeGet(fields, 7),
    merchantLocationId: safeGet(fields, 8),
    invoiceReferenceNumber: safeGet(fields, 9),
    sellerId: safeGet(fields, 10),
    cardmemberAccountNumber: safeGet(fields, 11),
    industrySpecificReferenceNumber: safeGet(fields, 12),
    americanExpressProcessingDate: safeGet(fields, 13),
    submissionInvoiceNumber: safeGet(fields, 14),
    submissionCurrency: safeGet(fields, 15),
    chargebackNumber: safeGet(fields, 16),
    chargebackReasonCode: safeGet(fields, 17),
    chargebackReasonDescription: safeGet(fields, 18),
    grossAmount: safeGet(fields, 19),
    discountAmount: safeGet(fields, 20),
    serviceFeeAmount: safeGet(fields, 21),
    taxAmount: safeGet(fields, 22),
    netAmount: safeGet(fields, 23),
    discountRate: safeGet(fields, 24),
    serviceFeeRate: safeGet(fields, 25),
    batchCode: safeGet(fields, 26),
    billCode: safeGet(fields, 27),
    transactionId: safeGet(fields, 28),
    marketSpecificRef1: safeGet(fields, 29),
    marketSpecificRef2: safeGet(fields, 30),
    acquirerReferenceNumber: safeGet(fields, 31),
    originalTransactionAmountSubmissionCurrency: safeGet(fields, 32),
    originalTransactionAmountSettlementCurrency: safeGet(fields, 33),
    originalTransactionDate: safeGet(fields, 34),
    submissionInvoiceNumberOriginal: safeGet(fields, 35),
    grossAmountInSubmissionCurrency: safeGet(fields, 36),
    netAmountInSubmissionCurrency: safeGet(fields, 37),
    amexDisputeCaseReference: safeGet(fields, 38),
    chargebackReasonCodeIso: safeGet(fields, 39),
    paymentStatus: safeGet(fields, 40),
    _grossAmount: parseAmount16(safeGet(fields, 19), paymentCurrency),
    _discountAmount: parseAmount16(safeGet(fields, 20), paymentCurrency),
    _serviceFeeAmount: parseAmount16(safeGet(fields, 21), paymentCurrency),
    _taxAmount: parseAmount16(safeGet(fields, 22), paymentCurrency),
    _netAmount: parseAmount16(safeGet(fields, 23), paymentCurrency),
    _discountRate: parseRate7(safeGet(fields, 24)),
    _serviceFeeRate: parseRate7(safeGet(fields, 25)),
  };
}

function parseAdjustment(fields: string[]): GrrcnAdjustment {
  const paymentCurrency = safeGet(fields, 5);
  return {
    recordType: 'ADJUSTMENT',
    payeeMerchantId: safeGet(fields, 1),
    settlementAccountTypeCode: safeGet(fields, 2),
    americanExpressPaymentNumber: safeGet(fields, 3),
    paymentDate: safeGet(fields, 4),
    paymentCurrency: paymentCurrency,
    submissionMerchantId: safeGet(fields, 6),
    businessSubmissionDate: safeGet(fields, 7),
    merchantLocationId: safeGet(fields, 8),
    invoiceReferenceNumber: safeGet(fields, 9),
    sellerId: safeGet(fields, 10),
    cardmemberAccountNumber: safeGet(fields, 11),
    industrySpecificReferenceNumber: safeGet(fields, 12),
    americanExpressProcessingDate: safeGet(fields, 13),
    submissionInvoiceNumber: safeGet(fields, 14),
    submissionCurrency: safeGet(fields, 15),
    adjustmentNumber: safeGet(fields, 16),
    adjustmentReasonCode: safeGet(fields, 17),
    adjustmentReasonDescription: safeGet(fields, 18),
    grossAmount: safeGet(fields, 19),
    discountAmount: safeGet(fields, 20),
    serviceFeeAmount: safeGet(fields, 21),
    taxAmount: safeGet(fields, 22),
    netAmount: safeGet(fields, 23),
    discountRate: safeGet(fields, 24),
    serviceFeeRate: safeGet(fields, 25),
    batchCode: safeGet(fields, 26),
    billCode: safeGet(fields, 27),
    paymentStatus: safeGet(fields, 28),
    _grossAmount: parseAmount16(safeGet(fields, 19), paymentCurrency),
    _discountAmount: parseAmount16(safeGet(fields, 20), paymentCurrency),
    _serviceFeeAmount: parseAmount16(safeGet(fields, 21), paymentCurrency),
    _taxAmount: parseAmount16(safeGet(fields, 22), paymentCurrency),
    _netAmount: parseAmount16(safeGet(fields, 23), paymentCurrency),
    _discountRate: parseRate7(safeGet(fields, 24)),
    _serviceFeeRate: parseRate7(safeGet(fields, 25)),
  };
}

function parseFeeRevenue(fields: string[]): GrrcnFeeRevenue {
  const paymentCurrency = safeGet(fields, 4);
  return {
    recordType: 'FEEREVENUE',
    payeeMerchantId: safeGet(fields, 1),
    americanExpressPaymentNumber: safeGet(fields, 2),
    paymentDate: safeGet(fields, 3),
    paymentCurrency: paymentCurrency,
    submissionMerchantId: safeGet(fields, 5),
    merchantLocationId: safeGet(fields, 6),
    feeOrRevenueAmount: safeGet(fields, 7),
    feeOrRevenueDescription: safeGet(fields, 8),
    assetBillingAmount: safeGet(fields, 9),
    assetBillingDescription: safeGet(fields, 10),
    assetBillingTax: safeGet(fields, 11),
    payInGrossIndicator: safeGet(fields, 12),
    batchCode: safeGet(fields, 13),
    billCode: safeGet(fields, 14),
    sellerId: safeGet(fields, 15),
    _feeOrRevenueAmount: parseAmount16(safeGet(fields, 7), paymentCurrency),
    _assetBillingAmount: parseAmount16(safeGet(fields, 9), paymentCurrency),
    _assetBillingTax: parseAmount16(safeGet(fields, 11), paymentCurrency),
  };
}

/**
 * Main parser: takes file content string, returns structured GrrcnFile
 */
export function parseGrrcnFile(content: string): GrrcnFile {
  const rawLines = content.split(/\r?\n/).filter(line => line.trim() !== '');

  let header: GrrcnHeader | null = null;
  let trailer: GrrcnTrailer | null = null;
  const summaries: GrrcnSummary[] = [];
  let currentSummary: GrrcnSummary | null = null;
  let currentSubmission: GrrcnSubmission | null = null;
  let currentTransaction: GrrcnTransaction | null = null;

  const counts = {
    header: 0,
    summary: 0,
    submission: 0,
    transaction: 0,
    txnPricing: 0,
    chargeback: 0,
    adjustment: 0,
    feeRevenue: 0,
    trailer: 0,
    total: rawLines.length,
  };

  for (const line of rawLines) {
    const fields = parseCsvLine(line);
    const recordType = fields[0];

    switch (recordType) {
      case 'HEADER':
        header = parseHeader(fields);
        counts.header++;
        break;

      case 'TRAILER':
        trailer = parseTrailer(fields);
        counts.trailer++;
        break;

      case 'SUMMARY':
        currentSummary = parseSummary(fields);
        currentSubmission = null;
        currentTransaction = null;
        summaries.push(currentSummary);
        counts.summary++;
        break;

      case 'SUBMISSION':
        currentSubmission = parseSubmission(fields);
        currentTransaction = null;
        if (currentSummary) {
          currentSummary.submissions.push(currentSubmission);
        }
        counts.submission++;
        break;

      case 'TRANSACTN':
        currentTransaction = parseTransaction(fields);
        if (currentSubmission) {
          currentSubmission.transactions.push(currentTransaction);
        }
        counts.transaction++;
        break;

      case 'TXNPRICING':
        if (currentTransaction) {
          currentTransaction.txnPricings.push(parseTxnPricing(fields));
        }
        counts.txnPricing++;
        break;

      case 'CHARGEBACK':
        if (currentSummary) {
          currentSummary.chargebacks.push(parseChargeback(fields));
        }
        counts.chargeback++;
        break;

      case 'ADJUSTMENT':
        if (currentSummary) {
          currentSummary.adjustments.push(parseAdjustment(fields));
        }
        counts.adjustment++;
        break;

      case 'FEEREVENUE':
        if (currentSummary) {
          currentSummary.feeRevenues.push(parseFeeRevenue(fields));
        }
        counts.feeRevenue++;
        break;
    }
  }

  if (!header) {
    throw new Error('No HEADER record found in file');
  }
  if (!trailer) {
    throw new Error('No TRAILER record found in file');
  }

  return {
    header,
    summaries,
    trailer,
    rawLines,
    recordCounts: counts,
  };
}

/** Format a date string YYYYMMDD to YYYY-MM-DD */
export function formatDate(raw: string): string {
  if (!raw || raw.length !== 8) return raw || '';
  return `${raw.substring(0, 4)}-${raw.substring(4, 6)}-${raw.substring(6, 8)}`;
}

/** Format a time string HHMMSS to HH:MM:SS */
export function formatTime(raw: string): string {
  if (!raw || raw.length !== 6) return raw || '';
  return `${raw.substring(0, 2)}:${raw.substring(2, 4)}:${raw.substring(4, 6)}`;
}

/** Format a number as currency */
export function formatCurrency(amount: number, currency: string): string {
  const decimals = getCurrencyDecimals(currency);
  const formatted = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const sign = amount < 0 ? '-' : '';
  return `${sign}${formatted} ${currency}`;
}

/** Get settlement account type description */
export function getSettlementAccountType(code: string): string {
  switch (code) {
    case '001': return 'Discount';
    case '002': return 'Primary';
    case '004': return 'Chargeback';
    default: return code;
  }
}

/** Get payment status description */
export function getPaymentStatus(code: string): string {
  switch (code) {
    case 'P': return 'Paid';
    case 'R': return 'Reissued';
    case 'F': return 'Future';
    default: return code;
  }
}

/** Get fee code description */
export function getFeeCodeDescription(code: string): string {
  switch (code) {
    case '1A': return 'Discount';
    case 'CR': return 'Commission Revenue';
    case 'MA': return 'Marketing Assessment';
    case 'NS': return 'Network Surcharge';
    default: return code;
  }
}
