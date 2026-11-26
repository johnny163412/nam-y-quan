import React, { useMemo, useState } from 'react';
import { TY_NGO_WATCHES } from '../data/acupoints';
import { HERBS } from '../data/herbs';
import {
  ELEMENT_CYCLE_ORDER,
  ELEMENT_LABELS,
  ELEMENT_SHORT,
  simulateFiveElements
} from '../engine/tcmEngine';
import { ElementKey } from '../types/tcm';
import { MeridianBodyMap } from './MeridianBodyMap';
import { BotanicalSvg } from './svg/BotanicalSvg';

interface TangThuCacProps {
  herbNotes: Record<string, string>;
  onSaveHerbNote: (herbId: string, note: string) => void;
  initialHerbId?: string | null;
}

type CodexBook = 'herbs' | 'meridians' | 'elements';

const ELEMENT_COLORS: Record<ElementKey, string> = {
  moc: '#23574C',
  hoa: '#A62620',
  tho: '#9C6B24',
  kim: '#6C665E',
  thuy: '#274B6D'
};

export const TangThuCac: React.FC<TangThuCacProps> = ({
  herbNotes,
  onSaveHerbNote,
  initialHerbId
}) => {
  const [book, setBook] = useState<CodexBook>('herbs');
  const [search, setSearch] = useState('');
  const [natureFilter, setNatureFilter] = useState<string>('all');
  const [selectedHerbId, setSelectedHerbId] = useState<string>(initialHerbId ?? HERBS[0].id);

  // Meridian & Ty Ngo Luu Chu state
  const [previewPts, setPreviewPts] = useState<string[]>(['hop-coc', 'tuc-tam-ly']);
  const [selectedHour, setSelectedHour] = useState<number>(new Date().getHours());

  // Five Elements Sandbox state
  const [activeEl, setActiveEl] = useState<ElementKey>('moc');
  const [elLevel, setElLevel] = useState<number>(80);

  const filteredHerbs = useMemo(() => {
    return HERBS.filter((h) => {
      const q = search.trim().toLowerCase();
      const matchesText =
        !q ||
        h.name.toLowerCase().includes(q) ||
        h.traditionalName.toLowerCase().includes(q) ||
        h.summary.toLowerCase().includes(q);
      const matchesNature =
        natureFilter === 'all' ||
        (natureFilter === 'hot' && (h.nature === 'Ôn' || h.nature === 'Nhiệt')) ||
        (natureFilter === 'cold' && (h.nature === 'Hàn' || h.nature === 'Đại hàn' || h.nature === 'Lương')) ||
        (natureFilter === 'neutral' && h.nature === 'Bình');
      return matchesText && matchesNature;
    });
  }, [search, natureFilter]);

  const activeHerb = HERBS.find((h) => h.id === selectedHerbId) ?? HERBS[0];
  const simResult = useMemo(() => simulateFiveElements(activeEl, elLevel), [activeEl, elLevel]);

  const activeWatch =
    TY_NGO_WATCHES.find((w) =>
      w.startHour === 23
        ? selectedHour >= 23 || selectedHour < 1
        : selectedHour >= w.startHour && selectedHour < w.endHour
    ) ?? TY_NGO_WATCHES[0];

  const pentagonCoords: Record<ElementKey, { x: number; y: number }> = {
    hoa: { x: 160, y: 42 },
    tho: { x: 268, y: 122 },
    kim: { x: 226, y: 242 },
    thuy: { x: 94, y: 242 },
    moc: { x: 52, y: 122 }
  };

  return (
    <div className="woodblock-sheet">
      <div className="section-heading" style={{ flexWrap: 'wrap' }}>
        <span>Tàng Thư Các — Kho Tri Thức &amp; Sa Bàn Tương Tác</span>
        <div className="toggle-pair" style={{ maxWidth: '560px' }}>
          <button
            type="button"
            className={`toggle-pill ${book === 'herbs' ? 'active' : ''}`}
            onClick={() => setBook('herbs')}
          >
            1. Bản Thảo Nam Dược (20 vị)
          </button>
          <button
            type="button"
            className={`toggle-pill ${book === 'meridians' ? 'active' : ''}`}
            onClick={() => setBook('meridians')}
          >
            2. Kinh Lạc &amp; Tý Ngọ Lưu Chú
          </button>
          <button
            type="button"
            className={`toggle-pill ${book === 'elements' ? 'active' : ''}`}
            onClick={() => setBook('elements')}
          >
            3. Sa Bàn Ngũ Hành
          </button>
        </div>
      </div>

      {/* BOOK 1: BẢN THẢO NAM DƯỢC */}
      {book === 'herbs' && (
        <div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm tên cây thuốc, vị thuốc hoặc công năng..."
              style={{
                flex: 1,
                minWidth: '220px',
                padding: '7px 10px',
                background: 'var(--paper-highlight)',
                border: '1.5px solid var(--border-ink)',
                borderRadius: '2px'
              }}
            />
            <select
              aria-label="Lọc theo tính vị"
              className="case-select"
              value={natureFilter}
              onChange={(e) => setNatureFilter(e.target.value)}
            >
              <option value="all">Tất cả Tứ khí</option>
              <option value="hot">Tính Ôn / Nhiệt (Làm ấm)</option>
              <option value="cold">Tính Lương / Hàn (Thanh mát)</option>
              <option value="neutral">Tính Bình (Điều hòa)</option>
            </select>
          </div>

          <div className="desk-grid">
            <div className="codex-grid" style={{ maxHeight: '540px', overflowY: 'auto', paddingRight: '4px' }}>
              {filteredHerbs.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  className={`herb-card ${activeHerb.id === h.id ? 'selected' : ''}`}
                  onClick={() => setSelectedHerbId(h.id)}
                >
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <BotanicalSvg motif={h.motif} size={34} />
                    <div>
                      <div style={{ fontWeight: 700, fontFamily: 'var(--font-serif)' }}>{h.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
                        {h.traditionalName} — Chương {h.chapter}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.8rem' }}>
                    <strong>Tính vị:</strong> {h.nature}, {h.flavors.join(', ')}
                  </div>
                </button>
              ))}
            </div>

            <div
              style={{
                background: 'var(--paper-highlight)',
                border: '1.5px solid var(--border-ink)',
                padding: '14px',
                borderRadius: '2px'
              }}
            >
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '10px' }}>
                <BotanicalSvg motif={activeHerb.motif} size={52} />
                <div>
                  <h3 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: '1.2rem' }}>
                    {activeHerb.name} ({activeHerb.traditionalName})
                  </h3>
                  <div className="muted-note">Bộ phận dùng: {activeHerb.partUsed}</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                <span className="tag-badge">Tứ khí: {activeHerb.nature}</span>
                <span className="tag-badge">Ngũ vị: {activeHerb.flavors.join(', ')}</span>
                <span className="tag-badge">Quy kinh: {activeHerb.meridians.join(', ')}</span>
              </div>

              <p style={{ margin: '0 0 8px' }}>
                <strong>Công năng chủ trị:</strong> {activeHerb.summary}
              </p>

              <div
                style={{
                  padding: '8px 10px',
                  background: 'var(--herbal-jade-soft)',
                  border: '1px solid rgba(35,87,76,0.4)',
                  borderRadius: '2px',
                  marginBottom: '8px',
                  fontSize: '0.88rem'
                }}
              >
                <strong style={{ color: 'var(--herbal-jade)' }}>Ứng dụng tại nhà:</strong> {activeHerb.homeTip}
              </div>

              <div className="alert-banner caution" style={{ marginTop: 0 }}>
                <strong>Lưu ý &amp; Kiêng kỵ:</strong> {activeHerb.contraindications.warningText}
              </div>

              <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginTop: '10px', marginBottom: '4px' }}>
                Ghi chú tâm đắc cá nhân về vị thuốc này:
              </label>
              <textarea
                rows={3}
                value={herbNotes[activeHerb.id] ?? ''}
                onChange={(e) => onSaveHerbNote(activeHerb.id, e.target.value)}
                placeholder="Ghi lại kinh nghiệm, cặp thuốc phối ngũ tâm đắc..."
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'var(--paper-do)',
                  border: '1px solid var(--border-ink)',
                  borderRadius: '2px'
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* BOOK 2: KINH LẠC & TÝ NGỌ LƯU CHÚ */}
      {book === 'meridians' && (
        <div className="desk-grid">
          <div>
            <h3 style={{ margin: '0 0 8px', fontFamily: 'var(--font-serif)' }}>
              Đồ Hình 14 Huyệt Đạo Thiết Yếu
            </h3>
            <MeridianBodyMap
              selectedIds={previewPts}
              onToggleAcupoint={(id) =>
                setPreviewPts((prev) =>
                  prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                )
              }
            />
          </div>

          <div
            style={{
              background: 'var(--paper-highlight)',
              border: '1.5px solid var(--border-ink)',
              padding: '14px',
              borderRadius: '2px'
            }}
          >
            <h3 style={{ margin: '0 0 8px', fontFamily: 'var(--font-serif)' }}>
              Đồng Hồ Sinh Học Tý Ngọ Lưu Chú (12 Canh Giờ)
            </h3>
            <p className="muted-note" style={{ marginTop: 0 }}>
              Kéo thanh thời gian để xem kinh mạch nào đang vượng khí nhất trong ngày và lời khuyên dưỡng sinh tương ứng.
            </p>

            <label style={{ display: 'block', fontWeight: 700, marginBottom: '6px' }}>
              Chọn giờ trong ngày: {String(selectedHour).padStart(2, '0')}:00 ({activeWatch.branch})
            </label>
            <input
              type="range"
              min={0}
              max={23}
              value={selectedHour}
              onChange={(e) => setSelectedHour(Number(e.target.value))}
              style={{ width: '100%', marginBottom: '12px' }}
            />

            <div
              style={{
                padding: '12px',
                background: 'var(--paper-aged)',
                border: '1px solid var(--border-ink)',
                borderRadius: '2px',
                marginBottom: '12px'
              }}
            >
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.08rem', fontWeight: 700 }}>
                {activeWatch.branch} ({activeWatch.timeRange}) — Kinh {activeWatch.meridian}
              </div>
              <div style={{ margin: '4px 0', fontWeight: 600, color: 'var(--herbal-jade)' }}>
                Tạng Phủ đương vượng: {activeWatch.organ} (Hành {ELEMENT_SHORT[activeWatch.element]})
              </div>
              <p style={{ margin: '6px 0 0', fontSize: '0.9rem' }}>{activeWatch.advice}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              {TY_NGO_WATCHES.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  className={`toggle-pill ${activeWatch.id === w.id ? 'active' : ''}`}
                  style={{ fontSize: '0.76rem', padding: '5px 6px' }}
                  onClick={() => setSelectedHour(w.startHour)}
                >
                  {w.branch}: {w.organ.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* BOOK 3: SA BÀN NGŨ HÀNH */}
      {book === 'elements' && (
        <div className="sandbox-layout">
          <div
            style={{
              background: 'var(--paper-highlight)',
              border: '1.5px solid var(--border-ink)',
              padding: '14px',
              borderRadius: '2px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <h3 style={{ margin: '0 0 6px', fontFamily: 'var(--font-serif)', alignSelf: 'flex-start' }}>
              Sa Bàn Âm Dương — Ngũ Hành Sinh Khắc
            </h3>
            <p className="muted-note" style={{ marginTop: 0, alignSelf: 'flex-start' }}>
              Chọn một hành để tăng vượng hoặc làm suy, quan sát phản ứng dây chuyền Tương Sinh, Tương Khắc, Tương Thừa và Tương Vũ trên toàn bộ hệ thống Tạng Phủ.
            </p>

            <svg width="320" height="290" viewBox="0 0 320 290" role="img" aria-label="Sơ đồ Ngũ Hành tương tác">
              <defs>
                <marker id="arrow-sinh" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#23574C" />
                </marker>
                <marker id="arrow-khac" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#A62620" />
                </marker>
              </defs>

              {/* Tương Sinh outer curved brush ring */}
              <g filter="url(#ink-brush-soft)" strokeLinecap="round">
                {ELEMENT_CYCLE_ORDER.map((el, i) => {
                  const next = ELEMENT_CYCLE_ORDER[(i + 1) % 5];
                  const p1 = pentagonCoords[el];
                  const p2 = pentagonCoords[next];
                  const mx = (p1.x + p2.x) / 2 + ((p1.x + p2.x) / 2 - 160) * 0.22;
                  const my = (p1.y + p2.y) / 2 + ((p1.y + p2.y) / 2 - 155) * 0.22;
                  return (
                    <path
                      key={`sinh-${el}`}
                      d={`M ${p1.x} ${p1.y} Q ${mx} ${my} ${p2.x} ${p2.y}`}
                      fill="none"
                      stroke="#23574C"
                      strokeWidth="2.1"
                      opacity="0.6"
                      markerEnd="url(#arrow-sinh)"
                    />
                  );
                })}

                {/* Tương Khắc inner brush star */}
                {ELEMENT_CYCLE_ORDER.map((el, i) => {
                  const target = ELEMENT_CYCLE_ORDER[(i + 2) % 5];
                  const p1 = pentagonCoords[el];
                  const p2 = pentagonCoords[target];
                  const mx = (p1.x + p2.x) / 2 + 8;
                  const my = (p1.y + p2.y) / 2 - 6;
                  return (
                    <path
                      key={`khac-${el}`}
                      d={`M ${p1.x} ${p1.y} Q ${mx} ${my} ${p2.x} ${p2.y}`}
                      fill="none"
                      stroke="#A62620"
                      strokeWidth="1.5"
                      strokeDasharray="5 4"
                      opacity="0.65"
                      markerEnd="url(#arrow-khac)"
                    />
                  );
                })}
              </g>

              {/* Element Nodes */}
              {ELEMENT_CYCLE_ORDER.map((el) => {
                const pt = pentagonCoords[el];
                const lv = simResult.levels[el];
                const radius = 20 + (lv / 100) * 14;
                const isSelected = activeEl === el;
                return (
                  <g
                    key={el}
                    onClick={() => setActiveEl(el)}
                    style={{ cursor: 'pointer' }}
                  >
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={radius}
                      fill={ELEMENT_COLORS[el]}
                      fillOpacity={0.9}
                      stroke={isSelected ? '#FFF8ED' : '#221B15'}
                      strokeWidth={isSelected ? 3 : 1.5}
                    />
                    <text x={pt.x} y={pt.y - 2} textAnchor="middle" fill="#FFF8ED" fontWeight="700" fontSize="13">
                      {ELEMENT_SHORT[el]}
                    </text>
                    <text x={pt.x} y={pt.y + 13} textAnchor="middle" fill="#FFF8ED" fontSize="10.5">
                      {lv}%
                    </text>
                  </g>
                );
              })}
            </svg>

            <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
              Đường liền xanh: Tương Sinh (Mẹ nuôi Con) | Đường đứt đỏ: Tương Khắc (Chế ước)
            </div>
          </div>

          <div
            style={{
              background: 'var(--paper-highlight)',
              border: '1.5px solid var(--border-ink)',
              padding: '14px',
              borderRadius: '2px'
            }}
          >
            <strong style={{ display: 'block', marginBottom: '8px', fontFamily: 'var(--font-serif)', fontSize: '1.05rem' }}>
              Điều chỉnh trạng thái hành {ELEMENT_LABELS[activeEl]}
            </strong>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
              {ELEMENT_CYCLE_ORDER.map((el) => (
                <button
                  key={el}
                  type="button"
                  className={`toggle-pill ${activeEl === el ? 'active' : ''}`}
                  style={{ flex: 'none', padding: '5px 10px' }}
                  onClick={() => setActiveEl(el)}
                >
                  {ELEMENT_SHORT[el]}
                </button>
              ))}
            </div>

            <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>
              Mức khí huyết hiện tại: <strong>{elLevel}%</strong>{' '}
              ({elLevel >= 70 ? 'Thái quá / Thực vượng' : elLevel <= 30 ? 'Bất cập / Hư suy' : 'Quân bình'})
            </label>
            <input
              type="range"
              min={15}
              max={100}
              value={elLevel}
              onChange={(e) => setElLevel(Number(e.target.value))}
              style={{ width: '100%', marginBottom: '10px' }}
            />

            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <button type="button" className="btn-secondary" onClick={() => setElLevel(88)}>
                Thử tình huống Quá vượng (88%)
              </button>
              <button type="button" className="btn-secondary" onClick={() => setElLevel(20)}>
                Thử tình huống Suy nhược (20%)
              </button>
              <button type="button" className="btn-secondary" onClick={() => setElLevel(50)}>
                Đưa về Quân bình (50%)
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {simResult.effects.map((ef, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '9px 10px',
                    background: 'var(--paper-do)',
                    borderLeft: `4px solid ${
                      ef.relation.includes('Thừa') || ef.relation.includes('Vũ')
                        ? 'var(--cinnabar)'
                        : 'var(--herbal-jade)'
                    }`,
                    borderRadius: '2px',
                    fontSize: '0.88rem'
                  }}
                >
                  <strong>{ef.relation}:</strong> {ef.description}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
