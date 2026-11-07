# -*- coding: utf-8 -*-
"""
RSSI Dataset Downloader & Deduplication Verifier
================================================
เครื่องมือดาวน์โหลดชุดข้อมูลจาก Google Drive อัตโนมัติลง Laptop
พร้อมระบบตรวจสอบไฟล์ซ้ำซ้อน (SHA-256 Deduplication) และ Manifest สำหรับการวิจัย
"""

import os
import sys
import json
import base64
import hashlib
import argparse
import urllib.request
import urllib.parse
from datetime import datetime


def find_project_root():
    """ค้นหาโฟลเดอร์รากของโปรเจกต์โดยอิงจากตำแหน่งของ dataset/ หรือ package.json"""
    cur = os.path.dirname(os.path.abspath(__file__))
    while cur and cur != os.path.dirname(cur):
        if os.path.exists(os.path.join(cur, "dataset")) or os.path.exists(os.path.join(cur, "package.json")):
            return cur
        cur = os.path.dirname(cur)
    return os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))


PROJECT_ROOT = find_project_root()

# โหลดค่าคอนฟิกจากไฟล์ .env โดยอัตโนมัติ (ไม่จำเป็นต้องติดตั้งไลบรารีเสริม)
def load_env_file(project_root):
    for env_name in [".env", ".env.local"]:
        env_path = os.path.join(project_root, env_name)
        if os.path.exists(env_path):
            try:
                with open(env_path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            k, v = k.strip(), v.strip().strip("'\"")
                            if k and k not in os.environ:
                                os.environ[k] = v
            except Exception:
                pass

load_env_file(PROJECT_ROOT)

DEFAULT_GAS_URL = os.environ.get("DOWNLOADER_GAS_URL", "").strip()
DEFAULT_OUTPUT_DIR = os.path.join(PROJECT_ROOT, "dataset")
MANIFEST_FILE = "manifest.json"


def compute_sha256(filepath):
    """คำนวณค่า SHA-256 Checksum ของไฟล์"""
    hasher = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()


def inspect_file(filepath):
    """ตรวจสอบเนื้อหาไฟล์เพื่อการวิจัย (CSV row count หรือ ZIP integrity)"""
    ext = os.path.splitext(filepath)[1].lower()
    info = {"format": ext.replace(".", "").upper(), "valid": True, "detail": ""}
    
    if ext == ".csv":
        try:
            with open(filepath, "r", encoding="utf-8", errors="replace") as f:
                lines = [line.strip() for line in f if line.strip()]
                rows = len(lines) - 1 if len(lines) > 0 else 0
                header = lines[0].split(",") if lines else []
                info["detail"] = f"{rows} rows, {len(header)} cols"
        except Exception as e:
            info["valid"] = False
            info["detail"] = f"CSV read error: {e}"
    elif ext == ".zip":
        import zipfile
        if zipfile.is_zipfile(filepath):
            try:
                with zipfile.ZipFile(filepath, "r") as z:
                    file_count = len(z.namelist())
                    info["detail"] = f"Valid ZIP ({file_count} inner files)"
            except Exception as e:
                info["valid"] = False
                info["detail"] = f"Corrupt ZIP: {e}"
        else:
            info["valid"] = False
            info["detail"] = "Invalid ZIP format"
    return info


def load_manifest(manifest_path):
    """โหลด manifest.json เดิม (ถ้ามี)"""
    if os.path.exists(manifest_path):
        try:
            with open(manifest_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "version": "1.0",
        "last_sync": None,
        "total_files": 0,
        "unique_hashes": 0,
        "duplicate_groups_count": 0,
        "files": {},
        "duplicate_hashes": {}
    }


def save_manifest(manifest_path, manifest_data):
    """บันทึก manifest.json สำหรับเก็บประวัติการดาวน์โหลด"""
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest_data, f, indent=2, ensure_ascii=False)


