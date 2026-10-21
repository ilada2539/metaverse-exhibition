/**
 * SPATIAL METAVERSE - CLASSROOM 3D WORLD BUILDER
 * โรงเรียนพัฒนานิคม (Phatthananikhom School)
 * Generates an authentic Thai School Classroom:
 * - Polished Wood Parquet Classroom Floor
 * - School Classroom Walls with Sunny Windows looking at campus trees
 * - Front Blackboard, Teacher Desk & Smart Multimedia Projector Screen
 * - Sacred Triad Symbols: National Flag, Religion Symbol, King ("ชาติ ศาสนา พระมหากษัตริย์")
 * - 4 Rows of Wooden Student Desks & Blue Steel Frame Chairs
 * - Classroom Clock, Fans, and Bulletin Corkboard for Sticky Notes
 * - 8 Student Group Exhibition Project Boards around classroom walls
 */

class MetaverseWorld {
  constructor(scene) {
    this.scene = scene;
    this.colliders = [];
    this.artFrames = [];
    this.rotatables = [];
    this.studentDesks = [];
    this.auditoriumScreen = null;
    this.stickyWall = null;
    this.clockHands = null;

    this.currentRoomInfo = {
      id: '1',
      name: 'ห้อง 1: ศาสนาพุทธ',
      icon: '☸️',
      title: 'นิทรรศการศาสนาพุทธ (Buddhism)',
      color: '#f59e0b'
    };

    // User-designated 5 Religion Projector Image Mapping:
    // ห้องศาสนาคริสต์ -> รูปที่ 1 (christianity.jpg)
    // ห้องศาสนายูดาย์ -> รูปที่ 2 (judaism.jpg)
    // ห้องศาสนาพุทธ -> รูปที่ 3 (buddhism.jpg)
    // ห้องศาสนาพราหมณ์-ฮินดู -> รูปที่ 4 (hinduism.jpg)
    // ห้องศาสนาอิสลาม -> รูปที่ 5 (islam.jpg)
    this.religionImageMap = {
      '1': { id: '1', key: 'buddhism', name: 'ศาสนาพุทธ', file: 'assets/images/buddhism.jpg', imgNum: 3, label: 'รูปที่ 3: ศาสนาพุทธ' },
      '2': { id: '2', key: 'christianity', name: 'ศาสนาคริสต์', file: 'assets/images/christianity.jpg', imgNum: 1, label: 'รูปที่ 1: ศาสนาคริสต์' },
      '3': { id: '3', key: 'hinduism', name: 'ศาสนาพราหมณ์-ฮินดู', file: 'assets/images/hinduism.jpg', imgNum: 4, label: 'รูปที่ 4: ศาสนาพราหมณ์-ฮินดู' },
      '4': { id: '4', key: 'islam', name: 'ศาสนาอิสลาม', file: 'assets/images/islam.jpg', imgNum: 5, label: 'รูปที่ 5: ศาสนาอิสลาม' },
      '5': { id: '5', key: 'judaism', name: 'ศาสนายูดาย์', file: 'assets/images/judaism.jpg', imgNum: 2, label: 'รูปที่ 2: ศาสนายูดาย์' }
    };
    this.loadedReligionImages = {};
    this.preloadReligionImages();

    this.init();
  }

  preloadReligionImages() {
    Object.keys(this.religionImageMap).forEach((id) => {
      const data = this.religionImageMap[id];
      const img = new Image();
      img.src = data.file;
      img.onload = () => {
        this.loadedReligionImages[id] = img;
        const currentId = String(this.currentRoomInfo?.id || '1');
        if (currentId === id && this.screenCanvas && this.screenCtx) {
          this.drawWelcomeScreen();
        }
      };
      img.onerror = (e) => {
        console.warn(`Could not load religion image for room ${id} (${data.file})`, e);
      };
    });
  }

  init() {
    this.buildLighting();
    this.buildSky();
    this.buildFloors();
    this.buildWalls();
    this.buildClassroomFront(); // Blackboard, Teacher Podium & Smart Projector Screen
    this.buildStudentDesks();    // Rows of wooden student desks & chairs
    this.buildStickyWall();      // Classroom corkboard bulletin board
    this.buildDecorations();     // Classroom clock, Thai flag, educational banners, plants
    this.initReligionTheme();    // Dynamic religious monuments, statues & wall murals
  }

