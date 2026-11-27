export type ElementKey = 'moc' | 'hoa' | 'tho' | 'kim' | 'thuy';

export type ElementMap = Record<ElementKey, number>;

export type RoleSlot = 'quan' | 'than' | 'ta' | 'su';

export type PrescriptionSlots = Record<RoleSlot, string | null>;

/**
 * Vector Bát Cương:
 * - exteriorInterior: -100 (Biểu) .. 0 (Cân bằng) .. +100 (Lý)
 * - coldHeat:         -100 (Hàn)  .. 0 (Cân bằng) .. +100 (Nhiệt)
 * - deficiencyExcess: -100 (Hư)   .. 0 (Cân bằng) .. +100 (Thực)
 */
export interface EightPrinciplesVector {
  exteriorInterior: number;
  coldHeat: number;
  deficiencyExcess: number;
}

export type ThermalNature = 'Đại hàn' | 'Hàn' | 'Lương' | 'Bình' | 'Ôn' | 'Nhiệt';

export type BotanicalMotif =
  | 'leaf-serrated'
  | 'leaf-aromatic'
  | 'rhizome'
  | 'flower-cluster'
  | 'flower-daisy'
  | 'peel-curl'
  | 'root-tuber'
  | 'vine-tendril'
  | 'seed-core'
  | 'berry-cluster'
  | 'bark-quill';

export interface Herb {
  id: string;
  name: string;
  traditionalName: string;
  partUsed: string;
  chapter: 1 | 2 | 3;
  motif: BotanicalMotif;
  nature: ThermalNature;
  flavors: string[];
  meridians: string[];
  primaryElement: ElementKey;
  vectorEffect: EightPrinciplesVector;
  elementEffect: Partial<ElementMap>;
  recommendedRole: RoleSlot;
  summary: string;
  homeTip: string;
  contraindications: {
    pregnancyLock?: boolean;
    pregnancyCautionAsQuan?: boolean;
    avoidColdDeficiency?: boolean;
    avoidHeatExcess?: boolean;
    warningText: string;
  };
}

export interface Acupoint {
  id: string;
  code: string;
  name: string;
  meridian: string;
  element: ElementKey;
  chapter: 1 | 2 | 3;
  bodySide: 'front' | 'back';
  x: number;
  y: number;
  locationGuide: string;
  techniqueNote: string;
  indications: string[];
  vectorEffect: EightPrinciplesVector;
  elementEffect: Partial<ElementMap>;
  pregnancyForbidden?: boolean;
  warningText?: string;
}

export interface TongueZoneDetail {
  zone: 'tip' | 'center' | 'sides' | 'root' | 'coat';
  label: string;
  organRef: string;
  finding: string;
  clueTag: string;
}

export interface TongueProfile {
  bodyColor: 'pale' | 'pink' | 'red' | 'crimson' | 'purplish';
  bodyShape: 'normal' | 'swollen-teeth' | 'thin';
  coatColor: 'thin-white' | 'thick-white' | 'yellow-dry' | 'yellow-greasy' | 'peeled';
  moisture: 'normal' | 'wet-slippery' | 'dry';
  summary: string;
  zones: TongueZoneDetail[];
}

export type PulseFingerZone = 'thon' | 'quan' | 'xich';

export interface PulseZoneDetail {
  label: string;
  strengthMultiplier: number;
  finding: string;
}

export interface PulseProfile {
  name: string;
  bpm: number;
  phuStrength: number;
  tramStrength: number;
  waveStyle: 'smooth' | 'wiry' | 'tight' | 'slippery' | 'thready' | 'rapid-surging';
  summary: string;
  phuFinding: string;
  tramFinding: string;
  zoneNotes?: Record<PulseFingerZone, PulseZoneDetail>;
}

export type AuscultationType =
  | 'cold-sniffle'
  | 'wheeze-heat'
  | 'normal-gurgle'
  | 'weak-breath'
  | 'sigh-stagnation';

export interface InquiryQuestion {
  id: string;
  topic: string;
  question: string;
  answer: string;
  clueTag: string;
}

export interface DiagnosisChoice {
  location: 'bieu' | 'ly';
  nature: 'han' | 'nhiet';
  state: 'hu' | 'thuc';
  primaryElement: ElementKey;
}

