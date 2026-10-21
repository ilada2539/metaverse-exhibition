/**
 * SPATIAL METAVERSE - TRUE REAL-TIME MULTIPLAYER MANAGER
 * Real-time cross-device synchronization over the Internet (Paho MQTT over WebSockets)
 * Connects iPhones, iPads, Android smartphones, and computers in real time.
 */

class MultiplayerManager {
  constructor(scene, player, world) {
    this.scene = scene;
    this.player = player;
    this.world = world;

    // Unique Client ID for this device session
    this.clientId = 'client_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
    this.currentRoomId = 1;
    this.remotePeers = new Map(); // id -> peer object

    // Broker Endpoints (High-reliability global WebSocket brokers)
    this.brokers = [
      { host: 'broker.emqx.io', port: 8084, path: '/mqtt', ssl: true },
      { host: 'broker.hivemq.com', port: 8884, path: '/mqtt', ssl: true }
    ];
    this.brokerIndex = 0;
    this.isConnected = false;
    this.mqttClient = null;
    this.reconnectTimer = null;

    // Voice Chat State
    this.isMicActive = false;
    this.mediaStream = null;
    this.mediaRecorder = null;

    // Init Network Layers
    this.initLocalBroadcast();
    this.initMqttOnline();
    this.setupWindowUnload();

    // Broadcast self movement & presence periodically (~16 ticks/sec)
    this.broadcastTimer = setInterval(() => {
      this.broadcastSelf();
    }, 60);

    // Dual-Layer Redundant Sync: Periodic HTTP Heartbeat (1.2 sec) to guarantee presence across all networks
    this.httpHeartbeatTimer = setInterval(() => {
      this.sendHttpHeartbeat();
    }, 1200);
  }

  // =========================================================================
  // 1. LOCAL BROADCAST CHANNEL (Tabs on same browser)
  // =========================================================================
  initLocalBroadcast() {
    if ('BroadcastChannel' in window) {
      try {
        this.localChannel = new BroadcastChannel('spatial_metaverse_channel');
        this.localChannel.onmessage = (e) => {
          this.handleNetworkData(e.data);
        };
      } catch (err) {
        console.warn('BroadcastChannel error:', err);
      }
    }
  }

  // =========================================================================
  // 2. TRUE INTERNET MULTIPLAYER (Paho MQTT over WebSockets)
  // =========================================================================
  initMqttOnline() {
    if (typeof Paho === 'undefined' || !Paho.MQTT || !Paho.MQTT.Client) {
      console.log('Waiting for Paho MQTT library to load...');
      setTimeout(() => this.initMqttOnline(), 300);
      return;
    }

    const broker = this.brokers[this.brokerIndex];
    console.log(`🌐 Connecting to real-time multiplayer broker: wss://${broker.host}:${broker.port}${broker.path}`);

    const mqttClientId = 'phattana_' + this.clientId;

    try {
      if (this.mqttClient) {
        try { this.mqttClient.disconnect(); } catch (e) {}
        this.mqttClient = null;
      }

      this.mqttClient = new Paho.MQTT.Client(broker.host, broker.port, broker.path, mqttClientId);

      this.mqttClient.onConnectionLost = (responseObject) => {
        console.warn(`MQTT Connection lost (${broker.host}):`, responseObject.errorMessage);
        this.isConnected = false;
        this.retryNextBroker();
      };

      this.mqttClient.onMessageArrived = (message) => {
        try {
          const data = JSON.parse(message.payloadString);
          this.handleNetworkData(data);
        } catch (e) {
          // ignore corrupted packet
        }
      };

      const connectOptions = {
        useSSL: broker.ssl,
        timeout: 5,
        keepAliveInterval: 45,
        cleanSession: true,
        onSuccess: () => {
          console.log(`✅ Connected to real-time multiplayer online! (${broker.host})`);
          this.isConnected = true;
          this.subscribeCurrentRoom();
          this.broadcastSelf();
        },
        onFailure: (err) => {
          console.warn(`MQTT connection failed to ${broker.host}:`, err);
          this.isConnected = false;
          this.retryNextBroker();
        }
      };

      this.mqttClient.connect(connectOptions);
    } catch (err) {
      console.warn('MQTT init error:', err);
      this.retryNextBroker();
    }
  }

