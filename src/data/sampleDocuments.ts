import { SamplePresetDocument, VerificationResult } from '../types';
import { calculateRiskAssessment } from '../lib/riskAssessmentEngine';

// Helper to generate realistic SVG data URIs for document visual previews
export function createDocumentSvgPreview(title: string, subtitle: string, docNum: string, type: 'passport' | 'id_card' | 'dl' | 'bill', anomaly?: 'dob' | 'photo' | 'moire' | 'none'): string {
  const isDark = type === 'passport';
  const bgColor = type === 'passport' ? '#0f172a' : type === 'id_card' ? '#1e293b' : type === 'dl' ? '#172554' : '#f8fafc';
  const textColor = type === 'bill' ? '#0f172a' : '#f8fafc';
  const subColor = type === 'bill' ? '#64748b' : '#94a3b8';
  const accentColor = type === 'passport' ? '#38bdf8' : type === 'id_card' ? '#34d399' : type === 'dl' ? '#60a5fa' : '#f59e0b';
  
  const anomalyOverlay = anomaly === 'dob' ? `
    <rect x="220" y="118" width="130" height="24" fill="none" stroke="#f43f5e" stroke-width="2" stroke-dasharray="3,3" />
    <rect x="220" y="118" width="130" height="24" fill="#f43f5e" fill-opacity="0.15" />
    <text x="360" y="134" fill="#f43f5e" font-family="monospace" font-size="10" font-weight="bold">KERNING MISMATCH</text>
  ` : anomaly === 'photo' ? `
    <rect x="25" y="55" width="110" height="135" fill="none" stroke="#f43f5e" stroke-width="2.5" stroke-dasharray="4,4" />
    <rect x="25" y="55" width="110" height="135" fill="#f43f5e" fill-opacity="0.15" />
    <text x="30" y="48" fill="#f43f5e" font-family="monospace" font-size="10" font-weight="bold">SPLICE HALO (ELA: 89%)</text>
  ` : anomaly === 'moire' ? `
    <pattern id="moire" width="6" height="6" patternUnits="userSpaceOnUse">
      <path d="M 0 3 L 6 3 M 3 0 L 3 6" stroke="#fbbf24" stroke-width="0.7" opacity="0.35"/>
    </pattern>
    <rect x="0" y="0" width="480" height="280" fill="url(#moire)" />
    <rect x="20" y="20" width="440" height="240" fill="none" stroke="#f59e0b" stroke-width="2" stroke-dasharray="4,4" />
    <text x="140" y="260" fill="#f59e0b" font-family="monospace" font-size="11" font-weight="bold">DIGITAL RE-CAPTURE PATTERN DETECTED</text>
  ` : '';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 280" width="100%" height="100%">
    <defs>
      <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgColor}" />
        <stop offset="100%" stop-color="#020617" />
      </linearGradient>
      <linearGradient id="guilloche" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.12"/>
        <stop offset="100%" stop-color="${accentColor}" stop-opacity="0.02"/>
      </linearGradient>
    </defs>
    
    <!-- Background Card -->
    <rect width="480" height="280" rx="14" fill="url(#cardGrad)" stroke="#334155" stroke-width="1.5" />
    <rect x="8" y="8" width="464" height="264" rx="10" fill="url(#guilloche)" stroke="${accentColor}" stroke-opacity="0.25" stroke-width="1" />
    
    <!-- Header -->
    <g transform="translate(24, 28)">
      <circle cx="12" cy="12" r="10" fill="${accentColor}" fill-opacity="0.2" stroke="${accentColor}" stroke-width="1.5" />
      <text x="32" y="16" fill="${textColor}" font-family="sans-serif" font-size="13" font-weight="800" letter-spacing="1.5">${title.toUpperCase()}</text>
      <text x="32" y="28" fill="${subColor}" font-family="sans-serif" font-size="9" font-weight="600" letter-spacing="0.5">${subtitle}</text>
      <text x="430" y="16" text-anchor="end" fill="${accentColor}" font-family="monospace" font-size="11" font-weight="bold">${docNum}</text>
    </g>
    
    <!-- Divider -->
    <line x1="24" y1="62" x2="456" y2="62" stroke="#334155" stroke-width="1" />
    
    <!-- Photo Avatar Box -->
    <g transform="translate(28, 74)">
      <rect width="104" height="124" rx="6" fill="#1e293b" stroke="#475569" stroke-width="1" />
      <!-- Silhouette avatar -->
      <circle cx="52" cy="46" r="22" fill="#64748b" />
      <path d="M 22 108 C 22 80, 82 80, 82 108 Z" fill="#64748b" />
      <rect x="0" y="104" width="104" height="20" fill="#0f172a" fill-opacity="0.75" />
      <text x="52" y="117" text-anchor="middle" fill="#94a3b8" font-family="monospace" font-size="7.5" font-weight="bold">SECURE PORTRAIT</text>
    </g>
    
    <!-- Data Fields -->
    <g transform="translate(150, 78)" fill="${textColor}">
      <text x="0" y="12" fill="${subColor}" font-family="sans-serif" font-size="8" font-weight="bold">SURNAME / NOM</text>
      <text x="0" y="26" font-family="sans-serif" font-size="12" font-weight="700">VALENTINE</text>
      
      <text x="0" y="44" fill="${subColor}" font-family="sans-serif" font-size="8" font-weight="bold">GIVEN NAMES / PRÉNOMS</text>
      <text x="0" y="58" font-family="sans-serif" font-size="12" font-weight="700">ALEXANDER JAMES</text>
      
      <text x="0" y="76" fill="${subColor}" font-family="sans-serif" font-size="8" font-weight="bold">NATIONALITY / NATIONALITÉ</text>
      <text x="0" y="88" font-family="sans-serif" font-size="11" font-weight="600">UTOPIAN REPUBLIC (UTP)</text>
      
      <text x="170" y="12" fill="${subColor}" font-family="sans-serif" font-size="8" font-weight="bold">DATE OF BIRTH</text>
      <text x="170" y="26" font-family="monospace" font-size="12" font-weight="700">14 MAY 1991</text>
      
      <text x="170" y="44" fill="${subColor}" font-family="sans-serif" font-size="8" font-weight="bold">SEX / SEXE</text>
      <text x="170" y="58" font-family="sans-serif" font-size="11" font-weight="600">M</text>
      
      <text x="170" y="76" fill="${subColor}" font-family="sans-serif" font-size="8" font-weight="bold">EXPIRY DATE</text>
      <text x="170" y="88" font-family="monospace" font-size="11" font-weight="700" fill="#38bdf8">28 NOV 2030</text>
    </g>
    
    <!-- Microprint / Guilloche Line -->
    <text x="24" y="222" fill="${subColor}" font-family="monospace" font-size="6" letter-spacing="3" opacity="0.6">VERIDOXA-SECURE-SCREENING-ICAO9303-AUTHENTICITY-FRAMEWORK-2026-VERIDOXA</text>
    
    <!-- MRZ / Machine Readable Zone -->
    <g transform="translate(24, 234)">
      <rect width="432" height="34" rx="4" fill="#020617" fill-opacity="0.85" stroke="#1e293b" stroke-width="1" />
      <text x="12" y="15" fill="#38bdf8" font-family="JetBrains Mono, monospace" font-size="10" letter-spacing="2.2" font-weight="bold">P&lt;UTPVALENTINE&lt;&lt;ALEXANDER&lt;JAMES&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</text>
      <text x="12" y="28" fill="#38bdf8" font-family="JetBrains Mono, monospace" font-size="10" letter-spacing="2.2" font-weight="bold">K982314502UTP9105148M3011285&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;06</text>
    </g>
    
    <!-- Forensic Anomaly Highlighting -->
    ${anomalyOverlay}
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const SAMPLE_PRESET_DOCUMENTS: SamplePresetDocument[] = [
  {
    id: 'sample-consistent-passport',
    name: 'Sample A: Consistent Standard Passport',
    documentType: 'passport',
    description: 'ICAO 9303 compliant biometric passport specimen. Uniform typography, valid check digits, genuine background guilloche pattern.',
    expectedRiskLevel: 'LOW_RISK',
    badgeLabel: 'Low Risk (Score: 12)',
    thumbnailSvg: createDocumentSvgPreview('Republic of Astra', 'Official Specimen Passport', 'P-8829410', 'passport', 'none'),
    mockResult: {
      id: 'VDX-2026-88392',
      timestamp: '2026-08-31T09:15:20Z',
      fileName: 'astra_passport_specimen_01.png',
      fileSizeFormatted: '2.4 MB',
      fileType: 'image/png',
      documentType: 'passport',
      documentTypeLabel: 'Passport (ICAO 9303 Compliant)',
      imagePreviewUrl: createDocumentSvgPreview('Republic of Astra', 'Official Specimen Passport', 'P-8829410', 'passport', 'none'),
      riskScore: 12,
      riskLevel: 'LOW_RISK',
      riskSummary: 'High visual and structural consistency across all tested forensic vectors. ICAO 9303 checksums match OCR extracted visual text.',
      engineUsed: 'Veridoxa Heuristic Screening Engine (Demo Layer)',
      processingTimeMs: 1420,
      qualityMetrics: {
        resolutionDpi: 340,
        resolutionStatus: 'Good (>300 DPI)',
        sharpnessScore: 94,
        glareReflectionScore: 8,
        lightingUniformityScore: 92,
        edgeIntegrityScore: 96,
      },
      extractedOCR: {
        fullName: 'VALENTINE, ALEXANDER JAMES',
        documentNumber: 'K98231450',
        dateOfBirth: '14/05/1991',
        expirationDate: '28/11/2030',
        issueDate: '28/11/2020',
        nationality: 'AST (Astra)',
        issuingAuthority: 'Ministry of External Affairs',
        gender: 'M',
        mrzLine1: 'P<ASTVALENTINE<<ALEXANDER<JAMES<<<<<<<<<<<',
        mrzLine2: 'K982314502AST9105148M3011285<<<<<<<<<<<<<<06',
        mrzChecksumValid: true,
        personalNumber: '910514-8821',
      },
      findings: [
        {
          id: 'f-1',
          category: 'mrz_checksum',
          title: 'MRZ Checksum Digits Validated',
          description: 'Document number, birth date, and expiration check digits correctly validate against standard ICAO 9303 weighting algorithm 7-3-1.',
          severity: 'low',
          confidenceScore: 98,
          affectedZone: 'Machine Readable Zone (MRZ)',
        },
        {
          id: 'f-2',
          category: 'typography_inconsistency',
          title: 'Consistent OCR-B Font Geometry',
          description: 'No font substitution, baseline drift, or kerning anomalies detected in the visual inspection zone.',
          severity: 'low',
          confidenceScore: 94,
          affectedZone: 'Visual Inspection Zone',
        },
      ],
      consistencyChecks: [
        {
          fieldName: 'Expiration vs Issue Date',
          status: 'passed',
          ruleDescription: 'Expiration date must be strictly after issue date with a standard validity window (5 or 10 years).',
          details: 'Document validity window is exactly 10 years (2020-11-28 to 2030-11-28).',
        },
        {
          fieldName: 'MRZ vs Visual Name Congruence',
          status: 'passed',
          ruleDescription: 'Name extracted from visual field must match parsed MRZ characters.',
          details: 'Exact match: "ALEXANDER JAMES VALENTINE" <-> "VALENTINE<<ALEXANDER<JAMES".',
        },
        {
          fieldName: 'Photo Edge Continuity',
          status: 'passed',
          ruleDescription: 'Photo boundary must not show digital paste halos or double compression artifacts.',
          details: 'Continuous noise gradient across photo borders. Background guilloche lines pass cleanly behind portrait mask.',
        },
      ],
      annotationZones: [
        {
          id: 'zone-mrz',
          label: 'MRZ Checksum Pass',
          x: 5,
          y: 83,
          width: 90,
          height: 14,
          severity: 'low',
          comment: 'Checksums match 7-3-1 algorithm. Doc# verified.',
        },
        {
          id: 'zone-photo',
          label: 'Photo Boundary Normal',
          x: 6,
          y: 26,
          width: 22,
          height: 45,
          severity: 'low',
          comment: 'Smooth micro-contrast gradient; no edge splicing halo.',
        },
      ],
      manualReviewRecommended: false,
      manualActionChecklist: [
        'Routine automated processing permitted according to standard risk appetite.',
        'If higher assurance level is required, compare portrait against national biometric registry.',
      ],
      disclaimerNotice: 'Veridoxa AI provides automated statistical risk assessment. It does not certify legal document authenticity.',
      auditHash: 'sha256:7f83b16298ac1455b89a80e12d91e1276a084bc6',
    },
  },
  {
    id: 'sample-modified-dob-dl',
    name: 'Sample B: Altered Driver’s License (Tampered DOB)',
    documentType: 'drivers_license',
    description: 'Driver’s license specimen with tampered Date of Birth digits. Clear typography kerning anomaly, compression noise mismatch, and age computation discrepancy.',
    expectedRiskLevel: 'HIGH_RISK',
    badgeLabel: 'High Risk (Score: 88)',
    thumbnailSvg: createDocumentSvgPreview('State Motor Vehicle Dept', 'Driver License Class C', 'DL-4920194A', 'dl', 'dob'),
    mockResult: {
      id: 'VDX-2026-90412',
      timestamp: '2026-08-31T09:22:45Z',
      fileName: 'dl_specimen_altered_dob.png',
      fileSizeFormatted: '1.8 MB',
      fileType: 'image/png',
      documentType: 'drivers_license',
      documentTypeLabel: "Driver's License (State Standard)",
      imagePreviewUrl: createDocumentSvgPreview('State Motor Vehicle Dept', 'Driver License Class C', 'DL-4920194A', 'dl', 'dob'),
      riskScore: 88,
      riskLevel: 'HIGH_RISK',
      riskSummary: 'High probability of digital manipulation detected in Date of Birth field. Significant font anti-aliasing mismatch and ELA compression artifact concentration.',
      engineUsed: 'Veridoxa Heuristic Screening Engine (Demo Layer)',
      processingTimeMs: 1680,
      qualityMetrics: {
        resolutionDpi: 290,
        resolutionStatus: 'Moderate (150-300 DPI)',
        sharpnessScore: 86,
        glareReflectionScore: 12,
        lightingUniformityScore: 84,
        edgeIntegrityScore: 88,
      },
      extractedOCR: {
        fullName: 'MARTINEZ, JONATHAN RAY',
        documentNumber: 'DL-4920194A',
        dateOfBirth: '14/05/1998 (SUSPICIOUS: modified from 2004)',
        expirationDate: '15/09/2028',
        issueDate: '15/09/2022',
        nationality: 'USA',
        issuingAuthority: 'Department of Motor Vehicles',
        gender: 'M',
        address: '742 Evergreen Terr, Springfield, IL',
        personalNumber: 'SSN-XXX-44-1029',
      },
      findings: [
        {
          id: 'f-1',
          category: 'typography_inconsistency',
          title: 'Font Substitution & Kerning Anomaly in DOB',
          description: 'The year digit "1998" exhibits an inconsistent stroke weight and anti-aliasing profile compared to neighboring text fields.',
          severity: 'critical',
          confidenceScore: 93,
          affectedZone: 'Date of Birth (DOB) Field',
          evidenceSnippet: 'Local pixel variance in "1998" shows 4.8x higher residual noise than surrounding "14 MAY".',
        },
        {
          id: 'f-2',
          category: 'visual_tampering',
          title: 'Error Level Analysis (ELA) Compression Discrepancy',
          description: 'A localized rectangular re-compression bounding box was identified over the year of birth digits, indicating post-scan graphic editing.',
          severity: 'high',
          confidenceScore: 89,
          affectedZone: 'Coordinates (X:220, Y:118)',
        },
        {
          id: 'f-3',
          category: 'date_logic',
          title: 'Issue Date vs Minimum Legal Driving Age Inconsistency',
          description: 'Calculated applicant age at issue date is inconsistent with jurisdiction licensing database sequence.',
          severity: 'medium',
          confidenceScore: 78,
          affectedZone: 'Issue Date Cross-check',
        },
      ],
      consistencyChecks: [
        {
          fieldName: 'DOB Typography Integrity',
          status: 'failed',
          ruleDescription: 'Text glyphs within date fields must share identical baseline, font metric matrix, and subpixel rendering.',
          details: 'Glyph "9" in year position has 18% higher pixel density and mismatched baseline alignment by 2.4px.',
        },
        {
          fieldName: 'Error Level Analysis Variance',
          status: 'failed',
          ruleDescription: 'JPEG compression quantization tables should be uniform across all document text areas.',
          details: 'Localized re-saving artifact detected specifically bounding the DOB field.',
        },
        {
          fieldName: 'Name & License Number Format',
          status: 'passed',
          ruleDescription: 'License number checksum and character length conform to state formatting regulations.',
          details: 'Format matches standard state mask (DL-#######A).',
        },
      ],
      annotationZones: [
        {
          id: 'zone-dob-tamper',
          label: 'Altered DOB Digits',
          x: 45,
          y: 42,
          width: 32,
          height: 12,
          severity: 'critical',
          comment: 'Re-compression box & font kerning mismatch detected.',
        },
      ],
      manualReviewRecommended: true,
      manualActionChecklist: [
        'MANDATORY: Do not accept document for automated KYC verification.',
        'Request original physical plastic card for physical tactile inspection.',
        'Check laser-engraved ghost portrait and micro-printed DOB under 10x magnification.',
        'Query the state DMV or central licensing database for true date of birth record.',
      ],
      disclaimerNotice: 'Veridoxa AI provides automated statistical risk assessment. It does not certify legal document authenticity.',
      auditHash: 'sha256:3d91b498f41189ac352018ea19280a911762e841',
    },
  },
  {
    id: 'sample-spliced-photo-id',
    name: 'Sample C: Spliced Photo National ID Card',
    documentType: 'national_id',
    description: 'National Identity Card with suspected photo replacement (splice halo along portrait borders, broken micro-print line beneath portrait).',
    expectedRiskLevel: 'HIGH_RISK',
    badgeLabel: 'High Risk (Score: 82)',
    thumbnailSvg: createDocumentSvgPreview('Federal Identity Authority', 'Citizen National ID Card', 'ID-7819920', 'id_card', 'photo'),
    mockResult: {
      id: 'VDX-2026-91104',
      timestamp: '2026-08-31T09:30:10Z',
      fileName: 'national_id_spliced_photo_test.png',
      fileSizeFormatted: '3.1 MB',
      fileType: 'image/png',
      documentType: 'national_id',
      documentTypeLabel: 'National Identity Card (Smart Chip ID)',
      imagePreviewUrl: createDocumentSvgPreview('Federal Identity Authority', 'Citizen National ID Card', 'ID-7819920', 'id_card', 'photo'),
      riskScore: 82,
      riskLevel: 'HIGH_RISK',
      riskSummary: 'Photo replacement anomaly detected. High edge discontinuity along portrait border with broken micro-print pattern and inconsistent lighting gradient.',
      engineUsed: 'Veridoxa Heuristic Screening Engine (Demo Layer)',
      processingTimeMs: 1540,
      qualityMetrics: {
        resolutionDpi: 310,
        resolutionStatus: 'Good (>300 DPI)',
        sharpnessScore: 91,
        glareReflectionScore: 10,
        lightingUniformityScore: 68,
        edgeIntegrityScore: 42,
      },
      extractedOCR: {
        fullName: 'HENDERSON, CLARA LOUISE',
        documentNumber: 'ID-7819920',
        dateOfBirth: '22/09/1987',
        expirationDate: '10/04/2031',
        issueDate: '10/04/2021',
        nationality: 'GBR',
        issuingAuthority: 'National Identity Register',
        gender: 'F',
        mrzLine1: 'I<GBR7819920<<<8<<<<<<<<<<<<<<<',
        mrzLine2: '8709224F3104106GBR<<<<<<<<<<<<<6',
        mrzChecksumValid: true,
      },
      findings: [
        {
          id: 'f-1',
          category: 'photo_splice',
          title: 'Portrait Edge Splicing & Halo Discontinuity',
          description: 'A sharp high-frequency edge transition and 1.8px halo artifact was identified wrapping around the subject’s head and shoulders.',
          severity: 'critical',
          confidenceScore: 91,
          affectedZone: 'Primary Portrait Bounding Box',
        },
        {
          id: 'f-2',
          category: 'visual_tampering',
          title: 'Interrupted Security Guilloche Background',
          description: 'The geometric security pattern abruptly terminates at the boundary of the portrait rather than blending with proper multi-layer transparency.',
          severity: 'high',
          confidenceScore: 87,
          affectedZone: 'Portrait Layer Interlock',
        },
        {
          id: 'f-3',
          category: 'quality_issue',
          title: 'Lighting Vector Angle Mismatch',
          description: 'Subject face lighting has key light from top-left (45 deg) while ambient document shadow indicators indicate top-right diffuse illumination.',
          severity: 'medium',
          confidenceScore: 74,
          affectedZone: 'Facial Lighting Model',
        },
      ],
      consistencyChecks: [
        {
          fieldName: 'Photo Edge Continuity',
          status: 'failed',
          ruleDescription: 'Photo boundary must not show digital paste halos or double compression artifacts.',
          details: 'Splice perimeter detected around portrait box with 89% ELA variance.',
        },
        {
          fieldName: 'Guilloche Overlay Integrity',
          status: 'failed',
          ruleDescription: 'Security guilloche background must continuously transition across document surface layers.',
          details: 'Pattern terminates abruptly along photo boundary.',
        },
        {
          fieldName: 'MRZ Checksum Validation',
          status: 'passed',
          ruleDescription: 'ICAO 9303 checksums validate correctly.',
          details: 'MRZ digits compute valid hash sums.',
        },
      ],
      annotationZones: [
        {
          id: 'zone-photo-splice',
          label: 'Photo Splice Halo',
          x: 5,
          y: 20,
          width: 25,
          height: 48,
          severity: 'critical',
          comment: 'Splice halo & severed guilloche background lines.',
        },
      ],
      manualReviewRecommended: true,
      manualActionChecklist: [
        'MANDATORY: Flag for tier-2 forensic document examination.',
        'Examine physical card under oblique ultraviolet (UV 365nm) illumination for hologram intactness.',
        'Check tactile relief around photo window for physical cut-and-paste tampering.',
        'Request live biometric liveness face-match selfie or in-person verification.',
      ],
      disclaimerNotice: 'Veridoxa AI provides automated statistical risk assessment. It does not certify legal document authenticity.',
      auditHash: 'sha256:918fa2401828014ba38201ea18029ab00119280a',
    },
  },
  {
    id: 'sample-moire-screen-capture',
    name: 'Sample D: Screen Capture / Digital Re-photograph',
    documentType: 'residence_permit',
    description: 'Document captured from a computer/phone screen rather than original physical card. Moiré interference patterns detected with low dynamic range.',
    expectedRiskLevel: 'NEEDS_REVIEW',
    badgeLabel: 'Needs Review (Score: 58)',
    thumbnailSvg: createDocumentSvgPreview('EU Migration Agency', 'Permanent Residence Card', 'RP-9921008', 'id_card', 'moire'),
    mockResult: {
      id: 'VDX-2026-92881',
      timestamp: '2026-08-31T09:33:14Z',
      fileName: 'residence_permit_screen_photo.jpg',
      fileSizeFormatted: '1.2 MB',
      fileType: 'image/jpeg',
      documentType: 'residence_permit',
      documentTypeLabel: 'Residence Permit (EU Standard)',
      imagePreviewUrl: createDocumentSvgPreview('EU Migration Agency', 'Permanent Residence Card', 'RP-9921008', 'id_card', 'moire'),
      riskScore: 58,
      riskLevel: 'NEEDS_REVIEW',
      riskSummary: 'Probable digital re-capture detected (photo of a screen or low-fidelity color printout). Distinct periodic moiré banding and lack of optical specular reflection.',
      engineUsed: 'Veridoxa Heuristic Screening Engine (Demo Layer)',
      processingTimeMs: 1350,
      qualityMetrics: {
        resolutionDpi: 180,
        resolutionStatus: 'Moderate (150-300 DPI)',
        sharpnessScore: 68,
        glareReflectionScore: 45,
        lightingUniformityScore: 62,
        edgeIntegrityScore: 78,
      },
      extractedOCR: {
        fullName: 'KOWALSKI, MATEUSZ',
        documentNumber: 'RP-9921008',
        dateOfBirth: '03/11/1984',
        expirationDate: '15/06/2029',
        issueDate: '15/06/2019',
        nationality: 'POL',
        issuingAuthority: 'Foreigners Office Department',
        gender: 'M',
        address: 'Ulica Marszalkowska 42, Warsaw',
      },
      findings: [
        {
          id: 'f-1',
          category: 'visual_tampering',
          title: 'Periodic Moiré Pattern (Sub-pixel Screen Grid)',
          description: 'Fourier transform analysis reveals periodic high-frequency grid frequencies characteristic of LCD/OLED subpixel display matrices.',
          severity: 'high',
          confidenceScore: 84,
          affectedZone: 'Full Document Surface',
        },
        {
          id: 'f-2',
          category: 'quality_issue',
          title: 'Missing Optical Variable Device (OVD) Refraction',
          description: 'Holographic and optically variable ink regions do not exhibit genuine spectral light shift.',
          severity: 'medium',
          confidenceScore: 72,
          affectedZone: 'Hologram Patch Area',
        },
      ],
      consistencyChecks: [
        {
          fieldName: 'Screen Re-capture Indicator',
          status: 'warning',
          ruleDescription: 'Images must be captured directly from physical identity token under natural or flash lighting.',
          details: 'Moiré grid interference detected with 84% statistical confidence.',
        },
        {
          fieldName: 'Text Alignment & Data Fields',
          status: 'passed',
          ruleDescription: 'Extracted text structure conforms to standard EU residence card specifications.',
          details: 'All required demographic and validity fields are present and structurally valid.',
        },
      ],
      annotationZones: [
        {
          id: 'zone-moire',
          label: 'Moiré Display Interference',
          x: 10,
          y: 10,
          width: 80,
          height: 80,
          severity: 'medium',
          comment: 'LCD screen pixel grid harmonics detected across surface.',
        },
      ],
      manualReviewRecommended: true,
      manualActionChecklist: [
        'Request user to provide a direct camera photograph of the physical original document.',
        'Reject screenshots, scans of screens, or photocopies if policy requires original document submission.',
        'Consider triggering live video capture or NFC chip read if mobile SDK is available.',
      ],
      disclaimerNotice: 'Veridoxa AI provides automated statistical risk assessment. It does not certify legal document authenticity.',
      auditHash: 'sha256:4910ea8290bb0021c38201aae192080a11293021',
    },
  },
  {
    id: 'sample-genuine-utility-bill',
    name: 'Sample E: Proof of Address / Utility Invoice',
    documentType: 'utility_bill',
    description: 'Electric & gas utility statement for residency verification. Consistent layout, issue date within acceptable 90-day window, valid customer billing details.',
    expectedRiskLevel: 'LOW_RISK',
    badgeLabel: 'Low Risk (Score: 18)',
    thumbnailSvg: createDocumentSvgPreview('Apex Energy Utilities', 'Monthly Billing Statement', 'INV-2026-8812', 'bill', 'none'),
    mockResult: {
      id: 'VDX-2026-93219',
      timestamp: '2026-08-31T09:34:02Z',
      fileName: 'apex_energy_statement_aug2026.pdf',
      fileSizeFormatted: '840 KB',
      fileType: 'application/pdf',
      documentType: 'utility_bill',
      documentTypeLabel: 'Utility Bill (Proof of Address)',
      imagePreviewUrl: createDocumentSvgPreview('Apex Energy Utilities', 'Monthly Billing Statement', 'INV-2026-8812', 'bill', 'none'),
      riskScore: 18,
      riskLevel: 'LOW_RISK',
      riskSummary: 'High document integrity. Consistent corporate layout, valid service dates within 90 days, no structural digital font alterations detected.',
      engineUsed: 'Veridoxa Heuristic Screening Engine (Demo Layer)',
      processingTimeMs: 1120,
      qualityMetrics: {
        resolutionDpi: 300,
        resolutionStatus: 'Good (>300 DPI)',
        sharpnessScore: 96,
        glareReflectionScore: 4,
        lightingUniformityScore: 98,
        edgeIntegrityScore: 95,
      },
      extractedOCR: {
        fullName: 'VALENTINE, ALEXANDER JAMES',
        documentNumber: 'INV-2026-8812',
        issueDate: '15/08/2026',
        issuingAuthority: 'Apex Energy Power & Gas Corp',
        address: '42 Highfield Crescent, Sector 9, Metro City',
        rawTextPreview: 'Apex Energy - Account #8812-491 - Statement Period: 01/07/2026 to 31/07/2026. Total Amount Due: $142.50. Service Address: 42 Highfield Crescent, Sector 9, Metro City.',
      },
      findings: [
        {
          id: 'f-1',
          category: 'date_logic',
          title: 'Document Recency Verified (<90 Days)',
          description: 'Statement issue date (August 15, 2026) is within the required 90-day KYC recency window.',
          severity: 'low',
          confidenceScore: 97,
          affectedZone: 'Invoice Date Header',
        },
        {
          id: 'f-2',
          category: 'typography_inconsistency',
          title: 'Digital PDF Vector Text Uniformity',
          description: 'Native PDF vector text streams match embedded font metrics without rasterized patch overlays.',
          severity: 'low',
          confidenceScore: 95,
          affectedZone: 'Billing Address Block',
        },
      ],
      consistencyChecks: [
        {
          fieldName: 'Proof of Address Recency',
          status: 'passed',
          ruleDescription: 'Utility invoices must be issued within past 90 days from screening date.',
          details: 'Statement age is 16 days old.',
        },
        {
          fieldName: 'Name Match with Identity Record',
          status: 'passed',
          ruleDescription: 'Customer name matches applicant full legal name.',
          details: 'Exact match: "ALEXANDER JAMES VALENTINE".',
        },
      ],
      annotationZones: [
        {
          id: 'zone-address',
          label: 'Verified Address Zone',
          x: 8,
          y: 28,
          width: 50,
          height: 25,
          severity: 'low',
          comment: 'Consistent vector font stream and verified postal format.',
        },
      ],
      manualReviewRecommended: false,
      manualActionChecklist: [
        'Document meets standard proof-of-address verification requirements.',
        'Retain for audit log retention schedule.',
      ],
      disclaimerNotice: 'Veridoxa AI provides automated statistical risk assessment. It does not certify legal document authenticity.',
      auditHash: 'sha256:1082aa9401928014ba38201ea18029ab00119299',
    },
  },
];

// Initialize and enrich all preset mock results with calculated Risk Assessment Engine results
SAMPLE_PRESET_DOCUMENTS.forEach((doc) => {
  if (!doc.mockResult.riskAssessment) {
    const assessed = calculateRiskAssessment({
      qualityMetrics: doc.mockResult.qualityMetrics,
      extractedFields: doc.mockResult.extractedOCR,
      findings: doc.mockResult.findings,
      consistencyChecks: doc.mockResult.consistencyChecks,
      aiConfidence: doc.expectedRiskLevel === 'LOW_RISK' ? 96 : doc.expectedRiskLevel === 'NEEDS_REVIEW' ? 62 : 28,
      documentTypeLabel: doc.mockResult.documentTypeLabel,
      aiAnalysis: doc.mockResult.aiAnalysis,
    });
    doc.mockResult.riskAssessment = assessed;
    doc.mockResult.riskScore = assessed.riskScore;
    doc.mockResult.riskLevel = assessed.normalizedRiskLevel;
    doc.mockResult.riskSummary = assessed.explanation;
  }
});

