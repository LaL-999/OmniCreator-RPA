import os
import time
import re
import random
import pyperclip
from pathlib import Path
import requests
import httpx
import json  # 🔥 新增：用于读取 JSON
from openai import OpenAI
from playwright.sync_api import (
    Error as PlaywrightError,
    TimeoutError as PlaywrightTimeoutError,
    sync_playwright,
)
import moviepy.editor as mp
import moviepy.video.fx.all as vfx
import moviepy.audio.fx.all as afx
from logger import write_run_log

# ==========================================
# ⚙️ 全局核心密钥配置中心 (彻底物理隔离)
# ==========================================
ADSPOWER_API_KEY = "78d891ffc160582bc0af4d3d4f6693ce0089ff9076ded42a"
DEEPSEEK_API_KEY = "sk-8f095952e06045c7b0e81f03cc2d9b7d"

# ⚠️ Whisper 语音识别大脑密钥
WHISPER_API_KEY = "sk-xxxxxxxxxxxxxxxxxxxxxxxx"
WHISPER_BASE_URL = "https://api.xxxxxx.com/v1"

# 备用直达链接 (仅作兜底)
BACKUP_PUBLISH_URL_VIDEO = "https://creator.xiaohongshu.com/publish/publish?from=tab_switch&target=video"
TEXT_PUBLISH = "\u53d1\u5e03"
TEMP_MEDIA_DIR = os.path.join(os.getcwd(), "temp_xhs_media")


# ==========================================
# 🧠 核心闭环：动态读取前端真实的媒体库配置
# ==========================================
def load_real_video_tasks():
    """扫描前端视频库，自动挑出【未使用】且【已分配账号】的视频作为本次执行任务"""
    tasks = []
    meta_path = os.path.join(os.getcwd(), "configs", "video_meta.json")
    video_dir = os.path.join(os.getcwd(), "video_assets")

    if os.path.exists(meta_path):
        with open(meta_path, "r", encoding="utf-8") as f:
            meta = json.load(f)

        for filename, data in meta.items():
            if data.get("status") == "未使用" and data.get("profile_id"):
                tasks.append({
                    "filename": filename,
                    "profile_id": data["profile_id"],
                    "raw_video_path": os.path.join(video_dir, filename),
                    "fallback_topic": data.get("topic", "热门分享")
                })
    return tasks


def mark_video_published(filename):
    """发布成功后，自动将视频库中的状态改为【已发布】"""
    meta_path = os.path.join(os.getcwd(), "configs", "video_meta.json")
    try:
        with open(meta_path, "r", encoding="utf-8") as f:
            meta = json.load(f)
        if filename in meta:
            meta[filename]["status"] = "已发布"
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(meta, f, ensure_ascii=False, indent=4)
    except Exception as e:
        print(f"      -> ⚠️ 视频状态更新失败: {e}")


# ==========================================
# 模块 1：视频脑 (🔥 终极物理洗稿 + 音视频双重粉碎)
# ==========================================
def process_video_and_extract_audio(raw_video_path):
    print(f"\n🎬 [视频脑] 正在对原视频进行【终极底层指纹粉碎】洗稿...")
    if not os.path.exists(TEMP_MEDIA_DIR):
        os.makedirs(TEMP_MEDIA_DIR)

    temp_video_path = os.path.join(TEMP_MEDIA_DIR, f"processed_{int(time.time())}.mp4")
    temp_audio_path = os.path.join(TEMP_MEDIA_DIR, f"audio_{int(time.time())}.mp3")

    try:
        clip = mp.VideoFileClip(raw_video_path)
        print("      -> 🎧 正在剥离原声音轨，提取为 MP3...")
        clip.audio.write_audiofile(temp_audio_path, verbose=False, logger=None)

        print("      -> ✂️ 正在执行画面微裁切 (打乱分辨率与画面哈希)...")
        w, h = clip.size
        clip = clip.crop(x1=2, y1=2, x2=w - 2, y2=h - 2)

        speed_factor = random.uniform(1.01, 1.03)
        print(f"      -> ⚙️ 正在以 {speed_factor:.2f}x 速度重绘视频与音频帧...")
        clip = clip.fx(vfx.speedx, speed_factor)

        color_shift = random.uniform(0.98, 1.02)
        vol_shift = random.uniform(0.95, 1.05)
        print(f"      -> 🎭 正在注入视觉与听觉扰动 (画面明度 x{color_shift:.2f}, 音量 x{vol_shift:.2f})...")
        clip = clip.fx(vfx.colorx, color_shift)
        if clip.audio:
            clip.audio = clip.audio.fx(afx.volumex, vol_shift)

        bitrate = f"{random.randint(2500, 3500)}k"
        clip.write_videofile(
            temp_video_path,
            codec="libx264",
            audio_codec="aac",
            bitrate=bitrate,
            verbose=False,
            logger=None
        )
        clip.close()
        print("      -> ✅ 视频洗稿大功告成！已获得全网唯一的伪原创视频文件！")
        return temp_video_path, temp_audio_path
    except Exception as e:
        print(f"      -> ❌ 视频处理彻底失败: {e}")
        return None, None


