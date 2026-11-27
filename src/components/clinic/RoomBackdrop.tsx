import React from 'react';
import { WeatherCanvas, WeatherKind } from './WeatherCanvas';

type RoomKey = 'tien-duong' | 'duoc-cac' | 'noi-cac' | 'hau-vien';
type LightKind = 'lamp' | 'lantern' | 'ember' | 'sun';

/** A light painted into the scene. x/y/r are percentages of the 1280x720 painting. */
interface SceneLight {
  kind: LightKind;
  x: number;
  y: number;
  r: number;
  layer: 'base' | 'near';
}

/** Steam rising off something painted on the near layer (tea, the decoction kettle). x/y in % of the painting. */
interface SmokeSource {
  x: number;
  y: number;
  size: 's' | 'l';
}

const ROOMS: Record<RoomKey, { deep?: boolean; lights: SceneLight[]; smoke?: SmokeSource[] }> = {
  'tien-duong': {
    deep: true,
    lights: [{ kind: 'lamp', x: 17.8, y: 53.5, r: 30, layer: 'near' }],
    smoke: [
      { x: 84.8, y: 70, size: 's' }, // tea cup
      { x: 96.4, y: 70.5, size: 's' } // teapot spout
    ]
  },
  'duoc-cac': {
    lights: [
      { kind: 'lantern', x: 25.8, y: 18.1, r: 26, layer: 'base' },
      { kind: 'lantern', x: 77.7, y: 17.4, r: 26, layer: 'base' },
      { kind: 'lantern', x: 11.9, y: 38.9, r: 12, layer: 'base' },
      { kind: 'lantern', x: 79.3, y: 38.2, r: 10, layer: 'base' },
      { kind: 'lantern', x: 91.8, y: 36.4, r: 12, layer: 'base' }
    ]
  },
  'noi-cac': {
    lights: [
      { kind: 'lantern', x: 34, y: 4.4, r: 18, layer: 'base' },
      { kind: 'lantern', x: 55.6, y: 20.6, r: 18, layer: 'base' },
      { kind: 'lantern', x: 97.9, y: 14.6, r: 16, layer: 'base' },
      { kind: 'ember', x: 84.8, y: 70.8, r: 34, layer: 'near' },
      { kind: 'ember', x: 84.8, y: 86.4, r: 12, layer: 'near' }
    ],
    smoke: [{ x: 82, y: 52, size: 'l' }] // decoction kettle lid
  },
  'hau-vien': {
    lights: [
      { kind: 'lantern', x: 21.5, y: 21.5, r: 14, layer: 'base' },
      { kind: 'sun', x: 52, y: 0, r: 70, layer: 'base' }
    ]
  }
};

const lightStyle = (l: SceneLight, i: number) =>
  ({ '--x': `${l.x}%`, '--y': `${l.y}%`, '--r': `${l.r}%`, '--delay': `${-i * 0.7}s` }) as React.CSSProperties;

/** Night veil with a soft hole at every light (mask layers intersect, so each light punches its own hole). */
const nightMask = (lights: SceneLight[]) =>
  lights
    .filter((l) => l.kind !== 'sun')
    .map((l) => `radial-gradient(circle ${l.r * 0.55}cqw at ${l.x}% ${l.y}%, transparent 20%, #000 100%)`)
    .join(', ') || 'none';

interface RoomBackdropProps {
  room: RoomKey;
  night: boolean;
  /** Tiền Đường only: patient health tints the scene and an open drawer blurs it. */
  healthTinted?: boolean;
  /** Solar-term weather: behind the windows when the room has a deep layer, else over the scene behind the near props. */
  weather?: WeatherKind;
}

/**
 * The painted room, split into depth layers that drift at different speeds with the mouse (--px/--py),
 * plus the lamps and embers in the painting glowing for real. Everything sits in one 16:9 stage so the
 * lights stay on top of the lamps they belong to at any viewport size.
 */
export const RoomBackdrop: React.FC<RoomBackdropProps> = ({ room, night, healthTinted, weather }) => {
  const cfg = ROOMS[room];
  const src = (layer: string) => `./art/scenes/depth/room-${room}-${layer}.webp`;
  const lights = (layer: SceneLight['layer']) =>
    cfg.lights.map((l, i) =>
      l.layer === layer ? <span key={i} className={`room-light is-${l.kind}`} style={lightStyle(l, i)} /> : null
    );
  const mask = nightMask(cfg.lights);
  const weatherLayer = weather && <WeatherCanvas key={weather} kind={weather} />;

  return (
    <div
      className={`room-depth-stage ${healthTinted ? 'health-tinted' : ''} ${night ? 'is-night' : ''}`}
      aria-hidden="true"
    >
      {cfg.deep && (
        <div className="room-depth-layer is-deep">
          <img src={src('deep')} alt="" decoding="async" />
          {weatherLayer}
        </div>
      )}
      <div className="room-depth-layer is-base">
        <img src={src('base')} alt="" fetchPriority={room === 'tien-duong' ? 'high' : undefined} decoding="async" />
        {lights('base')}
      </div>
      {!cfg.deep && weatherLayer && <div className={`room-depth-layer is-weather room-${room}`}>{weatherLayer}</div>}
      <div className="room-depth-layer is-near">
        <img src={src('near')} alt="" decoding="async" />
        {cfg.smoke?.map((sm, i) => (
          <span
            key={i}
            className={`room-smoke is-${sm.size}`}
            style={{ '--x': `${sm.x}%`, '--y': `${sm.y}%`, '--delay': `${-i * 1.3}s` } as React.CSSProperties}
          >
            <i />
            <i />
            <i />
            <i />
          </span>
        ))}
        {lights('near')}
      </div>
      <div className="room-night-veil" style={{ maskImage: mask, WebkitMaskImage: mask }} />
    </div>
  );
};
