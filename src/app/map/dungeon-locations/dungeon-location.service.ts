import { Injectable } from '@angular/core';

import { ItemService } from '../../items/item.service';
import { DungeonService } from '../../dungeon/dungeon.service';
import { SettingsService } from '../../settings/settings.service';
import { BossService } from '../../boss/boss.service';

import { Availability } from '../availability';
import { Dungeon } from '../../dungeon/dungeon';
import { Location } from '../../dungeon/location';
import { EntranceLock } from '../../dungeon/entrance-lock';

import { DungeonLocation } from './dungeon-location';
import { DungeonLocations } from './dungeon-location.repository';

import { Sword } from '../../items/sword';
import { Glove } from '../../items/glove';
import { Shield } from '../../items/shield';

@Injectable()
export class DungeonLocationService {
  constructor(
    private _inventory: ItemService,
    private _dungeons: DungeonService,
    private _settings: SettingsService,
    private _boss: BossService
  ) {
    this._dungeonLocations = DungeonLocations;
    this._bossAvailability = new Map<Location, () => Availability>(
      [
        [Location.CastleTower, this.isCastleTowerAvailable],
        [Location.EasternPalace, this.isArmosKnightsAvailable],
        [Location.DesertPalace, this.isLanmolasAvailable],
        [Location.TowerOfHera, this.isMoldormAvailable],
        [Location.PalaceOfDarkness, this.isHelmasaurKingAvailable],
        [Location.SwampPalace, this.isArgghusAvailable],
        [Location.SkullWoods, this.isMothulaAvailable],
        [Location.ThievesTown, this.isBlindAvailable],
        [Location.IcePalace, this.isKholdstareAvailable],
        [Location.MiseryMire, this.isVitreousAvailable],
        [Location.TurtleRock, this.isTrinexxAvailable],
        [Location.GanonsTower, this.isAgahnimAvailable]
      ]
    );

    this._chestAvailability = new Map<Location, () => Availability>(
      [
        [Location.CastleTower, this.isCastleTowerRaidable],
        [Location.EasternPalace, this.isArmosKnightsRaidable],
        [Location.DesertPalace, this.isLanmolasRaidable],
        [Location.TowerOfHera, this.isMoldormRaidable],
        [Location.PalaceOfDarkness, this.isHelmasaurKingRaidable],
        [Location.SwampPalace, this.isArgghusRaidable],
        [Location.SkullWoods, this.isMothulaRaidable],
        [Location.ThievesTown, this.isBlindRaidable],
        [Location.IcePalace, this.isKholdstareRaidable],
        [Location.MiseryMire, this.isVitreousRaidable],
        [Location.TurtleRock, this.isTrinexxRaidable],
        [Location.GanonsTower, this.isAgahnimRaidable]
      ]
    );
  }

  private _bossAvailability: Map<Location, () => Availability>;
  private _chestAvailability: Map<Location, () => Availability>;
  private _dungeonLocations: Map<Location, DungeonLocation>;

  private isCastleTowerSwordlessAvailable(): Availability {
    if ( !(this._inventory.hammer || this._inventory.cape) ) {
      return Availability.Unavailable;
    }

    if ( !this._inventory.net ) {
      return Availability.Unavailable;
    }

    return this._inventory.lantern ? Availability.Available : Availability.Glitches;
  }

  private isCastleTowerAvailable(): Availability {
    if ( this._settings.isSwordless() ) {
      return this.isCastleTowerSwordlessAvailable();
    }

    const items = this._inventory;

    const canEnter = items.cape || ( items.sword !== Sword.None && items.sword !== Sword.Wooden );

    const canBeatAgahnim = this._boss.canDefeatBoss(Location.CastleTower);

    if ( !canEnter || !canBeatAgahnim ) {
      return Availability.Unavailable;
    }

    if ( this._settings.isKeysanity() ) {
      const dungeon = this._dungeons.getDungeon(Location.CastleTower);
      if ( dungeon.smallKeyCount !== dungeon.maxSmallKeys ) {
        return Availability.Unavailable;
      }
    }

    return items.lantern ? Availability.Available : Availability.Glitches;
  }

  private isCastleTowerRaidable(): Availability {
    if ( !this._settings.isKeysanity() ) {
      return this.isCastleTowerAvailable();
    }

    const items = this._inventory;
    const dungeon = this._dungeons.getDungeon(Location.CastleTower);

    let hasMeleeWeapon: boolean;
    if ( this._settings.isSwordless() ) {
      hasMeleeWeapon = !!items.hammer;
    } else {
      hasMeleeWeapon = ( items.sword !== Sword.None && items.sword !== Sword.Wooden );
    }

    const canEnter = hasMeleeWeapon || items.cape;

    if ( !canEnter ) {
      return Availability.Unavailable;
    }

    if ( dungeon.smallKeyCount === 0 ) {
      return Availability.Possible;
    }

    return items.lantern ? Availability.Available : Availability.Glitches;
  }

