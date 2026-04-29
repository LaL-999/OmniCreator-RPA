import os
import random
import re
import time
import httpx
import pyautogui
import pyperclip
import uiautomation as auto
import numpy as np
import cv2
import json  # 🔥 新增：用于读取前端配置
from openai import OpenAI
from paddleocr import PaddleOCR
from PIL import ImageGrab
from logger import write_run_log


# 跳过模型源网络连接检测
os.environ["PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK"] = "True"

# ==========================================
# ⚙️ 动态配置中心 (连通前端 JSON)
# ==========================================
def load_configs():
    """动态读取前端生成的 JSON 配置文件"""
    base_dir = os.getcwd()
    configs_dir = os.path.join(base_dir, "configs")

    global_path = os.path.join(configs_dir, "global_config.json")
    desk_path = os.path.join(configs_dir, "auto_desk.json")

    global_data = {}
    if os.path.exists(global_path):
        with open(global_path, "r", encoding="utf-8") as f:
            global_data = json.load(f)

    desk_data = {}
    if os.path.exists(desk_path):
        with open(desk_path, "r", encoding="utf-8") as f:
            desk_data = json.load(f)

    return global_data, desk_data


# 执行加载
GLOBAL_DATA, DESK_DATA = load_configs()
RPA_CFG = DESK_DATA.get("rpaConfig", {})

# 重新组装 CONFIG 字典，如果没有读取到 JSON，就使用默认兜底值
CONFIG = {
    "target_app_names": ["小红书"],
    "api_key": GLOBAL_DATA.get("deepseekApiKey", "sk-8f095952e06045c7b0e81f03cc2d9b7d"),
    "base_url": "https://api.deepseek.com",

    # 【风控核心 1】：动态微信号矩阵 (读取前端数据)
    "wechat_variants": DESK_DATA.get("wechatVariants", [
        "JtdJzsJzjJrsZtm",
        "JtdJzsJzjJrsZtm ",
        "jtdjzsjzjjrsztm",
        "Jtd-Jzs-Jzj-Jrs-Ztm"
    ]),
    # 【风控核心 2】：防封引导词矩阵 (读取前端数据)
    "guide_words": DESK_DATA.get("guideWords", [
        "你平常看🟢吗？",
        "这儿发文件不太方便，有卫星🛰️吗？",
        "整理了一份避坑PDF，这发不了长图，可以加个V：",
        "详情有点长，怕被系统折叠，滴我🟢：",
    ]),

    # 【物理与视觉防封】：全部从前端 rpaConfig 中提取
    "cv_confidence": RPA_CFG.get("cv_confidence", 0.80),
    "max_unread_per_account": (RPA_CFG.get("max_unread_min", 2), RPA_CFG.get("max_unread_max", 5)),
    "chat_context_limit": RPA_CFG.get("chat_context_limit", 1600),
    "cooldown_between_accounts_sec": (RPA_CFG.get("cooldown_min", 45), RPA_CFG.get("cooldown_max", 90)),

    "asset": {
        "menu_btn": r"C:\Users\Administrator\Desktop\photo\menu_btn.png",
        "red_dot": r"C:\Users\Administrator\Desktop\photo\red_dot.png",
        "back_btn": r"C:\Users\Administrator\Desktop\photo\back_btn.png",
    },
}

# 动态提取前端下发的头像队列 (如果没有则用原来代码的兜底)
if DESK_DATA.get("tasks"):
    MATRIX_ACCOUNTS = [task.get("avatar_path", "") for task in DESK_DATA["tasks"] if task.get("avatar_path")]
else:
    MATRIX_ACCOUNTS = [r"C:\Users\Administrator\Desktop\photo\lishuang.png"]

