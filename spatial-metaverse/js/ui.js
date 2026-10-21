/**
 * SPATIAL METAVERSE - UI CONTROLLER & SYNTHESIZER
 * Manages HUD, 5 Religious Rooms, 3 Dedicated Portals (Creator Studio, Teacher Dashboard, Visitor Guide),
 * Minimap, Web Audio, Chat, Reactions, and Mobile/On-screen D-Pad.
 */

class SpatialUI {
  constructor(app) {
    this.app = app;
    this.audioCtx = null;
    this.webcamStream = null;
    this.currentUploadedPresFile = null;
    this.currentViewingDoc = null;
    this.currentInspectedArt = null;
    this.teacherAuthenticated = false;

    // Load or initialize current user profile
    const savedUser = localStorage.getItem('spatial_current_user');
    if (savedUser) {
      try {
        this.currentUser = JSON.parse(savedUser);
      } catch (e) {
        this.currentUser = { name: 'นักเรียน', studentId: '34521', studentClass: 'ม.3/1 โรงเรียนพัฒนานิคม', role: 'นักเรียน (ผู้สร้างนิทรรศการ)' };
      }
    } else {
      this.currentUser = { name: 'นักเรียน', studentId: '34521', studentClass: 'ม.3/1 โรงเรียนพัฒนานิคม', role: 'นักเรียน (ผู้สร้างนิทรรศการ)' };
    }

    this.initAudio();
    this.initHUD();
    this.initModals();
    this.initChat();
    this.initReactions();
    this.initMinimap();
    this.initOnScreenControls();
    this.updateRoomHUD();
  }