  private isArmosKnightsAvailable(): Availability {
    const dungeon = this._dungeons.getDungeon(Location.EasternPalace);
    if ( this._settings.isKeysanity() && !dungeon.hasBigKey ) {
      return Availability.Unavailable;
    }

    if ( !this._inventory.bow ) {
      return Availability.Unavailable;
    }

    if ( !this._boss.canDefeatBoss(dungeon.bossId)) {
      return Availability.Unavailable;
    }

    return this._inventory.lantern ? Availability.Available : Availability.Glitches;
  }

  private isArmosKnightsRaidable(): Availability {
    const dungeon = this._dungeons.getDungeon(Location.EasternPalace);
    const items = this._inventory;
    if ( this._settings.isKeysanity() ) {
      if ( dungeon.hasBigKey && items.bow && items.lantern ) {
        return Availability.Available;
      }

      if ( dungeon.totalChestCount >= 4 ) {
        return Availability.Possible;
      }

      if ( dungeon.totalChestCount >= 3 && !dungeon.hasBigKey && !items.lantern ) {
        return Availability.Glitches;
      }

      if ( dungeon.totalChestCount >= 3 && ( dungeon.hasBigKey || items.lantern ) ) {
        return Availability.Possible;
      }

      if ( dungeon.totalChestCount >= 2 && dungeon.hasBigKey ) {
        return items.lantern ? Availability.Possible : Availability.Glitches;
      }

      if ( dungeon.hasBigKey && items.bow && !items.lantern ) {
        return Availability.Glitches;
      }

      return Availability.Unavailable;
    }

    if ( dungeon.itemChestCount <= 2 && !items.lantern ) {
      return Availability.Possible;
    }

    if ( dungeon.itemChestCount === 1 && !items.bow ) {
      return Availability.Possible;
    }

    return Availability.Available;
  }

  private isLanmolasAvailable(): Availability {
    const items = this._inventory;
    const dungeon = this._dungeons.getDungeon(Location.DesertPalace);
    const isKeysanity = this._settings.isKeysanity();

    if ( isKeysanity && !dungeon.hasBigKey ) {
      return Availability.Unavailable;
    }

    const canEnterLightWay = items.book && items.hasGlove();
    const canEnterDarkWay = items.hasDarkMireMirrorAccess();
    if ( !canEnterLightWay && !canEnterDarkWay ) {
      return Availability.Unavailable;
    }

    if (!items.hasFireSource()) {
      return Availability.Unavailable;
    }

    if ( !this._boss.canDefeatBoss(dungeon.bossId)) {
      return Availability.Unavailable;
    }

    if ( isKeysanity || items.boots ) {
      return Availability.Available;
    }

    return Availability.Possible;
  }

  private isLanmolasRaidable(): Availability {
    const items = this._inventory;
    const dungeon = this._dungeons.getDungeon(Location.DesertPalace);
    if ( this._settings.isKeysanity() ) {
      if ( !this.canEnterDesertPalaceFront() ) {
        return Availability.Unavailable;
      }

      const keys = dungeon.smallKeyCount;
      const chests = dungeon.totalChestCount;

      if ( dungeon.hasBigKey && keys === 1 && items.hasGlove() &&
        items.hasFireSource() && items.boots ) {
        return Availability.Available;
      }

      if ( chests === 6 ) {
        return Availability.Possible;
      }

      if ( chests >= 5 && (dungeon.hasBigKey || items.boots ) ) {
        return Availability.Possible;
      }

      if ( chests >= 4 ) {
        if ( keys === 1 || (dungeon.hasBigKey && items.boots ) ) {
          return Availability.Possible;
        }
        if ( dungeon.hasBigKey && items.hasFireSource() ) {
          return Availability.Possible;
        }
      }

      if ( chests >= 3 ) {
        if ( keys === 1 && (dungeon.hasBigKey || items.boots)) {
          return Availability.Possible;
        }

        if ( dungeon.hasBigKey && items.boots && items.hasFireSource() ) {
          return Availability.Possible;
        }
      }

      if ( chests >= 2 && dungeon.hasBigKey && keys === 1 && (items.hasGlove() && items.hasFireSource() ) || items.boots) {
        return Availability.Possible;
      }

      return Availability.Unavailable;
    }

    if ( !items.book && !items.hasDarkMireMirrorAccess()) {
      return Availability.Unavailable;
    }

    if ( items.hasGlove() && items.hasFireSource() && items.boots ) {
      return Availability.Available;
    }

    return dungeon.itemChestCount > 1 && items.boots ? Availability.Available : Availability.Possible;
  }

  private canEnterDesertPalaceViaWarping(): boolean {
    const items = this._inventory;
    return !!items.flute && items.glove === Glove.Titan && !!items.mirror;
  }

  private canEnterDesertPalaceFront(): Availability {
    const items = this._inventory;
    if ( items.book ) {
      return Availability.Available;
    }

    return this.canEnterDesertPalaceViaWarping() ? Availability.Available : Availability.Unavailable;
  }

