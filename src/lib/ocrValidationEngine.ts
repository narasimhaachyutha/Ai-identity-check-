import {
  FieldEvidenceItem,
  StructuredFieldEvidenceMap,
  ExtractedOCRData,
  FieldConsistencyCheck,
} from '../types';

export interface ImageQualityCheckResult {
  isValid: boolean;
  reason?: string;
  metrics: {
    width?: number;
    height?: number;
    estimatedDpi: number;
    isTooSmall: boolean;
    isTooDark: boolean;
    isTooBright: boolean;
  };
}

/**
 * Known administrative document header strings that must never be mistaken for a person's legal name.
 */
const BANNED_NAME_SUBSTRINGS = [
  'REPUBLIC',
  'KINGDOM',
  'UNITED STATES',
  'DRIVING LICENCE',
  'DRIVER LICENSE',
  'PASSPORT',
  'NATIONAL IDENTITY',
  'IDENTITY CARD',
  'PERMIT',
  'MINISTRY',
  'DEPARTMENT',
  'GOVERNMENT',
  'FEDERATION',
  'CONFEDERATION',
  'SPECIMEN',
  'SAMPLE',
  'OFFICIAL USE',
  'AUTHORITY',
  'STATE OF',
  'COMMONWEALTH',
];

/**
 * Validates image quality prior to OCR execution.
 */
export function validateDocumentImageQuality(
  fileBase64?: string,
  fileType?: string
): ImageQualityCheckResult {
  if (!fileBase64 || fileBase64.trim().length === 0) {
    return {
      isValid: false,
      reason: 'No document image data provided.',
      metrics: { estimatedDpi: 0, isTooSmall: true, isTooDark: false, isTooBright: false },
    };
  }

  // Base64 payload size check (minimum ~2KB for an actual image scan)
  const cleanBase64 = fileBase64.replace(/^data:[^;]+;base64,/, '');
  const byteSize = (cleanBase64.length * 3) / 4;

  if (byteSize < 1500) {
    return {
      isValid: false,
      reason: 'Document image quality is insufficient. The uploaded file is too small or truncated.',
      metrics: { estimatedDpi: 72, isTooSmall: true, isTooDark: false, isTooBright: false },
    };
  }

  return {
    isValid: true,
    metrics: { estimatedDpi: 300, isTooSmall: false, isTooDark: false, isTooBright: false },
  };
}

/**
 * Parses diverse international date formats into ISO standard YYYY-MM-DD.
 * Preserves original source text separately.
 */
