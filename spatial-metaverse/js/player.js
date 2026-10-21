/**
 * SPATIAL METAVERSE - PLAYER & AVATAR CONTROLLER
 * Controls 3D humanoid avatar, webcam face mapping, first/third-person camera, and walking physics
 */

class MetaversePlayer {
  constructor(scene, camera, domElement) {
    this.scene = scene;
    this.camera = camera;
    this.domElement = domElement;

    // Player State
    this.name = 'ผู้เยี่ยมชม';
    this.role = 'นักเรียน'; // 'คุณครู' | 'นักเรียน' | 'ภัณฑารักษ์'
    this.shirtColor = '#06b6d4';
    this.skinColor = '#fcd34d';
    this.faceTexture = null;

    // Movement & Physics
    this.position = new THREE.Vector3(0, 0, 5); // Starting in Grand Hall
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.speed = 9.0;
    this.jumpForce = 7.5;
    this.gravity = 20.0;
    this.isGrounded = true;
    this.walkCycle = 0;

    // Camera Mode: 'third_person' or 'first_person'
    this.cameraMode = 'third_person';
    this.cameraDistance = 4.5;
    this.cameraPitch = 0.2;
    this.cameraYaw = 0;

    // Exhibition Reading Mode: Avatar stands in front of booth while reading
    this.isReading = false;
    this.readingArt = null;
    this.readingBreathCycle = 0;

    // Input States
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false
    };

    // Mouse / Touch Look state
    this.isPointerLocked = false;
    this.isMouseDown = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;

    // Joystick virtual vector
    this.joystickVector = { x: 0, y: 0 };

