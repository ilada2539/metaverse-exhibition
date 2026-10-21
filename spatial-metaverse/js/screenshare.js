/**
 * SPATIAL METAVERSE - SCREEN SHARING & AUDITORIUM DISPLAY
 * Streams live screen/presentation to the 3D cinema screen using WebRTC getDisplayMedia and THREE.VideoTexture
 */

class ScreenShareManager {
  constructor(world) {
    this.world = world;
    this.stream = null;
    this.videoElement = null;
    this.videoTexture = null;
    this.isSharing = false;

    // Slide Deck Mode (Default presentation slides for โรงเรียนพัฒนานิคม)
    this.slideIndex = 0;
    this.slides = [
      {
        title: 'นิทรรศการ 5 ศาสนาสากล • โรงเรียนพัฒนานิคม',
        subtitle: 'กลุ่มสาระการเรียนรู้สังคมศึกษา ศาสนา และวัฒนธรรม',
        points: [
          '🏫 ห้องเรียนเสมือนจริง 3D Metaverse ประจำโรงเรียนพัฒนานิคม',
          '🤝 ศึกษาหลักคำสอน ศาสนพิธี และคุณค่าทางจริยธรรมของ 5 ศาสนาสากล',
          '💡 ห้อง 1: พุทธ | ห้อง 2: คริสต์ | ห้อง 3: ฮินดู | ห้อง 4: อิสลาม | ห้อง 5: ยูดาห์',
          '🌟 เดินชมบูธนิทรรศการรอบห้องเพื่อสไลด์ฉายขึ้นจอ Smartboard อัตโนมัติ'
        ]
      },
      {
        title: 'ขั้นตอนการจัดบูธนิทรรศการของนักเรียนพัฒนานิคม',
        subtitle: 'แนวทางการนำเสนอผลงานผ่านบอร์ด 3D Interactive',
        points: [
          '1. เลือกห้องศาสนาที่ตนเองได้รับมอบหมาย และเดินไปยังบูธผลงาน',
          '2. กด [E] หรือคลิก "สร้าง/แก้ไขนิทรรศการ" เพื่อใส่ข้อมูลกลุ่ม',
          '3. เพิ่มสไลด์นำเสนอ PPT / PDF หรือรูปภาพอินโฟกราฟิกความรู้',
          '4. เมื่อบันทึก ผลงานจะฉายขึ้นจอภาพและหมุนสไลด์อัตโนมัติทันที'
        ]
      },
      {
        title: 'เกณฑ์การประเมินผลงานนักเรียน (Rubric Assessment)',
        subtitle: 'การประเมินโดยคุณครูและเพื่อนนักเรียนโรงเรียนพัฒนานิคม',
        points: [
          '⭐ ความถูกต้องของข้อมูลหลักธรรมและประวัติศาสนา (30%)',
          '⭐ การออกแบบสื่อนำเสนอ สไลด์ PPT/PDF และความคิดสร้างสรรค์ (30%)',
          '⭐ การนำเสนอและการบูรณาการหลักธรรมสู่การดำเนินชีวิต (20%)',
          '⭐ การมีส่วนร่วมและการแลกเปลี่ยนข้อคิดเห็นในห้องเรียน (20%)'
        ]
      }
    ];

    this.initVideoElement();
  }

  initVideoElement() {
    this.videoElement = document.createElement('video');
    this.videoElement.autoplay = true;
    this.videoElement.playsInline = true;
    this.videoElement.muted = true;
    this.videoElement.style.display = 'none';
    document.body.appendChild(this.videoElement);
  }

  async startScreenShare() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        alert('เบราว์เซอร์นี้ไม่รองรับการแชร์หน้าจอ (Screen Share API)');
        return false;
      }

      this.stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          displaySurface: 'monitor'
        },
        audio: false
      });

      this.videoElement.srcObject = this.stream;
      await this.videoElement.play();

      // Create Video Texture for 3D Screen
      this.videoTexture = new THREE.VideoTexture(this.videoElement);
      this.videoTexture.minFilter = THREE.LinearFilter;
      this.videoTexture.magFilter = THREE.LinearFilter;
      this.videoTexture.format = THREE.RGBFormat;

      this.world.updateScreenWithTexture(this.videoTexture);
      this.isSharing = true;

      // Listen for when user stops screen share from browser banner
      this.stream.getVideoTracks()[0].addEventListener('ended', () => {
        this.stopScreenShare();
      });

      return true;
    } catch (err) {
      console.warn('Screen share cancelled or failed:', err);
      return false;
    }
  }

  stopScreenShare() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.isSharing = false;
    this.world.resetAuditoriumScreen();
  }

  renderSlide(index) {
    if (this.isSharing) return;

    this.slideIndex = (index + this.slides.length) % this.slides.length;
    const slide = this.slides[this.slideIndex];

    const ctx = this.world.screenCtx;
    const w = this.world.screenCanvas.width;
    const h = this.world.screenCanvas.height;

    // Dark sleek slide background
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#020617');
    grad.addColorStop(0.5, '#0f172a');
    grad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Accent line
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(100, 160, 12, 100);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 56px Prompt, Sarabun, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(slide.title, 140, 210);

    // Subtitle
    ctx.fillStyle = '#38bdf8';
    ctx.font = '32px Prompt, Sarabun, sans-serif';
    ctx.fillText(slide.subtitle, 140, 260);

    // Points Card
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.beginPath();
    ctx.roundRect(100, 340, w - 200, 520, 24);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Bullet points
    slide.points.forEach((pt, i) => {
      ctx.fillStyle = '#f8fafc';
      ctx.font = '36px Prompt, Sarabun, sans-serif';
      ctx.fillText(pt, 160, 440 + i * 110);
    });

    // Slide indicator footer
    ctx.fillStyle = '#94a3b8';
    ctx.font = '28px Prompt, Sarabun, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`สไลด์ที่ ${this.slideIndex + 1} จาก ${this.slides.length} (กดปุ่มสไลด์ถัดไปเพื่อเปลี่ยน)`, w / 2, 940);

    if (this.world.screenTexture) this.world.screenTexture.needsUpdate = true;
  }

  nextSlide() {
    this.renderSlide(this.slideIndex + 1);
  }

  prevSlide() {
    this.renderSlide(this.slideIndex - 1);
  }
}

window.ScreenShareManager = ScreenShareManager;