  private canEnterDesertPalaceBack(): Availability {
    if ( this.canEnterDesertPalaceViaWarping()) {
      return Availability.Available;
    }

    const items = this._inventory;
    return items.book && items.hasGlove() ? Availability.Available : Availability.Unavailable;
  }

  private isMoldormAvailable(): Availability {
    const dungeon = this._dungeons.getDungeon(Location.TowerOfHera);
    const items = this._inventory;

    if ( !this._boss.canDefeatBoss(dungeon.bossId)) {
      return Availability.Unavailable;
    }

    if ( !this._settings.isKeysanity() ) {
      return this.isMoldormRaidable();
    }

    // TODO: Have some of the entrance checks moved.
    if ( !items.hasGlove() && !items.flute ) {
      return Availability.Unavailable;
    }

    if ( !items.mirror && !(items.hookshot && items.hammer )) {
      return Availability.Unavailable;
    }

    return items.hasDeathMountainLogicalAccess()
      ? Availability.Available
      : Availability.Glitches;
  }

  private isMoldormRaidable(): Availability {
    const items = this._inventory;
    const dungeon = this._dungeons.getDungeon(Location.TowerOfHera);

    if ( this._settings.isKeysanity() ) {
      if ( !items.hasDeathMountainAccess()) {
        return Availability.Unavailable;
      }

      if ( !items.mirror && !(items.hookshot && items.hammer )) {
        return Availability.Unavailable;
      }

      const isInLogic = items.flute || items.lantern;
      const canGetBasement = dungeon.smallKeyCount === 1 && items.hasFireSource();

      if ( dungeon.hasBigKey && items.hasMelee() && canGetBasement) {
        return !isInLogic ? Availability.Glitches : Availability.Available;
      }

      const chests = dungeon.totalChestCount;
      const keys = dungeon.smallKeyCount;

      if ( chests >= 5) {
        return !isInLogic ? Availability.Glitches : Availability.Possible;
      }

      if ( chests >= 4 && canGetBasement) {
        return !isInLogic ? Availability.Glitches : Availability.Possible;
      }

      if ( chests >= 3 && dungeon.hasBigKey ) {
        return !isInLogic ? Availability.Glitches : Availability.Possible;
      }

      if ( chests >= 2 && dungeon.hasBigKey && ( items.hasMelee() || canGetBasement ) ) {
        return !isInLogic ? Availability.Glitches : Availability.Possible;
      }

      return Availability.Unavailable;
    }

    if ( !items.hasDeathMountainAccess() ) {
      return Availability.Unavailable;
    }

    if ( !items.mirror && !(items.hookshot && items.hammer) ) {
      return Availability.Unavailable;
    }

    if ( !items.hasFireSource() ) {
      return Availability.Possible;
    }

    return items.hasDeathMountainLogicalAccess() ? Availability.Available : Availability.Glitches;
  }

  private isHelmasaurKingAvailable(): Availability {
    const items = this._inventory;
    const dungeon = this._dungeons.getDungeon(Location.PalaceOfDarkness);

    if ( !items.moonPearl || !items.bow || !items.hammer ) {
      return Availability.Unavailable;
    }

    if ( !this.isCastleTowerDefeated() && !items.hasGlove()) {
      return Availability.Unavailable;
    }

    if ( !this._boss.canDefeatBoss(dungeon.bossId)) {
      return Availability.Unavailable;
    }

    if ( this._settings.isKeysanity() ) {
      if ( !dungeon.hasBigKey || dungeon.smallKeyCount === 0 ) {
        return Availability.Unavailable;
      }

      if ( dungeon.smallKeyCount < 6) {
        return items.lantern ? Availability.Possible : Availability.Glitches;
      }
    }

    return items.lantern ? Availability.Available : Availability.Glitches;
  }

