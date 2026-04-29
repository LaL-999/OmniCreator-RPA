import time
import random
import requests
import httpx
import re
import json  # 🔥 新增：用于读取 JSON
import os  # 🔥 新增：用于路径处理
from openai import OpenAI
from playwright.sync_api import sync_playwright
from logger import write_run_log


# ==========================================
# ⚙️ 动态配置中心 (连通前端 JSON)
# ==========================================
def load_configs():
    base_dir = os.getcwd()
    configs_dir = os.path.join(base_dir, "configs")
    global_path = os.path.join(configs_dir, "global_config.json")
    script_path = os.path.join(configs_dir, "auto_dm.json")

    global_data = {}
    if os.path.exists(global_path):
        with open(global_path, "r", encoding="utf-8") as f: global_data = json.load(f)
    script_data = {}
    if os.path.exists(script_path):
        with open(script_path, "r", encoding="utf-8") as f: script_data = json.load(f)
    return global_data, script_data


GLOBAL_DATA, SCRIPT_DATA = load_configs()

# 🔥 从全局配置提取核心密钥
API_KEY = GLOBAL_DATA.get("adspowerApiKey", "78d891ffc160582bc0af4d3d4f6693ce0089ff9076ded42a")
DEEPSEEK_API_KEY = GLOBAL_DATA.get("deepseekApiKey", "sk-8f095952e06045c7b0e81f03cc2d9b7d")

# 🔥 从本脚本配置提取策略参数
WECHAT_VARIANTS = SCRIPT_DATA.get("wechatVariants", [
    "MyWeChat12345", "MyWeChat12345 ", "mywechat12345", "MyWeChat-12345"
])
GUIDE_WORDS = SCRIPT_DATA.get("guideWords", [
    "你平常看🟢吗？", "这儿发文件不太方便，有卫星🛰️吗？", "整理了一份避坑PDF，滴我🟢："
])
MAX_TIME_WINDOW_MINUTES = SCRIPT_DATA.get("timeWindow", 355)

if SCRIPT_DATA.get("tasks"):
    MATRIX_PROFILES = [task.get("profile_id", "") for task in SCRIPT_DATA["tasks"] if task.get("profile_id")]
else:
    MATRIX_PROFILES = ["k1bhea90", "k1bheai1", "k1bheamh"]

RPA_CFG = SCRIPT_DATA.get("rpaConfig", {})
FOLLOW_QUOTA = (RPA_CFG.get("follow_quota_min", 2), RPA_CFG.get("follow_quota_max", 5))
REPLY_QUOTA = (RPA_CFG.get("reply_quota_min", 2), RPA_CFG.get("reply_quota_max", 4))
COOLDOWN_RANGE = (RPA_CFG.get("cooldown_min", 60), RPA_CFG.get("cooldown_max", 150))

SYSTEM_PROMPT_TEMPLATE = SCRIPT_DATA.get("prompt", "你是一个深谙人性的资深顾问...")


# ==========================================
# 🛡️ 核心防封组件：物理拟人操作库 (高斯分布增强版)
# ==========================================
def gauss_wait(page, mu, sigma):
    try:
        delay = random.gauss(mu, sigma)
        page.wait_for_timeout(int(max(0.2, delay) * 1000))
    except:
        pass


def redundant_mouse_move(page):
    try:
        if random.random() < 0.4:
            vp = page.viewport_size
            if vp:
                rand_x = random.randint(int(vp['width'] * 0.2), int(vp['width'] * 0.8))
                rand_y = random.randint(int(vp['height'] * 0.2), int(vp['height'] * 0.8))
                page.mouse.move(rand_x, rand_y, steps=random.randint(15, 30))
                gauss_wait(page, 0.8, 0.3)
    except:
        pass


def human_like_typing(page, text):
    print("      -> ⌨️ 触发拟人键盘输入引擎 (含手残回删机制)...")
    try:
        for char in text:
            if random.random() < 0.05 and char.strip():
                wrong_char = random.choice('abcdefghijklmnopqrstuvwxyz')
                page.keyboard.type(wrong_char, delay=random.randint(50, 150))
                gauss_wait(page, 0.4, 0.1)
                page.keyboard.press("Backspace")
                gauss_wait(page, 0.2, 0.05)
            page.keyboard.type(char, delay=random.randint(80, 250))
            if random.random() < 0.08:
                gauss_wait(page, 0.8, 0.3)
    except:
        pass


