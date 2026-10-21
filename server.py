#!/usr/bin/env python3
"""
Custom HTTP Server with Persistent API for Spatial Metaverse
Provides static file serving + JSON persistence for exhibition booths, check-ins, likes,
sticky notes, real-time peer presence synchronization, and decoupled presentation storage.
"""

import sys
import os
import time
import json
import base64
import subprocess
import urllib.parse
import zipfile
import io
from threading import Lock
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

def extract_pptx_cover(raw_bytes, out_path):
    """Extract first slide thumbnail or image from PPTX zip structure"""
    try:
        with zipfile.ZipFile(io.BytesIO(raw_bytes)) as z:
            # 1. Search for thumbnail in docProps
            for name in z.namelist():
                lower = name.lower()
                if 'thumbnail' in lower and (lower.endswith('.jpeg') or lower.endswith('.jpg') or lower.endswith('.png')):
                    with z.open(name) as src, open(out_path, 'wb') as dst:
                        dst.write(src.read())
                    return True
            # 2. Search for any slide 1 image in ppt/media/
            media_files = [n for n in z.namelist() if n.lower().startswith('ppt/media/') and (n.lower().endswith('.jpg') or n.lower().endswith('.jpeg') or n.lower().endswith('.png'))]
            if media_files:
                media_files.sort()
                with z.open(media_files[0]) as src, open(out_path, 'wb') as dst:
                    dst.write(src.read())
                return True
    except Exception as e:
        print(f"PPTX cover extraction exception: {e}", file=sys.stderr)
    return False

PORT = int(os.environ.get('PORT', sys.argv[1] if len(sys.argv) > 1 else 8080))
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'spatial-metaverse', 'data')
UPLOADS_DIR = os.path.join(DATA_DIR, 'uploads')
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(UPLOADS_DIR, exist_ok=True)

peers_lock = Lock()
ONLINE_PEERS = {}  # peer_id -> dict with last_seen

def get_presentation_binary_file(room_id, booth_num):
    """
    Returns (binary_filepath, content_type) for the requested presentation.
    If binary .pdf/.pptx doesn't exist yet but .dat exists, extracts once and caches to disk.
    """
    pdf_fp = os.path.join(UPLOADS_DIR, f'pres_r{room_id}_b{booth_num}.pdf')
    pptx_fp = os.path.join(UPLOADS_DIR, f'pres_r{room_id}_b{booth_num}.pptx')
    dat_fp = os.path.join(UPLOADS_DIR, f'pres_r{room_id}_b{booth_num}.dat')

    if os.path.exists(pdf_fp):
        return pdf_fp, 'application/pdf'
    if os.path.exists(pptx_fp):
        return pptx_fp, 'application/vnd.ms-powerpoint'

    if os.path.exists(dat_fp):
        try:
            with open(dat_fp, 'r', encoding='utf-8') as f:
                data_url = f.read()
            if ',' in data_url:
                header, b64_data = data_url.split(',', 1)
                is_ppt = 'presentation' in header or 'powerpoint' in header
                target_fp = pptx_fp if is_ppt else pdf_fp
                content_type = 'application/vnd.ms-powerpoint' if is_ppt else 'application/pdf'
                with open(target_fp, 'wb') as out_f:
                    out_f.write(base64.b64decode(b64_data))
                return target_fp, content_type
        except Exception as e:
            print(f"Error extracting binary presentation: {e}", file=sys.stderr)

    return None, 'application/pdf'

def get_room_filepath(room_id):
    safe_room = str(room_id).replace('/', '').replace('\\', '')
    return os.path.join(DATA_DIR, f'booths_room_{safe_room}.json')

def get_default_empty_booth(room_id, booth_num):
    return {
        "id": f"booth_{booth_num}_r{room_id}",
        "roomId": str(room_id),
        "boothNumber": booth_num,
        "title": f"บูธที่ {booth_num} (พื้นที่ว่าง)",
        "creator": "ยังไม่มีผลงานติดตั้ง",
        "schoolClass": "รอนักเรียนสร้างสรรค์",
        "category": "ยังไม่ได้ระบุหัวข้อ",
        "concept": "พื้นที่จัดแสดงผลงานนิทรรศการนี้ยังว่างอยู่",
        "audioText": "",
        "themeColor": "#475569",
        "imageURL": None,
        "likes": 0,
        "likedBy": [],
        "checkins": [],
        "presentationFile": None,
        "isEmpty": True
    }