  private isHelmasaurKingRaidable(): Availability {
    const items = this._inventory;
    const dungeon = this._dungeons.getDungeon( Location.PalaceOfDarkness );

    if ( !items.moonPearl ) {
      return Availability.Unavailable;
    }

    const canAccessDarkWorldViaSwamp = items.hammer && items.hasGlove();
    const canAccessDarkWorldViaForestSwim = items.glove === Glove.Titan && !!items.flippers;

    if ( !this.isCastleTowerDefeated() && !canAccessDarkWorldViaSwamp && !canAccessDarkWorldViaForestSwim ) {
      return Availability.Unavailable;
    }

    if ( !this._settings.isKeysanity()) {
      return !(items.bow && !!items.lantern) || dungeon.itemChestCount === 1 && !items.hammer ?
        Availability.Possible : Availability.Available;
    }

    if ( dungeon.smallKeyCount === 6 && dungeon.hasBigKey && items.hammer && items.bow && items.lantern ) {
      return Availability.Available;
    }

    // TODO: Possibly change the logic since it will be tricky here.
    let currentKeys = dungeon.smallKeyCount;
    let reachableChests = 1;
    let darkChests = 0;

    if ( items.bow ) {
      // The bow is required for the right hand side.
      reachableChests += 2;
    }

    if ( items.bow && items.hammer ) {
      reachableChests += 2; // The bridge and dropdown are accessible.
    } else if ( currentKeys > 0 ) {
      reachableChests += 2;
      currentKeys -= 1; // The front door had to be used.
    }

    if ( currentKeys > 0 ) {
      reachableChests += 3; // Back side of POD: the likely ones at least.
      currentKeys -= 1;
      darkChests += 2;
    }

    if ( currentKeys > 0 ) {
      // The dark area with the big chest.
      reachableChests += dungeon.hasBigKey ? 3 : 2;
      currentKeys -= 1;
      darkChests += dungeon.hasBigKey ? 3 : 2;
    }

    if ( items.bow && items.hammer && dungeon.hasBigKey && currentKeys > 0) {
      reachableChests += 1; // King Helmasaur: prioritized in a special way.
      currentKeys -= 1;
      darkChests += 1;
    }

    if ( currentKeys > 0) {
      reachableChests += 1; // Spike Room
      currentKeys -= 1;
    }

    if ( currentKeys > 0) {
      reachableChests += 1; // The vanilla big key chest overlooking the lobby
      currentKeys -= 1;
    }

    if ( dungeon.totalChestCount > dungeon.maxTotalChests - reachableChests) {
      if ( dungeon.totalChestCount > dungeon.maxTotalChests - (reachableChests - darkChests)) {
        return Availability.Possible;
      }
      return items.lantern ? Availability.Possible : Availability.Glitches;
    }

    return Availability.Unavailable;
  }

  private isArgghusAvailable(): Availability {
    const items = this._inventory;

    if ( !items.moonPearl || !items.mirror || !items.flippers ) {
      return Availability.Unavailable;
    }

    if ( !items.hammer || !items.hookshot ) {
      return Availability.Unavailable;
    }

    if ( !items.hasGlove() && !this.isCastleTowerDefeated() ) {
      return Availability.Unavailable;
    }

    const dungeon = this._dungeons.getDungeon(Location.SwampPalace);

    if ( !this._boss.canDefeatBoss(dungeon.bossId)) {
      return Availability.Unavailable;
    }

    if ( this._settings.isKeysanity() && dungeon.smallKeyCount === 0 ) {
      return Availability.Unavailable;
    }

    return Availability.Available;
  }

  private isArgghusRaidable(): Availability {
    const items = this._inventory;
    const dungeon = this._dungeons.getDungeon(Location.SwampPalace);

    if ( !items.moonPearl || !items.mirror || !items.flippers ) {
      return Availability.Unavailable;
    }

    if ( !this.canReachOutcast() && !(this.isCastleTowerDefeated && items.hammer)) {
      return Availability.Unavailable;
    }

    if ( this._settings.isKeysanity() ) {
      if ( dungeon.hasBigKey && dungeon.smallKeyCount === 1 && items.hammer && items.hookshot ) {
        return Availability.Available;
      }

      const chests = dungeon.totalChestCount;
      const keys = dungeon.smallKeyCount;

      if ( chests === 10 ) {
        return Availability.Possible;
      }

      if ( chests >= 9 && keys === 1 ) {
        return Availability.Possible;
      }

      if ( chests >= 6 && keys === 1 && items.hammer ) {
        return Availability.Possible;
      }

      if ( chests >= 5 && dungeon.hasBigKey && keys === 1 && items.hammer ) {
        return Availability.Possible;
      }

      if ( chests >= 2 && keys === 1 && items.hammer && items.hookshot ) {
        return Availability.Possible;
      }

      return Availability.Unavailable;
    }

    if ( dungeon.itemChestCount <= 2) {
      return !items.hammer || !items.hookshot ? Availability.Unavailable : Availability.Available;
    }

    if ( dungeon.itemChestCount <= 4) {
      return !items.hammer ? Availability.Unavailable : !items.hookshot ? Availability.Possible : Availability.Available;
    }

    if ( dungeon.itemChestCount <= 5) {
      return !items.hammer ? Availability.Unavailable : Availability.Available;
    }

    return !items.hammer ? Availability.Possible : Availability.Available;
  }

  private isMothulaAvailable(): Availability {
    if ( !this.canReachOutcast()) {
      return Availability.Unavailable;
    }

    const items = this._inventory;

    if ( !items.fireRod ) {
      return Availability.Unavailable;
    }

    const dungeon = this._dungeons.getDungeon(Location.SkullWoods);
    if (!this._boss.canDefeatBoss(dungeon.bossId)) {
      return Availability.Unavailable;
    }

    if ( !this._settings.isSwordless() && items.sword === Sword.None ) {
      return Availability.Unavailable;
    }

    return Availability.Available;
  }