export function parseAndNormalizeDate(rawDateStr?: string | null): {
  normalized: string | null;
  normalizedDate: string | null;
  isValidDate: boolean;
  validationReason?: string;
} {
  if (!rawDateStr || typeof rawDateStr !== 'string') {
    return { normalized: null, normalizedDate: null, isValidDate: false, validationReason: 'Date string is empty' };
  }

  const cleaned = rawDateStr.trim().toUpperCase();

  // 1. Already ISO YYYY-MM-DD
  const isoMatch = cleaned.match(/^(\d{4})[-\/\.](\d{1,2})[-\/\.](\d{1,2})$/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10);
    const day = parseInt(isoMatch[3], 10);
    return checkDateValidity(year, month, day);
  }

  // 2. DD/MM/YYYY or DD-MM-YYYY (European / Asian / Latin standard)
  const dmyMatch = cleaned.match(/^(\d{1,2})[-\/\.](\d{1,2})[-\/\.](\d{4})$/);
  if (dmyMatch) {
    let day = parseInt(dmyMatch[1], 10);
    let month = parseInt(dmyMatch[2], 10);
    const year = parseInt(dmyMatch[3], 10);

    // If month > 12 and day <= 12, user might have uploaded MM/DD/YYYY
    if (month > 12 && day <= 12) {
      const temp = day;
      day = month;
      month = temp;
    }

    return checkDateValidity(year, month, day);
  }

  // 3. DD MMM YYYY (e.g., "14 MAY 1991" or "28 NOV 2030")
  const textMonthMatch = cleaned.match(/^(\d{1,2})[\s\-\/\.]([A-Z]{3,9})[\s\-\/\.](\d{4})$/);
  if (textMonthMatch) {
    const day = parseInt(textMonthMatch[1], 10);
    const monthStr = textMonthMatch[2];
    const year = parseInt(textMonthMatch[3], 10);

    const monthMap: Record<string, number> = {
      JAN: 1, JANU: 1, JANUARY: 1,
      FEB: 2, FEBR: 2, FEBRUARY: 2,
      MAR: 3, MARC: 3, MARCH: 3,
      APR: 4, APRI: 4, APRIL: 4,
      MAY: 5,
      JUN: 6, JUNE: 6,
      JUL: 7, JULY: 7,
      AUG: 8, AUGU: 8, AUGUST: 8,
      SEP: 9, SEPT: 9, SEPTEMBER: 9,
      OCT: 10, OCTO: 10, OCTOBER: 10,
      NOV: 11, NOVE: 11, NOVEMBER: 11,
      DEC: 12, DECE: 12, DECEMBER: 12,
    };

    const monthPrefix = monthStr.slice(0, 3);
    const month = monthMap[monthPrefix] || monthMap[monthStr];

    if (month) {
      return checkDateValidity(year, month, day);
    }
  }

  // 4. MRZ compact YYMMDD format
  const mrzDateMatch = cleaned.match(/^(\d{2})(\d{2})(\d{2})$/);
  if (mrzDateMatch) {
    const yy = parseInt(mrzDateMatch[1], 10);
    const month = parseInt(mrzDateMatch[2], 10);
    const day = parseInt(mrzDateMatch[3], 10);
    // Threshold: 00-40 -> 2000-2040, 41-99 -> 1941-1999
    const year = yy <= 40 ? 2000 + yy : 1900 + yy;
    return checkDateValidity(year, month, day);
  }

  return {
    normalized: null,
    normalizedDate: null,
    isValidDate: false,
    validationReason: `Unrecognized date format "${rawDateStr}"`,
  };
}

function checkDateValidity(year: number, month: number, day: number): {
  normalized: string | null;
  normalizedDate: string | null;
  isValidDate: boolean;
  validationReason?: string;
} {
  if (year < 1900 || year > 2100) {
    return {
      normalized: null,
      normalizedDate: null,
      isValidDate: false,
      validationReason: `Year out of realistic bounds (${year})`,
    };
  }
  if (month < 1 || month > 12) {
    return {
      normalized: null,
      normalizedDate: null,
      isValidDate: false,
      validationReason: `Invalid month number (${month})`,
    };
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) {
    return {
      normalized: null,
      normalizedDate: null,
      isValidDate: false,
      validationReason: `Day ${day} exceeds maximum days in month (${daysInMonth})`,
    };
  }

  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  const formatted = `${year}-${mm}-${dd}`;
  return { normalized: formatted, normalizedDate: formatted, isValidDate: true };
}

/**
 * Validates a Person's Legal Full Name.
 * Prevents picking up document titles, blank labels, or purely numerical strings.
 */
export function validatePersonName(name?: string | null): {
  isValid: boolean;
  cleanedValue: string | null;
  flags: string[];
} {
  if (!name || typeof name !== 'string') {
    return { isValid: false, cleanedValue: null, flags: ['MISSING_NAME'] };
  }

  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return { isValid: false, cleanedValue: null, flags: ['NAME_TOO_SHORT'] };
  }

  const uppercase = trimmed.toUpperCase();

  // Check if name is purely numeric or punctuation
  if (/^[\d\W_]+$/.test(trimmed)) {
    return { isValid: false, cleanedValue: null, flags: ['NUMERIC_NAME_REJECTED'] };
  }

  // Check for banned administrative headers
  for (const banned of BANNED_NAME_SUBSTRINGS) {
    if (uppercase === banned || uppercase.startsWith(banned + ' ') || uppercase.endsWith(' ' + banned)) {
      return {
        isValid: false,
        cleanedValue: null,
        flags: [`DOCUMENT_HEADER_MISIDENTIFIED: "${banned}"`],
      };
    }
  }

  // Clean trailing commas, arrows, or MRZ filler '<'
  const cleaned = trimmed
    .replace(/[<]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return { isValid: true, cleanedValue: cleaned, flags: [] };
}