# 动态获取 System Prompt 模板
SYSTEM_PROMPT_TEMPLATE = DESK_DATA.get("prompt", """
你是一个深谙人性的资深留学/法律顾问。你是一个【真实存在的人类】，正在亲自运营自己的小红书账号。
请阅读用户发来的私信消息，判断意图，并生成回复。

【🚨 最高指令 (生死红线)】：
绝对、永远、在任何情况下，都严禁承认自己是 AI、机器人、程序或助手！
你是一个有血有肉、天天加班回消息的打工人！

【意图分类】：
- CHAT：闲聊、感谢、吐槽、吃瓜、质疑你是不是AI（如：太惨了、谢谢、你是机器人吗）。
- LEAD：求助、要资料、问价格、找中介（如：求分享、怎么联系、遇到纠纷怎么办）。

【高情商回复秘籍】：
1. 如果是 CHAT：像个真人朋友一样附和，最多15个字。
2. 如果是 LEAD：采用“拉扯式引流”。先表示理解或共情，再说明这里不方便发，最后引导。
3. 在生成 LEAD 回复时，必须使用这个微信号：{current_wechat}，以及这句引导语：{current_guide}

【输出格式要求】（严禁输出额外废话）：
INTENT: [CHAT 或 LEAD]
REPLY: [回复内容]
""")

print("⏳ 正在初始化 PaddleOCR 引擎...")
ocr = PaddleOCR(use_angle_cls=False, lang="ch", show_log=False)
print("✅ OCR 引擎加载完成！\n")


# ==========================================
# 🛡️ 核心防封物理外挂库 (高斯分布 + 贝塞尔曲线升级)
# ==========================================
def gauss_wait(mu, sigma):
    """【防封基础】：基于高斯分布的正态延迟"""
    try:
        delay = random.gauss(mu, sigma)
        time.sleep(max(0.05, delay))
    except:
        pass


def human_move_to(target_x, target_y):
    """【防封核心】：贝塞尔曲线风格的拟人鼠标移动 (带微小过冲回调)"""
    try:
        start_x, start_y = pyautogui.position()
        distance = ((target_x - start_x) ** 2 + (target_y - start_y) ** 2) ** 0.5

        if distance < 50:
            pyautogui.moveTo(target_x, target_y, duration=random.uniform(0.1, 0.3), tween=pyautogui.easeOutQuad)
            return

        ctrl_x = start_x + (target_x - start_x) * random.uniform(0.4, 0.8) + random.randint(-60, 60)
        ctrl_y = start_y + (target_y - start_y) * random.uniform(0.4, 0.8) + random.randint(-60, 60)
        pyautogui.moveTo(ctrl_x, ctrl_y, duration=random.uniform(0.15, 0.25), tween=pyautogui.easeOutSine)

        if random.random() < 0.3:
            overshoot_x = target_x + random.randint(-15, 15)
            overshoot_y = target_y + random.randint(-15, 15)
            pyautogui.moveTo(overshoot_x, overshoot_y, duration=random.uniform(0.1, 0.2), tween=pyautogui.easeOutQuad)
            gauss_wait(0.1, 0.05)

        pyautogui.moveTo(target_x, target_y, duration=random.uniform(0.1, 0.2))
    except:
        pyautogui.moveTo(target_x, target_y, duration=0.3)


def smooth_scroll_down():
    """【物理防封】：切片式阻尼平滑滚轮，拒绝瞬间闪现"""
    steps = random.randint(5, 9)
    for _ in range(steps):
        pyautogui.scroll(-random.randint(80, 180))
        gauss_wait(0.1, 0.03)
    gauss_wait(1.0, 0.3)


def human_like_input(text: str):
    """【物理防封】：拟人化碎步输入法 (切块粘贴 + 手滑回删)"""
    print("      -> ⌨️ 启动 PC 端物理拟人输入引擎...")

    pyautogui.hotkey('ctrl', 'a')
    gauss_wait(0.2, 0.05)
    pyautogui.press('backspace')
    gauss_wait(0.3, 0.1)

    i = 0
    while i < len(text):
        chunk_size = random.randint(1, 4)
        chunk = text[i:i + chunk_size]

        pyperclip.copy(chunk)
        pyautogui.hotkey("ctrl", "v")

        if random.random() < 0.05:
            gauss_wait(0.5, 0.2)
            pyautogui.press("backspace", presses=len(chunk), interval=random.uniform(0.05, 0.15))
            gauss_wait(0.4, 0.1)
            pyperclip.copy(chunk)
            pyautogui.hotkey("ctrl", "v")
            print("      -> 🤏 触发拟人操作：哎呀打错字了，回删重打...")

        gauss_wait(0.15, 0.05)
        if random.random() < 0.08:
            gauss_wait(1.0, 0.3)

        i += chunk_size