  private isMothulaRaidable(): Availability {
    if ( !this.canReachOutcast()) {
      return Availability.Unavailable;
    }

    const items = this._inventory;
    const dungeon = this._dungeons.getDungeon(Location.SkullWoods);
    if ( this._settings.isKeysanity() ) {
      const chests = dungeon.totalChestCount;
      const canGoBeyondCurtain = this._settings.isSwordless() || items.hasSword();

      if ( dungeon.hasBigKey && items.fireRod && canGoBeyondCurtain ) {
        return Availability.Available;
      }

      if ( chests >= 4 ) {
        return Availability.Possible;
      }

      if ( chests >= 3 && (dungeon.hasBigKey || items.fireRod )) {
        return Availability.Possible;
      }

      if ( chests >= 2 && items.fireRod && ( canGoBeyondCurtain || dungeon.hasBigKey ) ) {
        return Availability.Possible;
      }

      return Availability.Unavailable;
    }

    return items.fireRod ? Availability.Available : Availability.Possible;
  }

  private isBlindAvailable(): Availability {
    const items = this._inventory;
    const dungeon = this._dungeons.getDungeon(Location.ThievesTown);

    if ( !this.canReachOutcast()) {
      return Availability.Unavailable;
    }

    if ( !this._boss.canDefeatBoss(dungeon.bossId)) {
      return Availability.Unavailable;
    }

    if ( this._settings.isKeysanity() &&
      !dungeon.hasBigKey) {
      return Availability.Unavailable;
    }

    return Availability.Available;
  }

  private isBlindRaidable(): Availability {
    if ( !this.canReachOutcast()) {
      return Availability.Unavailable;
    }

    const dungeon = this._dungeons.getDungeon(Location.ThievesTown);
    const items = this._inventory;
    if ( this._settings.isKeysanity()) {
      const chests = dungeon.totalChestCount;
      const keys = dungeon.smallKeyCount;
      if ( dungeon.hasBigKey && keys === 1 && items.hammer ) {
        return Availability.Available;
      }

      if ( chests >= 5) {
        return Availability.Possible;
      }

      if ( chests >= 3 && dungeon.hasBigKey) {
        return Availability.Possible;
      }

      if ( chests >= 2 && dungeon.hasBigKey && ( items.hasMelee() || items.hasCane() ) ) {
        return Availability.Possible;
      }

      return Availability.Unavailable;
    }

    return dungeon.itemChestCount === 1 && !items.hammer ?
      Availability.Possible : Availability.Available;
  }

  private isKholdstareAvailable(): Availability {
    const items = this._inventory;
    const dungeon = this._dungeons.getDungeon(Location.IcePalace);
    if (!items.moonPearl || !items.flippers || items.glove !== Glove.Titan || !items.hammer) {
      return Availability.Unavailable;
    }

    if ( !this._boss.canDefeatBoss(dungeon.bossId) ) {
      return Availability.Unavailable;
    }

    if ( this._settings.isKeysanity() ) {
      const keys = dungeon.smallKeyCount;
      return ( keys > 0 && items.somaria || keys > 1 ) ? Availability.Available : Availability.Possible;
    }

    return items.hookshot || items.somaria ? Availability.Available : Availability.Glitches;
  }

  private isKholdstareRaidable(): Availability {
    const items = this._inventory;
    if (!items.moonPearl || !items.flippers || items.glove !== Glove.Titan ) {
      return Availability.Unavailable;
    }

    if ( !items.fireRod && !(items.bombos && items.hasMelee())) {
      return Availability.Unavailable;
    }

    if ( !this._settings.isKeysanity()) {
      return items.hammer ? Availability.Available : Availability.Glitches;
    }

    const dungeon = this._dungeons.getDungeon(Location.IcePalace);
    const keys = dungeon.smallKeyCount;
    const chests = dungeon.totalChestCount;

    if ( dungeon.hasBigKey && items.hammer ) {
      return ( keys > 0 && items.somaria || keys > 1 ) ? Availability.Available : Availability.Possible;
    }

    if ( chests >= 5 ) {
      return Availability.Possible;
    }

    if ( chests >= 4 && dungeon.hasBigKey ) {
      return Availability.Possible;
    }

    if ( chests >= 2 && items.hammer ) {
      return Availability.Possible;
    }

    return Availability.Unavailable;
  }

  private isVitreousAvailable(): Availability {
    const items = this._inventory;

    if (!items.flute || !items.moonPearl || items.glove !== Glove.Titan || !items.somaria) {
      return Availability.Unavailable;
    }

    if (!items.boots && !items.hookshot) {
      return Availability.Unavailable;
    }

    const medallionState = this.medallionState( Location.MiseryMire );
    if ( medallionState !== Availability.Available ) {
      return medallionState;
    }

    const dungeon = this._dungeons.getDungeon(Location.MiseryMire);
    if ( !this._boss.canDefeatBoss(dungeon.bossId)) {
      return Availability.Unavailable;
    }

    if ( this._settings.isKeysanity() ) {
      if ( !dungeon.hasBigKey) {
        return Availability.Unavailable;
      }

      return items.lantern ? Availability.Available : Availability.Glitches;
    }

    if ( !items.hasFireSource() ) {
      return Availability.Possible;
    }

    return items.lantern ? Availability.Available : Availability.Glitches;
  }