  // =========================================================================
  // SYNTHESIZED WEB AUDIO API
  // =========================================================================
  initAudio() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      this.audioCtx = new AudioContext();
      const unlockAudio = () => {
        this.resumeAudio();
        window.removeEventListener('touchstart', unlockAudio);
        window.removeEventListener('touchend', unlockAudio);
        window.removeEventListener('click', unlockAudio);
      };
      window.addEventListener('touchstart', unlockAudio, { passive: true });
      window.addEventListener('touchend', unlockAudio, { passive: true });
      window.addEventListener('click', unlockAudio, { passive: true });
    }
  }

  resumeAudio() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playChime(type = 'info') {
    this.resumeAudio();
    if (!this.audioCtx) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    const now = this.audioCtx.currentTime;
    if (type === 'reaction') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'applause') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.12);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  }

  playShutterSound() {
    this.resumeAudio();
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    const now = this.audioCtx.currentTime;
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.08);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  // =========================================================================
  // HUD CONTROLS
  // =========================================================================
  initHUD() {
    // 3 Primary Portal Buttons
    const btnCreator = document.getElementById('btn-open-creator');
    if (btnCreator) {
      btnCreator.addEventListener('click', () => {
        const isCreator = this.currentUser && this.currentUser.role && (this.currentUser.role.includes('สร้าง') || this.currentUser.role.includes('ครู'));
        if (!isCreator) {
          const room = this.app.exhibition.getCurrentRoomInfo();
          const CREATOR_ROOM_PINS = {
            '1': { code: '112233', name: 'ห้อง 1 ศาสนาพุทธ' },
            '2': { code: '445566', name: 'ห้อง 2 ศาสนาคริสต์' },
            '3': { code: '778899', name: 'ห้อง 3 ศาสนาพราหมณ์-ฮินดู' },
            '4': { code: '001122', name: 'ห้อง 4 ศาสนาอิสลาม' },
            '5': { code: '334455', name: 'ห้อง 5 ศาสนายูดาย์' }
          };
          const expected = CREATOR_ROOM_PINS[room.id] || { code: '112233', name: room.name };
          const pin = prompt(`🔑 สิทธิ์เฉพาะผู้สร้างนิทรรศการ\n\nกรุณากรอกรหัสผ่านผู้สร้างประจำ "${room.name}":`);
          if (pin === null) return;
          if (pin.trim() !== expected.code) {
            alert(`⛔ รหัสผ่านผู้สร้างสำหรับ ${room.name} ไม่ถูกต้อง!\n\nกรุณาตรวจสอบรหัสผ่าน 6 หลักที่ได้รับจากคุณครูประจำกลุ่มครับ`);
            return;
          }
          this.currentUser.role = 'นักเรียน (ผู้สร้างนิทรรศการ)';
          this.applyUserProfile(this.currentUser.name, this.currentUser.role);
          this.showToast(`🔓 ปลดล็อกสิทธิ์ผู้สร้างประจำ ${room.name} เรียบร้อยแล้ว!`);
        }
        this.openCreatorModal(1);
      });
    }

    const btnTeacher = document.getElementById('btn-open-teacher');
    if (btnTeacher) btnTeacher.addEventListener('click', () => this.openTeacherModal());

    const btnVisitor = document.getElementById('btn-open-visitor');
    if (btnVisitor) btnVisitor.addEventListener('click', () => this.openVisitorModal());

    // Top HUD Room Switcher Select
    const hudRoomSelect = document.getElementById('hud-room-select');
    if (hudRoomSelect) {
      hudRoomSelect.addEventListener('change', (e) => {
        const roomId = e.target.value;
        hudRoomSelect.blur();
        if (document.activeElement && document.activeElement.blur) {
          document.activeElement.blur();
        }
        this.switchRoom(roomId);
      });
    }

    // Real-Time Voice Chat (Microphone Toggle)
    const micBtn = document.getElementById('btn-mic');
    if (micBtn) {
      micBtn.addEventListener('click', async () => {
        if (this.app.multiplayer) {
          const res = await this.app.multiplayer.toggleVoiceChat();
          if (res.active) {
            micBtn.classList.add('active', 'mic-active');
            micBtn.style.background = '#10b981';
            micBtn.style.borderColor = '#34d399';
            this.showToast(res.message);
          } else {
            micBtn.classList.remove('active', 'mic-active');
            micBtn.style.background = '';
            micBtn.style.borderColor = '';
            this.showToast(res.message || res.error);
          }
        }
      });
    }

    // Sticky Note Button
    const noteBtn = document.getElementById('btn-sticky');
    if (noteBtn) noteBtn.addEventListener('click', () => this.openModal('sticky-modal'));

    // Reaction Button
    const reactBtn = document.getElementById('btn-reaction');
    const reactMenu = document.getElementById('reaction-menu');
    if (reactBtn && reactMenu) {
      reactBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        reactMenu.classList.toggle('show');
      });
      document.addEventListener('click', () => reactMenu.classList.remove('show'));
    }

    // Avatar / Profile
    const avatarBtn = document.getElementById('btn-avatar');
    const profileBadge = document.getElementById('user-profile-badge');
    if (avatarBtn) avatarBtn.addEventListener('click', () => this.openModal('avatar-modal'));
    if (profileBadge) profileBadge.addEventListener('click', () => this.openModal('avatar-modal'));

    // Restore saved face photo in top-bar avatar mini
    try {
      const savedFace = localStorage.getItem('spatial_avatar_face');
      if (savedFace) {
        const miniAvatar = document.getElementById('user-avatar-mini-img');
        const miniPlaceholder = document.getElementById('user-avatar-placeholder');
        if (miniAvatar) {
          miniAvatar.src = savedFace;
          miniAvatar.style.display = 'block';
          if (miniPlaceholder) miniPlaceholder.style.display = 'none';
        }
      }
    } catch (e) {}


    // Camera Mode Toggle
    const camBtn = document.getElementById('btn-camera-view');
    if (camBtn) {
      camBtn.addEventListener('click', () => {
        if (this.app.player) {
          this.app.player.toggleCameraMode();
          camBtn.innerText = this.app.player.cameraMode === 'first_person' ? '👁️ มุมมองบุคคลที่ 1' : '🎥 มุมมองบุคคลที่ 3';
        }
      });
    }
  }

  switchRoom(roomId) {
    if (!this.app.exhibition) return;

    // 1. Drop focus from any select dropdown or UI button
    if (document.activeElement && document.activeElement.blur) {
      document.activeElement.blur();
    }

    // 2. Stop all player movement immediately to prevent stuck auto-walking
    if (this.app.player) {
      this.app.player.resetKeys();
      this.app.player.stopReading();
      this.app.player.position.set(0, 0, 5);
      this.app.player.cameraYaw = Math.PI;
      if (this.app.player.avatarGroup) {
        this.app.player.avatarGroup.rotation.y = Math.PI;
      }
    }

    // 3. Switch exhibition & 3D world dynamic theme
    const roomInfo = this.app.exhibition.switchRoom(roomId);
    if (roomInfo) {
      if (this.app.multiplayer) {
        this.app.multiplayer.switchRoom(roomInfo.id);
      }
      this.updateRoomHUD();
      this.showToast(`สลับมายัง "${roomInfo.icon} ${roomInfo.name}" เรียบร้อยแล้ว`);
      this.playChime('info');
    }
  }

  updateRoomHUD() {
    if (!this.app.exhibition) return;
    const roomInfo = this.app.exhibition.getCurrentRoomInfo();

    const hudSelect = document.getElementById('hud-room-select');
    if (hudSelect) hudSelect.value = roomInfo.id;

    const brandSub = document.getElementById('brand-room-subtitle');
    if (brandSub) {
      brandSub.innerText = `${roomInfo.icon} ${roomInfo.title}`;
      brandSub.style.color = roomInfo.color || '#06b6d4';
    }
  }

  // =========================================================================
  // MODALS MANAGEMENT
  // =========================================================================
  initModals() {
    document.querySelectorAll('.modal-backdrop').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModal(modal.id);
      });
    });

    document.querySelectorAll('.close-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const modal = btn.closest('.modal-backdrop');
        if (modal) this.closeModal(modal.id);
      });
    });

    this.initLoginModal();
    this.initWebcamModal();
    this.initCreatorStudioModal();
    this.initTeacherPinModal();
    this.initTeacherDashboardModal();
    this.initVisitorGuideModal();
    this.initStickyModal();
    this.initScreenShareModal();
    this.initDocViewerModal();
    this.initBoothQuizInspector();
    this.initShareOnlineModal();
  }

  initShareOnlineModal() {
    const btnShare = document.getElementById('btn-share-online');
    if (btnShare) {
      btnShare.addEventListener('click', () => {
        const input = document.getElementById('share-online-url-input');
        const qrImg = document.getElementById('metaverse-qr-img');
        const currentUrl = (window.location.protocol.startsWith('http') && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1'))
          ? window.location.href.split('#')[0].split('?')[0]
          : 'https://textbook-dressed-broader-outlets.trycloudflare.com/';
        if (input) input.value = currentUrl;
        if (qrImg) qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(currentUrl)}`;
        this.openModal('share-online-modal');
      });
    }

    const copyBtn = document.getElementById('btn-copy-share-url');
    const input = document.getElementById('share-online-url-input');
    if (copyBtn && input) {
      copyBtn.addEventListener('click', async () => {
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(input.value);
          } else {
            input.select();
            document.execCommand('copy');
          }
          this.showToast('📋 คัดลอกลิงก์ออนไลน์เรียบร้อยแล้ว!');
          this.playChime('reaction');
        } catch (err) {
          input.select();
          document.execCommand('copy');
          this.showToast('📋 คัดลอกลิงก์ออนไลน์เรียบร้อยแล้ว!');
        }
      });
    }
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('show');
      this.playChime('info');
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('show');
      if (document.activeElement) document.activeElement.blur();
      if (modalId === 'avatar-modal' && this.webcamStream) {
        this.webcamStream.getTracks().forEach(t => t.stop());
        this.webcamStream = null;
      }
      if (modalId === 'doc-viewer-modal') {
        if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
        }
        this.isTvAudioPlaying = false;
        this.updateTvAudioButtonsState(false);
      }
      if (modalId === 'artwork-inspector-modal') {
        if (this.app && this.app.player) {
          this.app.player.stopReading();
        }
        if (this.app && this.app.world && this.app.world.drawWelcomeScreen) {
          this.app.world.drawWelcomeScreen();
        }
      }
    }
  }

  // =========================================================================
  // LOGIN MODAL (1. ชื่อ, 2. เลือกบทบาท [มีรหัสสำหรับผู้สร้าง], 3. เลือกหัวข้อ 5 ห้อง)
  // =========================================================================
  initLoginModal() {
    const studentForm = document.getElementById('student-login-form');
    const roleSelect = document.getElementById('login-student-role');
    const pinGroup = document.getElementById('creator-pin-group');
    const pinInput = document.getElementById('login-creator-pin');
    const roomSelect = document.getElementById('login-exhibition-room');
    const pinHint = document.getElementById('creator-pin-room-hint');

    // Designated 6-digit Creator PINs per religion room:
    // ห้อง 1 ศาสนาพุทธ = 112233
    // ห้อง 2 ศาสนาคริสต์ = 445566
    // ห้อง 3 ศาสนาพราหมณ์-ฮินดู = 778899
    // ห้อง 4 ศาสนาอิสลาม = 001122
    // ห้อง 5 ศาสนายูดาย์ = 334455
    const CREATOR_ROOM_PINS = {
      '1': { code: '112233', name: 'ห้อง 1: ศาสนาพุทธ' },
      '2': { code: '445566', name: 'ห้อง 2: ศาสนาคริสต์' },
      '3': { code: '778899', name: 'ห้อง 3: ศาสนาพราหมณ์-ฮินดู' },
      '4': { code: '001122', name: 'ห้อง 4: ศาสนาอิสลาม' },
      '5': { code: '334455', name: 'ห้อง 5: ศาสนายูดาย์' }
    };

    const nameInputElement = document.getElementById('login-student-name');
    const errorMsgElement = document.getElementById('login-error-msg');

    // Prepopulate name if user previously entered it
    if (nameInputElement && this.currentUser && this.currentUser.name && this.currentUser.name !== 'นักเรียน') {
      nameInputElement.value = this.currentUser.name;
    }

    const clearError = () => {
      if (errorMsgElement) {
        errorMsgElement.style.display = 'none';
        errorMsgElement.innerHTML = '';
      }
    };

    const showError = (msg) => {
      if (errorMsgElement) {
        errorMsgElement.innerHTML = msg;
        errorMsgElement.style.display = 'block';
      } else {
        alert(msg);
      }
    };

    if (nameInputElement) {
      nameInputElement.addEventListener('input', clearError);
    }
    if (pinInput) {
      pinInput.addEventListener('input', clearError);
    }

    const updatePinVisibility = () => {
      if (!roleSelect || !pinGroup) return;
      clearError();
      const isCreator = roleSelect.value.includes('สร้าง');
      pinGroup.style.display = isCreator ? 'block' : 'none';
      if (isCreator && roomSelect && pinHint) {
        const curRoom = CREATOR_ROOM_PINS[roomSelect.value] || CREATOR_ROOM_PINS['1'];
        pinHint.innerHTML = `* กรุณากรอกรหัสผ่าน 6 หลักของผู้สร้างประจำ <strong>${curRoom.name}</strong> (ได้รับมอบหมายจากครูผู้สอน)`;
      }
    };

    if (roleSelect) {
      roleSelect.addEventListener('change', updatePinVisibility);
    }
    if (roomSelect) {
      roomSelect.addEventListener('change', updatePinVisibility);
    }
    updatePinVisibility();

    const submitLogin = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      clearError();

      const nameVal = (document.getElementById('login-student-name') || {}).value ? document.getElementById('login-student-name').value.trim() : '';
      const roleInput = (document.getElementById('login-student-role') || {}).value || 'ผู้เข้าชมนิทรรศการ';
      const roomInput = (document.getElementById('login-exhibition-room') || {}).value || '1';

      if (!nameVal) {
        showError('⚠️ กรุณากรอกชื่อ-นามสกุลของคุณก่อนเข้าสู่ระบบครับ');
        const nInput = document.getElementById('login-student-name');
        if (nInput) nInput.focus();
        return;
      }

      // Verify Creator PIN if Creator role is selected without disclosing PIN
      if (roleInput.includes('สร้าง')) {
        const expected = CREATOR_ROOM_PINS[roomInput];
        const enteredPin = pinInput ? pinInput.value.trim() : '';

        if (!enteredPin) {
          showError(`🔑 กรุณากรอกรหัสผ่าน 6 หลักสำหรับ "${expected.name}"`);
          if (pinInput) pinInput.focus();
          return;
        }

        if (enteredPin !== expected.code) {
          showError(`⛔ รหัสผ่านสำหรับ "${expected.name}" ไม่ถูกต้อง กรุณาตรวจสอบรหัสผ่านกลุ่มของคุณอีกครั้ง`);
          if (pinInput) {
            pinInput.focus();
            pinInput.select();
          }
          return;
        }
      }


      // Save current user identity
      this.currentUser = {
        name: nameVal,
        role: roleInput
      };
      try {
        localStorage.setItem('spatial_current_user', JSON.stringify(this.currentUser));
      } catch (err) {}

      const displayName = nameVal;

      // 1. Switch to chosen religious room (safe wrapped)
      try {
        this.switchRoom(roomInput);
      } catch (err) {
        console.warn('switchRoom warning:', err);
      }

      // 2. Apply user profile
      try {
        this.applyUserProfile(displayName, roleInput);
      } catch (err) {
        console.warn('applyUserProfile warning:', err);
      }

      // 3. Guarantee closing the login modal
      this.closeModal('login-modal');

      try {
        this.playChime('reaction');
      } catch (err) {}

      const roomInfo = (this.app && this.app.exhibition && this.app.exhibition.getCurrentRoomInfo) ? this.app.exhibition.getCurrentRoomInfo() : { icon: '🏛️', name: 'ห้องเรียน 3D' };
      this.showToast(`🎉 ยินดีต้อนรับ ${displayName} (${roleInput}) สู่ห้องเรียน 3D "${roomInfo.icon} ${roomInfo.name}"!`);
    };

    if (studentForm) {
      studentForm.addEventListener('submit', submitLogin);
    }
    const loginBtn = document.getElementById('btn-login-submit');
    if (loginBtn) {
      loginBtn.addEventListener('click', submitLogin);
    }
    this.submitStudentLogin = submitLogin;
    window.submitStudentLogin = submitLogin;
  }

  applyUserProfile(name, role) {
    if (this.app.player) {
      this.app.player.setProfile(name, role);
    }
    const nameEl = document.getElementById('user-profile-name');
    const roleEl = document.getElementById('user-profile-role');
    if (nameEl) nameEl.innerText = name;
    if (roleEl) roleEl.innerText = role;

    if (this.app.multiplayer) {
      this.app.multiplayer.broadcastSelf();
    }
  }

  // =========================================================================
  // WINDOW 1: EXHIBITION CREATOR STUDIO (หน้าต่างสร้างนิทรรศการ)
  // =========================================================================
  initCreatorStudioModal() {
    const form = document.getElementById('creator-studio-form');
    const boothSelect = document.getElementById('creator-booth-select');
    const resetBoothBtn = document.getElementById('btn-reset-this-booth');
    const teleportBoothBtn = document.getElementById('btn-teleport-to-booth');

    // File Upload handling (PPT / PPTX / PDF)
    const chooseFileBtn = document.getElementById('btn-choose-pres-file');
    const fileInput = document.getElementById('creator-pres-file-input');
    const presPreview = document.getElementById('creator-pres-file-preview');
    const removeFileBtn = document.getElementById('btn-remove-pres-file');
    const presUrlInput = document.getElementById('creator-pres-url');

    if (chooseFileBtn && fileInput) {
      chooseFileBtn.addEventListener('click', () => fileInput.click());

      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const isPPT = file.name.endsWith('.ppt') || file.name.endsWith('.pptx');
        const isPDF = file.name.endsWith('.pdf');
        const isImg = /\.(jpe?g|png|webp)$/i.test(file.name);

        if (!isPPT && !isPDF && !isImg) {
          alert('กรุณาเลือกไฟล์เอกสารหรือสไลด์ที่เป็นนามสกุล .pdf, .ppt, .pptx, .jpg หรือ .png ครับ');
          return;
        }

        const boothNum = parseInt(document.getElementById('creator-booth-select').value) || 1;

        if (isImg) {
          // Optimize image down to 16:9 widescreen HD (max 1440x810) for instant mobile/iPad loading
          const reader = new FileReader();
          reader.onload = (loadEvt) => {
            const rawDataUrl = loadEvt.target.result;
            const img = new Image();
            img.onload = () => {
              const maxW = 1440;
              const maxH = 810;
              let w = img.width;
              let h = img.height;
              if (w > maxW || h > maxH) {
                const ratio = Math.min(maxW / w, maxH / h);
                w = Math.round(w * ratio);
                h = Math.round(h * ratio);
              }
              const canvas = document.createElement('canvas');
              canvas.width = w;
              canvas.height = h;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, w, h);
              const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.88);

              this.currentUploadedPresFile = {
                name: file.name,
                size: this.formatBytes(Math.round(optimizedDataUrl.length * 0.75)),
                type: 'image',
                dataUrl: optimizedDataUrl,
                coverUrl: optimizedDataUrl,
                isUrl: false
              };
              this.currentUploadedCoverUrl = optimizedDataUrl;

              if (!window.boothCoverCanvases) window.boothCoverCanvases = {};
              window.boothCoverCanvases[boothNum] = canvas;

              if (presPreview) {
                presPreview.style.display = 'flex';
                document.getElementById('creator-pres-file-icon').innerText = '🖼️';
                document.getElementById('creator-pres-file-name').innerText = file.name;
                document.getElementById('creator-pres-file-size').innerText = this.formatBytes(Math.round(optimizedDataUrl.length * 0.75));
              }
              this.updateCreatorCoverPreview(optimizedDataUrl, '✓ ภาพปกผลงานพร้อมจัดแสดงบนกำแพง 3D เรียบร้อย');
              this.showToast(`ปรับขนาดรูปภาพ ${file.name} เป็นหน้าปกสไลด์บนกำแพงเรียบร้อยแล้ว`);
            };
            img.src = rawDataUrl;
          };
          reader.readAsDataURL(file);
        } else if (isPDF) {
          // Read both ArrayBuffer (for fast, safe PDF.js rendering) and DataURL (for storage)
          const readBuffer = new Promise((resolve, reject) => {
            if (file.arrayBuffer) {
              file.arrayBuffer().then(resolve).catch(reject);
            } else {
              const r = new FileReader();
              r.onload = () => resolve(r.result);
              r.onerror = reject;
              r.readAsArrayBuffer(file);
            }
          });

          const readDataUrl = new Promise((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result);
            r.onerror = reject;
            r.readAsDataURL(file);
          });

          Promise.all([readBuffer, readDataUrl]).then(async ([buffer, pdfDataUrl]) => {
            this.currentUploadedPresFile = {
              name: file.name,
              size: this.formatBytes(file.size),
              type: 'pdf',
              dataUrl: pdfDataUrl,
              isUrl: false
            };

            if (presPreview) {
              presPreview.style.display = 'flex';
              document.getElementById('creator-pres-file-icon').innerText = '📄';
              document.getElementById('creator-pres-file-name').innerText = file.name;
              document.getElementById('creator-pres-file-size').innerText = this.formatBytes(file.size);
            }

            // Extract PDF Page 1 as high-res cover image for the 3D wall poster
            let extractedCover = false;
            if (window.pdfjsLib) {
              try {
                const uint8 = new Uint8Array(buffer);
                const loadingTask = window.pdfjsLib.getDocument({ data: uint8 });
                const pdf = await loadingTask.promise;
                const page = await pdf.getPage(1);
                const viewport = page.getViewport({ scale: 1 });
                const targetW = 1280;
                const scale = targetW / viewport.width;
                const scaledViewport = page.getViewport({ scale: scale });
                const offCanvas = document.createElement('canvas');
                offCanvas.width = Math.round(scaledViewport.width);
                offCanvas.height = Math.round(scaledViewport.height);
                const ctx = offCanvas.getContext('2d');
                await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;
                const coverJpg = offCanvas.toDataURL('image/jpeg', 0.88);
                this.currentUploadedCoverUrl = coverJpg;
                this.currentUploadedPresFile.coverUrl = coverJpg;

                if (!window.boothCoverCanvases) window.boothCoverCanvases = {};
                window.boothCoverCanvases[boothNum] = offCanvas;

                this.updateCreatorCoverPreview(coverJpg, '✓ สกัดหน้าปกสไลด์หน้าแรก (PDF หน้า 1) สำเร็จ');
                extractedCover = true;
                this.showToast(`สกัดหน้าปกสไลด์หน้าแรกจาก ${file.name} เรียบร้อย พร้อมขึ้นกำแพงนิทรรศการ 3D! 🎨`);
              } catch (e) {
                console.warn('PDF.js client cover extraction error:', e);
              }
            }

            if (!extractedCover) {
              this.showToast(`แนบไฟล์ PDF ${file.name} เรียบร้อยแล้ว`);
            }
          }).catch(err => {
            console.error('File read error:', err);
            alert('เกิดข้อผิดพลาดในการอ่านไฟล์ กรุณาลองใหม่อีกครั้ง');
          });
        } else {
          // PPT / PPTX
          const readBuffer = new Promise((resolve, reject) => {
            if (file.arrayBuffer) {
              file.arrayBuffer().then(resolve).catch(reject);
            } else {
              const r = new FileReader();
              r.onload = () => resolve(r.result);
              r.onerror = reject;
              r.readAsArrayBuffer(file);
            }
          });

          const readDataUrl = new Promise((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result);
            r.onerror = reject;
            r.readAsDataURL(file);
          });

          Promise.all([readBuffer, readDataUrl]).then(async ([buffer, pptDataUrl]) => {
            this.currentUploadedPresFile = {
              name: file.name,
              size: this.formatBytes(file.size),
              type: 'ppt',
              dataUrl: pptDataUrl,
              isUrl: false
            };

            if (presPreview) {
              presPreview.style.display = 'flex';
              document.getElementById('creator-pres-file-icon').innerText = '📊';
              document.getElementById('creator-pres-file-name').innerText = file.name;
              document.getElementById('creator-pres-file-size').innerText = this.formatBytes(file.size);
            }

            // Attempt client-side PPTX thumbnail extraction
            const thumbUrl = await this.extractPptxThumbnail(buffer);
            if (thumbUrl) {
              this.currentUploadedCoverUrl = thumbUrl;
              this.currentUploadedPresFile.coverUrl = thumbUrl;
              this.updateCreatorCoverPreview(thumbUrl, '✓ สกัดหน้าปกสไลด์จาก PowerPoint สำเร็จ');
              this.showToast(`ตรวจพบหน้าปกสไลด์จาก ${file.name} พร้อมจัดแสดงบนกำแพง 3D! 📊`);
            } else {
              this.updateCreatorCoverPreview(null);
              this.showToast(`แนบไฟล์นำเสนอ ${file.name} เรียบร้อยแล้ว`);
            }
          }).catch(err => {
            console.error('PPT read error:', err);
            alert('เกิดข้อผิดพลาดในการอ่านไฟล์ กรุณาลองใหม่อีกครั้ง');
          });
        }
      });
    }

    if (removeFileBtn) {
      removeFileBtn.addEventListener('click', () => {
        this.currentUploadedPresFile = null;
        this.currentUploadedCoverUrl = null;
        const boothNum = parseInt(document.getElementById('creator-booth-select').value) || 1;
        if (window.boothCoverCanvases) delete window.boothCoverCanvases[boothNum];
        if (fileInput) fileInput.value = '';
        if (presPreview) presPreview.style.display = 'none';
        this.updateCreatorCoverPreview(null);
        this.showToast('ลบไฟล์แนบออกแล้ว');
      });
    }

    if (presUrlInput) {
      presUrlInput.addEventListener('input', () => {
        const url = presUrlInput.value.trim();
        if (url && !this.currentUploadedPresFile) {
          this.currentUploadedPresFile = {
            name: 'สไลด์นำเสนอออนไลน์',
            size: 'ลิงก์ภายนอก',
            type: url.includes('.pdf') ? 'pdf' : 'ppt',
            dataUrl: url,
            isUrl: true
          };
        }
      });
    }

    if (boothSelect) {
      boothSelect.addEventListener('change', () => {
        const boothNum = parseInt(boothSelect.value);
        this.loadBoothIntoCreatorForm(boothNum);
      });
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const boothNum = parseInt(document.getElementById('creator-booth-select').value);
        const title = document.getElementById('creator-title').value.trim();
        const creator = document.getElementById('creator-name').value.trim();
        const schoolClass = document.getElementById('creator-class').value.trim();
        const category = document.getElementById('creator-category').value;
        const concept = document.getElementById('creator-concept').value.trim();
        const audioText = document.getElementById('creator-audio').value.trim();
        const themeColor = document.getElementById('creator-color').value;

        let presentationFile = this.currentUploadedPresFile;
        const presUrl = presUrlInput ? presUrlInput.value.trim() : '';
        if (!presentationFile && presUrl) {
          presentationFile = {
            name: 'สไลด์นำเสนอออนไลน์',
            size: 'ลิงก์ภายนอก',
            type: presUrl.includes('.pdf') ? 'pdf' : 'ppt',
            dataUrl: presUrl,
            isUrl: true
          };
        }

        const quizQuestions = this.collectCreatorQuizFields();

        const data = {
          title,
          creator: creator || 'ทีมนักเรียน',
          schoolClass: schoolClass || 'โรงเรียน',
          category,
          concept,
          audioText: audioText || concept,
          themeColor: themeColor || '#06b6d4',
          coverImageUrl: this.currentUploadedCoverUrl || (presentationFile && presentationFile.coverUrl) || null,
          presentationFile: presentationFile || null,
          quizQuestions: quizQuestions
        };

        if (this.app.exhibition) {
          const savedArt = this.app.exhibition.setBoothArtwork(boothNum, data);
          this.playChime('reaction');
          const room = this.app.exhibition.getCurrentRoomInfo();
          this.showToast(`ติดตั้งผลงานใน ${room.name} บูธที่ ${boothNum} สำเร็จแล้ว!`);
          this.closeModal('creator-studio-modal');

          // Auto teleport player in front of their booth & display the artwork inspector immediately
          this.teleportToBooth(boothNum);
          setTimeout(() => {
            if (savedArt) {
              this.showArtworkInspector(savedArt);
            }
          }, 350);
        } else {
          this.closeModal('creator-studio-modal');
        }
      });
    }

    // Default quiz reset button in Creator Studio
    const resetQuizBtn = document.getElementById('btn-reset-default-quiz');
    if (resetQuizBtn) {
      resetQuizBtn.addEventListener('click', () => {
        const boothSelect = document.getElementById('creator-booth-select');
        const boothNum = boothSelect ? parseInt(boothSelect.value) : 1;
        if (this.app.exhibition) {
          const room = this.app.exhibition.getCurrentRoomInfo();
          const defaultQ = this.app.exhibition.getDefaultQuestionsForRoom(room.id, boothNum);
          this.renderCreatorQuizFields({ quizQuestions: defaultQ });
          this.showToast('รีเซ็ตเป็นคำถามมาตรฐานประจำห้องศาสนาแล้ว');
        }
      });
    }

    if (resetBoothBtn) {
      resetBoothBtn.addEventListener('click', () => {
        const boothNum = parseInt(document.getElementById('creator-booth-select').value);
        if (confirm(`คุณต้องการล้างข้อมูลบูธที่ ${boothNum} ให้กลับเป็นพื้นที่ว่างใช่หรือไม่?`)) {
          if (this.app.exhibition) {
            this.app.exhibition.resetBooth(boothNum);
            this.showToast(`รีเซ็ตบูธที่ ${boothNum} เป็นพื้นที่ว่างเรียบร้อยแล้ว`);
            this.loadBoothIntoCreatorForm(boothNum);
          }
        }
      });
    }

    if (teleportBoothBtn) {
      teleportBoothBtn.addEventListener('click', () => {
        const boothNum = parseInt(document.getElementById('creator-booth-select').value);
        this.teleportToBooth(boothNum);
        this.closeModal('creator-studio-modal');
      });
    }
  }

  openCreatorModal(boothNumber = 1) {
    const select = document.getElementById('creator-booth-select');
    if (select) select.value = boothNumber;
    this.loadBoothIntoCreatorForm(boothNumber);

    // Update room badge in Creator header
    if (this.app.exhibition) {
      const room = this.app.exhibition.getCurrentRoomInfo();
      const badge = document.getElementById('creator-modal-room-tag');
      if (badge) {
        badge.innerText = `${room.icon} กำลังจัดแสดงใน ${room.name}`;
        badge.style.color = room.color;
      }
    }

    this.openModal('creator-studio-modal');
  }

  loadBoothIntoCreatorForm(boothNum) {
    if (!this.app.exhibition) return;
    const art = this.app.exhibition.artworks[boothNum - 1];
    if (!art) return;

    document.getElementById('creator-title').value = art.isEmpty ? '' : art.title;
    document.getElementById('creator-name').value = art.isEmpty ? '' : art.creator;
    document.getElementById('creator-class').value = art.isEmpty ? '' : art.schoolClass;
    if (!art.isEmpty && art.category) document.getElementById('creator-category').value = art.category;
    document.getElementById('creator-concept').value = art.isEmpty ? '' : art.concept;
    document.getElementById('creator-audio').value = art.isEmpty ? '' : art.audioText;
    if (art.themeColor) document.getElementById('creator-color').value = art.themeColor;

    // Load Quiz Questions
    this.renderCreatorQuizFields(art);

    // Presentation File State
    const presPreview = document.getElementById('creator-pres-file-preview');
    const presUrlInput = document.getElementById('creator-pres-url');
    const fileInput = document.getElementById('creator-pres-file-input');
    if (fileInput) fileInput.value = '';

    if (art.presentationFile) {
      this.currentUploadedPresFile = art.presentationFile;
      this.currentUploadedCoverUrl = art.coverImageUrl || (art.presentationFile && art.presentationFile.coverUrl) || null;
      if (presPreview) {
        presPreview.style.display = 'flex';
        const isPPT = art.presentationFile.type === 'ppt' || (art.presentationFile.name && (art.presentationFile.name.endsWith('.ppt') || art.presentationFile.name.endsWith('.pptx')));
        const isImg = art.presentationFile.type === 'image' || (art.presentationFile.name && /\.(jpe?g|png|webp)$/i.test(art.presentationFile.name));
        document.getElementById('creator-pres-file-icon').innerText = isPPT ? '📊' : (isImg ? '🖼️' : '📄');
        document.getElementById('creator-pres-file-name').innerText = art.presentationFile.name || 'ไฟล์นำเสนอ';
        document.getElementById('creator-pres-file-size').innerText = art.presentationFile.size || '';
      }
      if (presUrlInput && art.presentationFile.isUrl) {
        presUrlInput.value = art.presentationFile.dataUrl;
      } else if (presUrlInput) {
        presUrlInput.value = '';
      }
      if (this.currentUploadedCoverUrl) {
        this.updateCreatorCoverPreview(this.currentUploadedCoverUrl, '✓ หน้าปกสไลด์ที่กำลังจัดแสดงบนกำแพง 3D');
      } else {
        this.updateCreatorCoverPreview(null);
      }
    } else {
      this.currentUploadedPresFile = null;
      this.currentUploadedCoverUrl = null;
      if (presPreview) presPreview.style.display = 'none';
      if (presUrlInput) presUrlInput.value = '';
      this.updateCreatorCoverPreview(null);
    }

    const statusBadge = document.getElementById('creator-booth-status');
    if (statusBadge) {
      statusBadge.innerText = art.isEmpty ? 'สถานะ: พื้นที่ว่าง (รอนักเรียนสร้างสรรค์)' : `สถานะ: มีผลงานแล้ว ("${art.title}")`;
      statusBadge.style.color = art.isEmpty ? '#38bdf8' : '#10b981';
    }
  }

  updateCreatorCoverPreview(url, message = '') {
    // Feature disabled per user request: No slide cover box in creator studio
  }


  async extractPptxThumbnail(arrayBuffer) {
    try {
      const dataView = new DataView(arrayBuffer);
      const uint8 = new Uint8Array(arrayBuffer);
      let offset = 0;
      const maxLen = uint8.length - 30;
      while (offset < maxLen) {
        if (uint8[offset] === 0x50 && uint8[offset + 1] === 0x4B && uint8[offset + 2] === 0x03 && uint8[offset + 3] === 0x04) {
          const compMethod = dataView.getUint16(offset + 8, true);
          const compSize = dataView.getUint32(offset + 18, true);
          const nameLen = dataView.getUint16(offset + 26, true);
          const extraLen = dataView.getUint16(offset + 28, true);
          if (offset + 30 + nameLen > uint8.length) break;
          let fileName = '';
          for (let i = 0; i < nameLen; i++) {
            fileName += String.fromCharCode(uint8[offset + 30 + i]);
          }
          const fileDataOffset = offset + 30 + nameLen + extraLen;
          const lower = fileName.toLowerCase();
          if (lower.includes('thumbnail') && (lower.endsWith('.jpeg') || lower.endsWith('.jpg') || lower.endsWith('.png'))) {
            const fileBytes = uint8.subarray(fileDataOffset, fileDataOffset + compSize);
            const mime = lower.endsWith('.png') ? 'image/png' : 'image/jpeg';
            if (compMethod === 0) {
              const blob = new Blob([fileBytes], { type: mime });
              return new Promise(resolve => {
                const r = new FileReader();
                r.onload = () => resolve(r.result);
                r.readAsDataURL(blob);
              });
            } else if (compMethod === 8 && typeof DecompressionStream !== 'undefined') {
              const ds = new DecompressionStream('deflate-raw');
              const writer = ds.writable.getWriter();
              writer.write(fileBytes);
              writer.close();
              const decompressed = await new Response(ds.readable).arrayBuffer();
              const blob = new Blob([decompressed], { type: mime });
              return new Promise(resolve => {
                const r = new FileReader();
                r.onload = () => resolve(r.result);
                r.readAsDataURL(blob);
              });
            }
          }
          offset = fileDataOffset + compSize;
        } else {
          offset++;
        }
      }
    } catch (e) {
      console.warn('PPTX thumbnail extraction exception:', e);
    }
    return null;
  }

  renderCreatorQuizFields(art) {
    const container = document.getElementById('creator-quiz-fields');
    if (!container) return;

    const questions = (art && art.quizQuestions && Array.isArray(art.quizQuestions) && art.quizQuestions.length === 5)
      ? art.quizQuestions
      : (this.app.exhibition ? this.app.exhibition.getDefaultQuestionsForRoom(this.app.exhibition.currentRoomId, (art && art.boothNumber) || 1) : []);

    container.innerHTML = '';
    const choiceNames = ['ก', 'ข', 'ค', 'ง'];

    questions.forEach((q, qIdx) => {
      const qBox = document.createElement('div');
      qBox.className = 'quiz-question-box';
      qBox.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 700; color: #fbbf24; font-size: 12px;">ข้อที่ ${qIdx + 1}:</span>
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 11px; color: var(--text-muted);">เฉลยข้อที่ถูก:</span>
            <select class="form-select creator-q-ans" style="padding: 2px 6px; font-size: 11px; width: 75px; background: #0f172a; border-color: #f59e0b;">
              <option value="0" ${parseInt(q.answer) === 0 ? 'selected' : ''}>ข้อ ก</option>
              <option value="1" ${parseInt(q.answer) === 1 ? 'selected' : ''}>ข้อ ข</option>
              <option value="2" ${parseInt(q.answer) === 2 ? 'selected' : ''}>ข้อ ค</option>
              <option value="3" ${parseInt(q.answer) === 3 ? 'selected' : ''}>ข้อ ง</option>
            </select>
          </div>
        </div>
        <input type="text" class="form-input creator-q-text" value="${this.escapeHTML(q.question || '')}" placeholder="พิมพ์คำถามข้อที่ ${qIdx + 1}..." style="padding: 6px 10px; font-size: 12px;" required>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
          ${[0, 1, 2, 3].map(optIdx => `
            <div style="display: flex; align-items: center; gap: 4px;">
              <span style="font-size: 11px; font-weight: 700; color: #38bdf8; min-width: 14px;">${choiceNames[optIdx]}.</span>
              <input type="text" class="form-input creator-q-opt" data-opt="${optIdx}" value="${this.escapeHTML((q.options && q.options[optIdx]) || '')}" placeholder="ตัวเลือก ${choiceNames[optIdx]}..." style="padding: 4px 8px; font-size: 11px; flex: 1;" required>
            </div>
          `).join('')}
        </div>
      `;
      container.appendChild(qBox);
    });
  }

  collectCreatorQuizFields() {
    const container = document.getElementById('creator-quiz-fields');
    if (!container) return [];
    const boxes = container.querySelectorAll('.quiz-question-box');
    const questions = [];
    boxes.forEach((box, idx) => {
      const qText = (box.querySelector('.creator-q-text') || {}).value || `คำถามข้อที่ ${idx + 1}`;
      const ansSelect = box.querySelector('.creator-q-ans');
      const ans = ansSelect ? parseInt(ansSelect.value) : 0;
      const optInputs = box.querySelectorAll('.creator-q-opt');
      const options = [];
      optInputs.forEach(inp => options.push(inp.value.trim() || 'ตัวเลือก'));
      questions.push({
        question: qText.trim(),
        options: options.length === 4 ? options : ['ข้อ ก', 'ข้อ ข', 'ข้อ ค', 'ข้อ ง'],
        answer: ans
      });
    });
    return questions;
  }

  // =========================================================================
  // TEACHER SECURITY AUTHENTICATION PIN MODAL
  // =========================================================================
  initTeacherPinModal() {
    const form = document.getElementById('teacher-pin-form');
    const pinInput = document.getElementById('teacher-pin-input');
    const errorEl = document.getElementById('teacher-pin-error');

    if (form && pinInput) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const val = pinInput.value.trim();
        const isMasterPIN = (val === '1234' || val === 'ครูพัฒนานิคม' || val.toLowerCase() === 'teacher');
        const isCurrentTeacher = (this.currentUser && this.currentUser.role && this.currentUser.role.includes('ครู') && (val === this.currentUser.studentId || isMasterPIN));

        if (isMasterPIN || isCurrentTeacher) {
          this.teacherAuthenticated = true;
          if (errorEl) errorEl.style.display = 'none';
          pinInput.value = '';
          this.closeModal('teacher-pin-modal');
          this.openTeacherModal();
          this.playChime('reaction');
          this.showToast('ยินดีต้อนรับคุณครูผู้สอน เข้าสู่ศูนย์ควบคุมนิทรรศการ 🎓');
        } else {
          if (errorEl) errorEl.style.display = 'block';
          this.playChime('info');
        }
      });
    }
  }

  // =========================================================================
  // WINDOW 2: TEACHER DASHBOARD (ศูนย์ควบคุมและสถิตินิทรรศการสำหรับคุณครู)
  // =========================================================================
  initTeacherDashboardModal() {
    // Lock Button
    const lockBtn = document.getElementById('btn-teacher-lock');
    if (lockBtn) {
      lockBtn.addEventListener('click', () => {
        this.teacherAuthenticated = false;
        this.closeModal('teacher-modal');
        this.showToast('ล็อกหน้าจอศูนย์ควบคุมคุณครูเรียบร้อยแล้ว 🔒');
      });
    }

    // Main 5 Tabs
    const mainTabsContainer = document.getElementById('teacher-main-tabs');
    if (mainTabsContainer) {
      mainTabsContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.teacher-main-tab-btn');
        if (btn) {
          const tab = btn.dataset.tab;
          this.switchTeacherTab(tab);
        }
      });
    }

    // Check-in Filters & Search
    const checkinRoomFilter = document.getElementById('teacher-checkin-room-filter');
    if (checkinRoomFilter) {
      checkinRoomFilter.addEventListener('change', () => this.renderTeacherCheckinsTab());
    }

    const checkinSearch = document.getElementById('teacher-checkin-search');
    if (checkinSearch) {
      checkinSearch.addEventListener('input', () => this.renderTeacherCheckinsTab());
    }

    // Export CSV
    const exportCsvBtn = document.getElementById('btn-export-checkins-csv');
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener('click', () => this.exportCheckinsToCSV());
    }

    // Likes Room Filter
    const likesRoomFilter = document.getElementById('teacher-likes-room-filter');
    if (likesRoomFilter) {
      likesRoomFilter.addEventListener('change', () => this.renderTeacherLikesTab());
    }

    // Clear Check-ins Button
    const clearCheckinsBtn = document.getElementById('btn-clear-checkins');
    if (clearCheckinsBtn) {
      clearCheckinsBtn.addEventListener('click', () => {
        const filterRoom = (document.getElementById('teacher-checkin-room-filter') || {}).value || 'all';
        const roomLabel = filterRoom === 'all' ? 'ทุกห้องนิทรรศการ (1-5)' : `ห้องที่ ${filterRoom}`;
        if (confirm(`คุณต้องการล้างข้อมูลการเช็คอินทั้งหมดใน "${roomLabel}" ใช่หรือไม่?`)) {
          if (this.app.exhibition) {
            this.app.exhibition.clearCheckins(filterRoom);
            this.renderTeacherCheckinsTab();
            if (this.renderTeacherAnalyticsTab) this.renderTeacherAnalyticsTab();
            this.showToast(`ล้างข้อมูลการเช็คอินใน "${roomLabel}" เรียบร้อยแล้ว`);
          }
        }
      });
    }

    // Clear Likes Button
    const clearLikesBtn = document.getElementById('btn-clear-likes');
    if (clearLikesBtn) {
      clearLikesBtn.addEventListener('click', () => {
        const filterRoom = (document.getElementById('teacher-likes-room-filter') || {}).value || 'all';
        const roomLabel = filterRoom === 'all' ? 'ทุกห้องนิทรรศการ (1-5)' : `ห้องที่ ${filterRoom}`;
        if (confirm(`คุณต้องการล้างข้อมูลการกดถูกใจทั้งหมดใน "${roomLabel}" ใช่หรือไม่?`)) {
          if (this.app.exhibition) {
            this.app.exhibition.clearLikes(filterRoom);
            this.renderTeacherLikesTab();
            if (this.renderTeacherAnalyticsTab) this.renderTeacherAnalyticsTab();
            this.showToast(`ล้างข้อมูลการกดถูกใจใน "${roomLabel}" เรียบร้อยแล้ว`);
          }
        }
      });
    }

    // Clear All Sticky Notes Button
    const clearNotesBtn = document.getElementById('btn-clear-all-notes');
    if (clearNotesBtn) {
      clearNotesBtn.addEventListener('click', () => {
        if (confirm('คุณต้องการล้างแผ่นกระดาษโน้ต Post-it ทั้งหมดในโลก 3D ใช่หรือไม่?')) {
          if (this.app.stickyNotes) {
            this.app.stickyNotes.clearAllNotes();
            this.renderTeacherNotesTab();
            this.showToast('ล้างข้อความโน้ต Post-it ทั้งหมดเรียบร้อยแล้ว');
          }
        }
      });
    }

    // 1. Broadcast
    const broadcastForm = document.getElementById('teacher-broadcast-form');
    if (broadcastForm) {
      broadcastForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const msg = document.getElementById('teacher-broadcast-input').value.trim();
        if (msg) {
          this.showTeacherBroadcast(msg);
          this.playChime('info');
          this.showToast('ส่งประกาศด่วนถึงนักเรียนทุกคนแล้ว');
        }
      });
    }

    // 2. Summon
    const summonBtn = document.getElementById('btn-teacher-summon-all');
    if (summonBtn) {
      summonBtn.addEventListener('click', () => {
        if (this.app.player) {
          this.app.player.position.set(0, 0, 18);
          this.app.player.cameraYaw = 0;
        }
        this.showTeacherBroadcast('🔔 ขอเชิญนักเรียนทุกคนมารวมตัวกันที่หน้าเวทีหอประชุม');
        this.showToast('เรียกรวมตัวนักเรียนทุกคนมาที่หอประชุม');
        this.closeModal('teacher-modal');
      });
    }

    // 3. Clear Current Room
    const clearRoomBtn = document.getElementById('btn-teacher-clear-room');
    if (clearRoomBtn) {
      clearRoomBtn.addEventListener('click', () => {
        const room = this.app.exhibition.getCurrentRoomInfo();
        if (confirm(`คุณต้องการล้างข้อมูลผลงานทั้งหมดใน "${room.name}" ใช่หรือไม่?`)) {
          if (this.app.exhibition) {
            this.app.exhibition.clearCurrentRoom();
            this.renderTeacherBoothList();
            this.showToast(`ล้างข้อมูลใน ${room.name} เรียบร้อยแล้ว`);
          }
        }
      });
    }

    // 4. Clear ALL 5 Rooms
    const clearAllBtn = document.getElementById('btn-teacher-clear-all');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => {
        if (confirm('⚠️ คำเตือน: คุณต้องการล้างข้อมูลผลงานนิทรรศการทั้ง 5 ห้อง (พุทธ, คริสต์, ฮินดู, อิสลาม, ยูดาห์) เพื่อเริ่มต้นใหม่ทั้งหมดใช่หรือไม่?')) {
          if (this.app.exhibition) {
            this.app.exhibition.clearAllRooms();
            this.renderTeacherBoothList();
            this.showToast('ล้างข้อมูลนิทรรศการครบทั้ง 5 ห้องเรียบร้อยแล้ว!');
          }
        }
      });
    }

    // 5. Room Tab Switcher for Teacher in Classroom Control
    const teacherRoomTabs = document.getElementById('teacher-room-tabs');
    if (teacherRoomTabs) {
      teacherRoomTabs.addEventListener('click', (e) => {
        const btn = e.target.closest('.teacher-tab-btn');
        if (btn) {
          const roomId = btn.dataset.room;
          this.switchRoom(roomId);
          this.renderTeacherBoothList();
        }
      });
    }

    // 6. Crowd Slider
    const crowdSlider = document.getElementById('teacher-crowd-slider');
    const crowdLabel = document.getElementById('teacher-crowd-label');
    if (crowdSlider && crowdLabel) {
      crowdSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        crowdLabel.innerText = `${val} คน`;
        if (this.app.multiplayer) this.app.multiplayer.setCrowdCapacity(val);
      });
    }
  }

  async syncTeacherDataFromServer() {
    try {
      const res = await fetch('/api/teacher_stats?_t=' + Date.now());
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.stats) {
          for (let r = 1; r <= 5; r++) {
            const rStr = r.toString();
            if (json.stats[rStr] && Array.isArray(json.stats[rStr])) {
              const defaults = this.app.exhibition ? this.app.exhibition.createEmptyBoothsForRoom(rStr) : [];
              const sanitizedBooths = json.stats[rStr].map((b, idx) => {
                if (b && typeof b === 'object') {
                  return {
                    ...(defaults[idx] || {}),
                    ...b,
                    checkins: Array.isArray(b.checkins) ? b.checkins : [],
                    likedBy: Array.isArray(b.likedBy) ? b.likedBy : []
                  };
                }
                return defaults[idx] || {};
              });
              localStorage.setItem(`spatial_metaverse_exhibition_room_${r}`, JSON.stringify(sanitizedBooths));
              if (this.app.exhibition && this.app.exhibition.currentRoomId.toString() === rStr) {
                this.app.exhibition.artworks = sanitizedBooths;
                this.app.exhibition.refreshAllFrames();
              }
            }
          }
        }
        if (json.success && json.notes && this.app.stickyNotes) {
          this.app.stickyNotes.notes = json.notes;
          localStorage.setItem('spatial_metaverse_sticky_notes', JSON.stringify(json.notes));
          this.app.stickyNotes.renderAllNotes();
        }
      }
    } catch (e) {
      console.warn('Teacher sync from server error:', e);
    }
  }

  async openTeacherModal() {
    // Enforce teacher-only access: Must be authenticated with PIN
    if (!this.teacherAuthenticated) {
      const errorEl = document.getElementById('teacher-pin-error');
      if (errorEl) errorEl.style.display = 'none';
      const pinInput = document.getElementById('teacher-pin-input');
      if (pinInput) pinInput.value = '';
      this.openModal('teacher-pin-modal');
      return;
    }

    await this.syncTeacherDataFromServer();
    this.renderTeacherDashboard();
    this.openModal('teacher-modal');
  }

  async switchTeacherTab(tabName) {
    document.querySelectorAll('.teacher-main-tab-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tabName);
    });

    const panels = ['checkins', 'likes', 'notes', 'analytics', 'control'];
    panels.forEach(p => {
      const el = document.getElementById(`teacher-tab-content-${p}`);
      if (el) el.style.display = (p === tabName) ? 'block' : 'none';
    });

    await this.syncTeacherDataFromServer();

    if (tabName === 'checkins') this.renderTeacherCheckinsTab();
    else if (tabName === 'likes') this.renderTeacherLikesTab();
    else if (tabName === 'notes') this.renderTeacherNotesTab();
    else if (tabName === 'analytics') this.renderTeacherAnalyticsTab();
    else if (tabName === 'control') this.renderTeacherBoothList();
  }

  renderTeacherDashboard() {
    // Default to currently active tab or checkins
    const activeBtn = document.querySelector('.teacher-main-tab-btn.active');
    const activeTab = activeBtn ? activeBtn.dataset.tab : 'checkins';
    this.switchTeacherTab(activeTab);
  }

  renderTeacherCheckinsTab() {
    const tbody = document.getElementById('teacher-checkins-tbody');
    const emptyEl = document.getElementById('teacher-checkin-empty');
    if (!tbody || !this.app.exhibition) return;

    const filterRoom = (document.getElementById('teacher-checkin-room-filter') || {}).value || 'all';
    const searchTerm = ((document.getElementById('teacher-checkin-search') || {}).value || '').trim().toLowerCase();

    let checkins = this.app.exhibition.getAllCheckins(filterRoom);
    if (searchTerm) {
      checkins = checkins.filter(c =>
        (c.studentName && c.studentName.toLowerCase().includes(searchTerm)) ||
        (c.studentId && c.studentId.toLowerCase().includes(searchTerm)) ||
        (c.studentClass && c.studentClass.toLowerCase().includes(searchTerm)) ||
        (c.boothTitle && c.boothTitle.toLowerCase().includes(searchTerm))
      );
    }

    tbody.innerHTML = '';
    if (checkins.length === 0) {
      if (emptyEl) emptyEl.style.display = 'block';
      return;
    }

    if (emptyEl) emptyEl.style.display = 'none';
    checkins.forEach((chk, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="color: var(--text-muted); font-weight: 600;">${idx + 1}</td>
        <td style="color: #94a3b8; font-size: 11px; white-space: nowrap;">${this.formatDateTime(chk.timestamp)}</td>
        <td style="font-weight: 700; color: #38bdf8; font-family: monospace; font-size: 13px;">${this.escapeHTML(chk.studentId || '-')}</td>
        <td style="font-weight: 600; color: #ffffff;">${this.escapeHTML(chk.studentName || 'นักเรียน')}</td>
        <td style="color: #cbd5e1; font-size: 11px;">${this.escapeHTML(chk.studentClass || '-')}</td>
        <td>
          <div style="font-weight: 600; color: #f8fafc;">${chk.roomInfo.icon} ${this.escapeHTML(chk.roomInfo.name)} • บูธที่ ${chk.boothNumber}</div>
          <div style="font-size: 11px; color: var(--text-muted); text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 180px;">${this.escapeHTML(chk.boothTitle || '')}</div>
        </td>
        <td style="text-align: center; font-weight: 800; font-size: 13px; color: ${chk.passed ? '#34d399' : '#f87171'};">
          ${chk.score} / ${chk.total || 5}
        </td>
        <td style="text-align: center;">
          <span class="${chk.passed ? 'badge-pass' : 'badge-fail'}">
            ${chk.passed ? '✅ ผ่านเกณฑ์' : '❌ ไม่ผ่าน'}
          </span>
        </td>
        <td style="text-align: center;">
          <button type="button" class="btn btn-danger btn-sm" style="padding: 3px 8px; font-size: 11px;" onclick="window.spatialUI.deleteTeacherCheckin('${chk.roomId}', '${chk.boothId}', '${encodeURIComponent(chk.studentName || '')}', '${chk.timestamp || ''}')">
            🗑️ ลบ
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  renderTeacherLikesTab() {
    const tbody = document.getElementById('teacher-likes-tbody');
    const emptyEl = document.getElementById('teacher-likes-empty');
    const badgeEl = document.getElementById('teacher-likes-count-badge');
    if (!tbody || !this.app.exhibition) return;

    const filterRoom = (document.getElementById('teacher-likes-room-filter') || {}).value || 'all';
    const likes = this.app.exhibition.getAllLikes(filterRoom);

    if (badgeEl) badgeEl.innerText = `❤️ ทั้งหมด ${likes.length} ครั้ง`;

    tbody.innerHTML = '';
    if (likes.length === 0) {
      if (emptyEl) emptyEl.style.display = 'block';
      return;
    }

    if (emptyEl) emptyEl.style.display = 'none';
    likes.forEach((like, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="color: var(--text-muted);">${idx + 1}</td>
        <td style="color: #94a3b8; font-size: 11px; white-space: nowrap;">${this.formatDateTime(like.timestamp)}</td>
        <td style="font-weight: 700; color: #38bdf8; font-family: monospace;">${this.escapeHTML(like.studentId || '-')}</td>
        <td style="font-weight: 600; color: #ffffff;">${this.escapeHTML(like.name || 'นักเรียน')}</td>
        <td style="color: #cbd5e1; font-size: 11px;">${this.escapeHTML(like.studentClass || '-')}</td>
        <td style="font-weight: 600; color: #fbbf24;">บูธที่ ${like.boothNumber}: ${this.escapeHTML(like.boothTitle || '')}</td>
        <td style="color: #38bdf8;">${like.roomInfo.icon} ${this.escapeHTML(like.roomInfo.name)}</td>
        <td style="text-align: center;">
          <button type="button" class="btn btn-danger btn-sm" style="padding: 3px 8px; font-size: 11px;" onclick="window.spatialUI.deleteTeacherLike('${like.roomId}', '${like.boothId}', '${encodeURIComponent(like.name || like.studentName || '')}', '${like.timestamp || ''}')">
            🗑️ ลบ
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  renderTeacherNotesTab() {
    const tbody = document.getElementById('teacher-notes-tbody');
    const emptyEl = document.getElementById('teacher-notes-empty');
    const countBadge = document.getElementById('teacher-notes-count-badge');
    if (!tbody || !this.app.stickyNotes) return;

    const notes = this.app.stickyNotes.getAllNotes();
    if (countBadge) countBadge.innerText = `ทั้งหมด ${notes.length} ข้อความ`;

    tbody.innerHTML = '';
    if (notes.length === 0) {
      if (emptyEl) emptyEl.style.display = 'block';
      return;
    }

    if (emptyEl) emptyEl.style.display = 'none';
    notes.forEach((note, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="color: var(--text-muted);">${idx + 1}</td>
        <td style="color: #94a3b8; font-size: 11px; white-space: nowrap;">${this.formatDateTime(note.timestamp)}</td>
        <td style="font-weight: 600;">
          <span style="color: #38bdf8; font-family: monospace;">[${this.escapeHTML(note.studentId || '-')}]</span>
          ${this.escapeHTML(note.author || 'นักเรียน')}
        </td>
        <td style="color: #cbd5e1; font-size: 11px;">${this.escapeHTML(note.studentClass || '-')}</td>
        <td style="max-width: 260px; line-height: 1.4; color: #f8fafc; font-size: 12px;">
          ${this.escapeHTML(note.text || '')}
        </td>
        <td style="text-align: center; color: #f43f5e; font-weight: 700;">❤️ ${note.likes || 0}</td>
        <td style="text-align: center;">
          <button type="button" class="btn btn-danger btn-sm" style="padding: 4px 8px; font-size: 11px;" onclick="window.spatialUI.deleteTeacherNote('${note.id}')">
            🗑️ ลบ
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  deleteTeacherNote(noteId) {
    if (confirm('คุณต้องการลบข้อความโน้ตแผ่นนี้ใช่หรือไม่?')) {
      if (this.app.stickyNotes) {
        this.app.stickyNotes.deleteNote(noteId);
        this.renderTeacherNotesTab();
        this.showToast('ลบข้อความโน้ตเรียบร้อยแล้ว');
      }
    }
  }

  deleteTeacherCheckin(roomId, boothId, studentNameEncoded, timestamp) {
    const studentName = decodeURIComponent(studentNameEncoded || '');
    if (confirm(`คุณต้องการลบข้อมูลการเช็คอินของ "${studentName}" ใช่หรือไม่?`)) {
      if (this.app.exhibition) {
        this.app.exhibition.deleteCheckinRecord(roomId, boothId, studentName, timestamp);
        this.renderTeacherCheckinsTab();
        if (this.renderTeacherAnalyticsTab) this.renderTeacherAnalyticsTab();
        this.showToast(`ลบข้อมูลการเช็คอินของ "${studentName}" เรียบร้อยแล้ว`);
      }
    }
  }

  deleteTeacherLike(roomId, boothId, studentNameEncoded, timestamp) {
    const studentName = decodeURIComponent(studentNameEncoded || '');
    if (confirm(`คุณต้องการลบรายการกดถูกใจของ "${studentName}" ใช่หรือไม่?`)) {
      if (this.app.exhibition) {
        this.app.exhibition.deleteLikeRecord(roomId, boothId, studentName, timestamp);
        this.renderTeacherLikesTab();
        if (this.renderTeacherAnalyticsTab) this.renderTeacherAnalyticsTab();
        this.showToast(`ลบรายการกดถูกใจของ "${studentName}" เรียบร้อยแล้ว`);
      }
    }
  }

  renderTeacherAnalyticsTab() {
    if (!this.app.exhibition) return;
    const stats = this.app.exhibition.getOverallAnalytics();

    const totalEl = document.getElementById('kpi-total-checkins');
    const uniqueEl = document.getElementById('kpi-unique-students');
    const passRateEl = document.getElementById('kpi-pass-rate');
    const avgScoreEl = document.getElementById('kpi-avg-score');
    const totalLikesEl = document.getElementById('kpi-total-likes');

    if (totalEl) totalEl.innerText = stats.totalCheckins;
    if (uniqueEl) uniqueEl.innerText = `${stats.uniqueStudentsCount} คน`;
    if (passRateEl) passRateEl.innerText = `${stats.passRate}%`;
    if (avgScoreEl) avgScoreEl.innerText = `${stats.averageScore} / 5`;
    if (totalLikesEl) totalLikesEl.innerText = stats.totalLikes;

    const topListEl = document.getElementById('teacher-top-booths-list');
    if (topListEl) {
      topListEl.innerHTML = '';
      if (!stats.topBooths || stats.topBooths.length === 0) {
        topListEl.innerHTML = '<div style="color: var(--text-muted); font-size: 12px;">ยังไม่มีข้อมูลผลงานจัดแสดง</div>';
      } else {
        const medals = ['🥇 อันดับ 1', '🥈 อันดับ 2', '🥉 อันดับ 3', '🎖️ อันดับ 4', '🎖️ อันดับ 5'];
        stats.topBooths.forEach((b, idx) => {
          const item = document.createElement('div');
          item.style.cssText = 'display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.04); padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); font-size: 12px;';
          item.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-weight: 700; color: #fbbf24;">${medals[idx] || `#${idx + 1}`}</span>
              <div>
                <strong style="color: #ffffff;">${this.escapeHTML(b.title)}</strong>
                <div style="color: var(--text-muted); font-size: 11px;">${b.roomName} • โดย: ${this.escapeHTML(b.creator)}</div>
              </div>
            </div>
            <div style="display: flex; gap: 10px; font-weight: 700;">
              <span style="color: #38bdf8;">📋 เช็คอิน: ${b.checkinsCount} คน</span>
              <span style="color: #f43f5e;">❤️ ${b.likesCount} ไลก์</span>
            </div>
          `;
          topListEl.appendChild(item);
        });
      }
    }
  }

  exportCheckinsToCSV() {
    if (!this.app.exhibition) return;
    const checkins = this.app.exhibition.getAllCheckins('all');
    if (checkins.length === 0) {
      alert('ยังไม่มีข้อมูลการเช็คอินสำหรับส่งออกครับ');
      return;
    }

    let csv = '\uFEFFลำดับ,วัน-เวลา,รหัสประจำตัวนักเรียน,ชื่อ-นามสกุล,ระดับชั้น,ห้องนิทรรศการ,บูธจัดแสดง,คะแนนที่ได้,คะแนนเต็ม,สถานะการเช็คอิน\n';
    checkins.forEach((c, idx) => {
      const dateStr = `"${this.formatDateTime(c.timestamp)}"`;
      const idStr = `"${c.studentId || '-'}"`;
      const nameStr = `"${(c.studentName || 'นักเรียน').replace(/"/g, '""')}"`;
      const classStr = `"${(c.studentClass || '-').replace(/"/g, '""')}"`;
      const roomStr = `"${(c.roomInfo.name || `ห้อง ${c.roomId}`).replace(/"/g, '""')}"`;
      const boothStr = `"บูธที่ ${c.boothNumber}: ${(c.boothTitle || '').replace(/"/g, '""')}"`;
      const scoreStr = c.score;
      const totalStr = c.total || 5;
      const statusStr = c.passed ? '"ผ่านเกณฑ์ (≥3 ข้อ)"' : '"ไม่ผ่านเกณฑ์"';
      csv += `${idx + 1},${dateStr},${idStr},${nameStr},${classStr},${roomStr},${boothStr},${scoreStr},${totalStr},${statusStr}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `รายงานการเช็คอินนิทรรศการศาสนา_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.playChime('info');
    this.showToast('ดาวน์โหลดรายงานคะแนนการเช็คอิน (CSV) เรียบร้อยแล้ว!');
  }

  renderTeacherBoothList() {
    const listEl = document.getElementById('teacher-booth-list');
    if (!listEl || !this.app.exhibition) return;

    const currentRoom = this.app.exhibition.getCurrentRoomInfo();
    const roomHeader = document.getElementById('teacher-current-room-name');
    if (roomHeader) {
      roomHeader.innerText = `${currentRoom.icon} ${currentRoom.name} (${currentRoom.title})`;
      roomHeader.style.color = currentRoom.color;
    }

    // Update active tab buttons
    document.querySelectorAll('.teacher-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.room === currentRoom.id);
    });

    listEl.innerHTML = '';
    this.app.exhibition.artworks.forEach((art, idx) => {
      const row = document.createElement('div');
      row.className = 'dashboard-booth-row';
      const checkinCount = (art.checkins || []).length;
      row.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-weight: 700; color: ${currentRoom.color};">บูธที่ ${idx + 1}</span>
          <div>
            <div style="font-weight: 600; font-size: 13px;">${art.isEmpty ? '<span style="color:#64748b;">(พื้นที่ว่าง - รอนักเรียนติดตั้ง)</span>' : this.escapeHTML(art.title)}</div>
            <div style="font-size: 11px; color: var(--text-muted);">${art.isEmpty ? '-' : `${art.creator} (${art.schoolClass}) • หมวด: ${art.category} • ❤️ ${art.likes || 0} ถูกใจ • 📋 เช็คอิน ${checkinCount} คน`}</div>
          </div>
        </div>
        <div style="display: flex; gap: 6px;">
          ${art.isEmpty ? '' : `<button class="btn btn-primary btn-sm" onclick="window.spatialUI.showArtworkInspector(window.spatialUI.app.exhibition.artworks[${idx}]); window.spatialUI.closeModal('teacher-modal');">👁️ ตรวจผลงาน</button>`}
          <button class="btn btn-secondary btn-sm" onclick="window.spatialUI.openCreatorModal(${idx + 1}); window.spatialUI.closeModal('teacher-modal');">✏️ แก้ไข</button>
          <button class="btn btn-secondary btn-sm" onclick="window.spatialUI.teleportToBooth(${idx + 1}); window.spatialUI.closeModal('teacher-modal');">🚶 วาร์ปไปดู</button>
        </div>
      `;
      listEl.appendChild(row);
    });
  }

  // =========================================================================
  // WINDOW 3: VISITOR GUIDE (หน้าต่างสำหรับผู้เข้าชม)
  // =========================================================================
  initVisitorGuideModal() {
    const visitorRoomTabs = document.getElementById('visitor-room-tabs');
    if (visitorRoomTabs) {
      visitorRoomTabs.addEventListener('click', (e) => {
        const btn = e.target.closest('.visitor-tab-btn');
        if (btn) {
          const roomId = btn.dataset.room;
          this.switchRoom(roomId);
          this.renderVisitorBoothDirectory();
        }
      });
    }
  }

  openVisitorModal() {
    this.renderVisitorBoothDirectory();
    this.openModal('visitor-modal');
  }

  renderVisitorBoothDirectory() {
    const container = document.getElementById('visitor-directory-list');
    if (!container || !this.app.exhibition) return;

    const currentRoom = this.app.exhibition.getCurrentRoomInfo();
    const titleEl = document.getElementById('visitor-current-room-title');
    if (titleEl) {
      titleEl.innerText = `${currentRoom.icon} สารบัญ ${currentRoom.name}`;
      titleEl.style.color = currentRoom.color;
    }

    document.querySelectorAll('.visitor-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.room === currentRoom.id);
    });

    container.innerHTML = '';
    this.app.exhibition.artworks.forEach((art, idx) => {
      const card = document.createElement('div');
      card.className = 'visitor-booth-card';
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <span class="badge-booth" style="color:${currentRoom.color}; border-color:${currentRoom.color};">บูธที่ ${idx + 1} • ${currentRoom.name}</span>
            <h4 style="margin-top: 4px; font-size: 15px; color: white;">${this.escapeHTML(art.title)}</h4>
            <div style="font-size: 12px; color: var(--primary);">${art.isEmpty ? 'พื้นที่ว่าง (รอนักเรียนจัดแสดง)' : `โดย: ${this.escapeHTML(art.creator)} (${this.escapeHTML(art.schoolClass)})`}</div>
          </div>
          <div style="display: flex; gap: 6px;">
            ${art.isEmpty ? '' : `<button class="btn btn-primary btn-sm" onclick="window.spatialUI.showArtworkInspector(window.spatialUI.app.exhibition.artworks[${idx}]); window.spatialUI.closeModal('visitor-modal');">👁️ ชมผลงาน</button>`}
            <button class="btn btn-secondary btn-sm" onclick="window.spatialUI.teleportToBooth(${idx + 1}); window.spatialUI.closeModal('visitor-modal');">
              🚶 วาร์ปไปบูธ
            </button>
          </div>
        </div>
        <p style="font-size: 12px; color: var(--text-muted); margin-top: 6px; line-height: 1.4;">
          ${art.isEmpty ? 'บูธนี้กำลังเปิดรับผลงาน สามารถกดปุ่มสร้างผลงานเพื่อติดตั้งได้ครับ' : this.escapeHTML(art.concept.slice(0, 110) + '...')}
        </p>
      `;
      container.appendChild(card);
    });
  }

  teleportToBooth(boothNumber) {
    if (!this.app.exhibition || !this.app.player) return;
    const art = this.app.exhibition.artworks[boothNumber - 1];
    if (art) {
      const offset = (art.rotY > 0) ? new THREE.Vector3(2.5, 0, 0) : new THREE.Vector3(-2.5, 0, 0);
      this.app.player.position.set(art.pos.x + offset.x, 0, art.pos.z + offset.z);
      this.app.player.cameraYaw = (art.rotY > 0) ? -Math.PI / 2 : Math.PI / 2;
      this.showToast(`วาร์ปมายังบูธจัดแสดงที่ ${boothNumber} เรียบร้อยแล้ว`);
    }
  }

  showTeacherBroadcast(text) {
    const bar = document.getElementById('teacher-broadcast-bar');
    const msgEl = document.getElementById('teacher-broadcast-msg');
    if (bar && msgEl) {
      msgEl.innerText = text;
      bar.style.display = 'flex';
      setTimeout(() => {
        bar.style.display = 'none';
      }, 10000);
    }
  }

  // =========================================================================
  // BOOTH CHECK-IN & 5-QUESTION QUIZ INSPECTOR
  // =========================================================================
  initBoothQuizInspector() {
    const startBtn = document.getElementById('btn-start-booth-quiz');
    const cancelBtn = document.getElementById('btn-cancel-booth-quiz');
    const submitBtn = document.getElementById('btn-submit-booth-quiz');

    if (startBtn) {
      startBtn.addEventListener('click', () => {
        if (!this.currentInspectedArt) return;
        const promptBox = document.getElementById('artwork-quiz-prompt-box');
        const container = document.getElementById('artwork-quiz-container');
        const resultBox = document.getElementById('artwork-quiz-result-box');
        const valMsg = document.getElementById('quiz-validation-msg');
        if (valMsg) valMsg.style.display = 'none';
        if (promptBox) promptBox.style.display = 'none';
        if (resultBox) resultBox.style.display = 'none';
        if (container) container.style.display = 'block';
        this.renderActiveQuizQuestions(this.currentInspectedArt);
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        const promptBox = document.getElementById('artwork-quiz-prompt-box');
        const container = document.getElementById('artwork-quiz-container');
        const valMsg = document.getElementById('quiz-validation-msg');
        if (valMsg) valMsg.style.display = 'none';
        if (promptBox) promptBox.style.display = 'block';
        if (container) container.style.display = 'none';
      });
    }

    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        if (!this.currentInspectedArt || !this.app.exhibition) return;
        const art = this.currentInspectedArt;
        const questions = (art.quizQuestions && art.quizQuestions.length === 5)
          ? art.quizQuestions
          : this.app.exhibition.getDefaultQuestionsForRoom(art.roomId || this.app.exhibition.currentRoomId, art.boothNumber);

        // Collect answers 0..4
        const answers = [];
        const missingQuestions = [];
        for (let i = 0; i < questions.length; i++) {
          const radio = document.querySelector(`input[name="booth_quiz_ans_${i}"]:checked`);
          if (!radio) {
            missingQuestions.push(i + 1);
          } else {
            answers.push(parseInt(radio.value));
          }
        }

        const validationEl = document.getElementById('quiz-validation-msg');
        if (missingQuestions.length > 0) {
          if (validationEl) {
            validationEl.style.display = 'block';
            validationEl.innerHTML = `⚠️ กรุณาเลือกคำตอบให้ครบทั้ง 5 ข้อก่อนกดส่งคำตอบครับ (ยังไม่ได้ตอบข้อที่: ${missingQuestions.join(', ')})`;
          } else {
            alert(`⚠️ กรุณาเลือกคำตอบให้ครบทั้ง 5 ข้อก่อนกดส่งคำตอบครับ (ยังไม่ได้ตอบข้อที่: ${missingQuestions.join(', ')})`);
          }
          return;
        }
        if (validationEl) validationEl.style.display = 'none';

        const res = this.app.exhibition.checkinArtwork(art.id, this.currentUser, answers);

        const container = document.getElementById('artwork-quiz-container');
        const resultBox = document.getElementById('artwork-quiz-result-box');
        const promptBox = document.getElementById('artwork-quiz-prompt-box');
        const statusBadge = document.getElementById('artwork-quiz-status-badge');

        if (container) container.style.display = 'none';

        if (res.passed) {
          this.playChime('applause');
          if (statusBadge) {
            statusBadge.className = 'badge-booth badge-pass';
            statusBadge.innerText = `✅ เช็คอินสำเร็จ (${res.score}/5)`;
          }
          if (resultBox) {
            resultBox.style.display = 'block';
            resultBox.style.background = 'rgba(16, 185, 129, 0.15)';
            resultBox.style.border = '1px solid rgba(16, 185, 129, 0.5)';
            resultBox.style.color = '#34d399';
            resultBox.innerHTML = `
              <div style="font-weight: 700; font-size: 13px; margin-bottom: 4px;">🎉 ยินดีด้วยครับ! คุณเช็คอินสำเร็จแล้ว</div>
              <div>คุณตอบถูก <strong>${res.score} จาก ${res.total} ข้อ</strong> (เกณฑ์ผ่าน ≥ 3 ข้อ) ระบบได้บันทึกประวัติการเช็คอินเข้าสู่ศูนย์ควบคุมเรียบร้อยแล้ว</div>
            `;
          }
          if (promptBox) {
            promptBox.style.display = 'block';
            promptBox.innerHTML = `
              <div style="font-size: 12px; color: #a7f3d0; margin-bottom: 6px; line-height: 1.4;">
                ✅ คุณ (<strong>${this.escapeHTML(this.currentUser.name)}</strong>) เช็คอินศึกษาบูธนี้เรียบร้อยแล้ว ได้คะแนน ${res.score}/5 ข้อ
              </div>
              <button id="btn-retest-quiz" type="button" class="btn btn-secondary btn-sm" style="width: 100%;">
                🔄 ทำแบบทดสอบทบทวนใหม่อีกครั้ง
              </button>
            `;
            const retestBtn = document.getElementById('btn-retest-quiz');
            if (retestBtn) {
              retestBtn.onclick = () => {
                promptBox.style.display = 'none';
                if (resultBox) resultBox.style.display = 'none';
                if (container) container.style.display = 'block';
                const vMsg = document.getElementById('quiz-validation-msg');
                if (vMsg) vMsg.style.display = 'none';
                this.renderActiveQuizQuestions(art);
              };
            }
          }
          this.showToast(`เช็คอินสำเร็จ! ผ่านเกณฑ์ด้วยคะแนน ${res.score}/5 ข้อ`);
        } else {
          this.playChime('info');
          if (statusBadge) {
            statusBadge.className = 'badge-booth badge-fail';
            statusBadge.innerText = `ยังไม่ผ่าน (${res.score}/5)`;
          }
          if (resultBox) {
            resultBox.style.display = 'block';
            resultBox.style.background = 'rgba(239, 68, 68, 0.15)';
            resultBox.style.border = '1px solid rgba(239, 68, 68, 0.5)';
            resultBox.style.color = '#f87171';
            resultBox.innerHTML = `
              <div style="font-weight: 700; font-size: 13px; margin-bottom: 4px;">❌ ยังไม่ผ่านเกณฑ์การเช็คอิน</div>
              <div>คุณตอบถูก <strong>${res.score} จาก ${res.total} ข้อ</strong> (เกณฑ์ต้องได้ 3 ข้อขึ้นไป) กรุณาศึกษาเนื้อหาในบูธหรือเปิดดูสไลด์ แล้วกดลองทำใหม่อีกครั้งครับ</div>
            `;
          }
          if (promptBox) {
            promptBox.style.display = 'block';
            promptBox.innerHTML = `
              <p style="font-size: 12px; color: var(--text-muted); line-height: 1.5; margin-bottom: 8px;">
                ยืนยันการเข้ามาศึกษาในบูธนี้ โดยทำแบบทดสอบ 5 ข้อ ต้องตอบถูกอย่างน้อย <strong>3 จาก 5 ข้อ (≥ 60%)</strong>
              </p>
              <button id="btn-start-booth-quiz" type="button" class="btn btn-primary btn-sm" style="width: 100%; padding: 9px 12px; font-weight: 700;">
                ✍️ ลองทำแบบทดสอบใหม่อีกครั้ง
              </button>
            `;
            const startBtnAgain = document.getElementById('btn-start-booth-quiz');
            if (startBtnAgain) {
              startBtnAgain.onclick = () => {
                promptBox.style.display = 'none';
                if (resultBox) resultBox.style.display = 'none';
                if (container) container.style.display = 'block';
                const vMsg = document.getElementById('quiz-validation-msg');
                if (vMsg) vMsg.style.display = 'none';
                this.renderActiveQuizQuestions(art);
              };
            }
          }
          this.showToast(`ยังไม่ผ่านเกณฑ์ ได้ ${res.score}/5 ข้อ (ต้องได้ 3 ข้อขึ้นไป)`);
        }
      });
    }
  }

  renderActiveQuizQuestions(art) {
    const list = document.getElementById('artwork-quiz-questions-list');
    if (!list) return;

    const questions = (art.quizQuestions && art.quizQuestions.length === 5)
      ? art.quizQuestions
      : this.app.exhibition.getDefaultQuestionsForRoom(art.roomId || this.app.exhibition.currentRoomId, art.boothNumber);

    list.innerHTML = '';
    const choicePrefix = ['ก.', 'ข.', 'ค.', 'ง.'];

    questions.forEach((q, qIdx) => {
      const qCard = document.createElement('div');
      qCard.className = 'quiz-question-box';
      qCard.id = `quiz-question-card-${qIdx}`;
      qCard.innerHTML = `
        <div class="quiz-question-title">${this.escapeHTML(q.question || `คำถามข้อที่ ${qIdx + 1}`)}</div>
        <div class="quiz-options-group">
          ${q.options.map((opt, optIdx) => `
            <label class="quiz-option-label" id="label-q-${qIdx}-opt-${optIdx}" for="q_${qIdx}_opt_${optIdx}">
              <input type="radio" id="q_${qIdx}_opt_${optIdx}" name="booth_quiz_ans_${qIdx}" value="${optIdx}">
              <span><strong>${choicePrefix[optIdx]}</strong> ${this.escapeHTML(opt)}</span>
            </label>
          `).join('')}
        </div>
      `;
      list.appendChild(qCard);
    });

    // Option highlight and selection logic for mobile & desktop
    list.querySelectorAll('input[type="radio"]').forEach(radio => {
      radio.addEventListener('change', () => {
        const groupName = radio.name;
        document.querySelectorAll(`input[name="${groupName}"]`).forEach(r => {
          const parentLabel = r.closest('.quiz-option-label');
          if (parentLabel) parentLabel.classList.toggle('selected', r.checked);
        });
        const vMsg = document.getElementById('quiz-validation-msg');
        if (vMsg) vMsg.style.display = 'none';
      });
    });

    // Touch/click label handler
    list.querySelectorAll('.quiz-option-label').forEach(label => {
      label.addEventListener('click', (e) => {
        const radio = label.querySelector('input[type="radio"]');
        if (radio && !radio.checked) {
          radio.checked = true;
          radio.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    });
  }

  handleLikeArtwork() {
    if (!this.currentInspectedArt || !this.app.exhibition) return;
    const newLikes = this.app.exhibition.likeArtwork(this.currentInspectedArt.id, this.currentUser);
    const likesEl = document.getElementById('artwork-modal-likes');
    if (likesEl) likesEl.innerText = `${newLikes} ถูกใจ`;
    const likeBtn = document.getElementById('btn-artwork-like');
    if (likeBtn) likeBtn.innerHTML = `❤️ ถูกใจ (${newLikes})`;
    this.playChime('reaction');
    this.showToast('กดถูกใจผลงานนี้แล้ว!');
  }

  formatDateTime(isoStr) {
    if (!isoStr) return '-';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return isoStr;
    }
  }

  // =========================================================================
  // ARTWORK INSPECTOR
  // =========================================================================
  showArtworkInspector(art, forceInspector = false) {
    if (art.isEmpty) {
      const isCreator = this.currentUser && this.currentUser.role && (this.currentUser.role.includes('สร้าง') || this.currentUser.role.includes('ครู'));
      if (isCreator) {
        this.openCreatorModal(art.boothNumber);
      } else {
        this.showToast(`ℹ️ บูธที่ ${art.boothNumber} ยังไม่มีผลงานจัดแสดง (รอนักเรียนกลุ่มผู้สร้างมาติดตั้งผลงานครับ)`);
      }
      return;
    }

    this.currentInspectedArt = art;

    // Trigger Visitor Avatar Reading Mode & Cinematic View
    if (this.app && this.app.player) {
      this.app.player.startReading(art);
    }

    // Project this exhibition artwork slides onto the Main Classroom Projector Screen!
    if (this.app && this.app.world && this.app.world.drawClassroomSlideForArtwork) {
      this.app.world.drawClassroomSlideForArtwork(art);
    }

    // 🚀 เมื่อคลิกหรือกด [E] หน้าบูธที่มีสไลด์นำเสนอ ให้เปิดจอทีวีแสดงสไลด์และข้อมูลได้ทันที!
    if (art.presentationFile && !forceInspector) {
      this.openDocViewer(art.presentationFile, art.title, art);
      return;
    }

    const room = this.app.exhibition.getCurrentRoomInfo();
    document.getElementById('artwork-modal-title').innerText = `${room.icon} ${art.title} (บูธที่ ${art.boothNumber})`;
    document.getElementById('artwork-modal-creator').innerText = `โดย: ${art.creator}`;
    document.getElementById('artwork-modal-class').innerText = `${art.schoolClass} • ${room.name}`;
    document.getElementById('artwork-modal-category').innerText = `📌 ${art.category}`;
    document.getElementById('artwork-modal-concept').innerText = art.concept;
    document.getElementById('artwork-modal-likes').innerText = `${art.likes || 0} ถูกใจ`;

    const likeBtn = document.getElementById('btn-artwork-like');
    if (likeBtn) likeBtn.innerHTML = `❤️ ถูกใจ (${art.likes || 0})`;

    // Check if current student already checked in
    const existingCheckin = (art.checkins || []).find(c =>
      (c.studentId && c.studentId !== '-' && c.studentId === this.currentUser.studentId) ||
      (c.studentName && c.studentName === this.currentUser.name)
    );

    const quizStatusBadge = document.getElementById('artwork-quiz-status-badge');
    const promptBox = document.getElementById('artwork-quiz-prompt-box');
    const container = document.getElementById('artwork-quiz-container');
    const resultBox = document.getElementById('artwork-quiz-result-box');

    if (container) container.style.display = 'none';
    if (resultBox) resultBox.style.display = 'none';

    if (existingCheckin && existingCheckin.passed) {
      if (quizStatusBadge) {
        quizStatusBadge.className = 'badge-booth badge-pass';
        quizStatusBadge.innerText = `✅ เช็คอินแล้ว (${existingCheckin.score}/5)`;
      }
      if (promptBox) {
        promptBox.style.display = 'block';
        promptBox.innerHTML = `
          <div style="font-size: 12px; color: #34d399; margin-bottom: 6px; line-height: 1.4;">
            ✅ <strong>คุณ (${this.currentUser.name}) เช็คอินบูธนี้เรียบร้อยแล้ว</strong> (ได้คะแนน ${existingCheckin.score}/5 ข้อ เมื่อ ${this.formatDateTime(existingCheckin.timestamp)})
          </div>
          <button id="btn-retest-quiz" class="btn btn-secondary btn-sm" style="width: 100%;">
            🔄 ทำแบบทดสอบทบทวนใหม่อีกครั้ง
          </button>
        `;
        const retestBtn = document.getElementById('btn-retest-quiz');
        if (retestBtn) {
          retestBtn.onclick = () => {
            promptBox.style.display = 'none';
            if (resultBox) resultBox.style.display = 'none';
            if (container) container.style.display = 'block';
            const vMsg = document.getElementById('quiz-validation-msg');
            if (vMsg) vMsg.style.display = 'none';
            this.renderActiveQuizQuestions(art);
          };
        }
      }
    } else {
      if (quizStatusBadge) {
        quizStatusBadge.className = 'badge-booth';
        quizStatusBadge.style.color = '#fbbf24';
        quizStatusBadge.style.borderColor = '#fbbf24';
        quizStatusBadge.innerText = 'ยังไม่ได้เช็คอิน';
      }
      if (promptBox) {
        promptBox.style.display = 'block';
        promptBox.innerHTML = `
          <p style="font-size: 12px; color: var(--text-muted); line-height: 1.5; margin-bottom: 8px;">
            เช็คอินเพื่อยืนยันว่าเข้ามาศึกษาในบูธนี้ โดยทำแบบทดสอบ 5 ข้อ ต้องตอบถูกอย่างน้อย <strong>3 จาก 5 ข้อ (≥ 60%)</strong> จึงจะถือว่าเช็คอินสำเร็จ
          </p>
          <button id="btn-start-booth-quiz" type="button" class="btn btn-primary btn-sm" style="width: 100%; padding: 9px 12px; font-weight: 700;">
            ✍️ เริ่มทำแบบทดสอบ 5 ข้อ เพื่อเช็คอินบูธนี้
          </button>
        `;
        const startBtn = document.getElementById('btn-start-booth-quiz');
        if (startBtn) {
          startBtn.onclick = () => {
            promptBox.style.display = 'none';
            if (resultBox) resultBox.style.display = 'none';
            if (container) container.style.display = 'block';
            const vMsg = document.getElementById('quiz-validation-msg');
            if (vMsg) vMsg.style.display = 'none';
            this.renderActiveQuizQuestions(art);
          };
        }
      }
    }

    // Presentation File Box (PPT / PDF)
    const presBox = document.getElementById('artwork-modal-presentation-box');
    if (presBox) {
      if (art.presentationFile) {
        presBox.style.display = 'block';
        const isPPT = art.presentationFile.type === 'ppt' || (art.presentationFile.name && (art.presentationFile.name.endsWith('.ppt') || art.presentationFile.name.endsWith('.pptx')));
        const isImg = art.presentationFile.type === 'image' || (art.presentationFile.name && /\.(jpe?g|png|webp)$/i.test(art.presentationFile.name));
        document.getElementById('artwork-modal-file-icon').innerText = isPPT ? '📊' : (isImg ? '🖼️' : '📄');
        document.getElementById('artwork-modal-file-name').innerText = art.presentationFile.name || 'ไฟล์นำเสนอผลงาน';
        
        const badge = document.getElementById('artwork-modal-file-badge');
        if (badge) {
          badge.className = `file-badge-pill ${isPPT ? 'file-badge-ppt' : (isImg ? 'file-badge-ppt' : 'file-badge-pdf')}`;
          badge.innerText = isPPT ? 'PowerPoint (PPT)' : (isImg ? 'ภาพสไลด์ 16:9' : 'PDF Document');
        }
        document.getElementById('artwork-modal-file-size').innerText = art.presentationFile.size || '';

        const viewBtn = document.getElementById('btn-view-presentation');
        if (viewBtn) {
          viewBtn.onclick = () => {
            this.openDocViewer(art.presentationFile, art.title, art);
          };
        }

        const dlBtn = document.getElementById('btn-download-presentation');
        if (dlBtn) {
          dlBtn.onclick = () => {
            this.downloadPresentationFile(art.presentationFile);
          };
        }
      } else {
        presBox.style.display = 'none';
      }
    }

    const editBtn = document.getElementById('btn-artwork-edit');
    if (editBtn) {
      const canEdit = this.currentUser && this.currentUser.role && (this.currentUser.role.includes('สร้าง') || this.currentUser.role.includes('ครู'));
      editBtn.style.display = canEdit ? 'inline-flex' : 'none';
      editBtn.onclick = () => {
        this.closeModal('artwork-inspector-modal');
        this.openCreatorModal(art.boothNumber);
      };
    }

    this.openModal('artwork-inspector-modal');
  }

  // =========================================================================
  // DOCUMENT & PRESENTATION SLIDE VIEWER (PDF / PPT)
  // =========================================================================
  initDocViewerModal() {
    const prevBtn = document.getElementById('btn-tv-prev-slide');
    const nextBtn = document.getElementById('btn-tv-next-slide');
    const fsBtn = document.getElementById('btn-tv-fullscreen');
    const dlBtn = document.getElementById('btn-doc-download');
    const fallbackDlBtn = document.getElementById('btn-fallback-download');
    const openTabBtn = document.getElementById('btn-tv-open-tab');
    const docOpenTabBtn = document.getElementById('btn-doc-open-tab');
    const screenBox = document.getElementById('tv-screen-box');
    const audioTopBtn = document.getElementById('btn-tv-audio-top');
    const audioBottomBtn = document.getElementById('btn-tv-audio-bottom');

    const quizTopBtn = document.getElementById('btn-tv-quiz-top');
    const quizBottomBtn = document.getElementById('btn-tv-quiz-bottom');
    const likeTopBtn = document.getElementById('btn-tv-like-top');
    const likeBottomBtn = document.getElementById('btn-tv-like-bottom');
    const infoTopBtn = document.getElementById('btn-tv-info-top');

    if (prevBtn) prevBtn.addEventListener('click', () => this.prevTvSlide());
    if (nextBtn) nextBtn.addEventListener('click', () => this.nextTvSlide());
    if (audioTopBtn) audioTopBtn.addEventListener('click', () => this.toggleTvAudioGuide());
    if (audioBottomBtn) audioBottomBtn.addEventListener('click', () => this.toggleTvAudioGuide());

    if (quizTopBtn) quizTopBtn.addEventListener('click', () => this.openQuizFromTvViewer());
    if (quizBottomBtn) quizBottomBtn.addEventListener('click', () => this.openQuizFromTvViewer());
    if (likeTopBtn) likeTopBtn.addEventListener('click', () => this.likeFromTvViewer());
    if (likeBottomBtn) likeBottomBtn.addEventListener('click', () => this.likeFromTvViewer());
    if (infoTopBtn) infoTopBtn.addEventListener('click', () => this.openInfoFromTvViewer());

    if (fsBtn) {
      fsBtn.addEventListener('click', () => {
        const modalBox = document.querySelector('#doc-viewer-modal .modal-box');
        if (!document.fullscreenElement) {
          if (modalBox && modalBox.requestFullscreen) {
            modalBox.requestFullscreen().catch(() => {});
          } else if (modalBox && modalBox.webkitRequestFullscreen) {
            modalBox.webkitRequestFullscreen();
          }
          if (modalBox) modalBox.classList.add('tv-fullscreen-mode');
          fsBtn.innerText = '🗗 ย่อจอ';
        } else {
          if (document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
          } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
          }
          if (modalBox) modalBox.classList.remove('tv-fullscreen-mode');
          fsBtn.innerText = '⛶ เต็มจอ';
        }
      });
    }

    const openInTab = () => {
      if (!this.currentViewingDoc) return;
      const url = this.currentViewingDoc.downloadUrl || this.currentViewingDoc.dataUrl;
      if (url) {
        window.open(url, '_blank');
      }
    };
    if (openTabBtn) openTabBtn.addEventListener('click', openInTab);
    if (docOpenTabBtn) docOpenTabBtn.addEventListener('click', openInTab);

    const downloadDoc = () => {
      if (this.currentViewingDoc) {
        this.downloadPresentationFile(this.currentViewingDoc);
      }
    };
    if (dlBtn) dlBtn.addEventListener('click', downloadDoc);
    if (fallbackDlBtn) fallbackDlBtn.addEventListener('click', downloadDoc);

    // Keyboard navigation when modal is open
    window.addEventListener('keydown', (e) => {
      const modal = document.getElementById('doc-viewer-modal');
      if (!modal || (!modal.classList.contains('show') && !modal.classList.contains('active'))) return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
        this.prevTvSlide();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        this.nextTvSlide();
      }
    });

    // Mobile / iPad Touch Swipe navigation
    if (screenBox) {
      let touchStartX = 0;
      let touchStartY = 0;
      screenBox.addEventListener('touchstart', (e) => {
        if (e.touches && e.touches[0]) {
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
        }
      }, { passive: true });

      screenBox.addEventListener('touchend', (e) => {
        if (e.changedTouches && e.changedTouches[0]) {
          const deltaX = e.changedTouches[0].clientX - touchStartX;
          const deltaY = e.changedTouches[0].clientY - touchStartY;
          if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX < 0) {
              this.nextTvSlide();
            } else {
              this.prevTvSlide();
            }
          }
        }
      }, { passive: true });
    }
  }

  openCommentForCurrentBooth() {
    if (!this.currentInspectedArt) return;
    const art = this.currentInspectedArt;
    const input = document.getElementById('sticky-input-text');
    if (input) {
      input.value = `[บูธที่ ${art.boothNumber}: ${art.title}] ชื่นชมผลงาน: `;
      input.focus();
    }
    this.closeModal('artwork-inspector-modal');
    this.openModal('sticky-modal');
  }

  openQuizFromTvViewer() {
    const art = this.currentViewingArt || this.currentInspectedArt;
    if (!art) return;
    this.closeModal('doc-viewer-modal');
    this.showArtworkInspector(art, true);
    setTimeout(() => {
      const startBtn = document.getElementById('btn-start-booth-quiz');
      const retestBtn = document.getElementById('btn-retest-quiz');
      if (startBtn && startBtn.offsetParent !== null) {
        startBtn.click();
      } else if (retestBtn && retestBtn.offsetParent !== null) {
        retestBtn.click();
      }
    }, 100);
  }

  likeFromTvViewer() {
    const art = this.currentViewingArt || this.currentInspectedArt;
    if (!art || !this.app.exhibition) return;
    const newLikes = this.app.exhibition.likeArtwork(art.id, this.currentUser);
    art.likes = newLikes;
    const likeTop = document.getElementById('btn-tv-like-top');
    const likeBottom = document.getElementById('btn-tv-like-bottom');
    if (likeTop) likeTop.innerHTML = `❤️ ถูกใจ (${newLikes})`;
    if (likeBottom) likeBottom.innerHTML = `❤️ ถูกใจ (${newLikes})`;
    const likeModalBtn = document.getElementById('btn-artwork-like');
    if (likeModalBtn) likeModalBtn.innerHTML = `❤️ ถูกใจ (${newLikes})`;
    const likesEl = document.getElementById('artwork-modal-likes');
    if (likesEl) likesEl.innerText = `${newLikes} ถูกใจ`;
    this.playChime('reaction');
    this.showToast(`❤️ กดถูกใจให้ผลงาน "${art.title}" เรียบร้อยแล้ว (${newLikes} ถูกใจ)`);
  }

  openInfoFromTvViewer() {
    const art = this.currentViewingArt || this.currentInspectedArt;
    if (!art) return;
    this.closeModal('doc-viewer-modal');
    this.showArtworkInspector(art, true);
  }

  openDocViewer(file, title = 'เอกสารนำเสนอผลงาน', art = null) {
    if (!file) return;
    this.currentViewingDoc = file;
    this.currentViewingArt = art || this.currentInspectedArt;
    this.isTvAudioPlaying = false;
    this.updateTvAudioButtonsState(false);

    const effectiveArt = art || this.currentInspectedArt;
    const likeCount = (effectiveArt && effectiveArt.likes) || 0;
    const likeTop = document.getElementById('btn-tv-like-top');
    const likeBottom = document.getElementById('btn-tv-like-bottom');
    if (likeTop) likeTop.innerHTML = `❤️ ถูกใจ (${likeCount})`;
    if (likeBottom) likeBottom.innerHTML = `❤️ ถูกใจ (${likeCount})`;

    let fileUrl = file.downloadUrl || file.dataUrl;
    if (fileUrl && (fileUrl.startsWith('/api/presentation') || (!fileUrl.includes('/') && !fileUrl.startsWith('data:')))) {
      const roomMatch = fileUrl.match(/[?&]room=(\d+)/);
      const boothMatch = fileUrl.match(/[?&]booth=(\d+)/);
      const r = (roomMatch && roomMatch[1]) || (effectiveArt && effectiveArt.roomId) || '1';
      const b = (boothMatch && boothMatch[1]) || (effectiveArt && effectiveArt.boothNumber) || '1';
      fileUrl = `data/uploads/pres_r${r}_b${b}.pdf`;
    }
    const isPPT = file.type === 'ppt' || (file.name && (file.name.endsWith('.ppt') || file.name.endsWith('.pptx')));
    const isPDF = file.type === 'pdf' || (file.name && file.name.endsWith('.pdf')) || (fileUrl && (fileUrl.startsWith('data:application/pdf') || fileUrl.includes('.pdf')));
    const isImg = file.type === 'image' || (file.name && /\.(jpe?g|png|webp)$/i.test(file.name)) || (fileUrl && fileUrl.startsWith('data:image/'));

    const titleEl = document.getElementById('doc-viewer-title');
    if (titleEl) titleEl.innerText = file.name || title;

    const subEl = document.getElementById('doc-viewer-subtitle');
    if (subEl) subEl.innerText = `หัวข้อ: ${title} • ขนาด: ${file.size || '16:9 HD'}`;

    const canvas = document.getElementById('tv-canvas');
    const imgSlide = document.getElementById('tv-img-slide');
    const iframe = document.getElementById('doc-viewer-iframe');
    const fallback = document.getElementById('doc-viewer-fallback');
    const loader = document.getElementById('tv-loader');
    const navGroup = document.getElementById('tv-nav-group');

    // Reset views
    if (canvas) canvas.style.display = 'none';
    if (imgSlide) imgSlide.style.display = 'none';
    if (iframe) {
      iframe.style.display = 'none';
      iframe.src = '';
    }
    if (fallback) fallback.style.display = 'none';
    if (loader) loader.style.display = 'none';

    this.tvPdfDoc = null;
    this.tvCurrentPage = 1;
    this.tvTotalPages = 1;

    if (isImg) {
      // 1. Image Presentation Mode
      if (imgSlide) {
        imgSlide.src = fileUrl;
        imgSlide.style.display = 'block';
      }
      if (loader) loader.style.display = 'none';
      if (navGroup) navGroup.style.opacity = '0.5';
      const curP = document.getElementById('tv-current-page');
      const totP = document.getElementById('tv-total-pages');
      if (curP) curP.innerText = '1';
      if (totP) totP.innerText = '1';
      this.updateTvPageControls();
    } else if (isPDF) {
      // 2. PDF Presentation Mode: Directly render Page 1 on tv-canvas and enable page switching immediately!
      if (navGroup) navGroup.style.opacity = '1';

      const fullUrl = fileUrl ? (fileUrl.startsWith('http') || fileUrl.startsWith('data:') || fileUrl.startsWith('blob:') ? fileUrl : new URL(fileUrl, window.location.href).href) : null;

      if (!window._pdfDocCache) window._pdfDocCache = new Map();

      // Instant 0ms cache hit
      if (fullUrl && window._pdfDocCache.has(fullUrl)) {
        if (loader) loader.style.display = 'none';
        const cachedPdf = window._pdfDocCache.get(fullUrl);
        this.tvPdfDoc = cachedPdf;
        this.tvTotalPages = cachedPdf.numPages || 1;
        this.tvCurrentPage = 1;
        this.renderTvPdfPage(1);
      } else if (window.pdfjsLib && fullUrl) {
        if (loader) loader.style.display = 'flex';
        try {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
        } catch (e) {}

        window.pdfjsLib.getDocument({
          url: fullUrl,
          withCredentials: false,
          disableRange: true, // Crucial: downloads in 1 fast continuous stream instead of 170+ sequential range round-trips!
          disableStream: false,
          disableAutoFetch: false
        }).promise.then((pdf) => {
          window._pdfDocCache.set(fullUrl, pdf);
          this.tvPdfDoc = pdf;
          this.tvTotalPages = pdf.numPages || 1;
          this.tvCurrentPage = 1;
          this.renderTvPdfPage(1);
        }).catch((err) => {
          console.warn('PDF.js render error:', err);
          if (loader) loader.style.display = 'none';
          this.fallbackTvViewer(fileUrl);
        });
      } else {
        if (loader) loader.style.display = 'none';
        this.fallbackTvViewer(fileUrl);
      }

    } else if (isPPT) {
      // 3. PPT Presentation Mode
      if (loader) loader.style.display = 'none';
      if (navGroup) navGroup.style.opacity = '0.5';
      if (fallback) {
        fallback.style.display = 'flex';
        const nameEl = document.getElementById('doc-fallback-name');
        if (nameEl) nameEl.innerText = file.name || 'สไลด์นำเสนอ PowerPoint (PPT/PPTX)';
      }
    } else {
      if (loader) loader.style.display = 'none';
      this.fallbackTvViewer(fileUrl);
    }

    this.openModal('doc-viewer-modal');
  }

  preloadBoothPresentation(url) {
    if (!url || !window.pdfjsLib) return;
    if (!window._pdfDocCache) window._pdfDocCache = new Map();
    const fullUrl = url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:') ? url : new URL(url, window.location.href).href;
    if (window._pdfDocCache.has(fullUrl) || (window._pdfDocPreloading && window._pdfDocPreloading.has(fullUrl))) return;
    if (!window._pdfDocPreloading) window._pdfDocPreloading = new Set();
    window._pdfDocPreloading.add(fullUrl);

    try {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
    } catch (e) {}

    window.pdfjsLib.getDocument({
      url: fullUrl,
      withCredentials: false,
      disableRange: true,
      disableStream: false,
      disableAutoFetch: false
    }).promise.then(pdf => {
      window._pdfDocCache.set(fullUrl, pdf);
      console.log('⚡ Preloaded exhibition presentation into RAM cache:', fullUrl);
    }).catch(err => {
      console.warn('Preload presentation warning:', err);
    });
  }

  renderTvPdfPage(pageNum) {

    if (!this.tvPdfDoc) return;
    const pNum = Math.max(1, Math.min(pageNum, this.tvTotalPages));
    this.tvCurrentPage = pNum;

    const loader = document.getElementById('tv-loader');
    const canvas = document.getElementById('tv-canvas');
    const imgSlide = document.getElementById('tv-img-slide');
    if (loader && !imgSlide.getAttribute('src')) loader.style.display = 'flex';

    if (this.tvCurrentRenderTask) {
      try { this.tvCurrentRenderTask.cancel(); } catch (e) {}
      this.tvCurrentRenderTask = null;
    }

    this.tvPdfDoc.getPage(pNum).then((page) => {
      const screenBox = document.getElementById('tv-screen-box');
      const boxWidth = (screenBox && screenBox.clientWidth > 100) ? screenBox.clientWidth : (window.innerWidth > 768 ? 960 : window.innerWidth - 32);
      const dpr = Math.min(window.devicePixelRatio || 1.5, 2);
      const unscaledViewport = page.getViewport({ scale: 1 });
      const targetW = boxWidth * dpr;
      const scale = targetW / unscaledViewport.width;
      const viewport = page.getViewport({ scale: scale });

      if (canvas) {
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        const renderTask = page.render({
          canvasContext: ctx,
          viewport: viewport
        });
        this.tvCurrentRenderTask = renderTask;
        renderTask.promise.then(() => {
          this.tvCurrentRenderTask = null;
          if (loader) loader.style.display = 'none';
          canvas.style.display = 'block';
          if (imgSlide) imgSlide.style.display = 'none';
          this.updateTvPageControls();
        }).catch((err) => {
          if (err && err.name === 'RenderingCancelledException') return;
          if (loader) loader.style.display = 'none';
          canvas.style.display = 'block';
          if (imgSlide) imgSlide.style.display = 'none';
          this.updateTvPageControls();
        });
      }
    }).catch((err) => {
      console.warn('Error getting page:', err);
      if (loader) loader.style.display = 'none';
    });
  }

  prevTvSlide() {
    if (this.tvPdfDoc && this.tvCurrentPage > 1) {
      this.renderTvPdfPage(this.tvCurrentPage - 1);
    }
  }

  nextTvSlide() {
    if (this.tvPdfDoc && this.tvCurrentPage < this.tvTotalPages) {
      this.renderTvPdfPage(this.tvCurrentPage + 1);
    }
  }

  updateTvPageControls() {
    const curP = document.getElementById('tv-current-page');
    const totP = document.getElementById('tv-total-pages');
    const prevBtn = document.getElementById('btn-tv-prev-slide');
    const nextBtn = document.getElementById('btn-tv-next-slide');

    if (curP) curP.innerText = this.tvCurrentPage;
    if (totP) totP.innerText = this.tvTotalPages;

    if (prevBtn) {
      prevBtn.disabled = this.tvCurrentPage <= 1;
      prevBtn.style.opacity = this.tvCurrentPage <= 1 ? '0.4' : '1';
    }
    if (nextBtn) {
      nextBtn.disabled = this.tvCurrentPage >= this.tvTotalPages;
      nextBtn.style.opacity = this.tvCurrentPage >= this.tvTotalPages ? '0.4' : '1';
    }

    const subEl = document.getElementById('doc-viewer-subtitle');
    if (subEl && this.currentViewingDoc) {
      subEl.innerText = `หน้า ${this.tvCurrentPage} จาก ${this.tvTotalPages} • จอทีวี 16:9 คมชัด 100% (${this.currentViewingDoc.name || 'เอกสารนำเสนอ'})`;
    }
  }

  fallbackTvViewer(fileUrl) {
    const loader = document.getElementById('tv-loader');
    const iframe = document.getElementById('doc-viewer-iframe');
    const fallback = document.getElementById('doc-viewer-fallback');
    const imgSlide = document.getElementById('tv-img-slide');
    if (loader) loader.style.display = 'none';

    const effectiveArt = this.currentViewingArt || this.currentInspectedArt;
    let coverUrl = (this.currentViewingDoc && this.currentViewingDoc.coverUrl) || (effectiveArt && (effectiveArt.coverImageUrl || (effectiveArt.presentationFile && effectiveArt.presentationFile.coverUrl)));
    if (!coverUrl && effectiveArt) {
      coverUrl = `data/uploads/cover_r${effectiveArt.roomId || '1'}_b${effectiveArt.boothNumber || '1'}.jpg`;
    }
    if (coverUrl && coverUrl.startsWith('/api/cover')) {
      const roomMatch = coverUrl.match(/[?&]room=(\d+)/);
      const boothMatch = coverUrl.match(/[?&]booth=(\d+)/);
      const r = (roomMatch && roomMatch[1]) || (effectiveArt && effectiveArt.roomId) || '1';
      const b = (boothMatch && boothMatch[1]) || (effectiveArt && effectiveArt.boothNumber) || '1';
      coverUrl = `data/uploads/cover_r${r}_b${b}.jpg`;
    }

    if (coverUrl && imgSlide) {
      imgSlide.src = coverUrl;
      imgSlide.style.display = 'block';
      return;
    }

    if (fileUrl) {
      const fullUrl = fileUrl.startsWith('http') || fileUrl.startsWith('blob:') || fileUrl.startsWith('data:') ? fileUrl : new URL(fileUrl, window.location.href).href;
      if (iframe) {
        iframe.src = fullUrl;
        iframe.style.display = 'block';
        return;
      }
    }

    if (fallback) fallback.style.display = 'flex';
  }

  toggleTvAudioGuide() {
    if (!('speechSynthesis' in window)) {
      this.showToast('⚠️ เบราว์เซอร์นี้ไม่รองรับระบบสังเคราะห์เสียงพูด (Speech Synthesis)');
      return;
    }

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      this.isTvAudioPlaying = false;
      this.updateTvAudioButtonsState(false);
      this.showToast('⏸️ หยุดเสียงบรรยายแล้ว');
      return;
    }

    // Determine narration text from current viewed booth
    const art = this.currentViewingArt || this.currentInspectedArt;
    let text = (art && (art.audioText || art.concept)) || '';
    if (!text && this.currentViewingDoc) {
      text = `เอกสารนำเสนอ ${this.currentViewingDoc.name || 'สไลด์ประกอบนิทรรศการ'}`;
    }
    if (!text) {
      text = 'ขอต้อนรับเข้าสู่นิทรรศการเรียนรู้ 5 ศาสนาสากลครับ';
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'th-TH';
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        this.isTvAudioPlaying = true;
        this.updateTvAudioButtonsState(true);
        this.showToast('🔊 กำลังเล่นเสียงบรรยายประกอบสไลด์...');
      };

      utterance.onend = () => {
        this.isTvAudioPlaying = false;
        this.updateTvAudioButtonsState(false);
      };

      utterance.onerror = () => {
        this.isTvAudioPlaying = false;
        this.updateTvAudioButtonsState(false);
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
      this.isTvAudioPlaying = false;
      this.updateTvAudioButtonsState(false);
    }
  }

  updateTvAudioButtonsState(isPlaying) {
    const btns = [
      document.getElementById('btn-tv-audio-top'),
      document.getElementById('btn-tv-audio-bottom')
    ];

    btns.forEach(btn => {
      if (!btn) return;
      if (isPlaying) {
        btn.classList.add('playing');
        btn.innerHTML = '⏹️ หยุดเสียงบรรยาย';
      } else {
        btn.classList.remove('playing');
        btn.innerHTML = btn.id === 'btn-tv-audio-bottom' ? '🔊 ฟังเสียงบรรยาย (Audio Guide)' : '🔊 ฟังเสียงบรรยาย';
      }
    });
  }

  downloadPresentationFile(file) {
    if (!file) return;
    let targetUrl = file.downloadUrl || file.dataUrl;
    if (targetUrl && (targetUrl.startsWith('/api/presentation') || (!targetUrl.includes('/') && !targetUrl.startsWith('data:')))) {
      const roomMatch = targetUrl.match(/[?&]room=(\d+)/);
      const boothMatch = targetUrl.match(/[?&]booth=(\d+)/);
      const r = (roomMatch && roomMatch[1]) || '1';
      const b = (boothMatch && boothMatch[1]) || '1';
      targetUrl = `data/uploads/pres_r${r}_b${b}.pdf`;
    }
    if (!targetUrl) return;

    if (file.isUrl && !targetUrl.startsWith('data:')) {
      window.open(targetUrl, '_blank');
      return;
    }

    const a = document.createElement('a');
    a.href = targetUrl;
    a.download = file.name || 'presentation_file.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    this.playChime('info');
    this.showToast(`กำลังดาวน์โหลด: ${file.name}`);
  }

  formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  // =========================================================================
  // STICKY NOTES & SCREEN SHARE
  // =========================================================================
  initStickyModal() {
    let selectedColor = '#fef08a';
    document.querySelectorAll('.sticky-color-swatch').forEach(swatch => {
      swatch.addEventListener('click', () => {
        selectedColor = swatch.dataset.color;
        document.querySelectorAll('.sticky-color-swatch').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        document.getElementById('sticky-preview-box').style.backgroundColor = selectedColor;
      });
    });

    const stickyForm = document.getElementById('sticky-form');
    if (stickyForm) {
      stickyForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = document.getElementById('sticky-input-text').value.trim();
        const author = this.app.player ? this.app.player.name : 'นักเรียน';

        if (text && this.app.stickyNotes) {
          const room = this.app.exhibition.getCurrentRoomInfo();
          this.app.stickyNotes.addNote(
            `[${room.icon} ${room.name}] ${text}`,
            author,
            selectedColor,
            this.app.player.position,
            this.currentUser
          );
          this.playChime('reaction');
          this.showToast('แปะแผ่นบันทึกข้อความ (Sticky Note) ลงในห้องนิทรรศการแล้ว!');
          document.getElementById('sticky-input-text').value = '';
        }
        this.closeModal('sticky-modal');
      });
    }
  }

  initScreenShareModal() {
    const startBtn = document.getElementById('btn-start-share');
    const stopBtn = document.getElementById('btn-stop-share');
    const nextSlideBtn = document.getElementById('btn-next-slide');
    const prevSlideBtn = document.getElementById('btn-prev-slide');

    if (startBtn) {
      startBtn.addEventListener('click', async () => {
        if (this.app.screenShare) {
          const success = await this.app.screenShare.startScreenShare();
          if (success) {
            startBtn.style.display = 'none';
            stopBtn.style.display = 'inline-flex';
            this.showToast('กำลังแชร์หน้าจอขึ้นจอใหญ่ในหอประชุม!');
          }
        }
      });
    }

    if (stopBtn) {
      stopBtn.addEventListener('click', () => {
        if (this.app.screenShare) {
          this.app.screenShare.stopScreenShare();
          startBtn.style.display = 'inline-flex';
          stopBtn.style.display = 'none';
          this.showToast('หยุดการแชร์หน้าจอแล้ว');
        }
      });
    }

    if (nextSlideBtn) {
      nextSlideBtn.addEventListener('click', () => {
        if (this.app.screenShare) this.app.screenShare.nextSlide();
      });
    }

    if (prevSlideBtn) {
      prevSlideBtn.addEventListener('click', () => {
        if (this.app.screenShare) this.app.screenShare.prevSlide();
      });
    }
  }

  initWebcamModal() {
    const video = document.getElementById('camera-video');
    const canvas = document.getElementById('camera-canvas');
    const startCamBtn = document.getElementById('btn-start-camera');
    const snapBtn = document.getElementById('btn-capture-camera');
    const uploadBtn = document.getElementById('btn-upload-avatar-file');
    const fileInput = document.getElementById('avatar-file-input');

    const processFaceImage = (sourceImageOrVideo, isMirrored = false) => {
      if (!canvas) return;
      const targetSize = 256;
      canvas.width = targetSize;
      canvas.height = targetSize;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, targetSize, targetSize);

      const sw = sourceImageOrVideo.videoWidth || sourceImageOrVideo.naturalWidth || sourceImageOrVideo.width || targetSize;
      const sh = sourceImageOrVideo.videoHeight || sourceImageOrVideo.naturalHeight || sourceImageOrVideo.height || targetSize;
      const minDim = Math.min(sw, sh);
      const sx = (sw - minDim) / 2;
      const sy = (sh - minDim) / 2;

      ctx.save();
      if (isMirrored) {
        ctx.translate(targetSize, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(sourceImageOrVideo, sx, sy, minDim, minDim, 0, 0, targetSize, targetSize);
      ctx.restore();

      const faceDataUrl = canvas.toDataURL('image/jpeg', 0.82);

      // 1. Apply to local avatar (head & nameplate)
      if (this.app.player) {
        this.app.player.applyWebcamFaceTexture(canvas);
      }

      // 2. Broadcast to all peers in multiplayer (MQTT + HTTP heartbeat)
      if (this.app.multiplayer) {
        this.app.multiplayer.broadcastFace(faceDataUrl);
      }

      // 3. Update UI mini avatar badge
      const miniAvatar = document.getElementById('user-avatar-mini-img');
      if (miniAvatar) {
        miniAvatar.src = faceDataUrl;
        miniAvatar.style.display = 'block';
      }

      if (video) video.style.display = 'none';
      canvas.style.display = 'block';

      this.showToast('✅ สแกนใบหน้าและใส่ให้กับ Avatar พร้อมแชร์ให้ทุกคนเห็นเรียบร้อยแล้ว!');
    };

    if (startCamBtn && video) {
      startCamBtn.addEventListener('click', async () => {
        try {
          this.webcamStream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 640 }, facingMode: 'user' }
          });
          video.srcObject = this.webcamStream;
          video.style.display = 'block';
          if (canvas) canvas.style.display = 'none';
          if (snapBtn) snapBtn.disabled = false;
        } catch (err) {
          alert('ไม่สามารถเปิดกล้องได้: ' + err.message);
        }
      });
    }

    if (snapBtn && video && canvas) {
      snapBtn.addEventListener('click', () => {
        this.playShutterSound();
        processFaceImage(video, true); // mirror selfie camera
        if (this.webcamStream) {
          try {
            this.webcamStream.getTracks().forEach(t => t.stop());
            this.webcamStream = null;
          } catch (e) {}
        }
      });
    }

    if (uploadBtn && fileInput) {
      uploadBtn.addEventListener('click', () => {
        fileInput.click();
      });

      fileInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
          const img = new Image();
          img.onload = () => {
            processFaceImage(img, false);
          };
          img.src = evt.target.result;
        };
        reader.readAsDataURL(file);
      });
    }

    document.querySelectorAll('.shirt-color-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const color = btn.dataset.color;
        if (this.app.player) this.app.player.setShirtColor(color);
        if (this.app.multiplayer) this.app.multiplayer.sendHttpHeartbeat();
        document.querySelectorAll('.shirt-color-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
    });
  }

  // =========================================================================
  // ON-SCREEN D-PAD CONTROLS (WALK BUTTONS)
  // =========================================================================
  initOnScreenControls() {
    const bindBtn = (id, keyName) => {
      const btn = document.getElementById(id);
      if (!btn) return;

      const start = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        if (this.app.player) this.app.player.keys[keyName] = true;
      };
      const end = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        if (this.app.player) this.app.player.keys[keyName] = false;
      };

      btn.addEventListener('mousedown', start);
      btn.addEventListener('mouseup', end);
      btn.addEventListener('mouseleave', end);
      btn.addEventListener('touchstart', start, { passive: false });
      btn.addEventListener('touchend', end, { passive: false });
      btn.addEventListener('touchcancel', end, { passive: false });
    };

    bindBtn('dpad-up', 'forward');
    bindBtn('dpad-down', 'backward');
    bindBtn('dpad-left', 'left');
    bindBtn('dpad-right', 'right');

    const jumpBtn = document.getElementById('dpad-jump');
    if (jumpBtn) {
      const doJump = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        if (this.app.player && this.app.player.isGrounded) {
          this.app.player.velocity.y = this.app.player.jumpForce;
          this.app.player.isGrounded = false;
        }
      };
      jumpBtn.addEventListener('click', doJump);
      jumpBtn.addEventListener('touchstart', doJump, { passive: false });
    }
  }

  // =========================================================================
  // CHAT & REACTIONS
  // =========================================================================
  initChat() {
    const toggleBtn = document.getElementById('btn-chat');
    const drawer = document.getElementById('chat-drawer');
    const closeBtn = document.getElementById('chat-close-btn');
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send-btn');

    if (toggleBtn && drawer) {
      toggleBtn.addEventListener('click', () => {
        drawer.classList.toggle('open');
        if (drawer.classList.contains('open') && input) input.focus();
      });
    }

    if (closeBtn && drawer) {
      closeBtn.addEventListener('click', () => drawer.classList.remove('open'));
    }

    const sendMsg = () => {
      const text = input.value.trim();
      if (!text) return;

      const name = this.app.player ? this.app.player.name : 'ฉัน';
      const role = this.app.player ? this.app.player.role : 'นักเรียน';

      this.addChatMessage(name, text, true, role);
      if (this.app.player) this.app.player.showSpeech(text);
      if (this.app.multiplayer) this.app.multiplayer.broadcastChat(text);

      input.value = '';
    };

    if (sendBtn) sendBtn.addEventListener('click', sendMsg);
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendMsg();
      });
    }
  }

  addChatMessage(sender, text, isSelf, role) {
    const list = document.getElementById('chat-msg-list');
    if (!list) return;

    const div = document.createElement('div');
    div.className = `chat-msg ${isSelf ? 'self' : ''}`;

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    div.innerHTML = `
      <div class="sender">
        <span>${isSelf ? 'คุณ' : sender} [${role || 'นักเรียน'}]</span>
        <span class="time">${timeStr}</span>
      </div>
      <div>${this.escapeHTML(text)}</div>
    `;

    list.appendChild(div);
    list.scrollTop = list.scrollHeight;
  }

  initReactions() {
    document.querySelectorAll('.emoji-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const emoji = btn.dataset.emoji;
        this.playChime(emoji === '👏' ? 'applause' : 'reaction');

        if (this.app.player) {
          this.spawnReactionParticle(emoji, this.app.player.position);
          if (this.app.multiplayer) {
            this.app.multiplayer.broadcastReaction(emoji);
          }
        }
      });
    });
  }

  spawnReactionParticle(emoji, worldPos) {
    const particle = document.createElement('div');
    particle.className = 'floating-reaction';
    particle.innerText = emoji;

    const screenPos = this.worldToScreen(new THREE.Vector3(worldPos.x, worldPos.y + 2.5, worldPos.z));
    particle.style.left = `${screenPos.x}px`;
    particle.style.top = `${screenPos.y}px`;

    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 2000);
  }

  worldToScreen(pos) {
    const v = pos.clone().project(this.app.camera);
    const hw = window.innerWidth / 2;
    const hh = window.innerHeight / 2;
    return {
      x: (v.x * hw) + hw,
      y: -(v.y * hh) + hh
    };
  }

  initMinimap() {
    this.minimapCanvas = document.getElementById('minimap-canvas');
    if (this.minimapCanvas) {
      this.minimapCtx = this.minimapCanvas.getContext('2d');
    }
  }

  updateMinimap() {
    if (!this.minimapCtx || !this.app.player) return;
    const ctx = this.minimapCtx;
    const w = this.minimapCanvas.width;
    const h = this.minimapCanvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    const mapX = (x) => ((x + 40) / 80) * w;
    const mapZ = (z) => ((z + 40) / 80) * h;

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(mapX(-38), mapZ(-38), (76 / 80) * w, (76 / 80) * h);

    if (this.app.exhibition) {
      this.app.exhibition.artworks.forEach(art => {
        ctx.fillStyle = art.isEmpty ? '#64748b' : '#06b6d4';
        ctx.beginPath();
        ctx.arc(mapX(art.pos.x), mapZ(art.pos.z), 3.5, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    ctx.fillStyle = 'rgba(139, 92, 246, 0.25)';
    ctx.fillRect(mapX(-11), mapZ(16), (22 / 80) * w, (18 / 80) * h);

    if (this.app.multiplayer) {
      ctx.fillStyle = '#94a3b8';
      this.app.multiplayer.aiBots.forEach(b => {
        ctx.beginPath();
        ctx.arc(mapX(b.group.position.x), mapZ(b.group.position.z), 2, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    const px = mapX(this.app.player.position.x);
    const pz = mapZ(this.app.player.position.z);
    const yaw = this.app.player.cameraYaw;

    ctx.fillStyle = 'rgba(245, 158, 11, 0.35)';
    ctx.beginPath();
    ctx.moveTo(px, pz);
    ctx.arc(px, pz, 14, yaw - Math.PI / 4, yaw + Math.PI / 4);
    ctx.fill();

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(px, pz, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag] || tag));
  }

  showToast(message) {
    let toast = document.getElementById('system-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'system-toast';
      toast.style.cssText = `
        position: fixed;
        bottom: 90px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(15, 23, 42, 0.95);
        border: 1px solid rgba(56, 189, 248, 0.4);
        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        color: white;
        padding: 10px 22px;
        border-radius: 9999px;
        font-size: 13px;
        font-weight: 600;
        z-index: 9999;
        pointer-events: none;
        transition: opacity 0.3s, transform 0.3s;
      `;
      document.body.appendChild(toast);
    }
    toast.innerText = message;
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';

    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(10px)';
    }, 3500);
  }
}

window.SpatialUI = SpatialUI;