  // 1. Natural Bright Classroom Daytime Lighting
  buildLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.82);
    this.scene.add(ambientLight);

    // Warm Sun streaming through classroom windows
    const sunLight = new THREE.DirectionalLight(0xfffaed, 0.95);
    sunLight.position.set(-25, 35, 10);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 120;
    sunLight.shadow.camera.left = -40;
    sunLight.shadow.camera.right = 40;
    sunLight.shadow.camera.top = 40;
    sunLight.shadow.camera.bottom = -40;
    sunLight.shadow.bias = -0.0005;
    this.scene.add(sunLight);

    // Soft sky daylight bounce
    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 0.45);
    fillLight.position.set(20, 25, -15);
    this.scene.add(fillLight);
  }

  // 2. Daytime Blue Sky & Campus Horizon
  buildSky() {
    const skyGeo = new THREE.SphereGeometry(150, 32, 15);
    const skyMat = new THREE.MeshBasicMaterial({
      color: 0x60a5fa, // Bright cheerful school day blue
      side: THREE.BackSide
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(sky);

    // Distant school campus tree line / hill horizon
    const horizonGeo = new THREE.CylinderGeometry(140, 140, 35, 32, 1, true);
    const horizonCanvas = document.createElement('canvas');
    horizonCanvas.width = 1024;
    horizonCanvas.height = 256;
    const hctx = horizonCanvas.getContext('2d');
    hctx.fillStyle = '#60a5fa';
    hctx.fillRect(0, 0, 1024, 256);
    // Green trees on horizon
    hctx.fillStyle = '#15803d';
    for (let x = 0; x < 1024; x += 40) {
      hctx.beginPath();
      hctx.arc(x + 20, 200, 35, 0, Math.PI * 2);
      hctx.fill();
    }
    hctx.fillStyle = '#166534';
    hctx.fillRect(0, 200, 1024, 56);
    const horizonTex = new THREE.CanvasTexture(horizonCanvas);
    horizonTex.wrapS = THREE.RepeatWrapping;
    horizonTex.repeat.set(4, 1);
    const horizonMat = new THREE.MeshBasicMaterial({
      map: horizonTex,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.9
    });
    const horizon = new THREE.Mesh(horizonGeo, horizonMat);
    horizon.position.y = 10;
    this.scene.add(horizon);
  }

  // 3. Warm Polished Classroom Wood Parquet Floor
  buildFloors() {
    const floorCanvas = document.createElement('canvas');
    floorCanvas.width = 512;
    floorCanvas.height = 512;
    const fctx = floorCanvas.getContext('2d');

    // Base warm wood tone
    fctx.fillStyle = '#c28d54';
    fctx.fillRect(0, 0, 512, 512);

    // Parquet tile slats pattern
    const slatW = 128;
    const slatH = 32;
    for (let x = 0; x < 512; x += slatW) {
      for (let y = 0; y < 512; y += slatH) {
        const isAlt = ((x / slatW) + (y / slatH)) % 2 === 0;
        fctx.fillStyle = isAlt ? '#b47b48' : '#cd9b64';
        fctx.fillRect(x + 1, y + 1, slatW - 2, slatH - 2);

        // Wood grain streaks
        fctx.strokeStyle = 'rgba(120, 53, 15, 0.18)';
        fctx.lineWidth = 1;
        fctx.beginPath();
        fctx.moveTo(x + 5, y + 16);
        fctx.lineTo(x + slatW - 5, y + 16);
        fctx.stroke();
      }
    }

    // Classroom floor tile grid borders
    fctx.strokeStyle = '#78350f';
    fctx.lineWidth = 2;
    fctx.strokeRect(0, 0, 512, 512);

    const floorTexture = new THREE.CanvasTexture(floorCanvas);
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(16, 16);

    const floorGeo = new THREE.PlaneGeometry(80, 80);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.45,
      metalness: 0.15
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);
  }

  // 4. Authentic School Classroom Walls & Windows
  buildWalls() {
    // Upper soft cream classroom wall
    const wallUpperMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.8
    });

    // Lower classroom blue wainscot
    const wainscotMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Classic Thai school light navy / cyan
      roughness: 0.5
    });

    // Wooden wainscot trim divider
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0x78350f,
      roughness: 0.3
    });

    const wallH = 8.5;
    const wallThick = 1;

    const createClassroomWall = (x, z, w, d, name) => {
      const group = new THREE.Group();
      group.position.set(x, 0, z);

      // Lower Wainscot (y = 0 to 1.3)
      const lowerGeo = new THREE.BoxGeometry(w, 1.3, d);
      const lowerMesh = new THREE.Mesh(lowerGeo, wainscotMat);
      lowerMesh.position.y = 0.65;
      lowerMesh.receiveShadow = true;
      group.add(lowerMesh);

      // Trim line
      const trimGeo = new THREE.BoxGeometry(w + (w > d ? 0.05 : 0), 0.1, d + (d > w ? 0.05 : 0));
      const trimMesh = new THREE.Mesh(trimGeo, trimMat);
      trimMesh.position.y = 1.35;
      group.add(trimMesh);

      // Upper Wall (y = 1.4 to 8.5)
      const upperGeo = new THREE.BoxGeometry(w, wallH - 1.4, d);
      const upperMesh = new THREE.Mesh(upperGeo, wallUpperMat);
      upperMesh.position.y = 1.4 + (wallH - 1.4) / 2;
      upperMesh.receiveShadow = true;
      upperMesh.castShadow = true;
      group.add(upperMesh);

      group.name = name || 'classroom_wall';
      this.scene.add(group);

      const box = new THREE.Box3().setFromObject(group);
      this.colliders.push({ type: 'box', box: box });
      return group;
    };

    // Outer Classroom Walls
    createClassroomWall(0, -38, 76, wallThick, 'wall_back');
    createClassroomWall(-22, 38, 32, wallThick, 'wall_front_left');
    createClassroomWall(22, 38, 32, wallThick, 'wall_front_right');
    createClassroomWall(-38, 0, wallThick, 76, 'wall_left_windows');
    createClassroomWall(38, 0, wallThick, 76, 'wall_right_windows');

    // Classroom Ceiling with Acoustic Panels
    const ceilingGeo = new THREE.BoxGeometry(76, 0.4, 76);
    const ceilingMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.9 });
    const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.position.set(0, wallH, 0);
    this.scene.add(ceiling);

    // Large Classroom Window Panes looking out at trees
    this.buildClassroomWindows(-37.4, 'left');
    this.buildClassroomWindows(37.4, 'right');

    // Classroom Exhibition Partition Walls (mounted with the 8 booths)
    createClassroomWall(-16, -20, 0.8, 18, 'partition_exhibition_left');
    createClassroomWall(16, -20, 0.8, 18, 'partition_exhibition_right');
    createClassroomWall(-20, 10, 25, 0.8, 'partition_study_left');
    createClassroomWall(20, 10, 25, 0.8, 'partition_study_right');
  }

  // Windows with Sunlight Glass Panes
  buildClassroomWindows(wallX, side) {
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.35,
      roughness: 0.1
    });

    const frameMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });

    const zPositions = [-28, -14, 0, 14, 28];
    zPositions.forEach(z => {
      const winW = 7;
      const winH = 4.2;

      // Glass pane
      const glassGeo = new THREE.PlaneGeometry(winW, winH);
      const glass = new THREE.Mesh(glassGeo, glassMat);
      glass.position.set(wallX, 4.2, z);
      glass.rotation.y = side === 'left' ? Math.PI / 2 : -Math.PI / 2;
      this.scene.add(glass);

      // Window Frame
      const frameGeo = new THREE.BoxGeometry(0.2, winH + 0.3, winW + 0.3);
      const frame = new THREE.Mesh(frameGeo, frameMat);
      frame.position.set(wallX, 4.2, z);
      this.scene.add(frame);
    });
  }

  // 5. Front of the Classroom: Blackboard, Sacred Triad & Interactive Smart Projector Screen
  buildClassroomFront() {
    const frontGroup = new THREE.Group();

    // A. Classroom Stage / Podium Platform
    const stageGeo = new THREE.BoxGeometry(26, 0.5, 10);
    const stageMat = new THREE.MeshStandardMaterial({ color: 0xb47b48, roughness: 0.5 });
    const stage = new THREE.Mesh(stageGeo, stageMat);
    stage.position.set(0, 0.25, 27);
    stage.receiveShadow = true;
    frontGroup.add(stage);

    // B. Classroom Blackboard Frame (Huge chalkboard behind the smart screen)
    const boardW = 24;
    const boardH = 7.5;
    const boardFrameGeo = new THREE.BoxGeometry(boardW + 0.4, boardH + 0.4, 0.2);
    const boardFrameMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.3 });
    const boardFrame = new THREE.Mesh(boardFrameGeo, boardFrameMat);
    boardFrame.position.set(0, 4.5, 31.95);
    frontGroup.add(boardFrame);

    // Chalkboard surface (Deep green classroom chalkboard)
    const chalkGeo = new THREE.PlaneGeometry(boardW, boardH);
    const chalkCanvas = document.createElement('canvas');
    chalkCanvas.width = 1024;
    chalkCanvas.height = 320;
    const cctx = chalkCanvas.getContext('2d');
    cctx.fillStyle = '#143525'; // Classic green chalkboard
    cctx.fillRect(0, 0, 1024, 320);

    // Sacred Triad Banner: ชาติ ศาสนา พระมหากษัตริย์
    cctx.fillStyle = '#fef08a';
    cctx.font = 'bold 28px Prompt, Sarabun, sans-serif';
    cctx.textAlign = 'center';
    cctx.fillText('🇹🇭 ชาติ   •   ☸️ ศาสนา   •   👑 พระมหากษัตริย์', 512, 45);

    cctx.fillStyle = '#ffffff';
    cctx.font = 'bold 36px Prompt, Sarabun, sans-serif';
    cctx.fillText('🏫 ห้องเรียนสังคมศึกษา ศาสนา และวัฒนธรรม • โรงเรียนพัฒนานิคม', 512, 95);

    cctx.fillStyle = '#94a3b8';
    cctx.font = '22px Prompt, Sarabun, sans-serif';
    cctx.fillText('นิทรรศการเสมือนจริง 5 ศาสนาสากล (พุทธ • คริสต์ • ฮินดู • อิสลาม • ยูดาห์)', 512, 135);

    const chalkTex = new THREE.CanvasTexture(chalkCanvas);
    this.chalkCanvas = chalkCanvas;
    this.chalkCtx = cctx;
    this.chalkTex = chalkTex;
    const chalkMat = new THREE.MeshBasicMaterial({ map: chalkTex });
    const chalkMesh = new THREE.Mesh(chalkGeo, chalkMat);
    chalkMesh.position.set(0, 4.5, 31.85);
    chalkMesh.rotation.y = Math.PI;
    frontGroup.add(chalkMesh);

    // Chalk tray with chalk pieces
    const trayGeo = new THREE.BoxGeometry(boardW, 0.1, 0.35);
    const trayMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
    const tray = new THREE.Mesh(trayGeo, trayMat);
    tray.position.set(0, 0.8, 31.7);
    frontGroup.add(tray);

    // C. Giant Interactive Multimedia Projector Screen (จอโปรเจกเตอร์ห้องเรียน)
    const screenW = 17;
    const screenH = 9.2;
    const screenGeo = new THREE.PlaneGeometry(screenW, screenH);

    const screenCanvas = document.createElement('canvas');
    screenCanvas.width = 1920;
    screenCanvas.height = 1080;
    this.screenCanvas = screenCanvas;
    this.screenCtx = screenCanvas.getContext('2d');
    this.drawWelcomeScreen();

    this.screenTexture = new THREE.CanvasTexture(screenCanvas);
    const screenMat = new THREE.MeshBasicMaterial({
      map: this.screenTexture,
      side: THREE.DoubleSide
    });

    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.position.set(0, 5.2, 31.6);
    screenMesh.rotation.y = Math.PI;
    frontGroup.add(screenMesh);
    this.auditoriumScreen = screenMesh;

    // Projector Screen White Frame
    const screenBorderGeo = new THREE.BoxGeometry(screenW + 0.3, screenH + 0.3, 0.15);
    const screenBorderMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 });
    const screenBorder = new THREE.Mesh(screenBorderGeo, screenBorderMat);
    screenBorder.position.set(0, 5.2, 31.68);
    frontGroup.add(screenBorder);

    // D. Teacher's Desk & Station (โต๊ะครูผู้สอน โรงเรียนพัฒนานิคม)
    this.buildTeacherDesk(frontGroup);

    this.scene.add(frontGroup);
  }

  // Teacher's Desk with Laptop, Microphone & Textbooks
  buildTeacherDesk(parentGroup) {
    const deskGroup = new THREE.Group();
    deskGroup.position.set(8.5, 0.5, 24);

    // Wood Desk Table
    const topGeo = new THREE.BoxGeometry(3.2, 0.12, 1.6);
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.4 });
    const top = new THREE.Mesh(topGeo, woodMat);
    top.position.y = 1.2;
    deskGroup.add(top);

    const legGeo = new THREE.BoxGeometry(0.12, 1.2, 0.12);
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
    const legPositions = [
      [-1.5, 0.6, -0.7], [1.5, 0.6, -0.7],
      [-1.5, 0.6, 0.7], [1.5, 0.6, 0.7]
    ];
    legPositions.forEach(p => {
      const leg = new THREE.Mesh(legGeo, steelMat);
      leg.position.set(p[0], p[1], p[2]);
      deskGroup.add(leg);
    });

    // Teacher Laptop
    const laptopBaseGeo = new THREE.BoxGeometry(0.6, 0.03, 0.45);
    const laptopMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 });
    const laptopBase = new THREE.Mesh(laptopBaseGeo, laptopMat);
    laptopBase.position.set(0, 1.28, 0);
    deskGroup.add(laptopBase);

    const laptopScreenGeo = new THREE.BoxGeometry(0.6, 0.4, 0.03);
    const laptopScreen = new THREE.Mesh(laptopScreenGeo, laptopMat);
    laptopScreen.position.set(0, 1.48, -0.2);
    laptopScreen.rotation.x = 0.2;
    deskGroup.add(laptopScreen);

    // Teacher Desk Sign: "คุณครูผู้สอน โรงเรียนพัฒนานิคม"
    const signGeo = new THREE.PlaneGeometry(1.2, 0.35);
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 512;
    signCanvas.height = 140;
    const sctx = signCanvas.getContext('2d');
    sctx.fillStyle = '#0f172a';
    sctx.fillRect(0, 0, 512, 140);
    sctx.strokeStyle = '#f59e0b';
    sctx.lineWidth = 4;
    sctx.strokeRect(4, 4, 504, 132);
    sctx.fillStyle = '#fef08a';
    sctx.font = 'bold 30px Prompt, Sarabun, sans-serif';
    sctx.textAlign = 'center';
    sctx.fillText('👑 โต๊ะครูผู้สอน', 256, 50);
    sctx.fillStyle = '#ffffff';
    sctx.font = 'bold 24px Prompt, Sarabun, sans-serif';
    sctx.fillText('โรงเรียนพัฒนานิคม', 256, 95);
    const signTex = new THREE.CanvasTexture(signCanvas);
    const signMat = new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide });
    const signMesh = new THREE.Mesh(signGeo, signMat);
    signMesh.position.set(0, 1.35, 0.81);
    deskGroup.add(signMesh);

    parentGroup.add(deskGroup);
    this.colliders.push({ type: 'box', box: new THREE.Box3().setFromObject(deskGroup) });
  }

  // 6. Real Classroom Student Desks & Chairs (4 Columns x 3 Rows)
  buildStudentDesks() {
    const deskMat = new THREE.MeshStandardMaterial({ color: 0xc28d54, roughness: 0.4 });
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e40af, roughness: 0.3 }); // Blue steel school frame
    const seatMat = new THREE.MeshStandardMaterial({ color: 0xb47b48, roughness: 0.5 });

    const createStudentDeskSet = (x, z) => {
      const setGroup = new THREE.Group();
      setGroup.position.set(x, 0, z);

      // Desk Top (Wooden)
      const topGeo = new THREE.BoxGeometry(1.8, 0.08, 1.1);
      const top = new THREE.Mesh(topGeo, deskMat);
      top.position.y = 1.15;
      setGroup.add(top);

      // Book Tray Underneath
      const trayGeo = new THREE.BoxGeometry(1.6, 0.04, 0.9);
      const tray = new THREE.Mesh(trayGeo, frameMat);
      tray.position.y = 0.95;
      setGroup.add(tray);

      // Steel Legs
      const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.15, 12);
      const l1 = new THREE.Mesh(legGeo, frameMat); l1.position.set(-0.8, 0.58, -0.45); setGroup.add(l1);
      const l2 = new THREE.Mesh(legGeo, frameMat); l2.position.set(0.8, 0.58, -0.45); setGroup.add(l2);
      const l3 = new THREE.Mesh(legGeo, frameMat); l3.position.set(-0.8, 0.58, 0.45); setGroup.add(l3);
      const l4 = new THREE.Mesh(legGeo, frameMat); l4.position.set(0.8, 0.58, 0.45); setGroup.add(l4);

      // Student Chair behind desk
      const chairGroup = new THREE.Group();
      chairGroup.position.set(0, 0, -0.85);

      const seatGeo = new THREE.BoxGeometry(0.9, 0.06, 0.8);
      const seat = new THREE.Mesh(seatGeo, seatMat);
      seat.position.y = 0.65;
      chairGroup.add(seat);

      const backGeo = new THREE.BoxGeometry(0.9, 0.5, 0.06);
      const back = new THREE.Mesh(backGeo, seatMat);
      back.position.set(0, 1.05, -0.38);
      chairGroup.add(back);

      const chairLegGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.65, 8);
      const cl1 = new THREE.Mesh(chairLegGeo, frameMat); cl1.position.set(-0.4, 0.32, -0.35); chairGroup.add(cl1);
      const cl2 = new THREE.Mesh(chairLegGeo, frameMat); cl2.position.set(0.4, 0.32, -0.35); chairGroup.add(cl2);
      const cl3 = new THREE.Mesh(chairLegGeo, frameMat); cl3.position.set(-0.4, 0.32, 0.35); chairGroup.add(cl3);
      const cl4 = new THREE.Mesh(chairLegGeo, frameMat); cl4.position.set(0.4, 0.32, 0.35); chairGroup.add(cl4);

      setGroup.add(chairGroup);

      // Student Textbooks on desk
      const bookGeo = new THREE.BoxGeometry(0.45, 0.05, 0.6);
      const bookMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 });
      const book = new THREE.Mesh(bookGeo, bookMat);
      book.position.set(Math.random() * 0.4 - 0.2, 1.21, Math.random() * 0.2 - 0.1);
      setGroup.add(book);

      this.scene.add(setGroup);
      this.colliders.push({ type: 'box', box: new THREE.Box3().setFromObject(setGroup) });
      this.studentDesks.push(setGroup);
    };

    // 4 Columns x 3 Rows of Desks (leaving central aisle and side aisles wide open)
    const cols = [-9.5, -3.5, 3.5, 9.5];
    const rows = [-8, 0, 8];

    cols.forEach(x => {
      rows.forEach(z => {
        createStudentDeskSet(x, z);
      });
    });
  }

  // 7. Classroom Bulletin Corkboard for Sticky Notes
  buildStickyWall() {
    const wallGeo = new THREE.BoxGeometry(0.3, 4.2, 10);
    // Corkboard texture
    const corkMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.9 });
    const wall = new THREE.Mesh(wallGeo, corkMat);
    wall.position.set(-37, 2.8, 0);
    this.scene.add(wall);
    this.stickyWall = wall;

    // Wood frame around corkboard
    const frameGeo = new THREE.BoxGeometry(0.35, 4.4, 10.2);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.4 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.set(-37.05, 2.8, 0);
    this.scene.add(frame);

    const sign = this.createPlacard('📝 บอร์ดแปะบันทึกข้อความ & ความรู้สึก (Post-it) • ร.ร.พัฒนานิคม', -36.7, 5.2, 0, Math.PI / 2);
    this.scene.add(sign);
  }

  // 8. Classroom Clock, School Motto & Indoor Plants
  buildDecorations() {
    // A. Classroom Wall Clock at front of room
    const clockGroup = new THREE.Group();
    clockGroup.position.set(8.5, 7.2, 31.7);

    const clockRimGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.15, 32);
    const clockRimMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
    const clockRim = new THREE.Mesh(clockRimGeo, clockRimMat);
    clockRim.rotation.x = Math.PI / 2;
    clockGroup.add(clockRim);

    const clockFaceCanvas = document.createElement('canvas');
    clockFaceCanvas.width = 256;
    clockFaceCanvas.height = 256;
    const clkCtx = clockFaceCanvas.getContext('2d');
    clkCtx.fillStyle = '#ffffff';
    clkCtx.fillRect(0, 0, 256, 256);
    clkCtx.fillStyle = '#0f172a';
    clkCtx.font = 'bold 32px sans-serif';
    clkCtx.textAlign = 'center';
    clkCtx.fillText('12', 128, 45);
    clkCtx.fillText('3', 225, 138);
    clkCtx.fillText('6', 128, 230);
    clkCtx.fillText('9', 35, 138);
    // Clock hands at 10:10
    clkCtx.strokeStyle = '#0f172a';
    clkCtx.lineWidth = 6;
    clkCtx.beginPath();
    clkCtx.moveTo(128, 128);
    clkCtx.lineTo(80, 80);
    clkCtx.moveTo(128, 128);
    clkCtx.lineTo(180, 90);
    clkCtx.stroke();

    const clockTex = new THREE.CanvasTexture(clockFaceCanvas);
    const clockFaceGeo = new THREE.PlaneGeometry(1.6, 1.6);
    const clockFaceMat = new THREE.MeshBasicMaterial({ map: clockTex });
    const clockFace = new THREE.Mesh(clockFaceGeo, clockFaceMat);
    clockFace.position.z = -0.09;
    clockFace.rotation.y = Math.PI;
    clockGroup.add(clockFace);
    this.scene.add(clockGroup);

    // B. Classroom Motto Banner
    const bannerSign = this.createPlacard('🎓 "ความรู้คู่คุณธรรม นำสังคมพัฒนา" • โรงเรียนพัฒนานิคม', 0, 7.8, -37.4, 0);
    this.scene.add(bannerSign);

    // C. Potted Green Plants in classroom corners
    const createClassroomPlant = (x, z) => {
      const potGeo = new THREE.CylinderGeometry(0.5, 0.35, 0.8, 16);
      const potMat = new THREE.MeshStandardMaterial({ color: 0x334155 });
      const pot = new THREE.Mesh(potGeo, potMat);
      pot.position.set(x, 0.4, z);
      this.scene.add(pot);

      const leafGeo = new THREE.DodecahedronGeometry(0.65, 1);
      const leafMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.8 });
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.set(x, 1.05, z);
      this.scene.add(leaf);

      this.colliders.push({ type: 'cylinder', x: x, z: z, radius: 0.6 });
    };

    createClassroomPlant(-14, 8);
    createClassroomPlant(14, 8);
    createClassroomPlant(-35, 35);
    createClassroomPlant(35, 35);
  }

  createPlacard(text, x, y, z, rotY) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 140;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1024, 140);
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, 1012, 128);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Prompt, Sarabun, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, 512, 85);

    const texture = new THREE.CanvasTexture(canvas);
    const geo = new THREE.PlaneGeometry(3.6, 0.5);
    const mat = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.rotation.y = rotY || 0;
    return mesh;
  }

  // =========================================================================
  // PRESENTATION SLIDES ON CLASSROOM SMART PROJECTOR SCREEN
  // =========================================================================
  drawWelcomeScreen(roomInfo) {
    if (roomInfo) this.currentRoomInfo = roomInfo;
    const info = this.currentRoomInfo;
    const roomId = String(info?.id || '1');

    if (!this.screenCanvas || !this.screenCtx) return;
    const ctx = this.screenCtx;
    const w = this.screenCanvas.width;
    const h = this.screenCanvas.height;

    // Reset composite operation & alpha
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = 'source-over';

    const img = this.loadedReligionImages[roomId];
    const item = this.religionImageMap[roomId];

    if (img && img.complete && img.naturalWidth > 0) {
      // Clear canvas
      ctx.clearRect(0, 0, w, h);

      // Draw designated 16:9 widescreen presentation slide directly on projector screen
      ctx.drawImage(img, 0, 0, w, h);

      // Subtle projector bezel frame
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, w - 4, h - 4);
    } else {
      // Fallback while image is loading
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#090d16');
      grad.addColorStop(0.5, '#1e293b');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = info.color || '#38bdf8';
      ctx.font = 'bold 56px Prompt, Sarabun, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${info.icon} ${info.title || info.name}`, w / 2, h / 2 - 20);

      ctx.fillStyle = '#f8fafc';
      ctx.font = '28px Prompt, Sarabun, sans-serif';
      ctx.fillText(`โรงเรียนพัฒนานิคม • กำลังฉายภาพสไลด์ประจำห้อง (${item ? item.label : info.name})...`, w / 2, h / 2 + 40);

      if (item && (!img || !img.src)) {
        const newImg = new Image();
        newImg.src = item.file;
        newImg.onload = () => {
          this.loadedReligionImages[roomId] = newImg;
          this.drawWelcomeScreen();
        };
      }
    }

    if (this.screenTexture) this.screenTexture.needsUpdate = true;
  }

  // Draw Specific Exhibition Artwork Slides onto Classroom Projector Screen
  drawClassroomSlideForArtwork(art) {
    if (!this.screenCanvas || !this.screenCtx) return;
    const ctx = this.screenCtx;
    const w = this.screenCanvas.width;
    const h = this.screenCanvas.height;
    const room = this.currentRoomInfo;
    const color = art.isEmpty ? (room.color || '#38bdf8') : (art.themeColor || room.color || '#06b6d4');

    // Slide Background
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#090d16');
    grad.addColorStop(0.5, '#1e293b');
    grad.addColorStop(1, '#020617');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Top Header Ribbon
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, 32);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Prompt, Sarabun, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`🏫 โรงเรียนพัฒนานิคม • ${room.name}`, 80, 85);

    ctx.fillStyle = '#fbbf24';
    ctx.textAlign = 'right';
    ctx.fillText(`📍 บอร์ดที่ ${art.boothNumber} • กำลังฉายขึ้นจอโปรเจกเตอร์หลัก`, w - 80, 85);

    // Main Slide Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 64px Prompt, Sarabun, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(art.title, 80, 180);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '28px Prompt, Sarabun, sans-serif';
    ctx.fillText(`ผู้จัดทำ: ${art.creator} (${art.schoolClass || 'โรงเรียนพัฒนานิคม'}) • หมวดหมู่: ${art.category}`, 80, 230);

    // Left Panel: Infographic & Diagram Card
    const cardW = (w - 200) / 2;
    const cardH = 680;
    const cardY = 270;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(80, cardY, cardW, cardH, 20);
    } else {
      ctx.fillRect(80, cardY, cardW, cardH);
    }
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.font = 'bold 36px Prompt, Sarabun, sans-serif';
    ctx.fillText(`📊 แผนผังแนวคิดและเนื้อหาสำคัญ:`, 110, cardY + 60);

    ctx.fillStyle = '#f8fafc';
    ctx.font = '28px Prompt, Sarabun, sans-serif';
    this.wrapText(ctx, art.concept, 110, cardY + 130, cardW - 60, 44);

    // Right Panel: Attached Presentation Slide Details
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(100 + cardW, cardY, cardW, cardH, 20);
    } else {
      ctx.fillRect(100 + cardW, cardY, cardW, cardH);
    }
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 36px Prompt, Sarabun, sans-serif';
    ctx.fillText(`📄 สไลด์นำเสนอ & เอกสารประกอบ:`, 130 + cardW, cardY + 60);

    if (art.presentationFile) {
      const isPPT = art.presentationFile.type === 'ppt' || (art.presentationFile.name && (art.presentationFile.name.endsWith('.ppt') || art.presentationFile.name.endsWith('.pptx')));
      ctx.fillStyle = '#ffffff';
      ctx.font = '90px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(isPPT ? '📊' : '📄', 100 + cardW + cardW / 2, cardY + 200);

      ctx.fillStyle = isPPT ? '#fbbf24' : '#38bdf8';
      ctx.font = 'bold 36px Prompt, Sarabun, sans-serif';
      ctx.fillText(isPPT ? 'PowerPoint Presentation' : 'PDF Document', 100 + cardW + cardW / 2, cardY + 270);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px Prompt, Sarabun, sans-serif';
      ctx.fillText(art.presentationFile.name || 'สไลด์นำเสนอผลงาน', 100 + cardW + cardW / 2, cardY + 330);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '24px Prompt, Sarabun, sans-serif';
      ctx.fillText(`ขนาดไฟล์: ${art.presentationFile.size || 'ไฟล์แนบ'}`, 100 + cardW + cardW / 2, cardY + 380);

      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 28px Prompt, Sarabun, sans-serif';
      ctx.fillText('✅ แนบพร้อมเปิดอ่านและดาวน์โหลด', 100 + cardW + cardW / 2, cardY + 440);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.font = '90px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🖼️', 100 + cardW + cardW / 2, cardY + 220);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 36px Prompt, Sarabun, sans-serif';
      ctx.fillText('บอร์ดโครงงานนิทรรศการเสมือนจริง', 100 + cardW + cardW / 2, cardY + 300);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '26px Prompt, Sarabun, sans-serif';
      ctx.fillText('ผลงานนี้จัดแสดงในรูปแบบโปสเตอร์ดิจิทัลประจำห้องเรียน', 100 + cardW + cardW / 2, cardY + 360);
    }

    // Audio Guide Callout inside right card
    ctx.fillStyle = 'rgba(168, 85, 247, 0.25)';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(130 + cardW, cardY + 500, cardW - 60, 140, 16);
    } else {
      ctx.fillRect(130 + cardW, cardY + 500, cardW - 60, 140);
    }
    ctx.fill();
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#c084fc';
    ctx.font = 'bold 28px Prompt, Sarabun, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🔊 คำบรรยายเสียง Audio Guide ภาษาไทย:', 155 + cardW, cardY + 550);

    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Prompt, Sarabun, sans-serif';
    ctx.fillText('เดินเข้าใกล้บอร์ดแล้วกด [E] หรือคลิก เพื่อเปิดฟังเสียงบรรยาย', 155 + cardW, cardY + 600);

    // Slide Footer
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 26px Prompt, Sarabun, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`❤️ ได้รับ ${art.likes || 0} ความประทับใจ • จอฉายโปรเจกเตอร์ห้องเรียน โรงเรียนพัฒนานิคม`, w / 2, h - 40);

    if (this.screenTexture) this.screenTexture.needsUpdate = true;
  }

  wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    if (!text) return;
    const words = text.split(' ');
    let line = '';
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, y);
  }

  updateScreenWithTexture(texture) {
    if (this.auditoriumScreen) {
      this.auditoriumScreen.material.map = texture;
      this.auditoriumScreen.material.needsUpdate = true;
    }
  }

  resetAuditoriumScreen() {
    if (this.auditoriumScreen) {
      this.drawWelcomeScreen();
      this.screenTexture.needsUpdate = true;
      this.auditoriumScreen.material.map = this.screenTexture;
      this.auditoriumScreen.material.needsUpdate = true;
    }
  }

  update(delta) {
    this.rotatables.forEach((obj, idx) => {
      obj.rotation.y += delta * (0.5 + idx * 0.1);
    });
    if (this.religionRotatables) {
      this.religionRotatables.forEach((obj) => {
        obj.rotation.y += delta * 0.45;
      });
    }
  }

  // =========================================================================
  // RELIGIOUS ROOM THEMES & 3D SACRED MONUMENTS (รูปปั้น สัญลักษณ์ และภาพตกแต่ง)
  // =========================================================================
  initReligionTheme() {
    this.religionDecorGroup = new THREE.Group();
    this.religionDecorGroup.name = 'religionDecorGroup';
    this.scene.add(this.religionDecorGroup);
    this.religionRotatables = [];
    this.muralTextures = [];

    // Initial build for default room
    this.updateRoomTheme(this.currentRoomInfo);
  }

  updateRoomTheme(roomInfo) {
    if (roomInfo) this.currentRoomInfo = roomInfo;
    const info = this.currentRoomInfo || { id: '1', name: 'ศาสนาพุทธ', icon: '☸️', color: '#f59e0b' };
    const roomId = String(info.id || '1');

    // 1. Clean up previous dynamic decorations safely
    if (this.religionDecorGroup) {
      while (this.religionDecorGroup.children.length > 0) {
        const obj = this.religionDecorGroup.children[0];
        this.religionDecorGroup.remove(obj);
        if (obj.traverse) {
          obj.traverse(child => {
            if (child.geometry) {
              try { child.geometry.dispose(); } catch (e) {}
            }
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(m => { try { m.dispose(); } catch (e) {} });
              } else {
                try { child.material.dispose(); } catch (e) {}
              }
            }
          });
        }
      }
    }
    this.religionRotatables = [];
    if (this.muralTextures) {
      this.muralTextures.forEach(t => { try { t.dispose(); } catch (e) {} });
    }
    this.muralTextures = [];
    if (this.knowledgeTextures) {
      this.knowledgeTextures.forEach(t => { try { t.dispose(); } catch (e) {} });
    }
    this.knowledgeTextures = [];

    // 2. Build Room Centerpiece 3D Altar, Statue & Rotating Symbol
    this.buildReligiousCenterpiece(roomId, info);

    // 3. Build Additional 3D Statues & Sculptures across the Room
    this.buildAdditionalReligiousStatues(roomId, info);

    // 4. Build 8 Large Framed Classroom Religious Wall Murals
    this.buildReligiousWallMurals(roomId, info);

    // 5. Build 6 Educational Knowledge Infographic Boards (ใบความรู้)
    this.buildReligiousKnowledgeBoards(roomId, info);

    // 6. Update Front Classroom Blackboard with Sacred Doctrine
    this.drawBlackboardForRoom(info);
  }

  buildReligiousCenterpiece(roomId, info) {
    const altarGroup = new THREE.Group();
    altarGroup.name = `altar_shrine_room_${roomId}`;
    // Position on front stage platform (Left of projector screen, facing classroom)
    altarGroup.position.set(-8.0, 0.5, 25.5);

    const roomColor = info.color || '#f59e0b';
    const hexColor = parseInt(roomColor.replace('#', '0x'), 16) || 0xf59e0b;

    // Focused divine spotlight from ceiling
    const spot = new THREE.SpotLight(hexColor, 1.6, 30, Math.PI / 4, 0.45, 1);
    spot.position.set(-8.0, 8.2, 25.5);
    spot.target = altarGroup;
    this.religionDecorGroup.add(spot);

    if (roomId === '1') {
      // ☸️ 1. BUDDHISM: GOLDEN BUDDHA STATUE & 3D DHARMACHAKRA WHEEL
      this.buildBuddhismStatue(altarGroup);
    } else if (roomId === '2') {
      // ✝️ 2. CHRISTIANITY: COMMUNION MARBLE ALTAR & GRAND 3D HOLY CROSS STATUE
      this.buildChristianityStatue(altarGroup);
    } else if (roomId === '3') {
      // 🕉️ 3. BRAHMANISM-HINDUISM: SACRED SHRINE, TRISHULA & GLOWING 3D OM ॐ
      this.buildHinduismStatue(altarGroup);
    } else if (roomId === '4') {
      // ☪️ 4. ISLAM: ISLAMIC MIHRAB ARCH & 3D POLISHED GOLD CRESCENT & STAR
      this.buildIslamStatue(altarGroup);
    } else {
      // ✡️ 5. JUDAISM: JERUSALEM STONE ALTAR, 7-BRANCH MENORAH & 3D STAR OF DAVID
      this.buildJudaismStatue(altarGroup);
    }

    this.religionDecorGroup.add(altarGroup);
  }

  // -------------------------------------------------------------------------
  // ☸️ 1. BUDDHISM STATUE & DHARMACHAKRA
  // -------------------------------------------------------------------------
  buildBuddhismStatue(group) {
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.85,
      roughness: 0.22
    });
    const marbleMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.35
    });

    // A. Multi-Tier Octagonal Altar Base
    const baseGeo = new THREE.CylinderGeometry(2.3, 2.6, 0.45, 8);
    const baseMesh = new THREE.Mesh(baseGeo, marbleMat);
    baseMesh.position.y = 0.22;
    group.add(baseMesh);

    const stepGeo = new THREE.CylinderGeometry(1.9, 2.1, 0.3, 16);
    const stepMesh = new THREE.Mesh(stepGeo, goldMat);
    stepMesh.position.y = 0.55;
    group.add(stepMesh);

    // B. Lotus Petal Throne (ฐานบัวคว่ำ-บัวหงาย)
    const lotusSeatGeo = new THREE.CylinderGeometry(1.5, 1.4, 0.35, 24);
    const lotusSeat = new THREE.Mesh(lotusSeatGeo, goldMat);
    lotusSeat.position.y = 0.85;
    group.add(lotusSeat);

    // Lotus petals around rim
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const petalGeo = new THREE.ConeGeometry(0.18, 0.45, 6);
      const petal = new THREE.Mesh(petalGeo, goldMat);
      petal.position.set(Math.cos(angle) * 1.5, 0.95, Math.sin(angle) * 1.5);
      petal.rotation.z = Math.cos(angle) * 0.4;
      petal.rotation.x = -Math.sin(angle) * 0.4;
      group.add(petal);
    }

    // C. Golden Buddha in Meditation Posture (สมาธิ)
    const buddhaGroup = new THREE.Group();
    buddhaGroup.position.y = 1.05;

    // Torso with Robe Drape
    const torsoGeo = new THREE.CylinderGeometry(0.42, 0.62, 1.15, 16);
    const torso = new THREE.Mesh(torsoGeo, goldMat);
    torso.position.y = 0.65;
    buddhaGroup.add(torso);

    // Crossed Legs in Lotus Posture
    const legsGeo = new THREE.CylinderGeometry(0.28, 0.28, 1.45, 12);
    const legs = new THREE.Mesh(legsGeo, goldMat);
    legs.rotation.z = Math.PI / 2;
    legs.position.set(0, 0.2, 0.25);
    buddhaGroup.add(legs);

    // Hands in Dhyana Mudra (Meditative lap pose)
    const handsGeo = new THREE.BoxGeometry(0.45, 0.12, 0.25);
    const hands = new THREE.Mesh(handsGeo, goldMat);
    hands.position.set(0, 0.35, 0.45);
    buddhaGroup.add(hands);

    // Head & Serene Features
    const headGeo = new THREE.SphereGeometry(0.34, 16, 16);
    const head = new THREE.Mesh(headGeo, goldMat);
    head.position.y = 1.42;
    buddhaGroup.add(head);

    // Ushnisha (พระเกตุมาลาเปลวเพลิง)
    const ushnishaGeo = new THREE.ConeGeometry(0.12, 0.42, 12);
    const ushnisha = new THREE.Mesh(ushnishaGeo, goldMat);
    ushnisha.position.y = 1.85;
    buddhaGroup.add(ushnisha);

    // Glowing Golden Halo (ประภามณฑล)
    const haloGeo = new THREE.RingGeometry(0.55, 0.82, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      side: THREE.DoubleSide
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.position.set(0, 1.48, -0.15);
    buddhaGroup.add(halo);

    group.add(buddhaGroup);

    // D. 3D Floating Dharmachakra Wheel (กงล้อธรรมจักร 8 ก้าน หมุนอย่างสง่างาม)
    const chakraGroup = new THREE.Group();
    chakraGroup.position.set(0, 3.8, 0);

    const rimGeo = new THREE.TorusGeometry(0.85, 0.08, 16, 32);
    const rim = new THREE.Mesh(rimGeo, goldMat);
    chakraGroup.add(rim);

    const hubGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.12, 16);
    hubGeo.rotateX(Math.PI / 2);
    const hub = new THREE.Mesh(hubGeo, goldMat);
    chakraGroup.add(hub);

    for (let s = 0; s < 8; s++) {
      const sAngle = (s / 8) * Math.PI * 2;
      const spokeGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.78, 8);
      const spoke = new THREE.Mesh(spokeGeo, goldMat);
      spoke.position.set(Math.cos(sAngle) * 0.45, Math.sin(sAngle) * 0.45, 0);
      spoke.rotation.z = sAngle + Math.PI / 2;
      chakraGroup.add(spoke);
    }

    group.add(chakraGroup);
    this.religionRotatables.push(chakraGroup);

    // E. 5-Tier Royal Golden Umbrellas (ฉัตรทอง 5 ชั้น ซ้าย-ขวา)
    const createRoyalUmbrella = (x) => {
      const uGroup = new THREE.Group();
      uGroup.position.set(x, 0, -0.3);

      const poleGeo = new THREE.CylinderGeometry(0.04, 0.04, 3.8, 8);
      const pole = new THREE.Mesh(poleGeo, goldMat);
      pole.position.y = 1.9;
      uGroup.add(pole);

      const radii = [0.75, 0.62, 0.5, 0.38, 0.26];
      radii.forEach((r, idx) => {
        const coneGeo = new THREE.ConeGeometry(r, 0.22, 16);
        const cone = new THREE.Mesh(coneGeo, goldMat);
        cone.position.y = 2.4 + idx * 0.28;
        uGroup.add(cone);
      });
      group.add(uGroup);
    };

    createRoyalUmbrella(-2.1);
    createRoyalUmbrella(2.1);
  }

  // -------------------------------------------------------------------------
  // ✝️ 2. CHRISTIANITY STATUE & HOLY CROSS
  // -------------------------------------------------------------------------
  buildChristianityStatue(group) {
    const marbleMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.85, roughness: 0.25 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.4 });

    // A. Carrara Marble Communion Altar
    const altarGeo = new THREE.BoxGeometry(3.6, 1.1, 1.6);
    const altar = new THREE.Mesh(altarGeo, marbleMat);
    altar.position.y = 0.55;
    group.add(altar);

    // Gold cross relief on front of altar
    const reliefVGeo = new THREE.BoxGeometry(0.12, 0.65, 0.04);
    const reliefV = new THREE.Mesh(reliefVGeo, goldMat);
    reliefV.position.set(0, 0.55, 0.82);
    group.add(reliefV);

    const reliefHGeo = new THREE.BoxGeometry(0.42, 0.12, 0.04);
    const reliefH = new THREE.Mesh(reliefHGeo, goldMat);
    reliefH.position.set(0, 0.68, 0.82);
    group.add(reliefH);

    // B. Grand 3D Holy Cross Statue (ไม้กางเขนทองคำและไม้โอ๊ก)
    const crossGroup = new THREE.Group();
    crossGroup.position.set(0, 1.1, 0);

    const uprightGeo = new THREE.BoxGeometry(0.24, 3.2, 0.18);
    const upright = new THREE.Mesh(uprightGeo, woodMat);
    upright.position.y = 1.6;
    crossGroup.add(upright);

    const crossbarGeo = new THREE.BoxGeometry(1.9, 0.24, 0.18);
    const crossbar = new THREE.Mesh(crossbarGeo, woodMat);
    crossbar.position.y = 2.45;
    crossGroup.add(crossbar);

    // Polished gold borders on cross
    const goldEdgeV = new THREE.BoxGeometry(0.28, 3.24, 0.04);
    const gMeshV = new THREE.Mesh(goldEdgeV, goldMat);
    gMeshV.position.set(0, 1.6, 0.1);
    crossGroup.add(gMeshV);

    const goldEdgeH = new THREE.BoxGeometry(1.94, 0.28, 0.04);
    const gMeshH = new THREE.Mesh(goldEdgeH, goldMat);
    gMeshH.position.set(0, 2.45, 0.1);
    crossGroup.add(gMeshH);

    // Divine rays ring behind intersection
    const haloGeo = new THREE.RingGeometry(0.55, 0.85, 24);
    const haloMat = new THREE.MeshBasicMaterial({ color: 0x93c5fd, side: THREE.DoubleSide });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.position.set(0, 2.45, -0.12);
    crossGroup.add(halo);

    group.add(crossGroup);

    // C. 3D White Dove of Peace (นกพิราบขาวแห่งพระวิญญาณบริสุทธิ์)
    const doveGroup = new THREE.Group();
    doveGroup.position.set(0, 4.2, 0.1);

    const doveMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    const doveBodyGeo = new THREE.SphereGeometry(0.2, 12, 12);
    doveBodyGeo.scale(1, 0.8, 1.5);
    const doveBody = new THREE.Mesh(doveBodyGeo, doveMat);
    doveGroup.add(doveBody);

    const wingGeo = new THREE.BoxGeometry(0.65, 0.03, 0.32);
    const leftWing = new THREE.Mesh(wingGeo, doveMat);
    leftWing.position.set(-0.35, 0.1, 0);
    leftWing.rotation.z = 0.25;
    doveGroup.add(leftWing);

    const rightWing = new THREE.Mesh(wingGeo, doveMat);
    rightWing.position.set(0.35, 0.1, 0);
    rightWing.rotation.z = -0.25;
    doveGroup.add(rightWing);

    group.add(doveGroup);
    this.religionRotatables.push(doveGroup);

    // D. Silver Candelabras with glowing candles
    const createCandelabra = (x) => {
      const cGroup = new THREE.Group();
      cGroup.position.set(x, 1.1, 0.3);

      const silverMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });
      const stemGeo = new THREE.CylinderGeometry(0.04, 0.08, 0.8, 12);
      const stem = new THREE.Mesh(stemGeo, silverMat);
      stem.position.y = 0.4;
      cGroup.add(stem);

      const candleGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.4, 12);
      const candleMat = new THREE.MeshStandardMaterial({ color: 0xfffbeb });
      const candle = new THREE.Mesh(candleGeo, candleMat);
      candle.position.y = 0.95;
      cGroup.add(candle);

      const flameGeo = new THREE.SphereGeometry(0.045, 8, 8);
      const flameMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.y = 1.18;
      cGroup.add(flame);

      group.add(cGroup);
    };

    createCandelabra(-1.4);
    createCandelabra(1.4);
  }

  // -------------------------------------------------------------------------
  // 🕉️ 3. BRAHMANISM-HINDUISM SHRINE, TRISHULA & OM ॐ
  // -------------------------------------------------------------------------
  buildHinduismStatue(group) {
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.6 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.85, roughness: 0.25 });
    const bronzeMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.75, roughness: 0.3 });

    // A. Multi-Tiered Sandstone Pagoda Altar
    const baseGeo = new THREE.BoxGeometry(3.4, 0.55, 2.0);
    const baseMesh = new THREE.Mesh(baseGeo, stoneMat);
    baseMesh.position.y = 0.28;
    group.add(baseMesh);

    const stepGeo = new THREE.CylinderGeometry(1.6, 1.8, 0.45, 16);
    const stepMesh = new THREE.Mesh(stepGeo, stoneMat);
    stepMesh.position.y = 0.75;
    group.add(stepMesh);

    // B. Golden Trishula (ตรีศูลทองคำ)
    const trishulaGroup = new THREE.Group();
    trishulaGroup.position.set(0.8, 1.0, 0);

    const shaftGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.8, 12);
    const shaft = new THREE.Mesh(shaftGeo, goldMat);
    shaft.position.y = 1.4;
    trishulaGroup.add(shaft);

    const centerBladeGeo = new THREE.ConeGeometry(0.14, 0.75, 12);
    const centerBlade = new THREE.Mesh(centerBladeGeo, goldMat);
    centerBlade.position.y = 2.9;
    trishulaGroup.add(centerBlade);

    const leftBladeGeo = new THREE.TorusGeometry(0.35, 0.045, 8, 16, Math.PI);
    const leftBlade = new THREE.Mesh(leftBladeGeo, goldMat);
    leftBlade.position.set(-0.35, 2.65, 0);
    leftBlade.rotation.z = -Math.PI / 2;
    trishulaGroup.add(leftBlade);

    const rightBladeGeo = new THREE.TorusGeometry(0.35, 0.045, 8, 16, Math.PI);
    const rightBlade = new THREE.Mesh(rightBladeGeo, goldMat);
    rightBlade.position.set(0.35, 2.65, 0);
    rightBlade.rotation.z = Math.PI / 2;
    trishulaGroup.add(rightBlade);

    // Damaru drum tied to shaft
    const drumGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.25, 12);
    const drum = new THREE.Mesh(drumGeo, bronzeMat);
    drum.position.set(0, 2.1, 0.1);
    drum.rotation.x = Math.PI / 2;
    trishulaGroup.add(drum);

    group.add(trishulaGroup);

    // C. Bronze Deity Statue (เทวรูปมหาเทพ)
    const deityGroup = new THREE.Group();
    deityGroup.position.set(-0.6, 0.98, 0.1);

    const dTorsoGeo = new THREE.CylinderGeometry(0.35, 0.5, 0.95, 16);
    const dTorso = new THREE.Mesh(dTorsoGeo, bronzeMat);
    dTorso.position.y = 0.55;
    deityGroup.add(dTorso);

    const dHeadGeo = new THREE.SphereGeometry(0.3, 16, 16);
    const dHead = new THREE.Mesh(dHeadGeo, bronzeMat);
    dHead.position.y = 1.25;
    deityGroup.add(dHead);

    const crownGeo = new THREE.ConeGeometry(0.2, 0.45, 12);
    const crown = new THREE.Mesh(crownGeo, goldMat);
    crown.position.y = 1.62;
    deityGroup.add(crown);

    group.add(deityGroup);

    // D. 3D Glowing OM ॐ Symbol (หมุนเรืองแสงลอยเด่น)
    const omGroup = new THREE.Group();
    omGroup.position.set(0, 4.0, 0);

    const omCanvas = document.createElement('canvas');
    omCanvas.width = 512;
    omCanvas.height = 512;
    const octx = omCanvas.getContext('2d');
    octx.fillStyle = 'rgba(249, 115, 22, 0.15)';
    octx.beginPath();
    octx.arc(256, 256, 240, 0, Math.PI * 2);
    octx.fill();

    octx.strokeStyle = '#f59e0b';
    octx.lineWidth = 14;
    octx.stroke();

    octx.fillStyle = '#fef08a';
    octx.font = 'bold 320px sans-serif';
    octx.textAlign = 'center';
    octx.textBaseline = 'middle';
    octx.fillText('ॐ', 256, 275);

    const omTex = new THREE.CanvasTexture(omCanvas);
    const omGeo = new THREE.PlaneGeometry(1.7, 1.7);
    const omMat = new THREE.MeshBasicMaterial({ map: omTex, side: THREE.DoubleSide, transparent: true });
    const omMesh = new THREE.Mesh(omGeo, omMat);
    omGroup.add(omMesh);

    group.add(omGroup);
    this.religionRotatables.push(omGroup);

    // E. Traditional Brass Diya oil lamps
    const createDiya = (x) => {
      const diyaMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.2 });
      const bowlGeo = new THREE.CylinderGeometry(0.22, 0.12, 0.14, 16);
      const bowl = new THREE.Mesh(bowlGeo, diyaMat);
      bowl.position.set(x, 1.05, 0.65);

      const flameGeo = new THREE.SphereGeometry(0.06, 8, 8);
      const flameMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.set(x, 1.18, 0.65);

      group.add(bowl);
      group.add(flame);
    };

    createDiya(-1.2);
    createDiya(1.2);
  }

  // -------------------------------------------------------------------------
  // ☪️ 4. ISLAMIC MIHRAB ARCH & 3D CRESCENT & STAR
  // -------------------------------------------------------------------------
  buildIslamStatue(group) {
    const marbleMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
    const emeraldMat = new THREE.MeshStandardMaterial({ color: 0x047857, roughness: 0.4 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.85, roughness: 0.2 });

    // A. White Marble Platform
    const platGeo = new THREE.BoxGeometry(3.8, 0.4, 2.0);
    const plat = new THREE.Mesh(platGeo, marbleMat);
    plat.position.y = 0.2;
    group.add(plat);

    // B. Mihrab Columns & Arch
    const colGeo = new THREE.CylinderGeometry(0.18, 0.2, 3.2, 16);
    const colLeft = new THREE.Mesh(colGeo, marbleMat);
    colLeft.position.set(-1.45, 1.8, 0);
    group.add(colLeft);

    const colRight = new THREE.Mesh(colGeo, marbleMat);
    colRight.position.set(1.45, 1.8, 0);
    group.add(colRight);

    // Column Capitals
    const capGeo = new THREE.BoxGeometry(0.48, 0.25, 0.48);
    const capL = new THREE.Mesh(capGeo, goldMat); capL.position.set(-1.45, 3.45, 0); group.add(capL);
    const capR = new THREE.Mesh(capGeo, goldMat); capR.position.set(1.45, 3.45, 0); group.add(capR);

    // Horseshoe Arch
    const archGeo = new THREE.TorusGeometry(1.45, 0.18, 12, 24, Math.PI);
    const arch = new THREE.Mesh(archGeo, emeraldMat);
    arch.position.set(0, 3.45, 0);
    group.add(arch);

    // Gold Mihrab Dome Finial
    const domeGeo = new THREE.ConeGeometry(0.65, 0.9, 16);
    const dome = new THREE.Mesh(domeGeo, goldMat);
    dome.position.set(0, 4.8, 0);
    group.add(dome);

    // C. 3D Polished Gold Crescent & Star ☪️ (หมุนสง่างามกลางซุ้ม)
    const crescentGroup = new THREE.Group();
    crescentGroup.position.set(0, 2.6, 0);

    const cresGeo = new THREE.TorusGeometry(0.85, 0.12, 16, 32, Math.PI * 1.55);
    const cres = new THREE.Mesh(cresGeo, goldMat);
    cres.rotation.z = Math.PI * 0.72;
    crescentGroup.add(cres);

    // 5-Pointed Faceted Star
    const starGeo = new THREE.OctahedronGeometry(0.32, 0);
    const star = new THREE.Mesh(starGeo, goldMat);
    star.position.set(0.3, 0.15, 0);
    crescentGroup.add(star);

    group.add(crescentGroup);
    this.religionRotatables.push(crescentGroup);

    // D. Handcrafted Wooden Rehal (แท่นวางพระมหาคัมภีร์เรฮาล)
    const rehalMat = new THREE.MeshStandardMaterial({ color: 0x581c87, roughness: 0.5 });
    const woodRehalMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.3 });

    const leg1Geo = new THREE.BoxGeometry(0.85, 0.04, 0.5);
    const leg1 = new THREE.Mesh(leg1Geo, woodRehalMat);
    leg1.rotation.z = 0.55;
    leg1.position.set(0, 0.65, 0.55);
    group.add(leg1);

    const leg2 = new THREE.Mesh(leg1Geo, woodRehalMat);
    leg2.rotation.z = -0.55;
    leg2.position.set(0, 0.65, 0.55);
    group.add(leg2);

    // Holy Quran model on Rehal
    const bookGeo = new THREE.BoxGeometry(0.55, 0.1, 0.42);
    const book = new THREE.Mesh(bookGeo, rehalMat);
    book.position.set(0, 0.8, 0.55);
    group.add(book);
  }

  // -------------------------------------------------------------------------
  // ✡️ 5. JUDAISM STATUE: 7-BRANCH MENORAH & STAR OF DAVID
  // -------------------------------------------------------------------------
  buildJudaismStatue(group) {
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0xe2d9c8, roughness: 0.5 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.88, roughness: 0.18 });
    const silverMat = new THREE.MeshStandardMaterial({ color: 0x93c5fd, metalness: 0.9, roughness: 0.2 });

    // A. Jerusalem Stepped Limestone Altar
    const baseGeo = new THREE.BoxGeometry(3.6, 0.7, 2.0);
    const baseMesh = new THREE.Mesh(baseGeo, stoneMat);
    baseMesh.position.y = 0.35;
    group.add(baseMesh);

    // B. Magnificent 7-Branched Golden Menorah (เชิงเทียนเมโนราห์ 7 กิ่ง)
    const menorahGroup = new THREE.Group();
    menorahGroup.position.set(0, 0.7, 0);

    // Central Stem
    const stemGeo = new THREE.CylinderGeometry(0.08, 0.12, 2.4, 16);
    const stem = new THREE.Mesh(stemGeo, goldMat);
    stem.position.y = 1.2;
    menorahGroup.add(stem);

    // Base of menorah
    const mBaseGeo = new THREE.CylinderGeometry(0.55, 0.75, 0.22, 8);
    const mBase = new THREE.Mesh(mBaseGeo, goldMat);
    mBase.position.y = 0.11;
    menorahGroup.add(mBase);

    // 3 Concentric curved arm pairs
    const armRadii = [0.45, 0.78, 1.1];
    armRadii.forEach((r, idx) => {
      const armGeo = new THREE.TorusGeometry(r, 0.05, 8, 24, Math.PI);
      const arm = new THREE.Mesh(armGeo, goldMat);
      arm.position.y = 1.2 + idx * 0.15;
      menorahGroup.add(arm);
    });

    // 7 Cups & Golden Flames
    const cupXs = [-1.1, -0.78, -0.45, 0, 0.45, 0.78, 1.1];
    cupXs.forEach((cx) => {
      const cupGeo = new THREE.CylinderGeometry(0.065, 0.04, 0.12, 12);
      const cup = new THREE.Mesh(cupGeo, goldMat);
      cup.position.set(cx, 2.35, 0);
      menorahGroup.add(cup);

      const flameGeo = new THREE.SphereGeometry(0.045, 8, 8);
      const flameMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.set(cx, 2.47, 0);
      menorahGroup.add(flame);
    });

    group.add(menorahGroup);

    // C. 3D Star of David ✡️ (Interlocking Silver Triangles Rotating Above)
    const starGroup = new THREE.Group();
    starGroup.position.set(0, 3.8, 0);

    const createTriangleFrame = (rotZ) => {
      const tGroup = new THREE.Group();
      tGroup.rotation.z = rotZ;
      const beamGeo = new THREE.CylinderGeometry(0.035, 0.035, 1.2, 8);
      for (let i = 0; i < 3; i++) {
        const ang = (i / 3) * Math.PI * 2;
        const b = new THREE.Mesh(beamGeo, silverMat);
        b.position.set(Math.cos(ang) * 0.35, Math.sin(ang) * 0.35, 0);
        b.rotation.z = ang + Math.PI / 2;
        tGroup.add(b);
      }
      return tGroup;
    };

    starGroup.add(createTriangleFrame(0));
    starGroup.add(createTriangleFrame(Math.PI));

    group.add(starGroup);
    this.religionRotatables.push(starGroup);

    // D. Ten Commandments Stone Tablets (ศิลาจารึกบัญญัติ 10 ประการ)
    const createTablet = (x) => {
      const tabGeo = new THREE.BoxGeometry(0.38, 0.65, 0.1);
      const tabMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.5 });
      const tab = new THREE.Mesh(tabGeo, tabMat);
      tab.position.set(x, 1.05, 0.55);
      group.add(tab);
    };

    createTablet(-0.35);
    createTablet(0.35);
  }