# ==========================================
# 模块 2：音频脑 + 文案脑 (ASR听写 + AI 防查重逆向写稿)
# ==========================================
def generate_copywriting_from_audio(audio_path, fallback_topic):
    print("\n🧠 [音频脑] 正在启动 Whisper 听风者进行语音转写...")

    whisper_client = OpenAI(
        api_key=WHISPER_API_KEY,
        base_url=WHISPER_BASE_URL,
        http_client=httpx.Client(trust_env=False)
    )

    video_transcript = ""
    try:
        with open(audio_path, "rb") as audio_file:
            transcript = whisper_client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                language="zh"
            )
        video_transcript = transcript.text
        if not video_transcript.strip():
            raise ValueError("提取出的音频无有效语音内容")
        print(f"      -> 📜 语音识别成功，提取原话: [{video_transcript[:60]}...]")
    except Exception as e:
        print(f"      -> ⚠️ 语音识别异常或无声音 ({e})")
        print(f"      -> 🛡️ 触发降级保护机制：放弃听写，直接使用设定话题【{fallback_topic}】撰写文案！")
        video_transcript = f"请围绕【{fallback_topic}】帮我写一篇经验分享。"

    print("\n🧠 [文案脑] 正在呼叫 DeepSeek 进行人设化降智包装 (打造呼吸感排版)...")
    ds_client = OpenAI(
        api_key=DEEPSEEK_API_KEY,
        base_url="https://api.deepseek.com",
        http_client=httpx.Client(trust_env=False)
    )

    # 🔥 恢复你原本的本地硬编码配置
    styles = [
        "【碎碎念吐槽型】：语气随性，多用感叹号，像朋友聊天，不要有太强的逻辑性。",
        "【小白真诚分享型】：假装刚踩过坑，心有余悸地提醒大家，语言通俗接地气。",
        "【极简懒人型】：直接把核心点说出来，用词年轻化（如：绝绝子、无语、避雷）。"
    ]
    selected_style = random.choice(styles)

    # 🔥 底层强行注入“排版红线”与“强制格式”，确保解析 100% 成功
    system_prompt = f"""
    你是一个小红书百万粉丝的短视频操盘手。
    请根据以下【视频原话或主题】，写一篇配套的视频发布文案。

    【视频信息】：{video_transcript}

    【🚨 顶级防封与排版红线】：
    1. 拒绝机械感：绝对禁止使用“首先”、“其次”、“总之”、“保姆级教程”等AI词汇！
    2. {selected_style}
    3. 【核心排版要求】：
       - 绝对不要用“1. 2. 3.”数字列点！
       - 使用 Emoji (如 💡, ✅, 🔴, 👉) 作为视觉引导。
       - 每讲完一个小点，必须【换行留白】，打造视觉呼吸感。
    4. 【重点】：请正常使用标点符号（逗号、句号、叹号等），保证长篇正文连贯易读，但整体排版要保持随性。

    【⚙️ 强制输出格式】（严格隔离，直接输出以下四行，不要加任何其他前缀或引号）：
    标题：[口语化标题，不要标点，16字内]
    正文：[换行清晰、带有Emoji引导的正文，绝对不要分123点，必须有正常标点]
    互动：[随口问一句互动问题，如“你们遇到过吗”]
    标签：[直接写词语，空格隔开，不要带#号]
    """

    try:
        # 🔥 恢复你原本的本地温度配置
        dynamic_temp = random.uniform(0.85, 0.95)
        response = ds_client.chat.completions.create(
            model="deepseek-chat",
            messages=[{"role": "user", "content": system_prompt}],
            temperature=dynamic_temp
        )

        raw_result = response.choices[0].message.content.strip()

        # 宽容度处理
        clean_result = raw_result.replace("**", "").replace("标题:", "标题：").replace("正文:", "正文：").replace("互动:",
                                                                                                                "互动：").replace(
            "提问:", "互动：").replace("标签:", "标签：").strip()

        title_match = re.search(r"标题：\s*(.*?)(?=\n|$)", clean_result)
        content_match = re.search(r"正文：\s*(.*?)(?=\n互动：|\n标签：|$)", clean_result, re.DOTALL)
        hook_match = re.search(r"互动：\s*(.*?)(?=\n标签：|$)", clean_result, re.DOTALL)
        tags_match = re.search(r"标签：\s*(.*)", clean_result, re.DOTALL)

        if title_match and content_match and hook_match and tags_match:
            title = title_match.group(1).strip()
            content = content_match.group(1).strip() + "\n\n" + hook_match.group(1).strip()
            tags_str = tags_match.group(1).strip().replace("#", "").replace(",", " ").replace("，", " ")
            tags_list = [t for t in tags_str.split() if t.strip()]

            title = title.split('，')[0].strip()
            if len(title) > 16: title = title[:16]

            print(f"      -> 📝 拟人文案逆向生成成功！专属标题：[{title}]")
            return title, content, tags_list
        else:
            raise ValueError("解析未匹配")

    except Exception as e:
        print(f"      -> ❌ 文案包装失败: {e}")
        return f"🎬 {fallback_topic} 的血泪教训", "这期视频真的是满满的干货，大家一定要认真看完！\n\n你们有踩过类似的坑吗？评论区见！", [
            "留学干货", "日常分享"]


