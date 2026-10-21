#!/bin/bash
# ==============================================================================
# SPATIAL METAVERSE - QUICK LAUNCHER FOR MAC
# ดับเบิลคลิกไฟล์นี้เพื่อเริ่มเปิดระบบนิทรรศการเสมือนจริง 3 มิติ สำหรับครูและนักเรียน
# ==============================================================================

cd "$(dirname "$0")"

PORT=8080
URL="http://localhost:${PORT}/spatial-metaverse/"

echo "=========================================================="
echo "🌐 กำลังเริ่มเปิดระบบ SPATIAL METAVERSE เพื่อการศึกษา..."
echo "=========================================================="

# ตรวจสอบว่าพอร์ต 8080 มีเซิร์ฟเวอร์รันอยู่แล้วหรือไม่
if ! lsof -i :${PORT} > /dev/null 2>&1; then
    echo "🚀 สตาร์ท Local Web Server บนพอร์ต ${PORT} เพื่อให้ใช้งานกล้องและแชร์หน้าจอได้สมบูรณ์..."
    python3 -m http.server ${PORT} > /dev/null 2>&1 &
    SERVER_PID=$!
    sleep 1
else
    echo "⚡ Local Web Server พร้อมทำงานอยู่แล้ว"
fi

echo "🖥️ กำลังเปิดเบราว์เซอร์ไปที่: ${URL}"

# เปิดเบราว์เซอร์หลักของเครื่อง (Google Chrome หรือ Safari)
if [ -d "/Applications/Google Chrome.app" ]; then
    open -a "Google Chrome" "${URL}"
elif [ -d "/Applications/Safari.app" ]; then
    open -a "Safari" "${URL}"
else
    open "${URL}"
fi

echo ""
echo "✅ เปิดโปรแกรมเรียบร้อยแล้ว!"
echo "💡 หากต้องการใช้งานแบบหลายคน (Multiplayer) ให้เปิดลิงก์นี้ในหน้าต่างหรือแท็บใหม่ได้เลย"
echo ""
