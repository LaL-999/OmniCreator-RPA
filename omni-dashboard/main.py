import sys
from fastapi import FastAPI, UploadFile, File, HTTPException # 🔥 新增了 HTTPException 用于报错打回
from fastapi.middleware.cors import CORSMiddleware
import json
import os
import shutil
import time
import subprocess
import re
import uvicorn
from fastapi import Body
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from contextlib import asynccontextmanager
from typing import List, Dict, Any

@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler.start()
    sync_scheduler()
    print("\n✅ [矩阵枢纽] APScheduler 工业级调度引擎已点火启动，接管全部自动化任务！\n")
    yield
    scheduler.shutdown()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CONFIG_DIR = "configs"
os.makedirs(CONFIG_DIR, exist_ok=True)
LOG_FILE = "run_logs.json"


def read_json(filename: str):
    filepath = os.path.join(CONFIG_DIR, filename)
    if not os.path.exists(filepath): return {}
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


def write_json(filename: str, data):
    filepath = os.path.join(CONFIG_DIR, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)


# ==========================================
# ⚙️ 全局配置与 6 大脚本 API
# ==========================================
@app.get("/api/config/global")
def get_global(): return read_json("global_config.json")

@app.post("/api/config/global")
def save_global(payload: dict): write_json("global_config.json", payload); return {"status": "success"}

@app.get("/api/config/adspower")
def get_adspower(): return read_json("adspower_test.json")

@app.post("/api/config/adspower")
def save_adspower(payload: dict): write_json("adspower_test.json", payload); return {"status": "success"}

@app.get("/api/config/comment")
def get_comment(): return read_json("auto_comment.json")

@app.post("/api/config/comment")
def save_comment(payload: dict): write_json("auto_comment.json", payload); return {"status": "success"}

@app.get("/api/config/autodesk")
def get_autodesk(): return read_json("auto_desk.json")

@app.post("/api/config/autodesk")
def save_autodesk(payload: dict): write_json("auto_desk.json", payload); return {"status": "success"}

@app.get("/api/config/autodm")
def get_autodm(): return read_json("auto_dm.json")

@app.post("/api/config/autodm")
def save_autodm(payload: dict): write_json("auto_dm.json", payload); return {"status": "success"}

@app.get("/api/config/video")
def get_video(): return read_json("auto_video.json")

@app.post("/api/config/video")
def save_video(payload: dict): write_json("auto_video.json", payload); return {"status": "success"}

@app.get("/api/config/warmup")
def get_warmup(): return read_json("auto_warmup.json")

@app.post("/api/config/warmup")
def save_warmup(payload: dict): write_json("auto_warmup.json", payload); return {"status": "success"}


# ==========================================
# 🚀 自动化工业级调度引擎
# ==========================================
scheduler = BackgroundScheduler()

SCRIPT_MAP = {
    1: "adspower_test.py",
    2: "auto_comment.py",
    3: "auto_desk.py",
    4: "auto_dm.py",
    5: "auto_video_publish.py",
    6: "auto_warmup.py"
}

DEFAULT_SCHEDULE = [
    {"id": 1, "name": "1. 图文发帖引擎", "cron": "每天 10:00, 15:00", "nextRun": "-", "active": True},
    {"id": 2, "name": "2. 评论截流引擎", "cron": "每隔 4 小时", "nextRun": "-", "active": True},
    {"id": 3, "name": "3. 私信收割机 (PC)", "cron": "每隔 2 小时", "nextRun": "-", "active": False},
    {"id": 4, "name": "4. 回关互动", "cron": "每天 20:00", "nextRun": "-", "active": True},
    {"id": 5, "name": "5. 视频混剪发布", "cron": "每周一、三、五 18:00", "nextRun": "-", "active": False},
    {"id": 6, "name": "6. 混沌养号", "cron": "每隔 8 小时", "nextRun": "-", "active": True}
]


def execute_script(script_name):
    import sys
    import os
    import subprocess
    try:
        print(f"\n⏰ [调度中心] 时间到！正在自动唤醒脚本引擎: {script_name}")
        python_exe = sys.executable
        if os.name == 'nt':
            subprocess.Popen(
                ["cmd.exe", "/k", python_exe, script_name],
                creationflags=subprocess.CREATE_NEW_CONSOLE
            )
        else:
            subprocess.Popen([python_exe, script_name])
    except Exception as e:
        print(f"❌ [调度中心] 脚本唤醒失败 {script_name}: {e}")