export interface PatientCase {
  id: string;
  title: string;
  chapter: 1 | 2 | 3;
  isProcedural?: boolean;
  /** Danh Y Hằng Ngày: the same case for every player on a calendar day, played without the balance preview. */
  isDaily?: boolean;
  /** Đêm Mưa Gõ Cửa: referral=true means the right answer is "Chuyển y viện ngay", not a prescription. */
  crisis?: {
    referral: boolean;
    redFlags: string[];
    lesson: string;
    /** Hoành phi text hung on the Tiền Đường wall when this night is handled correctly. */
    plaque: string;
  };
  /** Set on a tái khám visit: the story case id this patient first came for. */
  followUpOf?: string;
  patientName: string;
  patientRole: string;
  age: number;
  isPregnant?: boolean;
  seasonTag: string;
  allowAcupuncture: boolean;
  chiefComplaint: string;
  visualAppearance: string;
  audioObservation: string;
  auscultationType?: AuscultationType;
  tongue: TongueProfile;
  pulse: PulseProfile;
  inquiries: InquiryQuestion[];
  maxInquiries: number;
  initialVector: EightPrinciplesVector;
  elementImbalance: ElementMap;
  targetDiagnosis: DiagnosisChoice;
  keyHerbs: string[];
  idealQuanHerb: string;
  keyAcupoints: string[];
  clinicalExplanation: string;
  realLifeTakeaway: string;
  followUpLetters?: {
    good: string;
    partial: string;
    poor: string;
  };
}

export interface ContraindicationAlert {
  severity: 'critical' | 'caution';
  sourceId: string;
  sourceName: string;
  message: string;
}

export interface TreatmentPreview {
  resultingVector: EightPrinciplesVector;
  resultingElements: ElementMap;
  balanceScore: number;
  alerts: ContraindicationAlert[];
  activeHarmonizer: boolean;
}

export type PaoZhiMethod = 'sinh-dung' | 'gia-dap' | 'sao-vang' | 'chich-mat';

export type SlotPaoZhi = Partial<Record<RoleSlot, PaoZhiMethod>>;

export type FireType = 'vu-hoa' | 'van-vu' | 'van-hoa';

export type DosingAdvice = 'nong-dap-chan' | 'am-thoang-gio' | 'am-duong-tang';

export interface DecoctionChoice {
  fire: FireType;
  dosing: DosingAdvice;
  paoZhi?: SlotPaoZhi;
  moxaEnabled?: boolean;
  cuppingEnabled?: boolean;
  fanMatched?: boolean;
  usedFreshHerbs?: string[];
  hasBatTrangPot?: boolean;
}

export interface ClassicalFormula {
  id: string;
  name: string;
  requiredHerbs: string[];
  optionalAnyHerbs?: string[];
  category: string;
  principle: string;
  bonusPoints: number;
}

export type EvaluationGrade =
  | 'Thần Y Diệu Thủ'
  | 'Đối Chứng Khỏi Bệnh'
  | 'Thuyên Giảm Chậm'
  | 'Sai Lệch Y Lý';

export interface EvaluationResult {
  totalScore: number;
  diagnosisScore: number;
  treatmentScore: number;
  safetyPenalty: number;
  grade: EvaluationGrade;
  alerts: ContraindicationAlert[];
  resultingVector: EightPrinciplesVector;
  herbNotes: string[];
  acupointNotes: string[];
  matchedFormulas: ClassicalFormula[];
  decoctionScore: number;
  decoctionFeedback: string;
  craftBonusScore?: number;
  craftBonusNotes?: string[];
  followUpLetter?: string;
  summaryFeedback: string;
  passed: boolean;
}

export interface TyNgoWatch {
  id: string;
  branch: string;
  timeRange: string;
  startHour: number;
  endHour: number;
  meridian: string;
  organ: string;
  element: ElementKey;
  advice: string;
}

export type RankTitle = 'Y Sinh' | 'Học Đồ' | 'Lương Y' | 'Danh Y';

export type BodyConstitutionId =
  | 'binh-hoa'
  | 'khi-hu'
  | 'duong-hu'
  | 'am-hu'
  | 'dam-thap'
  | 'thap-nhiet'
  | 'huyet-u'
  | 'khi-uat'
  | 'dac-bam';

export interface ConstitutionProfile {
  id: BodyConstitutionId;
  name: string;
  tagline: string;
  signs: string[];
  tongueSummary: string;
  recommendedHerbIds: string[];
  recommendedAcupointIds: string[];
  dietLifestyleTip: string;
  bestTyNgoBranch: string;
}