# ==========================================
# 模块 3：AdsPower API 控制逻辑
# ==========================================
def start_adspower_profile(profile_id: str, api_key: str) -> str:
    headers = {"Authorization": f"Bearer {api_key}"}
    start_url = f"http://127.0.0.1:50325/api/v1/browser/start?user_id={profile_id}"
    resp = requests.get(start_url, headers=headers, timeout=20).json()
    return resp["data"]["ws"]["puppeteer"]


def stop_adspower_profile(profile_id: str, api_key: str):
    try:
        requests.get(f"http://127.0.0.1:50325/api/v1/browser/stop?user_id={profile_id}",
                     headers={"Authorization": f"Bearer {api_key}"}, timeout=10)
    except Exception:
        pass


# ==========================================
# 模块 4：Playwright 底层控制与模拟
# ==========================================
def get_live_page(context):
    for page in reversed(context.pages):
        if not page.is_closed(): return page
    return context.new_page()


def navigate_to_publish_safely(context, page):
    page = page if page and not page.is_closed() else get_live_page(context)

    print("      -> 🌍 正在通过主页模拟真人路径进入发布后台...")
    try:
        page.goto("https://www.xiaohongshu.com/explore", wait_until="domcontentloaded", timeout=45000)
        page.wait_for_timeout(random.randint(2000, 4000))

        page.mouse.wheel(0, random.randint(500, 1500))
        page.wait_for_timeout(random.randint(1000, 2000))

        print("      -> 🖱️ 寻找并点击侧边栏的【发布】按钮...")
        publish_btn = page.locator("a[href*='publish'], div.channel").get_by_text("发布", exact=True).first

        with context.expect_page(timeout=15000) as new_page_info:
            if publish_btn.is_visible():
                publish_btn.click(force=True)
            else:
                page.mouse.click(50, 300)

        new_page = new_page_info.value
        new_page.wait_for_load_state("domcontentloaded")
        new_page.wait_for_timeout(random.randint(2000, 4000))

        try:
            video_tab = new_page.get_by_text("上传视频", exact=True).filter(state="visible").first
            if video_tab.is_visible():
                video_tab.click()
                new_page.wait_for_timeout(1000)
        except Exception:
            pass

        print("      -> ✅ 已安全潜入创作者中心【视频发布】页！")
        return new_page

    except Exception as e:
        print(f"      -> ⚠️ 拟人寻路失败或超时，启动后备跳转机制...")
        page.goto(BACKUP_PUBLISH_URL_VIDEO, wait_until="domcontentloaded")
        page.wait_for_timeout(3000)
        return page