# ==========================================
# 🛡️ 窗口安全锁
# ==========================================
def get_xhs_window():
    try:
        for win in auto.GetRootControl().GetChildren():
            if win.Name in CONFIG["target_app_names"]:
                rect = win.BoundingRectangle
                width = rect.right - rect.left
                height = rect.bottom - rect.top
                if width > 100 and height > 100:
                    return win, rect, width, height
    except Exception as e:
        print(f"      -> ⚠️ 获取窗口异常: {e}")
    return None, None, 0, 0


# ==========================================
# 🛠️ 视觉驱动引擎 (🔥 引入强力重试机制)
# ==========================================
def click_text_via_ocr(target_text: str, action_name: str, wait_after: float = 1.0, score_threshold: float = 0.7,
                       position_rule: str = 'bottom_most', retries: int = 3) -> bool:
    print(f"      -> [OCR 扫描] 寻找: 【{action_name}】 ('{target_text}') ...")

    for attempt in range(retries):
        try:
            win, rect, w, h = get_xhs_window()
            offset_x, offset_y = 0, 0

            if win:
                bbox = (rect.left, rect.top, rect.right, rect.bottom)
                offset_x, offset_y = rect.left, rect.top
                screen_pil = ImageGrab.grab(bbox=bbox, all_screens=True)
            else:
                screen_pil = ImageGrab.grab(all_screens=True)

            screen_np = np.array(screen_pil)
            if screen_np.size == 0 or screen_np.shape[0] == 0 or screen_np.shape[1] == 0:
                continue

            screen_bgr = cv2.cvtColor(screen_np, cv2.COLOR_RGB2BGR)
            result = ocr.ocr(screen_bgr, cls=False)

            if not result or not result[0]:
                if attempt < retries - 1:
                    print(f"      -> ⏳ 未捕获到有效文字，正在进行第 {attempt + 2} 次扫描...")
                    gauss_wait(1.5, 0.3)
                continue

            matches = []
            for line in result[0]:
                box, (text, score) = line[0], line[1]
                if score < score_threshold: continue

                clean_text = text.strip()
                if target_text in clean_text:
                    box_w = box[1][0] - box[0][0]
                    box_h = box[2][1] - box[0][1]

                    center_x = (box[0][0] + box[1][0]) / 2 + offset_x
                    center_y = (box[0][1] + box[2][1]) / 2 + offset_y

                    target_x = center_x + random.uniform(-box_w * 0.25, box_w * 0.25)
                    target_y = center_y + random.uniform(-box_h * 0.25, box_h * 0.25)

                    is_exact = (clean_text == target_text)
                    matches.append(
                        {'x': target_x, 'y': target_y, 'y_sort': center_y, 'text': clean_text, 'exact': is_exact})

            if not matches:
                if attempt < retries - 1:
                    print(f"      -> ⏳ 未匹配到【{target_text}】，正在进行第 {attempt + 2} 次扫描...")
                    gauss_wait(1.5, 0.3)
                continue

            exact_matches = [m for m in matches if m['exact']]
            if exact_matches: matches = exact_matches

            if position_rule == 'bottom_most':
                matches.sort(key=lambda m: m['y_sort'], reverse=True)
            elif position_rule == 'top_most':
                matches.sort(key=lambda m: m['y_sort'])

            best_match = matches[0]

            human_move_to(best_match['x'], best_match['y'])
            pyautogui.click()

            gauss_wait(wait_after + 0.3, 0.1)
            print(f"      -> ✅ [OK] 锁定目标 [{best_match['text']}]")
            return True
        except Exception as e:
            pass

    return False


