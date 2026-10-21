/**
 * SPATIAL METAVERSE - 3D STICKY NOTES SYSTEM
 * Place colorful Post-it notes on walls or in 3D space with author name, text, and peer feedback
 */

class StickyNoteManager {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.notes = [];
    this.noteMeshes = [];

    this.defaultNotes = [
      {
        id: 'note_1',
        text: 'ผลงาน AI คัดแยกขยะมีประโยชน์มากครับ อยากให้เอามาติดตั้งจริงที่โรงอาหารเลย!',
        author: 'ด.ช. กิตติพงษ์ (ม.2/3)',
        color: '#fef08a', // Classic yellow
        pos: { x: -36.75, y: 3.6, z: -2.5 },
        rotY: Math.PI / 2,
        likes: 12
      },
      {
        id: 'note_2',
        text: 'ภาพวาดและโปสเตอร์สีสันสวยงาม อธิบายแนวคิดชัดเจนมากค่ะ ปรบมือให้เลย 👏',
        author: 'คุณครูณัฐธิดา',
        color: '#fbcfe8', // Pastel pink
        pos: { x: -36.75, y: 3.5, z: 1.8 },
        rotY: Math.PI / 2,
        likes: 18
      },
      {
        id: 'note_3',
        text: 'โมเดล DNA 3 มิติหมุนสวยมาก เข้าใจการจับคู่เบสได้ง่ายขึ้นเยอะเลยครับ',
        author: 'ด.ช. ธีรภัทร (ม.4/1)',
        color: '#bbf7d0', // Mint green
        pos: { x: -36.75, y: 2.2, z: -1.2 },
        rotY: Math.PI / 2,
        likes: 9
      },
      {
        id: 'note_4',
        text: 'นิทรรศการใน Metaverse สนุกมาก เหมือนได้เดินชมนิทรรศการจริงเลย!',
        author: 'ด.ญ. ลลิตา (ม.3/1)',
        color: '#bae6fd', // Sky blue
        pos: { x: -36.75, y: 2.4, z: 2.8 },
        rotY: Math.PI / 2,
        likes: 25
      }
    ];

    this.loadNotes();
    this.renderAllNotes();
  }

  async loadNotes() {
    const saved = localStorage.getItem('spatial_metaverse_sticky_notes');
    if (saved) {
      try {
        this.notes = JSON.parse(saved);
      } catch (e) {
        this.notes = JSON.parse(JSON.stringify(this.defaultNotes));
      }
    } else {
      this.notes = JSON.parse(JSON.stringify(this.defaultNotes));
    }

    try {
      let resp = null;
      try {
        resp = await fetch('/api/notes?_t=' + Date.now());
      } catch (e) {}
      if (!resp || !resp.ok) {
        try {
          resp = await fetch('data/notes.json?_t=' + Date.now());
        } catch (e) {}
      }
      if (resp && resp.ok) {
        const data = await resp.json();
        const notes = Array.isArray(data) ? data : (data && data.notes);
        if (notes && Array.isArray(notes) && notes.length > 0) {
          this.notes = notes;
          this.saveNotes();
          this.renderAllNotes();
        }
      }
    } catch (e) {}
  }

  saveNotes() {
    localStorage.setItem('spatial_metaverse_sticky_notes', JSON.stringify(this.notes));
  }

  renderAllNotes() {
    // Clear old meshes
    this.noteMeshes.forEach(mesh => this.scene.remove(mesh));
    this.noteMeshes = [];

    this.notes.forEach(note => {
      this.create3DNoteMesh(note);
    });
  }

  create3DNoteMesh(note) {
    const noteSize = 1.1; // 1.1m x 1.1m in 3D world
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Background paper color
    ctx.fillStyle = note.color || '#fef08a';
    ctx.fillRect(0, 0, 512, 512);

    // Subtle paper shadow / fold effect at corner
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.beginPath();
    ctx.moveTo(440, 512);
    ctx.lineTo(512, 440);
    ctx.lineTo(512, 512);
    ctx.fill();

    // Pin badge at top center
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(256, 30, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(252, 26, 5, 0, Math.PI * 2);
    ctx.fill();

    // Author badge
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 24px Prompt, Sarabun, sans-serif';
    ctx.fillText(`✍️ ${note.author}`, 40, 90);

    // Divider line
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, 110);
    ctx.lineTo(472, 110);
    ctx.stroke();

    // Note Text
    ctx.fillStyle = '#111827';
    ctx.font = '28px Prompt, Sarabun, sans-serif';
    this.wrapText(ctx, note.text, 40, 160, 430, 42);

    // Like counter at bottom
    ctx.fillStyle = '#e11d48';
    ctx.font = 'bold 24px Prompt, Sarabun, sans-serif';
    ctx.fillText(`❤️ ${note.likes || 0}`, 40, 470);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const geo = new THREE.PlaneGeometry(noteSize, noteSize);
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geo, mat);

    mesh.position.set(note.pos.x, note.pos.y, note.pos.z);
    mesh.rotation.y = note.rotY || 0;
    // Slight random natural tilt
    mesh.rotation.z = (Math.random() - 0.5) * 0.08;

    mesh.userData = { note: note };
    this.scene.add(mesh);
    this.noteMeshes.push(mesh);
  }

  wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, y);
  }

  addNote(text, author, color, playerPos, studentProfile = null) {
    // Position note on sticky wall or in front of player
    const offsetZ = (Math.random() - 0.5) * 6;
    const offsetY = 2.0 + Math.random() * 2.0;

    const newNote = {
      id: `note_${Date.now()}`,
      text: text,
      author: author || 'นักเรียน',
      studentId: (studentProfile && studentProfile.studentId) || '-',
      studentClass: (studentProfile && studentProfile.studentClass) || 'โรงเรียนพัฒนานิคม',
      timestamp: new Date().toISOString(),
      color: color || '#fef08a',
      pos: { x: -36.75, y: offsetY, z: offsetZ },
      rotY: Math.PI / 2,
      likes: 1
    };

    this.notes.push(newNote);
    this.saveNotes();
    this.create3DNoteMesh(newNote);

    // Persist to server
    fetch('/api/save_note', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: newNote })
    }).catch(() => {});

    return newNote;
  }

  deleteNote(noteId) {
    this.notes = this.notes.filter(n => n.id !== noteId);
    this.saveNotes();
    this.renderAllNotes();

    // Persist to server
    fetch('/api/delete_note', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noteId: noteId })
    }).catch(() => {});

    return true;
  }

  clearAllNotes() {
    this.notes = [];
    this.saveNotes();
    this.renderAllNotes();

    // Persist to server
    fetch('/api/clear_all_notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    }).catch(() => {});

    return true;
  }

  getAllNotes() {
    return this.notes || [];
  }

  likeNote(noteId) {
    const note = this.notes.find(n => n.id === noteId);
    if (note) {
      note.likes = (note.likes || 0) + 1;
      this.saveNotes();
      this.renderAllNotes();

      // Persist to server
      fetch('/api/like_note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId: noteId })
      }).catch(() => {});

      return note.likes;
    }
    return 0;
  }

  checkProximity(playerPos) {
    let closestNote = null;
    let minDist = 3.0;

    for (const mesh of this.noteMeshes) {
      const n = mesh.userData.note;
      const nPos = new THREE.Vector3(n.pos.x, n.pos.y, n.pos.z);
      const dist = playerPos.distanceTo(nPos);
      if (dist < minDist) {
        minDist = dist;
        closestNote = n;
      }
    }
    return closestNote;
  }
}

window.StickyNoteManager = StickyNoteManager;
