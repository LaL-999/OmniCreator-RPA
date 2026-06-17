"""
OmniCreator 控制台 · 后端调度中枢 (FastAPI)
------------------------------------------------------------
职责：
  1. 为前端看板提供配置读写、素材库、知识库等 REST 接口；
  2. 内置 APScheduler 工业级调度引擎，按中文规则自动唤醒 6 大自动化脚本。

注意：所有相对路径均基于本文件所在目录解析，因此无论从何处启动都能找到
      configs/ 与 video_assets/（一键启动脚本 start.bat 已处理工作目录）。
"""
import os
import re
import sys
import json
import time
import shutil
import subprocess
from pathlib import Path
from contextlib import asynccontextmanager
from typing import Any, Dict, List

import uvicorn
from fastapi import FastAPI, UploadFile, File, Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

# ==========================================
# 📁 路径与基础设施
# ==========================================
BASE_DIR = Path(__file__).resolve().parent
CONFIG_DIR = BASE_DIR / "configs"
VIDEO_DIR = BASE_DIR / "video_assets"
CONFIG_DIR.mkdir(exist_ok=True)
VIDEO_DIR.mkdir(exist_ok=True)

LOG_FILE = "run_logs.json"
VIDEO_META_FILE = "video_meta.json"
TOPICS_FILE = "topics.json"


def read_json(filename: str, default: Any = None) -> Any:
    """安全读取 configs 下的 JSON；文件缺失或损坏时返回默认值。"""
    filepath = CONFIG_DIR / filename
    if not filepath.exists():
        return {} if default is None else default
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError) as e:
        print(f"⚠️  [配置] 读取 {filename} 失败，已返回默认值：{e}")
        return {} if default is None else default