def parse_and_add_job(item):
    if not item.get("active"): return
    script_id = item.get("id")
    rule = item.get("cron", "")
    script_name = SCRIPT_MAP.get(script_id)
    if not script_name: return
    job_id = f"job_{script_id}"

    try:
        match_interval = re.search(r'每隔\s*(\d+)\s*(小时|分钟)', rule)
        if match_interval:
            val = int(match_interval.group(1))
            unit = match_interval.group(2)
            if unit == "小时":
                scheduler.add_job(execute_script, IntervalTrigger(hours=val), args=[script_name], id=job_id, replace_existing=True)
            else:
                scheduler.add_job(execute_script, IntervalTrigger(minutes=val), args=[script_name], id=job_id, replace_existing=True)
            return

        if "每周" in rule:
            day_map = {"一": "mon", "二": "tue", "三": "wed", "四": "thu", "五": "fri", "六": "sat", "日": "sun", "天": "sun"}
            days = [v for k, v in day_map.items() if k in rule]
            times = re.findall(r'(\d{1,2}):(\d{2})', rule)
            if days and times:
                scheduler.add_job(execute_script, CronTrigger(day_of_week=",".join(days), hour=times[0][0], minute=times[0][1]), args=[script_name], id=job_id, replace_existing=True)
                return

        if "每天" in rule or re.search(r'\d{1,2}:\d{2}', rule):
            times = re.findall(r'(\d{1,2}):(\d{2})', rule)
            if times:
                hours = ",".join([t[0] for t in times])
                minutes = ",".join([t[1] for t in times])
                scheduler.add_job(execute_script, CronTrigger(hour=hours, minute=minutes), args=[script_name], id=job_id, replace_existing=True)
                return

        scheduler.add_job(execute_script, IntervalTrigger(hours=8), args=[script_name], id=job_id, replace_existing=True)
    except Exception as e:
        print(f"⚠️ [解析警告] 无法识别的规则 '{rule}': {e}")


def sync_scheduler():
    schedule_data = read_json("schedule.json")
    if not schedule_data or len(schedule_data) == 0:
        print("📝 [调度中心] 检测到配置文件为空，正在执行初始化...")
        schedule_data = DEFAULT_SCHEDULE
        write_json("schedule.json", schedule_data)
    for job in scheduler.get_jobs():
        scheduler.remove_job(job.id)
    for item in schedule_data:
        parse_and_add_job(item)
    print(f"📡 [调度中心] 成功同步 {len(schedule_data)} 个脚本任务状态")


@app.on_event("startup")
def startup_event():
    scheduler.start()
    sync_scheduler()
    print("\n✅ [矩阵枢纽] APScheduler 工业级调度引擎已点火启动，接管全部自动化任务！\n")


# ==========================================
# 📊 看板与通知
# ==========================================
@app.get("/api/dashboard")
def get_dashboard():
    active_profiles = set()
    for filename in ["adspower_test.json", "auto_comment.json", "auto_desk.json", "auto_dm.json", "auto_video.json", "auto_warmup.json"]:
        for task in read_json(filename).get("tasks", []):
            if task.get("profile_id"):
                active_profiles.add(task["profile_id"])
            elif task.get("avatar_path"):
                active_profiles.add(task["avatar_path"])

    logs = read_json(LOG_FILE)
    if not isinstance(logs, list): logs = []

    total_runs = len(logs)
    success_runs = sum(1 for log in logs if log.get("status") == "success")
    warnings = sum(1 for log in logs if log.get("status") in ["error", "warning"])
    success_rate = round((success_runs / total_runs * 100), 1) if total_runs > 0 else 100.0

    schedule = read_json("schedule.json")
    if not schedule or len(schedule) == 0:
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
            "activeProfiles": len(active_profiles),
            "warnings": warnings
        },
        "schedules": schedule
    }


@app.post("/api/dashboard/schedule")
def save_schedule(payload: List[Dict[str, Any]]):
    write_json("schedule.json", payload)
    sync_scheduler()
    return {"status": "success"}