def is_text_visible_via_ocr(target_text: str, bbox: tuple) -> bool:
    try:
        screen_pil = ImageGrab.grab(bbox=bbox, all_screens=True)
        screen_np = np.array(screen_pil)
        if screen_np.size == 0 or screen_np.shape[0] == 0 or screen_np.shape[1] == 0: return False

        screen_bgr = cv2.cvtColor(screen_np, cv2.COLOR_RGB2BGR)
        result = ocr.ocr(screen_bgr, cls=False)
        if not result or not result[0]: return False

        for line in result[0]:
            if target_text in line[1][0].strip():
                return True
        return False
    except Exception:
        return False


def click_image(image_path: str, action_name: str, confidence: float = None, grayscale: bool = True,
                wait_after: float = 1.0, retries: int = 3) -> bool:
    print(f"      -> [CV 扫描] 寻找图标: 【{action_name}】...")
    conf = confidence if confidence else CONFIG["cv_confidence"]

    for attempt in range(retries):
        try:
            win, rect, w, h = get_xhs_window()
            region = (rect.left, rect.top, w, h) if win else None

            box = pyautogui.locateOnScreen(image_path, confidence=conf, grayscale=grayscale, region=region)
            if not box:
                box = pyautogui.locateOnScreen(image_path, confidence=max(0.6, conf - 0.1), grayscale=grayscale,
                                               region=region)

            if box:
                target_x = box.left + box.width / 2 + random.uniform(-box.width * 0.2, box.width * 0.2)
                target_y = box.top + box.height / 2 + random.uniform(-box.height * 0.2, box.height * 0.2)

                human_move_to(target_x, target_y)
                pyautogui.click()
                gauss_wait(wait_after + 0.3, 0.1)
                print(f"      -> ✅ [OK] 点击成功")
                return True
            else:
                if attempt < retries - 1:
                    print(f"      -> ⏳ 图标未找到，正在进行第 {attempt + 2} 次扫描...")
                    gauss_wait(1.5, 0.3)
        except:
            pass

    print(f"      -> ❌ [MISS] 图标未匹配")
    return False


def find_red_dots_by_color(custom_region):
    """基于 HSV 色彩空间，扫描指定区域内的所有红色团块的中心坐标"""
    try:
        x, y, w, h = [int(v) for v in custom_region]
        screen_pil = ImageGrab.grab(bbox=(x, y, x + w, y + h), all_screens=True)
        img_np = np.array(screen_pil)
        if img_np.size == 0: return []

        hsv = cv2.cvtColor(img_np, cv2.COLOR_RGB2HSV)

        lower_red1 = np.array([0, 120, 70])
        upper_red1 = np.array([10, 255, 255])
        lower_red2 = np.array([170, 120, 70])
        upper_red2 = np.array([180, 255, 255])

        mask1 = cv2.inRange(hsv, lower_red1, upper_red1)
        mask2 = cv2.inRange(hsv, lower_red2, upper_red2)
        mask = mask1 + mask2

        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        dots = []
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if 15 < area < 1000:
                cx, cy, cw, ch = cv2.boundingRect(cnt)
                abs_x = x + cx + cw / 2
                abs_y = y + cy + ch / 2
                dots.append((abs_x, abs_y))

        dots.sort(key=lambda d: d[1])
        return dots
    except Exception as e:
        print(f"      -> ⚠️ 色彩提取异常: {e}")
        return []


def focus_target_window() -> bool:
    win, _, _, _ = get_xhs_window()
    if win:
        win.SetActive()
        win.SetTopmost(True)
        time.sleep(0.3)
        win.SetTopmost(False)
        return True
    return False