def is_new_comment(text_content, max_minutes=355):
    if "刚刚" in text_content:
        return True
    min_match = re.search(r"(\d+)\s*分钟前", text_content)
    if min_match:
        return int(min_match.group(1)) <= max_minutes
    hour_match = re.search(r"(\d+)\s*小时前", text_content)
    if hour_match:
        return (int(hour_match.group(1)) * 60) <= max_minutes
    return False


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
# 模块 1：AI 意图嗅探与回复生成大脑
# ==========================================
def analyze_intent_and_reply(user_message):
    print(f"\n🧠 正在分析对方互动意图: [{user_message[:50]}...]")

    client = OpenAI(
        api_key=DEEPSEEK_API_KEY,  # 🔥 修复：动态获取全局密钥
        base_url="https://api.deepseek.com",
        http_client=httpx.Client(trust_env=False)
    )

    current_wechat = random.choice(WECHAT_VARIANTS)
    current_guide = random.choice(GUIDE_WORDS)

    # 🔥 修复：动态植入提示词
    system_prompt = SYSTEM_PROMPT_TEMPLATE.replace("{current_wechat}", current_wechat).replace("{current_guide}",
                                                                                               current_guide)

    try:
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"用户发来的内容：{user_message}"}
            ],
            temperature=0.85
        )
        ai_result = response.choices[0].message.content.strip()
        print(f"      -> 💡 AI 销冠大脑决策完毕：\n{ai_result}")

        intent_line = [line for line in ai_result.split('\n') if "INTENT:" in line][0]
        reply_line = [line for line in ai_result.split('\n') if "REPLY:" in line][0]

        intent = "LEAD" if "LEAD" in intent_line else "CHAT"
        raw_reply_text = reply_line.replace("REPLY:", "").strip()

        safe_reply_text = obfuscate_text(raw_reply_text)
        print(f"      -> 🛡️ [防风控混淆] 最终发送内容: {safe_reply_text}")

        return intent, safe_reply_text
    except Exception as e:
        print(f"      -> ⚠️ AI 格式解析失败，启用安全降级回复 ({e})")
        fallback_chat = obfuscate_text("哈喽呀！刚刚在忙，才看到您的消息")
        return "CHAT", fallback_chat


# ==========================================
# 模块 2：AdsPower API 控制
# ==========================================
def start_adspower_profile(profile_id: str, api_key: str) -> str:
    headers = {"Authorization": f"Bearer {api_key}"}
    start_url = f"http://127.0.0.1:50325/api/v1/browser/start?user_id={profile_id}"
    resp = requests.get(start_url, headers=headers).json()
    return resp["data"]["ws"]["puppeteer"]


def stop_adspower_profile(profile_id: str, api_key: str):
    try:
        requests.get(f"http://127.0.0.1:50325/api/v1/browser/stop?user_id={profile_id}",
                     headers={"Authorization": f"Bearer {api_key}"}, timeout=10)
    except Exception:
        pass