export interface ConstitutionQuestion {
  id: string;
  topic: string;
  prompt: string;
  options: {
    id: string;
    label: string;
    detail?: string;
    weights: Partial<Record<BodyConstitutionId, number>>;
  }[];
}

export interface MasteryEntry {
  seen: number;
  correct: number;
  lastMissedAt?: number;
}

export interface CaseLedgerEntry {
  id: string;
  caseId: string;
  patientName: string;
  caseTitle: string;
  totalScore: number;
  grade: EvaluationGrade;
  passed: boolean;
  slots: PrescriptionSlots;
  paoZhi?: SlotPaoZhi;
  acupoints: string[];
  moxaEnabled?: boolean;
  followUpLetter: string;
  timestamp: number;
}

export interface UserProgress {
  version: number;
  unlockedChapter: 1 | 2 | 3;
  rank: RankTitle;
  completedCases: Record<string, { bestScore: number; grade: EvaluationGrade }>;
  proceduralCleared: number;
  examPassedChapters: number[];
  herbNotes: Record<string, string>;
  mastery: Record<string, MasteryEntry>;
  soundEnabled: boolean;
  ambientEnabled?: boolean;
  sfxVolume?: number;
  musicVolume?: number;
  mentorDismissed?: boolean;
  caseLedger?: CaseLedgerEntry[];
  yDucPoints?: number;
  freshHerbIds?: string[];
  gardenGrowth?: Record<string, number>;
  discoveredFormulas?: string[];
  savedConstitution?: BodyConstitutionId;
  dayCount?: number;
  currentStreak?: number;
  songAnClearedIds?: string[];
  unlockedAchievements?: string[];
  pendingFollowUps?: PendingFollowUp[];
  /** Danh Y Hằng Ngày: first attempt per day key (YYYY-MM-DD); retries do not overwrite it. */
  dailyResults?: Record<string, { score: number; grade: EvaluationGrade; passed: boolean }>;
  /** Brush-ink signature as a PNG data URL, shown on the sắc phong and the exported certificate. */
  signature?: string;
  /** Cured patients since the last Đêm Mưa Gõ Cửa; a knock comes at CURES_PER_CRISIS. */
  curesSinceCrisis?: number;
  crisesAttended?: number;
  /** Hoành phi earned on rainy nights, hung on the Tiền Đường wall. */
  hoanhPhi?: string[];
  /** Most recent desk mistakes, replayed in Khảo Thí Y Miếu. */
  mistakes?: MistakeEntry[];
}

export interface PendingFollowUp {
  caseId: string;
  patientName: string;
  dueDay: number;
  kind: 'chua-lui' | 'chuyen-the';
  residual: EightPrinciplesVector;
  /** chuyen-the only: procedural template the disease turned into. */
  templateCode?: string;
  /** Note the patient sends ahead of the visit (absent in saves made before letters existed). */
  letter?: string;
}

export interface DecoctionTasteReading {
  aroma: string;
  flavorNote: string;
  thermalBalance: string;
  matchTone: 'balanced' | 'warm' | 'cool' | 'empty';
  recommendation: string;
}

export interface SongAnPair {
  id: string;
  title: string;
  subtitle: string;
  caseAId: string;
  caseBId: string;
  rewardYDuc: number;
  clinicalNote: string;
}

export type ExamQuestionType = 'tongue' | 'pulse' | 'formula' | 'acupoint' | 'review';

/** A herb the healer got wrong at the desk; it comes back as a Khảo Thí question until answered right. */
export interface MistakeEntry {
  key: string;
  kind: 'wrong-quan' | 'contraindication';
  caseTitle: string;
  patientName: string;
  /** The herb the healer actually used. */
  herbId: string;
  /** wrong-quan: the herb that should have led the formula. */
  idealHerbId?: string;
  /** Herbs that did belong in this case (distractors for the contraindication question). */
  keyHerbIds: string[];
  note: string;
}

export interface ExamQuestion {
  id: string;
  type: ExamQuestionType;
  targetKey: string;
  prompt: string;
  subtext: string;
  options: { id: string; label: string; detail?: string }[];
  correctOptionId: string;
  explanation: string;
  tonguePreview?: TongueProfile;
  pulsePreview?: PulseProfile;
  acupointMapSide?: 'front' | 'back';
  acupointCandidateIds?: string[];
}