# ==========================================
# 🚀 启动引擎：智能系统级唤醒
# ==========================================
def launch_xhs():
    print("\n      -> [系统引擎] 正在检测小红书运行状态...")

    win, rect, w, h = get_xhs_window()
    if win:
        print("      -> ✅ 检测到小红书已在运行，直接进入自动化流程。")
        return True

    print("      -> ⚠️ 未检测到小红书，正在向 Windows 发送启动指令...")
    shortcut_path = r"C:\Users\Administrator\Desktop\小红书.lnk"

    try:
        if os.path.exists(shortcut_path):
            os.startfile(shortcut_path)
            print("      -> ✅ [OK] 快捷方式触发成功。")
        else:
            print("      -> ⚠️ 桌面快捷方式未找到，启用系统搜索(Win+S)唤醒兜底...")
            pyautogui.hotkey('win', 's')
            gauss_wait(1.0, 0.2)
            pyperclip.copy("小红书")
            pyautogui.hotkey('ctrl', 'v')
            gauss_wait(1.0, 0.2)
            pyautogui.press('enter')
            print("      -> ✅ [OK] 搜索触发成功。")

        print(f"      -> ⏳ 正在进行启动保护，等待客户端加载 (20秒)...")
        for i in range(20, 0, -1):
            print(f"         倒计时: {i}s...", end='\r')
            time.sleep(1)
        print("\n      -> 🚀 缓冲结束，尝试进入下一步流程。")

        return True
    except Exception as e:
        print(f"      -> ❌ 启动失败: {e}")
        return False


# ==========================================
# 🛡️ 文本防折叠混淆器
# ==========================================
def obfuscate_text(text: str) -> str:
    particles = ["~", "呀", "滴", "哈", "！", "～", ""]
    emojis = ["😂", "😭", "🙏", "👀", "✨", "🔥", "🤝", ""]

    safe_text = text.replace("微信", random.choice(["卫星", "V", "🟢", "vx"])) \
        .replace("私信", random.choice(["私我", "滴我", "主页找我"])) \
        .replace("多少钱", random.choice(["具体预算", "大概几个米"])) \
        .replace("代写", "辅导") \
        .replace("中介", "机构顾问")

    if safe_text and safe_text[-1] not in ["！", "？", "!", "?", "。"]:
        safe_text += random.choice(particles)

    safe_text += random.choice(emojis)
    return safe_text


# ==========================================
# 🧠 AI 大脑与数据处理
# ==========================================
def analyze_intent_and_reply(chat_history: str):
    compact = re.sub(r"\s+", " ", chat_history).strip()
    if not compact:
        fallback_chat = obfuscate_text("哈喽呀！刚刚在忙，才看到您的消息")
        return "CHAT", fallback_chat

    core_context = compact[-CONFIG["chat_context_limit"]:]

    current_wechat = random.choice(CONFIG["wechat_variants"])
    current_guide = random.choice(CONFIG["guide_words"])

    # 🔥 核心更新：使用通过前端下发的 SYSTEM_PROMPT_TEMPLATE 替换掉写死的 prompt
    system_prompt = SYSTEM_PROMPT_TEMPLATE.replace("{current_wechat}", current_wechat).replace("{current_guide}",
                                                                                               current_guide)

    try:
        client = OpenAI(api_key=CONFIG["api_key"], base_url=CONFIG["base_url"],
                        http_client=httpx.Client(trust_env=False))
        result = client.chat.completions.create(
            model="deepseek-chat",
            messages=[{"role": "system", "content": system_prompt},
                      {"role": "user", "content": f"聊天记录：\n{core_context}"}],
            temperature=0.85,
        )
        raw = result.choices[0].message.content.strip()

        intent_match = re.search(r"INTENT:\s*(CHAT|LEAD)", raw, re.IGNORECASE)
        reply_match = re.search(r"REPLY:\s*(.+)", raw, re.IGNORECASE | re.DOTALL)

        intent = intent_match.group(1).upper() if intent_match else "CHAT"
        raw_reply_text = reply_match.group(1).strip() if reply_match else f"可以的，{current_guide}{current_wechat}"

        print(f"      -> 💡 [AI 原始生成] 意图: {intent} | 回复: {raw_reply_text}")

        safe_reply_text = obfuscate_text(raw_reply_text)
        print(f"      -> 🛡️ [防风控混淆] 最终发送内容: {safe_reply_text}")

        return intent, safe_reply_text
    except Exception as exc:
        print(f"      -> ⚠️ [AI 异常] {exc}")
        fallback_lead = obfuscate_text(
            f"可以的，{random.choice(CONFIG['guide_words'])}{random.choice(CONFIG['wechat_variants'])}")
        return "LEAD", fallback_lead