/**
 * Validates Document Serial Number format.
 */
export function validateDocumentNumber(
  docNumber?: string | null,
  docType?: string
): {
  isValid: boolean;
  cleanedValue: string | null;
  flags: string[];
} {
  if (!docNumber || typeof docNumber !== 'string') {
    return { isValid: false, cleanedValue: null, flags: ['MISSING_DOC_NUMBER'] };
  }

  const trimmed = docNumber.trim().replace(/\s+/g, '');
  if (trimmed.length < 4 || trimmed.length > 30) {
    return { isValid: false, cleanedValue: trimmed, flags: ['DOC_NUMBER_UNUSUAL_LENGTH'] };
  }

  // Must contain at least some digits or valid alphanumeric identifier
  if (!/[0-9A-Za-z]/.test(trimmed)) {
    return { isValid: false, cleanedValue: null, flags: ['INVALID_CHARACTERS'] };
  }

  return { isValid: true, cleanedValue: trimmed, flags: [] };
}

/**
 * Validates Date of Birth logic (in past, realistic age between 0 and 120).
 */
export function validateDateOfBirth(dobStr?: string | null): {
  isValid: boolean;
  normalizedDate: string | null;
  ageYears: number | null;
  flags: string[];
} {
  const parseResult = parseAndNormalizeDate(dobStr);
  if (!parseResult.isValidDate || !parseResult.normalizedDate) {
    return {
      isValid: false,
      normalizedDate: null,
      ageYears: null,
      flags: [parseResult.validationReason || 'INVALID_DOB_FORMAT'],
    };
  }

  const dob = new Date(parseResult.normalizedDate);
  const now = new Date();
  const diffTime = now.getTime() - dob.getTime();
  const ageYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365.25));

  if (ageYears < 0) {
    return {
      isValid: false,
      normalizedDate: parseResult.normalizedDate,
      ageYears,
      flags: ['FUTURE_DOB_REJECTED'],
    };
  }

  if (ageYears > 120) {
    return {
      isValid: false,
      normalizedDate: parseResult.normalizedDate,
      ageYears,
      flags: ['AGE_EXCEEDS_120_YEARS'],
    };
  }

  return {
    isValid: true,
    normalizedDate: parseResult.normalizedDate,
    ageYears,
    flags: [],
  };
}

/**
 * Validates Expiry Date vs Issue Date logic.
 */
export function validateDatesChronology(
  issueDateStr?: string | null,
  expiryDateStr?: string | null
): {
  isValid: boolean;
  normalizedIssueDate: string | null;
  normalizedExpiryDate: string | null;
  flags: string[];
  consistencyCheck: FieldConsistencyCheck;
} {
  const issueParsed = parseAndNormalizeDate(issueDateStr);
  const expiryParsed = parseAndNormalizeDate(expiryDateStr);

  const flags: string[] = [];

  if (issueDateStr && !issueParsed.isValidDate) {
    flags.push(`ISSUE_DATE_FORMAT_INVALID: ${issueParsed.validationReason}`);
  }

  if (expiryDateStr && !expiryParsed.isValidDate) {
    flags.push(`EXPIRY_DATE_FORMAT_INVALID: ${expiryParsed.validationReason}`);
  }

  if (issueParsed.isValidDate && expiryParsed.isValidDate && issueParsed.normalizedDate && expiryParsed.normalizedDate) {
    const issueTime = new Date(issueParsed.normalizedDate).getTime();
    const expiryTime = new Date(expiryParsed.normalizedDate).getTime();

    if (expiryTime <= issueTime) {
      flags.push('EXPIRY_PRECEDES_ISSUE_DATE');
      return {
        isValid: false,
        normalizedIssueDate: issueParsed.normalizedDate,
        normalizedExpiryDate: expiryParsed.normalizedDate,
        flags,
        consistencyCheck: {
          fieldName: 'Date Chronology Order',
          status: 'failed',
          ruleDescription: 'Expiration date must succeed Issue date.',
          details: `Issue date (${issueParsed.normalizedDate}) is after or equal to Expiry date (${expiryParsed.normalizedDate}).`,
        },
      };
    }
  }

  return {
    isValid: flags.length === 0,
    normalizedIssueDate: issueParsed.normalizedDate,
    normalizedExpiryDate: expiryParsed.normalizedDate,
    flags,
    consistencyCheck: {
      fieldName: 'Date Chronology Order',
      status: flags.length === 0 ? 'passed' : 'warning',
      ruleDescription: 'Expiration date must succeed Issue date and follow ISO calendar rules.',
      details: flags.length === 0 ? 'Valid chronological timeline.' : flags.join('; '),
    },
  };
}