  private isVitreousRaidable(): Availability {
    const items = this._inventory;

    if (!items.flute || !items.moonPearl || items.glove !== Glove.Titan) {
      return Availability.Unavailable;
    }

    if (!items.boots && !items.hookshot) {
      return Availability.Unavailable;
    }

    const medallionState = this.medallionState( Location.MiseryMire );
    if ( medallionState !== Availability.Available ) {
      return medallionState;
    }

    if ( this._settings.isKeysanity()) {
      const dungeon = this._dungeons.getDungeon(Location.MiseryMire);
      const chests = dungeon.totalChestCount;

      if ( items.lantern && items.somaria && dungeon.hasBigKey ) {
        return Availability.Available;
      }

      if ( chests >= 5) {
        return Availability.Possible;
      }

      const hasFire = items.hasFireSource();

      if ( chests >= 3 ) {
        if ( dungeon.hasBigKey || hasFire) {
          return Availability.Possible;
        }

        if ( dungeon.hasBigKey && items.somaria && !hasFire) {
          return Availability.Glitches;
        }
      }

      if ( chests >= 2 && items.fireRod && dungeon.hasBigKey) {
        return Availability.Possible;
      }

      if ( chests >= 1 && items.fireRod && !items.lantern && items.somaria && dungeon.hasBigKey) {
        return Availability.Glitches;
      }

      return Availability.Unavailable;
    }

    let hasItems: boolean;
    if ( this._dungeons.getDungeon( Location.MiseryMire ).itemChestCount > 1) {
      hasItems = items.hasFireSource();
    } else {
      hasItems = !!items.lantern && !!items.somaria;
    }

    return hasItems ? Availability.Available : Availability.Possible;
  }

  private isTrinexxAvailable(): Availability {
    const items = this._inventory;
    if (!items.moonPearl || !items.hammer || items.glove !== Glove.Titan || !items.somaria) {
      return Availability.Unavailable;
    }

    if (!items.hookshot && !items.mirror) {
      return Availability.Unavailable;
    }

    if (!items.iceRod || !items.fireRod) {
      return Availability.Unavailable;
    }

    const medallionState = this.medallionState(Location.TurtleRock);
    if ( medallionState !== Availability.Available ) {
      return medallionState;
    }

    const dungeon = this._dungeons.getDungeon(Location.TurtleRock);
    if ( !this._boss.canDefeatBoss(dungeon.bossId)) {
      return Availability.Unavailable;
    }

    if ( this._settings.isKeysanity() ) {
      if ( !dungeon.hasBigKey || dungeon.smallKeyCount < 3) {
        return Availability.Unavailable;
      }

      if ( dungeon.smallKeyCount === 3) {
        return items.lantern ? Availability.Possible : Availability.Glitches;
      }

      return items.lantern ? Availability.Available : Availability.Glitches;
    }

    if ( !this.hasLaserBridgeSafety()) {
      return Availability.Possible;
    }

    return items.lantern ? Availability.Available : Availability.Glitches;
  }

  private isTrinexxRaidable(): Availability {
    const items = this._inventory;
    if (!items.moonPearl || !items.hammer || items.glove !== Glove.Titan || !items.somaria) {
      return Availability.Unavailable;
    }

    if (!items.hookshot && !items.mirror) {
      return Availability.Unavailable;
    }

    const medallionState = this.medallionState(Location.TurtleRock);
    if ( medallionState !== Availability.Available ) {
      return medallionState;
    }

    const dungeon = this._dungeons.getDungeon(Location.TurtleRock);
    const hasLaserSafety = this.hasLaserBridgeSafety();

    if ( this._settings.isKeysanity() ) {
      const chests = dungeon.totalChestCount;
      const keys = dungeon.smallKeyCount;

      if ( dungeon.hasBigKey && keys === 4 && items.fireRod && items.iceRod && items.lantern && hasLaserSafety ) {
        return Availability.Available;
      }

      if ( chests >= 12) {
        return Availability.Possible;
      }

      if ( chests >= 10 && ( items.fireRod || keys >= 2 ) ) {
        return Availability.Possible;
      }

      if ( chests >= 9 && ( ( keys >= 1 && items.fireRod ) || ( keys >= 2 && dungeon.hasBigKey ) ) ) {
        return Availability.Possible;
      }

      if ( chests >= 8 && keys >= 2 && items.fireRod ) {
        return Availability.Possible;
      }

      if ( chests >= 7 && dungeon.hasBigKey && keys >= 2 && items.fireRod ) {
        return Availability.Possible;
      }

      if ( chests >= 5 && dungeon.hasBigKey && keys >= 2 && hasLaserSafety ) {
        return items.lantern ? Availability.Possible : Availability.Glitches;
      }

      if ( chests >= 4 && dungeon.hasBigKey && keys >= 3 && hasLaserSafety ) {
        return items.lantern ? Availability.Possible : Availability.Glitches;
      }

      if ( chests >= 3 && dungeon.hasBigKey) {
        if ( keys >= 2 && items.fireRod && hasLaserSafety ) {
          return items.lantern ? Availability.Possible : Availability.Glitches;
        }

        if ( keys === 4 && items.fireRod && items.iceRod) {
          return items.lantern ? Availability.Possible : Availability.Glitches;
        }
      }

      if ( chests >= 2 && dungeon.hasBigKey && keys >= 3 && items.fireRod && hasLaserSafety ) {
        return items.lantern ? Availability.Possible : Availability.Glitches;
      }

      return Availability.Unavailable;
    }

    const darkAvailability = items.lantern ? Availability.Available : Availability.Glitches;

    if ( dungeon.itemChestCount <= 1) {
      return !hasLaserSafety ? Availability.Unavailable : items.fireRod && items.iceRod ? darkAvailability : Availability.Possible;
    }
    if ( dungeon.itemChestCount <= 2) {
      return !hasLaserSafety ? Availability.Unavailable : items.fireRod ? darkAvailability : Availability.Possible;
    }

    if ( dungeon.itemChestCount <= 4) {
      return hasLaserSafety && items.fireRod && items.lantern ? Availability.Available : Availability.Possible;
    }

    return items.fireRod && items.lantern ? Availability.Available : Availability.Possible;
  }