// =========================================================================
  // ADDITIONAL 3D STATUES & SCULPTURES (รูปปั้นและประติมากรรมตกแต่งรอบห้องเรียน)
  // =========================================================================
  buildAdditionalReligiousStatues(roomId, info) {
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.85, roughness: 0.22 });
    const whiteMarbleMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.32 });
    const darkStoneMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.4 });
    const silverMat = new THREE.MeshStandardMaterial({ color: 0xcfd8dc, metalness: 0.9, roughness: 0.18 });
    const bronzeMat = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.8, roughness: 0.3 });
    const emeraldMat = new THREE.MeshStandardMaterial({ color: 0x047857, roughness: 0.35 });

    // Helper: Build Display Pedestal with Plinth & Capital
    const createPedestal = (x, z, label, subLabel) => {
      const pedGroup = new THREE.Group();
      pedGroup.position.set(x, 0, z);

      // Base stepped plinth
      const baseGeo = new THREE.BoxGeometry(2.4, 0.4, 2.4);
      const base = new THREE.Mesh(baseGeo, darkStoneMat);
      base.position.y = 0.2;
      pedGroup.add(base);

      // Shaft
      const shaftGeo = new THREE.BoxGeometry(1.8, 1.4, 1.8);
      const shaft = new THREE.Mesh(shaftGeo, whiteMarbleMat);
      shaft.position.y = 1.1;
      pedGroup.add(shaft);

      // Top capital
      const capGeo = new THREE.BoxGeometry(2.2, 0.25, 2.2);
      const cap = new THREE.Mesh(capGeo, darkStoneMat);
      cap.position.y = 1.92;
      pedGroup.add(cap);

      // Label placard
      if (label) {
        const placard = this.createStatuePlacard(label, subLabel || info.name, 0, 1.1, 0.92);
        pedGroup.add(placard);
      }

      this.religionDecorGroup.add(pedGroup);
      return pedGroup;
    };

    // Helper: Focused Spotlight
    const addStatueSpotlight = (x, z, hexColor) => {
      const spot = new THREE.SpotLight(hexColor || 0xffffff, 1.35, 25, Math.PI / 5, 0.5, 1);
      spot.position.set(x, 8.0, z);
      const target = new THREE.Object3D();
      target.position.set(x, 2.5, z);
      this.religionDecorGroup.add(target);
      spot.target = target;
      this.religionDecorGroup.add(spot);
    };

    // -----------------------------------------------------------------------
    // ROOM 1: ☸️ BUDDHISM (พระพุทธรูปปางห้ามญาติ, พระเจดีย์, เสาอโศก, ธรรมจักรศิลา)
    // -----------------------------------------------------------------------
    if (roomId === '1') {
      // 1. Left Wall Alcove: Standing Buddha Statue (พระพุทธรูปปางห้ามญาติ/ประทานพร)
      const p1 = createPedestal(-36.5, 2, 'พระพุทธรูปปางห้ามญาติ (ประทานอภัย)', 'ศิลปะสุโขทัยบริสุทธิ์');
      addStatueSpotlight(-36.5, 2, 0xfef08a);
      const bStatue = new THREE.Group();
      bStatue.position.set(0, 2.05, 0);

      // Lotus throne
      const lotusBase = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 0.3, 16), goldMat);
      lotusBase.position.y = 0.15;
      bStatue.add(lotusBase);

      // Robed Torso
      const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.32, 1.35, 16), goldMat);
      torso.position.y = 0.95;
      bStatue.add(torso);

      // Head & Ushnisha
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 16), goldMat);
      head.position.y = 1.75;
      bStatue.add(head);
      const ushnisha = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.35, 12), goldMat);
      ushnisha.position.y = 2.05;
      bStatue.add(ushnisha);

      // Raised Right Hand (Abhaya Mudra)
      const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.55, 8), goldMat);
      armR.position.set(0.35, 1.25, 0.18);
      armR.rotation.x = -0.6;
      bStatue.add(armR);

      // Golden Halo Ring
      const halo = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.04, 12, 24), goldMat);
      halo.position.set(0, 1.75, -0.1);
      bStatue.add(halo);
      p1.add(bStatue);

      // 2. Right Wall Alcove: Golden Pagoda / Stupa (พระเจดีย์จุฬามณีจำลอง)
      const p2 = createPedestal(36.5, 2, 'พระเจดีย์ทรงระฆังทองคำ', 'เจดีย์ประดิษฐานพระบรมสารีริกธาตุ');
      addStatueSpotlight(36.5, 2, 0xfef08a);
      const stupa = new THREE.Group();
      stupa.position.set(0, 2.05, 0);

      // Tiered Square Base
      const sBase1 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.22, 1.6), goldMat);
      sBase1.position.y = 0.11; stupa.add(sBase1);
      const sBase2 = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.2, 1.3), goldMat);
      sBase2.position.y = 0.31; stupa.add(sBase2);

      // Bell Dome (องค์ระฆัง)
      const bell = new THREE.Mesh(new THREE.SphereGeometry(0.65, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.65), goldMat);
      bell.position.y = 0.5;
      stupa.add(bell);

      // Spire Rings (ปล้องไฉน)
      for (let i = 0; i < 7; i++) {
        const ringR = 0.42 - i * 0.05;
        const ring = new THREE.Mesh(new THREE.CylinderGeometry(ringR, ringR + 0.03, 0.08, 16), goldMat);
        ring.position.y = 1.15 + i * 0.12;
        stupa.add(ring);
      }
      // Spire Finial (หยาดน้ำค้าง)
      const finial = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.45, 12), goldMat);
      finial.position.y = 2.15; stupa.add(finial);
      p2.add(stupa);

      // 3. Back Pillar 1: Ashoka Lion Capital (เสาอโศกสลักสิงห์ 4 ทิศ)
      const p3 = createPedestal(-18, -34.5, 'เสาหินพระเจ้าอโศกมหาราช', 'สัญลักษณ์แห่งธรรมวิชัย สารนาถ');
      addStatueSpotlight(-18, -34.5, 0x93c5fd);
      const ashoka = new THREE.Group();
      ashoka.position.set(0, 2.05, 0);

      const aCol = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.42, 1.8, 16), whiteMarbleMat);
      aCol.position.y = 0.9; ashoka.add(aCol);

      // Abacus Wheel Frieze
      const abacus = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.25, 16), goldMat);
      abacus.position.y = 1.9; ashoka.add(abacus);

      // 4 Lion Heads facing cardinal directions
      for (let i = 0; i < 4; i++) {
        const lion = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.38, 0.35), goldMat);
        const ang = (i / 4) * Math.PI * 2;
        lion.position.set(Math.cos(ang) * 0.25, 2.2, Math.sin(ang) * 0.25);
        lion.rotation.y = -ang + Math.PI / 2;
        ashoka.add(lion);
      }
      p3.add(ashoka);

      // 4. Back Pillar 2: Ancient Stone Dharmachakra (ธรรมจักรศิลาโบราณ)
      const p4 = createPedestal(18, -34.5, 'ธรรมจักรศิลาสมัยทวารวดี', 'กงล้อแห่งพระธรรมจักรอันประเสริฐ');
      addStatueSpotlight(18, -34.5, 0x93c5fd);
      const stoneWheel = new THREE.Group();
      stoneWheel.position.set(0, 2.05, 0);

      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.09, 12, 32), bronzeMat);
      rim.position.y = 1.0; stoneWheel.add(rim);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.14, 16), goldMat);
      hub.rotation.x = Math.PI / 2; hub.position.y = 1.0; stoneWheel.add(hub);

      for (let i = 0; i < 8; i++) {
        const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.65, 8), bronzeMat);
        const ang = (i / 8) * Math.PI * 2;
        spoke.position.set(Math.cos(ang) * 0.38, 1.0 + Math.sin(ang) * 0.38, 0);
        spoke.rotation.z = ang + Math.PI / 2;
        stoneWheel.add(spoke);
      }
      p4.add(stoneWheel);
      this.religionRotatables.push(stoneWheel);
    }

    // -----------------------------------------------------------------------
    // ROOM 2: ✝️ CHRISTIANITY (ทูตสวรรค์หินอ่อน, ดวงพระทัย, กางเขนเคลติก, อ่างศีล)
    // -----------------------------------------------------------------------
    else if (roomId === '2') {
      // 1. Left Wall: Classical White Marble Angel of Peace (รูปปั้นทูตสวรรค์แห่งสันติภาพ)
      const p1 = createPedestal(-36.5, 2, 'รูปปั้นทูตสวรรค์แห่งสันติภาพ', 'ประติมากรรมหินอ่อนมหาวิหารคริสต์');
      addStatueSpotlight(-36.5, 2, 0xf8fafc);
      const angel = new THREE.Group();
      angel.position.set(0, 2.05, 0);

      // Robe
      const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, 1.5, 16), whiteMarbleMat);
      robe.position.y = 0.75; angel.add(robe);

      // Torso & Head
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), whiteMarbleMat);
      head.position.y = 1.65; angel.add(head);

      // Angel Wings (Outstretched)
      const wingGeo = new THREE.BoxGeometry(0.06, 0.95, 0.65);
      const wingL = new THREE.Mesh(wingGeo, whiteMarbleMat);
      wingL.position.set(-0.35, 1.35, -0.2);
      wingL.rotation.y = 0.45; wingL.rotation.z = -0.3;
      angel.add(wingL);

      const wingR = new THREE.Mesh(wingGeo, whiteMarbleMat);
      wingR.position.set(0.35, 1.35, -0.2);
      wingR.rotation.y = -0.45; wingR.rotation.z = 0.3;
      angel.add(wingR);

      // Halo
      const halo = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.03, 8, 24), goldMat);
      halo.position.set(0, 1.85, 0); halo.rotation.x = Math.PI / 2;
      angel.add(halo);
      p1.add(angel);

      // 2. Right Wall: Sacred Heart Monument (อนุสาวรีย์ดวงพระทัยศักดิ์สิทธิ์)
      const p2 = createPedestal(36.5, 2, 'อนุสาวรีย์ดวงพระทัยศักดิ์สิทธิ์', 'สัญลักษณ์แห่งความรักเมตตาอันล้นพ้น');
      addStatueSpotlight(36.5, 2, 0xf87171);
      const heartGroup = new THREE.Group();
      heartGroup.position.set(0, 2.05, 0);

      // Pedestal column
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 1.2, 16), whiteMarbleMat);
      col.position.y = 0.6; heartGroup.add(col);

      // Golden Rays Burst
      for (let i = 0; i < 16; i++) {
        const ray = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.95, 8), goldMat);
        const ang = (i / 16) * Math.PI * 2;
        ray.position.set(Math.cos(ang) * 0.45, 1.55 + Math.sin(ang) * 0.45, 0);
        ray.rotation.z = ang + Math.PI / 2;
        heartGroup.add(ray);
      }

      // Heart Sphere Center
      const heartMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.25 });
      const heartSphere = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), heartMat);
      heartSphere.position.set(0, 1.55, 0.08); heartGroup.add(heartSphere);

      // Mini Cross on top of heart
      const crossBeamV = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.4, 0.08), goldMat);
      crossBeamV.position.set(0, 2.05, 0.08); heartGroup.add(crossBeamV);
      const crossBeamH = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.08, 0.08), goldMat);
      crossBeamH.position.set(0, 2.12, 0.08); heartGroup.add(crossBeamH);

      p2.add(heartGroup);
      this.religionRotatables.push(heartGroup);

      // 3. Back Pillar 1: Historic Celtic Knotwork Cross (ไม้กางเขนเคลติกโบราณ)
      const p3 = createPedestal(-18, -34.5, 'ไม้กางเขนเคลติกหินโบราณ', 'สัญลักษณ์คริสตจักรยุคแรกเริ่ม');
      addStatueSpotlight(-18, -34.5, 0x93c5fd);
      const celtic = new THREE.Group();
      celtic.position.set(0, 2.05, 0);

      const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.24, 2.1, 0.2), darkStoneMat);
      shaft.position.y = 1.05; celtic.add(shaft);
      const crossArm = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.24, 0.2), darkStoneMat);
      crossArm.position.y = 1.6; celtic.add(crossArm);

      // Celtic Nimbus Ring
      const cRing = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.06, 12, 32), bronzeMat);
      cRing.position.set(0, 1.6, 0); celtic.add(cRing);
      p3.add(celtic);

      // 4. Back Pillar 2: Holy Ark & Baptismal Font (อ่างศีลมหาสนิทและพระคัมภีร์ไบเบิล)
      const p4 = createPedestal(18, -34.5, 'อ่างศีลล้างบาป & พระคริสตธรรมคัมภีร์', 'ศีลศักดิ์สิทธิ์แห่งการบังเกิดใหม่');
      addStatueSpotlight(18, -34.5, 0x93c5fd);
      const font = new THREE.Group();
      font.position.set(0, 2.05, 0);

      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.35, 0.55, 16), whiteMarbleMat);
      bowl.position.y = 0.45; font.add(bowl);

      // Water plane inside bowl
      const waterMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, opacity: 0.8, transparent: true });
      const water = new THREE.Mesh(new THREE.CircleGeometry(0.62, 16), waterMat);
      water.rotation.x = -Math.PI / 2; water.position.y = 0.65; font.add(water);

      // Bible Lectern
      const bookMesh = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.12, 0.48), woodMat);
      bookMesh.position.set(0, 1.05, 0); bookMesh.rotation.x = 0.3;
      font.add(bookMesh);
      p4.add(font);
    }

    // -----------------------------------------------------------------------
    // ROOM 3: 🕉️ HINDUISM (พระพิฆเนศวร, พระศิวนาฏราช, เสาตรีศูล & โคนนทิ, อนันตนาค)
    // -----------------------------------------------------------------------
    else if (roomId === '3') {
      // 1. Left Wall: Lord Ganesha Statue (พระพิฆเนศวรมหาเทพแห่งปัญญา)
      const p1 = createPedestal(-36.5, 2, 'พระพิฆเนศวรมหาเทพแห่งปัญญา', 'ผู้ขจัดอุปสรรคและประทานความสำเร็จ');
      addStatueSpotlight(-36.5, 2, 0xfbbf24);
      const ganesha = new THREE.Group();
      ganesha.position.set(0, 2.05, 0);

      // Lotus Seat
      const lBase = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 0.3, 16), goldMat);
      lBase.position.y = 0.15; ganesha.add(lBase);

      // Round Belly
      const belly = new THREE.Mesh(new THREE.SphereGeometry(0.48, 16, 16), goldMat);
      belly.position.y = 0.65; ganesha.add(belly);

      // Elephant Head & Ears
      const gHead = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), goldMat);
      gHead.position.y = 1.25; ganesha.add(gHead);

      const earGeo = new THREE.BoxGeometry(0.42, 0.3, 0.06);
      const earL = new THREE.Mesh(earGeo, goldMat); earL.position.set(-0.35, 1.3, 0); ganesha.add(earL);
      const earR = new THREE.Mesh(earGeo, goldMat); earR.position.set(0.35, 1.3, 0); ganesha.add(earR);

      // Trunk (Curved Torus Arc)
      const trunk = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.08, 8, 16, Math.PI), goldMat);
      trunk.position.set(0, 1.1, 0.28); trunk.rotation.x = Math.PI / 2; ganesha.add(trunk);

      // Golden Crown Mukuta
      const crown = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.55, 12), goldMat);
      crown.position.y = 1.72; ganesha.add(crown);
      p1.add(ganesha);

      // 2. Right Wall: Shiva Nataraja Cosmic Dance (พระศิวนาฏราช ระบำจักรวาล)
      const p2 = createPedestal(36.5, 2, 'พระศิวนาฏราช ระบำจักรวาล', 'การรังสรรค์ ดำรงอยู่ และดับสลายแห่งภพ');
      addStatueSpotlight(36.5, 2, 0xf59e0b);
      const nataraja = new THREE.Group();
      nataraja.position.set(0, 2.05, 0);

      // Flaming Ring of Fire (Prabha Mandala)
      const fireRing = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.08, 12, 32), bronzeMat);
      fireRing.position.y = 1.15; nataraja.add(fireRing);

      // Dancing Torso & Raised Leg
      const nTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.95, 12), bronzeMat);
      nTorso.position.y = 1.05; nataraja.add(nTorso);

      const legLift = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.65, 8), bronzeMat);
      legLift.position.set(-0.25, 0.85, 0.15); legLift.rotation.z = -0.8; nataraja.add(legLift);

      // Four Arms
      const arm1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.55, 8), bronzeMat);
      arm1.position.set(0.35, 1.35, 0); arm1.rotation.z = 0.6; nataraja.add(arm1);
      const arm2 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.55, 8), bronzeMat);
      arm2.position.set(-0.35, 1.35, 0); arm2.rotation.z = -0.6; nataraja.add(arm2);

      p2.add(nataraja);
      this.religionRotatables.push(nataraja);

      // 3. Back Pillar 1: Sacred Nandi Bull Sculpture (รูปปั้นโคนนทิพาหนะแห่งพระศิวะ)
      const p3 = createPedestal(-18, -34.5, 'รูปปั้นโคนนทิพาหนะศักดิ์สิทธิ์', 'สัญลักษณ์แห่งความซื่อสัตย์และภักดี');
      addStatueSpotlight(-18, -34.5, 0xf8fafc);
      const nandi = new THREE.Group();
      nandi.position.set(0, 2.05, 0);

      // Reclining Bull Body
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 1.2, 16), whiteMarbleMat);
      body.rotation.z = Math.PI / 2; body.position.y = 0.45; nandi.add(body);

      // Head & Horns
      const nHead = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.65, 12), whiteMarbleMat);
      nHead.position.set(0.55, 0.72, 0); nHead.rotation.z = -0.5; nandi.add(nHead);

      const hornL = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.35, 8), darkStoneMat);
      hornL.position.set(0.55, 1.05, -0.18); hornL.rotation.x = -0.4; nandi.add(hornL);
      const hornR = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.35, 8), darkStoneMat);
      hornR.position.set(0.55, 1.05, 0.18); hornR.rotation.x = 0.4; nandi.add(hornR);

      // Golden Bell Garland around neck
      const garland = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.06, 8, 24), goldMat);
      garland.position.set(0.35, 0.55, 0); garland.rotation.y = Math.PI / 2; nandi.add(garland);
      p3.add(nandi);

      // 4. Back Pillar 2: Trishula Trident Pillar (เสาตรีศูลทองเหลืองศักดิ์สิทธิ์)
      const p4 = createPedestal(18, -34.5, 'เสาตรีศูลและกลองดามารู', 'สัญลักษณ์แห่งอำนาจ 3 ประการของมหาเทพ');
      addStatueSpotlight(18, -34.5, 0xf59e0b);
      const trish = new THREE.Group();
      trish.position.set(0, 2.05, 0);

      const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.1, 12), bronzeMat);
      staff.position.y = 1.05; trish.add(staff);

      // Three Prongs
      const pCenter = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.65, 8), goldMat);
      pCenter.position.y = 2.35; trish.add(pCenter);

      const prongL = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.05, 8, 16, Math.PI * 0.7), goldMat);
      prongL.position.set(-0.25, 2.05, 0); prongL.rotation.z = Math.PI * 0.2; trish.add(prongL);
      const prongR = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.05, 8, 16, Math.PI * 0.7), goldMat);
      prongR.position.set(0.25, 2.05, 0); prongR.rotation.z = -Math.PI * 0.9; trish.add(prongR);
      p4.add(trish);
    }

    // -----------------------------------------------------------------------
    // ROOM 4: ☪️ ISLAM (แบบจำลองพระมหาบิลเดียรกะอ์บะฮ์, หอคอยมินาเรต, คัมภีร์เรฮาล, ซุ้มโดม)
    // -----------------------------------------------------------------------
    else if (roomId === '4') {
      // 1. Left Wall: Kaaba Architecture Model (แบบจำลองพระมหาบิลเดียรกะอ์บะฮ์ นครมักกะฮ์)
      const p1 = createPedestal(-36.5, 2, 'แบบจำลองพระมหาบิลเดียรกะอ์บะฮ์', 'ศูนย์รวมจิตวิญญาณและทิศกิบลัตมุสลิมทั่วโลก');
      addStatueSpotlight(-36.5, 2, 0xfbbf24);
      const kaaba = new THREE.Group();
      kaaba.position.set(0, 2.05, 0);

      // Marble plinth
      const kPlinth = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.15, 1.8), whiteMarbleMat);
      kPlinth.position.y = 0.08; kaaba.add(kPlinth);

      // Black Cube
      const blackSilkMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.6 });
      const cube = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.5, 1.4), blackSilkMat);
      cube.position.y = 0.85; kaaba.add(cube);

      // Golden Kiswah Calligraphy Belt
      const kiswah = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.22, 1.42), goldMat);
      kiswah.position.y = 1.35; kaaba.add(kiswah);

      // Silver Hajr al-Aswad (Black Stone Frame)
      const blackStone = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), silverMat);
      blackStone.position.set(0.71, 0.45, 0.71); kaaba.add(blackStone);
      p1.add(kaaba);

      // 2. Right Wall: Architectural Minaret Tower & Brass Lantern (หอคอยมินาเรตและตะเกียงฟาโนส)
      const p2 = createPedestal(36.5, 2, 'หอคอยมินาเรตและตะเกียงฟาโนส', 'สถาปัตยกรรมยอดแหลมและแสงแห่งศานติ');
      addStatueSpotlight(36.5, 2, 0x10b981);
      const minaret = new THREE.Group();
      minaret.position.set(0, 2.05, 0);

      // Minaret Shaft
      const mShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.42, 1.6, 16), whiteMarbleMat);
      mShaft.position.y = 0.8; minaret.add(mShaft);

      // Balcony
      const balcony = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.45, 0.2, 16), goldMat);
      balcony.position.y = 1.65; minaret.add(balcony);

      // Upper Turret & Crescent Finial
      const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.55, 12), whiteMarbleMat);
      turret.position.y = 2.0; minaret.add(turret);
      const mDome = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.6, 16), goldMat);
      mDome.position.y = 2.55; minaret.add(mDome);

      p2.add(minaret);

      // 3. Back Pillar 1: Arabesque Column with Holy Quran (เสาสลักอักษรและพระมหาคัมภีร์อัลกุรอาน)
      const p3 = createPedestal(-18, -34.5, 'แท่นพระมหาคัมภีร์อัลกุรอานบนเรฮาล', 'พระดำรัสอันศักดิ์สิทธิ์และธรรมนูญแห่งชีวิต');
      addStatueSpotlight(-18, -34.5, 0x93c5fd);
      const quranGroup = new THREE.Group();
      quranGroup.position.set(0, 2.05, 0);

      // Rehal crossed wooden legs
      const legGeo = new THREE.BoxGeometry(0.85, 0.05, 0.45);
      const l1 = new THREE.Mesh(legGeo, woodMat); l1.rotation.z = 0.55; l1.position.set(0, 0.5, 0); quranGroup.add(l1);
      const l2 = new THREE.Mesh(legGeo, woodMat); l2.rotation.z = -0.55; l2.position.set(0, 0.5, 0); quranGroup.add(l2);

      // Holy Book with Emerald Cover
      const qBook = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.1, 0.45), emeraldMat);
      qBook.position.set(0, 0.68, 0); quranGroup.add(qBook);
      p3.add(quranGroup);

      // 4. Back Pillar 2: Al-Aqsa Golden Dome Model (ซุ้มโดมทองคำแห่งนครเยรูซาเลม)
      const p4 = createPedestal(18, -34.5, 'แบบจำลองโดมทองคำแห่งเยรูซาเลม', 'อนุสรณ์แห่งเหตุการณ์อิสรออ์-มิอ์รอจญ์');
      addStatueSpotlight(18, -34.5, 0xfbbf24);
      const domeModel = new THREE.Group();
      domeModel.position.set(0, 2.05, 0);

      // Octagonal Wall Base
      const octGeo = new THREE.CylinderGeometry(0.75, 0.8, 0.7, 8);
      const oct = new THREE.Mesh(octGeo, whiteMarbleMat);
      oct.position.y = 0.35; domeModel.add(oct);

      // Radiant Golden Dome
      const gDome = new THREE.Mesh(new THREE.SphereGeometry(0.68, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), goldMat);
      gDome.position.y = 0.7; domeModel.add(gDome);
      p4.add(domeModel);
    }

    // -----------------------------------------------------------------------
    // ROOM 5: ✡️ JUDAISM (หีบพันธสัญญา, กำแพงตะวันตก, เสาศิลาบัญญัติ 10 ประการ, เมโนราห์)
    // -----------------------------------------------------------------------
    else {
      // 1. Left Wall: Ark of the Covenant (หีบพันธสัญญาศักดิ์สิทธิ์ทองคำแท้)
      const p1 = createPedestal(-36.5, 2, 'หีบพันธสัญญาศักดิ์สิทธิ์ (Aron HaKodesh)', 'หีบประดิษฐานแผ่นศิลาจารึกบัญญัติ 10 ประการ');
      addStatueSpotlight(-36.5, 2, 0xfbbf24);
      const ark = new THREE.Group();
      ark.position.set(0, 2.05, 0);

      // Gold Coffer Box
      const arkBox = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.8, 0.85), goldMat);
      arkBox.position.y = 0.45; ark.add(arkBox);

      // Carrying Poles (Staves)
      const poleGeo = new THREE.CylinderGeometry(0.05, 0.05, 2.2, 12);
      const pL = new THREE.Mesh(poleGeo, goldMat); pL.rotation.x = Math.PI / 2; pL.position.set(-0.55, 0.35, 0); ark.add(pL);
      const pR = new THREE.Mesh(poleGeo, goldMat); pR.rotation.x = Math.PI / 2; pR.position.set(0.55, 0.35, 0); ark.add(pR);

      // Cherubim with Facing Wings (Mercy Seat)
      const cherubWingGeo = new THREE.BoxGeometry(0.05, 0.65, 0.45);
      const cL = new THREE.Mesh(cherubWingGeo, goldMat); cL.position.set(-0.45, 1.05, 0); cL.rotation.z = -0.4; ark.add(cL);
      const cR = new THREE.Mesh(cherubWingGeo, goldMat); cR.position.set(0.45, 1.05, 0); cR.rotation.z = 0.4; ark.add(cR);
      p1.add(ark);

      // 2. Right Wall: Western Wall Monument (อนุสรณ์กำแพงตะวันตกแห่งเยรูซาเลม)
      const p2 = createPedestal(36.5, 2, 'อนุสรณ์กำแพงตะวันตก (Kotel)', 'ซากพระวิหารศักดิ์สิทธิ์สูงสุดแห่งกรุงเยรูซาเลม');
      addStatueSpotlight(36.5, 2, 0xfef08a);
      const wallMon = new THREE.Group();
      wallMon.position.set(0, 2.05, 0);

      // Jerusalem Limestone Ashlar Blocks
      const stoneBlockMat = new THREE.MeshStandardMaterial({ color: 0xdecbb7, roughness: 0.7 });
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 3; c++) {
          const block = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.36, 0.35), stoneBlockMat);
          block.position.set((c - 1) * 0.54, 0.2 + r * 0.38, 0);
          wallMon.add(block);
        }
      }
      p2.add(wallMon);

      // 3. Back Pillar 1: Ten Commandments Twin Tablets (ศิลาจารึกบัญญัติ 10 ประการ)
      const p3 = createPedestal(-18, -34.5, 'ศิลาจารึกพระบัญญัติ 10 ประการ', 'ธรรมนูญทางจริยธรรมที่โมเสสรับบนยอดเขาซีนาย');
      addStatueSpotlight(-18, -34.5, 0x93c5fd);
      const tablets = new THREE.Group();
      tablets.position.set(0, 2.05, 0);

      const tabMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.5 });
      const tabGeo = new THREE.BoxGeometry(0.42, 1.1, 0.12);
      const tab1 = new THREE.Mesh(tabGeo, tabMat); tab1.position.set(-0.25, 0.65, 0); tablets.add(tab1);
      const tab2 = new THREE.Mesh(tabGeo, tabMat); tab2.position.set(0.25, 0.65, 0); tablets.add(tab2);
      p3.add(tablets);

      // 4. Back Pillar 2: Ancient Golden Menorah (คันประทีปเมโนราห์ 7 กิ่งโบราณ)
      const p4 = createPedestal(18, -34.5, 'คันประทีปเมโนราห์ 7 กิ่งทองคำแท้', 'แสงสว่างแห่งปัญญาและการสถิตอยู่ของพระเจ้า');
      addStatueSpotlight(18, -34.5, 0xfbbf24);
      const menorah = new THREE.Group();
      menorah.position.set(0, 2.05, 0);

      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 1.6, 12), goldMat);
      stem.position.y = 0.8; menorah.add(stem);

      const mRadii = [0.28, 0.52, 0.74];
      mRadii.forEach(r => {
        const arm = new THREE.Mesh(new THREE.TorusGeometry(r, 0.04, 8, 20, Math.PI), goldMat);
        arm.position.y = 0.8; menorah.add(arm);
      });
      p4.add(menorah);
    }
  }

  // =========================================================================
  // CLASSROOM RELIGIOUS WALL MURALS (ภาพจิตรกรรมตกแต่งรอบห้องเรียน 8 บานใหญ่)
  // =========================================================================
  buildReligiousWallMurals(roomId, info) {
    const muralLocations = [
      // Left Wall (4 Murals)
      { x: -36.8, y: 4.6, z: 24, rotY: Math.PI / 2, slot: 1 },
      { x: -36.8, y: 4.6, z: 12, rotY: Math.PI / 2, slot: 2 },
      { x: -36.8, y: 4.6, z: -14, rotY: Math.PI / 2, slot: 3 },
      { x: -36.8, y: 4.6, z: -26, rotY: Math.PI / 2, slot: 4 },
      // Right Wall (4 Murals)
      { x: 36.8, y: 4.6, z: 24, rotY: -Math.PI / 2, slot: 5 },
      { x: 36.8, y: 4.6, z: 12, rotY: -Math.PI / 2, slot: 6 },
      { x: 36.8, y: 4.6, z: -14, rotY: -Math.PI / 2, slot: 7 },
      { x: 36.8, y: 4.6, z: -26, rotY: -Math.PI / 2, slot: 8 }
    ];

    const muralDataByRoom = {
      '1': [
        { title: 'พุทธประวัติ: การประสูติและตรัสรู้', sub: 'ใต้ควงไม้พระศรีมหาโพธิ์ พุทธคยา', desc: 'องค์สมเด็จพระสัมมาสัมพุทธเจ้าทรงบำเพ็ญเพียรจนตรัสรู้อนุตตรสัมมาสัมโพธิญาณ' },
        { title: 'ปฐมเทศนา: ธัมมจักกัปปวัตตนสูตร', sub: 'ป่าอิสิปตนมฤคทายวัน เมืองพาราณสี', desc: 'ทรงแสดงธรรมจักรอันประเสริฐแก่อนุพุทธปัญจวัคคีย์ บังเกิดพระรัตนตรัยครบองค์สาม' },
        { title: 'ปรินิพพาน: พระมหาปรินิพพานสูตร', sub: 'สาลวโนทยาน เมืองกุสินารา', desc: 'ทรงประทานปัจฉิมโอวาท ความไม่ประมาทคือยอดแห่งธรรม ก่อนเสด็จดับขันธปรินิพพาน' },
        { title: 'จิตรกรรมไทยโบราณ: ไตรภูมิพระร่วง', sub: 'สืบสานพุทธศิลป์และหลักแห่งการเวียนว่ายตายเกิด', desc: 'สะท้อนคติธรรมเรื่องกฎแห่งกรรม กุศลกรรม และหนทางสู่แดนนิพพาน' },
        { title: 'มหาทานบารมี: พระเวสสันดรชาดก', sub: 'บำเพ็ญทศบารมีขั้นปรมัตถบารมี', desc: 'การสละกิเลส ความตระหนี่ และการบำเพ็ญทานเพื่อประโยชน์สุขแก่มหาชน' },
        { title: 'สังเวชนียสถาน 4 ตำบลแห่งศรัทธา', sub: 'ลุมพินีวัน • พุทธคยา • สารนาถ • กุสินารา', desc: 'อนุสรณ์สถานสำคัญ 4 แห่งที่ชาวพุทธทั่วโลกน้อมรำลึกถึงพระพุทธคุณ' },
        { title: 'พุทธศิลป์สุโขทัย: พระพุทธชินราช', sub: 'เอกลักษณ์แห่งความงดงามและศรัทธาไทย', desc: 'ความประณีตแห่งประติมากรรมสำริดที่สะท้อนความสงบเย็นและจิตวิญญาณแห่งธรรม' },
        { title: 'อริยสัจ 4 และมรรคมีองค์ 8', sub: 'หัวใจแห่งความจริงแท้และการดับทุกข์', desc: 'ทางสายกลางเพื่อการดำเนินชีวิตอย่างมีสติ ปัญญา และความสงบสุขอันแท้จริง' }
      ],
      '2': [
        { title: 'หน้าต่างกระจกสีโกธิก (Stained Glass)', sub: 'ศิลปะแสงศักดิ์สิทธิ์แห่งมหาวิหารคริสต์', desc: 'ความงดงามแห่งสถาปัตยกรรมที่ถ่ายทอดเรื่องราวพระคัมภีร์ผ่านประกายแสงแห่งศรัทธา' },
        { title: 'การประสูติของพระเยซูคริสต์ (The Nativity)', sub: 'ณ เมืองเบธเลเฮม แคว้นยูเดีย', desc: 'พระผู้ช่วยให้รอดเสด็จมาบังเกิด นำความหวังและความรอดพ้นมาสู่มวลมนุษยชาติ' },
        { title: 'เทศนาบนภูเขา (Sermon on the Mount)', sub: 'บทสอนแห่งความสุขและบัญญัติแห่งความรัก', desc: 'จงรักพระเจ้าสุดจิตใจ และรักเพื่อนบ้านเหมือนรักตนเอง เพื่อสันติสุขแท้จริง' },
        { title: 'อาหารค่ำมื้อสุดท้าย (The Last Supper)', sub: 'พระเยซูกับอัครสาวกทั้งสิบสอง', desc: 'พิธีศีลมหาสนิท ขนมปังคือพระกาย และเหล้าองุ่นคือพระโลหิตแห่งพันธสัญญาใหม่' },
        { title: 'พระทรมานและการฟื้นคืนพระชนม์', sub: 'ชัยชนะเหนือความตาย ณ วันอีสเตอร์', desc: 'ความเสียสละสูงสุดบนไม้กางเขนเพื่อไถ่บาปและมอบชีวิตนิรันดร์แก่มนุษย์' },
        { title: 'ศีลศักดิ์สิทธิ์และพระหรรษทาน', sub: 'ศีลล้างบาปและศีลมหาสนิท', desc: 'เครื่องหมายศักดิ์สิทธิ์แห่งความผูกพันและพระเมตตาคุณอันไร้ขอบเขต' },
        { title: 'อัครสาวกและพระคัมภีร์ไบเบิล', sub: 'พระคัมภีร์เดิมและพระคัมภีร์ใหม่', desc: 'การเผยแผ่พระกิตติคุณแห่งสันติภาพและความรอดพ้นไปสู่ทุกชนชาติทั่วโลก' },
        { title: 'เมตตาธรรมและการให้อภัย (Agape)', sub: 'ความรักที่ไร้เงื่อนไขและการคืนดี', desc: 'คำสอนเรื่องการรักแม้กระทั่งศัตรู และการร่วมมือสร้างสันติภาพในโลก' }
      ],
      '3': [
        { title: 'จิตรกรรมตรีมูรติ: พระผู้เป็นเจ้า 3 องค์', sub: 'พระพรหม (สร้าง) • พระวิษณุ (รักษา) • พระศิวะ (ทำลาย)', desc: 'ปรัชญาการหมุนเวียนแห่งจักรวาล การกำเนิด ดำรงอยู่ และดับสลายสู่การเริ่มต้นใหม่' },
        { title: 'มหากาพย์ภควัทคีตา: บทสนทนาแห่งสัจธรรม', sub: 'พระกฤษณะและอรชุน ณ ทุ่งกุรุเกษตร', desc: 'คำสอนเรื่องหน้าที่ (ธรรมะ) การไม่ยึดติดในผลแห่งกรรม และการหลุดพ้น (โมกษะ)' },
        { title: 'พระพิฆเนศวร: มหาเทพแห่งปัญญา', sub: 'ผู้ขจัดอุปสรรคทั้งปวงและประทานความสำเร็จ', desc: 'เทพเจ้าแห่งศิลปวิทยาการ สติปัญญา และจุดเริ่มต้นแห่งความเจริญรุ่งเรือง' },
        { title: 'ศิวนาฏราช: ระบำจักรวาลศักดิ์สิทธิ์', sub: 'การเต้นรำแห่งไฟเพื่อชำระล้างความอวิชชา', desc: 'สัญลักษณ์แห่งพลังงานพลวัตที่ขับเคลื่อนความเป็นไปของจักรวาลทุกมิติ' },
        { title: 'มหากาพย์รามายณะ: คุณธรรมและความภักดี', sub: 'เรื่องราวของพระรามและนางสีดา', desc: 'การรักษาคำสัตย์ หน้าที่แห่งกษัตริย์ และชัยชนะของความดีเหนือความชั่วร้าย' },
        { title: 'ศิลปะมัณฑะลาฮินดูและโยคะศาสตร์', sub: 'ลวดลายเรขาคณิตแห่งจิตวิญญาณและสมาธิ', desc: 'ภาพสัญลักษณ์แทนโครงสร้างแห่งสัจธรรมและการรวมเป็นหนึ่งเดียวกับพรหมัน' },
        { title: 'พิธีกรรมคงคาอารตี: บูชาพระแม่คงคา', sub: 'สายน้ำศักดิ์สิทธิ์ ณ เมืองพาราณสี', desc: 'การแสดงความกตัญญูกตเวทีต่อธรรมชาติและสายน้ำผู้หล่อเลี้ยงสรรพชีวิต' },
        { title: 'กฎแห่งกรรมและวัฏสงสาร (Samsara)', sub: 'การเวียนว่ายตายเกิดและทางสู่โมกษะ', desc: 'มนุษย์ย่อมเป็นไปตามการกระทำของตน และสามารถหลุดพ้นได้ด้วยความรู้แจ้ง' }
      ],
      '4': [
        { title: 'มัสยิดอัลฮะรอมและกะอ์บะฮ์ นครมักกะฮ์', sub: 'ศูนย์รวมจิตวิญญาณและทิศกิบลัตของมุสลิมทั่วโลก', desc: 'สถานที่ประกอบพิธีฮัจญ์อันศักดิ์สิทธิ์ แสดงถึงความเสมอภาคและความเป็นภราดรภาพ' },
        { title: 'ศิลปะอักษรวิจิตรคาลลิกราฟีอาหรับ', sub: 'พระดำรัสอันศักดิ์สิทธิ์จากพระมหาคัมภีร์อัลกุรอาน', desc: 'ความประณีตแห่งอักษรศาสตร์ที่สรรเสริญความเกรียงไกรและพระเมตตาของพระผู้เป็นเจ้า' },
        { title: 'มัสยิดโดมทอง อัลอักศอ (Al-Aqsa Mosque)', sub: 'ณ นครเยรูซาเลม สถานที่สำคัญแห่งเหตุการณ์อิสรออ์-มิอ์รอจญ์', desc: 'สัญลักษณ์แห่งความศรัทธาและความผูกพันทางประวัติศาสตร์ของชาวมุสลิม' },
        { title: 'มัสยิดอันนะบะวี นครมะดีนะฮ์', sub: 'มัสยิดของท่านศาสดามุฮัมมัด', desc: 'ศูนย์กลางแห่งสังคมคุณธรรม ความยุติธรรม และการอยู่ร่วมกันอย่างสันติ' },
        { title: 'ลวดลายเรขาคณิตอิสลาม (Arabesque Mosaic)', sub: 'ความงดงามแห่งระเบียบจักรวาลอันไม่มีที่สิ้นสุด', desc: 'ศิลปะลายวิจิตรที่ปราศจากรูปเคารพ สะท้อนเอกภาพและความสมบูรณ์แบบแห่งผู้สร้าง' },
        { title: 'การประทานอัลกุรอาน ณ ถ้ำฮิรออ์', sub: 'คืนลัยละตุลก็อดร์ คืนแห่งเกียรติยศ', desc: 'มลาอิกะฮ์ญิบรีลนำโองการแรก "จงอ่าน" (อิกเราะอ์) มาประทานแก่นบีมุฮัมมัด' },
        { title: 'ยุคทองแห่งวิทยาการและปรัชญาอิสลาม', sub: 'การแพทย์ ดาราศาสตร์ และคณิตศาสตร์', desc: 'การค้นคว้าทางวิทยาศาสตร์ที่ส่งต่อแสงสว่างทางปัญญาแก่อารยธรรมมนุษยชาติ' },
        { title: 'ภราดรภาพและการช่วยเหลือเกื้อกูล (Zakat)', sub: 'การเกื้อกูลผู้ยากไร้และความยุติธรรมทางสังคม', desc: 'หลักปฏิบัติเพื่อลดความเหลื่อมล้ำและสร้างสังคมแห่งความเอื้ออาทรและศานติ' }
      ],
      '5': [
        { title: 'โมเสสรับพระบัญญัติ 10 ประการ', sub: 'ณ ยอดเขาซีนาย จากพระยาห์เวห์', desc: 'หลักศิลาแห่งจริยธรรม ศีลธรรม และพันธสัญญาระหว่างพระเจ้ากับชนชาติอิสราเอล' },
        { title: 'กำแพงร้องไห้ (The Western Wall)', sub: 'ณ นครเยรูซาเลม สถานที่ศักดิ์สิทธิ์สูงสุดของชาวยิว', desc: 'ซากกำแพงพระวิหารโซโลมอน ศูนย์รวมการอธิษฐานและความหวังของชุมชนยิวทั่วโลก' },
        { title: 'ม้วนพระคัมภีร์โทราห์ศักดิ์สิทธิ์ (The Torah)', sub: 'เบญจบรรณและบทบัญญัติแห่งชีวิต', desc: 'ธรรมนูญแห่งความยุติธรรม ปัญญา และการดำเนินชีวิตที่ยึดมั่นในพระผู้เป็นเจ้า' },
        { title: 'ดาวแห่งเดวิดและคันประทีปเมโนราห์', sub: 'สัญลักษณ์แห่งเอกภาพ แสงสว่าง และประวัติศาสตร์', desc: 'แสงสว่าง 7 ดวงแห่งเมโนราห์ที่ส่องนำทางชนชาติผ่านกาลเวลาหลายพันปี' },
        { title: 'พระวิหารแห่งกษัตริย์โซโลมอนในอดีต', sub: 'ศูนย์กลางแห่งการนมัสการและความรุ่งโรจน์', desc: 'อนุสรณ์ทางประวัติศาสตร์ที่สะท้อนศรัทธาและความเป็นปึกแผ่นของชนชาติ' },
        { title: 'วันสะบาโตและเทศกาลปัสกา (Passover)', sub: 'วันพักผ่อนศักดิ์สิทธิ์และการรำลึกการหลุดพ้น', desc: 'การหยุดพักเพื่อจิตวิญญาณและน้อมรำลึกถึงพระคุณที่ทรงนำให้พ้นจากการเป็นทาส' },
        { title: 'ปัญญาญาณแห่งสุภาษิตกษัตริย์โซโลมอน', sub: 'ข้อคิดเตือนใจเรื่องคุณธรรมและการดำเนินชีวิต', desc: 'ความยำเกรงพระเจ้าเป็นบ่อเกิดแห่งปัญญาแท้จริง และการปฏิบัติตนด้วยความซื่อตรง' },
        { title: 'จริยธรรมติกกุน โอรัม (Tikkun Olam)', sub: 'การร่วมมือซ่อมแซมและพัฒนาโลกให้ดีขึ้น', desc: 'มโนธรรมของชาวยิวในการสร้างความยุติธรรม ความเท่าเทียม และการอนุรักษ์สิ่งแวดล้อม' }
      ]
    };

    const murals = muralDataByRoom[roomId] || muralDataByRoom['1'];

    muralLocations.forEach((loc, idx) => {
      const data = murals[idx] || murals[0];
      const muralGroup = new THREE.Group();
      muralGroup.position.set(loc.x, loc.y, loc.z);
      muralGroup.rotation.y = loc.rotY;

      const mW = 5.2;
      const mH = 3.2;

      // 1. Canvas painting
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 640;
      this.renderMuralCanvas(canvas, data, roomId, info, idx);

      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      this.muralTextures.push(texture);

      const planeGeo = new THREE.PlaneGeometry(mW, mH);
      const planeMat = new THREE.MeshBasicMaterial({ map: texture });
      const plane = new THREE.Mesh(planeGeo, planeMat);
      plane.position.z = 0.05;
      muralGroup.add(plane);

      // 2. Ornate Dark Mahogany Picture Frame with Gold Slip
      const frameGeo = new THREE.BoxGeometry(mW + 0.3, mH + 0.3, 0.1);
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.4 });
      const frame = new THREE.Mesh(frameGeo, frameMat);
      muralGroup.add(frame);

      // 3. Overhead Picture Spotlight
      const lampGeo = new THREE.CylinderGeometry(0.1, 0.15, 0.4, 12);
      const lampMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8 });
      const lamp = new THREE.Mesh(lampGeo, lampMat);
      lamp.rotation.x = Math.PI / 2;
      lamp.position.set(0, mH / 2 + 0.3, 0.35);
      muralGroup.add(lamp);

      this.religionDecorGroup.add(muralGroup);
    });
  }

  renderMuralCanvas(canvas, data, roomId, info, slotIdx) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const roomColor = info.color || '#f59e0b';

    ctx.clearRect(0, 0, w, h);

    // Deep museum gallery canvas background
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#0c1322');
    grad.addColorStop(0.5, '#1e293b');
    grad.addColorStop(1, '#0c1322');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Warm radial spotlight
    const rad = ctx.createRadialGradient(w / 2, 220, 40, w / 2, 220, 360);
    rad.addColorStop(0, this.hexToRgba(roomColor, 0.42));
    rad.addColorStop(1, 'rgba(12, 19, 34, 0)');
    ctx.fillStyle = rad;
    ctx.fillRect(0, 0, w, h);

    // Outer and Inner Gold Filigree Borders
    ctx.strokeStyle = roomColor;
    ctx.lineWidth = 4;
    ctx.strokeRect(16, 16, w - 32, h - 32);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(26, 26, w - 52, h - 52);

    // Draw religion image if preloaded
    const relImg = this.loadedReligionImages[roomId];
    if (relImg && relImg.complete && relImg.naturalWidth > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(40, 40, w - 80, 340, 16);
      ctx.clip();

      const srcW = relImg.naturalWidth;
      const srcH = relImg.naturalHeight;
      const scale = Math.max((w - 80) / srcW, 340 / srcH);
      const dw = srcW * scale;
      const dh = srcH * scale;
      const dx = 40 + ((w - 80) - dw) / 2;
      const dy = 40 + (340 - dh) / 2;
      ctx.drawImage(relImg, dx, dy, dw, dh);

      const imgGrad = ctx.createLinearGradient(0, 220, 0, 380);
      imgGrad.addColorStop(0, 'rgba(12, 19, 34, 0)');
      imgGrad.addColorStop(1, '#0c1322');
      ctx.fillStyle = imgGrad;
      ctx.fillRect(40, 220, w - 80, 160);
      ctx.restore();
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.font = '90px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(info.icon || '🏛️', w / 2, 210);
    }

    // Lower Museum Plaque Area
    const plaqueY = 400;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.beginPath();
    ctx.roundRect(40, plaqueY, w - 80, 200, 14);
    ctx.fill();
    ctx.strokeStyle = roomColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Religious Emblem & Slot Tag
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 22px Prompt, Sarabun, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${info.icon} ภาพประดับห้องเรียน: ${info.name} • ชิ้นที่ ${slotIdx + 1}/8`, 65, plaqueY + 38);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px Prompt, Sarabun, sans-serif';
    ctx.fillText(data.title, 65, plaqueY + 78);

    // Subtitle
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 20px Prompt, Sarabun, sans-serif';
    ctx.fillText(`• ${data.sub}`, 65, plaqueY + 114);

    // Description text
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '19px Prompt, Sarabun, sans-serif';
    ctx.fillText(data.desc, 65, plaqueY + 152);
  }

  // =========================================================================
  // CLASSROOM EDUCATIONAL KNOWLEDGE BOARDS (ใบความรู้ประจำห้องเรียน 6 บานใหญ่)
  // =========================================================================
  buildReligiousKnowledgeBoards(roomId, info) {
    if (!this.knowledgeTextures) this.knowledgeTextures = [];

    const boardLocations = [
      // 2 on Back Wall (Left and Right of Motto)
      { x: -10, y: 4.6, z: -37.4, rotY: 0, slot: 1 },
      { x: 10, y: 4.6, z: -37.4, rotY: 0, slot: 2 },
      // 2 on Left Partition Wall (Facing Central Classroom)
      { x: -15.5, y: 4.4, z: -13, rotY: Math.PI / 2, slot: 3 },
      { x: -15.5, y: 4.4, z: -27, rotY: Math.PI / 2, slot: 4 },
      // 2 on Right Partition Wall (Facing Central Classroom)
      { x: 15.5, y: 4.4, z: -13, rotY: -Math.PI / 2, slot: 5 },
      { x: 15.5, y: 4.4, z: -27, rotY: -Math.PI / 2, slot: 6 }
    ];

    const knowledgeDataByRoom = {
      '1': [
        {
          num: 1,
          category: 'ประวัติความเป็นมาและพระศาสดา',
          title: 'พระพุทธประวัติและศากยวงศ์',
          badge: '☸️ ศาสดาแห่งสันติภาพ',
          card1Title: 'การประสูติและออกผนวช',
          card1Text: 'เจ้าชายสิทธัตถะ ประสูติ ณ ลุมพินีวัน ทรงเห็นเทวทูต 4 (คนแก่ คนเจ็บ คนตาย บรรพชิต) จึงสละราชสมบัติออกผนวชเพื่อแสวงหาทางพ้นทุกข์',
          card2Title: 'การตรัสรู้และแสดงธรรม',
          card2Text: 'ทรงบำเพ็ญเพียรจนตรัสรู้อนุตตรสัมมาสัมโพธิญาณ ณ ใต้ควงไม้พระศรีมหาโพธิ์ ทรงแสดงปฐมเทศนา ธัมมจักกัปปวัตตนสูตร บังเกิดพระสงฆ์องค์แรก',
          card3Title: 'ข้อคิดคติธรรมสำหรับนักเรียน',
          card3Text: 'ความเพียรพยายามอันแน่วแน่ และการมีสติปัญญาไตร่ตรอง สามารถนำพาชีวิตก้าวข้ามอุปสรรคและความทุกข์ทั้งปวงได้'
        },
        {
          num: 2,
          category: 'พระคัมภีร์และคัมภีร์ศักดิ์สิทธิ์',
          title: 'พระไตรปิฎก: ขุมทรัพย์ทางปัญญา ๓ ปิฎก',
          badge: '📜 พระธรรมวินัย 84,000 พระธรรมขันธ์',
          card1Title: '๑. พระวินัยปิฎก (ศีลและระเบียบ)',
          card1Text: 'รวบรวมพุทธบัญญัติ ข้อห้าม และระเบียบปฏิบัติของภิกษุและภิกษุณี เพื่อความเรียบร้อยดีงามแห่งสงฆ์',
          card2Title: '๒. พระสุตตันตปิฎก (พระสูตรและนิทาน)',
          card2Text: 'รวบรวมพระธรรมเทศนา ชาดก และเรื่องราวประกอบคำสอนที่ทรงแสดงแก่บุคคลในสถานการณ์ต่างๆ',
          card3Title: '๓. พระอภิธรรมปิฎก (ปรมัตถธรรม)',
          card3Text: 'รวบรวมหลักธรรมชั้นสูง อธิบายสภาวธรรม จิต เจตสิก รูป นิพพาน โดยละเอียดลึกซึ้ง'
        },
        {
          num: 3,
          category: 'หลักธรรมและปรัชญาสำคัญ',
          title: 'อริยสัจ ๔ และมรรคมีองค์ ๘ (ทางสายกลาง)',
          badge: '💡 สัจธรรมความจริงอันประเสริฐ',
          card1Title: 'อริยสัจ ๔: กฎแห่งเหตุและผล',
          card1Text: 'ทุกข์ (สภาพทนได้ยาก) • สมุทัย (สาเหตุแห่งทุกข์คือตัณหา) • นิโรธ (ความดับทุกข์) • มรรค (ข้อปฏิบัติให้ถึงความดับทุกข์)',
          card2Title: 'มัชฌิมาปฏิปทา: มรรคมีองค์ ๘',
          card2Text: 'สัมมาทิฏฐิ สัมมาสังกัปปะ สัมมาวาจา สัมมากัมมันตะ สัมมาอาชีวะ สัมมาวายามะ สัมมาสติ สัมมาสมาธิ',
          card3Title: 'การนำไปปฏิบัติในวัยเรียน',
          card3Text: 'ไม่ตึงไม่หย่อนเกินไป รู้จักวิเคราะห์สาเหตุของปัญหาในการเรียน และแก้ไขด้วยความเพียรอย่างมีสติ'
        },
        {
          num: 4,
          category: 'ศาสนสถานและสังเวชนียสถาน',
          title: 'สังเวชนียสถาน ๔ ตำบล และวัดพุทธศาสนา',
          badge: '🏛️ อนุสรณ์สถานแห่งศรัทธา',
          card1Title: '๔ สังเวชนียสถานในอินเดีย-เนปาล',
          card1Text: '๑. ลุมพินีวัน (ประสูติ) • ๒. พุทธคยา (ตรัสรู้) • ๓. สารนาถ (ปฐมเทศนา) • ๔. กุสินารา (ปรินิพพาน)',
          card2Title: 'เขตพุทธาวาสและสังฆาวาส',
          card2Text: 'พระอุโบสถ (ประกอบสังฆกรรม) • พระวิหาร (ประดิษฐานพระพุทธรูป) • พระเจดีย์ (บรรจุพระธาตุ) • กุฏิสงฆ์',
          card3Title: 'มารยาทชาวพุทธในศาสนสถาน',
          card3Text: 'แต่งกายสุภาพ สำรวมกิริยาวาจา ถอดรองเท้าก่อนเข้าอุโบสถ และแสดงความเคารพต่อพระรัตนตรัย'
        },
        {
          num: 5,
          category: 'วันสำคัญและพิธีกรรมทางศาสนา',
          title: 'วันสำคัญทางพระพุทธศาสนาและประเพณีไทย',
          badge: '🕯️ วันพระและวันสำคัญสากล',
          card1Title: 'วันสำคัญ ๔ วาระแห่งปี',
          card1Text: 'วันมาฆบูชา (โอวาทปาติโมกข์) • วันวิสาขบูชา (ประสูติ ตรัสรู้ ปรินิพพาน) • วันอาสาฬหบูชา (ปฐมเทศนา) • วันเข้าพรรษา',
          card2Title: 'พิธีกรรมและกุศลพิธี',
          card2Text: 'การตักบาตร ฟังเทศน์ เวียนเทียน รักษาศีล ๕ ศีล ๘ ทอดกฐิน และการเจริญสมาธิภาวนา',
          card3Title: 'คุณค่าทางสังคมและวัฒนธรรม',
          card3Text: 'เป็นศูนย์รวมจิตใจ เสริมสร้างความสามัคคีในชุมชน และสืบทอดภูมิปัญญาวิถีไทยอันงดงาม'
        },
        {
          num: 6,
          category: 'การประยุกต์ใช้ในชีวิตประจำวัน',
          title: 'เบญจศีล-เบญจธรรม และทิศ ๖ เพื่อสันติสุข',
          badge: '🌟 คุณธรรมเพื่อชีวิตและความสำเร็จ',
          card1Title: 'เบญจศีลและเบญจธรรม (คู่ธรรมนำสุข)',
          card1Text: 'ไม่ฆ่าสัตว์-มีเมตตา • ไม่ลักทรัพย์-สัมมาอาชีวะ • ไม่ประพฤติผิดในกาม-สำรวมระวัง • ไม่พูดเท็จ-มีสัตย์ • ไม่ดื่มสุรา-มีสติสัมปชัญญะ',
          card2Title: 'ทิศ ๖: หน้าที่ต่อสังคม',
          card2Text: 'บิดามารดา (ทิศเบื้องหน้า) • ครูอาจารย์ (ทิศเบื้องขวา) • เพื่อนฝูง (ทิศเบื้องซ้าย) • ผู้มีพระคุณและสังคม',
          card3Title: 'ข้อคิดประจำใจนักเรียนพัฒนานิคม',
          card3Text: '"ความกตัญญูกตเวทีเป็นเครื่องหมายของคนดี" มุ่งมั่นศึกษาเล่าเรียน ซื่อสัตย์ และเป็นพลเมืองดีของสังคม'
        }
      ],
      '2': [
        {
          num: 1,
          category: 'ประวัติความเป็นมาและพระศาสดา',
          title: 'พระเยซูคริสต์: พระผู้ช่วยให้รอดและข่าวประเสริฐ',
          badge: '✝️ พระผู้ไถ่แห่งมวลมนุษยชาติ',
          card1Title: 'การประสูติและพระชนม์ชีพ',
          card1Text: 'พระเยซูคริสต์ทรงประสูติ ณ เมืองเบธเลเฮม แคว้นยูเดีย ทรงเจริญวัยและเริ่มประกาศอาณาจักรของพระเจ้าเมื่อพระชนมายุ 30 พรรษา',
          card2Title: 'พระราชกิจและการประกาศข่าวประเสริฐ',
          card2Text: 'ทรงรักษาคนป่วย คนตาบอด ทรงสอนด้วยคำอุปมา และทรงสำแดงความรักของพระเจ้าแก่คนยากไร้และคนบาป',
          card3Title: 'การสิ้นพระชนม์และการฟื้นคืนพระชนม์',
          card3Text: 'ทรงยอมสิ้นพระชนม์บนไม้กางเขนเพื่อไถ่บาปแก่มนุษย์ และทรงฟื้นคืนพระชนม์ในวันที่สาม ชัยชนะเหนือความตาย'
        },
        {
          num: 2,
          category: 'พระคัมภีร์และคัมภีร์ศักดิ์สิทธิ์',
          title: 'พระคริสตธรรมคัมภีร์ (The Holy Bible)',
          badge: '📖 พระวจนะแห่งชีวิต ๖๖ เล่ม',
          card1Title: '๑. พระคัมภีร์พันธสัญญาเดิม (Old Testament)',
          card1Text: '๓๙ เล่ม รวบรวมประวัติศาสตร์ การทรงสร้างโลก บัญญัติ ๑๐ ประการ เพลงสดุดี และคำพยากรณ์ของผู้เผยพระวจนะ',
          card2Title: '๒. พระคัมภีร์พันธสัญญาใหม่ (New Testament)',
          card2Text: '๒๗ เล่ม รวบรวมพระกิตติคุณ ๔ เล่ม (มัทธิว มาระโก ลูกา ยอห์น) กิจการของอัครทูต จดหมายฝาก และวิวรณ์',
          card3Title: 'คุณค่าและการนำไปใช้',
          card3Text: '"พระวจนะของพระองค์เป็นโคมสำหรับเท้าของข้าพระองค์ และเป็นความสว่างส่องทางของข้าพระองค์" (สดุดี 119:105)'
        },
        {
          num: 3,
          category: 'หลักธรรมและปรัชญาสำคัญ',
          title: 'พระบัญญัติเอกแห่งความรักและหลักตรีเอกภาพ',
          badge: '❤️ ความรัก เมตตา และการให้อภัย',
          card1Title: 'พระบัญญัติเอก: บัญญัติแห่งความรัก',
          card1Text: '"จงรักพระเจ้าสุดจิตสุดใจ และจงรักเพื่อนบ้านเหมือนรักตนเอง" หัวใจสำคัญสูงสุดแห่งศาสนาคริสต์',
          card2Title: 'หลักตรีเอกภาพ (Trinity)',
          card2Text: 'พระเจ้าองค์เดียวทรงปรากฏเป็น ๓ พระบุคคล: พระบิดา (ผู้สร้าง) • พระบุตร (พระเยซูผู้ไถ่) • พระวิญญาณบริสุทธิ์ (ผู้ปลอบประโลม)',
          card3Title: 'คำเทศนาบนภูเขา (บทเรียนแห่งความสุข)',
          card3Text: 'ผู้มีใจยากจน ผู้ที่สร้างสันติสุข และผู้มีใจบริสุทธิ์ ย่อมได้รับพระพรอันประเสริฐในแผ่นดินของพระเจ้า'
        },
        {
          num: 4,
          category: 'ศาสนสถานและสังเวชนียสถาน',
          title: 'โบสถ์คริสต์ มหาวิหาร และดินแดนศักดิ์สิทธิ์',
          badge: '⛪ พระวิหารแห่งการนมัสการ',
          card1Title: 'สถาปัตยกรรมโบสถ์คริสต์',
          card1Text: 'แท่นบูชา (Altar) • ไม้กางเขน • หน้าต่างกระจกสี (Stained Glass) • ธรรมาสน์เทศน์ และอ่างศีลล้างบาป',
          card2Title: 'สถานที่สำคัญทางประวัติศาสตร์',
          card2Text: 'นครเยรูซาเลม • โบสถ์แห่งการประสูติ เมืองเบธเลเฮม • โบสถ์พระคูหาศักดิ์สิทธิ์ (Church of the Holy Sepulchre)',
          card3Title: 'บทบาทของคริสตจักรในสังคม',
          card3Text: 'เป็นศูนย์รวมแห่งการนมัสการพระเจ้า การช่วยเหลือผู้ตกทุกข์ได้ยาก การศึกษา และการแพทย์เพื่อมวลชน'
        },
        {
          num: 5,
          category: 'วันสำคัญและพิธีกรรมทางศาสนา',
          title: 'เทศกาลศักดิ์สิทธิ์และพิธีศีลศักดิ์สิทธิ์',
          badge: '🕊️ ศีลศักดิ์สิทธิ์และวันสมโภช',
          card1Title: 'เทศกาลสำคัญประจำปี',
          card1Text: 'วันคริสต์มาส (สมโภชการประสูติ) • วันศุกร์ประเสริฐ (Good Friday) • วันอีสเตอร์ (ฉลองการฟื้นคืนพระชนม์) • วันเพนเทคอสต์',
          card2Title: 'ศีลศักดิ์สิทธิ์สำคัญ (Sacraments)',
          card2Text: 'ศีลล้างบาป (การเข้าเป็นคริสตชน) • ศีลมหาสนิท (ขนมปังและเหล้าองุ่น ระลึกถึงพระกายและพระโลหิต)',
          card3Title: 'การอธิษฐานและการนมัสการ',
          card3Text: 'การนมัสการในวันอาทิตย์ การร้องเพลงนมัสการ และบทอธิษฐานข้าแต่พระบิดาแห่งข้าพระองค์ทั้งหลาย'
        },
        {
          num: 6,
          category: 'การประยุกต์ใช้ในชีวิตประจำวัน',
          title: 'ผลแห่งพระวิญญาณและความรักที่ไร้เงื่อนไข',
          badge: '🌱 คุณธรรมเพื่อการอยู่ร่วมกัน',
          card1Title: 'ผลแห่งพระวิญญาณ ๙ ประการ',
          card1Text: 'ความรัก • ความชื่นชมยินดี • สันติสุข • ความอดทน • ความปรานี • ความดี • ความสัตย์ซื่อ • ความสุภาพอ่อนน้อม • การรู้จักบังคับตน',
          card2Title: 'การให้อภัยและการคืนดี',
          card2Text: 'การไม่พยาบาทจองเวร การให้อภัยเจ็ดสิบครั้งคูณเจ็ด และการปฏิบัติต่อผู้อื่นตามที่ปรารถนาให้เขาปฏิบัติต่อตน',
          card3Title: 'บทบาทนักเรียนในสังคม',
          card3Text: 'เป็นแสงสว่างและเกลือแห่งโลก ช่วยเหลือเพื่อนนักเรียน มีความซื่อสัตย์ และสร้างบรรยากาศแห่งมิตรภาพในโรงเรียน'
        }
      ],
      '3': [
        {
          num: 1,
          category: 'ประวัติความเป็นมาและปรัชญา',
          title: 'ศาสนาพราหมณ์-ฮินดู: อารยธรรมและศรุตศาสตร์',
          badge: '🕉️ ศาสนาที่เก่าแก่ที่สุดในโลก',
          card1Title: 'กำเนิดและวิวัฒนาการ',
          card1Text: 'มีจุดเริ่มต้นในแถบลุ่มแม่น้ำสินธุ ไม่มีศาสดาองค์เดียว แต่พัฒนามาจากภูมิปัญญา ญาณทัศน์ของฤๅษี และคัมภีร์พระเวท',
          card2Title: 'ยุคพระเวทสู่ยุคฮินดู',
          card2Text: 'จากการบูชาเทพแห่งธรรมชาติ สู่ปรัชญาพรหมัน (สัจธรรมสูงสุด) และการเคารพมหาเทพผู้ทรงอำนาจแห่งจักรวาล',
          card3Title: 'คุณค่าแห่งความหลากหลาย',
          card3Text: 'ยอมรับเส้นทางสู่สัจธรรมที่หลากหลาย "ความจริงมีหนึ่งเดียว แต่นักปราชญ์เรียกขานด้วยนามต่างกัน"'
        },
        {
          num: 2,
          category: 'พระคัมภีร์และวรรณคดีศักดิ์สิทธิ์',
          title: 'คัมภีร์พระเวทและมหากาพย์ภควัทคีตา',
          badge: '📜 พระเวททั้ง ๔ และอุปนิษัท',
          card1Title: 'พระเวททั้ง ๔ (จตุรเวท)',
          card1Text: '๑. ฤคเวท (บทสวดสรรเสริญ) • ๒. ยชุรเวท (คู่มือประกอบพิธี) • ๓. สามเวท (บทสวดทำนองเพลง) • ๔. อถรรพเวท (เวทมนตร์และวิทยาการ)',
          card2Title: 'ภควัทคีตา (บทเพลงแห่งพระเจ้า)',
          card2Text: 'บทสนทนาอันลึกซึ้งระหว่างพระกฤษณะกับอรชุน ณ ทุ่งกุรุเกษตร สอนเรื่องการทำหน้าที่โดยไม่ยึดติดในผลลัพธ์',
          card3Title: 'มหากาพย์รามายณะและมหาภารตะ',
          card3Text: 'วรรณคดีเอกที่ถ่ายทอดบทเรียนชีวิต ความซื่อสัตย์ กตัญญู และผลแห่งกรรมอันเที่ยงแท้'
        },
        {
          num: 3,
          category: 'หลักธรรมและปรัชญาสำคัญ',
          title: 'ตรีมูรติ ปุรุษารถ ๔ และอาศรม ๔',
          badge: '🔱 ปรัชญาแห่งการดำเนินชีวิต',
          card1Title: 'มหาเทพตรีมูรติ ๓ พระองค์',
          card1Text: 'พระพรหม (ผู้สร้างจักรวาล) • พระวิษณุหรือนารายณ์ (ผู้ปกป้องคุ้มครอง) • พระศิวะ (ผู้ทำลายเพื่อเริ่มต้นใหม่)',
          card2Title: 'ปุรุษารถ ๔ (เป้าหมายของชีวิต)',
          card2Text: '๑. ธรรมะ (คุณธรรมความถูกต้อง) • ๒. อรรถะ (ความมั่นคงทางทรัพย์สิน) • ๓. กามะ (ความสุขทางโลก) • ๔. โมกษะ (ความหลุดพ้นสูงสุด)',
          card3Title: 'อาศรม ๔ (ช่วงวัยแห่งชีวิต)',
          card3Text: 'พรหมจารี (วัยศึกษาหาความรู้) • คฤหัสถ์ (วัยครองเรือน) • วานปรัสถ์ (วัยแสวงหาความสงบ) • สันยาสี (วัยสละกิเลส)'
        },
        {
          num: 4,
          category: 'ศาสนสถานและแม่น้ำศักดิ์สิทธิ์',
          title: 'เทวสถานฮินดูและแม่น้ำคงคาศักดิ์สิทธิ์',
          badge: '🛕 ศูนย์รวมแห่งการสักการะ',
          card1Title: 'สถาปัตยกรรมเทวาลัย (Mandir)',
          card1Text: 'ยอดศิขร (Spire) • ครรภคฤห์ (Sanctum ห้องประดิษฐานเทวรูปมูรติ) • มณฑป (โถงรวมผู้แสวงบุญ)',
          card2Title: 'แม่น้ำคงคาและเมืองพาราณสี',
          card2Text: 'แม่น้ำคงคาสายน้ำศักดิ์สิทธิ์ที่เชื่อว่าชำระบาปได้ และเมืองพาราณสี เมืองโบราณที่มีชีวิตกว่า ๓,๐๐๐ ปี',
          card3Title: 'พิธีกรรมปูจา (Puja) และคงคาอารตี',
          card3Text: 'การถวายดอกไม้ ประทีป ธูปเทียน และบทสวดสรรเสริญเพื่อแสดงความกตัญญูต่อพระผู้เป็นเจ้า'
        },
        {
          num: 5,
          category: 'วันสำคัญและเทศกาลทางศาสนา',
          title: 'เทศกาลดิวาลี โฮลี และคเณศจตุรถี',
          badge: '🪔 เทศกาลแห่งแสงสว่างและสีสัน',
          card1Title: 'เทศกาลดิวาลี (Diwali - เทศกาลแห่งแสงไฟ)',
          card1Text: 'เฉลิมฉลองชัยชนะของแสงสว่างเหนือดวงไฟ ชัยชนะของความดีเหนือความชั่วร้าย และต้อนรับพระแม่ลักษมี',
          card2Title: 'เทศกาลโฮลี (Holi - เทศกาลสาดสี)',
          card2Text: 'ต้อนรับฤดูใบไม้ผลิ สาดผงสีหลากสีสันเพื่อแสดงความเสมอภาค ขจัดความบาดหมาง และสร้างมิตรภาพ',
          card3Title: 'เทศกาลคเณศจตุรถี',
          card3Text: 'วันประสูติของพระพิฆเนศวร อัญเชิญเทวรูปมาสักการะและลอยลงสู่แม่น้ำเพื่อขอพรแห่งสติปัญญา'
        },
        {
          num: 6,
          category: 'การประยุกต์ใช้ในชีวิตประจำวัน',
          title: 'การไม่เบียดเบียน (อหิงสา) และโยคะศาสตร์',
          badge: '🧘 สติ สมาธิ และสันติภาพ',
          card1Title: 'หลักอหิงสา (Ahimsa)',
          card1Text: 'การไม่เบียดเบียนสิ่งมีชีวิตทั้งปวง ทั้งทางกาย วาจา และใจ การเคารพคุณค่าของทุกชีวิตในธรรมชาติ',
          card2Title: 'โยคะและสมาธิภาวนา',
          card2Text: 'การประสานกาย จิต และวิญญาณให้เป็นหนึ่งเดียว เสริมสร้างสุขภาพ สมาธิ และความสงบแห่งจิตใจ',
          card3Title: 'หลักการทำงาน: กรรมโยคะ',
          card3Text: 'ตั้งใจทำหน้าที่นักเรียนให้ดีที่สุดด้วยความซื่อสัตย์สุจริต โดยไม่หวังลาภยศ เป็นการปฏิบัติธรรมอย่างแท้จริง'
        }
      ],
      '4': [
        {
          num: 1,
          category: 'ประวัติความเป็นมาและศาสนทูต',
          title: 'ท่านนบีมุฮัมมัด (ซ.ล.) และการเผยแผ่อิสลาม',
          badge: '☪️ ศาสนทูตท่านสุดท้ายแห่งอัลลอฮ์',
          card1Title: 'การกำเนิดและพระจริยวัตร',
          card1Text: 'ท่านนบีมุฮัมมัดประสูติ ณ นครมักกะฮ์ ได้รับการยกย่องว่า "อัลอะมีน" (ผู้ซื่อสัตย์และไว้วางใจได้)',
          card2Title: 'การประทานวะฮีย์ ณ ถ้ำฮิรออ์',
          card2Text: 'เมื่อพระชนมายุ ๔๐ พรรษา มลาอิกะฮ์ญิบรีลนำโองการแรก "อิกเราะอ์" (จงอ่าน) มาประทาน เริ่มต้นการเป็นศาสนทูต',
          card3Title: 'การฮิจเราะฮ์สู่มะดีนะฮ์',
          card3Text: 'การอพยพเพื่อสร้างชุมชนแห่งศานติ ความยุติธรรม และภราดรภาพ เป็นจุดเริ่มต้นของศักราชอิสลาม (ฮ.ศ.)'
        },
        {
          num: 2,
          category: 'พระคัมภีร์และวจนะศักดิ์สิทธิ์',
          title: 'พระมหาคัมภีร์อัลกุรอานและอัลฮะดีษ',
          badge: '📖 พระดำรัสอันไร้การดัดแปลง',
          card1Title: 'พระมหาคัมภีร์อัลกุรอาน',
          card1Text: 'มี ๑๑๔ ซูเราะฮ์ (บท) รวบรวมพระวจนะของอัลลอฮ์ พระผู้เป็นเจ้า เป็นแนวทางในการดำเนินชีวิตทุกมิติ',
          card2Title: 'อัลฮะดีษและแบบฉบับซุนนะฮ์',
          card2Text: 'วจนะ การกระทำ และการยอมรับของท่านนบีมุฮัมมัด เป็นคู่มือขยายความคำสอนในอัลกุรอานอย่างสมบูรณ์',
          card3Title: 'การให้ความสำคัญกับการศึกษา',
          card3Text: '"การแสวงหาความรู้เป็นหน้าที่จำเป็นสำหรับมุสลิมทุกคน ทั้งชายและหญิง" ตั้งแต่เกิดจนกระทั่งเสียชีวิต'
        },
        {
          num: 3,
          category: 'หลักธรรมและหลักศรัทธาสำคัญ',
          title: 'หลักศรัทธา ๖ ประการ และหลักปฏิบัติ ๕ ประการ',
          badge: '⚖️ รากฐานแห่งชีวิตมุสลิม',
          card1Title: 'หลักศรัทธา ๖ ประการ (อีหม่าน)',
          card1Text: 'ศรัทธาต่อ: ๑. อัลลอฮ์องค์เดียว • ๒. บรรดามลาอิกะฮ์ • ๓. พระคัมภีร์ • ๔. บรรดาศาสนทูต • ๕. วันปรโลก • ๖. กฎสภาวะของพระองค์',
          card2Title: 'หลักปฏิบัติ ๕ ประการ (รุก่นอิสลาม)',
          card2Text: '๑. ปฏิญาณตน (ชะฮาดะฮ์) • ๒. ละหมาดวันละ ๕ เวลา • ๓. จ่ายซะกาตเกื้อกูลสังคม • ๔. ถือศีลอดเดือนรอมฎอน • ๕. บำเพ็ญฮัจญ์',
          card3Title: 'ความหมายของคำว่า "อิสลาม"',
          card3Text: 'อิสลาม แปลว่า ความสงบ สันติภาพ และการนอบน้อมยอมจำนนต่อพระผู้เป็นเจ้า'
        },
        {
          num: 4,
          category: 'ศาสนสถานและทิศกิบลัต',
          title: 'มัสยิดและ ๓ สถานที่ศักดิ์สิทธิ์สูงสุด',
          badge: '🕌 ศูนย์รวมแห่งการเคารพสักการะ',
          card1Title: 'บทบาทของมัสยิดในสังคม',
          card1Text: 'เป็นสถานที่ละหมาด ศูนย์กลางการเรียนรู้ ศูนย์ช่วยเหลือชุมชน และสร้างความเป็นหนึ่งเดียวของมุสลิม',
          card2Title: '๓ มัสยิดศักดิ์สิทธิ์สูงสุด',
          card2Text: '๑. มัสยิดอัลฮะรอม (มักกะฮ์) • ๒. มัสยิดอันนะบะวี (มะดีนะฮ์) • ๓. มัสยิดอัลอักศอ (เยรูซาเลม)',
          card3Title: 'ทิศกิบลัต (Qibla)',
          card3Text: 'มุสลิมทั่วโลกหันหน้าสู่กะอ์บะฮ์ ณ นครมักกะฮ์ ในการละหมาด เพื่อแสดงถึงความเป็นภราดรภาพอันเดียวกัน'
        },
        {
          num: 5,
          category: 'วันสำคัญและพิธีกรรมทางศาสนา',
          title: 'เดือนรอมฎอนและเทศกาลวันอีดทั้งสอง',
          badge: '🌙 วันสำคัญแห่งการเฉลิมฉลอง',
          card1Title: 'การถือศีลอดในเดือนรอมฎอน',
          card1Text: 'งดเว้นอาหาร เครื่องดื่ม และสิ่งไร้สาระตั้งแต่รุ่งอรุณจนอาทิตย์ตกดิน ฝึกความอดทน เมตตา และเข้าใจคนยากจน',
          card2Title: 'วันอีดิลฟิฏริ (วันฉลองละศีลอด)',
          card2Text: 'เฉลิมฉลองเมื่อสิ้นสุดเดือนรอมฎอน มีการละหมาดร่วมกัน เยี่ยมญาติมิตร ให้อภัย และมอบซะกาตฟิฏร์แก่คนยากไร้',
          card3Title: 'วันอีดิลอัฎฮา (เทศกาลกุรบาน)',
          card3Text: 'รำลึกความเสียสละของนบีอิบรอฮีม มีการเชือดสัตว์กุรบานเพื่อแจกจ่ายเนื้อแก่ผู้ยากไร้และชุมชน'
        },
        {
          num: 6,
          category: 'การประยุกต์ใช้ในชีวิตประจำวัน',
          title: 'มารยาทอิสลาม (อัคลาก) และความซื่อสัตย์',
          badge: '💎 มโนธรรมแห่งสันติภาพ',
          card1Title: 'ความสะอาดคือส่วนหนึ่งของศรัทธา',
          card1Text: 'การรักษาความสะอาดทั้งร่างกาย เสื้อผ้า ที่อยู่อาศัย และจิตใจ การอาบน้ำละหมาดก่อนเข้าเฝ้าพระเจ้า',
          card2Title: 'ความกตัญญูและการทำความดี',
          card2Text: 'สวรรค์อยู่ใต้ฝ่าเท้าของมารดา การเคารพผู้ใหญ่ เมตตาต่อเด็ก และพูดจาแต่สิ่งที่ดีงามสร้างสรรค์',
          card3Title: 'การอยู่ร่วมกันในสังคมพหุวัฒนธรรม',
          card3Text: '"ไม่มีการบังคับให้นับถือศาสนา" มุสลิมต้องปฏิบัติตนเป็นเพื่อนบ้านที่ดี มีน้ำใจ และเป็นมิตรต่อทุกคนในสังคม'
        }
      ],
      '5': [
        {
          num: 1,
          category: 'ประวัติความเป็นมาและบรรพชน',
          title: 'อับราฮัม โมเสส และประวัติศาสตร์ชนชาติยิว',
          badge: '✡️ ชนชาติแห่งพันธสัญญา',
          card1Title: 'อับราฮัม: บิดาแห่งศรัทธา',
          card1Text: 'อับราฮัมได้รับพันธสัญญาจากพระเจ้า เป็นบิดาแห่งผู้นับถือพระเจ้าองค์เดียว (ศาสนาเอกเทวนิยม)',
          card2Title: 'โมเสสและการอพยพ (Exodus)',
          card2Text: 'โมเสสนำชนชาติอิสราเอลอพยพพ้นจากการเป็นทาสในอียิปต์ ข้ามทะเลแดง และรับพระบัญญัติ ๑๐ ประการ ณ ภูเขาซีนาย',
          card3Title: 'กษัตริย์ดาวิดและกษัตริย์โซโลมอน',
          card3Text: 'รวมชนชาติให้เป็นปึกแผ่น สถาปนากรุงเยรูซาเลม และสร้างพระวิหารหลังแรกอันสง่างาม'
        },
        {
          num: 2,
          category: 'พระคัมภีร์และคัมภีร์ศักดิ์สิทธิ์',
          title: 'พระคัมภีร์โทราห์ (The Torah) และทานัค',
          badge: '📜 พระบัญญัติศักดิ์สิทธิ์ ๕ เล่ม',
          card1Title: 'พระคัมภีร์โทราห์ (เบญจบรรณ)',
          card1Text: '๕ เล่มแรกของพระคัมภีร์ฮีบรู: ปฐมกาล อพยพ เลวีนิติ กันดารวิถี เฉลยธรรมบัญญัติ บรรจุบทบัญญัติ ๖๑๓ ข้อ',
          card2Title: 'คัมภีร์ทัลมุด (Talmud)',
          card2Text: 'การอธิบาย ขยายความ และประยุกต์ใช้พระคัมภีร์โดยรับบีและนักปราชญ์ สะท้อนภูมิปัญญาการดำเนินชีวิต',
          card3Title: 'ประเพณีบาร์มิตซวาห์ (Bar Mitzvah)',
          card3Text: 'พิธีฉลองเมื่อเยาวชนยิวอายุครบ ๑๓ ปี แสดงความพร้อมในการรับผิดชอบต่อตนเองและพระบัญญัติ'
        },
        {
          num: 3,
          category: 'หลักธรรมและหลักปรัชญาสำคัญ',
          title: 'พระบัญญัติ ๑๐ ประการ และเอกภาพแห่งพระเจ้า',
          badge: '⚖️ รากฐานแห่งจริยธรรมสากล',
          card1Title: 'พระเจ้าองค์เดียวผู้ทรงสัจธรรม',
          card1Text: '"เชมา อิสราเอล" จงฟังเถิด พระยาห์เวห์พระเจ้าของเราทรงเป็นพระเจ้าองค์เดียว เคารพพระองค์สุดจิตใจ',
          card2Title: 'พระบัญญัติ ๑๐ ประการ (The Decalogue)',
          card2Text: 'ห้ามนมัสการพระอื่น • ห้ามสร้างรูปเคารพ • ห้ามออกพระนามเปล่าประโยชน์ • รักษาวันสะบาโต • ให้เกียรติบิดามารดา • ห้ามฆ่าคน • ห้ามลักทรัพย์',
          card3Title: 'คุณค่าต่อสังคมมนุษยชาติ',
          card3Text: 'เป็นต้นแบบของกฎหมาย ศีลธรรม สิทธิมนุษยชน และความเสมอภาคของอารยธรรมโลกจนถึงปัจจุบัน'
        },
        {
          num: 4,
          category: 'ศาสนสถานและดินแดนศักดิ์สิทธิ์',
          title: 'ธรรมศาลา (Synagogue) และกำแพงตะวันตก',
          badge: '🏛️ ศูนย์รวมแห่งการอธิษฐาน',
          card1Title: 'ธรรมศาลา (Synagogue)',
          card1Text: 'สถานที่ศึกษาพระคัมภีร์ นมัสการ และพบปะของชุมชนยิว มีหีบประดิษฐานม้วนโทราห์ (Aron HaKodesh)',
          card2Title: 'กำแพงตะวันตก (The Western Wall)',
          card2Text: 'ซากกำแพงลานพระวิหารโซโลมอน ณ นครเยรูซาเลม สถานที่ที่ชาวยิวทั่วโลกเดินทางมาอธิษฐาน',
          card3Title: 'คันประทีปเมโนราห์ (Menorah)',
          card3Text: 'เชิงเทียน ๗ กิ่ง สัญลักษณ์แห่งแสงสว่าง สติปัญญา และการทรงสถิตอยู่ของพระเจ้า'
        },
        {
          num: 5,
          category: 'วันสำคัญและเทศกาลทางศาสนา',
          title: 'วันสะบาโต เทศกาลปัสกา และฮานุกกะห์',
          badge: '🕯️ เทศกาลแห่งความชื่นชมยินดี',
          card1Title: 'วันสะบาโต (Shabbat - วันพักผ่อน)',
          card1Text: 'ตั้งแต่เย็นวันศุกร์ถึงค่ำวันเสาร์ หยุดพักจากการทำงาน ร่วมรับประทานอาหารในครอบครัว และสรรเสริญพระเจ้า',
          card2Title: 'เทศกาลปัสกา (Passover / Pesach)',
          card2Text: 'รำลึกการหลุดพ้นจากการเป็นทาสในอียิปต์ รับประทานขนมปังไร้เชื้อ (Matzah) เพื่อระลึกถึงความทุกข์ยาก',
          card3Title: 'เทศกาลฮานุกกะห์ (เทศกาลแห่งแสงสว่าง)',
          card3Text: 'ฉลองการบูรณะพระวิหาร จุดเทียนบนเชิงเทียน ๙ กิ่ง เป็นเวลา ๘ คืนแห่งการอัศจรรย์'
        },
        {
          num: 6,
          category: 'การประยุกต์ใช้ในชีวิตประจำวัน',
          title: 'ติกกุน โอรัม (Tikkun Olam) และความยุติธรรม',
          badge: '🌍 การเยียวยาและพัฒนาสังคม',
          card1Title: 'ปรัชญาติกกุน โอรัม (ซ่อมแซมโลก)',
          card1Text: 'มนุษย์มีหน้าที่ร่วมมือกับพระเจ้าในการทำให้โลกนี้น่าอยู่ขึ้น สร้างความยุติธรรม และพิทักษ์สิ่งแวดล้อม',
          card2Title: 'การให้ทาน (Tzedakah)',
          card2Text: 'การให้ทานในศาสนายูดาห์ไม่ใช่เพียงความเมตตา แต่เป็น "ความยุติธรรม" และหน้าที่ที่ทุกคนพึงปฏิบัติ',
          card3Title: 'การเรียนรู้ตลอดชีวิต',
          card3Text: 'ชาวยิวให้ความสำคัญกับการอ่าน การตั้งคำถาม และการศึกษาหาความรู้ เพื่อพัฒนาตนเองและรับใช้สังคม'
        }
      ]
    };

    const boards = knowledgeDataByRoom[roomId] || knowledgeDataByRoom['1'];

    boardLocations.forEach((loc, idx) => {
      const data = boards[idx] || boards[0];
      const boardGroup = new THREE.Group();
      boardGroup.position.set(loc.x, loc.y, loc.z);
      boardGroup.rotation.y = loc.rotY;

      const bW = 5.2;
      const bH = 3.2;

      // 1. High Resolution Canvas Texture
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 750;
      this.renderKnowledgeBoardCanvas(canvas, data, roomId, info, idx);

      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      this.knowledgeTextures.push(texture);

      const planeGeo = new THREE.PlaneGeometry(bW, bH);
      const planeMat = new THREE.MeshBasicMaterial({ map: texture });
      const plane = new THREE.Mesh(planeGeo, planeMat);
      plane.position.z = 0.05;
      boardGroup.add(plane);

      // 2. Anodized Modern Classroom Aluminum Frame
      const frameGeo = new THREE.BoxGeometry(bW + 0.25, bH + 0.25, 0.08);
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.2 });
      const frame = new THREE.Mesh(frameGeo, frameMat);
      boardGroup.add(frame);

      // 3. Overhead Dual Mini Spotlights
      const lampGeo = new THREE.CylinderGeometry(0.08, 0.12, 0.35, 12);
      const lampMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.85 });
      const lamp1 = new THREE.Mesh(lampGeo, lampMat);
      lamp1.rotation.x = Math.PI / 2;
      lamp1.position.set(-1.4, bH / 2 + 0.25, 0.35);
      boardGroup.add(lamp1);

      const lamp2 = new THREE.Mesh(lampGeo, lampMat);
      lamp2.rotation.x = Math.PI / 2;
      lamp2.position.set(1.4, bH / 2 + 0.25, 0.35);
      boardGroup.add(lamp2);

      this.religionDecorGroup.add(boardGroup);
    });
  }

  renderKnowledgeBoardCanvas(canvas, data, roomId, info, slotIdx) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const roomColor = info.color || '#f59e0b';

    ctx.clearRect(0, 0, w, h);

    // Modern academic exhibition board background
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, '#090d16');
    bgGrad.addColorStop(0.5, '#0f172a');
    bgGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Top Header Ribbon with School & Subject
    ctx.fillStyle = roomColor;
    ctx.fillRect(0, 0, w, 40);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 22px Prompt, Sarabun, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`🏫 โรงเรียนพัฒนานิคม • กลุ่มสาระการเรียนรู้สังคมศึกษา ศาสนา และวัฒนธรรม`, 28, 28);

    ctx.textAlign = 'right';
    ctx.fillText(`${info.icon} ห้องเรียนเสมือนจริง 3D • ${info.name}`, w - 28, 28);

    // Header Area
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 24px Prompt, Sarabun, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`📚 ใบความรู้ที่ ${data.num || slotIdx + 1}: ${data.category}`, 45, 95);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 38px Prompt, Sarabun, sans-serif';
    ctx.fillText(data.title, 45, 145);

    // Right Badge
    if (data.badge) {
      ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(w - 380, 75, 335, 75, 12);
      else ctx.fillRect(w - 380, 75, 335, 75);
      ctx.fill();
      ctx.strokeStyle = roomColor;
      ctx.lineWidth = 1.8;
      ctx.stroke();

      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 22px Prompt, Sarabun, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(data.badge, w - 212, 120);
    }

    // 3 Structured Learning Cards
    const cardY = 180;
    const cardH = 520;
    const cardW = (w - 120) / 3;

    const cards = [
      { title: data.card1Title, text: data.card1Text, color: '#38bdf8', icon: '📌' },
      { title: data.card2Title, text: data.card2Text, color: '#34d399', icon: '📖' },
      { title: data.card3Title, text: data.card3Text, color: '#f59e0b', icon: '💡' }
    ];

    cards.forEach((c, i) => {
      const cx = 45 + i * (cardW + 15);

      // Card Background
      ctx.fillStyle = 'rgba(30, 41, 59, 0.75)';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(cx, cardY, cardW, cardH, 16);
      else ctx.fillRect(cx, cardY, cardW, cardH);
      ctx.fill();

      // Card Border with Accent Color
      ctx.strokeStyle = c.color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Card Header
      ctx.fillStyle = c.color;
      ctx.font = 'bold 24px Prompt, Sarabun, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${c.icon} ${c.title}`, cx + 22, cardY + 50);

      // Divider Line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx + 22, cardY + 70);
      ctx.lineTo(cx + cardW - 22, cardY + 70);
      ctx.stroke();

      // Card Content Text
      ctx.fillStyle = '#f1f5f9';
      ctx.font = '22px Prompt, Sarabun, sans-serif';
      this.wrapText(ctx, c.text, cx + 22, cardY + 115, cardW - 44, 38);
    });

    // Board Footer Banner
    ctx.strokeStyle = roomColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, w - 20, h - 20);
  }

  // Helper: Brass Statue Placard
  createStatuePlacard(title, sub, x, y, z, rotY) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 140;
    const ctx = canvas.getContext('2d');

    // Polished Brass Metal Look
    const grad = ctx.createLinearGradient(0, 0, 512, 140);
    grad.addColorStop(0, '#b45309');
    grad.addColorStop(0.5, '#fef08a');
    grad.addColorStop(1, '#b45309');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 140);

    // Inner Dark Plaque
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(8, 8, 496, 124);

    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(14, 14, 484, 112);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Prompt, Sarabun, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, 256, 58);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '20px Prompt, Sarabun, sans-serif';
    ctx.fillText(sub || 'โรงเรียนพัฒนานิคม', 256, 98);

    const texture = new THREE.CanvasTexture(canvas);
    const geo = new THREE.PlaneGeometry(1.6, 0.44);
    const mat = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.rotation.y = rotY || 0;
    return mesh;
  }

  // =========================================================================
  // CLASSROOM FRONT BLACKBOARD (กระดานดำหน้าห้องเรียนปรับตามหลักธรรมศาสนา)
  // =========================================================================
  drawBlackboardForRoom(roomInfo) {
    if (!this.chalkCanvas || !this.chalkCtx || !this.chalkTex) return;
    const ctx = this.chalkCtx;
    const w = this.chalkCanvas.width;
    const h = this.chalkCanvas.height;
    const info = roomInfo || this.currentRoomInfo || { id: '1', name: 'ศาสนาพุทธ', icon: '☸️' };
    const roomId = String(info.id || '1');

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#143525'; // Classic green chalkboard
    ctx.fillRect(0, 0, w, h);

    // Subtle chalk dust texture
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    for (let i = 0; i < 40; i++) {
      ctx.fillRect(Math.random() * w, Math.random() * h, Math.random() * 80 + 20, 2);
    }

    const scriptureQuotes = {
      '1': {
        icon: '☸️',
        title: 'โอวาทปาติโมกข์: หัวใจแห่งพระพุทธศาสนา',
        quote: '"การไม่ทำบาปทั้งปวง • การบำเพ็ญกุศลให้ถึงพร้อม • การทำจิตของตนให้ผ่องใสบริสุทธิ์"',
        sub: 'โรงเรียนพัฒนานิคม • กลุ่มสาระการเรียนรู้สังคมศึกษา ศาสนา และวัฒนธรรม'
      },
      '2': {
        icon: '✝️',
        title: 'พระคริสตธรรมคำสอน: พระบัญญัติเอกแห่งความรัก',
        quote: '"จงรักพระเจ้าสุดจิตสุดใจ และจงรักเพื่อนบ้านเหมือนรักตนเอง" (มัทธิว 22:37-39)',
        sub: 'โรงเรียนพัฒนานิคม • สันติสุข เมตตาจิต และการให้อภัยแก่มวลมนุษยชาติ'
      },
      '3': {
        icon: '🕉️',
        title: 'ปรัชญาพราหมณ์-ฮินดู: อาศรม 4 และปุรุษารถ 4',
        quote: '"ธรรมะ (คุณธรรม) • อรรถะ (ความมั่นคง) • กามะ (ความสุข) • โมกษะ (ความหลุดพ้นสูงสุด)"',
        sub: 'โรงเรียนพัฒนานิคม • ภควัทคีตา การปฏิบัติหน้าที่แห่งตนโดยไม่หวังผลตอบแทน'
      },
      '4': {
        icon: '☪️',
        title: 'หลักธรรมศาสนาอิสลาม: ศานติ ศรัทธา และความเมตตา',
        quote: '"หลักศรัทธา 6 ประการ และหลักปฏิบัติ 5 ประการ • อัลอิสลามคือความสงบและสันติภาพ"',
        sub: 'โรงเรียนพัฒนานิคม • ความเสมอภาค การละหมาด และการช่วยเหลือเกื้อกูลผู้ยากไร้'
      },
      '5': {
        icon: '✡️',
        title: 'พระบัญญัติ 10 ประการ (The Decalogue): ศิลาแห่งสัจธรรม',
        quote: '"จงยึดมั่นในพระเจ้าองค์เดียว • ปฏิบัติตนด้วยความชอบธรรม ซื่อสัตย์ และบริสุทธิ์ใจ"',
        sub: 'โรงเรียนพัฒนานิคม • ภูมิปัญญาแห่งพระคัมภีร์โทราห์และการธำรงความยุติธรรม'
      }
    };

    const doc = scriptureQuotes[roomId] || scriptureQuotes['1'];

    // Sacred Triad Banner: ชาติ ศาสนา พระมหากษัตริย์
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 28px Prompt, Sarabun, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`🇹🇭 ชาติ   •   ${doc.icon} ${info.name}   •   👑 พระมหากษัตริย์`, 512, 48);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Prompt, Sarabun, sans-serif';
    ctx.fillText(`🏫 ${doc.title}`, 512, 102);

    ctx.fillStyle = '#93c5fd';
    ctx.font = 'bold 26px Prompt, Sarabun, sans-serif';
    ctx.fillText(doc.quote, 512, 160);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '22px Prompt, Sarabun, sans-serif';
    ctx.fillText(doc.sub, 512, 215);

    this.chalkTex.needsUpdate = true;
  }

  hexToRgba(hex, alpha) {
    if (!hex) return `rgba(255,255,255,${alpha})`;
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const num = parseInt(c, 16);
    return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
  }
}

window.MetaverseWorld = MetaverseWorld;
