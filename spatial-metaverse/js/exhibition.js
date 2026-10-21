// Robust universal Canvas roundRect polyfill for Safari, iOS, and older browsers
if (typeof CanvasRenderingContext2D !== 'undefined') {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r = 0) {
    if (typeof r === 'number') r = [r, r, r, r];
    if (!Array.isArray(r)) r = [0, 0, 0, 0];
    const r0 = Math.max(0, Math.min(r[0] || 0, w / 2, h / 2));
    const r1 = Math.max(0, Math.min(r[1] || 0, w / 2, h / 2));
    const r2 = Math.max(0, Math.min(r[2] || 0, w / 2, h / 2));
    const r3 = Math.max(0, Math.min(r[3] || 0, w / 2, h / 2));
    this.moveTo(x + r0, y);
    this.lineTo(x + w - r1, y);
    this.quadraticCurveTo(x + w, y, x + w, y + r1);
    this.lineTo(x + w, y + h - r2);
    this.quadraticCurveTo(x + w, y + h, x + w - r2, y + h);
    this.lineTo(x + r3, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - r3);
    this.lineTo(x, y + r0);
    this.quadraticCurveTo(x, y, x + r0, y);
    return this;
  };
}

// In-memory & IndexedDB cache for presentation files
window.presentationMemoryStore = window.presentationMemoryStore || new Map();

class PresentationDB {
  static async open() {
    if (typeof indexedDB === 'undefined') return null;
    return new Promise((resolve) => {
      try {
        const req = indexedDB.open('SpatialMetaverseDB', 1);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains('files')) {
            db.createObjectStore('files');
          }
        };
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror = () => resolve(null);
      } catch (err) {
        resolve(null);
      }
    });
  }

  static async saveFile(key, data) {
    window.presentationMemoryStore.set(key, data);
    const db = await this.open();
    if (!db) return;
    try {
      const tx = db.transaction('files', 'readwrite');
      tx.objectStore('files').put(data, key);
    } catch (e) {}
  }

  static async getFile(key) {
    if (window.presentationMemoryStore.has(key)) {
      return window.presentationMemoryStore.get(key);
    }
    const db = await this.open();
    if (!db) return null;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction('files', 'readonly');
        const req = tx.objectStore('files').get(key);
        req.onsuccess = () => {
          if (req.result) window.presentationMemoryStore.set(key, req.result);
          resolve(req.result || null);
        };
        req.onerror = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    });
  }
}

const RELIGIOUS_ROOMS = {
  '1': {
    id: '1',
    name: 'ห้อง 1: ศาสนาพุทธ',
    icon: '☸️',
    title: 'นิทรรศการศาสนาพุทธ (Buddhism)',
    color: '#f59e0b',
    desc: 'พื้นที่จัดแสดงผลงานเกี่ยวกับพุทธประวัติ พระธรรมคำสอน วันสำคัญ และศาสนพิธีในพระพุทธศาสนา'
  },
  '2': {
    id: '2',
    name: 'ห้อง 2: ศาสนาคริสต์',
    icon: '✝️',
    title: 'นิทรรศการศาสนาคริสต์ (Christianity)',
    color: '#38bdf8',
    desc: 'พื้นที่จัดแสดงผลงานเกี่ยวกับพระเยซูคริสต์ คัมภีร์ไบเบิล นิกายสำคัญ และหลักความรักความเมตตา'
  },
  '3': {
    id: '3',
    name: 'ห้อง 3: ศาสนาพราหมณ์-ฮินดู',
    icon: '🕉️',
    title: 'นิทรรศการศาสนาพราหมณ์-ฮินดู (Hinduism)',
    color: '#ea580c',
    desc: 'พื้นที่จัดแสดงผลงานเกี่ยวกับตรีมูรติ คัมภีร์พระเวท พิธีกรรมศักดิ์สิทธิ์ และวรรณคดีทางศาสนา'
  },
  '4': {
    id: '4',
    name: 'ห้อง 4: ศาสนาอิสลาม',
    icon: '☪️',
    title: 'นิทรรศการศาสนาอิสลาม (Islam)',
    color: '#10b981',
    desc: 'พื้นที่จัดแสดงผลงานเกี่ยวกับนบีมุฮัมมัด คัมภีร์อัลกุรอาน หลักศรัทธา 6 และหลักปฏิบัติ 5 ประการ'
  },
  '5': {
    id: '5',
    name: 'ห้อง 5: ศาสนายูดาห์',
    icon: '✡️',
    title: 'นิทรรศการศาสนายูดาห์ (Judaism)',
    color: '#6366f1',
    desc: 'พื้นที่จัดแสดงผลงานเกี่ยวกับศาสดาโมเสส คัมภีร์โทราห์ บัญญัติ 10 ประการ และประเพณีชาวยิว'
  }
};

class ExhibitionManager {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.currentRoomId = '1';
    this.artworks = [];
    this.frameMeshes = [];
    this.frameGroups = [];

    // Slideshow & 3D Interactive Markers
    this.beacons = [];
    this.floorMats = [];
    this.plaques = [];
    this.coverImageCache = {};
    this.boothCanvases = [];
    this.boothTextures = [];
    this.boothSlideTimers = [0, 1.1, 2.2, 3.3, 0.6, 1.7, 2.8, 3.9];
    this.boothCurrentSlide = new Array(8).fill(0);
    this.clockTime = 0;

    // 8 Exhibition Booth Positions in the 3D Gallery
    this.boothSlots = [
      { id: 'booth_1', name: 'บูธที่ 1 (ห้องโถงฝั่งซ้ายหน้า)', pos: { x: -16.5, y: 3.5, z: -15 }, rotY: Math.PI / 2 },
      { id: 'booth_2', name: 'บูธที่ 2 (ห้องโถงฝั่งซ้ายหลัง)', pos: { x: -16.5, y: 3.5, z: -25 }, rotY: Math.PI / 2 },
      { id: 'booth_3', name: 'บูธที่ 3 (กำแพงตะวันตกหน้า)', pos: { x: -37.4, y: 3.5, z: -20 }, rotY: Math.PI / 2 },
      { id: 'booth_4', name: 'บูธที่ 4 (กำแพงตะวันตกหลัง)', pos: { x: -37.4, y: 3.5, z: -30 }, rotY: Math.PI / 2 },
      { id: 'booth_5', name: 'บูธที่ 5 (ห้องโถงฝั่งขวาหน้า)', pos: { x: 16.5, y: 3.5, z: -15 }, rotY: -Math.PI / 2 },
      { id: 'booth_6', name: 'บูธที่ 6 (ห้องโถงฝั่งขวาหลัง)', pos: { x: 16.5, y: 3.5, z: -25 }, rotY: -Math.PI / 2 },
      { id: 'booth_7', name: 'บูธที่ 7 (กำแพงตะวันออกหน้า)', pos: { x: 37.4, y: 3.5, z: -20 }, rotY: -Math.PI / 2 },
      { id: 'booth_8', name: 'บูธที่ 8 (กำแพงตะวันออกหลัง)', pos: { x: 37.4, y: 3.5, z: -30 }, rotY: -Math.PI / 2 }
    ];