  private isAgahnimAvailable(): Availability {
    const dungeons = this.getCorrectDungeons();
    if ( !this.isDungeonCountCorrect( dungeons ) ) {
      return Availability.Unavailable;
    }

    if ( !this.arePriorBossesDefeated()) {
      return Availability.Unavailable;
    }

    const items = this._inventory;

    if ( items.glove !== Glove.Titan ) {
      return Availability.Unavailable;
    }

    if ( !items.moonPearl ) {
      return Availability.Unavailable;
    }

    // Add check for dark death mountain check here.
    const canClimbSuperBunnyCave = items.hookshot;
    const canAccessTurtleRock = items.hammer;

    if ( !canClimbSuperBunnyCave && !canAccessTurtleRock ) {
      return Availability.Unavailable;
    }

    if ( !items.bow ) {
      return Availability.Unavailable;
    }

    if ( !items.hasFireSource() ) {
      return Availability.Unavailable;
    }

    const dungeon = this._dungeons.getDungeon(Location.GanonsTower);
    if ( !this._boss.canDefeatBoss(dungeon.bossId)) {
      return Availability.Unavailable;
    }

    if ( this._settings.isKeysanity() ) {
      if ( !dungeon.hasBigKey) {
        return Availability.Unavailable;
      }

      if ( dungeon.smallKeyCount < 3) {
        return Availability.Possible;
      }
    }

    // Not going through all of them right now.
    return Availability.Available;
  }

  private isAgahnimRaidable(): Availability {
    if ( !this._settings.isKeysanity() ) {
      return this.isAgahnimAvailable();
    }

    const dungeons = this.getCorrectDungeons();
    if ( !this.isDungeonCountCorrect( dungeons ) ) {
      return Availability.Unavailable;
    }

    if ( !this.arePriorBossesDefeated()) {
      return Availability.Unavailable;
    }

    const items = this._inventory;

    if ( items.glove !== Glove.Titan ) {
      return Availability.Unavailable;
    }

    if ( !items.moonPearl ) {
      return Availability.Unavailable;
    }

    // Add check for dark death mountain check here.
    const canClimbSuperBunnyCave = items.hookshot;
    const canAccessTurtleRock = items.hammer;

    if ( !canClimbSuperBunnyCave && !canAccessTurtleRock ) {
      return Availability.Unavailable;
    }

    const dungeon = this._dungeons.getDungeon(Location.GanonsTower);
    const chests = dungeon.totalChestCount;
    const keys = dungeon.smallKeyCount;
    const hasFireSource = items.hasFireSource();

    if ( dungeon.hasBigKey && keys > 2 && items.bow && items.hookshot && hasFireSource && items.somaria) {
      return Availability.Available;
    }

    // Start counting keys and chests.
    let currentKeys = keys + 1; // free key on the left side.
    let reachableChests = 2; // two chests on the right are free.

    if ( items.boots ) {
      reachableChests += 1; // The torch.
    }

    if ( items.somaria ) {
      reachableChests += 1; // Tile Room.
    }

    if ( items.hookshot && items.hammer ) {
      reachableChests += 4; // Skeleton room, west side.
    }

    if ( dungeon.hasBigKey && items.bow && hasFireSource ) {
      reachableChests += 2;
      currentKeys += 1; // The mini helmasaur room.
    }

    // Now for some easy chests with few keys needed.
    if ( items.somaria && items.fireRod && currentKeys > 0) {
      reachableChests += 4; // End of right side. Free key in the room beyond.
    }

    if ( items.hookshot && items.hammer ) {
      reachableChests += 1; // Firebar Room. A key is used, but a freebie one is found on left side.
    }

    if ( dungeon.hasBigKey && items.bow && hasFireSource && currentKeys > 0 ) {
      reachableChests += 1;
      currentKeys -= 1; // Consolation chest.
    }

    // Now for chests that need a key to be spent.
    if ( currentKeys > 0) {
      if ( items.hookshot && items.hammer ) {
        // Rando room + Armos Knights area.
        reachableChests += dungeon.hasBigKey ? 9 : 8;
        currentKeys -= 1;
      } else if ( items.somaria && items.fireRod ) {
        // Just Armos Knights.
        reachableChests += dungeon.hasBigKey ? 5 : 4;
        currentKeys -= 1;
      }
    }

    if ( ( items.hookshot || items.bombos ) && items.hammer && currentKeys > 0 ) {
      reachableChests += 1;
      currentKeys -= 1; // Map room with double fire bars.
    }

    if ( chests > (dungeon.maxTotalChests - reachableChests ) ) {
      return Availability.Possible;
    }

    return Availability.Unavailable;
  }