    this.initAvatar();
    this.initControls();
  }

  initAvatar() {
    this.avatarGroup = new THREE.Group();
    this.avatarGroup.position.copy(this.position);

    // 1. Torso / Shirt
    const bodyGeo = new THREE.BoxGeometry(0.7, 0.9, 0.4);
    this.bodyMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.shirtColor),
      roughness: 0.5
    });
    this.body = new THREE.Mesh(bodyGeo, this.bodyMat);
    this.body.position.y = 1.15;
    this.body.castShadow = true;
    this.avatarGroup.add(this.body);

    // 2. Head with Face Texture
    const headGeo = new THREE.BoxGeometry(0.55, 0.55, 0.55);
    this.headMaterials = this.createHeadMaterials();
    this.head = new THREE.Mesh(headGeo, this.headMaterials);
    this.head.position.y = 1.9;
    this.head.castShadow = true;
    this.avatarGroup.add(this.head);

    // 3. Hair / Cap
    const capGeo = new THREE.BoxGeometry(0.58, 0.15, 0.58);
    const capMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
    this.cap = new THREE.Mesh(capGeo, capMat);
    this.cap.position.y = 2.2;
    this.avatarGroup.add(this.cap);

    // 4. Arms
    const armGeo = new THREE.BoxGeometry(0.2, 0.75, 0.2);
    const armMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(this.shirtColor) });
    this.leftArm = new THREE.Mesh(armGeo, armMat);
    this.leftArm.position.set(-0.5, 1.1, 0);
    this.avatarGroup.add(this.leftArm);

    this.rightArm = new THREE.Mesh(armGeo, armMat);
    this.rightArm.position.set(0.5, 1.1, 0);
    this.avatarGroup.add(this.rightArm);

    // 5. Legs
    const legGeo = new THREE.BoxGeometry(0.25, 0.7, 0.25);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
    this.leftLeg = new THREE.Mesh(legGeo, legMat);
    this.leftLeg.position.set(-0.2, 0.35, 0);
    this.leftLeg.castShadow = true;
    this.avatarGroup.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(legGeo, legMat);
    this.rightLeg.position.set(0.2, 0.35, 0);
    this.rightLeg.castShadow = true;
    this.avatarGroup.add(this.rightLeg);

    // 6. Nameplate Sprite
    this.nameplateSprite = this.createNameplateSprite();
    this.nameplateSprite.position.y = 2.65;
    this.avatarGroup.add(this.nameplateSprite);

    // 7. Speech Bubble Sprite
    this.speechBubbleSprite = this.createSpeechBubbleSprite();
    this.speechBubbleSprite.position.y = 3.2;
    this.speechBubbleSprite.visible = false;
    this.avatarGroup.add(this.speechBubbleSprite);

    // 8. Reading Tablet (Digital Inspector Pad held while reading exhibition)
    this.tabletGroup = this.createTabletMesh();
    this.tabletGroup.position.set(0, 1.25, 0.42);
    this.tabletGroup.rotation.x = -0.55;
    this.tabletGroup.visible = false;
    this.avatarGroup.add(this.tabletGroup);

    // 9. Reading Status Badge Sprite
    this.readingBadgeSprite = this.createReadingBadgeSprite();
    this.readingBadgeSprite.position.y = 3.0;
    this.readingBadgeSprite.visible = false;
    this.avatarGroup.add(this.readingBadgeSprite);

    this.scene.add(this.avatarGroup);

    // Auto-restore saved face photo from localStorage
    try {
      const savedFace = localStorage.getItem('spatial_avatar_face');
      if (savedFace) {
        this.applyWebcamFaceTexture(savedFace);
      }
    } catch (e) {}
  }


  createHeadMaterials() {
    const skinMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.skinColor),
      roughness: 0.6
    });

    const faceCanvas = document.createElement('canvas');
    faceCanvas.width = 256;
    faceCanvas.height = 256;
    const ctx = faceCanvas.getContext('2d');
    ctx.fillStyle = this.skinColor;
    ctx.fillRect(0, 0, 256, 256);

    // Eyes
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(80, 110, 16, 0, Math.PI * 2);
    ctx.arc(176, 110, 16, 0, Math.PI * 2);
    ctx.fill();

    // Eye shines
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(76, 106, 6, 0, Math.PI * 2);
    ctx.arc(172, 106, 6, 0, Math.PI * 2);
    ctx.fill();

    // Smile
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(128, 140, 32, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();

    this.defaultFaceTexture = new THREE.CanvasTexture(faceCanvas);
    const frontFaceMat = new THREE.MeshStandardMaterial({
      map: this.defaultFaceTexture,
      roughness: 0.6
    });

    return [
      skinMat, // right
      skinMat, // left
      skinMat, // top
      skinMat, // bottom
      frontFaceMat, // front (+Z)
      skinMat  // back
    ];
  }

  applyWebcamFaceTexture(imageOrCanvas) {
    if (!imageOrCanvas) return;

    let dataUrl = null;
    if (imageOrCanvas.toDataURL) {
      dataUrl = imageOrCanvas.toDataURL('image/jpeg', 0.82);
    } else if (typeof imageOrCanvas === 'string') {
      dataUrl = imageOrCanvas;
    }
    if (dataUrl) {
      this.faceDataUrl = dataUrl;
      try {
        localStorage.setItem('spatial_avatar_face', dataUrl);
      } catch (e) {}
    }

    if (imageOrCanvas.nodeName || imageOrCanvas instanceof HTMLCanvasElement || imageOrCanvas instanceof HTMLImageElement) {
      this.faceImage = imageOrCanvas;
      const texture = new THREE.Texture(imageOrCanvas);
      texture.needsUpdate = true;
      this.faceTexture = texture;
      if (this.headMaterials && this.headMaterials[4]) {
        this.headMaterials[4].map = texture;
        this.headMaterials[4].needsUpdate = true;
      }
      this.updateNameplate();
    } else if (typeof imageOrCanvas === 'string') {
      const img = new Image();
      img.onload = () => {
        this.faceImage = img;
        const texture = new THREE.Texture(img);
        texture.needsUpdate = true;
        this.faceTexture = texture;
        if (this.headMaterials && this.headMaterials[4]) {
          this.headMaterials[4].map = texture;
          this.headMaterials[4].needsUpdate = true;
        }
        this.updateNameplate();
      };
      img.src = imageOrCanvas;
    }
  }


  setShirtColor(hexColor) {
    this.shirtColor = hexColor;
    this.bodyMat.color.set(hexColor);
    this.leftArm.material.color.set(hexColor);
    this.rightArm.material.color.set(hexColor);
  }

  setSkinColor(hexColor) {
    this.skinColor = hexColor;
    for (let i = 0; i < 6; i++) {
      if (i !== 4) this.headMaterials[i].color.set(hexColor);
    }
  }

  setProfile(name, role) {
    this.name = name;
    this.role = role || 'ผู้เข้าชม';
    if (role && role.includes('สร้าง')) {
      this.setShirtColor('#d97706'); // Gold/Amber for Exhibition Creator
    } else if (role && (role.includes('ครู') || role.includes('Teacher'))) {
      this.setShirtColor('#7c3aed'); // Royal Purple for Teacher
    } else {
      this.setShirtColor('#0284c7'); // Sky Cyan for Visitor
    }
    this.updateNameplate();
  }

  createNameplateSprite() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    this.nameplateCanvas = canvas;
    this.nameplateCtx = canvas.getContext('2d');
    this.updateNameplate();

    const texture = new THREE.CanvasTexture(canvas);
    this.nameplateTexture = texture;
    const spriteMat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(2.4, 0.6, 1);
    return sprite;
  }

  updateNameplate() {
    const ctx = this.nameplateCtx;
    const w = this.nameplateCanvas.width;
    const h = this.nameplateCanvas.height;

    ctx.clearRect(0, 0, w, h);

    const isTeacher = this.role.includes('ครู') || this.role.includes('Teacher');
    const isCreator = this.role.includes('สร้าง') || this.role.includes('Creator');

    if (isTeacher) {
      ctx.fillStyle = 'rgba(88, 28, 135, 0.88)';
      ctx.strokeStyle = '#c084fc';
    } else if (isCreator) {
      ctx.fillStyle = 'rgba(120, 53, 15, 0.88)';
      ctx.strokeStyle = '#f59e0b';
    } else {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.strokeStyle = '#38bdf8';
    }

    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(16, 16, w - 32, h - 32, 32);
    } else {
      ctx.fillRect(16, 16, w - 32, h - 32);
    }
    ctx.fill();

    ctx.lineWidth = 4;
    ctx.stroke();

    let textX = w / 2;
    let align = 'center';

    if (this.faceImage) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(64, 64, 34, 0, Math.PI * 2);
      ctx.clip();
      try {
        ctx.drawImage(this.faceImage, 30, 30, 68, 68);
      } catch (e) {}
      ctx.restore();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(64, 64, 34, 0, Math.PI * 2);
      ctx.stroke();

      textX = 115;
      align = 'left';
    }

    ctx.textAlign = align;
    ctx.font = 'bold 30px Prompt, Sarabun, sans-serif';
    ctx.fillStyle = '#ffffff';

    let roleTag = '🧭 ผู้เข้าชม • ';
    if (isTeacher) {
      roleTag = '👑 คุณครู • ';
    } else if (isCreator) {
      roleTag = '🎨 ผู้สร้าง • ';
    }

    const schoolTag = this.name.includes('พัฒนานิคม') ? '' : ' [ร.ร.พัฒนานิคม]';
    ctx.fillText(`${roleTag}${this.name}${schoolTag}`, textX, 78);

    if (this.nameplateTexture) this.nameplateTexture.needsUpdate = true;
  }


  createSpeechBubbleSprite() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 200;
    this.speechCanvas = canvas;
    this.speechCtx = canvas.getContext('2d');

    const texture = new THREE.CanvasTexture(canvas);
    this.speechTexture = texture;
    const spriteMat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(3.2, 1.25, 1);
    return sprite;
  }

  showSpeech(text) {
    const ctx = this.speechCtx;
    const w = this.speechCanvas.width;
    const h = this.speechCanvas.height;

    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(20, 20, w - 40, h - 70, 24);
    } else {
      ctx.fillRect(20, 20, w - 40, h - 70);
    }
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(w / 2 - 20, h - 50);
    ctx.lineTo(w / 2, h - 20);
    ctx.lineTo(w / 2 + 20, h - 50);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 28px Prompt, Sarabun, sans-serif';
    ctx.textAlign = 'center';

    let displayText = text;
    if (displayText.length > 28) displayText = displayText.substring(0, 26) + '...';
    ctx.fillText(displayText, w / 2, 85);

    this.speechTexture.needsUpdate = true;
    this.speechBubbleSprite.visible = true;

    if (this.speechTimeout) clearTimeout(this.speechTimeout);
    this.speechTimeout = setTimeout(() => {
      this.speechBubbleSprite.visible = false;
    }, 5000);
  }

  // =========================================================================
  // READING MODE CONTROLS: AVATAR EXAMINING BOOTH
  // =========================================================================
  createTabletMesh() {
    const tabletGroup = new THREE.Group();

    // Body
    const bodyGeo = new THREE.BoxGeometry(0.52, 0.02, 0.38);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.3,
      metalness: 0.8
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    tabletGroup.add(bodyMesh);

    // Glowing Screen with Digital Content
    const screenGeo = new THREE.PlaneGeometry(0.48, 0.34);
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(0, 0, 256, 180);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('📖 EXHIBITION GUIDE', 16, 32);
    // Draw digital lines
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    for (let y = 55; y <= 150; y += 18) {
      ctx.fillRect(16, y, Math.random() * 80 + 120, 6);
    }
    const texture = new THREE.CanvasTexture(canvas);
    const screenMat = new THREE.MeshBasicMaterial({ map: texture });
    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.rotation.x = -Math.PI / 2;
    screenMesh.position.y = 0.012;
    tabletGroup.add(screenMesh);

    return tabletGroup;
  }

  createReadingBadgeSprite() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 120;
    this.readingBadgeCanvas = canvas;
    this.readingBadgeCtx = canvas.getContext('2d');
    const texture = new THREE.CanvasTexture(canvas);
    this.readingBadgeTexture = texture;
    const spriteMat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(2.6, 0.65, 1);
    return sprite;
  }

  updateReadingBadge(show, title = '') {
    if (!this.readingBadgeSprite) return;
    if (!show) {
      this.readingBadgeSprite.visible = false;
      return;
    }
    const ctx = this.readingBadgeCtx;
    const w = this.readingBadgeCanvas.width;
    const h = this.readingBadgeCanvas.height;
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(6, 182, 212, 0.9)';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(16, 16, w - 32, h - 32, 28);
    } else {
      ctx.fillRect(16, 16, w - 32, h - 32);
    }
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.font = 'bold 28px Prompt, Sarabun, sans-serif';
    ctx.fillStyle = '#ffffff';
    const displayTitle = title ? (title.length > 16 ? title.substring(0, 15) + '...' : title) : 'นิทรรศการ';
    ctx.fillText(`📖 กำลังชมนิทรรศการ: ${displayTitle}`, w / 2, 70);

    this.readingBadgeTexture.needsUpdate = true;
    this.readingBadgeSprite.visible = true;
  }

  startReading(art) {
    this.isReading = true;
    this.readingArt = art;

    if (this.tabletGroup) {
      this.tabletGroup.visible = true;
    }

    // Pose arms holding the tablet
    this.leftArm.rotation.set(-1.05, 0.35, 0.2);
    this.rightArm.rotation.set(-1.05, -0.35, -0.2);
    this.head.rotation.x = 0.22;

    this.updateReadingBadge(true, art ? art.title : '');

    // Rotate avatar to face the booth
    if (art && art.pos) {
      const dx = art.pos.x - this.position.x;
      const dz = art.pos.z - this.position.z;
      this.avatarGroup.rotation.y = Math.atan2(dx, dz);
    }
  }

  stopReading() {
    if (!this.isReading) return;
    this.isReading = false;
    this.readingArt = null;

    if (this.tabletGroup) {
      this.tabletGroup.visible = false;
    }

    this.leftArm.rotation.set(0, 0, 0);
    this.rightArm.rotation.set(0, 0, 0);
    this.head.rotation.set(0, 0, 0);

    this.updateReadingBadge(false);
  }

  resetKeys() {
    this.keys.forward = false;
    this.keys.backward = false;
    this.keys.left = false;
    this.keys.right = false;
    if (this.joystickVector) {
      this.joystickVector.x = 0;
      this.joystickVector.y = 0;
    }
    if (this.velocity) {
      this.velocity.x = 0;
      this.velocity.z = 0;
    }
  }

  initControls() {
    // Helper to check if active element is text field or select dropdown
    const isTextInputActive = () => {
      const active = document.activeElement;
      if (!active || active === document.body) return false;
      const tag = active.tagName.toLowerCase();
      return (tag === 'input' || tag === 'textarea' || tag === 'select') && active.offsetParent !== null;
    };

    // When window loses focus, reset all movement keys immediately to prevent stuck auto-walking
    window.addEventListener('blur', () => {
      this.resetKeys();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.resetKeys();
      }
    });

    // Click on canvas to blur any stuck inputs and regain keyboard focus
    this.domElement.addEventListener('click', () => {
      if (document.activeElement && document.activeElement !== document.body) {
        if (!document.activeElement.closest('.modal-backdrop.show') && !document.activeElement.closest('#chat-drawer.open')) {
          document.activeElement.blur();
        }
      }
    });

    // Keyboard Listeners (English + Thai Keyboard support)
    window.addEventListener('keydown', (e) => {
      if (isTextInputActive()) return;

      const code = e.code;
      const key = e.key ? e.key.toLowerCase() : '';

      // Forward: W / ArrowUp / Thai 'ไ'
      if (code === 'KeyW' || code === 'ArrowUp' || key === 'w' || key === 'ไ') {
        this.keys.forward = true;
      }
      // Backward: S / ArrowDown / Thai 'ห'
      if (code === 'KeyS' || code === 'ArrowDown' || key === 's' || key === 'ห') {
        this.keys.backward = true;
      }
      // Left: A / ArrowLeft / Thai 'ฟ'
      if (code === 'KeyA' || code === 'ArrowLeft' || key === 'a' || key === 'ฟ') {
        this.keys.left = true;
      }
      // Right: D / ArrowRight / Thai 'ก'
      if (code === 'KeyD' || code === 'ArrowRight' || key === 'd' || key === 'ก') {
        this.keys.right = true;
      }
      // Jump: Space
      if (code === 'Space') {
        if (this.isGrounded) {
          this.velocity.y = this.jumpForce;
          this.isGrounded = false;
        }
      }
      // Toggle Camera Mode: V
      if (code === 'KeyV' || key === 'v' || key === 'อ') {
        this.toggleCameraMode();
      }
    });

    window.addEventListener('keyup', (e) => {
      const code = e.code;
      const key = e.key ? e.key.toLowerCase() : '';

      // Always clear movement on keyup regardless of focus state
      if (code === 'KeyW' || code === 'ArrowUp' || key === 'w' || key === 'ไ') {
        this.keys.forward = false;
      }
      if (code === 'KeyS' || code === 'ArrowDown' || key === 's' || key === 'ห') {
        this.keys.backward = false;
      }
      if (code === 'KeyA' || code === 'ArrowLeft' || key === 'a' || key === 'ฟ') {
        this.keys.left = false;
      }
      if (code === 'KeyD' || code === 'ArrowRight' || key === 'd' || key === 'ก') {
        this.keys.right = false;
      }
    });

    // Mouse Drag Rotation
    this.domElement.addEventListener('mousedown', (e) => {
      if (e.target.closest('#top-hud') || e.target.closest('#bottom-hud') || e.target.closest('.modal-backdrop') || e.target.closest('#chat-drawer') || e.target.closest('#onscreen-dpad')) return;
      this.isMouseDown = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
      this.isMouseDown = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isMouseDown && !this.isPointerLocked) return;

      const movementX = this.isPointerLocked ? e.movementX : (e.clientX - this.lastMouseX);
      const movementY = this.isPointerLocked ? e.movementY : (e.clientY - this.lastMouseY);

      this.cameraYaw -= movementX * 0.003;
      this.cameraPitch -= movementY * 0.003;

      this.cameraPitch = Math.max(-Math.PI / 4, Math.min(Math.PI / 3, this.cameraPitch));

      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    // Touch events for Mobile/Tablet Look (Multi-touch aware for simultaneous D-pad walking)
    this.activeLookTouchId = null;
    this.lastTouchX = 0;
    this.lastTouchY = 0;

    const isTouchOnUI = (touch) => {
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      return el && (
        el.closest('#top-hud') ||
        el.closest('#bottom-hud') ||
        el.closest('.modal-backdrop') ||
        el.closest('#chat-drawer') ||
        el.closest('#onscreen-dpad') ||
        el.closest('#minimap-wrapper') ||
        el.closest('#reaction-menu') ||
        el.closest('#interaction-prompt')
      );
    };

    this.domElement.addEventListener('touchstart', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (this.activeLookTouchId === null && !isTouchOnUI(touch)) {
          this.activeLookTouchId = touch.identifier;
          this.lastTouchX = touch.clientX;
          this.lastTouchY = touch.clientY;
          break;
        }
      }
    }, { passive: true });

    this.domElement.addEventListener('touchmove', (e) => {
      if (this.activeLookTouchId === null) return;
      for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        if (touch.identifier === this.activeLookTouchId) {
          const dx = touch.clientX - this.lastTouchX;
          const dy = touch.clientY - this.lastTouchY;
          this.cameraYaw -= dx * 0.005;
          this.cameraPitch -= dy * 0.005;
          this.cameraPitch = Math.max(-Math.PI / 4, Math.min(Math.PI / 3, this.cameraPitch));
          this.lastTouchX = touch.clientX;
          this.lastTouchY = touch.clientY;
          break;
        }
      }
    }, { passive: true });

    const endTouchLook = (e) => {
      if (this.activeLookTouchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.activeLookTouchId) {
          this.activeLookTouchId = null;
          break;
        }
      }
    };

    this.domElement.addEventListener('touchend', endTouchLook, { passive: true });
    this.domElement.addEventListener('touchcancel', endTouchLook, { passive: true });
  }

  toggleCameraMode() {
    if (this.cameraMode === 'third_person') {
      this.cameraMode = 'first_person';
      this.avatarGroup.visible = false;
    } else {
      this.cameraMode = 'third_person';
      this.avatarGroup.visible = true;
    }
  }

  update(delta, colliders) {
    const moveDir = new THREE.Vector3();

    if (this.keys.forward) moveDir.z -= 1;
    if (this.keys.backward) moveDir.z += 1;
    if (this.keys.left) moveDir.x -= 1;
    if (this.keys.right) moveDir.x += 1;

    // Mobile/On-screen Joystick input
    if (this.joystickVector.x !== 0 || this.joystickVector.y !== 0) {
      moveDir.x = this.joystickVector.x;
      moveDir.z = this.joystickVector.y;
    }

    const isMoving = moveDir.lengthSq() > 0.001;

    // If moving while in reading mode, automatically exit reading
    if (this.isReading && isMoving) {
      this.stopReading();
      if (window.spatialUI) {
        window.spatialUI.closeModal('artwork-inspector-modal');
      }
    }

    if (isMoving && !this.isReading) {
      moveDir.normalize();

      const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraYaw);
      const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraYaw);

      const worldMove = new THREE.Vector3()
        .addScaledVector(right, moveDir.x)
        .addScaledVector(forward, -moveDir.z)
        .multiplyScalar(this.speed * delta);

      // Collision checks with walls
      const nextPos = this.position.clone().add(worldMove);
      if (!this.checkCollisions(nextPos, colliders)) {
        this.position.copy(nextPos);
      } else {
        // Slide on X
        const slideX = this.position.clone().add(new THREE.Vector3(worldMove.x, 0, 0));
        if (!this.checkCollisions(slideX, colliders)) {
          this.position.copy(slideX);
        } else {
          // Slide on Z
          const slideZ = this.position.clone().add(new THREE.Vector3(0, 0, worldMove.z));
          if (!this.checkCollisions(slideZ, colliders)) {
            this.position.copy(slideZ);
          }
        }
      }

      const targetAngle = Math.atan2(worldMove.x, worldMove.z);
      this.avatarGroup.rotation.y = targetAngle;

      this.walkCycle += delta * 10;
      const legAngle = Math.sin(this.walkCycle) * 0.45;
      this.leftLeg.rotation.x = legAngle;
      this.rightLeg.rotation.x = -legAngle;
      this.leftArm.rotation.x = -legAngle;
      this.rightArm.rotation.x = legAngle;
    } else if (this.isReading) {
      // Gentle breathing idle while holding tablet & reading
      this.readingBreathCycle += delta * 2;
      const breath = Math.sin(this.readingBreathCycle) * 0.025;
      this.leftArm.rotation.x = -1.05 + breath;
      this.rightArm.rotation.x = -1.05 + breath;
      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;
    } else {
      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;
      this.leftArm.rotation.x = 0;
      this.rightArm.rotation.x = 0;
    }

    // Gravity & Jump
    if (!this.isGrounded) {
      this.velocity.y -= this.gravity * delta;
      this.position.y += this.velocity.y * delta;

      if (this.position.y <= 0) {
        this.position.y = 0;
        this.velocity.y = 0;
        this.isGrounded = true;
      }
    }

    this.avatarGroup.position.copy(this.position);

    // Camera follow (Cinematic Reading Perspective or Standard Gameplay)
    if (this.isReading) {
      // Cinematic 3rd-person reading view: Avatar visible on the left, looking at glowing booth
      const facingAngle = this.avatarGroup.rotation.y;
      const camDist = 3.6;
      const camHeight = 1.95;
      const rightShift = 0.95;

      const camX = this.position.x - Math.sin(facingAngle) * camDist + Math.cos(facingAngle) * rightShift;
      const camZ = this.position.z - Math.cos(facingAngle) * camDist - Math.sin(facingAngle) * rightShift;
      const camY = this.position.y + camHeight;

      this.camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.12);

      const targetLookX = this.position.x + Math.sin(facingAngle) * 1.8;
      const targetLookZ = this.position.z + Math.cos(facingAngle) * 1.8;
      const targetLookY = this.position.y + 1.6;
      this.camera.lookAt(targetLookX, targetLookY, targetLookZ);
    } else if (this.cameraMode === 'first_person') {
      this.camera.position.set(this.position.x, this.position.y + 1.8, this.position.z);
      this.camera.rotation.set(0, 0, 0);
      this.camera.rotation.y = this.cameraYaw;
      this.camera.rotation.x = this.cameraPitch;
    } else {
      const offset = new THREE.Vector3(
        0,
        Math.sin(this.cameraPitch) * this.cameraDistance + 1.8,
        Math.cos(this.cameraPitch) * this.cameraDistance
      ).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraYaw);

      const targetCamPos = this.position.clone().add(offset);
      this.camera.position.lerp(targetCamPos, 0.25);
      this.camera.lookAt(this.position.x, this.position.y + 1.5, this.position.z);
    }
  }

  checkCollisions(pos, colliders) {
    // Outer boundaries
    if (pos.x < -36 || pos.x > 36 || pos.z < -36 || pos.z > 36) {
      // Sky terrace at North doorway
      if (pos.z < -36 && pos.z > -48 && Math.abs(pos.x) < 9) {
        return false;
      }
      return true;
    }

    const playerRadius = 0.45;
    // Check collision box strictly above floor level (y + 0.2 to y + 1.8)
    const pBox = new THREE.Box3(
      new THREE.Vector3(pos.x - playerRadius, pos.y + 0.2, pos.z - playerRadius),
      new THREE.Vector3(pos.x + playerRadius, pos.y + 1.8, pos.z + playerRadius)
    );

    for (const c of colliders) {
      if (c.type === 'box') {
        if (pBox.intersectsBox(c.box)) return true;
      } else if (c.type === 'cylinder') {
        const dx = pos.x - c.x;
        const dz = pos.z - c.z;
        const distSq = dx * dx + dz * dz;
        const minDist = c.radius + playerRadius;
        if (distSq < minDist * minDist) return true;
      }
    }
    return false;
  }
}

window.MetaversePlayer = MetaversePlayer;
