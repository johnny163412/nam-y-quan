import { useCallback, useMemo, useRef, useState } from 'react';
import { detectActiveFormulas } from '../../data/formulas';
import { HERB_MAP, HERBS } from '../../data/herbs';
import { apothecaryAudio } from '../../engine/audio';
import { assignHerbToSlot, emptySlots } from '../../engine/tcmEngine';
import { ClassicalFormula, Herb, PaoZhiMethod, PrescriptionSlots, RoleSlot, SlotPaoZhi } from '../../types/tcm';
import { ScoopAnimationState } from '../svg/HealerHandOverlay';

type PushCallout = (text: string, tone?: 'gold' | 'jade' | 'cinnabar') => void;

/** Dược Các: the herb cabinet, the Quân-Thần-Tá-Sứ slots, Bào Chế and wrapping the packet. */
export function usePrescription(freshHerbIds: string[], pushCallout: PushCallout, goToDecoctionRoom: () => void) {
  const [slots, setSlots] = useState<PrescriptionSlots>(emptySlots());
  const [slotPaoZhi, setSlotPaoZhi] = useState<SlotPaoZhi>({});
  const [animatingPanRole, setAnimatingPanRole] = useState<RoleSlot | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<RoleSlot>('quan');
  const [chestFilter, setChestFilter] = useState<'all' | 'warm' | 'cool' | 'neutral' | 'fresh'>('all');
  const [openDrawerId, setOpenDrawerId] = useState<string | null>(null);
  const [draggingHerbId, setDraggingHerbId] = useState<string | null>(null);
  const [hoveredHerb, setHoveredHerb] = useState<{ herb: Herb; left: number; top: number } | null>(null);
  const [showFoldOverlay, setShowFoldOverlay] = useState(false);
  const [packetWrapped, setPacketWrapped] = useState(false);
  const [scoopAnim, setScoopAnim] = useState<ScoopAnimationState | null>(null);
  const [justScoopedRole, setJustScoopedRole] = useState<RoleSlot | null>(null);

  const deskRoom2Ref = useRef<HTMLDivElement | null>(null);
  const chestWrapRef = useRef<HTMLDivElement | null>(null);
  const panRefs = useRef<Record<RoleSlot, HTMLDivElement | null>>({ quan: null, than: null, ta: null, su: null });
  const herbRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scoopCounterRef = useRef(0);

  const resetPrescription = () => {
    setSlots(emptySlots());
    setSlotPaoZhi({});
    setSelectedSlot('quan');
    setOpenDrawerId(null);
    setHoveredHerb(null);
    setPacketWrapped(false);
    setShowFoldOverlay(false);
  };

  const availableHerbs = useMemo(() => {
    if (chestFilter === 'warm') return HERBS.filter((h) => h.nature === 'Ôn' || h.nature === 'Nhiệt');
    if (chestFilter === 'cool') return HERBS.filter((h) => h.nature === 'Hàn' || h.nature === 'Lương' || h.nature === 'Đại hàn');
    if (chestFilter === 'neutral') return HERBS.filter((h) => h.nature === 'Bình');
    if (chestFilter === 'fresh') return HERBS.filter((h) => freshHerbIds.includes(h.id));
    return HERBS;
  }, [chestFilter, freshHerbIds]);

  const activeFormulas = useMemo(() => detectActiveFormulas(slots), [slots]);
  const hasAssignedHerbs = Object.values(slots).some(Boolean);

  const triggerScoopAnimation = useCallback((herb: Herb, role: RoleSlot) => {
    const container = deskRoom2Ref.current;
    const panEl = panRefs.current[role];
    const herbEl = herbRefs.current[herb.id];
    if (!container || !panEl) return;

    const cRect = container.getBoundingClientRect();
    const pRect = panEl.getBoundingClientRect();
    const hRect = herbEl?.getBoundingClientRect();

    const fromX = hRect ? hRect.left - cRect.left + hRect.width * 0.42 : cRect.width * 0.5;
    const fromY = hRect ? hRect.top - cRect.top + hRect.height * 0.35 : cRect.height * 0.72;
    const toX = pRect.left - cRect.left + pRect.width * 0.45;
    const toY = pRect.top - cRect.top + pRect.height * 0.42;

    scoopCounterRef.current += 1;
    const animId = scoopCounterRef.current;
    setScoopAnim({ id: animId, herb, fromX, fromY, toX, toY });

    window.setTimeout(() => {
      setJustScoopedRole(role);
      window.setTimeout(() => {
        setJustScoopedRole((cur) => (cur === role ? null : cur));
      }, 560);
    }, 700);
  }, []);

  const handleAssignHerb = (role: RoleSlot, herbId: string | null) => {
    const after = assignHerbToSlot(slots, role, herbId);
    setSlots(after);
    setPacketWrapped(false);
    setSlotPaoZhi((prev) => ({
      ...prev,
      [role]: herbId ? prev[role] ?? 'sinh-dung' : undefined
    }));
    if (herbId) {
      apothecaryAudio.playHerbDrop(HERB_MAP[herbId]?.motif);
      const herbObj = HERB_MAP[herbId];
      if (herbObj) triggerScoopAnimation(herbObj, role);
      const nextOrder: RoleSlot[] = ['quan', 'than', 'ta', 'su'];
      const nextEmpty = nextOrder.find((r) => r !== role && !after[r]);
      if (nextEmpty) setSelectedSlot(nextEmpty);
    }
  };

  const handleApplyFormula = (formula: ClassicalFormula) => {
    const picked = [
      ...formula.requiredHerbs,
      ...(formula.optionalAnyHerbs?.slice(0, Math.max(0, 3 - formula.requiredHerbs.length)) ?? [])
    ].slice(0, 3);
    const roles: RoleSlot[] = ['quan', 'than', 'ta'];
    const nextSlots: PrescriptionSlots = emptySlots();
    picked.forEach((herbId, idx) => {
      if (roles[idx] && HERB_MAP[herbId]) {
        nextSlots[roles[idx]] = herbId;
      }
    });
    if (!nextSlots.su) nextSlots.su = 'cam-thao';
    setSlots(nextSlots);
    setPacketWrapped(false);
    setSlotPaoZhi({});
    setSelectedSlot('ta');
    apothecaryAudio.playHerbDrop();
    pushCallout(`Cộng Hưởng Cổ Phương: ${formula.name}`, 'gold');
    if (nextSlots.quan && HERB_MAP[nextSlots.quan]) {
      triggerScoopAnimation(HERB_MAP[nextSlots.quan]!, 'quan');
    }
  };

  const handleSelectPaoZhi = (role: RoleSlot, method: PaoZhiMethod) => {
    setSlotPaoZhi((prev) => ({ ...prev, [role]: method }));
    setAnimatingPanRole(role);
    window.setTimeout(() => {
      setAnimatingPanRole((cur) => (cur === role ? null : cur));
    }, 640);

    if (method === 'gia-dap') {
      apothecaryAudio.playMortarGrind();
      pushCallout('Giã Dập Tinh Dầu · Tăng Dược Lực!', 'jade');
    } else if (method === 'sao-vang') {
      apothecaryAudio.playWokSizzle(false);
      pushCallout('Sao Vàng Hạ Thổ · Ôn Trung!', 'gold');
    } else if (method === 'chich-mat') {
      apothecaryAudio.playWokSizzle(true);
      pushCallout('Chích Mật Nhuận Phế · Hòa Vị!', 'gold');
    } else {
      apothecaryAudio.playPageTurn();
    }
  };

  const handleToggleDrawer = (herb: Herb) => {
    setOpenDrawerId((cur) => {
      const opening = cur !== herb.id;
      apothecaryAudio.playDrawerSlide(opening);
      return opening ? herb.id : null;
    });
  };

  const handleScoopFromDrawer = (herb: Herb) => {
    handleAssignHerb(selectedSlot, herb.id);
    window.setTimeout(() => {
      setOpenDrawerId((cur) => {
        if (cur === herb.id) {
          apothecaryAudio.playDrawerSlide(false);
          return null;
        }
        return cur;
      });
    }, 460);
  };

  const handleDrawerHover = (herb: Herb, el: HTMLElement | null) => {
    const wrap = chestWrapRef.current;
    if (!wrap || !el) return;
    const tooltipW = 288;
    const wrapW = wrap.clientWidth || 520;
    const rawLeft = el.offsetLeft + el.offsetWidth / 2 - tooltipW / 2;
    const clampedLeft = Math.max(6, Math.min(Math.max(6, wrapW - tooltipW - 6), rawLeft));
    setHoveredHerb({ herb, left: clampedLeft, top: el.offsetTop - 8 });
  };

  const assignedHerbObjects = useMemo(
    () =>
      (['quan', 'than', 'ta', 'su'] as RoleSlot[])
        .map((r) => (slots[r] ? HERB_MAP[slots[r]!] : null))
        .filter((h): h is Herb => Boolean(h)),
    [slots]
  );

  const handleWrapHerbPacketAndGoRoom3 = () => {
    apothecaryAudio.playPaperFold();
    setPacketWrapped(true);
    if (assignedHerbObjects.length > 0) {
      setShowFoldOverlay(true);
      window.setTimeout(() => {
        setShowFoldOverlay(false);
        goToDecoctionRoom();
      }, 920);
    } else {
      goToDecoctionRoom();
    }
  };

  const natureClass = (nature: Herb['nature']) => {
    if (nature === 'Ôn' || nature === 'Nhiệt') return 'nature-hot';
    if (nature === 'Hàn' || nature === 'Đại hàn' || nature === 'Lương') return 'nature-cold';
    return 'nature-neutral';
  };

  const assignedHerbsSummary = assignedHerbObjects.map((h) => h.name);

  return {
    slots,
    setSlots,
    slotPaoZhi,
    setSlotPaoZhi,
    animatingPanRole,
    setAnimatingPanRole,
    selectedSlot,
    setSelectedSlot,
    chestFilter,
    setChestFilter,
    openDrawerId,
    setOpenDrawerId,
    draggingHerbId,
    setDraggingHerbId,
    hoveredHerb,
    setHoveredHerb,
    showFoldOverlay,
    setShowFoldOverlay,
    packetWrapped,
    setPacketWrapped,
    scoopAnim,
    setScoopAnim,
    justScoopedRole,
    setJustScoopedRole,
    deskRoom2Ref,
    chestWrapRef,
    panRefs,
    herbRefs,
    scoopCounterRef,
    resetPrescription,
    availableHerbs,
    activeFormulas,
    hasAssignedHerbs,
    triggerScoopAnimation,
    handleAssignHerb,
    handleApplyFormula,
    handleSelectPaoZhi,
    handleToggleDrawer,
    handleScoopFromDrawer,
    handleDrawerHover,
    assignedHerbObjects,
    handleWrapHerbPacketAndGoRoom3,
    natureClass,
    assignedHerbsSummary
  };
}