  private getCorrectDungeons(): Dungeon[] {
    if ( this._settings.isGoalAllDungeons() ) {
      return this._dungeons.allDungeons();
    }

    if ( this._settings.isGoalPedestal() ) {
      return this._dungeons.pendantDungeons();
    }

    return this._dungeons.crystalDungeons();
  }

  private isDungeonCountCorrect( dungeons: Dungeon[] ): boolean {
    if ( this._settings.isGoalAllDungeons() ) {
      return true;
    }

    if ( this._settings.isGoalPedestal() ) {
      return dungeons.length >= 3;
    }

    return dungeons.length >= 7;
  }

  private arePriorBossesDefeated(): boolean {
    // Order doesn't matter. Just make sure the crystal ones are covered.
    return this._dungeons.crystalDungeons().every( e => e.isBossDefeated );
  }

  private hasLaserBridgeSafety(): boolean {
    return !!this._inventory.byrna || !!this._inventory.cape || this._inventory.shield === Shield.Mirror;
  }

  private medallionState( location: Location ): Availability {
    const dungeon = this._dungeons.getDungeon( location );
    if ( dungeon.entranceLock === EntranceLock.None) {
      return Availability.Available;
    }

    const inventory = this._inventory;

    if ( !inventory.bombos && !inventory.ether && !inventory.quake ) {
      return Availability.Unavailable;
    }

    if ( !inventory.hasPrimaryMelee() ) {
      return Availability.Unavailable;
    }

    if ( dungeon.entranceLock === EntranceLock.Bombos && !inventory.bombos ) {
      return Availability.Unavailable;
    }

    if ( dungeon.entranceLock === EntranceLock.Ether && !inventory.ether ) {
      return Availability.Unavailable;
    }

    if ( dungeon.entranceLock === EntranceLock.Quake && !inventory.quake ) {
      return Availability.Unavailable;
    }

    if ( dungeon.entranceLock === EntranceLock.Unknown && !(inventory.bombos && inventory.ether && inventory.quake)) {
      return Availability.Possible;
    }

    return Availability.Available;
  }

  private isCastleTowerDefeated(): boolean {
    return this._dungeons.getDungeon(Location.CastleTower).isBossDefeated;
  }

  private canReachOutcast(): boolean {
    const inventory = this._inventory;
    if ( !inventory.moonPearl ) {
      return false;
    }

    return (
      inventory.glove === Glove.Titan ||
      inventory.hasGlove() && !!inventory.hammer ||
      this.isCastleTowerDefeated() && !!inventory.hookshot && (
        !!inventory.hammer || inventory.hasGlove() || !!inventory.flippers
      )
    );
  }

  getBossAvailability(id: Location): Availability {
    return this._bossAvailability.get(id).call(this);
  }

  getChestAvailability(id: Location): Availability {
    return this._chestAvailability.get(id).call(this);
  }

  getDungeonLocation(id: Location): DungeonLocation {
    return this._dungeonLocations.get(id);
  }

  getBossName(id: Location): string {
    return this._dungeons.getDungeon(id).bossName;
  }

  hasChestsOrBossClaimed(id: Location): boolean {
    const dungeon = this._dungeons.getDungeon(id);

    if ( this._settings.isKeysanity() ) {
      return dungeon.totalChestCount === 0;
    }

    if ( dungeon.hasDungeonEndingReward ) {
      return dungeon.itemChestCount === 0;
    }

    return dungeon.isBossDefeated;
  }

  isBossDefeated(id: Location): boolean {
    return this._dungeons.getDungeon(id).isBossDefeated;
  }

  reset(): void {
    this._dungeonLocations.forEach( l => {
    } );
  }
}