/**
 * Cross-Field Consistency Check between MRZ (if present) and Visual Inspection Zone.
 */
export function checkMrzVisualConsistency(
  visualDocNum?: string | null,
  visualDob?: string | null,
  mrzLine2?: string | null
): FieldConsistencyCheck[] {
  const checks: FieldConsistencyCheck[] = [];

  if (!mrzLine2 || mrzLine2.trim().length < 20) {
    return checks;
  }

  const cleanMrz2 = mrzLine2.replace(/\s+/g, '').toUpperCase();

  // Check 1: Document Number in MRZ
  if (visualDocNum) {
    const cleanDoc = visualDocNum.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    const mrzDocPortion = cleanMrz2.slice(0, 9).replace(/<+/g, '');
    
    if (mrzDocPortion && cleanDoc) {
      const match = cleanDoc.includes(mrzDocPortion) || mrzDocPortion.includes(cleanDoc);
      checks.push({
        fieldName: 'MRZ Document Number Congruence',
        status: match ? 'passed' : 'failed',
        ruleDescription: 'Document serial in visual zone must match MRZ optical line 2.',
        details: match
          ? `Visual serial (${cleanDoc}) matches MRZ serial (${mrzDocPortion}).`
          : `CONFLICT: Visual serial (${cleanDoc}) does NOT match MRZ serial (${mrzDocPortion}).`,
      });
    }
  }

  // Check 2: Date of Birth in MRZ
  if (visualDob) {
    const parsedDob = parseAndNormalizeDate(visualDob);
    if (parsedDob.isValidDate && parsedDob.normalizedDate) {
      const [year, month, day] = parsedDob.normalizedDate.split('-');
      const expectedYYMMDD = `${year.slice(2)}${month}${day}`;
      const mrzDobPortion = cleanMrz2.slice(13, 19);

      if (mrzDobPortion && /^\d{6}$/.test(mrzDobPortion)) {
        const match = expectedYYMMDD === mrzDobPortion;
        checks.push({
          fieldName: 'MRZ Date of Birth Congruence',
          status: match ? 'passed' : 'failed',
          ruleDescription: 'Date of birth in visual zone must match YYMMDD checksum in MRZ.',
          details: match
            ? `Visual DOB (${parsedDob.normalizedDate}) aligns with MRZ date (${mrzDobPortion}).`
            : `CONFLICT: Visual DOB (${parsedDob.normalizedDate}) disagrees with MRZ date (${mrzDobPortion}).`,
        });
      }
    }
  }

  return checks;
}

/**
 * Post-processes, validates, and builds field-level evidence map for the entire extraction.
 */
