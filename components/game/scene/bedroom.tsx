import { useMemo } from 'react';
import { BEDROOM_FURNITURE, BEDROOM_WALLS } from '@/game/world/side-rooms';
import {
  drawBed,
  drawBigPlant,
  drawBookcase,
  drawChair,
  drawDesk,
  drawPlanks,
  drawShadowBlob,
  drawStandingMirror,
  drawWallpaper,
  drawWardrobe,
} from '../art/bedroom';
import { cutOut } from '../art/core';
import { SkyWindow } from './sky';
import { doorTexture, Furniture, RoomShell, texture, WINDOW } from './stage';

// The bedroom: the bed against the left wall, the wardrobe beside it, the desk under the window, a
// standing mirror, the bookcase and a plant, and the door out in the right wall.
export function Bedroom() {
  const textures = useMemo(
    () => ({
      room: { wall: texture(drawWallpaper()), floor: texture(drawPlanks()), door: doorTexture(46) },
      shadow: texture(drawShadowBlob()),
      bed: texture(cutOut(320, 140, drawBed, 9, 41)),
      bookcase: texture(cutOut(170, 230, drawBookcase, 9, 42)),
      plant: texture(cutOut(240, 330, drawBigPlant, 9, 45)),
      desk: texture(cutOut(230, 128, drawDesk, 9, 43)),
      chair: texture(cutOut(95, 150, drawChair, 8, 44)),
      wardrobe: texture(cutOut(170, 280, drawWardrobe, 9, 47)),
      mirror: texture(cutOut(110, 240, drawStandingMirror, 8, 48)),
    }),
    [],
  );
  const { bed, desk, chair, bookcase, plant, wardrobe, mirror } = BEDROOM_FURNITURE;
  return (
    <>
      <RoomShell walls={BEDROOM_WALLS} doorSide="right" textures={textures.room} />
      <SkyWindow x={WINDOW.x} />
      <Furniture
        map={textures.bookcase}
        x={bookcase.x}
        z={-1.3}
        height={2.51}
        shadow={textures.shadow}
      />
      <Furniture map={textures.plant} x={plant.x} z={-1.05} height={3.1} shadow={textures.shadow} />
      <Furniture
        map={textures.wardrobe}
        x={wardrobe.x}
        z={-1.3}
        height={2.7}
        shadow={textures.shadow}
      />
      <Furniture
        map={textures.mirror}
        x={mirror.x}
        z={-0.9}
        height={2.3}
        shadow={textures.shadow}
      />
      <Furniture map={textures.bed} x={bed.x} z={-0.7} height={1.5} shadow={textures.shadow} />
      <Furniture map={textures.desk} x={desk.x} z={-1.15} height={1.42} shadow={textures.shadow} />
      <Furniture map={textures.chair} x={chair.x} z={-0.45} height={1.4} shadow={textures.shadow} />
    </>
  );
}