def upload_video_and_wait(page, video_path: str):
    print("      -> 📤 正在向小红书底层注入视频大文件...")

    input_files = page.locator("input[type='file']")
    if input_files.count() > 0:
        input_files.first.set_input_files(video_path, timeout=60000)
    else:
        drag_zone = page.locator(".drag-container, .upload-wrapper-box").first
        with page.expect_file_chooser(timeout=20000) as fc_info:
            drag_zone.click(force=True)
        fc_info.value.set_files(video_path)

    print("      -> ⏳ 视频上传完毕！正在等待小红书服务器转码抽帧 (约需 40-120 秒)...")
    try:
        page.wait_for_selector("text='重新上传'", timeout=180000)
        print("      -> ✅ 服务器转码处理完毕，允许填写文案！")
    except PlaywrightTimeoutError:
        print("      -> ⚠️ 等待转码似乎超时，尝试继续强制执行后续步骤...")


def fill_publish_form(page, title: str, content: str, tags: list):
    print("      -> ✍️ 正在物理填入 AI 拟人化文案与标签...")
    title_input = page.locator("input[placeholder*='\u6807\u9898']").first
    if not title_input.is_visible():
        title_input = page.get_by_placeholder("\u586b\u5199\u6807\u9898\u4f1a\u6709\u66f4\u591a\u8d5e\u54e6").first
    title_input.wait_for(state="visible", timeout=10000)

    title_input.fill("")
    for char in title:
        page.keyboard.type(char, delay=random.randint(50, 150))

    clean_content = re.sub(r'#[^\s#]+', '', content).strip()

    body_locators = [
        page.locator(".ql-editor"),
        page.locator("div[contenteditable='true'][data-placeholder*='\u6b63\u6587']"),
        page.locator("div[contenteditable='true'][data-placeholder*='\u8f93\u5165']"),
        page.locator("textarea[placeholder*='\u6b63\u6587']"),
        page.locator("textarea[placeholder*='\u8f93\u5165']"),
        page.locator("div[contenteditable='true']").last
    ]

    editor_found = False
    for loc in body_locators:
        try:
            if loc.count() > 0 and loc.first.is_visible():
                node = loc.first
                node.evaluate("el => el.scrollIntoView({block:'center'})")
                page.wait_for_timeout(500)

                node.click(force=True)
                node.focus()
                page.wait_for_timeout(500)

                page.keyboard.press("Control+A")
                page.keyboard.press("Backspace")
                page.wait_for_timeout(500)

                print("      -> 📝 正在植入纯净正文...")
                pyperclip.copy(clean_content)
                page.keyboard.press("Control+V")
                page.wait_for_timeout(1000)

                page.keyboard.press("End")
                page.wait_for_timeout(200)
                page.keyboard.press("Enter")
                page.keyboard.press("Enter")
                page.wait_for_timeout(500)

                if tags:
                    print(f"      -> 🪄 正在注入底栏变色标签...")
                    for tag in tags:
                        page.keyboard.type("#" + tag, delay=random.randint(50, 100))
                        page.wait_for_timeout(800)
                        page.keyboard.press("Space")
                        page.wait_for_timeout(400)

                editor_found = True
                break
        except Exception:
            continue

    if not editor_found:
        print("      -> ❌ 警告：无法精准锁定正文输入框，可能导致排版失败！")


def click_publish_and_verify(page):
    page.mouse.click(10, 10)
    page.wait_for_timeout(1000)

    print("      -> 锁定发布按钮...")
    btn = page.get_by_role("button", name=TEXT_PUBLISH).first
    btn.wait_for(state="visible", timeout=10000)
    btn.evaluate("el => el.scrollIntoView({block:'center'})")
    btn.click(force=True)

    print("      -> 🕵️‍♂️ 正在智能校验视频是否发布成功...")
    try:
        success_pattern = re.compile(r"published=true|note-manager")
        page.wait_for_url(success_pattern, timeout=20000)
        print("      -> ✅ 智能校验通过：视频大作发布成功！")
        return True
    except PlaywrightTimeoutError:
        print("      -> ❌ 校验失败：页面未跳转成功状态。")
        return False