def extract_chat_history() -> str:
    win, rect, w, h = get_xhs_window()
    if not win: return ""

    print("      -> [视觉引擎] 扫描并提取聊天记录...")
    safe_top = rect.top + int(h * 0.12)
    safe_bottom = rect.bottom - 150
    chat_bbox = (rect.left, safe_top, rect.right, safe_bottom)

    try:
        screen_pil = ImageGrab.grab(bbox=chat_bbox, all_screens=True)
        screen_np = np.array(screen_pil)
        if screen_np.size == 0: return ""

        screen_bgr = cv2.cvtColor(screen_np, cv2.COLOR_RGB2BGR)
        result = ocr.ocr(screen_bgr, cls=False)

        if not result or not result[0]:
            print("      -> ⚠️ 屏幕聊天区域未识别到文字，触发默认打招呼")
            return ""

        history_text = ""
        for line in result[0]:
            text = line[1][0].strip()
            if len(text) > 1 and text not in ["昨天", "今天", "消息", "已读"]:
                history_text += text + "。 "

        print(f"      -> 📜 成功提取上下文: {history_text[-30:]}...")
        return history_text.strip()

    except Exception as e:
        print(f"      -> ⚠️ 提取聊天记录异常: {e}")
        return ""


def send_reply(reply_text: str):
    win, rect, w, h = get_xhs_window()
    if not win: return

    input_x = rect.left + w / 2 + random.randint(-80, 80)
    input_y = rect.bottom - 80 + random.randint(-10, 10)
    human_move_to(input_x, input_y)
    pyautogui.click()
    gauss_wait(0.4, 0.1)

    human_like_input(reply_text)

    if not click_text_via_ocr("发送", "发送按钮", wait_after=1.5, position_rule="bottom_most", retries=3):
        pyautogui.press("enter")
        print("      -> ✅ [OK] 回车键发送兜底")


# ==========================================
# 🔄 业务流控制 (🔥 碎片化执行版)
# ==========================================
def switch_to_account(account_avatar_path: str) -> bool:
    print("\n[step] 执行账号切换流...")

    # 【核心修复】：加入 OCR 3 次容错重试 + 盲操作兜底
    clicked_me = click_text_via_ocr("我", "底部导航'我'", wait_after=2.0, position_rule="bottom_most", retries=3)

    if not clicked_me:
        print("      -> ⚠️ OCR 连续 3 次未找到【我】，触发强行盲点兜底机制...")
        win, rect, w, h = get_xhs_window()
        if win:
            # 物理坐标兜底：小红书左下角固定位置
            human_move_to(rect.left + 40 + random.randint(-5, 5), rect.bottom - 120 + random.randint(-10, 10))
            pyautogui.click()
            gauss_wait(2.0, 0.5)
        else:
            return False

    win, rect, w, h = get_xhs_window()
    if win:
        screen_w, screen_h = pyautogui.size()
        is_fullscreen = w >= (screen_w - 50)
        menu_x, menu_y = (rect.left + 35, rect.top + 105) if is_fullscreen else (rect.left + 42, rect.top + 105)
        human_move_to(menu_x + random.randint(-5, 5), menu_y + random.randint(-5, 5))
        pyautogui.click()
        gauss_wait(2.0, 0.3)
    else:
        return False

    if not click_text_via_ocr("设置", "侧边栏'设置'", wait_after=2.0, position_rule="bottom_most", retries=3):
        return False

    center_x, center_y = rect.left + w / 2, rect.top + h / 2
    found_switch = False
    for _ in range(5):
        if click_text_via_ocr("切换账号", "菜单项'切换账号'", wait_after=2.0, position_rule="bottom_most", retries=2):
            found_switch = True
            break

        human_move_to(center_x + random.randint(-20, 20), center_y + random.randint(-20, 20))
        pyautogui.mouseDown(button='left')
        gauss_wait(0.2, 0.05)
        human_move_to(center_x + random.randint(-20, 20), center_y - 400 + random.randint(-30, 30))
        gauss_wait(0.2, 0.05)
        pyautogui.mouseUp(button='left')
        gauss_wait(1.0, 0.2)

    if not found_switch:
        pyautogui.press("esc", presses=2, interval=0.5)
        return False

    print("      -> 寻找目标账号头像...")
    if click_image(account_avatar_path, "目标头像", confidence=CONFIG["cv_confidence"], grayscale=False, wait_after=6.0,
                   retries=3):
        return True

    print("      -> ⚠️ 找不到目标头像！执行容错策略：连按 ESC 返回主界面...")
    pyautogui.press("esc", presses=2, interval=0.5)
    gauss_wait(1.0, 0.2)
    pyautogui.click(center_x, center_y)
    gauss_wait(1.0, 0.2)
    return True