@app.get("/api/notifications")
def get_notifications():
    alerts = []
    meta = read_json("video_meta.json")
    total_videos = len([f for f in os.listdir("video_assets") if f.endswith(('.mp4', '.mov'))]) if os.path.exists("video_assets") else 0
    real_unused = max(sum(1 for v in meta.values() if v.get("status") == "未使用"),
                      total_videos - sum(1 for v in meta.values() if v.get("status") == "已发布"))

    if real_unused <= 2:
        alerts.append({
            "id": "vid_stock", "type": "warning", "title": "素材库存告急",
            "message": f"当前未使用的视频素材仅剩 {real_unused} 个，请及时补充！", "time": "系统监控"
        })

    logs = read_json(LOG_FILE)
    if isinstance(logs, list):
        error_logs = [log for log in logs if log.get("status") in ["error", "warning"]][:5]
        for err in error_logs:
            alerts.append({
                "id": err.get("timestamp", "unknown"),
                "type": err.get("status"),
                "title": f"[{err.get('script')}] 运行异常",
                "message": f"账号 {err.get('profile_id')} : {err.get('msg')}",
                "time": err.get("timestamp", "最近记录")
            })
    return {"notifications": alerts, "unreadCount": len(alerts)}


# ==========================================
# 🎬 视频素材库真实文件中心
# ==========================================
VIDEO_DIR = "video_assets"
VIDEO_META_FILE = "video_meta.json"
os.makedirs(VIDEO_DIR, exist_ok=True)


@app.get("/api/media/videos")
def list_videos():
    available_profiles = set()
    for filename in ["adspower_test.json", "auto_comment.json", "auto_desk.json", "auto_dm.json", "auto_video.json", "auto_warmup.json"]:
        for task in read_json(filename).get("tasks", []):
            if task.get("profile_id"): available_profiles.add(task["profile_id"])

    meta = read_json(VIDEO_META_FILE)
    videos = []
    if os.path.exists(VIDEO_DIR):
        for filename in os.listdir(VIDEO_DIR):
            if filename.lower().endswith(('.mp4', '.mov', '.avi')):
                filepath = os.path.join(VIDEO_DIR, filename)
                upload_time = time.strftime('%Y-%m-%d %H:%M', time.localtime(os.path.getctime(filepath)))
                file_meta = meta.get(filename, {"status": "未使用", "profile_id": "", "topic": ""})

                videos.append({
                    "id": filename, "name": filename, "path": os.path.abspath(filepath),
                    "uploadTime": upload_time, "status": file_meta.get("status", "未使用"),
                    "profile_id": file_meta.get("profile_id", ""), "topic": file_meta.get("topic", "")
                })
    return {"videos": videos, "profiles": list(available_profiles)}


@app.post("/api/media/upload")
async def upload_video(file: UploadFile = File(...)):
    file_path = os.path.join(VIDEO_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"status": "success"}


@app.post("/api/media/update")
def update_video_meta(payload: dict):
    meta = read_json(VIDEO_META_FILE)
    vid_id = payload.get("id")
    if vid_id:
        if vid_id not in meta: meta[vid_id] = {}
        meta[vid_id]["profile_id"] = payload.get("profile_id", "")
        meta[vid_id]["topic"] = payload.get("topic", "")
        meta[vid_id]["status"] = payload.get("status", "未使用")
        write_json(VIDEO_META_FILE, meta)
    return {"status": "success"}


# 🔥🔥🔥 核心修复：添加真正的物理粉碎机接口 🔥🔥🔥
@app.delete("/api/media/delete")
def delete_video(id: str):
    # 1. 抹除本地物理磁盘上的文件
    file_path = os.path.join(VIDEO_DIR, id)
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
            print(f"🗑️ [视频库] 物理文件已彻底删除: {file_path}")
        except Exception as e:
            print(f"❌ [视频库] 文件删除失败: {e}")
            raise HTTPException(status_code=500, detail="物理文件删除失败，文件可能被占用")

    # 2. 抹除数据库 (JSON) 中的记忆
    meta = read_json(VIDEO_META_FILE)
    if id in meta:
        del meta[id]
        write_json(VIDEO_META_FILE, meta)
        print(f"🧹 [视频库] 数据库记录已清理: {id}")

    return {"status": "success", "message": "视频及记录已彻底粉碎"}


# ==========================================
# 📚 知识库管理
# ==========================================
TOPICS_FILE_PATH = os.path.join(os.getcwd(), "configs", "topics.json")

@app.get("/api/topics")
def get_topics():
    if os.path.exists(TOPICS_FILE_PATH):
        try:
            with open(TOPICS_FILE_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"读取 topics.json 失败: {e}")
            return []
    return []

@app.post("/api/topics")
def save_topics(data: list = Body(...)):
    try:
        os.makedirs(os.path.dirname(TOPICS_FILE_PATH), exist_ok=True)
        with open(TOPICS_FILE_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
        return {"status": "success", "message": "知识库已永久保存到本地"}
    except Exception as e:
        print(f"写入 topics.json 失败: {e}")
        return {"status": "error", "message": str(e)}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)