# ==========================================
# 模块 3：通知处理核心流
# ==========================================
def handle_notifications(page):
    print("[step] 导航至小红书首页，准备进入【通知】中心...")
    page.goto("https://www.xiaohongshu.com/explore")
    gauss_wait(page, 5.0, 1.0)

    print("      -> 寻找【通知】入口...")
    try:
        notify_tab = page.locator("li:has-text('通知'):visible, a:has-text('通知'):visible").first
        notify_tab.wait_for(state="visible", timeout=10000)
        notify_tab.click(force=True)
        gauss_wait(page, 4.0, 1.0)
    except Exception as e:
        print("      -> ❌ 找不到通知入口，脚本退出：", e)
        return

    print("\n[step] 正在检查【新增关注】模块...")
    try:
        new_follow_tab = page.get_by_text("新增关注", exact=True).last
        if new_follow_tab.is_visible():
            new_follow_tab.click(force=True)
            gauss_wait(page, 3.0, 1.0)

            # 🔥 修复：读取前端设定的回关上限
            max_follows_this_run = random.randint(*FOLLOW_QUOTA)
            print(f"      -> 🎲 【碎片化保护】：本次运行只计划回关 {max_follows_this_run} 个粉丝...")

            follow_count = 0
            while follow_count < max_follows_this_run:
                follow_btns = page.get_by_text("回关", exact=True)
                if follow_btns.count() > 0 and follow_btns.first.is_visible():
                    follow_btns.first.click(force=True)
                    follow_count += 1
                    print(f"      -> 🤝 成功回关第 {follow_count} 个新粉丝！")
                    gauss_wait(page, 5.0, 1.5)
                    redundant_mouse_move(page)
                else:
                    break

            if follow_count > 0:
                print(f"      -> ✅ 本轮限量回关任务结束 (共 {follow_count} 人)。")
            else:
                print("      -> 暂无需要回关的新粉丝。")
    except Exception as e:
        print(f"      -> ⚠️ 回关检查过程出现异常: {e}")

    print("\n[step] 正在检查【评论和@】模块...")
    try:
        comment_tab = page.get_by_text("评论和@", exact=True).last
        if comment_tab.is_visible():
            comment_tab.click(force=True)
            gauss_wait(page, 4.0, 1.0)

            print("      -> 📜 正在平滑向下滚动屏幕，加载更多历史通知...")
            vp = page.viewport_size
            if vp:
                page.mouse.click(vp['width'] / 2, vp['height'] / 2)
                gauss_wait(page, 0.5, 0.1)

            for _ in range(random.randint(2, 4)):
                for _ in range(random.randint(5, 10)):
                    page.keyboard.press("ArrowDown")
                    page.wait_for_timeout(random.randint(150, 400))
                redundant_mouse_move(page)
                if random.random() < 0.3:
                    page.keyboard.press("PageDown")
                gauss_wait(page, 2.0, 0.5)

            # 🔥 修复：读取前端设定的处理上限
            max_comments_this_run = random.randint(*REPLY_QUOTA)
            print(f"      -> 🎲 【碎片化保护】：本次运行最多只处理 {max_comments_this_run} 条互动...")

            replied_in_this_run = set()
            total_processed = 0

            for iteration in range(20):
                if total_processed >= max_comments_this_run:
                    print(
                        f"      -> 🛑 触发保护机制：已达到本次设定的 {max_comments_this_run} 条处理上限，立刻停手，假装下线！")
                    break

                action_texts = page.get_by_text(re.compile(r"评论了你的笔记|回复了你|评论了")).all()
                processed_in_this_iteration = False

                for action in action_texts:
                    if total_processed >= max_comments_this_run:
                        break

                    if not action.is_visible(): continue

                    try:
                        block = action.locator("xpath=./ancestor::div[2]").first
                        text_content = block.inner_text()
                    except:
                        continue

                    if not text_content.strip(): continue
                    if "原评论已删除" in text_content: continue

                    # 🔥 修复：读取前端设定的时间锁
                    if not is_new_comment(text_content, MAX_TIME_WINDOW_MINUTES): continue

                    fragment = text_content.replace('\n', ' ')[:40]
                    if fragment in replied_in_this_run: continue

                    print(f"\n      -> 🎯 锁定一条尚未处理的互动：\n        [片段]: {fragment}...")

                    user_message = text_content.replace("\n", " ")
                    intent, reply_text = analyze_intent_and_reply(user_message)

                    print("      -> 尝试呼出输入框...")
                    inline_reply_btn = block.get_by_text("回复", exact=True).first
                    if inline_reply_btn.is_visible():
                        inline_reply_btn.click(force=True)
                    else:
                        action.click(force=True)

                    gauss_wait(page, 2.5, 0.5)

                    comment_trigger = page.locator(
                        "input[placeholder*='回复'], textarea[placeholder*='回复'], input[placeholder*='说点什么'], textarea[placeholder*='说点什么'], span:has-text('说点什么')").last

                    if not comment_trigger.is_visible():
                        comment_trigger = page.get_by_text("回复", exact=False).last

                    comment_trigger.wait_for(state="visible", timeout=8000)
                    comment_trigger.click(force=True)
                    gauss_wait(page, 1.5, 0.3)

                    try:
                        comment_trigger.fill("")
                    except:
                        page.keyboard.press("Control+A")
                        page.keyboard.press("Backspace")
                    gauss_wait(page, 0.5, 0.1)

                    human_like_typing(page, reply_text)
                    gauss_wait(page, 1.5, 0.5)

                    print("      -> 尝试执行真实发送动作...")
                    send_btn = page.get_by_text("发送", exact=True).last
                    if send_btn.is_visible():
                        send_btn.click(force=True)
                        print(f"      -> 💥 ✅ 已真实点击【发送】按钮！(意图: {intent})")
                    else:
                        page.keyboard.press("Enter")
                        print(f"      -> 💥 ✅ 已真实执行【回车发送】！(意图: {intent})")

                    gauss_wait(page, 4.0, 1.0)

                    print("      -> 🚪 清理现场...")
                    cancel_btn = page.get_by_text("取消", exact=True).last
                    if cancel_btn.is_visible():
                        cancel_btn.click(force=True)
                        gauss_wait(page, 1.0, 0.2)

                    page.keyboard.press("Escape")
                    gauss_wait(page, 1.5, 0.2)

                    replied_in_this_run.add(fragment)
                    total_processed += 1
                    processed_in_this_iteration = True
                    break

                if not processed_in_this_iteration:
                    break

            print(f"\n      -> 📭 本轮【碎片化】处理结束。共真实回复了 {total_processed} 条有效互动。")

    except Exception as e:
        print("      -> ❌ 处理【评论和@】时发生整体异常:", e)