def execute_video_publish_flow(context, page, video_path: str, title: str, content: str, tags: list):
    page = navigate_to_publish_safely(context, page)
    upload_video_and_wait(page, video_path)
    fill_publish_form(page, title, content, tags)

    is_success = click_publish_and_verify(page)
    if not is_success:
        raise RuntimeError("智能校验未能确认发布成功状态。")


# ==========================================
# 模块 5：视频矩阵核心控制器 (🔥 真实数据联动版)
# ==========================================
def main():
    # 🔥 每次执行都会去读取前端配置好的真实媒体库数据
    real_tasks = load_real_video_tasks()

    print(f"🚀 启动无头【视频混剪防封高墙版】矩阵引擎，共扫描到 {len(real_tasks)} 个真实任务...\n")

    if not real_tasks:
        print("      -> 📭 当前没有需要发布的视频（请在前端确保视频状态为'未使用'并分配了账号）。")
        return

    for index, task in enumerate(real_tasks):
        profile_id = task["profile_id"]
        raw_video = task["raw_video_path"]
        fallback_topic = task.get("fallback_topic", "热门话题分享")
        filename = task["filename"]  # 用于后续更新前端状态

        print(f"\n========== 🎬 开始执行第 {index + 1} 个账号 (ID: {profile_id}) ==========")

        if not os.path.exists(raw_video):
            print(f"      -> ❌ 致命错误：找不到原视频文件：{raw_video}，直接跳过本账号！")
            write_run_log(profile_id, "5. 视频发帖", "warning", f"找不到原视频文件，已跳过")
            continue

        # 1. 物理洗稿 + 音频剥离 + 防封指纹注入
        processed_video, audio_path = process_video_and_extract_audio(raw_video)
        if not processed_video:
            write_run_log(profile_id, "5. 视频发帖", "error", "底层音视频洗稿失败")
            continue

        # 2. ASR 听写 + AI 逆向降智配文 (打造呼吸感)
        title, content, tags_list = generate_copywriting_from_audio(audio_path, fallback_topic)

        # 3. 启动浏览器开始发送
        print("[step] connect AdsPower")
        try:
            ws_url = start_adspower_profile(profile_id, ADSPOWER_API_KEY)
        except Exception as e:
            print(f"❌ 启动环境失败: {e}")
            write_run_log(profile_id, "5. 视频发帖", "error", f"启动环境失败: {e}")
            continue

        with sync_playwright() as p:
            browser = p.chromium.connect_over_cdp(ws_url)
            context = browser.contexts[0]

            page = get_live_page(context)
            for current_page in context.pages:
                if current_page != page and not current_page.is_closed():
                    try:
                        current_page.close()
                    except:
                        pass
            try:
                page.evaluate("window.moveTo(0, 0); window.resizeTo(screen.availWidth, screen.availHeight);")
            except:
                pass

            try:
                execute_video_publish_flow(context, page, processed_video, title, content, tags_list)
                print(f"✅ 账号 {profile_id} 视频闭环执行完毕！")

                # 🔥 汇报成功日志，并修改视频库状态为已发布
                write_run_log(profile_id, "5. 视频发帖", "success", f"视频 [{filename}] 发布成功")
                mark_video_published(filename)

            except Exception as exc:
                print(f"❌ 账号 {profile_id} 视频发布流程失败: {exc}")
                write_run_log(profile_id, "5. 视频发帖", "error", f"发布流程熔断: {exc}")
            finally:
                print("[step] 断开控制链路并彻底关闭浏览器...")
                browser.close()
                stop_adspower_profile(profile_id, ADSPOWER_API_KEY)

        # 4. 🔥 阅后即焚
        print("      -> 🔥 [阅后即焚] 正在彻底销毁本地生成的临时防封视频与录音...")
        for media_file in [processed_video, audio_path]:
            try:
                if media_file and os.path.exists(media_file):
                    os.remove(media_file)
            except Exception:
                pass

        if index < len(real_tasks) - 1:
            delay = random.randint(45, 90)
            print(f"⏳ 账号切换缓冲：防风控关联，安全等待 {delay} 秒...\n")
            time.sleep(delay)

    print("\n🎉 矩阵视频全流程执行完毕！完美收工！")


if __name__ == "__main__":
    main()