  retryNextBroker() {
    if (this.reconnectTimer) return;
    this.brokerIndex = (this.brokerIndex + 1) % this.brokers.length;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.initMqttOnline();
    }, 2500);
  }

  subscribeCurrentRoom() {
    if (!this.mqttClient || !this.isConnected) return;
    try {
      const roomTopic = `pattananikom/metaverse/room_${this.currentRoomId}/#`;
      const globalTopic = `pattananikom/metaverse/room_all/#`;
      this.mqttClient.subscribe(roomTopic, { qos: 0 });
      this.mqttClient.subscribe(globalTopic, { qos: 0 });
      console.log(`📡 Subscribed to room ${this.currentRoomId} & global channel`);
    } catch (e) {
      console.warn('Subscription error:', e);
    }
  }

  // =========================================================================
  // 3. BROADCASTING OUTBOUND EVENTS
  // =========================================================================
  sendNetworkMessage(topicSuffix, payload) {
    // 1. Internet MQTT
    if (this.mqttClient && this.isConnected) {
      const topic = topicSuffix === 'leave'
        ? 'pattananikom/metaverse/room_all/leave'
        : `pattananikom/metaverse/room_${this.currentRoomId}/${topicSuffix}`;
      try {
        const msg = new Paho.MQTT.Message(JSON.stringify(payload));
        msg.destinationName = topic;
        msg.qos = 0;
        this.mqttClient.send(msg);
      } catch (e) {}
    }

    // 2. Local Tab Broadcast
    if (this.localChannel) {
      try {
        this.localChannel.postMessage(payload);
      } catch (e) {}
    }
  }

  broadcastSelf() {
    if (!this.player || !this.player.position) return;

    const isMoving = !!(
      this.player.keys.forward ||
      this.player.keys.backward ||
      this.player.keys.left ||
      this.player.keys.right ||
      (this.player.joystickVector && (this.player.joystickVector.x !== 0 || this.player.joystickVector.y !== 0))
    );

    const payload = {
      type: 'peer_update',
      id: this.clientId,
      name: this.player.name || 'ผู้เยี่ยมชม',
      role: this.player.role || 'นักเรียน',
      shirtColor: this.player.shirtColor || '#06b6d4',
      faceUrl: this.player.faceDataUrl || null,
      pos: {
        x: Math.round(this.player.position.x * 100) / 100,
        y: Math.round(this.player.position.y * 100) / 100,
        z: Math.round(this.player.position.z * 100) / 100
      },
      rotY: Math.round(this.player.avatarGroup.rotation.y * 100) / 100,
      isMoving: isMoving,
      room: this.currentRoomId
    };

    this.sendNetworkMessage('pos', payload);
  }

  broadcastFace(faceUrl) {
    if (!this.player) return;
    this.player.faceDataUrl = faceUrl;
    const payload = {
      type: 'peer_face',
      id: this.clientId,
      name: this.player.name || 'ผู้เข้าชม',
      role: this.player.role || 'ผู้เข้าชมนิทรรศการ',
      shirtColor: this.player.shirtColor || '#0284c7',
      faceUrl: faceUrl,
      room: String(this.currentRoomId)
    };
    this.sendNetworkMessage('face', payload);
    this.sendHttpHeartbeat();
  }

  broadcastChat(text) {
    const payload = {
      type: 'peer_chat',
      id: this.clientId,
      sender: this.player.name || 'ผู้เยี่ยมชม',
      role: this.player.role || 'นักเรียน',
      text: text,
      room: this.currentRoomId
    };
    this.sendNetworkMessage('chat', payload);
  }

  broadcastReaction(emoji) {
    const payload = {
      type: 'peer_reaction',
      id: this.clientId,
      emoji: emoji,
      room: this.currentRoomId
    };
    this.sendNetworkMessage('reaction', payload);
  }

  broadcastLeave() {
    const payload = {
      type: 'peer_leave',
      id: this.clientId,
      room: this.currentRoomId
    };
    this.sendNetworkMessage('leave', payload);
  }

  async sendHttpHeartbeat() {
    if (!this.player || !this.player.position) return;
    try {
      const payload = {
        type: 'peer_update',
        id: this.clientId,
        name: this.player.name || 'ผู้เข้าชม',
        role: this.player.role || 'ผู้เข้าชมนิทรรศการ',
        shirtColor: this.player.shirtColor || '#0284c7',
        faceUrl: this.player.faceDataUrl || null,
        pos: {
          x: Math.round(this.player.position.x * 100) / 100,
          y: Math.round(this.player.position.y * 100) / 100,
          z: Math.round(this.player.position.z * 100) / 100
        },
        rotY: Math.round(this.player.avatarGroup.rotation.y * 100) / 100,
        room: String(this.currentRoomId)
      };


      const resp = await fetch('/api/peers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (resp.ok) {
        const result = await resp.json();
        if (result && result.success && Array.isArray(result.peers)) {
          result.peers.forEach(peerData => {
            if (peerData.id !== this.clientId) {
              this.handleNetworkData(peerData);
            }
          });
        }
      }
    } catch (e) {}
  }

  broadcastBoothUpdate(roomId, boothNumber, artwork) {
    const payload = {
      type: 'booth_update',
      id: this.clientId,
      roomId: String(roomId),
      boothNumber: parseInt(boothNumber, 10),
      artwork: artwork,
      timestamp: Date.now()
    };
    this.sendNetworkMessage('booth_update', payload);
  }

  broadcastBoothReset(roomId, boothNumber) {
    const payload = {
      type: 'booth_reset',
      id: this.clientId,
      roomId: String(roomId),
      boothNumber: parseInt(boothNumber, 10),
      timestamp: Date.now()
    };
    this.sendNetworkMessage('booth_reset', payload);
  }

  broadcastBoothLike(roomId, boothId, likes) {
    const payload = {
      type: 'booth_like',
      id: this.clientId,
      roomId: String(roomId),
      boothId: boothId,
      likes: likes
    };
    this.sendNetworkMessage('booth_like', payload);
  }

  broadcastBoothCheckin(roomId, boothId, record) {
    const payload = {
      type: 'booth_checkin',
      id: this.clientId,
      roomId: String(roomId),
      boothId: boothId,
      record: record
    };
    this.sendNetworkMessage('booth_checkin', payload);
  }

  // =========================================================================
  // VOICE CHAT (REAL MICROPHONE AUDIO STREAMING)
  // =========================================================================
  async toggleVoiceChat() {
    if (this.isMicActive) {
      this.stopVoiceChat();
      return { active: false, message: 'ปิดไมโครโฟนเรียบร้อยแล้ว' };
    } else {
      return await this.startVoiceChat();
    }
  }

  async startVoiceChat() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return { active: false, error: 'เบราว์เซอร์นี้ไม่รองรับการเปิดไมโครโฟน' };
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      this.mediaStream = stream;
      this.isMicActive = true;

      // Detect supported mimeType
      let mimeType = '';
      const candidateTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/aac',
        'audio/ogg;codecs=opus'
      ];
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported) {
        for (const t of candidateTypes) {
          if (MediaRecorder.isTypeSupported(t)) {
            mimeType = t;
            break;
          }
        }
      }

      const options = mimeType ? { mimeType } : undefined;
      this.mediaRecorder = options ? new MediaRecorder(stream, options) : new MediaRecorder(stream);

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0 && this.isMicActive) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64Data = reader.result;
            if (base64Data) {
              this.sendNetworkMessage('voice', {
                type: 'peer_voice',
                id: this.clientId,
                room: this.currentRoomId,
                sender: (this.player && this.player.name) || 'เพื่อนในห้อง',
                audioData: base64Data,
                pos: this.player ? { x: this.player.position.x, y: this.player.position.y, z: this.player.position.z } : null
              });
            }
          };
          reader.readAsDataURL(e.data);
        }
      };

      // Emit slices every 350ms for low-latency live speech
      this.mediaRecorder.start(350);

      return { active: true, message: 'เปิดไมโครโฟนสำเร็จ กำลังถ่ายทอดสดเสียงของคุณในห้อง 3D นี้ 🎙️' };
    } catch (err) {
      console.warn('Microphone permission error:', err);
      this.isMicActive = false;
      return { active: false, error: 'กรุณากด "อนุญาต" (Allow) สิทธิ์การเข้าถึงไมโครโฟนบนเบราว์เซอร์' };
    }
  }

  stopVoiceChat() {
    this.isMicActive = false;
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch (e) {}
    }
    this.mediaRecorder = null;
    if (this.mediaStream) {
      try {
        this.mediaStream.getTracks().forEach(track => track.stop());
      } catch (e) {}
      this.mediaStream = null;
    }
  }

  setupWindowUnload() {
    window.addEventListener('beforeunload', () => {
      this.stopVoiceChat();
      this.broadcastLeave();
    });
  }

  // =========================================================================
  // 4. RECEIVING INBOUND EVENTS FROM PEERS
  // =========================================================================
  handleNetworkData(data) {
    if (!data || !data.id || data.id === this.clientId) return;

    // 1. Peer Leaving
    if (data.type === 'peer_leave') {
      const peer = this.remotePeers.get(data.id);
      if (peer) {
        this.scene.remove(peer.avatarGroup);
        this.remotePeers.delete(data.id);
      }
      return;
    }

    // 2. Real-Time Exhibition Booth Installed / Updated
    if (data.type === 'booth_update') {
      const exhibition = this.app ? this.app.exhibition : (window.app ? window.app.exhibition : null);
      if (exhibition && String(data.roomId) === String(exhibition.currentRoomId)) {
        const idx = data.boothNumber - 1;
        if (idx >= 0 && idx < exhibition.artworks.length && data.artwork) {
          exhibition.artworks[idx] = data.artwork;
          exhibition.saveExhibitionData();
          exhibition.refreshAllFrames();
          if (window.spatialUI) {
            window.spatialUI.renderVisitorBoothDirectory();
            window.spatialUI.showToast(`🎨 มีการติดตั้งผลงานในบูธที่ ${data.boothNumber}: "${data.artwork.title}"!`);
          }
        }
      }
      return;
    }

    // 3. Booth Reset
    if (data.type === 'booth_reset') {
      const exhibition = this.app ? this.app.exhibition : (window.app ? window.app.exhibition : null);
      if (exhibition && String(data.roomId) === String(exhibition.currentRoomId)) {
        const idx = data.boothNumber - 1;
        if (idx >= 0 && idx < exhibition.artworks.length) {
          exhibition.resetBooth(data.boothNumber);
          if (window.spatialUI) {
            window.spatialUI.renderVisitorBoothDirectory();
          }
        }
      }
      return;
    }

    // 4. Booth Like
    if (data.type === 'booth_like') {
      const exhibition = this.app ? this.app.exhibition : (window.app ? window.app.exhibition : null);
      if (exhibition && String(data.roomId) === String(exhibition.currentRoomId)) {
        const art = exhibition.artworks.find(a => a.id === data.boothId);
        if (art) {
          art.likes = data.likes;
          exhibition.refreshAllFrames();
          const likeBtn = document.getElementById('btn-artwork-like');
          if (likeBtn && window.spatialUI && window.spatialUI.currentInspectedArt && window.spatialUI.currentInspectedArt.id === data.boothId) {
            likeBtn.innerHTML = `❤️ ถูกใจ (${data.likes})`;
          }
        }
      }
      return;
    }

    // 5. Booth Check-in
    if (data.type === 'booth_checkin') {
      const exhibition = this.app ? this.app.exhibition : (window.app ? window.app.exhibition : null);
      if (exhibition && String(data.roomId) === String(exhibition.currentRoomId)) {
        const art = exhibition.artworks.find(a => a.id === data.boothId);
        if (art) {
          art.checkins = art.checkins || [];
          art.checkins.push(data.record);
        }
      }
      return;
    }

    // Room isolation: Ignore peers in other religion rooms
    if (data.room && data.room !== this.currentRoomId) {
      const peer = this.remotePeers.get(data.id);
      if (peer) {
        this.scene.remove(peer.avatarGroup);
        this.remotePeers.delete(data.id);
      }
      return;
    }

    // 6. Peer Movement & Presence Update
    if (data.type === 'peer_update') {
      if (!data.pos || typeof data.pos.x !== 'number') return;

      let peer = this.remotePeers.get(data.id);
      if (!peer) {
        peer = this.createRemoteAvatar(data);
        if (!peer) return;
        this.remotePeers.set(data.id, peer);
      }

      // Update position target and rotation for smooth lerping
      if (data.pos && peer.targetPos) {
        peer.targetPos.set(data.pos.x, data.pos.y, data.pos.z);
      }
      if (typeof data.rotY === 'number') {
        peer.targetRotY = data.rotY;
      }
      peer.isMoving = !!data.isMoving;
      peer.lastSeen = Date.now();

      // Update shirt color if changed
      if (data.shirtColor && peer.bodyMesh && peer.shirtColor !== data.shirtColor) {
        peer.shirtColor = data.shirtColor;
        peer.bodyMesh.material.color.set(data.shirtColor);
      }

      // Update face photo if provided
      if (data.faceUrl && peer.faceUrl !== data.faceUrl) {
        this.applyPeerFaceTexture(peer, data.faceUrl);
      }
    }
    // 6.5. Peer Face Photo Update Event
    else if (data.type === 'peer_face') {
      const peer = this.remotePeers.get(data.id);
      if (peer && data.faceUrl) {
        this.applyPeerFaceTexture(peer, data.faceUrl);
      }
    }
    // 7. Peer Chat Message

    else if (data.type === 'peer_chat') {
      const peer = this.remotePeers.get(data.id);
      if (peer) {
        this.showPeerSpeechBubble(peer, data.text);
      }
      if (window.spatialUI) {
        window.spatialUI.addChatMessage(data.sender, data.text, false, data.role);
      }
    }
    // 8. Peer Reaction Emoji
    else if (data.type === 'peer_reaction') {
      const peer = this.remotePeers.get(data.id);
      if (peer && window.spatialUI) {
        window.spatialUI.spawnReactionParticle(data.emoji, peer.avatarGroup.position);
      }
    }
    // 9. Peer Live Voice Audio Packet
    else if (data.type === 'peer_voice') {
      if (String(data.room) !== String(this.currentRoomId)) return;
      if (!data.audioData) return;

      const peer = this.remotePeers.get(data.id);
      let dist = 5;
      const peerPos = (peer && peer.avatarGroup) ? peer.avatarGroup.position : data.pos;
      if (this.player && this.player.position && peerPos) {
        const dx = this.player.position.x - peerPos.x;
        const dy = this.player.position.y - peerPos.y;
        const dz = this.player.position.z - peerPos.z;
        dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      }

      // Spatial volume falloff
      let volume = 1.0;
      if (dist <= 8) {
        volume = 1.0;
      } else if (dist <= 32) {
        volume = Math.max(0.08, 1.0 - (dist - 8) / 24);
      } else {
        volume = 0.0;
      }

      if (volume > 0) {
        try {
          const audio = new Audio(data.audioData);
          audio.volume = volume;
          audio.play().catch(() => {});
        } catch (e) {}
      }

      if (peer) {
        this.showPeerSpeaking(peer);
      }
    }
  }

  // =========================================================================
  // 5. RENDERING 3D REMOTE AVATAR
  // =========================================================================
  createRemoteAvatar(data) {
    try {
      const posX = (data.pos && typeof data.pos.x === 'number') ? data.pos.x : 0;
      const posY = (data.pos && typeof data.pos.y === 'number') ? data.pos.y : 0;
      const posZ = (data.pos && typeof data.pos.z === 'number') ? data.pos.z : 5;

      const group = new THREE.Group();
      group.position.set(posX, posY, posZ);

      const isTeacher = data.role && (data.role.includes('ครู') || data.role.includes('Teacher'));
      const isCreator = data.role && (data.role.includes('สร้าง') || data.role.includes('Creator'));
      let avatarShirt = data.shirtColor;
      if (!avatarShirt) {
        if (isTeacher) avatarShirt = '#7c3aed';
        else if (isCreator) avatarShirt = '#d97706';
        else avatarShirt = '#0284c7';
      }

      // 1. Torso
      const bodyGeo = new THREE.BoxGeometry(0.7, 0.9, 0.4);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(avatarShirt),
        roughness: 0.5
      });
      const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
      bodyMesh.position.y = 1.15;
      group.add(bodyMesh);

      // 2. Head with 6 materials (Face texture on Front +Z face)
      const skinMat = new THREE.MeshStandardMaterial({ color: 0xfcd34d, roughness: 0.6 });
      const frontMat = new THREE.MeshStandardMaterial({ color: 0xfcd34d, roughness: 0.6 });

      // Apply default cute stylized face
      if (!this.defaultFaceTexture) {
        const faceCanvas = document.createElement('canvas');
        faceCanvas.width = 256;
        faceCanvas.height = 256;
        const fctx = faceCanvas.getContext('2d');
        fctx.fillStyle = '#fcd34d';
        fctx.fillRect(0, 0, 256, 256);
        fctx.fillStyle = '#0f172a';
        fctx.beginPath();
        fctx.arc(80, 110, 16, 0, Math.PI * 2);
        fctx.arc(176, 110, 16, 0, Math.PI * 2);
        fctx.fill();
        fctx.fillStyle = '#ffffff';
        fctx.beginPath();
        fctx.arc(76, 106, 6, 0, Math.PI * 2);
        fctx.arc(172, 106, 6, 0, Math.PI * 2);
        fctx.fill();
        fctx.strokeStyle = '#92400e';
        fctx.lineWidth = 6;
        fctx.lineCap = 'round';
        fctx.beginPath();
        fctx.arc(128, 140, 32, 0.1 * Math.PI, 0.9 * Math.PI);
        fctx.stroke();
        this.defaultFaceTexture = new THREE.CanvasTexture(faceCanvas);
      }
      frontMat.map = this.defaultFaceTexture;

      const headMaterials = [
        skinMat.clone(), // 0: +X (Right)
        skinMat.clone(), // 1: -X (Left)
        skinMat.clone(), // 2: +Y (Top)
        skinMat.clone(), // 3: -Y (Bottom)
        frontMat,        // 4: +Z (Front Face)
        skinMat.clone()  // 5: -Z (Back)
      ];

      const headGeo = new THREE.BoxGeometry(0.55, 0.55, 0.55);
      const headMesh = new THREE.Mesh(headGeo, headMaterials);
      headMesh.position.y = 1.9;
      group.add(headMesh);

      // 3. Cap
      const capGeo = new THREE.BoxGeometry(0.58, 0.15, 0.58);
      const capMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
      const capMesh = new THREE.Mesh(capGeo, capMat);
      capMesh.position.y = 2.2;
      group.add(capMesh);

      // 4. Legs
      const legGeo = new THREE.BoxGeometry(0.25, 0.7, 0.25);
      const legMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
      const lLeg = new THREE.Mesh(legGeo, legMat);
      lLeg.position.set(-0.2, 0.35, 0);
      group.add(lLeg);

      const rLeg = new THREE.Mesh(legGeo, legMat);
      rLeg.position.set(0.2, 0.35, 0);
      group.add(rLeg);

      // 5. Arms
      const armGeo = new THREE.BoxGeometry(0.22, 0.7, 0.22);
      const armMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(avatarShirt) });
      const lArm = new THREE.Mesh(armGeo, armMat);
      lArm.position.set(-0.48, 1.15, 0);
      group.add(lArm);

      const rArm = new THREE.Mesh(armGeo, armMat);
      rArm.position.set(0.48, 1.15, 0);
      group.add(rArm);

      // 6. Nameplate Sprite
      const nameplateObj = this.createPeerNameplate(data.name, data.role, null);
      nameplateObj.sprite.position.y = 2.65;
      group.add(nameplateObj.sprite);

      // 7. Speech Bubble
      const speechObj = this.createPeerSpeechObject();
      speechObj.sprite.position.y = 3.35;
      group.add(speechObj.sprite);

      // 8. Voice Speaking Indicator Sprite
      const speakingObj = this.createPeerSpeakingIndicator();
      speakingObj.sprite.position.y = 3.9;
      group.add(speakingObj.sprite);

      this.scene.add(group);

      const peer = {
        id: data.id,
        name: data.name,
        role: data.role,
        avatarGroup: group,
        bodyMesh: bodyMesh,
        headMesh: headMesh,
        headMaterials: headMaterials,
        nameplateObj: nameplateObj,
        shirtColor: avatarShirt,
        faceUrl: null,
        faceImg: null,
        lLeg: lLeg,
        rLeg: rLeg,
        targetPos: new THREE.Vector3(posX, posY, posZ),
        targetRotY: data.rotY || 0,
        isMoving: false,
        walkCycle: 0,
        lastSeen: Date.now(),
        speechObj: speechObj,
        speakingObj: speakingObj
      };

      if (data.faceUrl) {
        this.applyPeerFaceTexture(peer, data.faceUrl);
      }

      return peer;
    } catch (e) {
      console.warn('Error creating remote avatar:', e);
      return null;
    }
  }

  createPeerNameplate(name, role, faceImg) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    this.renderPeerNameplateCanvas(canvas, ctx, name, role, faceImg);

    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(2.4, 0.6, 1);
    return { sprite, canvas, ctx, texture };
  }

  renderPeerNameplateCanvas(canvas, ctx, name, role, faceImg) {
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const isTeacher = role && (role.includes('ครู') || role.includes('Teacher'));
    const isCreator = role && (role.includes('สร้าง') || role.includes('Creator'));

    if (isTeacher) {
      ctx.fillStyle = 'rgba(88, 28, 135, 0.9)';
      ctx.strokeStyle = '#c084fc';
    } else if (isCreator) {
      ctx.fillStyle = 'rgba(120, 53, 15, 0.9)';
      ctx.strokeStyle = '#f59e0b';
    } else {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = '#38bdf8';
    }

    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(16, 16, 480, 96, 28);
    } else {
      ctx.fillRect(16, 16, 480, 96);
    }
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.stroke();

    let textX = 256;
    let align = 'center';

    if (faceImg) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(64, 64, 34, 0, Math.PI * 2);
      ctx.clip();
      try {
        ctx.drawImage(faceImg, 30, 30, 68, 68);
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

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px Prompt, Sarabun, sans-serif';
    ctx.textAlign = align;

    let tag = '🧭 ผู้เข้าชม • ';
    if (isTeacher) {
      tag = '👑 คุณครู • ';
    } else if (isCreator) {
      tag = '🎨 ผู้สร้าง • ';
    }
    ctx.fillText(`${tag}${name || 'ผู้เยี่ยมชม'}`, textX, 76);
  }

  applyPeerFaceTexture(peer, faceUrl) {
    if (!peer || !faceUrl || peer.faceUrl === faceUrl) return;
    peer.faceUrl = faceUrl;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      peer.faceImg = img;
      const tex = new THREE.Texture(img);
      tex.needsUpdate = true;

      // 1. Map real photograph onto the front face of the 3D Avatar's head!
      if (peer.headMaterials && peer.headMaterials[4]) {
        peer.headMaterials[4].map = tex;
        peer.headMaterials[4].needsUpdate = true;
      }

      // 2. Update overhead Nameplate with circular photo portrait
      if (peer.nameplateObj) {
        this.renderPeerNameplateCanvas(
          peer.nameplateObj.canvas,
          peer.nameplateObj.ctx,
          peer.name,
          peer.role,
          img
        );
        peer.nameplateObj.texture.needsUpdate = true;
      }
    };
    img.src = faceUrl;
  }


  createPeerSpeechObject() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(3.2, 1.15, 1);
    sprite.visible = false;
    return { sprite, canvas, ctx, texture, timer: null };
  }

  showPeerSpeechBubble(peer, text) {
    if (!peer || !peer.speechObj) return;
    const { canvas, ctx, texture, sprite } = peer.speechObj;
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Cloud bubble body
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(20, 16, w - 40, h - 56, 22);
    } else {
      ctx.fillRect(20, 16, w - 40, h - 56);
    }
    ctx.fill();

    // Bubble pointer down to head
    ctx.beginPath();
    ctx.moveTo(w / 2 - 16, h - 40);
    ctx.lineTo(w / 2, h - 14);
    ctx.lineTo(w / 2 + 16, h - 40);
    ctx.fill();

    // Message text
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 28px Prompt, Sarabun, sans-serif';
    ctx.textAlign = 'center';

    let display = text || '';
    if (display.length > 26) display = display.substring(0, 24) + '...';
    ctx.fillText(display, w / 2, 75);

    texture.needsUpdate = true;
    sprite.visible = true;

    if (peer.speechObj.timer) clearTimeout(peer.speechObj.timer);
    peer.speechObj.timer = setTimeout(() => {
      sprite.visible = false;
    }, 5000);
  }

  createPeerSpeakingIndicator() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Glowing green circular badge
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(64, 64, 52, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '52px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔊', 64, 66);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(0.9, 0.9, 1);
    sprite.visible = false;
    return { sprite, timer: null };
  }

  showPeerSpeaking(peer) {
    if (!peer || !peer.speakingObj) return;
    peer.speakingObj.sprite.visible = true;
    if (peer.speakingObj.timer) clearTimeout(peer.speakingObj.timer);
    peer.speakingObj.timer = setTimeout(() => {
      peer.speakingObj.sprite.visible = false;
    }, 700);
  }

  // =========================================================================
  // 6. ROOM SWITCHING & VISITOR STATS
  // =========================================================================
  switchRoom(newRoomId) {
    const targetRoom = parseInt(newRoomId, 10);
    if (this.currentRoomId === targetRoom) return;

    // 1. Notify current room peers that I am leaving
    this.broadcastLeave();

    // 2. Remove all remote peer avatars from previous room
    for (const [id, peer] of this.remotePeers.entries()) {
      if (peer && peer.avatarGroup) {
        this.scene.remove(peer.avatarGroup);
      }
    }
    this.remotePeers.clear();

    // 3. Unsubscribe previous room topic
    if (this.mqttClient && this.isConnected) {
      try {
        this.mqttClient.unsubscribe(`pattananikom/metaverse/room_${this.currentRoomId}/#`);
      } catch (e) {}
    }

    // 4. Set new room and re-subscribe
    this.currentRoomId = targetRoom;
    this.subscribeCurrentRoom();

    // 5. Announce presence in new room immediately
    this.broadcastSelf();
  }

  // =========================================================================
  // 7. ANIMATION LOOP: INTERPOLATION & PRUNING
  // =========================================================================
  update(delta) {
    const now = Date.now();

    for (const [id, peer] of this.remotePeers.entries()) {
      if (!peer || !peer.avatarGroup) {
        this.remotePeers.delete(id);
        continue;
      }

      // Prune inactive peers (disconnected or closed tab without leave signal)
      if (now - peer.lastSeen > 4500) {
        this.scene.remove(peer.avatarGroup);
        this.remotePeers.delete(id);
        continue;
      }

      // Smooth position lerp
      if (peer.targetPos) {
        peer.avatarGroup.position.lerp(peer.targetPos, delta * 12);
      }

      // Smooth rotation lerp
      if (typeof peer.targetRotY === 'number') {
        let diffRot = peer.targetRotY - peer.avatarGroup.rotation.y;
        while (diffRot < -Math.PI) diffRot += Math.PI * 2;
        while (diffRot > Math.PI) diffRot -= Math.PI * 2;
        peer.avatarGroup.rotation.y += diffRot * Math.min(delta * 10, 1);
      }

      // Walking leg animation
      if (peer.isMoving && peer.lLeg && peer.rLeg) {
        peer.walkCycle = (peer.walkCycle || 0) + delta * 9;
        peer.lLeg.rotation.x = Math.sin(peer.walkCycle) * 0.45;
        peer.rLeg.rotation.x = -Math.sin(peer.walkCycle) * 0.45;
      } else if (peer.lLeg && peer.rLeg) {
        peer.lLeg.rotation.x = 0;
        peer.rLeg.rotation.x = 0;
      }
    }
  }

  getTotalVisitors() {
    // Strictly real actual online attendees currently inside this room
    return 1 + this.remotePeers.size;
  }
}

window.MultiplayerManager = MultiplayerManager;