def scan_local_dataset(dataset_dir):
    """สแกนไฟล์ที่มีอยู่ในเครื่อง และสร้าง Hash Map เพื่อตรวจสอบความซ้ำซ้อน"""
    local_files = {}
    hash_map = {}

    for root, _, files in os.walk(dataset_dir):
        for fname in files:
            if fname in [MANIFEST_FILE, ".gitkeep", "manifest.json"]:
                continue
            fpath = os.path.join(root, fname)
            rel_path = os.path.relpath(fpath, dataset_dir).replace("\\", "/")
            fsize = os.path.getsize(fpath)
            fhash = compute_sha256(fpath)
            
            local_files[rel_path] = {
                "absolute_path": fpath,
                "relative_path": rel_path,
                "size": fsize,
                "sha256": fhash
            }

            if fhash not in hash_map:
                hash_map[fhash] = []
            hash_map[fhash].append(rel_path)

    return local_files, hash_map


def verify_local_dataset(dataset_dir):
    """ฟังก์ชันโหมด Verify: ตรวจสอบความถูกต้องและตรวจจับไฟล์ซ้ำซ้อนในเครื่อง"""
    manifest_path = os.path.join(dataset_dir, MANIFEST_FILE)
    manifest = load_manifest(manifest_path)
    local_files, hash_map = scan_local_dataset(dataset_dir)

    print("=" * 70)
    print("🔬 LOCAL DATASET VERIFICATION & INTEGRITY REPORT")
    print(f"📁 Folder: {dataset_dir}")
    print(f"📄 Found {len(local_files)} files in local storage")
    print("=" * 70)

    dupes = {h: paths for h, paths in hash_map.items() if len(paths) > 1}
    
    for rel_path, meta in sorted(local_files.items()):
        info = inspect_file(meta["absolute_path"])
        is_dupe = len(hash_map.get(meta["sha256"], [])) > 1
        status_tag = "⚠️ DUPLICATE" if is_dupe else "✅ UNIQUE"
        print(f"[{status_tag}] {rel_path} ({meta['size']} bytes, {info['detail']})")

    print("-" * 70)
    print(f"📊 SUMMARY:")
    print(f"  • Total files:         {len(local_files)}")
    print(f"  • Unique file hashes:  {len(hash_map)}")
    print(f"  • Duplicate groups:    {len(dupes)}")

    if dupes:
        print("\n⚠️ DUPLICATE DETAILS (Identical SHA-256 Contents):")
        for h, paths in dupes.items():
            print(f"  Hash: {h[:16]}... ({len(paths)} copies)")
            for p in paths:
                print(f"    - {p}")
    else:
        print("\n✨ ไม่มีไฟล์ซ้ำซ้อน ทุกไฟล์มีข้อมูลแตกต่างกันอย่างถูกต้อง")

    # บันทึกสถานะลง manifest
    manifest["last_verified"] = datetime.now().isoformat()
    manifest["total_files"] = len(local_files)
    manifest["unique_hashes"] = len(hash_map)
    manifest["duplicate_groups_count"] = len(dupes)
    manifest["duplicate_hashes"] = dupes
    save_manifest(manifest_path, manifest)
    print(f"\n💾 Updated manifest: {manifest_path}")


