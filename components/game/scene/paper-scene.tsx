'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useTranslations } from 'next-intl';
import { type ReactNode, type RefObject, useEffect, useRef, useState } from 'react';
import type { Stain } from '@/game/quests/quests';
import {
  ADMIN_PLACES,
  BEDROOM,
  OFFICE_FLOORS,
  SIDE_PLACES,
  type SidePlaceId,
} from '@/game/world/side-rooms';
import type { Facing } from '@/game/world/side-walk';
import type { PlayerSpot } from '@/game/world/spot';
import type { Interaction } from '@/game/world/world';
import { useWornLook } from '../avatar/avatar-context';
import { usePlayerName } from '../player-name';
import { Arcade } from './arcade';
import { Bedroom } from './bedroom';
import { Bookshop } from './bookshop';
import { Boutique } from './boutique';
import { Bureau } from './bureau';
import { Coupons } from './coupons';
import { Dojo } from './dojo';
import { Downtown } from './downtown';
import { Flat } from './flat';
import { Park } from './park';
import { FIELD_OF_VIEW, MIN_CAMERA_DISTANCE, Pip } from './pip';
import { Ramen } from './ramen';
import { Shop } from './shop';
import { LightVeil, type SkyClock, SkyClockContext } from './sky';
import type { MovementInput, SceneSigns, SpeakerTops, Travel } from './stage';
import { Town } from './town';
import {
  COVER_MILLISECONDS,
  MIN_COVERED_MILLISECONDS,
  TRAVEL_TIP_COUNT,
  type TravelMode,
  type TravelPhase,
  TravelScreen,
  UNCOVER_MILLISECONDS,
} from './travel-screen';

type Props = {
  input: RefObject<MovementInput>;
  webglUnavailable: string;
  signs: SceneSigns;
  // The speech bubble offering what the player can do, which the scene moves over its place.
  bubble: RefObject<HTMLElement | null>;
  stains: readonly Stain[];
  // Léa is out of breath until her walls are dusted for the day.
  isLeaCalm: boolean;
  onInteractionChange: (interaction: Interaction | null) => void;
  onScrub: (id: number) => void;
  // Where the character starts: where it was left last time, or else the bedroom.
  startSpot: PlayerSpot | null;
  // Kept up to date with where the character stands, for saving it when the page is left.
  spot: RefObject<PlayerSpot | null>;
  // Told whenever the character arrives somewhere else, with where it stands there.
  onPlaceChange: (arrived: PlayerSpot) => void;
  // The game's clock as this player sees it, and the weather of the moment.
  skyClock: SkyClock;
  // Drawn over the scene but under the scenery of a trip, such as the rain.
  children?: ReactNode;
};

// The places under the open sky, which the light of the time of day falls on.
const OUTSIDE_PLACES: ReadonlySet<SidePlaceId> = new Set(['town', 'park', 'downtown']);

// The places the bus serves: a trip between two of them is by bus.
const BUS_STOPS: ReadonlySet<SidePlaceId> = new Set(['town', 'park', 'downtown']);
// How a trip is made: by the office's lift between its floors, the street included, by bus between
// the stops, or else on foot.
function travelMode(from: SidePlaceId, to: SidePlaceId): TravelMode {
  const fromFloor = OFFICE_FLOORS.find(({ place }) => place === from);
  const toFloor = OFFICE_FLOORS.find(({ place }) => place === to);
  if (fromFloor && toFloor && (ADMIN_PLACES.has(from) || ADMIN_PLACES.has(to))) {
    return toFloor.floor > fromFloor.floor ? 'elevatorUp' : 'elevatorDown';
  }
  return BUS_STOPS.has(from) && BUS_STOPS.has(to) ? 'bus' : 'walk';
}

// Should a place never say it is drawn, such as without WebGL, the scenery opens anyway.
const MAX_COVERED_MILLISECONDS = 5000;
// How long the ticket takes to show, before the new place is built behind it.
const TICKET_UP_MILLISECONDS = 260;

