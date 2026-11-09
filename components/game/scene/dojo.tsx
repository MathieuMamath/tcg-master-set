// Maître Kaito's dojo, inside.

import { type RefObject, useMemo } from 'react';
import { DOJO_FURNITURE, DOJO_MASTER_X, DOJO_WALLS } from '@/game/world/side-rooms';
import { drawDoor, drawShadowBlob } from '../art/bedroom';
import { cutOut, paint } from '../art/core';
import {
  DOJO_MASTER_SIZE,
  drawDojoFloor,
  drawDojoMaster,
  drawDojoRack,
  drawDojoScroll,
  drawDojoWall,
  drawGardenView,
  drawPaperLantern,
  drawThrown,
} from '../art/dojo';
import {
  blinker,
  Character,
  CutOut,
  DOOR_HEIGHT,
  DOOR_WIDTH,
  Furniture,
  PIXELS_PER_UNIT,
  RoomShell,
  type SpeakerTops,
  SpeakerTopsOf,
  texture,
  WALL_Z,
} from './stage';

const DOJO_MASTER_HEIGHT = 2.5;
const DOJO_MASTER_Z = -1;
const VEGETABLE_LOOKS = ['carrot', 'radish', 'pepper', 'eggplant', 'cabbage'] as const;

// A basket of vegetables beside the chopping block, for the slicing lessons.
function drawVegetableBasket(drawing: CanvasRenderingContext2D, width: number, height: number) {
  // The chopping block, a thick round of wood.
  drawing.fillStyle = '#8a5a34';
  drawing.fillRect(width * 0.56, height * 0.5, width * 0.4, height * 0.5);
  drawing.fillStyle = '#c99a5b';
  drawing.beginPath();
  drawing.ellipse(width * 0.76, height * 0.5, width * 0.2, height * 0.08, 0, 0, Math.PI * 2);
  drawing.fill();
  // The basket, heaped with vegetables.
  VEGETABLE_LOOKS.forEach((look, index) => {
    drawing.save();
    drawing.translate(width * (0.02 + index * 0.09), height * (0.28 + (index % 2) * 0.06));
    drawThrown(look)(drawing, width * 0.22, width * 0.22);
    drawing.restore();
  });
  drawing.fillStyle = '#b8894a';
  drawing.beginPath();
  drawing.moveTo(0, height * 0.52);
  drawing.lineTo(width * 0.54, height * 0.52);
  drawing.lineTo(width * 0.48, height);
  drawing.lineTo(width * 0.06, height);
  drawing.closePath();
  drawing.fill();
  drawing.strokeStyle = 'rgb(90 60 30 / 45%)';
  drawing.lineWidth = 4;
  for (let row = 0.62; row < 1; row += 0.12) {
    drawing.beginPath();
    drawing.moveTo(width * 0.02, height * row);
    drawing.lineTo(width * 0.52, height * row);
    drawing.stroke();
  }
}

// Inside the dojo: paper screens in a wooden grid, tatami on the floor, the rack of swords by the
// door, a hanging scroll, Maître Kaito on the mats, the vegetables for slicing, and the back screens
// open onto the garden, where the archery target stands.
export function Dojo({ speakerTops }: { speakerTops: RefObject<SpeakerTops> }) {
  const { rack, scroll, basket, garden } = DOJO_FURNITURE;
  const textures = useMemo(
    () => ({
      room: {
        wall: texture(drawDojoWall()),
        floor: texture(drawDojoFloor()),
        door: texture(
          paint(
            Math.round(DOOR_WIDTH * PIXELS_PER_UNIT),
            Math.round(DOOR_HEIGHT * PIXELS_PER_UNIT),
            drawDoor,
            213,
          ),
        ),
      },
      shadow: texture(drawShadowBlob()),
      rack: texture(cutOut(Math.round(rack.width * PIXELS_PER_UNIT), 260, drawDojoRack, 8, 214)),
      scroll: texture(cutOut(110, 220, drawDojoScroll, 6, 215)),
      basket: texture(
        cutOut(Math.round(basket.width * PIXELS_PER_UNIT), 150, drawVegetableBasket, 8, 216),
      ),
      garden: texture(cutOut(260, 230, drawGardenView, 6, 217)),
      lantern: texture(cutOut(50, 80, drawPaperLantern, 6, 218)),
      master: blinker(DOJO_MASTER_SIZE.width, DOJO_MASTER_SIZE.height, drawDojoMaster, 9, 219),
    }),
    [],
  );
  return (
    <>
      <RoomShell walls={DOJO_WALLS} doorSide="left" textures={textures.room} />
      <SpeakerTopsOf
        speakerTops={speakerTops}
        speakers={[
          {
            interaction: 'dojoMaster',
            map: textures.master.open,
            height: DOJO_MASTER_HEIGHT,
            z: DOJO_MASTER_Z,
          },
        ]}
      />
      <group position={[scroll.x, 2.4, WALL_Z + 0.02]}>
        <CutOut map={textures.scroll} height={1.7} />
      </group>
      {[-3, 4].map((lanternX) => (
        <group key={lanternX} position={[lanternX, 3.2, WALL_Z + 0.3]}>
          <CutOut map={textures.lantern} height={0.8} />
        </group>
      ))}
      <Furniture map={textures.rack} x={rack.x} z={-1.3} height={2.2} shadow={textures.shadow} />
      <Character
        map={textures.master.open}
        blinks={textures.master}
        x={DOJO_MASTER_X}
        z={DOJO_MASTER_Z}
        height={DOJO_MASTER_HEIGHT}
        shadow={textures.shadow}
      />
      <Furniture
        map={textures.basket}
        x={basket.x}
        z={-0.8}
        height={1.1}
        shadow={textures.shadow}
      />
      {/* The back screens slid open onto the garden, where archery is practised. */}
      <group position={[garden.x, 1.9, WALL_Z + 0.02]}>
        <CutOut map={textures.garden} height={2.3} />
      </group>
    </>
  );
}
