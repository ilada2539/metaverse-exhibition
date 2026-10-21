/**
 * SPATIAL METAVERSE - MAIN APPLICATION CONTROLLER
 * Coordinates 3D Scene, World, Player, Exhibition, Multiplayer, and Main Loop
 */

class SpatialApp {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.clock = new THREE.Clock();

    this.scene = null;
    this.camera = null;
    this.renderer = null;

    this.world = null;
    this.player = null;
    this.exhibition = null;
    this.stickyNotes = null;
    this.multiplayer = null;
    this.ui = null;

    this.initThree();
    this.initModules();
    this.initEvents();
    this.animate();
  }

  initThree() {
    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0b0f19);
    this.scene.fog = new THREE.FogExp2(0x0b0f19, 0.015);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(
      65,
      window.innerWidth / window.innerHeight,
      0.1,
      300
    );
    this.camera.position.set(0, 3, 10);

    // 3. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: document.getElementById('metaverse-canvas'),
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
  }

  initModules() {
    // 1. World Builder
    this.world = new MetaverseWorld(this.scene);

    // 2. Player & Avatar
    this.player = new MetaversePlayer(this.scene, this.camera, this.renderer.domElement);

    // 3. Exhibition Manager
    this.exhibition = new ExhibitionManager(this.scene, this.world);

    // 4. Sticky Notes
    this.stickyNotes = new StickyNoteManager(this.scene, this.world);

    // 5. Multiplayer & AI Crowd
    this.multiplayer = new MultiplayerManager(this.scene, this.player, this.world);
    this.multiplayer.app = this;
    this.exhibition.app = this;

    // 7. UI Controller
    this.ui = new SpatialUI(this);
    window.spatialUI = this.ui;
  }

  initEvents() {
    // Window resize
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });

    // Unlock Audio Context on first user tap / gesture for iOS Safari & Android
    const unlockAudio = () => {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        if (!window.__unlockedAudioCtx) {
          window.__unlockedAudioCtx = new AudioCtx();
        }
        if (window.__unlockedAudioCtx.state === 'suspended') {
          window.__unlockedAudioCtx.resume();
        }
      }
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
    window.addEventListener('click', unlockAudio, { passive: true });
    window.addEventListener('touchstart', unlockAudio, { passive: true });

    // Interaction key [E] (Supports English & Thai keyboard layout)
    window.addEventListener('keydown', (e) => {
      if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;
      if (e.code === 'KeyE' || e.key === 'e' || e.key === 'E' || e.key === 'ำ') {
        if (this.currentNearbyArt) {
          this.ui.showArtworkInspector(this.currentNearbyArt);
        } else if (this.currentNearbyNote) {
          this.ui.openModal('sticky-modal');
        }
      }
    });

    // Make on-screen interaction prompt clickable / tappable on mobile & desktop
    const promptEl = document.getElementById('interaction-prompt');
    if (promptEl) {
      promptEl.style.cursor = 'pointer';
      const triggerInteraction = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        if (this.currentNearbyArt) {
          this.ui.showArtworkInspector(this.currentNearbyArt);
        } else if (this.currentNearbyNote) {
          this.ui.openModal('sticky-modal');
        }
      };
      promptEl.addEventListener('click', triggerInteraction);
      promptEl.addEventListener('touchend', triggerInteraction);
    }

    // Raycast click & mobile touch tap on 3D Artworks / Sticky Notes
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let downX = 0;
    let downY = 0;

    this.renderer.domElement.addEventListener('mousedown', (e) => {
      downX = e.clientX;
      downY = e.clientY;
    });

    this.renderer.domElement.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        downX = e.touches[0].clientX;
        downY = e.touches[0].clientY;
      }
    }, { passive: true });

    const handleRaycastTap = (clientX, clientY, targetEl) => {
      if (targetEl && (
        targetEl.closest('#top-hud') ||
        targetEl.closest('#bottom-hud') ||
        targetEl.closest('.modal-backdrop') ||
        targetEl.closest('#chat-drawer') ||
        targetEl.closest('#onscreen-dpad') ||
        targetEl.closest('#minimap-wrapper') ||
        targetEl.closest('#interaction-prompt')
      )) return;

      mouse.x = (clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, this.camera);
      const intersects = raycaster.intersectObjects(this.scene.children, true);

      for (const hit of intersects) {
        // Check if artwork canvas, border or glow
        if (hit.object.userData && hit.object.userData.artwork) {
          this.ui.showArtworkInspector(hit.object.userData.artwork);
          return;
        }
        // Check if sticky note
        if (hit.object.userData && hit.object.userData.note) {
          this.ui.openModal('sticky-modal');
          return;
        }
        // Check if classroom projector screen
        if (this.world && hit.object === this.world.auditoriumScreen) {
          const room = this.exhibition ? this.exhibition.getCurrentRoomInfo() : this.world.currentRoomInfo;
          this.ui.showToast(`🖥️ จอฉายโปรเจกเตอร์: ภาพสไลด์ ${room.name} • โรงเรียนพัฒนานิคม`);
          return;
        }
      }
    };

    this.renderer.domElement.addEventListener('click', (e) => {
      if (Math.abs(e.clientX - downX) > 25 || Math.abs(e.clientY - downY) > 25) return;
      handleRaycastTap(e.clientX, e.clientY, e.target);
    });

    this.renderer.domElement.addEventListener('touchend', (e) => {
      if (e.changedTouches.length === 0) return;
      const t = e.changedTouches[0];
      if (Math.abs(t.clientX - downX) > 20 || Math.abs(t.clientY - downY) > 20) return;
      const hitElement = document.elementFromPoint(t.clientX, t.clientY);
      handleRaycastTap(t.clientX, t.clientY, hitElement);
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = Math.min(this.clock.getDelta(), 0.1);

    // 1. Update Player Movement & Physics
    try {
      if (this.player && this.world) {
        this.player.update(delta, this.world.colliders);
      }
    } catch (err) {
      console.warn('Player update error:', err);
    }

    // 2. Update 3D World (rotating sculptures, projector screen, clock, etc.)
    try {
      if (this.world) {
        this.world.update(delta);
      }
    } catch (err) {
      console.warn('World update error:', err);
    }

    // 3. Update Multiplayer Peers & Real Attendees
    try {
      if (this.multiplayer) {
        this.multiplayer.update(delta);
      }
    } catch (err) {
      console.warn('Multiplayer update error:', err);
    }

    // 4. Update Exhibition (Auto-Slideshow & 3D Interactive Markers)
    try {
      if (this.exhibition) {
        this.exhibition.update(delta, this.player ? this.player.position : null);
      }
    } catch (err) {
      console.warn('Exhibition update error:', err);
    }

    // 5. Proximity Checks (Artworks & Sticky Notes)
    try {
      this.updateProximity();
    } catch (err) {
      console.warn('Proximity check error:', err);
    }

    // 6. Update Minimap Radar
    try {
      if (this.ui) {
        this.ui.updateMinimap();
      }
    } catch (err) {}

    // 7. Update Visitor count badge (Real actual attendees only)
    try {
      const visitorBadge = document.getElementById('visitor-count-text');
      if (visitorBadge && this.multiplayer) {
        const count = this.multiplayer.getTotalVisitors();
        visitorBadge.innerText = `${count} คน (ออนไลน์จริง)`;
      }
    } catch (err) {}

    // 8. Render 3D Scene (Always executes)
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  updateProximity() {
    if (!this.player) return;

    const pPos = this.player.position;
    const nearbyArt = this.exhibition ? this.exhibition.checkProximity(pPos) : null;
    const nearbyNote = this.stickyNotes ? this.stickyNotes.checkProximity(pPos) : null;

    this.currentNearbyArt = nearbyArt;
    this.currentNearbyNote = nearbyNote;

    if (this.ui) {
      this.ui.currentNearbyArt = nearbyArt;
    }

    const prompt = document.getElementById('interaction-prompt');
    const crosshair = document.getElementById('crosshair');

    if (nearbyArt) {
      if (prompt) {
        prompt.style.display = 'flex';
        prompt.innerHTML = `<span class="key-badge">👆/E</span> กดหรือแตะเพื่อดู "${nearbyArt.title}" & เช็คอิน`;
      }
      if (crosshair) crosshair.classList.add('active');
    } else if (nearbyNote) {
      if (prompt) {
        prompt.style.display = 'flex';
        prompt.innerHTML = `<span class="key-badge">👆/E</span> กดหรือแตะเพื่ออ่านโน้ตจาก ${nearbyNote.author}`;
      }
      if (crosshair) crosshair.classList.add('active');
    } else {
      if (prompt) prompt.style.display = 'none';
      if (crosshair) crosshair.classList.remove('active');
    }
  }
}

// Global bootstrap
function bootMetaverse() {
  if (window.app) return;
  if (typeof THREE !== 'undefined') {
    window.app = new SpatialApp();
  } else {
    // If Three.js is still loading from CDN, retry after 100ms
    const checkInterval = setInterval(() => {
      if (typeof THREE !== 'undefined') {
        clearInterval(checkInterval);
        if (!window.app) window.app = new SpatialApp();
      }
    }, 100);
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', bootMetaverse);
} else {
  bootMetaverse();
}