def load_room_booths(room_id):
    filepath = get_room_filepath(room_id)
    booths = []
    if os.path.exists(filepath):
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                booths = json.load(f)
        except Exception as e:
            print(f"Error loading room {room_id}: {e}", file=sys.stderr)
            booths = []

    if not isinstance(booths, list):
        booths = []

    # Guarantee exactly 8 non-None booth dicts
    while len(booths) < 8:
        booths.append(None)
    for i in range(8):
        if not booths[i] or not isinstance(booths[i], dict):
            booths[i] = get_default_empty_booth(room_id, i + 1)
        else:
            booths[i].setdefault('checkins', [])
            booths[i].setdefault('likedBy', [])
            booths[i].setdefault('likes', len(booths[i].get('likedBy', [])))
            booths[i].setdefault('id', f"booth_{i + 1}_r{room_id}")
            booths[i].setdefault('boothNumber', i + 1)
            booths[i].setdefault('roomId', str(room_id))

    return booths

def save_room_booths(room_id, booths):
    filepath = get_room_filepath(room_id)
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(booths, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"Error saving room {room_id}: {e}", file=sys.stderr)
        return False

def get_notes_filepath():
    return os.path.join(DATA_DIR, 'notes.json')

def load_notes():
    fp = get_notes_filepath()
    if os.path.exists(fp):
        try:
            with open(fp, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            pass
    return None

def save_notes(notes):
    fp = get_notes_filepath()
    try:
        with open(fp, 'w', encoding='utf-8') as f:
            json.dump(notes, f, ensure_ascii=False, indent=2)
        return True
    except Exception:
        return False

class MetaverseHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable full CORS and Range support across all responses
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Range, Authorization, Accept, X-Requested-With')
        self.send_header('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges')
        self.send_header('Accept-Ranges', 'bytes')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Range, Authorization, Accept, X-Requested-With')
        self.send_header('Access-Control-Max-Age', '86400')
        self.end_headers()

    def do_HEAD(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        if path == '/api/presentation':
            room_id = query.get('room', ['1'])[0]
            booth_num = query.get('booth', ['1'])[0]
            bin_fp, content_type = get_presentation_binary_file(room_id, booth_num)
            if bin_fp and os.path.exists(bin_fp):
                file_size = os.path.getsize(bin_fp)
                self.send_response(200)
                self.send_header('Content-Type', content_type)
                self.send_header('Content-Length', str(file_size))
                self.send_header('Accept-Ranges', 'bytes')
                self.send_header('Cache-Control', 'public, max-age=86400')
                self.end_headers()
                return
            self.send_response(404)
            self.end_headers()
            return


        if path == '/api/cover':
            room_id = query.get('room', ['1'])[0]
            booth_num = query.get('booth', ['1'])[0]
            cover_fp = os.path.join(UPLOADS_DIR, f'cover_r{room_id}_b{booth_num}.jpg')
            if os.path.exists(cover_fp):
                self.send_response(200)
                self.send_header('Content-Type', 'image/jpeg')
                self.send_header('Content-Length', str(os.path.getsize(cover_fp)))
                self.send_header('Accept-Ranges', 'bytes')
                self.end_headers()
                return
            self.send_response(404)
            self.end_headers()
            return

        for prefix in ['/js/', '/css/', '/assets/']:
            if path.startswith(prefix):
                self.path = '/spatial-metaverse' + self.path
                break
        super().do_HEAD()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        # API: Get Booths for a specific religion room (Lightweight, < 5KB)
        if path == '/api/booths':
            room_id = query.get('room', ['1'])[0]
            booths = load_room_booths(room_id)
            self.send_json_response({'success': True, 'roomId': room_id, 'booths': booths})
            return

        # API: Get presentation file decoupled from booth list
        if path == '/api/presentation':
            room_id = query.get('room', ['1'])[0]
            booth_num = query.get('booth', ['1'])[0]
            format_type = query.get('format', ['raw'])[0]

            if format_type == 'json':
                upload_fp = os.path.join(UPLOADS_DIR, f'pres_r{room_id}_b{booth_num}.dat')
                if os.path.exists(upload_fp):
                    try:
                        with open(upload_fp, 'r', encoding='utf-8') as f:
                            data_url = f.read()
                        self.send_json_response({'success': True, 'dataUrl': data_url})
                        return
                    except Exception as e:
                        self.send_json_response({'success': False, 'error': str(e)}, 500)
                        return

            bin_fp, content_type = get_presentation_binary_file(room_id, booth_num)
            if bin_fp and os.path.exists(bin_fp):
                try:
                    total_len = os.path.getsize(bin_fp)
                    ext = 'pptx' if 'powerpoint' in content_type else 'pdf'
                    filename = f"presentation_r{room_id}_b{booth_num}.{ext}"

                    # Handle HTTP Range requests with fast file seek
                    range_header = self.headers.get('Range')
                    if range_header and range_header.startswith('bytes='):
                        try:
                            r_part = range_header.replace('bytes=', '').strip()
                            parts = r_part.split('-')
                            start = int(parts[0]) if parts[0] else 0
                            end = int(parts[1]) if len(parts) > 1 and parts[1] else total_len - 1
                            if start >= total_len:
                                self.send_response(416)
                                self.send_header('Content-Range', f'bytes */{total_len}')
                                self.end_headers()
                                return
                            end = min(end, total_len - 1)
                            chunk_len = end - start + 1
                            self.send_response(206)
                            self.send_header('Content-Type', content_type)
                            self.send_header('Content-Range', f'bytes {start}-{end}/{total_len}')
                            self.send_header('Content-Length', str(chunk_len))
                            self.send_header('Accept-Ranges', 'bytes')
                            self.send_header('Cache-Control', 'public, max-age=86400')
                            self.send_header('Content-Disposition', f'inline; filename="{filename}"')
                            self.end_headers()
                            with open(bin_fp, 'rb') as f:
                                f.seek(start)
                                left = chunk_len
                                while left > 0:
                                    read_size = min(left, 262144)
                                    chunk = f.read(read_size)
                                    if not chunk:
                                        break
                                    self.wfile.write(chunk)
                                    left -= len(chunk)
                            return
                        except Exception as re:
                            print(f"Range handling fallback: {re}", file=sys.stderr)

                    # Full file streaming
                    self.send_response(200)
                    self.send_header('Content-Type', content_type)
                    self.send_header('Content-Length', str(total_len))
                    self.send_header('Accept-Ranges', 'bytes')
                    self.send_header('Cache-Control', 'public, max-age=86400')
                    self.send_header('Content-Disposition', f'inline; filename="{filename}"')
                    self.end_headers()
                    with open(bin_fp, 'rb') as f:
                        while True:
                            chunk = f.read(262144)
                            if not chunk:
                                break
                            self.wfile.write(chunk)
                    return
                except Exception as e:
                    self.send_json_response({'success': False, 'error': str(e)}, 500)
                    return
            self.send_json_response({'success': False, 'error': 'Presentation not found'}, 404)
            return


        # API: Get presentation cover image (Lightweight JPEG, ~150KB)
        if path == '/api/cover':
            room_id = query.get('room', ['1'])[0]
            booth_num = query.get('booth', ['1'])[0]
            cover_fp = os.path.join(UPLOADS_DIR, f'cover_r{room_id}_b{booth_num}.jpg')

            # Auto-extract if missing but presentation file exists
            if not os.path.exists(cover_fp):
                pres_fp = os.path.join(UPLOADS_DIR, f'pres_r{room_id}_b{booth_num}.dat')
                if os.path.exists(pres_fp):
                    try:
                        with open(pres_fp, 'r', encoding='utf-8') as pf:
                            p_data = pf.read()
                        if ',' in p_data and ('presentation' in p_data or 'powerpoint' in p_data):
                            _, b64_p = p_data.split(',', 1)
                            extract_pptx_cover(base64.b64decode(b64_p), cover_fp)
                    except Exception as ee:
                        print(f"Auto-extract cover error: {ee}", file=sys.stderr)

            if os.path.exists(cover_fp):
                try:
                    with open(cover_fp, 'rb') as f:
                        img_bytes = f.read()
                    self.send_response(200)
                    self.send_header('Content-Type', 'image/jpeg')
                    self.send_header('Content-Length', str(len(img_bytes)))
                    self.send_header('Cache-Control', 'public, max-age=60')
                    self.send_header('Accept-Ranges', 'bytes')
                    self.end_headers()
                    self.wfile.write(img_bytes)
                    return
                except Exception as e:
                    self.send_json_response({'success': False, 'error': str(e)}, 500)
                    return
            self.send_json_response({'success': False, 'error': 'Cover not found'}, 404)
            return

        # API: Real-time active peers in room
        if path == '/api/peers':
            room_id = str(query.get('room', ['1'])[0])
            now = time.time()
            with peers_lock:
                active_peers = [p for p in ONLINE_PEERS.values() if p.get('room') == room_id and (now - p.get('lastSeen', 0)) < 5.0]
            self.send_json_response({'success': True, 'roomId': room_id, 'peers': active_peers})
            return

        # API: Sticky Notes
        if path == '/api/notes':
            notes = load_notes()
            self.send_json_response({'success': True, 'notes': notes})
            return

        # API: Get all stats for Teacher Dashboard
        if path == '/api/teacher_stats':
            stats = {}
            for r in ['1', '2', '3', '4', '5']:
                stats[r] = load_room_booths(r)
            notes = load_notes()
            self.send_json_response({'success': True, 'stats': stats, 'notes': notes})
            return

        # Direct root serving: load spatial-metaverse directly without redirect
        if path == '/' or path == '/index.html':
            metaverse_index = os.path.join(BASE_DIR, 'spatial-metaverse', 'index.html')
            if os.path.exists(metaverse_index):
                with open(metaverse_index, 'rb') as f:
                    content = f.read()
                self.send_response(200)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.send_header('Content-Length', str(len(content)))
                self.end_headers()
                self.wfile.write(content)
                return

        # Rewrite static assets if requested from root
        for prefix in ['/js/', '/css/', '/assets/']:
            if path.startswith(prefix):
                self.path = '/spatial-metaverse' + self.path
                break

        # Static files fallback
        super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length) if content_length > 0 else b'{}'

        try:
            data = json.loads(body.decode('utf-8'))
        except Exception:
            data = {}

        # API: Save or Update a single Booth Artwork
        if path == '/api/save_booth':
            room_id = str(data.get('roomId', '1'))
            booth_num = int(data.get('boothNumber', 1))
            artwork = data.get('artwork')

            if not artwork:
                self.send_json_response({'success': False, 'error': 'Missing artwork'}, 400)
                return

            cover_fp = os.path.join(UPLOADS_DIR, f'cover_r{room_id}_b{booth_num}.jpg')
            cover_api_url = f'/api/cover?room={room_id}&booth={booth_num}'

            # 1. Check if client explicitly sent base64 coverImageUrl (e.g. from PDF.js or Image)
            client_cover = artwork.get('coverImageUrl')
            if client_cover and isinstance(client_cover, str) and ',' in client_cover and len(client_cover) > 100:
                try:
                    _, b64_cov = client_cover.split(',', 1)
                    with open(cover_fp, 'wb') as cf:
                        cf.write(base64.b64decode(b64_cov))
                    artwork['coverImageUrl'] = cover_api_url
                    if artwork.get('presentationFile') and isinstance(artwork['presentationFile'], dict):
                        artwork['presentationFile']['coverUrl'] = cover_api_url
                    print(f"✅ Saved client-extracted cover for r{room_id}_b{booth_num}")
                except Exception as ex:
                    print(f"Error saving client cover image: {ex}", file=sys.stderr)

            # Decouple large presentation file from main booth array
            pres_file = artwork.get('presentationFile')
            if pres_file and isinstance(pres_file, dict):
                # Also check pres_file coverUrl if base64
                pres_cover = pres_file.get('coverUrl')
                if pres_cover and isinstance(pres_cover, str) and ',' in pres_cover and not os.path.exists(cover_fp):
                    try:
                        _, b64_cov = pres_cover.split(',', 1)
                        with open(cover_fp, 'wb') as cf:
                            cf.write(base64.b64decode(b64_cov))
                        artwork['coverImageUrl'] = cover_api_url
                        pres_file['coverUrl'] = cover_api_url
                    except Exception as ex:
                        print(f"Error saving pres cover: {ex}", file=sys.stderr)

                data_url = pres_file.get('dataUrl')
                if data_url and len(data_url) > 1000:
                    upload_fp = os.path.join(UPLOADS_DIR, f'pres_r{room_id}_b{booth_num}.dat')
                    try:
                        with open(upload_fp, 'w', encoding='utf-8') as f:
                            f.write(data_url)
                        pres_file['downloadUrl'] = f'/api/presentation?room={room_id}&booth={booth_num}'

                        # Save raw binary directly for instant streaming
                        if ',' in data_url:
                            _, b64_part = data_url.split(',', 1)
                            raw_bytes = base64.b64decode(b64_part)

                            is_pptx = pres_file.get('type') == 'ppt' or (pres_file.get('name') and str(pres_file['name']).endswith('.pptx'))
                            bin_ext = 'pptx' if (is_pptx or b'PK\x03\x04' in raw_bytes[:10]) else 'pdf'
                            bin_fp = os.path.join(UPLOADS_DIR, f'pres_r{room_id}_b{booth_num}.{bin_ext}')
                            try:
                                with open(bin_fp, 'wb') as bf:
                                    bf.write(raw_bytes)
                            except Exception as be:
                                print(f"Error saving binary file: {be}", file=sys.stderr)

                            # If PPTX cover
                            if (is_pptx or b'PK\x03\x04' in raw_bytes[:10]) and not os.path.exists(cover_fp):
                                if extract_pptx_cover(raw_bytes, cover_fp):
                                    artwork['coverImageUrl'] = cover_api_url
                                    pres_file['coverUrl'] = cover_api_url
                                    print(f"✅ Extracted PPTX cover for r{room_id}_b{booth_num}")

                            # If direct image
                            elif 'image' in data_url[:40] and not os.path.exists(cover_fp):
                                with open(cover_fp, 'wb') as cf:
                                    cf.write(raw_bytes)
                                artwork['coverImageUrl'] = cover_api_url
                                pres_file['coverUrl'] = cover_api_url

                        # Strip massive dataUrl from saved JSON
                        del pres_file['dataUrl']
                    except Exception as e:
                        print(f"Error saving presentation upload: {e}", file=sys.stderr)


            # Ensure coverUrl is set if cover file exists on disk
            if os.path.exists(cover_fp):
                if not artwork.get('coverImageUrl') or artwork.get('coverImageUrl').startswith('data:'):
                    artwork['coverImageUrl'] = cover_api_url
                if pres_file and isinstance(pres_file, dict):
                    if not pres_file.get('coverUrl') or pres_file.get('coverUrl').startswith('data:'):
                        pres_file['coverUrl'] = cover_api_url

            booths = load_room_booths(room_id) or []
            while len(booths) < 8:
                booths.append(None)

            idx = booth_num - 1
            if 0 <= idx < 8:
                booths[idx] = artwork
                save_room_booths(room_id, booths)
                print(f"✅ Saved booth {booth_num} in room {room_id}: {artwork.get('title')}")
                self.send_json_response({'success': True, 'roomId': room_id, 'boothNumber': booth_num, 'artwork': artwork})
                return

            self.send_json_response({'success': False, 'error': 'Invalid booth number'}, 400)
            return

        # API: Sync entire room booths
        if path == '/api/sync_all_booths':
            room_id = str(data.get('roomId', '1'))
            booths = data.get('booths', [])
            if isinstance(booths, list) and len(booths) == 8:
                save_room_booths(room_id, booths)
                self.send_json_response({'success': True, 'roomId': room_id})
                return
            self.send_json_response({'success': False, 'error': 'Invalid booths array'}, 400)
            return

        # API: Real-time peer heartbeat
        if path == '/api/peers':
            peer_id = data.get('id')
            room_id = str(data.get('room', '1'))
            if peer_id:
                now = time.time()
                data['lastSeen'] = now
                with peers_lock:
                    ONLINE_PEERS[peer_id] = data
                    # Prune stale peers
                    stale = [pid for pid, p in ONLINE_PEERS.items() if (now - p.get('lastSeen', 0)) > 4.5]
                    for pid in stale:
                        del ONLINE_PEERS[pid]

                    other_peers = [p for p in ONLINE_PEERS.values() if p.get('room') == room_id and p.get('id') != peer_id]
                self.send_json_response({'success': True, 'peers': other_peers})
                return
            self.send_json_response({'success': False}, 400)
            return

        # API: Like Artwork
        if path == '/api/like':
            room_id = str(data.get('roomId', '1'))
            booth_id = data.get('boothId')
            user_profile = data.get('userProfile')
            booth_num = user_profile.get('boothNumber') if user_profile else None

            booths = load_room_booths(room_id)
            updated = False
            like_count = 0
            for art in booths:
                if art and (art.get('id') == booth_id or (booth_num and art.get('boothNumber') == booth_num)):
                    art['likes'] = (art.get('likes') or 0) + 1
                    art.setdefault('likedBy', [])
                    if user_profile:
                        art['likedBy'].append(user_profile)
                    like_count = art['likes']
                    updated = True
                    break

            if updated:
                save_room_booths(room_id, booths)
            self.send_json_response({'success': updated, 'likes': like_count})
            return

        # API: Student Check-in & Quiz Record
        if path == '/api/checkin':
            room_id = str(data.get('roomId', '1'))
            booth_id = data.get('boothId')
            record = data.get('record')
            booth_num = record.get('boothNumber') if record else None

            booths = load_room_booths(room_id)
            updated = False
            for art in booths:
                if art and (art.get('id') == booth_id or (booth_num and art.get('boothNumber') == booth_num)):
                    art.setdefault('checkins', [])
                    s_name = record.get('studentName') if record else None
                    s_id = record.get('studentId') if record else None
                    existing = [
                        i for i, c in enumerate(art['checkins'])
                        if (s_name and c.get('studentName') == s_name) or
                           (s_id and s_id != '-' and c.get('studentId') == s_id)
                    ]
                    if existing:
                        art['checkins'][existing[0]] = record
                    else:
                        art['checkins'].append(record)
                    updated = True
                    break

            if updated:
                save_room_booths(room_id, booths)
            self.send_json_response({'success': updated, 'record': record})
            return

        # API: Save Sticky Note / Comment
        if path == '/api/save_note':
            note = data.get('note')
            if note and isinstance(note, dict):
                notes = load_notes() or []
                existing_idx = next((i for i, n in enumerate(notes) if n.get('id') == note.get('id')), None)
                if existing_idx is not None:
                    notes[existing_idx] = note
                else:
                    notes.append(note)
                save_notes(notes)
                self.send_json_response({'success': True, 'note': note})
                return
            self.send_json_response({'success': False, 'error': 'Invalid note'}, 400)
            return

        # API: Like Sticky Note
        if path == '/api/like_note':
            note_id = data.get('noteId')
            notes = load_notes() or []
            updated = False
            like_count = 0
            for n in notes:
                if n.get('id') == note_id:
                    n['likes'] = (n.get('likes') or 0) + 1
                    like_count = n['likes']
                    updated = True
                    break
            if updated:
                save_notes(notes)
            self.send_json_response({'success': updated, 'likes': like_count})
            return

        # API: Delete Sticky Note
        if path == '/api/delete_note':
            note_id = data.get('noteId')
            notes = load_notes() or []
            notes = [n for n in notes if n.get('id') != note_id]
            save_notes(notes)
            self.send_json_response({'success': True})
            return

        # API: Clear All Sticky Notes
        if path == '/api/clear_all_notes':
            save_notes([])
            self.send_json_response({'success': True})
            return

        # API: Clear Check-ins
        if path == '/api/clear_checkins':
            room_id = str(data.get('roomId', 'all'))
            rooms_to_clear = ['1', '2', '3', '4', '5'] if room_id == 'all' else [room_id]
            for r in rooms_to_clear:
                booths = load_room_booths(r)
                if booths:
                    for b in booths:
                        if b:
                            b['checkins'] = []
                    save_room_booths(r, booths)
            self.send_json_response({'success': True, 'clearedRoom': room_id})
            return

        # API: Delete Single Check-in
        if path == '/api/delete_checkin':
            room_id = str(data.get('roomId', '1'))
            booth_id = data.get('boothId')
            student_name = data.get('studentName')
            timestamp = data.get('timestamp')
            booths = load_room_booths(room_id)
            updated = False
            if booths:
                for b in booths:
                    if b and (not booth_id or b.get('id') == booth_id) and b.get('checkins'):
                        before_len = len(b['checkins'])
                        b['checkins'] = [c for c in b['checkins'] if not (
                            (student_name and c.get('studentName') == student_name) and
                            (not timestamp or c.get('timestamp') == timestamp)
                        )]
                        if len(b['checkins']) != before_len:
                            updated = True
                if updated:
                    save_room_booths(room_id, booths)
            self.send_json_response({'success': updated})
            return

        # API: Clear Likes
        if path == '/api/clear_likes':
            room_id = str(data.get('roomId', 'all'))
            rooms_to_clear = ['1', '2', '3', '4', '5'] if room_id == 'all' else [room_id]
            for r in rooms_to_clear:
                booths = load_room_booths(r)
                if booths:
                    for b in booths:
                        if b:
                            b['likes'] = 0
                            b['likedBy'] = []
                    save_room_booths(r, booths)
            self.send_json_response({'success': True, 'clearedRoom': room_id})
            return

        # API: Delete Single Like Record
        if path == '/api/delete_like':
            room_id = str(data.get('roomId', '1'))
            booth_id = data.get('boothId')
            student_name = data.get('studentName')
            timestamp = data.get('timestamp')
            booths = load_room_booths(room_id)
            updated = False
            if booths:
                for b in booths:
                    if b and (not booth_id or b.get('id') == booth_id) and b.get('likedBy'):
                        before_len = len(b['likedBy'])
                        b['likedBy'] = [l for l in b['likedBy'] if not (
                            (student_name and (l.get('name') == student_name or l.get('studentName') == student_name)) and
                            (not timestamp or l.get('timestamp') == timestamp)
                        )]
                        if len(b['likedBy']) != before_len:
                            b['likes'] = max(0, (b.get('likes') or 0) - (before_len - len(b['likedBy'])))
                            updated = True
                if updated:
                    save_room_booths(room_id, booths)
            self.send_json_response({'success': updated})
            return

        # API: Reset Single Booth
        if path == '/api/reset_booth':
            room_id = str(data.get('roomId', '1'))
            booth_num = int(data.get('boothNumber', 1))
            booths = load_room_booths(room_id)
            if booths and 1 <= booth_num <= len(booths):
                booths[booth_num - 1] = None
                save_room_booths(room_id, booths)
                # Remove uploaded presentation if any
                upload_fp = os.path.join(UPLOADS_DIR, f'pres_r{room_id}_b{booth_num}.dat')
                if os.path.exists(upload_fp):
                    try: os.remove(upload_fp)
                    except Exception: pass
                self.send_json_response({'success': True})
                return
            self.send_json_response({'success': False}, 400)
            return

        # API: Clear Entire Room
        if path == '/api/clear_room':
            room_id = str(data.get('roomId', '1'))
            fp = get_room_filepath(room_id)
            if os.path.exists(fp):
                os.remove(fp)
            self.send_json_response({'success': True, 'clearedRoom': room_id})
            return

        # API: Clear All 5 Rooms
        if path == '/api/clear_all_rooms':
            for r in ['1', '2', '3', '4', '5']:
                fp = get_room_filepath(r)
                if os.path.exists(fp):
                    os.remove(fp)
            self.send_json_response({'success': True})
            return

        self.send_json_response({'error': 'Not Found'}, 404)

    def send_json_response(self, obj, status=200):
        try:
            content = json.dumps(obj, ensure_ascii=False).encode('utf-8')
            self.send_response(status)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(content)))
            self.end_headers()
            self.wfile.write(content)
        except Exception:
            pass

if __name__ == '__main__':
    server = ThreadingHTTPServer(('0.0.0.0', PORT), MetaverseHandler)
    print(f"🚀 Spatial Metaverse Persistent Server running on port {PORT}...")
    server.serve_forever()
