import { ComponentFixture, ComponentFixtureAutoDetect, TestBed, async } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { DungeonLocationComponent } from './dungeon-location.component';
import { DungeonLocationService } from './dungeon-location.service';
import { InventoryService } from '../../inventory.service';
import { DungeonService } from '../../dungeon/dungeon.service';
import { SettingsService } from '../../settings/settings.service';
import { LocalStorageService } from '../../local-storage.service';
import { CaptionService } from '../../caption/caption.service';

describe( 'The dungeon item component', () => {
  let comp: DungeonLocationComponent;
  let fixture: ComponentFixture<DungeonLocationComponent>;
  let de: DebugElement;
  let el: HTMLElement;
  let itemLocationService: DungeonLocationService;
  const mouseEvt = new MouseEvent('test');

  beforeEach(() => {
    const store: any = {};

    spyOn( localStorage, 'getItem' ).and.callFake( (key: string): string => {
      return store[key] || null;
    });

    spyOn( localStorage, 'removeItem' ).and.callFake( (key: string): void => {
      delete store[key];
    });

    spyOn( localStorage, 'setItem' ).and.callFake( (key: string, value: string): void => {
      store[key] = value;
    });
  });

  beforeEach( async(() => {
    TestBed.configureTestingModule({
      declarations: [DungeonLocationComponent],
      providers: [DungeonLocationService, CaptionService, InventoryService, DungeonService, SettingsService, LocalStorageService]
    }).compileComponents();
  }));

  describe( 'set to Agahnim\'s Tower', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent( DungeonLocationComponent );
      comp = fixture.componentInstance;
      comp.dungeonLocationId = 0;
      fixture.detectChanges();

      de = fixture.debugElement;
      el = de.nativeElement;
      itemLocationService = de.injector.get( DungeonLocationService );
    });

    it( 'should be created successfully.', () => {
      expect( de.componentInstance ).toBeTruthy();
    });

    it( 'should start as not available.', () => {
      const classes = comp.getSurroundingClasses();
      expect( classes.unavailable ).toBeTruthy();
    });
  });
});
