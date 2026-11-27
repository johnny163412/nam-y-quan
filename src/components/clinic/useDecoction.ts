import { useMemo, useState } from 'react';
import { apothecaryAudio } from '../../engine/audio';
import { describeDecoctionTaste } from '../../engine/tcmEngine';
import { DosingAdvice, FireType, PatientCase, PrescriptionSlots, SlotPaoZhi } from '../../types/tcm';
import { FIRE_TARGET_RANGES } from './clinicConstants';

type PushCallout = (text: string, tone?: 'gold' | 'jade' | 'cinnabar') => void;

/** Nội Các & Lò: acupoints, moxa, cupping, fire and fan (hỏa hầu), and the dosing advice. */
export function useDecoction(selectedCase: PatientCase, slots: PrescriptionSlots, slotPaoZhi: SlotPaoZhi, pushCallout: PushCallout) {
  const [selectedAcupoints, setSelectedAcupoints] = useState<string[]>([]);
  const [moxaEnabled, setMoxaEnabled] = useState(false);
  const [cuppingEnabled, setCuppingEnabled] = useState(false);
  const [fire, setFire] = useState<FireType>('van-vu');
  const [fanHeat, setFanHeat] = useState<number>(56);
  const [fanBlowing, setFanBlowing] = useState(false);
  const [dosing, setDosing] = useState<DosingAdvice>('am-duong-tang');

  const resetDecoction = () => {
    setSelectedAcupoints([]);
    setMoxaEnabled(false);
    setCuppingEnabled(false);
    setFire('van-vu');
    setFanHeat(56);
    setDosing('am-duong-tang');
  };

  const tasteReading = useMemo(
    () => describeDecoctionTaste(selectedCase, slots, fire, selectedAcupoints, slotPaoZhi),
    [selectedCase, slots, fire, selectedAcupoints, slotPaoZhi]
  );

  const activeFireRange = FIRE_TARGET_RANGES[fire];
  const isFanMatched = fanHeat >= activeFireRange[0] && fanHeat <= activeFireRange[1];

  const handleToggleAcupoint = (ptId: string) => {
    setSelectedAcupoints((prev) => {
      const removing = prev.includes(ptId);
      if (!removing) pushCallout('Kim Châm Đắc Khí!', 'cinnabar');
      return removing ? prev.filter((id) => id !== ptId) : [...prev, ptId];
    });
    apothecaryAudio.playNeedleInsert();
  };

  const handleFanStroke = (up: boolean) => {
    apothecaryAudio.playBambooFan();
    navigator.vibrate?.(8);
    setFanBlowing(true);
    setFanHeat((prev) => {
      const next = Math.max(10, Math.min(100, prev + (up ? 14 : -14)));
      const [lo, hi] = FIRE_TARGET_RANGES[fire];
      if (next >= lo && next <= hi && (prev < lo || prev > hi)) {
        pushCallout('Hỏa Hầu Chuẩn! (+2đ)', 'gold');
      }
      return next;
    });
    window.setTimeout(() => setFanBlowing(false), 360);
  };

  return {
    selectedAcupoints,
    setSelectedAcupoints,
    moxaEnabled,
    setMoxaEnabled,
    cuppingEnabled,
    setCuppingEnabled,
    fire,
    setFire,
    fanHeat,
    setFanHeat,
    fanBlowing,
    setFanBlowing,
    dosing,
    setDosing,
    resetDecoction,
    tasteReading,
    activeFireRange,
    isFanMatched,
    handleToggleAcupoint,
    handleFanStroke
  };
}