def sync_from_drive(endpoint_url, dataset_dir, force_download=False):
    """ดาวน์โหลดและซิงค์ข้อมูลจาก Google Drive ผ่าน Google Apps Script Web App"""
    os.makedirs(dataset_dir, exist_ok=True)
    manifest_path = os.path.join(dataset_dir, MANIFEST_FILE)
    manifest = load_manifest(manifest_path)
    
    print("=" * 70)
    print("🚀 RSSI TELEMETRY DATASET SYNC")
    print(f"🌐 Endpoint: {endpoint_url or '(Not configured)'}")
    print(f"📁 Destination: {dataset_dir}")
    print("=" * 70)

    if not endpoint_url:
        print("❌ ไม่พบ Web App URL สำหรับการซิงค์ข้อมูล")
        print("\n💡 วิธีตั้งค่าความปลอดภัย:")
        print("  1. สร้างไฟล์ .env ที่รากของโปรเจกต์ (คัดลอกจาก .env.example)")
        print("  2. ใส่ค่า DOWNLOADER_GAS_URL=https://script.google.com/macros/s/.../exec")
        print("  3. หรือระบุโดยตรง: python sync_dataset.py --url <YOUR_URL>")
        return

    # 1. ขอรายชื่อไฟล์จาก Google Apps Script
    list_url = f"{endpoint_url}?action=list_files"
    print("📡 กำลังดึงรายการไฟล์ทั้งหมดจาก Google Drive...")
    
    try:
        req = urllib.request.Request(list_url, headers={"User-Agent": "RSSI-Dataset-Sync/1.0"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"❌ ไม่สามารถเชื่อมต่อ Google Drive Endpoint: {e}")
        print("\n💡 คำแนะนำ:")
        print("  1. ตรวจสอบว่าได้ Deploy โค้ดล่าสุดใน scripts/google_drive_downloader.js บน script.google.com หรือยัง")
        print("  2. สามารถรันคำสั่ง 'sync_dataset.bat --verify' เพื่อตรวจสอบไฟล์ที่มีอยู่ในเครื่องได้")
        return

    if data.get("status") != "success":
        print(f"❌ ฝั่ง Google Drive ตอบกลับสถานะ: {data.get('message', 'Unknown error')}")
        return

    remote_files = data.get("files", [])
    print(f"📦 พบไฟล์บน Google Drive ทั้งหมด: {len(remote_files)} ไฟล์\n")

    # 2. สแกนไฟล์เดิมในเครื่อง
    local_files, hash_map = scan_local_dataset(dataset_dir)

    downloaded_count = 0
    skipped_count = 0
    duplicate_count = 0

    for idx, rf in enumerate(remote_files, start=1):
        file_id = rf["id"]
        filename = rf["name"]
        raw_rel_path = rf.get("relative_path", filename)
        
        # ตัด prefix 'dataset/' หรือ 'RSSI_Database/' ซ้ำซ้อนออกถ้ามี
        clean_rel_path = raw_rel_path.lstrip("/")
        for prefix in ["RSSI_Database/dataset/", "RSSI_Database/", "dataset/"]:
            if clean_rel_path.startswith(prefix):
                clean_rel_path = clean_rel_path[len(prefix):]
                break

        dest_filepath = os.path.join(dataset_dir, clean_rel_path.replace("/", os.sep))
        remote_size = rf.get("size", 0)

        # ตรวจสอบว่าไฟล์เคยดาวน์โหลดแล้วหรือยัง (Check if already downloaded)
        already_downloaded = False
        if os.path.exists(dest_filepath) and not force_download:
            local_size = os.path.getsize(dest_filepath)
            # ตรวจสอบกับ manifest
            cached_meta = manifest.get("files", {}).get(file_id)
            if cached_meta and local_size == remote_size:
                already_downloaded = True
            elif local_size == remote_size:
                already_downloaded = True

        if already_downloaded:
            print(f"[{idx}/{len(remote_files)}] ⏭️  [ALREADY DOWNLOADED] {clean_rel_path}")
            skipped_count += 1
            continue

        # ทำการดาวน์โหลด (Download new / modified file)
        print(f"[{idx}/{len(remote_files)}] ⬇️  [DOWNLOADING] {clean_rel_path} ({remote_size} bytes)...")
        dl_url = f"{endpoint_url}?action=download_file&file_id={file_id}"
        
        try:
            dl_req = urllib.request.Request(dl_url, headers={"User-Agent": "RSSI-Dataset-Sync/1.0"})
            with urllib.request.urlopen(dl_req, timeout=60) as dl_resp:
                file_payload = json.loads(dl_resp.read().decode("utf-8"))
            
            if file_payload.get("status") != "success":
                print(f"    ❌ Download failed: {file_payload.get('message')}")
                continue

            content_bytes = base64.b64decode(file_payload.get("content_base64", ""))
            os.makedirs(os.path.dirname(dest_filepath), exist_ok=True)
            with open(dest_filepath, "wb") as out_f:
                out_f.write(content_bytes)

            sha256_hash = hashlib.sha256(content_bytes).hexdigest()
            inspect_res = inspect_file(dest_filepath)

            # ตรวจสอบว่าเนื้อหาไฟล์ซ้ำซ้อนกับไฟล์อื่นที่มีอยู่หรือไม่ (Duplicate Content Check)
            is_duplicate = sha256_hash in hash_map
            if is_duplicate:
                duplicate_count += 1
                dup_targets = ", ".join(hash_map[sha256_hash])
                print(f"    ⚠️ [DUPLICATE CONTENT DETECTED] เนื้อหาซ้ำกับ: {dup_targets}")
            else:
                hash_map[sha256_hash] = []

            hash_map[sha256_hash].append(clean_rel_path)

            # บันทึกข้อมูลลง Manifest
            manifest["files"][file_id] = {
                "id": file_id,
                "filename": filename,
                "relative_path": clean_rel_path,
                "size_bytes": len(content_bytes),
                "sha256": sha256_hash,
                "format_info": inspect_res["detail"],
                "is_duplicate_content": is_duplicate,
                "remote_updated_at": rf.get("updated_at"),
                "downloaded_at": datetime.now().isoformat(),
                "status": "downloaded"
            }
            downloaded_count += 1
            print(f"    ✅ บันทึกสำเร็จ: {inspect_res['detail']}")

        except Exception as err:
            print(f"    ❌ ข้อผิดพลาดขณะดาวน์โหลด: {err}")

    # สรุปผลและเซฟ Manifest
    local_files, hash_map = scan_local_dataset(dataset_dir)
    dupes = {h: paths for h, paths in hash_map.items() if len(paths) > 1}

    manifest["last_sync"] = datetime.now().isoformat()
    manifest["total_files"] = len(local_files)
    manifest["unique_hashes"] = len(hash_map)
    manifest["duplicate_groups_count"] = len(dupes)
    manifest["duplicate_hashes"] = dupes
    save_manifest(manifest_path, manifest)

    print("\n" + "=" * 70)
    print("📊 DATASET SYNC COMPLETED")
    print(f"  • โหลดใหม่ (Downloaded):      {downloaded_count} ไฟล์")
    print(f"  • ข้ามเพราะมีแล้ว (Skipped):   {skipped_count} ไฟล์")
    print(f"  • ไฟล์เนื้อหาซ้ำ (Duplicates): {len(dupes)} กลุ่ม ({duplicate_count} ไฟล์ใหม่)")
    print(f"  • รวมไฟล์ทั้งหมดในเครื่อง:     {len(local_files)} ไฟล์")
    print(f"  • ไฟล์ Manifest ตรวจสอบ:      {manifest_path}")
    print("=" * 70)


def main():
    parser = argparse.ArgumentParser(description="RSSI Dataset Downloader & Deduplication Verifier")
    parser.add_argument("--url", default=DEFAULT_GAS_URL, help="Google Apps Script Web App URL")
    parser.add_argument("--dir", default=DEFAULT_OUTPUT_DIR, help="Directory to save dataset")
    parser.add_argument("--verify", action="store_true", help="Verify local files and duplicates only (No download)")
    parser.add_argument("--force", action="store_true", help="Force re-download all files")

    args = parser.parse_args()

    if args.verify:
        verify_local_dataset(args.dir)
    else:
        sync_from_drive(args.url, args.dir, force_download=args.force)


if __name__ == "__main__":
    main()

