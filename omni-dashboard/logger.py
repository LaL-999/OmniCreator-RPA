# logger.py
import os
import json
import time


def write_run_log(profile_id, script_name, status, msg):
    """向后端系统真实汇报运行结果的通用组件"""
    log_path = os.path.join(os.getcwd(), "configs", "run_logs.json")
    logs = []

    # 确保 configs 文件夹存在
    os.makedirs(os.path.join(os.getcwd(), "configs"), exist_ok=True)

    if os.path.exists(log_path):
        try:
            with open(log_path, "r", encoding="utf-8") as f:
                logs = json.load(f)
        except:
            pass

    logs.insert(0, {
        "timestamp": time.strftime('%Y-%m-%d %H:%M:%S'),
        "profile_id": profile_id,
        "script": script_name,
        "status": status,  # "success", "error", "warning"
        "msg": msg
    })

    # 最多保留最近 500 条真实记录，防止文件过大
    with open(log_path, "w", encoding="utf-8") as f:
        json.dump(logs[:500], f, ensure_ascii=False, indent=4)