import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ACUPOINTS } from '../../data/acupoints';
import { STORY_CASES, SONG_AN_PAIRS, generateProceduralCase, getSeasonalSolarTerm } from '../../data/cases';
import { evaluateConstitution } from '../../data/constitutions';
import { detectActiveFormulas } from '../../data/formulas';
import { GLOSSARY_TERMS, segmentTextWithGlossary } from '../../data/glossary';
import { HERBS } from '../../data/herbs';
import { GARDEN_PLOTS } from '../../components/HerbGardenRoom';
import { apothecaryAudio } from '../audio';
import { selectExamSession } from '../examEngine';
import { createDefaultProgress, exportSaveJson, importSaveJson, loadProgress } from '../storage';
import {
  assignHerbToSlot,
  checkContraindications,
  computeTreatmentPreview,
  describeDecoctionTaste,
  emptySlots,
  evaluateCaseSubmission,
  getPaoZhiTransformation,
  getTyNgoWatch,
  simulateFiveElements
} from '../tcmEngine';
import { PrescriptionSlots } from '../../types/tcm';

describe('Nam Y Quán — YHCT Core Engine & Data Integrity', () => {
  it('contains 20 herbs, 20 garden plots, and 24 acupoints (12 front, 12 back) across 3 chapters', () => {
    expect(HERBS).toHaveLength(20);
    expect(GARDEN_PLOTS).toHaveLength(20);
    expect(new Set(GARDEN_PLOTS.map((p) => p.herbId)).size).toBe(20);
    HERBS.forEach((h) => {
      expect(GARDEN_PLOTS.some((p) => p.herbId === h.id), `Missing garden plot for ${h.id}`).toBe(true);
    });
    expect(ACUPOINTS).toHaveLength(24);
    expect(ACUPOINTS.filter((a) => a.bodySide === 'front')).toHaveLength(12);
    expect(ACUPOINTS.filter((a) => a.bodySide === 'back')).toHaveLength(12);
    expect(STORY_CASES).toHaveLength(10);
  });

  it('Failure Mode 1: assignHerbToSlot moves herb across pans without duplication', () => {
    let slots = emptySlots();
    slots = assignHerbToSlot(slots, 'quan', 'tia-to');
    slots = assignHerbToSlot(slots, 'than', 'kinh-gioi');
    // Move tia-to from quan into than
    slots = assignHerbToSlot(slots, 'than', 'tia-to');

    expect(slots.quan).toBeNull();
    expect(slots.than).toBe('tia-to');
    const assigned = Object.values(slots).filter(Boolean);
    expect(new Set(assigned).size).toBe(assigned.length);
  });

  it('Failure Mode 2: flags critical pregnancy contraindications for LI4, SP6, GB21, Cỏ xước, Đan sâm, and Ngải cứu as Quân', () => {
    const pregnantCase = STORY_CASES.find((c) => c.id === 'c3-thai-phu-khi-nghich')!;
    expect(pregnantCase.isPregnant).toBe(true);

    const dangerousSlots: PrescriptionSlots = {
      quan: 'ngai-cuu',
      than: 'co-xuoc',
      ta: 'dan-sam',
      su: 'cam-thao'
    };
    const alerts = checkContraindications(pregnantCase, dangerousSlots, ['hop-coc', 'tam-am-giao', 'kien-tinh']);
    const criticals = alerts.filter((a) => a.severity === 'critical');

    expect(criticals.length).toBe(6);

    const evalResult = evaluateCaseSubmission(
      pregnantCase,
      pregnantCase.targetDiagnosis,
      dangerousSlots,
      ['hop-coc', 'tam-am-giao']
    );
    expect(evalResult.passed).toBe(false);
    expect(evalResult.totalScore).toBeLessThanOrEqual(55);
    expect(evalResult.safetyPenalty).toBeGreaterThan(0);
  });

  it('Failure Mode 3: every one of the 10 story cases is cleanly solvable (score >= 85, zero contraindications)', () => {
    const canonicalSolutions: Record<string, { slots: PrescriptionSlots; acupoints: string[] }> = {
      'c1-phong-han': {
        slots: { quan: 'tia-to', than: 'kinh-gioi', ta: 'sinh-khuong', su: 'cam-thao' },
        acupoints: []
      },
      'c1-phong-nhiet': {
        slots: { quan: 'bac-ha', than: 'kim-ngan-hoa', ta: 'cuc-hoa', su: 'cam-thao' },
        acupoints: []
      },
      'c1-thuong-thuc-han': {
        slots: { quan: 'sinh-khuong', than: 'tia-to', ta: null, su: 'cam-thao' },
        acupoints: []
      },
      'c2-ty-vi-hu-han': {
        slots: { quan: 'hoai-son', than: 'ngai-cuu', ta: 'tran-bi', su: 'cam-thao' },
        acupoints: []
      },
      'c2-can-khi-uat': {
        slots: { quan: 'nhan-tran', than: 'lac-tien', ta: 'cuc-hoa', su: 'cam-thao' },
        acupoints: []
      },
      'c2-tam-ty-luong-hu': {
        slots: { quan: 'hoai-son', than: 'dinh-lang', ta: 'lac-tien', su: 'cam-thao' },
        acupoints: []
      },
      'c2-tam-hoa-vuong': {
        slots: { quan: 'tam-sen', than: 'lac-tien', ta: 'kim-ngan-hoa', su: 'cam-thao' },
        acupoints: []
      },
      'c3-vai-gay-phong-han': {
        slots: { quan: 'que-chi', than: 'tia-to', ta: 'la-lot', su: 'cam-thao' },
        acupoints: ['phong-tri', 'dai-chuy', 'kien-tinh', 'liet-khuyet']
      },
      'c3-thai-phu-khi-nghich': {
        slots: { quan: 'hoai-son', than: 'tia-to', ta: 'lac-tien', su: 'cam-thao' },
        acupoints: ['noi-quan', 'dan-trung', 'an-duong']
      },
      'c3-than-duong-hu-phong-thap': {
        slots: { quan: 'ngai-cuu', than: 'la-lot', ta: 'co-xuoc', su: 'ky-tu' },
        acupoints: ['than-du', 'menh-mon', 'uy-trung', 'khi-hai']
      }
    };

    STORY_CASES.forEach((storyCase) => {
      const sol = canonicalSolutions[storyCase.id];
      expect(sol, `Missing canonical solution for ${storyCase.id}`).toBeDefined();

      // Verify all prescribed items are unlocked by the case's chapter
      Object.values(sol.slots)
        .filter(Boolean)
        .forEach((herbId) => {
          const herb = HERBS.find((h) => h.id === herbId)!;
          expect(herb.chapter).toBeLessThanOrEqual(storyCase.chapter);
        });

      const res = evaluateCaseSubmission(
        storyCase,
        storyCase.targetDiagnosis,
        sol.slots,
        sol.acupoints
      );

      expect(res.alerts.filter((a) => a.severity === 'critical'), `${storyCase.id} alerts`).toHaveLength(0);
      expect(res.totalScore, `${storyCase.id} score (${res.totalScore})`).toBeGreaterThanOrEqual(85);
      expect(res.passed).toBe(true);
    });
  });

  it('procedural case generator creates valid solvable cases per chapter', () => {
    for (let seed = 0; seed < 5; seed++) {
      const pCase = generateProceduralCase(3, seed);
      expect(pCase.isProcedural).toBe(true);
      const preview = computeTreatmentPreview(
        pCase,
        {
          quan: pCase.idealQuanHerb,
          than: pCase.keyHerbs[1] ?? null,
          ta: pCase.keyHerbs[2] ?? null,
          su: 'cam-thao'
        },
        pCase.keyAcupoints
      );
      expect(preview.alerts.filter((a) => a.severity === 'critical')).toHaveLength(0);
    }
  });

  it('Failure Mode 4: corrupt localStorage and malformed JSON save imports never throw', () => {
    const brokenStorage = {
      getItem: () => '{broken json!!!',
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0
    } as unknown as Storage;

    const loaded = loadProgress(brokenStorage);
    expect(loaded.version).toBe(1);
    expect(loaded.rank).toBe('Y Sinh');

    const badImport1 = importSaveJson('not-json');
    expect(badImport1.ok).toBe(false);

    const badImport2 = importSaveJson(JSON.stringify({ version: 999 }));
    expect(badImport2.ok).toBe(false);

    const valid = createDefaultProgress();
    valid.herbNotes['tia-to'] = 'Rất hay khi cảm lạnh';
    const roundTrip = importSaveJson(exportSaveJson(valid));
    expect(roundTrip.ok).toBe(true);
    if (roundTrip.ok) {
      expect(roundTrip.progress.herbNotes['tia-to']).toBe('Rất hay khi cảm lạnh');
    }
  });

  it('Failure Mode 5: audio synthesizer safely no-ops in headless/muted environments', () => {
    apothecaryAudio.setEnabled(false);
    apothecaryAudio.setVolumes(0.7, 0.5);
    apothecaryAudio.setActiveRoom(1);
    apothecaryAudio.setElementMood('moc');
    expect(() => apothecaryAudio.playPulseBeat(0.8)).not.toThrow();
    expect(() => apothecaryAudio.playHerbDrop()).not.toThrow();
    expect(() => apothecaryAudio.playDrawerSlide(true)).not.toThrow();
    expect(() => apothecaryAudio.playRoomSlide()).not.toThrow();
    expect(() => apothecaryAudio.playCurtainBell()).not.toThrow();
    expect(() => apothecaryAudio.playDeQiChime()).not.toThrow();
    expect(() => apothecaryAudio.playBambooFan()).not.toThrow();
    expect(() => apothecaryAudio.playWaterPour()).not.toThrow();
    expect(() => apothecaryAudio.playBambooTally()).not.toThrow();
    expect(() => apothecaryAudio.playMortarGrind()).not.toThrow();
    expect(() => apothecaryAudio.playWokSizzle(true)).not.toThrow();
    expect(() => apothecaryAudio.playPaperFold()).not.toThrow();
    expect(() => apothecaryAudio.playMoxaWarmth()).not.toThrow();
    expect(() => apothecaryAudio.playAuscultation('cold-sniffle')).not.toThrow();
    expect(() => apothecaryAudio.playSealStamp(true)).not.toThrow();
    expect(() => apothecaryAudio.playPageTurn()).not.toThrow();
    expect(() => apothecaryAudio.playNeedleInsert()).not.toThrow();
    expect(() => apothecaryAudio.playCuppingSuction()).not.toThrow();
    expect(() => apothecaryAudio.playHerbSnip()).not.toThrow();
    apothecaryAudio.setEnabled(true);
    expect(() => apothecaryAudio.playPulseBeat(0.8)).not.toThrow();
  });

  it('simulates Five Elements Tương Thừa / Tương Vũ and Tý Ngọ Lưu Chú correctly', () => {
    const woodExcess = simulateFiveElements('moc', 90);
    expect(woodExcess.levels.tho).toBeLessThan(35); // Mộc thừa Thổ
    expect(woodExcess.effects.some((e) => e.relation === 'Tương Thừa (Khắc quá)')).toBe(true);
    expect(woodExcess.effects.some((e) => e.relation === 'Tương Vũ (Phản khắc)')).toBe(true);

    expect(getTyNgoWatch(0).branch).toBe('Giờ Tý');
    expect(getTyNgoWatch(8).branch).toBe('Giờ Thìn');
    expect(getTyNgoWatch(12).organ).toContain('Tâm');
  });

  it('selectExamSession prioritizes missed mastery topics', () => {
    const prog = createDefaultProgress();
    prog.mastery['tongue-ty-hu'] = { seen: 3, correct: 3 };
    prog.mastery['pulse-phu-khan'] = { seen: 3, correct: 0, lastMissedAt: Date.now() };

    const session = selectExamSession(prog, 5);
    expect(session).toHaveLength(5);
    expect(session.some((q) => q.targetKey === 'pulse-phu-khan')).toBe(true);
  });

  it('verifies all 55 silk-and-woodblock visual art assets exist on disk and are non-empty', () => {
    const root = path.resolve(process.cwd(), 'public/art');
    const requiredAssets = [
      'meridians/meridian-front.jpg',
      'meridians/meridian-back.jpg',
      'tools/healer-hand.png',
      'tools/pulse-pillow.jpg',
      'tools/decoction-stove.jpg',
      'tools/paozhi-workbench.jpg',
      'tools/mortar-closeup.jpg',
      'tools/wok-closeup.jpg',
      'tools/red-herb-packet.jpg',
      'tools/moxa-stick.jpg',
      'tools/bamboo-cupping.jpg',
      'tools/porcelain-decoction-bowl.jpg',
      'tools/coconut-ladle.jpg',
      'tools/bronze-shears.jpg',
      'tools/bamboo-basket.jpg',
      'scenes/clinic-hall.jpg',
      'scenes/room-tien-duong.jpg',
      'scenes/room-duoc-cac.jpg',
      'scenes/room-noi-cac.jpg',
      'scenes/room-hau-vien.jpg',
      'scenes/tang-thu-library.jpg',
      'scenes/y-mieu-temple.jpg',
      'scenes/duong-sinh-scroll.jpg',
      'scenes/ancient-meridian-woodblock.jpg',
      ...HERBS.map((h) => `herbs/${h.id}.jpg`),
      ...STORY_CASES.map((c) => `patients/${c.id}.jpg`),
      'patients/clinic-bg.jpg'
    ];

    expect(requiredAssets).toHaveLength(55);

    requiredAssets.forEach((rel) => {
      const fullPath = path.join(root, rel);
      expect(fs.existsSync(fullPath), `Missing asset: ${rel}`).toBe(true);
      const stat = fs.statSync(fullPath);
      expect(stat.size, `Empty or corrupt asset: ${rel}`).toBeGreaterThan(8000);
    });
  });

  it('contains zero OS Unicode pictographic emojis across all src UI files', () => {
    const srcRoot = path.resolve(process.cwd(), 'src');
    const walk = (dir: string): string[] =>
      fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) return walk(full);
        if ((entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) && !entry.name.endsWith('.test.ts')) {
          return [full];
        }
        return [];
      });

    const emojiRegex = /[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/u;
    walk(srcRoot).forEach((file) => {
      const content = fs.readFileSync(file, 'utf8');
      expect(emojiRegex.test(content), `Found system emoji in ${path.relative(srcRoot, file)}`).toBe(false);
    });
  });

  it('segments Pentiment glossary terms cleanly and awards craft bonuses & follow-up letters', () => {
    expect(GLOSSARY_TERMS.length).toBeGreaterThanOrEqual(15);
    const segments = segmentTextWithGlossary('Chứng Biểu Hàn nên dùng Vũ Hỏa và Sao vàng Hoài sơn.');
    expect(segments.some((s) => s.entry?.id === 'bieu-chung')).toBe(true);
    expect(segments.some((s) => s.entry?.id === 'vu-van-hoa')).toBe(true);
    expect(segments.some((s) => s.entry?.id === 'pao-zhi')).toBe(true);

    const case10 = STORY_CASES.find((c) => c.id === 'c3-than-duong-hu-phong-thap')!;
    const crafted = evaluateCaseSubmission(
      case10,
      case10.targetDiagnosis,
      { quan: 'ngai-cuu', than: 'la-lot', ta: 'co-xuoc', su: 'ky-tu' },
      ['than-du', 'khi-hai'],
      {
        fire: 'van-hoa',
        dosing: 'am-duong-tang',
        paoZhi: { ta: 'sao-vang', su: 'chich-mat' },
        moxaEnabled: true,
        cuppingEnabled: true,
        fanMatched: true,
        usedFreshHerbs: ['ngai-cuu', 'la-lot'],
        hasBatTrangPot: true
      }
    );
    expect(crafted.craftBonusScore).toBeGreaterThanOrEqual(8);
    expect(crafted.followUpLetter).toBeTruthy();
    expect(crafted.passed).toBe(true);
  });

  it('detects classical Dược Đối / Cổ Phương synergies and evaluates decoction fire/dosing', () => {
    const matched = detectActiveFormulas({
      quan: 'tia-to',
      than: 'kinh-gioi',
      ta: 'sinh-khuong',
      su: 'cam-thao'
    });
    expect(matched.some((f) => f.id === 'tan-on-giai-bieu')).toBe(true);
    expect(matched.some((f) => f.id === 'khuong-to-hoa-vi')).toBe(true);

    const case1 = STORY_CASES[0];
    const goodDecoction = evaluateCaseSubmission(
      case1,
      case1.targetDiagnosis,
      { quan: 'tia-to', than: 'kinh-gioi', ta: 'sinh-khuong', su: 'cam-thao' },
      [],
      { fire: 'vu-hoa', dosing: 'nong-dap-chan' }
    );
    const badDecoction = evaluateCaseSubmission(
      case1,
      case1.targetDiagnosis,
      { quan: 'tia-to', than: 'kinh-gioi', ta: 'sinh-khuong', su: 'cam-thao' },
      [],
      { fire: 'van-hoa', dosing: 'am-duong-tang' }
    );

    expect(goodDecoction.decoctionScore).toBeGreaterThan(badDecoction.decoctionScore);
    expect(goodDecoction.matchedFormulas.length).toBeGreaterThan(0);
  });

  it('evaluates 9-constitution self-assessment accurately', () => {
    const coldYangDeficient = evaluateConstitution({
      'cq-temp': 'b',
      'cq-energy': 'b',
      'cq-digestion': 'b',
      'cq-tongue': 'b',
      'cq-season': 'c',
      'cq-skin': 'b'
    });
    expect(['duong-hu', 'khi-hu']).toContain(coldYangDeficient.primary.id);
    expect(coldYangDeficient.primary.recommendedHerbIds.length).toBeGreaterThan(0);
  });

  it('evaluates pre-seal tasting notes, Song An challenges, and seasonal solar terms', () => {
    const emptyTaste = describeDecoctionTaste(STORY_CASES[0], emptySlots(), 'van-vu');
    expect(emptyTaste.matchTone).toBe('empty');

    const balancedTaste = describeDecoctionTaste(
      STORY_CASES[0],
      { quan: 'tia-to', than: 'kinh-gioi', ta: 'sinh-khuong', su: 'cam-thao' },
      'vu-hoa'
    );
    expect(balancedTaste.matchTone).toBe('balanced');
    expect(balancedTaste.flavorNote.length).toBeGreaterThan(10);

    expect(SONG_AN_PAIRS).toHaveLength(3);
    SONG_AN_PAIRS.forEach((pair) => {
      expect(STORY_CASES.some((c) => c.id === pair.caseAId)).toBe(true);
      expect(STORY_CASES.some((c) => c.id === pair.caseBId)).toBe(true);
    });

    expect(getSeasonalSolarTerm(1).name).toBe('Xuân Vũ');
    expect(getSeasonalSolarTerm(4).name).toBe('Hạ Thử');
    expect(getSeasonalSolarTerm(7).name).toBe('Thu Táo');
    expect(getSeasonalSolarTerm(10).name).toBe('Đông Hàn');
  });

  it('transforms real-time eight-principles preview & potency when herbs undergo Pao Zhi (crushing, roasting, honey-frying)', () => {
    const tyHuCase = STORY_CASES.find((c) => c.id === 'c2-ty-vi-hu-han')!;
    const testSlots: PrescriptionSlots = { quan: 'hoai-son', than: 'sinh-khuong', ta: null, su: 'cam-thao' };

    const rawPreview = computeTreatmentPreview(tyHuCase, testSlots, []);
    const craftedPreview = computeTreatmentPreview(tyHuCase, testSlots, [], {
      quan: 'sao-vang',
      than: 'gia-dap',
      su: 'chich-mat'
    });

    const roastHoaiSon = getPaoZhiTransformation(HERBS.find((h) => h.id === 'hoai-son')!, 'sao-vang');
    const honeyCamThao = getPaoZhiTransformation(HERBS.find((h) => h.id === 'cam-thao')!, 'chich-mat');
    const roastBacHa = getPaoZhiTransformation(HERBS.find((h) => h.id === 'bac-ha')!, 'sao-vang');

    expect(roastHoaiSon.statusTone).toBe('ideal');
    expect(honeyCamThao.deficiencyDelta).toBeGreaterThan(0);
    expect(roastBacHa.statusTone).toBe('mismatch');
    expect(craftedPreview.resultingVector.coldHeat).toBeGreaterThan(rawPreview.resultingVector.coldHeat);
    expect(craftedPreview.resultingVector.deficiencyExcess).toBeGreaterThan(
      rawPreview.resultingVector.deficiencyExcess
    );
  });
});