// Tells once a place has drawn its first frames: its drawings are made and sent to the screen, so
// that the scenery can open on it rather than on the place before.
function FirstFrames({ onDrawn }: { onDrawn: () => void }) {
  const frames = useRef(0);
  useFrame(() => {
    frames.current += 1;
    if (frames.current === 2) {
      onDrawn();
    }
  });
  return null;
}

// The paper world, seen from the side. Every visit starts afresh, so that the character arrives
// at the door it came through.
export function PaperScene({
  input,
  webglUnavailable,
  signs,
  bubble,
  stains,
  isLeaCalm,
  onInteractionChange,
  onScrub,
  startSpot,
  spot,
  onPlaceChange,
  skyClock,
  children,
}: Props) {
  const tTravel = useTranslations('Travel');
  const playerName = usePlayerName();
  // Read here, outside the canvas, which doesn't pass the game's contexts on.
  const look = useWornLook();
  // Each place by the name on its sign, or else its own.
  const placeNames: Record<SidePlaceId, string> = {
    bedroom: tTravel('places.bedroom', { name: playerName }),
    town: signs.busStop,
    shop: signs.shop,
    bookshop: signs.bookshop,
    flat: tTravel('places.flat'),
    arcade: signs.arcade,
    park: signs.parkStop,
    downtown: signs.downtownStop,
    bureau: signs.bureau,
    coupons: tTravel('places.coupons'),
    ramen: signs.ramen,
    dojo: signs.dojo,
    boutique: signs.boutique,
  };
  const [visit, setVisit] = useState<{
    number: number;
    place: SidePlaceId;
    arrival: { x: number; facing: Facing };
  }>(() =>
    startSpot
      ? {
          number: 0,
          place: startSpot.place,
          arrival: { x: startSpot.x, facing: startSpot.facing },
        }
      : { number: 0, place: 'bedroom', arrival: { x: BEDROOM.start, facing: 1 } },
  );
  // The scenery starts closed over the first place, and opens once it is drawn. `to` is where the
  // trip leads, and `visit` the number of the visit it waits to see drawn.
  const [travel, setTravel] = useState<{
    phase: TravelPhase;
    mode: TravelMode;
    tip: number;
    to: SidePlaceId;
    facing: Facing;
    visit: number;
  }>(() => ({
    phase: 'covered',
    mode: 'walk',
    tip: Math.floor(Math.random() * TRAVEL_TIP_COUNT),
    to: startSpot?.place ?? 'bedroom',
    facing: startSpot?.facing ?? 1,
    visit: 0,
  }));
  const [drawnVisit, setDrawnVisit] = useState(-1);
  const coveredAt = useRef(0);
  const speakerTops = useRef<SpeakerTops>({});
  const travelTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    coveredAt.current = performance.now();
    return () => clearTimeout(travelTimer.current);
  }, []);

  // Once the new place is drawn, and the ticket has been up long enough to be read, the scenery
  // opens, then goes away.
  useEffect(() => {
    if (travel.phase !== 'covered') {
      return;
    }
    const shown = performance.now() - coveredAt.current;
    const wait =
      drawnVisit === travel.visit
        ? Math.max(0, MIN_COVERED_MILLISECONDS - shown)
        : Math.max(0, MAX_COVERED_MILLISECONDS - shown);
    const timer = setTimeout(
      () => setTravel((current) => ({ ...current, phase: 'uncovering' })),
      wait,
    );
    return () => clearTimeout(timer);
  }, [travel.phase, travel.visit, drawnVisit]);

  useEffect(() => {
    if (travel.phase !== 'uncovering') {
      return;
    }
    const timer = setTimeout(
      () => setTravel((current) => ({ ...current, phase: 'idle' })),
      UNCOVER_MILLISECONDS,
    );
    return () => clearTimeout(timer);
  }, [travel.phase]);

  const goThrough = (exit: Travel) => {
    if (travel.phase !== 'idle') {
      return;
    }
    onInteractionChange(null);
    setTravel((current) => ({
      phase: 'covering',
      mode: travelMode(visit.place, exit.to),
      tip:
        (current.tip + 1 + Math.floor(Math.random() * (TRAVEL_TIP_COUNT - 1))) % TRAVEL_TIP_COUNT,
      to: exit.to,
      facing: exit.arrival.facing,
      visit: visit.number + 1,
    }));
    // Once the scenery is closed and the ticket shown, the new place is built: that takes a moment,
    // during which the page can't draw, so the ticket goes up first.
    travelTimer.current = setTimeout(() => {
      coveredAt.current = performance.now();
      setTravel((current) => ({ ...current, phase: 'covered' }));
      travelTimer.current = setTimeout(() => {
        setVisit(({ number }) => ({ number: number + 1, place: exit.to, arrival: exit.arrival }));
        onPlaceChange({ place: exit.to, x: exit.arrival.x, facing: exit.arrival.facing });
      }, TICKET_UP_MILLISECONDS);
    }, COVER_MILLISECONDS);
  };

  return (
    <>
      <Canvas
        camera={{
          fov: FIELD_OF_VIEW,
          near: 0.1,
          far: 200,
          position: [0, 3.7, MIN_CAMERA_DISTANCE],
        }}
        dpr={[1, 2]}
        // The drawings keep their own colours, without the tone mapping meant for lit 3D scenes.
        flat
        fallback={<p className="p-4 text-center">{webglUnavailable}</p>}
      >
        <ambientLight intensity={1.6} color="#fff4e4" />
        <directionalLight position={[-4, 8, 10]} intensity={1.2} />
        <SkyClockContext value={skyClock}>
          <group key={visit.number}>
            <FirstFrames onDrawn={() => setDrawnVisit(visit.number)} />
            {visit.place === 'bedroom' && <Bedroom />}
            {visit.place === 'town' && <Town signs={signs} speakerTops={speakerTops} />}
            {visit.place === 'shop' && <Shop signs={signs} speakerTops={speakerTops} />}
            {visit.place === 'bookshop' && <Bookshop speakerTops={speakerTops} />}
            {visit.place === 'flat' && (
              <Flat speakerTops={speakerTops} stains={stains} isLeaCalm={isLeaCalm} />
            )}
            {visit.place === 'arcade' && <Arcade />}
            {visit.place === 'park' && <Park signs={signs} speakerTops={speakerTops} />}
            {visit.place === 'downtown' && <Downtown signs={signs} speakerTops={speakerTops} />}
            {visit.place === 'bureau' && <Bureau speakerTops={speakerTops} />}
            {visit.place === 'coupons' && <Coupons speakerTops={speakerTops} />}
            {visit.place === 'ramen' && <Ramen speakerTops={speakerTops} />}
            {visit.place === 'dojo' && <Dojo speakerTops={speakerTops} />}
            {visit.place === 'boutique' && <Boutique speakerTops={speakerTops} />}
            <Pip
              input={input}
              room={SIDE_PLACES[visit.place]}
              arrival={visit.arrival}
              bubble={bubble}
              speakerTops={speakerTops}
              stains={visit.place === 'flat' ? stains : []}
              spot={spot}
              onInteractionChange={onInteractionChange}
              onExit={goThrough}
              onScrub={onScrub}
              look={look}
            />
          </group>
          {OUTSIDE_PLACES.has(visit.place) && <LightVeil />}
        </SkyClockContext>
      </Canvas>
      {children}
      <TravelScreen
        phase={travel.phase}
        placeName={placeNames[travel.to]}
        mode={travel.mode}
        facing={travel.facing}
        tip={travel.tip}
        busLine={signs.busLine}
      />
    </>
  );
}