# ==========================================
# 模块 4：矩阵核心控制器
# ==========================================
def main():
    print(f"🚀 启动 [私域收割机] 矩阵轮询系统 (高斯平滑降频防封版)，共装载 {len(MATRIX_PROFILES)} 个账号...\n")

    for index, profile_id in enumerate(MATRIX_PROFILES):
        print(f"\n========== 🎬 开始执行第 {index + 1} 个账号 (ID: {profile_id}) ==========")

        try:
            ws_url = start_adspower_profile(profile_id, API_KEY)
        except Exception as e:
            print(f"❌ 启动 AdsPower 环境失败，跳过此账号: {e}")
            write_run_log(profile_id, "4. 回关互动", "error", f"启动环境失败: {e}")
            continue

        with sync_playwright() as p:
            browser = p.chromium.connect_over_cdp(ws_url)
            context = browser.contexts[0]

            page = context.pages[0] if context.pages else context.new_page()
            for cp in context.pages:
                if cp != page:
                    try:
                        cp.close()
                    except:
                        pass
            try:
                page.evaluate("window.moveTo(0, 0); window.resizeTo(screen.availWidth, screen.availHeight);")
            except:
                pass

            try:
                handle_notifications(page)
                # 🔥 汇报成功
                write_run_log(profile_id, "4. 回关互动", "success", "互动与回关任务处理完毕")
            except Exception as exc:
                print(f"\n❌ 脚本执行流发生异常: {exc}")
                # 🔥 汇报失败
                write_run_log(profile_id, "4. 回关互动", "error", f"执行流异常熔断: {exc}")
            finally:
                print(f"[step] 账号 {profile_id} 任务结束，断开链路并物理销毁浏览器...")
                try:
                    browser.close()
                except:
                    pass
                stop_adspower_profile(profile_id, API_KEY)

        if index < len(MATRIX_PROFILES) - 1:
            delay = random.randint(*COOLDOWN_RANGE)
            print(f"⏳ 账号切换缓冲：为了防网络指纹关联，深度休眠 {delay} 秒...\n")
            time.sleep(delay)

    print("\n🎉 矩阵全流程轮询完毕！所有账号已安全下线！")


if __name__ == "__main__":
    main()