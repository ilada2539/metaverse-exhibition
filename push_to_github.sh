#!/bin/bash
# Helper script to push Spatial Metaverse code to your GitHub repo
if [ -z "$1" ]; then
  echo "วิธีใช้: ./push_to_github.sh <ลิงก์_GITHUB_REPO_URL>"
  echo "ตัวอย่าง: ./push_to_github.sh https://github.com/your-username/metaverse-exhibition.git"
  exit 1
fi

REPO_URL="$1"
echo "🚀 กำลังเชื่อมต่อไปยัง $REPO_URL..."
git remote remove origin 2>/dev/null
git remote add origin "$REPO_URL"
git branch -M main
echo "📦 กำลังอัปโหลดโค้ดขึ้น GitHub..."
git push -u origin main
echo "✅ อัปโหลดขึ้น GitHub สำเร็จเรียบร้อยแล้ว!"