    this.initExhibition();
  }

  initExhibition() {
    this.loadExhibitionData();
    this.createExhibitionFrames();
  }

  getCurrentRoomInfo() {
    return RELIGIOUS_ROOMS[this.currentRoomId] || RELIGIOUS_ROOMS['1'];
  }

  getStorageKey(roomId = this.currentRoomId) {
    return `spatial_metaverse_exhibition_room_${roomId}`;
  }

  getDefaultQuestionsForRoom(roomId = this.currentRoomId, boothNumber = 1) {
    const rId = String(roomId);
    if (rId === '1') {
      // ☸️ ห้อง 1: ศาสนาพุทธ
      return [
        {
          question: '1. ข้อใดคือหลักธรรมที่เป็นหัวใจสำคัญในการดับทุกข์ตามคำสอนของพระพุทธศาสนา?',
          options: ['อริยสัจ 4', 'ไตรสรณคมน์', 'กฎแห่งกรรม', 'อิทธิบาท 4'],
          answer: 0,
          explanation: 'อริยสัจ 4 (ทุกข์ สมุทัย นิโรธ มรรค) คือความจริงอันประเสริฐ 4 ประการเพื่อความดับทุกข์สิ้นเชิง'
        },
        {
          question: '2. พระพุทธเจ้าทรงแสดงปฐมเทศนา "ธัมมจักกัปปวัตตนสูตร" โปรดแก่บุคคลกลุ่มใด?',
          options: ['ปัญจวัคคีย์ทั้ง 5', 'พระสารีบุตรและพระโมคคัลลานะ', 'ชฎิล 3 พี่น้อง', 'พระเจ้าพิมพิสาร'],
          answer: 0,
          explanation: 'ทรงแสดงปฐมเทศนาโปรดปัญจวัคคีย์ ณ ป่าอิสิปตนมฤคทายวัน ในวันขึ้น 15 ค่ำ เดือน 8 (วันอาสาฬหบูชา)'
        },
        {
          question: '3. วันสำคัญทางพระพุทธศาสนาใดที่ได้รับการยกย่องจาก UNESCO ให้เป็น "วันสำคัญสากลของโลก"?',
          options: ['วันวิสาขบูชา', 'วันมาฆบูชา', 'วันอาสาฬหบูชา', 'วันอัฏฐมีบูชา'],
          answer: 0,
          explanation: 'วันวิสาขบูชาเป็นวันคล้ายวันประสูติ ตรัสรู้ และปรินิพพานขององค์สมเด็จพระสัมมาสัมพุทธเจ้า'
        },
        {
          question: '4. ข้อใดจัดอยู่ในหมวด "มรรค" หรือแนวทางปฏิบัติเพื่อนำไปสู่ความพ้นทุกข์?',
          options: ['มรรคมีองค์ 8 (สัมมาทิฏฐิ ถึง สัมมาสมาธิ)', 'ตัณหา 3', 'ขันธ์ 5', 'ไตรลักษณ์'],
          answer: 0,
          explanation: 'มรรคมีองค์ 8 คือทางสายกลาง (มัชฌิมาปฏิปทา) อันเป็นข้อปฏิบัติเพื่อความดับทุกข์'
        },
        {
          question: '5. คัมภีร์ที่บันทึกหลักธรรมคำสั่งสอนของพระสัมมาสัมพุทธเจ้าแบ่งเป็น 3 หมวด เรียกว่าอะไร?',
          options: ['พระไตรปิฎก (พระวินัย, พระสุตตันตะ, พระอภิธรรม)', 'พระเวท', 'คัมภีร์โทราห์', 'คัมภีร์อรรถกถา'],
          answer: 0,
          explanation: 'พระไตรปิฎก หมายถึง ตะกร้า 3 ใบ ที่รวบรวมพระธรรมวินัยของพระพุทธเจ้า'
        }
      ];
    } else if (rId === '2') {
      // ✝️ ห้อง 2: ศาสนาคริสต์
      return [
        {
          question: '1. คัมภีร์ศักดิ์สิทธิ์สูงสุดของศาสนาคริสต์คือคัมภีร์ใด?',
          options: ['พระคริสตธรรมคัมภีร์ (The Holy Bible)', 'คัมภีร์อัลกุรอาน', 'คัมภีร์พระเวท', 'คัมภีร์โทราห์'],
          answer: 0,
          explanation: 'คัมภีร์ไบเบิลประกอบด้วยพันธสัญญาเดิม (Old Testament) และพันธสัญญาใหม่ (New Testament)'
        },
        {
          question: '2. ศาสดาผู้ก่อตั้งศาสนาคริสต์คือท่านใด?',
          options: ['พระเยซูคริสต์ (Jesus Christ)', 'ท่านนบีมุฮัมมัด', 'ศาสดาโมเสส', 'พระเจ้าดาวิด'],
          answer: 0,
          explanation: 'พระเยซูคริสต์ทรงประสูติ ณ เมืองเบธเลเฮม เป็นพระผู้ช่วยให้รอด'
        },
        {
          question: '3. หลักธรรมคำสอนสำคัญสูงสุดที่พระเยซูทรงเน้นย้ำแก่มนุษยชาติคือหลักการใด?',
          options: ['หลักความรักและความเมตตา (Love & Compassion)', 'หลักการปล่อยวาง', 'หลักตรีมูรติ', 'หลักกฎแห่งกรรม'],
          answer: 0,
          explanation: 'พระเยซูทรงสอนให้รักพระเจ้าสุดจิตสุดใจ และรักเพื่อนบ้านเหมือนรักตนเอง'
        },
        {
          question: '4. ศีลศักดิ์สิทธิ์แรกที่แสดงถึงการชำระบาปกำเนิดและรับเข้าเป็นสมาชิกคริสตชนคือศีลใด?',
          options: ['ศีลล้างบาป (Baptism / ศีลจุ่ม)', 'ศีลมหาสนิท', 'ศีลสมรส', 'ศีลกำลัง'],
          answer: 0,
          explanation: 'ศีลล้างบาปเป็นเครื่องหมายของการเกิดใหม่ฝ่ายจิตวิญญาณและชำระล้างมลทินบาป'
        },
        {
          question: '5. ข้อใดกล่าวถึง 3 นิกายสำคัญในศาสนาคริสต์ได้ถูกต้องที่สุด?',
          options: ['โรมันคาทอลิก, ออร์โธดอกซ์, โปรเตสแตนต์', 'เถรวาท, มหายาน, วัชรยาน', 'สุนนี, ชีอะฮ์, คาริจญ์', 'ไศวะ, ไวษณพ, ศักติ'],
          answer: 0,
          explanation: 'ศาสนาคริสต์มี 3 นิกายหลัก คือ โรมันคาทอลิก (วาติกัน), ออร์โธดอกซ์ (ตะวันออก) และโปรเตสแตนต์'
        }
      ];
    } else if (rId === '3') {
      // 🕉️ ห้อง 3: ศาสนาพราหมณ์-ฮินดู
      return [
        {
          question: '1. "ตรีมูรติ" ในศาสนาพราหมณ์-ฮินดู ประกอบด้วยมหาเทพผู้ยิ่งใหญ่ 3 พระองค์ใด?',
          options: ['พระพรหม (ผู้สร้าง), พระวิษณุ (ผู้รักษา), พระศิวะ (ผู้ทำลาย)', 'พระพิฆเนศ, พระอินทร์, พระยม', 'พระรามา, พระกฤษณะ, พระหนุมาน', 'พระสุรัสวดี, พระลักษมี, พระแม่อุมา'],
          answer: 0,
          explanation: 'ตรีมูรติ คือ รูปแบบสามองค์ของพระเป็นเจ้าสูงสุดในปรัชญาฮินดู'
        },
        {
          question: '2. คัมภีร์ดั้งเดิมและศักดิ์สิทธิ์สูงสุดของศาสนาพราหมณ์-ฮินดูคือคัมภีร์ใด?',
          options: ['คัมภีร์พระเวท (Vedas)', 'คัมภีร์มหาภารตะ', 'คัมภีร์รามายณะ', 'คัมภีร์ปุราณะ'],
          answer: 0,
          explanation: 'พระเวทเป็นคัมภีร์ที่เก่าแก่ที่สุด แบ่งออกเป็น 4 พระเวท คือ ฤคเวท สามเวท ยชุรเวท และอถรรพเวท'
        },
        {
          question: '3. สัญลักษณ์ศักดิ์สิทธิ์สูงสุดของศาสนาฮินดูที่เปล่งเสียงแทนพระเจ้าทั้งปวงคือสัญลักษณ์ใด?',
          options: ['สัญลักษณ์โอม (ॐ)', 'สัญลักษณ์สวัสดิกะ', 'สัญลักษณ์ตรีศูล', 'สัญลักษณ์ดอกบัว'],
          answer: 0,
          explanation: 'โอม (A-U-M) ประกอบด้วย อักษร อะ อุ มะ แทนพระศิวะ พระวิษณุ และพระพรหม'
        },
        {
          question: '4. เป้าหมายสูงสุดในชีวิตตามหลักปรัชญาฮินดูเพื่อหลุดพ้นจากการเวียนว่ายตายเกิดเรียกว่าอะไร?',
          options: ['โมกษะ (Moksha)', 'ธรรมะ (Dharma)', 'อรรถะ (Artha)', 'กามะ (Kama)'],
          answer: 0,
          explanation: 'โมกษะ คือ ความหลุดพ้นจากสังสารวัฏ วิญญาณย่อย (อาตมัน) รวมเข้ากับปรมาตมัน'
        },
        {
          question: '5. แม่น้ำศักดิ์สิทธิ์ที่สุดที่ชาวฮินดูนิยมไปประกอบพิธีล้างบาปคือแม่น้ำสายใด?',
          options: ['แม่น้ำคงคา (Ganges River)', 'แม่น้ำสินธุ', 'แม่น้ำยมุนา', 'แม่น้ำพรหมบุตร'],
          answer: 0,
          explanation: 'แม่น้ำคงคาเชื่อว่าเป็นสายน้ำศักดิ์สิทธิ์ที่ไหลลงมาจากสวรรค์ผ่านพระเกศาของพระศิวะ'
        }
      ];
    } else if (rId === '4') {
      // ☪️ ห้อง 4: ศาสนาอิสลาม
      return [
        {
          question: '1. คัมภีร์ศักดิ์สิทธิ์สูงสุดที่พระอัลลอฮ์ทรงประทานแก่ศาสดามุฮัมมัดคือคัมภีร์ใด?',
          options: ['คัมภีร์อัลกุรอาน (Al-Quran)', 'คัมภีร์ฮะดีษ', 'คัมภีร์เตารอต', 'คัมภีร์อินญีล'],
          answer: 0,
          explanation: 'คัมภีร์อัลกุรอานคือพระพจนารถของพระอัลลอฮ์ที่ประทานผ่านมลาอิกะฮ์ญิบรีล'
        },
        {
          question: '2. ศาสนทูต (นบี) องค์สุดท้ายในศาสนาอิสลามคือท่านใด?',
          options: ['นบีมุฮัมมัด (ซ.ล.)', 'นบีอิบรอฮีม', 'นบีมูซา', 'นบีอีซา'],
          answer: 0,
          explanation: 'ท่านนบีมุฮัมมัดเป็นศาสนทูตองค์สุดท้าย (คอตะมุนนับียีน) แห่งประวัติศาสตร์มนุษยชาติ'
        },
        {
          question: '3. การปฏิบัติศาสนกิจวันละ 5 เวลาของชาวมุสลิม ตรงกับหลักปฏิบัติข้อใด?',
          options: ['การละหมาด (เศาะลาฮ์)', 'การปฏิญาณตน (ชะฮาดะฮ์)', 'การจ่ายซะกาต', 'การถือศีลอด (เศาม์)'],
          answer: 0,
          explanation: 'การละหมาดวันละ 5 เวลาเป็นเสาหลักต้นที่สองของหลักปฏิบัติ 5 ประการ'
        },
        {
          question: '4. เมืองศักดิ์สิทธิ์และสถานที่ตั้งของกะอ์บะฮ์ที่ชาวมุสลิมทั่วโลกหันหน้าไปละหมาดคือเมืองใด?',
          options: ['เมืองมักกะฮ์ (Makkah)', 'เมืองมะดีนะฮ์', 'เมืองเยรูซาเลม', 'เมืองไคโร'],
          answer: 0,
          explanation: 'มัสยิดอัลฮะรอมและกะอ์บะฮ์ ณ นครมักกะฮ์ เป็นทิศกิบลัตและศูนย์รวมจิตใจของมุสลิมทั่วโลก'
        },
        {
          question: '5. เดือนอันประเสริฐที่ชาวมุสลิมทุกคนร่วมใจกันถือศีลอดตั้งแต่รุ่งอรุณจนตะวันตกดินคือเดือนใด?',
          options: ['เดือนรอมฎอน (Ramadan)', 'เดือนมุฮัรรอม', 'เดือนเชาวาล', 'เดือนซุลฮิจญะฮ์'],
          answer: 0,
          explanation: 'เดือนรอมฎอนเป็นเดือนที่ 9 ตามปฏิทินฮิจเราะห์ศักราช เป็นเดือนที่ประทานอัลกุรอาน'
        }
      ];
    } else {
      // ✡️ ห้อง 5: ศาสนายูดาห์
      return [
        {
          question: '1. ศาสดาคนสำคัญผู้นำชาวฮีบรูออกจากอียิปต์และได้รับบัญญัติ 10 ประการคือท่านใด?',
          options: ['โมเสส (Moses)', 'อับราฮัม', 'กษัตริย์ดาวิด', 'กษัตริย์โซโลมอน'],
          answer: 0,
          explanation: 'โมเสสได้รับบัญญัติ 10 ประการจากพระยาห์เวห์ ณ ยอดเขาซีนาย'
        },
        {
          question: '2. คัมภีร์ 5 เล่มแรกที่มีความศักดิ์สิทธิ์และเป็นหัวใจสำคัญสูงสุดในศาสนายูดาห์เรียกว่าอะไร?',
          options: ['คัมภีร์โทราห์ (Torah)', 'คัมภีร์ทัลมุด', 'คัมภีร์ทานัค', 'คัมภีร์มิดราช'],
          answer: 0,
          explanation: 'โทราห์หรือเบญจบรรณ เป็นกฎหมายและคำสั่งสอนของพระเจ้าที่ประทานผ่านโมเสส'
        },
        {
          question: '3. วันบริสุทธิ์ประจำสัปดาห์เพื่อการหยุดพักผ่อนและนมัสการพระเจ้าของชาวยิวเรียกว่าอะไร?',
          options: ['วันสะบาโต (Sabbath / Shabbat)', 'วันถือศีลอด', 'วันปัสกา', 'วันฮานุกกะห์'],
          answer: 0,
          explanation: 'วันสะบาโตเริ่มตั้งแต่พระอาทิตย์ตกดินของวันศุกร์ถึงค่ำวันเสาร์'
        },
        {
          question: '4. สัญลักษณ์สำคัญของศาสนายูดาห์ที่มีรูปดาวหกแฉกเรียกว่าอะไร?',
          options: ['ดาวแห่งดาวิด (Star of David / Magen David)', 'เชิงเทียน 7 กิ่ง (Menorah)', 'คทาโมเสส', 'ศิลาจารึกพันธสัญญา'],
          answer: 0,
          explanation: 'ดาวแห่งดาวิด (Shield of David) เป็นสัญลักษณ์แทนเอกภาพของชาวยิวและปรากฏบนธงชาติอิสราเอล'
        },
        {
          question: '5. ศาสนสถานของชาวยิวที่ใช้เป็นสถานที่นมัสการ อธิษฐาน และศึกษาพระคัมภีร์เรียกว่าอะไร?',
          options: ['สุเหร่ายิว (Synagogue)', 'มัสยิด', 'โบสถ์วิหาร', 'มหาวิหาร'],
          answer: 0,
          explanation: 'ซินากอก (Synagogue) คือศาลาธรรมหรือสุเหร่ายิวสำหรับประกอบพิธีและรวมตัวของชุมชน'
        }
      ];
    }
  }

  async saveBoothToServer(roomId, boothNumber, artwork) {
    try {
      const payload = {
        roomId: String(roomId),
        boothNumber: parseInt(boothNumber, 10),
        artwork: artwork
      };
      const resp = await fetch('/api/save_booth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (resp.ok) {
        return await resp.json();
      }
    } catch (e) {
      console.warn('Error saving booth to server:', e);
    }
    return null;
  }

  async fetchBoothsFromServer(roomId = this.currentRoomId) {
    try {
      const resp = await fetch(`/api/booths?room=${roomId}&_t=${Date.now()}`);
      if (resp.ok) {
        const result = await resp.json();
        if (result && result.success && Array.isArray(result.booths) && String(roomId) === String(this.currentRoomId)) {
          let updated = false;
          result.booths.forEach((srvArt, idx) => {
            if (srvArt && srvArt.title && !srvArt.isEmpty) {
              this.artworks[idx] = srvArt;
              updated = true;
            }
          });
          if (updated) {
            this.saveExhibitionData();
            this.refreshAllFrames();
            if (window.spatialUI) {
              const vm = document.getElementById('visitor-modal');
              if (vm && vm.classList.contains('show')) {
                window.spatialUI.renderVisitorBoothDirectory();
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('Error fetching booths from server:', e);
    }
  }

  async loadExhibitionData() {
    const key = this.getStorageKey();
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 8) {
          this.artworks = parsed;
          for (let idx = 0; idx < this.artworks.length; idx++) {
            const art = this.artworks[idx];
            // Ensure quizQuestions, checkins, likedBy exist for backwards compatibility
            if (!art.quizQuestions || !Array.isArray(art.quizQuestions) || art.quizQuestions.length === 0) {
              art.quizQuestions = this.getDefaultQuestionsForRoom(this.currentRoomId, idx + 1);
            }
            if (!art.checkins || !Array.isArray(art.checkins)) {
              art.checkins = [];
            }
            if (!art.likedBy || !Array.isArray(art.likedBy)) {
              art.likedBy = [];
            }
            if (art.presentationFile && (!art.presentationFile.dataUrl || art.presentationFile.dataUrl.length < 200)) {
              const fileKey = `pres_${art.id}`;
              const cachedData = await PresentationDB.getFile(fileKey);
              if (cachedData) {
                art.presentationFile.dataUrl = cachedData;
              }
            }
          }
          this.fetchBoothsFromServer(this.currentRoomId);
          return;
        }
      } catch (e) {
        console.warn('Failed to parse saved room data');
      }
    }
    // Clean empty booths tailored for the room
    this.artworks = this.createEmptyBooths();
    this.saveExhibitionData();
    this.fetchBoothsFromServer(this.currentRoomId);
  }

  createEmptyBoothsForRoom(roomId) {
    const room = RELIGIOUS_ROOMS[roomId] || { name: `ห้อง ${roomId}`, color: '#475569' };
    return this.boothSlots.map((slot, idx) => ({
      id: `${slot.id}_r${roomId}`,
      roomId: String(roomId),
      boothNumber: idx + 1,
      title: `บูธที่ ${idx + 1}: ${room.name} (พื้นที่ว่าง)`,
      creator: 'ยังไม่มีผลงานติดตั้ง',
      schoolClass: 'รอนักเรียนสร้างสรรค์',
      category: 'ยังไม่ได้ระบุหัวข้อ',
      concept: `พื้นที่จัดแสดงผลงานนิทรรศการนี้ยังว่างอยู่ นักเรียนกลุ่มที่ได้รับมอบหมายหัวข้อ "${room.name}" สามารถกดปุ่ม [ 🎨 สร้างนิทรรศการ ] เพื่อติดตั้งผลงานได้เลยครับ`,
      audioText: `ยินดีต้อนรับสู่บูธที่ ${idx + 1} ของ ${room.name} พื้นที่นี้กำลังเปิดรับผลงานจากนักเรียนครับ`,
      themeColor: room.color || '#475569',
      imageURL: null,
      likes: 0,
      likedBy: [],
      checkins: [],
      quizQuestions: this.getDefaultQuestionsForRoom(String(roomId), idx + 1),
      presentationFile: null,
      isEmpty: true,
      pos: slot.pos,
      rotY: slot.rotY
    }));
  }

  createEmptyBooths() {
    return this.createEmptyBoothsForRoom(this.currentRoomId);
  }

  saveExhibitionData() {
    // 1. Save large presentation files to IndexedDB & memory
    this.artworks.forEach(art => {
      if (art.presentationFile && art.presentationFile.dataUrl && !art.presentationFile.isUrl) {
        const fileKey = `pres_${art.id}`;
        PresentationDB.saveFile(fileKey, art.presentationFile.dataUrl);
      }
    });

    // 2. Save metadata to localStorage safely without crashing on quota
    try {
      localStorage.setItem(this.getStorageKey(), JSON.stringify(this.artworks));
    } catch (e) {
      console.warn('localStorage quota exceeded, storing lightweight metadata', e);
      const safeArtworks = this.artworks.map(art => {
        if (art.presentationFile && art.presentationFile.dataUrl && !art.presentationFile.isUrl && art.presentationFile.dataUrl.length > 50000) {
          return {
            ...art,
            presentationFile: {
              name: art.presentationFile.name,
              size: art.presentationFile.size,
              type: art.presentationFile.type,
              isUrl: false,
              dataUrl: null // Data is safe in PresentationDB
            }
          };
        }
        return art;
      });
      try {
        localStorage.setItem(this.getStorageKey(), JSON.stringify(safeArtworks));
      } catch (e2) {
        console.warn('Could not save to localStorage', e2);
      }
    }
  }

  switchRoom(roomId) {
    if (!RELIGIOUS_ROOMS[roomId]) return false;
    this.currentRoomId = roomId;
    this.loadExhibitionData();

    // Re-render frames in 3D
    this.refreshAllFrames();

    // Update auditorium cinema screen & dynamic religious decorations
    const roomInfo = this.getCurrentRoomInfo();
    if (this.world) {
      if (this.world.drawWelcomeScreen) {
        this.world.drawWelcomeScreen(roomInfo);
      }
      if (this.world.updateRoomTheme) {
        this.world.updateRoomTheme(roomInfo);
      }
    }

    return roomInfo;
  }

  clearCurrentRoom() {
    localStorage.removeItem(this.getStorageKey());
    this.artworks = this.createEmptyBooths();
    this.saveExhibitionData();
    this.refreshAllFrames();
  }

  clearAllRooms() {
    for (let i = 1; i <= 5; i++) {
      localStorage.removeItem(`spatial_metaverse_exhibition_room_${i}`);
    }
    this.artworks = this.createEmptyBooths();
    this.saveExhibitionData();
    this.refreshAllFrames();
  }

  createExhibitionFrames() {
    this.frameGroups.forEach(g => this.scene.remove(g));
    this.floorMats.forEach(m => {
      if (m && m.mesh) this.scene.remove(m.mesh);
    });
    this.frameGroups = [];
    this.frameMeshes = [];
    this.beacons = [];
    this.floorMats = [];
    this.boothCanvases = [];
    this.boothTextures = [];

    this.artworks.forEach((art, idx) => {
      this.createSingleFrame(art, idx);
    });
  }

  refreshAllFrames() {
    const room = this.getCurrentRoomInfo();
    this.artworks.forEach((art, idx) => {
      const frameMesh = this.frameMeshes[idx];
      if (frameMesh) {
        frameMesh.userData.artwork = art;
        if (frameMesh.parent) {
          frameMesh.parent.traverse(child => {
            if (child.userData) child.userData.artwork = art;
            if (child.name === 'art_glow') {
              child.material.color = new THREE.Color(art.isEmpty ? room.color : (art.themeColor || room.color));
            }
          });
        }
      }

      // 1. Update poster canvas & texture
      this.updatePosterTexture(idx);

      // 2. Update floating 3D beacon
      const beacon = this.beacons[idx];
      if (beacon) {
        const color = new THREE.Color(art.isEmpty ? room.color : (art.themeColor || room.color));
        beacon.diamond.material.color = color;
        beacon.diamond.material.emissive = color;
        beacon.ring.material.color = color;
        beacon.light.color = color;
        this.renderBeaconSpriteCanvas(beacon.spriteCanvas, art, idx, room);
        beacon.spriteTexture.needsUpdate = true;
      }

      // 3. Update floor viewing mat
      const mat = this.floorMats[idx];
      if (mat) {
        this.renderFloorMatCanvas(mat.canvas, art, idx, room, mat.isHighlighted);
        mat.texture.needsUpdate = true;
      }

      // 4. Background preload presentation into memory for instant viewing
      if (art && art.presentationFile && window.spatialUI && typeof window.spatialUI.preloadBoothPresentation === 'function') {
        const presUrl = art.presentationFile.downloadUrl || art.presentationFile.dataUrl;
        if (presUrl) {
          window.spatialUI.preloadBoothPresentation(presUrl);
        }
      }
    });
  }


  createSingleFrame(art, index) {
    const frameW = 4.8;
    const frameH = 3.0;

    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 800;
    this.boothCanvases[index] = canvas;

    // 1. Initial render (draws high-definition exhibition project showcase poster)
    this.renderGalleryFrameOnCanvas(canvas, art);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    this.boothTextures[index] = texture;

    const canvasGeo = new THREE.PlaneGeometry(frameW, frameH);
    const canvasMat = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.FrontSide
    });
    const canvasMesh = new THREE.Mesh(canvasGeo, canvasMat);
    canvasMesh.name = `art_canvas_${art.id}`;
    canvasMesh.userData = { artwork: art, index: index };

    // Outer realistic museum picture frame (Sleek dark wood / charcoal with bevel)
    const frameThickness = 0.16;
    const frameDepth = 0.10;
    const outerFrameGeo = new THREE.BoxGeometry(frameW + frameThickness * 2, frameH + frameThickness * 2, frameDepth);
    const outerFrameMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.35,
      metalness: 0.25
    });
    const frameMesh = new THREE.Mesh(outerFrameGeo, outerFrameMat);
    frameMesh.name = `art_border_${art.id}`;
    frameMesh.userData = { artwork: art, index: index };
    frameMesh.position.z = -0.05;

    const room = this.getCurrentRoomInfo();
    const glowGeo = new THREE.BoxGeometry(frameW + 0.04, frameH + 0.04, 0.02);
    const glowMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(art.isEmpty ? room.color : (art.themeColor || room.color)) });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    glowMesh.name = 'art_glow';
    glowMesh.userData = { artwork: art, index: index };
    glowMesh.position.z = -0.01;

    const group = new THREE.Group();
    group.add(frameMesh);
    group.add(glowMesh);
    group.add(canvasMesh);

    // 1. ADD EXHIBITION PLAQUE TAG BESIDE FRAME (เหมือนในภาพตัวอย่าง พระประวัติ 👉)
    const plaque = this.createBoothPlaque(art, index, room);
    group.add(plaque.group);
    this.plaques[index] = plaque;

    // 2. Focused warm museum gallery spotlight
    const spot = new THREE.SpotLight(0xfffaed, 1.4, 14, Math.PI / 4, 0.4);
    spot.position.set(0, 2.5, 3.2);
    group.add(spot);

    // 3. Floating 3D Beacon
    const beacon = this.createBoothBeacon(art, index, room);
    group.add(beacon.group);
    this.beacons[index] = beacon;

    group.position.set(art.pos.x, art.pos.y, art.pos.z);
    group.rotation.y = art.rotY;

    this.scene.add(group);
    this.frameGroups.push(group);
    this.frameMeshes.push(canvasMesh);

    // 4. Floor Viewing Mat
    const floorMat = this.createBoothFloorMat(art, index, room);
    this.scene.add(floorMat.mesh);
    this.floorMats[index] = floorMat;
  }

  createBoothBeacon(art, index, room) {
    const beaconGroup = new THREE.Group();
    beaconGroup.position.set(0, 2.45, 0);

    const color = new THREE.Color(art.isEmpty ? room.color : (art.themeColor || room.color));

    // A. 3D Diamond Mesh
    const diamondGeo = new THREE.OctahedronGeometry(0.36, 0);
    const diamondMat = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.45,
      roughness: 0.2,
      metalness: 0.8
    });
    const diamondMesh = new THREE.Mesh(diamondGeo, diamondMat);
    diamondMesh.userData = { artwork: art, index: index };
    beaconGroup.add(diamondMesh);

    // B. Revolving Orbit Ring
    const ringGeo = new THREE.TorusGeometry(0.55, 0.022, 8, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: color });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 3;
    beaconGroup.add(ringMesh);

    // C. Point light for soft glow
    const light = new THREE.PointLight(color, 0.7, 6);
    beaconGroup.add(light);

    // D. Billboard Sprite Banner (Always faces camera)
    const spriteCanvas = document.createElement('canvas');
    spriteCanvas.width = 512;
    spriteCanvas.height = 140;
    this.renderBeaconSpriteCanvas(spriteCanvas, art, index, room);

    const spriteTexture = new THREE.CanvasTexture(spriteCanvas);
    const spriteMat = new THREE.SpriteMaterial({ map: spriteTexture, depthTest: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.set(0, 0.85, 0);
    sprite.scale.set(3.2, 0.88, 1);
    beaconGroup.add(sprite);

    return {
      group: beaconGroup,
      diamond: diamondMesh,
      ring: ringMesh,
      light: light,
      sprite: sprite,
      spriteCanvas: spriteCanvas,
      spriteTexture: spriteTexture,
      baseY: 2.45
    };
  }

  renderBeaconSpriteCanvas(canvas, art, index, room) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const color = art.isEmpty ? (room.color || '#38bdf8') : (art.themeColor || room.color || '#06b6d4');

    // Background Badge
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.beginPath();
    ctx.roundRect(10, 10, w - 20, h - 20, 24);
    ctx.fill();

    // Border
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.textAlign = 'center';

    if (art.isEmpty) {
      ctx.fillStyle = color;
      ctx.font = 'bold 22px Prompt, Sarabun, sans-serif';
      ctx.fillText(`✨ จุดจัดแสดง • บูธที่ ${index + 1} (${room.name})`, w / 2, 48);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 26px Prompt, Sarabun, sans-serif';
      ctx.fillText('พื้นที่ว่าง - กด [E] เพื่อติดตั้งผลงาน', w / 2, 88);
    } else {
      ctx.fillStyle = color;
      ctx.font = 'bold 22px Prompt, Sarabun, sans-serif';
      ctx.fillText(`📍 นิทรรศการ • บูธที่ ${index + 1} (${art.category || room.name})`, w / 2, 46);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px Prompt, Sarabun, sans-serif';
      const titleShort = art.title.length > 20 ? art.title.substring(0, 19) + '...' : art.title;
      ctx.fillText(`"${titleShort}"`, w / 2, 82);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '18px Prompt, Sarabun, sans-serif';
      ctx.fillText(`โดย: ${art.creator || 'นักเรียน'} • [คลิก หรือกด E ชมผลงาน]`, w / 2, 114);
    }
  }

  createBoothFloorMat(art, index, room) {
    const forwardX = Math.sin(art.rotY);
    const forwardZ = Math.cos(art.rotY);
    const standDist = 2.4; // 2.4m in front of booth
    const floorPosX = art.pos.x + forwardX * standDist;
    const floorPosZ = art.pos.z + forwardZ * standDist;
    const floorPosY = 0.02; // Just above floor

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    this.renderFloorMatCanvas(canvas, art, index, room, false);

    const texture = new THREE.CanvasTexture(canvas);
    const matGeo = new THREE.PlaneGeometry(3.0, 3.0);
    const matMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(matGeo, matMaterial);
    mesh.rotation.x = -Math.PI / 2;
    mesh.rotation.z = -art.rotY + Math.PI / 2;
    mesh.position.set(floorPosX, floorPosY, floorPosZ);
    mesh.userData = { artwork: art, index: index, isFloorMat: true };

    return {
      mesh: mesh,
      canvas: canvas,
      texture: texture,
      material: matMaterial,
      pos: { x: floorPosX, y: floorPosY, z: floorPosZ },
      isHighlighted: false
    };
  }

  renderFloorMatCanvas(canvas, art, index, room, isNear = false) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const color = art.isEmpty ? (room.color || '#38bdf8') : (art.themeColor || room.color || '#06b6d4');

    // Outer Glowing Disc
    const grad = ctx.createRadialGradient(256, 256, 40, 256, 256, 240);
    grad.addColorStop(0, isNear ? 'rgba(56, 189, 248, 0.35)' : 'rgba(15, 23, 42, 0.45)');
    grad.addColorStop(0.7, isNear ? 'rgba(56, 189, 248, 0.15)' : 'rgba(15, 23, 42, 0.2)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(256, 256, 240, 0, Math.PI * 2);
    ctx.fill();

    // Outer Dashed Neon Ring
    ctx.strokeStyle = color;
    ctx.lineWidth = isNear ? 8 : 5;
    ctx.setLineDash([24, 16]);
    ctx.beginPath();
    ctx.arc(256, 256, 210, 0, Math.PI * 2);
    ctx.stroke();

    // Inner Solid Ring
    ctx.setLineDash([]);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(256, 256, 165, 0, Math.PI * 2);
    ctx.stroke();

    // Eye icon / Viewing icon
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 64px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('👁️', 256, 220);

    // Text labels
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Prompt, Sarabun, sans-serif';
    ctx.fillText(`จุดยืนชมผลงาน • บูธที่ ${index + 1}`, 256, 280);

    ctx.fillStyle = color;
    ctx.font = 'bold 20px Prompt, Sarabun, sans-serif';
    ctx.fillText(art.isEmpty ? '✨ พื้นที่ว่าง รอนักเรียนติดตั้ง ✨' : `📍 ${art.title.length > 20 ? art.title.substring(0, 18) + '...' : art.title}`, 256, 320);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('STAND HERE TO VIEW • PRESS [E]', 256, 355);

    // Direction arrow pointing forward toward booth
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(256, 100);
    ctx.lineTo(236, 125);
    ctx.lineTo(276, 125);
    ctx.closePath();
    ctx.fill();
  }

  // =========================================================================
  // AUTHENTIC MUSEUM GALLERY DISPLAY: Framed Cover Image + Wall Plaque Tag
  // =========================================================================
  hexToRgba(hex, alpha = 1) {
    if (!hex) return `rgba(56, 189, 248, ${alpha})`;
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const num = parseInt(c, 16);
    if (isNaN(num)) return `rgba(56, 189, 248, ${alpha})`;
    return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
  }

  getCoverImageUrl(art) {
    if (!art) return null;
    if (art.coverImageUrl && art.coverImageUrl.length > 5) return art.coverImageUrl;
    if (art.presentationFile && art.presentationFile.coverUrl) return art.presentationFile.coverUrl;
    if (art.imageURL && art.imageURL.length > 5) return art.imageURL;
    if (art.roomId && art.boothNumber) {
      return `/api/cover?room=${art.roomId}&booth=${art.boothNumber}`;
    }
    return null;
  }

  loadBoothCover(art, callback) {
    const url = this.getCoverImageUrl(art);
    if (!url) {
      if (callback) callback(null);
      return;
    }
    const key = `${art.roomId || this.currentRoomId}_${art.boothNumber}`;
    if (this.coverImageCache[key] && this.coverImageCache[key]._src === url && this.coverImageCache[key].complete && this.coverImageCache[key].naturalWidth > 0) {
      if (callback) callback(this.coverImageCache[key]);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img._src = url;
    img.onload = () => {
      this.coverImageCache[key] = img;
      if (callback) callback(img);
    };
    img.onerror = () => {
      console.warn(`Cover image not found for booth ${art.boothNumber}`);
      if (callback) callback(null);
    };
    img.src = url;
  }

  renderGalleryFrameOnCanvas(canvas, art, loadedImg = null) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const room = this.getCurrentRoomInfo();
    const color = art.isEmpty ? (room.color || '#38bdf8') : (art.themeColor || room.color || '#06b6d4');

    ctx.clearRect(0, 0, w, h);

    // 1. Passe-partout (Museum Mat Board)
    ctx.fillStyle = '#f8fafc'; // Crisp off-white mat board
    ctx.fillRect(0, 0, w, h);

    // Subtle mat texture / inner shadow bevel
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.lineWidth = 14;
    ctx.strokeRect(7, 7, w - 14, h - 14);

    // Inner cutout picture window
    const padX = 48;
    const padY = 48;
    const winW = w - padX * 2; // 1184
    const winH = h - padY * 2; // 704

    // Dark bevel edge inside mat board cutout
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(padX - 1, padY - 1, winW + 2, winH + 2);

    ctx.fillStyle = '#090d16';
    ctx.fillRect(padX, padY, winW, winH);

    // If booth is empty
    if (art.isEmpty) {
      const emptyGrad = ctx.createLinearGradient(padX, padY, padX, padY + winH);
      emptyGrad.addColorStop(0, '#1e293b');
      emptyGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = emptyGrad;
      ctx.fillRect(padX, padY, winW, winH);

      // Dashed inner border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 8]);
      ctx.strokeRect(padX + 24, padY + 24, winW - 48, winH - 48);
      ctx.setLineDash([]);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '64px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🏛️', padX + winW / 2, padY + winH / 2 - 50);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 34px Prompt, Sarabun, sans-serif';
      ctx.fillText(`พื้นที่จัดแสดงผลงานนิทรรศการ (บูธที่ ${art.boothNumber})`, padX + winW / 2, padY + winH / 2 + 25);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '22px Prompt, Sarabun, sans-serif';
      ctx.fillText(`ห้อง ${room.name} • รอนักเรียนสร้างสรรค์ผลงาน`, padX + winW / 2, padY + winH / 2 + 75);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 22px Prompt, Sarabun, sans-serif';
      ctx.fillText('ผู้สร้างสามารถคลิกหรือกด [E] เพื่อติดตั้งผลงานได้ทันที', padX + winW / 2, padY + winH / 2 + 135);
      return;
    }

    // -------------------------------------------------------------
    // AUTHENTIC 3D EXHIBITION PROJECT SHOWCASE POSTER
    // -------------------------------------------------------------
    const grad = ctx.createLinearGradient(padX, padY, padX + winW, padY + winH);
    grad.addColorStop(0, '#090f1e');
    grad.addColorStop(0.5, '#1e293b');
    grad.addColorStop(1, '#090f1e');
    ctx.fillStyle = grad;
    ctx.fillRect(padX, padY, winW, winH);

    // Warm radial spotlight matching religion room color
    const spotGrad = ctx.createRadialGradient(padX + winW / 2, padY + winH / 2, 60, padX + winW / 2, padY + winH / 2, winW / 2);
    spotGrad.addColorStop(0, this.hexToRgba(color, 0.38));
    spotGrad.addColorStop(1, 'rgba(9, 15, 30, 0)');
    ctx.fillStyle = spotGrad;
    ctx.fillRect(padX, padY, winW, winH);

    // Fine golden / room-color border
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeRect(padX + 24, padY + 24, winW - 48, winH - 48);

    // Header Tag: Room & Booth Number
    ctx.fillStyle = this.hexToRgba(color, 0.25);
    ctx.beginPath();
    ctx.roundRect(padX + winW / 2 - 240, padY + 48, 480, 48, 24);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 22px Prompt, Sarabun, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${room.icon || '🏛️'} นิทรรศการ${room.name} • บูธที่ ${art.boothNumber}`, padX + winW / 2, padY + 80);

    // Room Icon Emblem
    ctx.fillStyle = '#ffffff';
    ctx.font = '64px sans-serif';
    ctx.fillText(room.icon || '🎨', padX + winW / 2, padY + 185);

    // Exhibition Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px Prompt, Sarabun, sans-serif';
    const displayTitle = art.title && art.title.length > 36 ? art.title.substring(0, 34) + '...' : (art.title || 'ผลงานนิทรรศการ');
    ctx.fillText(displayTitle, padX + winW / 2, padY + 265);

    // Golden underline accent
    ctx.fillStyle = color;
    ctx.fillRect(padX + winW / 2 - 120, padY + 285, 240, 4);

    // Creator & School Class
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '24px Prompt, Sarabun, sans-serif';
    ctx.fillText(`👨‍🎓 จัดทำโดย: ${art.creator || 'กลุ่มนักเรียน'} • ${art.schoolClass || 'โรงเรียนพัฒนานิคม'}`, padX + winW / 2, padY + 335);

    // Category Pill
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.roundRect(padX + winW / 2 - 160, padY + 365, 320, 42, 21);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 20px Prompt, Sarabun, sans-serif';
    ctx.fillText(`หมวด: ${art.category || 'เนื้อหาการเรียนรู้'}`, padX + winW / 2, padY + 394);

    // Concept excerpt
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '22px Prompt, Sarabun, sans-serif';
    const conceptExcerpt = (art.concept && art.concept.length > 140) ? art.concept.substring(0, 135) + '...' : (art.concept || 'คลิกเพื่อเข้าชมสไลด์เนื้อหาและการเรียนรู้ประจำบูธนี้');
    this.wrapText(ctx, conceptExcerpt, padX + winW / 2 - 440, padY + 455, 880, 36);

    // Interactive Call-To-Action (CTA) Pill
    const ctaW = 560;
    const ctaH = 64;
    const ctaX = padX + (winW - ctaW) / 2;
    const ctaY = padY + winH - 100;

    const ctaGrad = ctx.createLinearGradient(ctaX, ctaY, ctaX + ctaW, ctaY);
    ctaGrad.addColorStop(0, '#0284c7');
    ctaGrad.addColorStop(1, '#06b6d4');
    ctx.fillStyle = ctaGrad;
    ctx.beginPath();
    ctx.roundRect(ctaX, ctaY, ctaW, ctaH, 32);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px Prompt, Sarabun, sans-serif';
    ctx.fillText('▶️ กดเข้าชมสไลด์นำเสนอ (เปลี่ยนหน้าได้ทันที)', padX + winW / 2, ctaY + 41);
  }

  renderSlideOnCanvas(canvas, art, slideIndex = 0) {
    this.renderGalleryFrameOnCanvas(canvas, art);
  }

  // =========================================================================
  // 3D WALL PLAQUE / LABEL TAG (เหมือนในภาพตัวอย่าง พระประวัติ 👉)
  // =========================================================================
  createBoothPlaque(art, index, room) {
    const plaqueW = 1.5;
    const plaqueH = 0.8;
    const plaqueCanvas = document.createElement('canvas');
    plaqueCanvas.width = 512;
    plaqueCanvas.height = 272;

    this.renderPlaqueCanvas(plaqueCanvas, art, index, room);

    const plaqueTexture = new THREE.CanvasTexture(plaqueCanvas);
    plaqueTexture.minFilter = THREE.LinearFilter;
    plaqueTexture.magFilter = THREE.LinearFilter;
    plaqueTexture.generateMipmaps = false;

    const plaqueGeo = new THREE.PlaneGeometry(plaqueW, plaqueH);
    const plaqueMat = new THREE.MeshBasicMaterial({
      map: plaqueTexture,
      side: THREE.FrontSide
    });
    const plaqueMesh = new THREE.Mesh(plaqueGeo, plaqueMat);
    plaqueMesh.name = `art_plaque_${art.id}`;
    plaqueMesh.userData = { artwork: art, index: index };
    plaqueMesh.position.set(3.35, 0, 0.02);

    const backGeo = new THREE.BoxGeometry(plaqueW + 0.06, plaqueH + 0.06, 0.02);
    const backMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.5,
      metalness: 0.3
    });
    const backMesh = new THREE.Mesh(backGeo, backMat);
    backMesh.position.set(3.35, 0, 0.005);
    backMesh.userData = { artwork: art, index: index };

    const plaqueGroup = new THREE.Group();
    plaqueGroup.add(backMesh);
    plaqueGroup.add(plaqueMesh);

    return {
      group: plaqueGroup,
      mesh: plaqueMesh,
      canvas: plaqueCanvas,
      texture: plaqueTexture
    };
  }

  renderPlaqueCanvas(canvas, art, index, room) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;  // 512
    const h = canvas.height; // 272

    ctx.clearRect(0, 0, w, h);

    // Clean museum white plaque card
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(8, 8, w - 16, h - 16, 16);
    ctx.fill();

    // Bold yellow/gold accent border (เหมือนในภาพตัวอย่าง พระประวัติ 👉)
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 7;
    ctx.stroke();

    if (art.isEmpty) {
      // Empty booth plaque
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 22px Prompt, Sarabun, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`🏛️ บูธที่ ${art.boothNumber} (พื้นที่ว่าง)`, w / 2, 70);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '18px Prompt, Sarabun, sans-serif';
      ctx.fillText(`${room.icon} ${room.name}`, w / 2, 110);
      ctx.fillText('รอนักเรียนติดตั้งผลงาน', w / 2, 145);

      ctx.fillStyle = '#0284c7';
      ctx.font = 'bold 18px Prompt, Sarabun, sans-serif';
      ctx.fillText('👈 [คลิก/กด E] ติดตั้งผลงาน', w / 2, 210);
      return;
    }

    // Top Tag with Arrow pointing LEFT (towards the frame!)
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.roundRect(24, 22, 260, 38, 19);
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#b45309';
    ctx.font = 'bold 18px Prompt, Sarabun, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('👈 สไลด์นำเสนอผลงาน', 38, 47);

    // Like counter in top right
    ctx.fillStyle = '#f43f5e';
    ctx.font = 'bold 20px Prompt, Sarabun, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`❤️ ${art.likes || 0}`, w - 30, 48);

    // Artwork Title
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 26px Prompt, Sarabun, sans-serif';
    ctx.textAlign = 'left';
    const displayTitle = art.title.length > 22 ? art.title.substring(0, 20) + '...' : art.title;
    ctx.fillText(displayTitle, 28, 98);

    // Creator & Class
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 18px Prompt, Sarabun, sans-serif';
    ctx.fillText(`โดย: ${art.creator} (${art.schoolClass})`, 28, 134);

    // Category / Room
    ctx.fillStyle = '#64748b';
    ctx.font = '16px Prompt, Sarabun, sans-serif';
    ctx.fillText(`หมวด: ${art.category || room.name}`, 28, 168);

    // Action CTA Pill Button at bottom
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.roundRect(24, 194, w - 48, 52, 12);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Prompt, Sarabun, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('👈 คลิก หรือกด [E] เพื่อเปิดชมสไลด์', w / 2, 227);
  }

  // =========================================================================
  // ANIMATION LOOP & TEXTURE UPDATER
  // =========================================================================
  update(delta, playerPos) {
    this.clockTime += delta;

    // Artworks hang stably in authentic museum gallery frames (zero slideshow blinking)

    // 2. Animate 3D Floating Beacons above each booth
    for (let i = 0; i < this.beacons.length; i++) {
      const b = this.beacons[i];
      if (b) {
        b.diamond.rotation.y += delta * 1.4;
        b.ring.rotation.x += delta * 1.8;
        b.ring.rotation.y += delta * 1.1;
        b.group.position.y = b.baseY + Math.sin(this.clockTime * 2.4 + i * 0.7) * 0.12;
      }
    }

    // 3. Highlight 3D Floor Mat if player is nearby
    if (playerPos) {
      for (let i = 0; i < this.floorMats.length; i++) {
        const mat = this.floorMats[i];
        if (mat) {
          const dx = playerPos.x - mat.pos.x;
          const dz = playerPos.z - mat.pos.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          const isNear = dist < 2.5;
          if (isNear !== mat.isHighlighted) {
            mat.isHighlighted = isNear;
            this.renderFloorMatCanvas(mat.canvas, this.artworks[i], i, this.getCurrentRoomInfo(), isNear);
            mat.texture.needsUpdate = true;
          }
          if (isNear) {
            mat.material.opacity = 0.85 + Math.sin(this.clockTime * 5) * 0.12;
          } else {
            mat.material.opacity = 0.65;
          }
        }
      }
    }
  }

  updatePosterTexture(index) {
    const canvas = this.boothCanvases[index];
    const texture = this.boothTextures[index];
    const art = this.artworks[index];
    if (canvas && texture && art) {
      this.renderGalleryFrameOnCanvas(canvas, art);
      texture.needsUpdate = true;
    }

    // Also update plaque canvas & texture
    const plaque = this.plaques[index];
    if (plaque && plaque.canvas && plaque.texture && art) {
      this.renderPlaqueCanvas(plaque.canvas, art, index, this.getCurrentRoomInfo());
      plaque.texture.needsUpdate = true;
    }
  }

  generateArtworkPosterTexture(art) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 680;
    this.renderSlideOnCanvas(canvas, art, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
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

  checkProximity(playerPos) {
    let closestArt = null;
    let minDistance = 4.2; // Trigger when approaching booth viewing zone

    for (const frame of this.frameMeshes) {
      const art = frame.userData.artwork;
      if (!art) continue;
      const dx = playerPos.x - art.pos.x;
      const dz = playerPos.z - art.pos.z;
      const horizontalDist = Math.sqrt(dx * dx + dz * dz);
      if (horizontalDist < minDistance) {
        minDistance = horizontalDist;
        closestArt = art;
      }
    }

    // Auto-project closest booth slides onto front classroom screen when standing at booth
    if (closestArt && this.world && this.world.drawClassroomSlideForArtwork) {
      if (this.lastProjectedArtId !== closestArt.id) {
        this.lastProjectedArtId = closestArt.id;
        this.world.drawClassroomSlideForArtwork(closestArt);
      }
    } else if (!closestArt && this.lastProjectedArtId !== null) {
      // Step away from booth -> restore room's designated religion slide
      this.lastProjectedArtId = null;
      if (this.world && this.world.drawWelcomeScreen) {
        this.world.drawWelcomeScreen();
      }
    }

    return closestArt;
  }

  setBoothArtwork(boothNumber, data) {
    const index = boothNumber - 1;
    if (index >= 0 && index < this.artworks.length) {
      this.artworks[index] = {
        ...this.artworks[index],
        ...data,
        roomId: this.currentRoomId,
        boothNumber: boothNumber,
        isEmpty: false,
        likes: this.artworks[index].likes || 0,
        likedBy: this.artworks[index].likedBy || [],
        checkins: this.artworks[index].checkins || [],
        quizQuestions: data.quizQuestions || this.artworks[index].quizQuestions || this.getDefaultQuestionsForRoom(this.currentRoomId, boothNumber)
      };

      // Immediate in-memory cover caching for instantaneous 3D wall display
      const coverUrl = data.coverImageUrl || (data.presentationFile && data.presentationFile.coverUrl);
      if (coverUrl) {
        if (!this.loadedCoverImages) this.loadedCoverImages = {};
        const img = new Image();
        img._src = coverUrl;
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          this.updatePosterTexture(index);
        };
        img.src = coverUrl;
        const cacheKey = this.artworks[index].id || `r${this.currentRoomId}_b${boothNumber}`;
        this.loadedCoverImages[cacheKey] = img;
        this.loadedCoverImages[boothNumber] = img;
      }

      this.saveExhibitionData();
      this.refreshAllFrames();

      // 1. Persist to Server and receive final persistent cover URL
      this.saveBoothToServer(this.currentRoomId, boothNumber, this.artworks[index]).then(res => {
        if (res && res.artwork && res.artwork.coverImageUrl) {
          this.artworks[index].coverImageUrl = res.artwork.coverImageUrl;
          if (res.artwork.presentationFile && this.artworks[index].presentationFile) {
            this.artworks[index].presentationFile.coverUrl = res.artwork.coverImageUrl;
          }
          this.updatePosterTexture(index);
        }
      });

      // 2. Broadcast to all online peers (visitors, teachers, other students)
      if (window.app && window.app.multiplayer) {
        window.app.multiplayer.broadcastBoothUpdate(this.currentRoomId, boothNumber, this.artworks[index]);
      }

      return this.artworks[index];
    }
    return null;
  }

  resetBooth(boothNumber) {
    const index = boothNumber - 1;
    if (index >= 0 && index < this.artworks.length) {
      const slot = this.boothSlots[index];
      const room = this.getCurrentRoomInfo();
      this.artworks[index] = {
        id: `${slot.id}_r${this.currentRoomId}`,
        roomId: this.currentRoomId,
        boothNumber: boothNumber,
        title: `บูธที่ ${boothNumber}: ${room.name} (พื้นที่ว่าง)`,
        creator: 'ยังไม่มีผลงานติดตั้ง',
        schoolClass: 'รอนักเรียนสร้างสรรค์',
        category: 'ยังไม่ได้ระบุหัวข้อ',
        concept: `พื้นที่จัดแสดงผลงานนิทรรศการนี้ยังว่างอยู่ นักเรียนกลุ่มที่ได้รับมอบหมายหัวข้อ "${room.name}" สามารถกดปุ่ม [ 🎨 สร้างนิทรรศการ ] เพื่อติดตั้งผลงานได้เลยครับ`,
        audioText: `ยินดีต้อนรับสู่บูธที่ ${boothNumber} ของ ${room.name} พื้นที่นี้กำลังเปิดรับผลงานจากนักเรียนครับ`,
        themeColor: room.color || '#475569',
        imageURL: null,
        likes: 0,
        likedBy: [],
        checkins: [],
        quizQuestions: this.getDefaultQuestionsForRoom(this.currentRoomId, boothNumber),
        presentationFile: null,
        isEmpty: true,
        pos: slot.pos,
        rotY: slot.rotY
      };
      this.saveExhibitionData();
      this.refreshAllFrames();

      // Reset on server
      try {
        fetch('/api/reset_booth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId: this.currentRoomId, boothNumber })
        });
      } catch (e) {}

      // Broadcast reset to peers
      if (window.app && window.app.multiplayer) {
        window.app.multiplayer.broadcastBoothReset(this.currentRoomId, boothNumber);
      }

      return true;
    }
    return false;
  }

  likeArtwork(artworkId, userProfile = null) {
    const art = this.artworks.find(a => a && (a.id === artworkId || String(a.boothNumber) === String(artworkId)));
    if (art) {
      art.likes = (art.likes || 0) + 1;
      art.likedBy = art.likedBy || [];
      const rId = String(art.roomId || this.currentRoomId);
      const roomInfo = RELIGIOUS_ROOMS[rId] || this.getCurrentRoomInfo();
      if (userProfile) {
        art.likedBy.push({
          id: 'like_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          name: userProfile.name || 'นักเรียน',
          studentId: userProfile.studentId || '-',
          studentClass: userProfile.studentClass || 'ม.3',
          boothId: art.id,
          boothTitle: art.title,
          boothNumber: art.boothNumber,
          roomId: rId,
          roomName: roomInfo.name,
          timestamp: new Date().toISOString()
        });
      }
      this.saveExhibitionData();
      this.refreshAllFrames();

      // Send to server
      try {
        fetch('/api/like', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId: rId, boothId: art.id, userProfile: art.likedBy[art.likedBy.length - 1] })
        });
      } catch (e) {}

      // Broadcast like
      if (window.app && window.app.multiplayer) {
        window.app.multiplayer.broadcastBoothLike(rId, art.id, art.likes);
      }

      return art.likes;
    }
    return 0;
  }

  checkinArtwork(artworkId, userProfile, answers) {
    const art = this.artworks.find(a => a && (a.id === artworkId || String(a.boothNumber) === String(artworkId)));
    if (!art) return { success: false, passed: false, score: 0, total: 5, message: 'ไม่พบข้อมูลบูธนี้' };

    const rId = String(art.roomId || this.currentRoomId);
    const roomInfo = RELIGIOUS_ROOMS[rId] || this.getCurrentRoomInfo();

    art.quizQuestions = art.quizQuestions || this.getDefaultQuestionsForRoom(rId, art.boothNumber);
    art.checkins = art.checkins || [];

    const questions = art.quizQuestions;
    let score = 0;
    const total = questions.length || 5;

    const results = questions.map((q, idx) => {
      const studentAns = answers[idx]; // 0, 1, 2, 3
      const isCorrect = (studentAns !== undefined && studentAns !== null && parseInt(studentAns) === parseInt(q.answer));
      if (isCorrect) score++;
      return {
        questionIndex: idx,
        questionText: q.question,
        userAnswer: studentAns,
        correctAnswer: q.answer,
        isCorrect: isCorrect,
        explanation: q.explanation || ''
      };
    });

    // Passing criteria: at least 3 out of 5 correct (>= 60%)
    const passed = (score >= 3);

    const record = {
      id: 'chk_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      studentName: userProfile.name || 'นักเรียน',
      studentId: userProfile.studentId || '-',
      studentClass: userProfile.studentClass || 'ม.3 โรงเรียนพัฒนานิคม',
      score: score,
      total: total,
      passed: passed,
      boothId: art.id,
      boothTitle: art.title,
      boothNumber: art.boothNumber,
      roomId: rId,
      roomName: roomInfo.name,
      timestamp: new Date().toISOString()
    };

    if (passed) {
      // Upsert: replace previous checkin if the same student checked in before (by studentId or name)
      const existingIdx = art.checkins.findIndex(c =>
        (c.studentId && record.studentId && c.studentId !== '-' && record.studentId !== '-' && c.studentId === record.studentId) ||
        (c.studentName && record.studentName && c.studentName === record.studentName)
      );
      if (existingIdx >= 0) {
        art.checkins[existingIdx] = record;
      } else {
        art.checkins.push(record);
      }
      this.saveExhibitionData();

      // Persist to server
      try {
        fetch('/api/checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId: rId, boothId: art.id, record: record })
        });
      } catch (e) {}

      // Broadcast checkin
      if (window.app && window.app.multiplayer) {
        window.app.multiplayer.broadcastBoothCheckin(rId, art.id, record);
      }
    }

    return {
      success: passed,
      passed: passed,
      score: score,
      total: total,
      record: record,
      results: results
    };
  }

  getAllRoomsData() {
    const allRooms = {};
    for (let r = 1; r <= 5; r++) {
      const rStr = r.toString();
      const defaults = this.createEmptyBoothsForRoom(rStr);
      const key = `spatial_metaverse_exhibition_room_${rStr}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            allRooms[rStr] = parsed.map((b, idx) => {
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
          } else {
            allRooms[rStr] = defaults;
          }
        } catch (e) {
          allRooms[rStr] = defaults;
        }
      } else if (rStr === this.currentRoomId.toString() && Array.isArray(this.artworks) && this.artworks.length === 8) {
        allRooms[rStr] = this.artworks.map((b, idx) => b || defaults[idx]);
      } else {
        allRooms[rStr] = defaults;
      }
    }
    return allRooms;
  }

  getAllCheckins(filterRoomId = null) {
    const allRooms = this.getAllRoomsData();
    const allCheckins = [];
    for (const roomId in allRooms) {
      if (filterRoomId && filterRoomId !== 'all' && roomId.toString() !== filterRoomId.toString()) continue;
      const booths = allRooms[roomId];
      if (Array.isArray(booths)) {
        booths.forEach(booth => {
          if (booth && booth.checkins && Array.isArray(booth.checkins)) {
            booth.checkins.forEach(chk => {
              allCheckins.push({
                ...chk,
                roomId: roomId,
                roomInfo: RELIGIOUS_ROOMS[roomId] || { name: `ห้อง ${roomId}` },
                boothTitle: booth.title,
                boothNumber: booth.boothNumber
              });
            });
          }
        });
      }
    }
    allCheckins.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
    return allCheckins;
  }

  getAllLikes(filterRoomId = null) {
    const allRooms = this.getAllRoomsData();
    const allLikes = [];
    for (const roomId in allRooms) {
      if (filterRoomId && filterRoomId !== 'all' && roomId.toString() !== filterRoomId.toString()) continue;
      const booths = allRooms[roomId];
      if (Array.isArray(booths)) {
        booths.forEach(booth => {
          if (booth && booth.likedBy && Array.isArray(booth.likedBy)) {
            booth.likedBy.forEach(like => {
              allLikes.push({
                ...like,
                roomId: roomId,
                roomInfo: RELIGIOUS_ROOMS[roomId] || { name: `ห้อง ${roomId}` },
                boothTitle: booth.title,
                boothNumber: booth.boothNumber
              });
            });
          }
        });
      }
    }
    allLikes.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
    return allLikes;
  }

  clearCheckins(roomId = 'all') {
    const allRooms = this.getAllRoomsData();
    const roomsToClear = (roomId === 'all') ? [1, 2, 3, 4, 5] : [parseInt(roomId)];
    roomsToClear.forEach(r => {
      const booths = allRooms[r] || [];
      booths.forEach(b => {
        if (b) b.checkins = [];
      });
      localStorage.setItem(`spatial_metaverse_exhibition_room_${r}`, JSON.stringify(booths));
      if (this.currentRoomId.toString() === r.toString()) {
        this.artworks = booths;
      }
    });

    fetch('/api/clear_checkins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId: roomId })
    }).catch(() => {});
  }

  deleteCheckinRecord(roomId, boothId, studentName, timestamp) {
    const r = parseInt(roomId);
    const allRooms = this.getAllRoomsData();
    const booths = allRooms[r] || [];
    booths.forEach(b => {
      if (b && (b.id === boothId || !boothId) && b.checkins) {
        b.checkins = b.checkins.filter(c => !(
          c.studentName === studentName && (!timestamp || c.timestamp === timestamp)
        ));
      }
    });
    localStorage.setItem(`spatial_metaverse_exhibition_room_${r}`, JSON.stringify(booths));
    if (this.currentRoomId.toString() === r.toString()) {
      this.artworks = booths;
    }

    fetch('/api/delete_checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId: roomId, boothId: boothId, studentName: studentName, timestamp: timestamp })
    }).catch(() => {});
  }

  clearLikes(roomId = 'all') {
    const allRooms = this.getAllRoomsData();
    const roomsToClear = (roomId === 'all') ? [1, 2, 3, 4, 5] : [parseInt(roomId)];
    roomsToClear.forEach(r => {
      const booths = allRooms[r] || [];
      booths.forEach(b => {
        if (b) {
          b.likes = 0;
          b.likedBy = [];
        }
      });
      localStorage.setItem(`spatial_metaverse_exhibition_room_${r}`, JSON.stringify(booths));
      if (this.currentRoomId.toString() === r.toString()) {
        this.artworks = booths;
        this.refreshAllFrames();
      }
    });

    fetch('/api/clear_likes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId: roomId })
    }).catch(() => {});
  }

  deleteLikeRecord(roomId, boothId, studentName, timestamp) {
    const r = parseInt(roomId);
    const allRooms = this.getAllRoomsData();
    const booths = allRooms[r] || [];
    booths.forEach(b => {
      if (b && (b.id === boothId || !boothId) && b.likedBy) {
        b.likedBy = b.likedBy.filter(l => !(
          (l.name === studentName || l.studentName === studentName) && (!timestamp || l.timestamp === timestamp)
        ));
        b.likes = b.likedBy.length;
      }
    });
    localStorage.setItem(`spatial_metaverse_exhibition_room_${r}`, JSON.stringify(booths));
    if (this.currentRoomId.toString() === r.toString()) {
      this.artworks = booths;
      this.refreshAllFrames();
    }

    fetch('/api/delete_like', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId: roomId, boothId: boothId, studentName: studentName, timestamp: timestamp })
    }).catch(() => {});
  }

  getOverallAnalytics() {
    const checkins = this.getAllCheckins('all');
    const likes = this.getAllLikes('all');
    const allRooms = this.getAllRoomsData();

    const uniqueStudents = new Set();
    checkins.forEach(c => {
      const id = (c.studentId && c.studentId !== '-') ? c.studentId : c.studentName;
      if (id) uniqueStudents.add(id);
    });

    const passedCount = checkins.filter(c => c.passed).length;
    const passRate = checkins.length > 0 ? Math.round((passedCount / checkins.length) * 100) : 0;
    const avgScore = checkins.length > 0 ? (checkins.reduce((acc, c) => acc + (c.score || 0), 0) / checkins.length).toFixed(1) : '0.0';

    // Top booths by checkins
    const boothStats = [];
    for (const roomId in allRooms) {
      const booths = allRooms[roomId];
      if (Array.isArray(booths)) {
        booths.forEach(b => {
          if (b && !b.isEmpty) {
            boothStats.push({
              id: b.id,
              title: b.title,
              creator: b.creator,
              roomId: roomId,
              roomName: (RELIGIOUS_ROOMS[roomId] || {}).name || `ห้อง ${roomId}`,
              checkinsCount: (b.checkins || []).length,
              likesCount: b.likes || 0
            });
          }
        });
      }
    }

    boothStats.sort((a, b) => b.checkinsCount - a.checkinsCount);

    return {
      totalCheckins: checkins.length,
      passedCheckins: passedCount,
      uniqueStudentsCount: uniqueStudents.size,
      passRate: passRate,
      averageScore: avgScore,
      totalLikes: likes.length,
      topBooths: boothStats.slice(0, 5)
    };
  }

  playAudioGuide(text) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'th-TH';
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }

  exportToJSON() {
    const allData = {
      exportDate: new Date().toISOString(),
      currentRoomId: this.currentRoomId,
      roomInfo: this.getCurrentRoomInfo(),
      booths: this.artworks
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(allData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `spatial_metaverse_${this.getCurrentRoomInfo().name.replace(/[^a-zA-Z0-9ก-๙]/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  importFromJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.booths && Array.isArray(parsed.booths) && parsed.booths.length === 8) {
        if (parsed.currentRoomId && RELIGIOUS_ROOMS[parsed.currentRoomId]) {
          this.currentRoomId = parsed.currentRoomId;
        }
        this.artworks = parsed.booths;
        this.saveExhibitionData();
        this.refreshAllFrames();
        return true;
      } else if (Array.isArray(parsed) && parsed.length === 8) {
        this.artworks = parsed;
        this.saveExhibitionData();
        this.refreshAllFrames();
        return true;
      }
    } catch (e) {
      alert('รูปแบบไฟล์ JSON ไม่ถูกต้อง');
    }
    return false;
  }
}

window.ExhibitionManager = ExhibitionManager;
window.RELIGIOUS_ROOMS = RELIGIOUS_ROOMS;