def process_fragmented_unread_for_current_account():
    print("\n[step] 导航至消息中心...")
    if not click_text_via_ocr("消息", "底部导航'消息'", wait_after=2.0, position_rule="bottom_most", retries=3):
        print("      -> ⚠️ OCR 连续 3 次未找到【消息】，执行侧边栏物理盲点兜底...")
        win, rect, w, h = get_xhs_window()
        if win:
            msg_x = rect.left + (w * 0.70) + random.randint(-15, 15)
            msg_y = rect.bottom - 30 + random.randint(-5, 5)
            human_move_to(msg_x, msg_y)
            pyautogui.click()
            gauss_wait(2.5, 0.3)
        else:
            return

    target_handle_count = random.randint(*CONFIG["max_unread_per_account"])
    print(f"[step] 🎲 触发【碎片化】处理机制：本账号本次只扫荡 {target_handle_count} 条私信！")

    handled, no_dot_rounds = 0, 0
    stop_scrolling = False

    while handled < target_handle_count:
        win, rect, w, h = get_xhs_window()
        if not win: break

        safe_top = rect.top + int(h * 0.28)
        safe_height = int(h * 0.60)

        chat_list_bbox = (rect.left, safe_top, rect.right, safe_top + safe_height)
        if not stop_scrolling:
            if is_text_visible_via_ocr("昨天", bbox=chat_list_bbox):
                print("      -> 🛑 触发边界：发现时间词 '昨天'！停止向下翻页。")
                stop_scrolling = True

        right_zone_left = rect.left + int(w * 0.80)
        right_zone_width = int(w * 0.20)
        red_dot_region = (right_zone_left, safe_top, right_zone_width, safe_height)

        red_dots = find_red_dots_by_color(custom_region=red_dot_region)

        if not red_dots:
            if stop_scrolling:
                print("      -> ✅ 当前页已无红点，当前账号碎片任务结束！")
                break

            no_dot_rounds += 1
            if no_dot_rounds >= 2: break

            human_move_to(rect.left + w / 2 + random.randint(-50, 50),
                          safe_top + safe_height / 2 + random.randint(-50, 50))
            smooth_scroll_down()
            continue

        no_dot_rounds = 0
        dot_x, dot_y = red_dots[0]

        click_x = rect.left + w / 2 + random.randint(-60, 60)
        click_y = dot_y + random.randint(-6, 6)

        human_move_to(click_x, click_y)
        pyautogui.click()

        if random.random() < 0.2:
            print("      -> 📖 摸鱼：花点时间阅读前文记录...")
            gauss_wait(4.5, 1.0)
        else:
            gauss_wait(2.0, 0.5)

        chat_history = extract_chat_history()
        intent, reply_text = analyze_intent_and_reply(chat_history)
        send_reply(reply_text)

        handled += 1
        gauss_wait(1.8, 0.4)

        if not click_image(CONFIG["asset"]["back_btn"], "返回箭头", wait_after=1.5, retries=3):
            pyautogui.press("esc")
            gauss_wait(1.5, 0.2)

    print(f"\n✅ 达到碎片化限制阈值，当前账号本轮私信收割完毕！(共回复: {handled} 单)")


