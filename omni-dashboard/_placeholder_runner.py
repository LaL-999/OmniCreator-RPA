"""
脱敏占位运行器（_placeholder_runner）
------------------------------------------------------------
本仓库为公开/作品集版本，6 大自动化脚本的核心执行逻辑（浏览器指纹环境驱动、
内容生成、平台交互等）未包含在内。

为保证「调度引擎 → 脚本唤醒 → 运行日志 → 前端看板」整条链路在演示时依旧可
观测，这里提供一个统一的占位运行器：被调度唤醒时打印说明并向看板回报一条运行
记录，而不会因占位文件不可执行导致调度器异常。
"""
import os
import sys
import time

# 确保无论从何处被唤醒，都能 import 到同目录下的 logger
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
try:
    from logger import write_run_log
except Exception:  # noqa: BLE001  占位脚本容错：日志组件缺失也不应崩溃
    def write_run_log(*_args, **_kwargs):  # type: ignore
        pass


def run_placeholder(script_file: str, label: str, profile_id: str = "k1bhea90") -> None:
    """打印脱敏说明并回报一条看板运行记录。

    Args:
        script_file: 当前脚本文件名（用于日志归类，如 "AutoComment.py"）。
        label:       业务名称（用于控制台展示，如 "评论截流引擎"）。
        profile_id:  代表性环境编号（仅用于演示看板的活跃账号统计）。
    """
    print("=" * 56)
    print(f"  OmniCreator · {label}")
    print("=" * 56)
    print("  - 这是脱敏占位脚本：核心自动化逻辑未包含在公开版本中。")
    print("  - 调度引擎已成功唤醒本脚本，并将向控制台看板回报一条记录。")
    print("=" * 56)

    write_run_log(
        profile_id,
        script_file,
        "success",
        f"{label} · 脱敏占位执行完毕（核心逻辑未包含在公开版本中）",
    )

    # 略作停留，便于在弹出的控制台窗口中看清输出
    time.sleep(2)