def write_json(filename: str, data: Any) -> None:
    """原子化写入 configs 下的 JSON（先写临时文件再替换，避免中途崩溃损坏原文件）。"""
    filepath = CONFIG_DIR / filename
    tmp = filepath.with_suffix(filepath.suffix + ".tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    os.replace(tmp, filepath)


# ==========================================
# 🚀 调度引擎
# ==========================================
scheduler = BackgroundScheduler(timezone="Asia/Shanghai")

# 脚本 id → 真实脚本文件名（与磁盘文件严格一致）
SCRIPT_MAP: Dict[int, str] = {
    1: "adspower_test.py",
    2: "AutoComment.py",
    3: "auto_desk.py",
    4: "auto_dm.py",
    5: "auto_video_publish.py",
    6: "auto_warmup.py",
}

DEFAULT_SCHEDULE: List[Dict[str, Any]] = [
    {"id": 1, "name": "1. 图文发帖引擎", "cron": "每天 10:00, 15:00", "nextRun": "-", "active": True},
    {"id": 2, "name": "2. 评论截流引擎", "cron": "每隔 4 小时", "nextRun": "-", "active": True},
    {"id": 3, "name": "3. 私信收割机 (PC)", "cron": "每隔 2 小时", "nextRun": "-", "active": False},
    {"id": 4, "name": "4. 回关互动", "cron": "每天 20:00", "nextRun": "-", "active": True},
    {"id": 5, "name": "5. 视频混剪发布", "cron": "每周一、三、五 18:00", "nextRun": "-", "active": False},
    {"id": 6, "name": "6. 混沌养号", "cron": "每隔 8 小时", "nextRun": "-", "active": True},
]


def execute_script(script_name: str) -> None:
    """到点唤醒脚本：Windows 下弹出独立黑窗口便于观察，其余平台静默后台执行。"""
    script_path = BASE_DIR / script_name
    if not script_path.exists():
        print(f"⚠️  [调度中心] 脚本文件不存在，已跳过：{script_name}")
        return
    try:
        print(f"\n⏰ [调度中心] 时间到！正在自动唤醒脚本引擎: {script_name}")
        python_exe = sys.executable
        if os.name == "nt":
            subprocess.Popen(
                ["cmd.exe", "/k", python_exe, str(script_path)],
                creationflags=subprocess.CREATE_NEW_CONSOLE,
                cwd=str(BASE_DIR),
            )
        else:
            subprocess.Popen([python_exe, str(script_path)], cwd=str(BASE_DIR))
    except Exception as e:  # noqa: BLE001 调度容错，单脚本失败不影响整体
        print(f"❌ [调度中心] 脚本唤醒失败 {script_name}: {e}")


def parse_and_add_job(item: Dict[str, Any]) -> None:
    """把一条中文调度规则解析成 APScheduler 触发器并注册。"""
    if not item.get("active"):
        return
    script_id = item.get("id")
    rule = item.get("cron", "")
    script_name = SCRIPT_MAP.get(script_id)
    if not script_name:
        return
    job_id = f"job_{script_id}"

    try:
        # 1) 「每隔 N 小时/分钟」
        match_interval = re.search(r"每隔\s*(\d+)\s*(小时|分钟)", rule)
        if match_interval:
            val = int(match_interval.group(1))
            unit = match_interval.group(2)
            trigger = IntervalTrigger(hours=val) if unit == "小时" else IntervalTrigger(minutes=val)
            scheduler.add_job(execute_script, trigger, args=[script_name], id=job_id, replace_existing=True)
            return

        # 2) 「每周一、三、五 18:00」
        if "每周" in rule:
            day_map = {"一": "mon", "二": "tue", "三": "wed", "四": "thu", "五": "fri", "六": "sat", "日": "sun", "天": "sun"}
            days = [v for k, v in day_map.items() if k in rule]
            times = re.findall(r"(\d{1,2}):(\d{2})", rule)
            if days and times:
                scheduler.add_job(
                    execute_script,
                    CronTrigger(day_of_week=",".join(days), hour=times[0][0], minute=times[0][1]),
                    args=[script_name], id=job_id, replace_existing=True,
                )
                return

        # 3) 「每天 10:00, 15:00」/ 含具体时刻
        if "每天" in rule or re.search(r"\d{1,2}:\d{2}", rule):
            times = re.findall(r"(\d{1,2}):(\d{2})", rule)
            if times:
                hours = ",".join(t[0] for t in times)
                minutes = ",".join(t[1] for t in times)
                scheduler.add_job(
                    execute_script, CronTrigger(hour=hours, minute=minutes),
                    args=[script_name], id=job_id, replace_existing=True,
                )
                return

        # 4) 兜底：识别不了就每 8 小时跑一次
        scheduler.add_job(execute_script, IntervalTrigger(hours=8), args=[script_name], id=job_id, replace_existing=True)
    except Exception as e:  # noqa: BLE001
        print(f"⚠️  [解析警告] 无法识别的规则 '{rule}': {e}")


def sync_scheduler() -> None:
    """根据 schedule.json 全量重建调度任务。"""
    schedule_data = read_json("schedule.json", default=[])
    if not schedule_data:
        print("📝 [调度中心] 配置文件为空，正在初始化默认时间表...")
        schedule_data = DEFAULT_SCHEDULE
        write_json("schedule.json", schedule_data)
    for job in scheduler.get_jobs():
        scheduler.remove_job(job.id)
    for item in schedule_data:
        parse_and_add_job(item)
    print(f"📡 [调度中心] 成功同步 {len(schedule_data)} 个脚本任务状态")


@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler.start()
    sync_scheduler()
    print("\n✅ [矩阵枢纽] APScheduler 工业级调度引擎已点火启动，接管全部自动化任务！\n")
    yield
    scheduler.shutdown(wait=False)


# ==========================================
# ⚙️ 应用实例
# ==========================================
app = FastAPI(title="OmniCreator 控制台 API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> Dict[str, Any]:
    return {"status": "ok", "jobs": len(scheduler.get_jobs())}


# ==========================================
# 🔧 6 大脚本 + 全局配置接口（统一工厂注册，消除重复样板）
# ==========================================
CONFIG_FILES: Dict[str, str] = {
    "global": "global_config.json",
    "adspower": "adspower_test.json",
    "comment": "auto_comment.json",
    "autodesk": "auto_desk.json",
    "autodm": "auto_dm.json",
    "video": "auto_video.json",
    "warmup": "auto_warmup.json",
}


def _register_config_routes(route_key: str, filename: str) -> None:
    @app.get(f"/api/config/{route_key}", name=f"get_config_{route_key}")
    def _get() -> Any:
        return read_json(filename)

    @app.post(f"/api/config/{route_key}", name=f"save_config_{route_key}")
    def _save(payload: dict = Body(...)) -> Dict[str, str]:
        write_json(filename, payload)
        return {"status": "success"}


for _key, _file in CONFIG_FILES.items():
    _register_config_routes(_key, _file)


# ==========================================
# 📊 看板与通知
# ==========================================
def _collect_active_profiles() -> set:
    profiles: set = set()
    for filename in CONFIG_FILES.values():
        if filename == "global_config.json":
            continue
        data = read_json(filename)
        for task in (data.get("tasks", []) if isinstance(data, dict) else []):
            if task.get("profile_id"):
                profiles.add(task["profile_id"])
            elif task.get("avatar_path"):
                profiles.add(task["avatar_path"])
    return profiles


@app.get("/api/dashboard")
def get_dashboard() -> Dict[str, Any]:
    logs = read_json(LOG_FILE, default=[])
    if not isinstance(logs, list):
        logs = []

    total_runs = len(logs)
    success_runs = sum(1 for log in logs if log.get("status") == "success")
    warnings = sum(1 for log in logs if log.get("status") in ("error", "warning"))
    success_rate = round((success_runs / total_runs * 100), 1) if total_runs > 0 else 100.0

    schedule = read_json("schedule.json", default=[])
    if not schedule:
        schedule = DEFAULT_SCHEDULE
        write_json("schedule.json", schedule)

    for item in schedule:
        if item.get("active"):
            job = scheduler.get_job(f"job_{item['id']}")
            item["nextRun"] = job.next_run_time.strftime("%m-%d %H:%M:%S") if job and job.next_run_time else "计算中..."
        else:
            item["nextRun"] = "-"

    return {
        "stats": {
            "totalRuns": total_runs,
            "successRate": success_rate,
            "activeProfiles": len(_collect_active_profiles()),
            "warnings": warnings,
        },
        "schedules": schedule,
    }


@app.post("/api/dashboard/schedule")
def save_schedule(payload: List[Dict[str, Any]] = Body(...)) -> Dict[str, str]:
    write_json("schedule.json", payload)
    sync_scheduler()
    return {"status": "success"}


@app.get("/api/notifications")
def get_notifications() -> Dict[str, Any]:
    alerts: List[Dict[str, Any]] = []

    meta = read_json(VIDEO_META_FILE)
    total_videos = len([f for f in os.listdir(VIDEO_DIR) if f.lower().endswith((".mp4", ".mov"))]) if VIDEO_DIR.exists() else 0
    real_unused = max(
        sum(1 for v in meta.values() if v.get("status") == "未使用"),
        total_videos - sum(1 for v in meta.values() if v.get("status") == "已发布"),
    )

    if real_unused <= 2:
        alerts.append({
            "id": "vid_stock", "type": "warning", "title": "素材库存告急",
            "message": f"当前未使用的视频素材仅剩 {real_unused} 个，请及时补充！", "time": "系统监控",
        })

    logs = read_json(LOG_FILE, default=[])
    if isinstance(logs, list):
        for err in [log for log in logs if log.get("status") in ("error", "warning")][:5]:
            alerts.append({
                "id": err.get("timestamp", "unknown"),
                "type": err.get("status"),
                "title": f"[{err.get('script')}] 运行异常",
                "message": f"账号 {err.get('profile_id')} : {err.get('msg')}",
                "time": err.get("timestamp", "最近记录"),
            })

    return {"notifications": alerts, "unreadCount": len(alerts)}


# ==========================================
# 🎬 视频素材库
# ==========================================
@app.get("/api/media/videos")
def list_videos() -> Dict[str, Any]:
    available_profiles = _collect_active_profiles()
    meta = read_json(VIDEO_META_FILE)
    videos: List[Dict[str, Any]] = []

    if VIDEO_DIR.exists():
        for filename in os.listdir(VIDEO_DIR):
            if not filename.lower().endswith((".mp4", ".mov", ".avi")):
                continue
            filepath = VIDEO_DIR / filename
            upload_time = time.strftime("%Y-%m-%d %H:%M", time.localtime(filepath.stat().st_ctime))
            file_meta = meta.get(filename, {"status": "未使用", "profile_id": "", "topic": ""})
            videos.append({
                "id": filename, "name": filename, "path": str(filepath.resolve()),
                "uploadTime": upload_time, "status": file_meta.get("status", "未使用"),
                "profile_id": file_meta.get("profile_id", ""), "topic": file_meta.get("topic", ""),
            })

    return {"videos": videos, "profiles": list(available_profiles)}


@app.post("/api/media/upload")
async def upload_video(file: UploadFile = File(...)) -> Dict[str, str]:
    file_path = VIDEO_DIR / os.path.basename(file.filename or "untitled")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"status": "success"}


@app.post("/api/media/update")
def update_video_meta(payload: dict = Body(...)) -> Dict[str, str]:
    meta = read_json(VIDEO_META_FILE)
    vid_id = payload.get("id")
    if vid_id:
        entry = meta.get(vid_id, {})
        entry["profile_id"] = payload.get("profile_id", "")
        entry["topic"] = payload.get("topic", "")
        entry["status"] = payload.get("status", "未使用")
        meta[vid_id] = entry
        write_json(VIDEO_META_FILE, meta)
    return {"status": "success"}


@app.delete("/api/media/delete")
def delete_video(id: str) -> Dict[str, str]:
    # 1) 删除物理文件（防目录穿越，仅允许删除素材库内的文件）
    file_path = (VIDEO_DIR / os.path.basename(id)).resolve()
    if VIDEO_DIR.resolve() not in file_path.parents:
        raise HTTPException(status_code=400, detail="非法的文件路径")
    if file_path.exists():
        try:
            os.remove(file_path)
            print(f"🗑️  [视频库] 物理文件已删除: {file_path}")
        except OSError as e:
            print(f"❌ [视频库] 文件删除失败: {e}")
            raise HTTPException(status_code=500, detail="物理文件删除失败，文件可能被占用")

    # 2) 删除元数据
    meta = read_json(VIDEO_META_FILE)
    if id in meta:
        del meta[id]
        write_json(VIDEO_META_FILE, meta)
        print(f"🧹 [视频库] 数据库记录已清理: {id}")

    return {"status": "success", "message": "视频及记录已彻底删除"}


# ==========================================
# 📚 知识库
# ==========================================
@app.get("/api/topics")
def get_topics() -> Any:
    return read_json(TOPICS_FILE, default=[])


@app.post("/api/topics")
def save_topics(data: list = Body(...)) -> Dict[str, str]:
    try:
        write_json(TOPICS_FILE, data)
        return {"status": "success", "message": "知识库已永久保存到本地"}
    except OSError as e:
        return {"status": "error", "message": str(e)}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