def main():
    print("=====================================================")
    print("🚀 [私域收割机] PC物理外挂·碎片化防封定版 启动")
    print("=====================================================\n")

    if not launch_xhs():
        print("🛑 致命错误：启动小红书失败，程序终止！")
        write_run_log("PC端物理外挂", "3. 私信收割", "error", "未能唤醒小红书 PC 客户端")
        return

    if not focus_target_window():
        print("🛑 致命错误：未检测到小红书可见客户端！")
        return

    for idx, account_image in enumerate(MATRIX_ACCOUNTS, start=1):
        # 提取头像文件名作为标识
        display_id = os.path.basename(account_image) if isinstance(account_image, str) else f"账号_{idx}"
        print(f"\n========== 🎬 处理第 {idx}/{len(MATRIX_ACCOUNTS)} 个账号 ({display_id}) ==========")

        if not switch_to_account(account_image):
            print(f"⚠️ 切换流中断，跳过该账号...")
            write_run_log(display_id, "3. 私信收割", "warning", "头像识别失败，切换账号中断")
            continue

        try:
            process_fragmented_unread_for_current_account()
            # 🔥 汇报成功
            write_run_log(display_id, "3. 私信收割", "success", "本轮私信收割清缴完毕")
        except Exception as exc:
            print(f"❌ 账号处理异常: {exc}")
            # 🔥 汇报失败
            write_run_log(display_id, "3. 私信收割", "error", f"执行异常: {exc}")

        if idx < len(MATRIX_ACCOUNTS):
            delay = random.randint(*CONFIG["cooldown_between_accounts_sec"])
            print(f"\n⏳ 账号深层冷却保护，防特征关联，等待 {delay} 秒...")
            time.sleep(delay)

    print("\n🎉 全矩阵轮询完毕！准备退出小红书...")
    # ... 后续关闭小红书的代码保持不变 ...
    win, rect, w, h = get_xhs_window()
    if win:
        win.SetActive()
        time.sleep(0.5)
        close_x = rect.right - 200 + random.randint(-5, 5)
        close_y = rect.top + 25 + random.randint(-3, 3)
        print(f"      -> 移动至右上角点击关闭 [X] ({int(close_x)}, {int(close_y)})...")
        human_move_to(close_x, close_y)
        pyautogui.click()
        gauss_wait(1.5, 0.2)
        try:
            bbox = (rect.left, rect.top, rect.right, rect.bottom)
            screen_bgr = cv2.cvtColor(np.array(ImageGrab.grab(bbox=bbox, all_screens=True)), cv2.COLOR_RGB2BGR)
            result = ocr.ocr(screen_bgr, cls=False)
            found_exit = False
            if result and result[0]:
                for line in result[0]:
                    text = line[1][0].strip()
                    if text == "退出":
                        box = line[0]
                        cx = (box[0][0] + box[1][0]) / 2 + rect.left
                        cy = (box[0][1] + box[2][1]) / 2 + rect.top
                        target_cx = cx + random.randint(-8, 8)
                        target_cy = cy + random.randint(-4, 4)
                        human_move_to(target_cx, target_cy)
                        pyautogui.click()
                        found_exit = True
                        break
            if not found_exit:
                pyautogui.press('enter')
        except Exception as e:
            pyautogui.press('enter')

    print("\n💤 流程结束，机器进入休眠。")


if __name__ == "__main__":
    main()