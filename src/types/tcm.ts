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
  /** Normalized SVG coordinates on 0..200 x 0..420 viewBox */
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

export interface PulseProfile {
  name: string;
  bpm: number;
  /** Floating depth (Ấn nhẹ / Phù thủ): 0.15 .. 1.0 */
  phuStrength: number;
  /** Deep depth (Ấn sâu / Trầm thủ): 0.15 .. 1.0 */
  tramStrength: number;
  waveStyle: 'smooth' | 'wiry' | 'tight' | 'slippery' | 'thready' | 'rapid-surging';
  summary: string;
  phuFinding: string;
  tramFinding: string;
}

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
  patientName: string;
  patientRole: string;
  age: number;
  isPregnant?: boolean;
  seasonTag: string;
  allowAcupuncture: boolean;
  chiefComplaint: string;
  visualAppearance: string;
  audioObservation: string;
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

export interface MasteryEntry {
  seen: number;
  correct: number;
  lastMissedAt?: number;
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
}

export type ExamQuestionType = 'tongue' | 'pulse' | 'formula' | 'acupoint';

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