export function buildVerifiedExtraction(
  rawExtraction: {
    documentType?: string | null;
    fullName?: string | null;
    documentNumber?: string | null;
    dateOfBirth?: string | null;
    expirationDate?: string | null;
    issueDate?: string | null;
    nationality?: string | null;
    issuingAuthority?: string | null;
    gender?: string | null;
    address?: string | null;
    mrzLine1?: string | null;
    mrzLine2?: string | null;
    fields?: Record<string, Partial<FieldEvidenceItem>>;
  },
  modelConfidence: number = 85
): {
  verifiedOCR: ExtractedOCRData;
  fieldEvidence: StructuredFieldEvidenceMap;
  missingFields: string[];
  crossFieldChecks: FieldConsistencyCheck[];
  overallValidationPassed: boolean;
} {
  const fieldsMap: StructuredFieldEvidenceMap = {};
  const missingFields: string[] = [];
  const crossFieldChecks: FieldConsistencyCheck[] = [];

  const rawFields = rawExtraction.fields || {};

  // Helper to extract raw text & model evidence
  const getRawField = (key: string, fallbackVal?: string | null) => {
    const item = rawFields[key];
    const val = item?.value !== undefined ? item.value : fallbackVal || null;
    const src = item?.sourceText !== undefined ? item.sourceText : (val ? String(val) : null);
    const conf = item?.confidence || (val ? (modelConfidence >= 80 ? 'HIGH' : 'MEDIUM') : 'LOW');
    const stat = item?.status || (val ? 'EXTRACTED' : 'NOT_DETECTED');
    return { value: val, sourceText: src, confidence: conf, status: stat };
  };

  // 1. Validate Full Name
  const rawName = getRawField('fullName', rawExtraction.fullName);
  const nameValidation = validatePersonName(rawName.value);

  if (nameValidation.isValid && nameValidation.cleanedValue) {
    fieldsMap.fullName = {
      value: nameValidation.cleanedValue,
      sourceText: rawName.sourceText,
      confidence: rawName.confidence,
      status: 'EXTRACTED',
      validationFlags: nameValidation.flags,
      validationMessage: 'Valid alphabetic name without administrative header contamination.',
    };
  } else if (rawName.value) {
    fieldsMap.fullName = {
      value: null,
      sourceText: rawName.sourceText,
      confidence: 'LOW',
      status: 'NEEDS_REVIEW',
      validationFlags: nameValidation.flags,
      validationMessage: `Name rejected by validation: ${nameValidation.flags.join(', ')}`,
    };
    missingFields.push('Full Name (Requires Review)');
  } else {
    fieldsMap.fullName = {
      value: null,
      sourceText: null,
      confidence: 'LOW',
      status: 'NOT_DETECTED',
      validationFlags: ['NOT_PRESENT'],
      validationMessage: 'Full Name field was not visibly detected.',
    };
    missingFields.push('Full Name');
  }

  // 2. Validate Document Number
  const rawDocNum = getRawField('documentNumber', rawExtraction.documentNumber);
  const docNumValidation = validateDocumentNumber(rawDocNum.value, rawExtraction.documentType || undefined);

  if (docNumValidation.isValid && docNumValidation.cleanedValue) {
    fieldsMap.documentNumber = {
      value: docNumValidation.cleanedValue,
      sourceText: rawDocNum.sourceText,
      confidence: rawDocNum.confidence,
      status: 'EXTRACTED',
      validationFlags: docNumValidation.flags,
      validationMessage: 'Exact alphanumeric serial preserved.',
    };
  } else if (rawDocNum.value) {
    fieldsMap.documentNumber = {
      value: docNumValidation.cleanedValue,
      sourceText: rawDocNum.sourceText,
      confidence: 'LOW',
      status: 'NEEDS_REVIEW',
      validationFlags: docNumValidation.flags,
      validationMessage: 'Document serial format requires manual inspection.',
    };
    missingFields.push('Document Number (Requires Review)');
  } else {
    fieldsMap.documentNumber = {
      value: null,
      sourceText: null,
      confidence: 'LOW',
      status: 'NOT_DETECTED',
      validationFlags: ['NOT_PRESENT'],
      validationMessage: 'Document Number was not visibly detected.',
    };
    missingFields.push('Document Number');
  }

  // 3. Validate Date of Birth
  const rawDob = getRawField('dateOfBirth', rawExtraction.dateOfBirth);
  const dobValidation = validateDateOfBirth(rawDob.value);

  if (dobValidation.isValid && dobValidation.normalizedDate) {
    fieldsMap.dateOfBirth = {
      value: dobValidation.normalizedDate,
      sourceText: rawDob.sourceText,
      confidence: rawDob.confidence,
      status: 'EXTRACTED',
      validationFlags: dobValidation.flags,
      validationMessage: `Valid date (Age: ${dobValidation.ageYears} yrs, YYYY-MM-DD normalized).`,
    };
  } else if (rawDob.value) {
    fieldsMap.dateOfBirth = {
      value: null,
      sourceText: rawDob.sourceText,
      confidence: 'LOW',
      status: 'NEEDS_REVIEW',
      validationFlags: dobValidation.flags,
      validationMessage: `Date of Birth rejected: ${dobValidation.flags.join(', ')}`,
    };
    missingFields.push('Date of Birth (Requires Review)');
  } else {
    fieldsMap.dateOfBirth = {
      value: null,
      sourceText: null,
      confidence: 'LOW',
      status: 'NOT_DETECTED',
      validationFlags: ['NOT_PRESENT'],
      validationMessage: 'Date of Birth was not detected.',
    };
    missingFields.push('Date of Birth');
  }

  // 4. Validate Dates Chronology (Issue Date & Expiry Date)
  const rawIssue = getRawField('issueDate', rawExtraction.issueDate);
  const rawExpiry = getRawField('expirationDate', rawExtraction.expirationDate || (rawExtraction as any).expiryDate);
  const dateChrono = validateDatesChronology(rawIssue.value, rawExpiry.value);

  crossFieldChecks.push(dateChrono.consistencyCheck);

  if (rawIssue.value) {
    const parsedIssue = parseAndNormalizeDate(rawIssue.value);
    fieldsMap.issueDate = {
      value: parsedIssue.normalizedDate || rawIssue.value,
      sourceText: rawIssue.sourceText,
      confidence: parsedIssue.isValidDate ? rawIssue.confidence : 'LOW',
      status: parsedIssue.isValidDate ? 'EXTRACTED' : 'NEEDS_REVIEW',
      validationMessage: parsedIssue.isValidDate ? 'Normalized issue date' : 'Uncertain issue date format',
    };
  } else {
    fieldsMap.issueDate = {
      value: null,
      sourceText: null,
      confidence: 'LOW',
      status: 'NOT_DETECTED',
    };
  }

  if (rawExpiry.value) {
    const parsedExpiry = parseAndNormalizeDate(rawExpiry.value);
    fieldsMap.expirationDate = {
      value: parsedExpiry.normalizedDate || rawExpiry.value,
      sourceText: rawExpiry.sourceText,
      confidence: parsedExpiry.isValidDate && dateChrono.isValid ? rawExpiry.confidence : 'LOW',
      status: parsedExpiry.isValidDate && dateChrono.isValid ? 'EXTRACTED' : 'NEEDS_REVIEW',
      validationMessage: parsedExpiry.isValidDate ? 'Normalized expiration date' : 'Uncertain expiration date format',
    };
  } else {
    fieldsMap.expirationDate = {
      value: null,
      sourceText: null,
      confidence: 'LOW',
      status: 'NOT_DETECTED',
    };
  }

  // 5. Gender
  const rawGender = getRawField('gender', rawExtraction.gender);
  if (rawGender.value) {
    const g = rawGender.value.trim().toUpperCase();
    const normG = g.startsWith('M') ? 'M' : g.startsWith('F') ? 'F' : g.startsWith('X') ? 'X' : g;
    fieldsMap.gender = {
      value: normG,
      sourceText: rawGender.sourceText,
      confidence: rawGender.confidence,
      status: 'EXTRACTED',
    };
  }

  // 6. Nationality & Issuing Authority & Address
  const rawNat = getRawField('nationality', rawExtraction.nationality);
  if (rawNat.value) {
    fieldsMap.nationality = {
      value: rawNat.value.trim(),
      sourceText: rawNat.sourceText,
      confidence: rawNat.confidence,
      status: 'EXTRACTED',
    };
  }

  const rawAuth = getRawField('issuingAuthority', rawExtraction.issuingAuthority);
  if (rawAuth.value) {
    fieldsMap.issuingAuthority = {
      value: rawAuth.value.trim(),
      sourceText: rawAuth.sourceText,
      confidence: rawAuth.confidence,
      status: 'EXTRACTED',
    };
  }

  const rawAddress = getRawField('address', rawExtraction.address);
  if (rawAddress.value) {
    fieldsMap.address = {
      value: rawAddress.value.trim(),
      sourceText: rawAddress.sourceText,
      confidence: rawAddress.confidence,
      status: 'EXTRACTED',
    };
  }

  // 7. MRZ Cross-Checks
  const rawMrz1 = getRawField('mrzLine1', rawExtraction.mrzLine1);
  const rawMrz2 = getRawField('mrzLine2', rawExtraction.mrzLine2);
  if (rawMrz1.value) fieldsMap.mrzLine1 = rawMrz1;
  if (rawMrz2.value) fieldsMap.mrzLine2 = rawMrz2;

  const mrzChecks = checkMrzVisualConsistency(
    fieldsMap.documentNumber?.value,
    fieldsMap.dateOfBirth?.value,
    rawMrz2.value
  );
  crossFieldChecks.push(...mrzChecks);

  // If MRZ check failed, mark the conflicting field as CONFLICT_DETECTED
  for (const mCheck of mrzChecks) {
    if (mCheck.status === 'failed') {
      if (mCheck.fieldName.includes('Document Number') && fieldsMap.documentNumber) {
        fieldsMap.documentNumber.status = 'CONFLICT_DETECTED';
        fieldsMap.documentNumber.confidence = 'LOW';
        fieldsMap.documentNumber.validationMessage = 'MRZ serial conflicts with visual zone.';
      }
      if (mCheck.fieldName.includes('Date of Birth') && fieldsMap.dateOfBirth) {
        fieldsMap.dateOfBirth.status = 'CONFLICT_DETECTED';
        fieldsMap.dateOfBirth.confidence = 'LOW';
        fieldsMap.dateOfBirth.validationMessage = 'MRZ date of birth conflicts with visual zone.';
      }
    }
  }

  // Build the clean ExtractedOCRData object
  const verifiedOCR: ExtractedOCRData = {
    fullName: fieldsMap.fullName?.value || undefined,
    documentNumber: fieldsMap.documentNumber?.value || undefined,
    dateOfBirth: fieldsMap.dateOfBirth?.value || undefined,
    expirationDate: fieldsMap.expirationDate?.value || undefined,
    issueDate: fieldsMap.issueDate?.value || undefined,
    gender: fieldsMap.gender?.value || undefined,
    nationality: fieldsMap.nationality?.value || undefined,
    issuingAuthority: fieldsMap.issuingAuthority?.value || undefined,
    address: fieldsMap.address?.value || undefined,
    mrzLine1: fieldsMap.mrzLine1?.value || undefined,
    mrzLine2: fieldsMap.mrzLine2?.value || undefined,
    fieldEvidence: fieldsMap,
  };

  const hasCriticalConflict = crossFieldChecks.some((c) => c.status === 'failed');
  const mandatoryDetected =
    Boolean(fieldsMap.fullName?.value) &&
    Boolean(fieldsMap.documentNumber?.value) &&
    Boolean(fieldsMap.dateOfBirth?.value);

  const overallValidationPassed = !hasCriticalConflict && mandatoryDetected;

  return {
    verifiedOCR,
    fieldEvidence: fieldsMap,
    missingFields,
    crossFieldChecks,
    overallValidationPassed,
  };
}
