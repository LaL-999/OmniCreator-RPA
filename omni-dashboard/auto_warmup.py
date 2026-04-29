import os
import time
import random
import re
import requests
import httpx
import json  # 🔥 新增：用于读取 JSON
from openai import OpenAI
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError
from logger import write_run_log


# ==========================================
# ⚙️ 动态配置中心 (连通前端 JSON)
# ==========================================
def load_configs():
    base_dir = os.getcwd()
    configs_dir = os.path.join(base_dir, "configs")
    global_path = os.path.join(configs_dir, "global_config.json")
    script_path = os.path.join(configs_dir, "auto_warmup.json")

    global_data = {}
    if os.path.exists(global_path):
        with open(global_path, "r", encoding="utf-8") as f: global_data = json.load(f)
    script_data = {}
    if os.path.exists(script_path):
        with open(script_path, "r", encoding="utf-8") as f: script_data = json.load(f)
    return global_data, script_data


GLOBAL_DATA, SCRIPT_DATA = load_configs()

# 🔥 全局核心密钥提取
ADSPOWER_API_KEY = GLOBAL_DATA.get("adspowerApiKey", "78d891ffc160582bc0af4d3d4f6693ce0089ff9076ded42a")
DEEPSEEK_API_KEY = GLOBAL_DATA.get("deepseekApiKey", "sk-8f095952e06045c7b0e81f03cc2d9b7d")

# 🔥 脚本专属策略参数提取
if SCRIPT_DATA.get("tasks"):
    MATRIX_PROFILES = [task.get("profile_id", "") for task in SCRIPT_DATA["tasks"] if task.get("profile_id")]
else:
    MATRIX_PROFILES = ["k1bhea90", "k1bheai1", "k1bheamh"]

BENIGN_KEYWORDS = SCRIPT_DATA.get("keywords", [
    "猫咪日常", "周末探店", "减脂餐教程", "卧室改造", "小众旅游地", "职场穿搭"
])

RPA_CFG = SCRIPT_DATA.get("rpaConfig", {})
WARMUP_DURATION_MINUTES = (RPA_CFG.get("warmup_min", 8), RPA_CFG.get("warmup_max", 15))
COOLDOWN_RANGE = (RPA_CFG.get("cooldown_min", 120), RPA_CFG.get("cooldown_max", 300))

# 🔥 提取马尔可夫链行为概率权重
WEIGHT_FEED = RPA_CFG.get("weight_feed", 60)
WEIGHT_SEARCH = RPA_CFG.get("weight_search", 20)
WEIGHT_NOTIFY = RPA_CFG.get("weight_notify", 15)
WEIGHT_PROFILE = RPA_CFG.get("weight_profile", 5)

SYSTEM_PROMPT_TEMPLATE = SCRIPT_DATA.get("prompt", "你是一个正在摸鱼刷小红书的普通网友...")


# ==========================================
# 🧠 AI 大脑：真实情绪废话生成器
# ==========================================
def generate_authentic_comment(title, content):
    print("         -> 🧠 正在基于帖子内容，构思真实的网民情绪评论...")
    client = OpenAI(
        api_key=DEEPSEEK_API_KEY,
        base_url="https://api.deepseek.com",
        http_client=httpx.Client(trust_env=False)
    )

    # 🔥 动态植入前端设定的提示词
    system_prompt = SYSTEM_PROMPT_TEMPLATE

    try:
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"帖子标题：{title}\n帖子正文片段：{content[:200]}"}
            ],
            temperature=0.9
        )
        reply = response.choices[0].message.content.strip().replace('"', '').replace('“', '').replace('”', '')
        print(f"         -> 💬 拟人情绪生成完毕：[{reply}]")
        return reply
    except Exception as e:
        print(f"         -> ⚠️ 废话生成失败 ({e})")
        return ""


# ==========================================
# 🛡️ 核心物理防封引擎 (底层强制容错升级)
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
                gauss_wait(page, 1.0, 0.5)
    except:
        pass


def safe_physical_click(page, locator, aim_high=False):
    """【绝对狙击版】：彻底废弃相对百分比，使用绝对物理像素偏移，告别误触"""
    try:
        locator.wait_for(state="visible", timeout=4000)
        locator.evaluate("el => el.scrollIntoView({block: 'center', behavior: 'smooth'})")
        gauss_wait(page, 0.8, 0.2)

        box = locator.bounding_box()
        if box:
            x_variance = 10
            y_variance = 10

            if aim_high:
                y_anchor = 0.40
            else:
                y_anchor = 0.50

            target_x = box['x'] + box['width'] / 2 + random.uniform(-x_variance, x_variance)
            target_y = box['y'] + box['height'] * y_anchor + random.uniform(-y_variance, y_variance)

            if random.random() < 0.3:
                page.mouse.move(target_x + random.randint(-15, 15), target_y + random.randint(-15, 15),
                                steps=random.randint(10, 20))
                gauss_wait(page, 0.4, 0.1)

            page.mouse.move(target_x, target_y, steps=random.randint(10, 20))
            gauss_wait(page, 0.2, 0.05)
            page.mouse.click(target_x, target_y)
            return True
    except Exception as e:
        pass
    return False


def smooth_scroll_with_overshoot(page, total_delta_y):
    try:
        steps = random.randint(15, 30)
        step_y = total_delta_y // steps
        for _ in range(steps):
            page.mouse.wheel(0, step_y)
            page.wait_for_timeout(random.randint(15, 40))

        if random.random() < 0.3:
            overshoot = random.randint(100, 350)
            page.mouse.wheel(0, overshoot)
            gauss_wait(page, 0.6, 0.2)
            page.mouse.wheel(0, -overshoot)
            gauss_wait(page, 0.4, 0.1)
    except:
        pass


def human_like_typing(page, text):
    try:
        for char in text:
            if random.random() < 0.05 and char.strip():
                wrong_char = random.choice('abcdefghijklmnopqrstuvwxyz')
                page.keyboard.type(wrong_char, delay=random.randint(50, 150))
                gauss_wait(page, 0.4, 0.1)
                page.keyboard.press("Backspace")
                gauss_wait(page, 0.2, 0.05)
            page.keyboard.type(char, delay=random.randint(80, 250))
    except:
        pass


# ==========================================
# 📖 内容感知型深度阅读
# ==========================================
def extract_text_safely(page, locators):
    for loc in locators:
        try:
            el = page.locator(loc).first
            if el.count() > 0:
                text = el.inner_text(timeout=1000).strip()
                if text: return text
        except:
            continue
    return ""


def calculate_reading_time(text_len):
    if text_len < 20: text_len = random.randint(20, 60)
    base_time = text_len / 10.0
    actual_time = random.gauss(base_time, base_time * 0.3)
    return max(4.0, min(actual_time, 45.0))


def deep_read_post(page):
    print(f"         -> 📖 成功确认弹窗！进入详情页，抓取上下文以评估阅读时长...")
    gauss_wait(page, 3.0, 0.5)

    title_locators = ["#detail-title"]
    desc_locators = ["#detail-desc", ".note-text"]

    post_title = extract_text_safely(page, title_locators)
    post_desc = extract_text_safely(page, desc_locators)

    read_time = calculate_reading_time(len(post_title) + len(post_desc))
    print(f"         -> ⏱️ 内容感知：正文字数约 {len(post_title) + len(post_desc)}，预计沉浸阅读 {read_time:.1f} 秒...")

    try:
        vp = page.viewport_size
        safe_x = vp['width'] * 0.90
        safe_y = vp['height'] * 0.50
        page.mouse.move(safe_x, safe_y)
        page.mouse.click(safe_x, safe_y)
        gauss_wait(page, 0.5, 0.1)
    except:
        pass

    if random.random() < 0.6:
        try:
            next_btns = [
                page.locator(".arrow-right").first,
                page.locator(".slider-icon-next").first,
                page.locator(".swiper-button-next").first
            ]
            for btn in next_btns:
                if btn.count() > 0 and btn.is_visible():
                    box = btn.bounding_box()
                    if box and box['width'] < 100:
                        for _ in range(random.randint(1, 4)):
                            safe_physical_click(page, btn)
                            gauss_wait(page, 2.0, 0.5)
                        break
        except:
            pass

    loops = int(read_time / 4)
    for _ in range(max(1, loops)):
        try:
            vp = page.viewport_size
            if vp:
                hover_x = vp['width'] * random.uniform(0.75, 0.88)
                hover_y = vp['height'] * random.uniform(0.4, 0.7)
                page.mouse.move(hover_x, hover_y, steps=random.randint(10, 20))
                gauss_wait(page, 0.5, 0.1)
            smooth_scroll_with_overshoot(page, random.randint(400, 900))
        except:
            pass

        redundant_mouse_move(page)
        gauss_wait(page, 2.5, 0.8)

    try:
        vp = page.viewport_size
        if vp:
            page.mouse.move(vp['width'] * 0.85, vp['height'] * 0.5, steps=10)
        smooth_scroll_with_overshoot(page, -random.randint(1000, 2500))
        gauss_wait(page, 1.5, 0.5)
    except:
        pass

    if random.random() < 0.10:
        try:
            like_btn = page.locator(".like-wrapper, .left-icon-item, .like-icon").first
            if safe_physical_click(page, like_btn):
                print("         -> ❤️ 觉得不错，随手点赞！")
        except:
            pass

    if random.random() < 0.05:
        try:
            collect_btn = page.locator(".collect-wrapper, div[class*='collect']").first
            if safe_physical_click(page, collect_btn):
                print("         -> ⭐ 马住！随手收藏！")
        except:
            pass

    if random.random() < 0.20 and (post_title or post_desc):
        print("         -> 🗣️ 触发 20% 留评概率！准备进行真实互动...")
        comment_text = generate_authentic_comment(post_title, post_desc)
        if comment_text:
            try:
                comment_trigger = page.locator(
                    "[placeholder*='说点什么'], "
                    "[placeholder*='发一条'], "
                    "div.input-box[contenteditable='true'], "
                    ".interaction-container [contenteditable='true']"
                ).first

                if comment_trigger.count() > 0:
                    comment_trigger.evaluate("el => el.scrollIntoView({block: 'center'})")
                    gauss_wait(page, 0.5, 0.1)

                    if not safe_physical_click(page, comment_trigger):
                        comment_trigger.click(force=True)

                    comment_trigger.focus()
                    gauss_wait(page, 0.5, 0.2)

                    page.keyboard.press("Control+A")
                    page.keyboard.press("Backspace")
                    gauss_wait(page, 0.5, 0.1)

                    human_like_typing(page, comment_text)
                    gauss_wait(page, 1.0, 0.3)

                    send_btn = page.locator(".interaction-container, .bottom-bar").get_by_text("发送", exact=True).first
                    if send_btn.is_visible():
                        safe_physical_click(page, send_btn)
                    else:
                        page.keyboard.press("Enter")

                    print(f"         -> 🚀 已成功发送真实情绪留言：[{comment_text}]")
                    gauss_wait(page, 4.0, 1.0)
            except Exception as e:
                print(f"         -> ⚠️ 留评交互异常跳过：{e}")

    print("         -> 🚪 阅读结束，退出帖子...")
    try:
        page.keyboard.press("Escape")
        gauss_wait(page, 1.5, 0.2)
        close_btn = page.locator(".close-box, .close-icon, [class*='close']").first
        if close_btn.is_visible():
            safe_physical_click(page, close_btn)
        gauss_wait(page, 1.0, 0.2)
    except:
        pass


# ==========================================
# 🌍 马尔可夫节点动作：简短流
# ==========================================
def explore_feed_briefly(page):
    print("      -> 🔽 [执行节点] 正在首页信息流摸鱼...")
    try:
        if "explore" not in page.url:
            home_tab = page.locator("li:has-text('发现'):visible, a:has-text('发现'):visible").first
            if home_tab.count() > 0:
                safe_physical_click(page, home_tab)
            else:
                page.goto("https://www.xiaohongshu.com/explore", wait_until="domcontentloaded")
            gauss_wait(page, 3.0, 1.0)

        page.mouse.click(10, 10)
        smooth_scroll_with_overshoot(page, random.randint(800, 2000))

        post_cards = page.locator("section.note-item")
        if post_cards.count() > 0:
            target_card = post_cards.nth(random.randint(0, min(post_cards.count() - 1, 6)))

            click_target = target_card.locator(".cover, img").first
            if click_target.count() == 0:
                click_target = target_card

            if safe_physical_click(page, click_target, aim_high=True):
                try:
                    page.wait_for_selector("#detail-title, #detail-desc, video", state="visible", timeout=4500)
                    deep_read_post(page)
                except PlaywrightTimeoutError:
                    print("      -> ⚠️ 尴尬，点到了不可交互的缝隙。没弹窗就是没弹窗，拒绝假装阅读！")
                    page.keyboard.press("Escape")
                    page.wait_for_timeout(1000)
                    if "explore" not in page.url:
                        page.go_back()
                        gauss_wait(page, 2.0, 0.5)

    except Exception as e:
        if "closed" in str(e).lower() or "target page" in str(e).lower():
            raise RuntimeError("Browser Closed")
        print(f"      -> ⚠️ 首页摸鱼略过: {e}")


def search_and_wash_tags_briefly(page):
    keyword = random.choice(BENIGN_KEYWORDS)
    print(f"      -> 🔍 [执行节点] 切换搜索无害生活词：【{keyword}】...")
    try:
        search_input = page.locator("#search-input").first
        if safe_physical_click(page, search_input):
            search_input.fill("")
            human_like_typing(page, keyword)
            gauss_wait(page, 1.0, 0.2)
            page.keyboard.press("Enter")
            gauss_wait(page, 4.0, 1.0)

            smooth_scroll_with_overshoot(page, random.randint(600, 1500))

            post_cards = page.locator("section.note-item")
            if post_cards.count() > 0:
                target_card = post_cards.nth(random.randint(0, min(post_cards.count() - 1, 4)))

                click_target = target_card.locator(".cover, img").first
                if click_target.count() == 0:
                    click_target = target_card

                if safe_physical_click(page, click_target, aim_high=True):
                    try:
                        page.wait_for_selector("#detail-title, #detail-desc, video", state="visible", timeout=4500)
                        deep_read_post(page)
                    except PlaywrightTimeoutError:
                        print("      -> ⚠️ 尴尬，点到了不可交互的缝隙。没弹窗就是没弹窗，拒绝假装阅读！")
                        page.keyboard.press("Escape")
                        page.wait_for_timeout(1000)
                        if "search_result" not in page.url:
                            page.go_back()
    except Exception as e:
        if "closed" in str(e).lower() or "target page" in str(e).lower():
            raise RuntimeError("Browser Closed")
        print(f"      -> ⚠️ 搜索节点略过: {e}")


def check_notifications_briefly(page):
    print("      -> 🔔 [执行节点] 无聊点开通知看看...")
    try:
        notify_tab = page.locator("li:has-text('通知'):visible, a:has-text('通知'):visible").first
        if safe_physical_click(page, notify_tab):
            gauss_wait(page, 3.0, 0.5)
            smooth_scroll_with_overshoot(page, random.randint(300, 800))
            gauss_wait(page, 2.0, 0.5)
    except Exception as e:
        if "closed" in str(e).lower() or "target page" in str(e).lower():
            raise RuntimeError("Browser Closed")


def view_own_profile_briefly(page):
    print("      -> 👤 [执行节点] 孤芳自赏看看自己的主页...")
    try:
        profile_tab = page.locator("li:has-text('我'):visible, a:has-text('我'):visible, .user-avatar").first
        if safe_physical_click(page, profile_tab):
            gauss_wait(page, 3.0, 0.5)
            smooth_scroll_with_overshoot(page, random.randint(300, 800))
            redundant_mouse_move(page)
    except Exception as e:
        if "closed" in str(e).lower() or "target page" in str(e).lower():
            raise RuntimeError("Browser Closed")


# ==========================================
# 🕸️ 核心路由器：马尔可夫链状态机
# ==========================================
def markov_router_engine(page, total_warmup_mins):
    end_time = time.time() + (total_warmup_mins * 60)
    current_state = "FEED_EXPLORE"

    print(f"      -> 🕒 本次摸鱼排期：总时长 {total_warmup_mins} 分钟，由混沌马尔可夫引擎接管...")

    while time.time() < end_time:
        try:
            if page.is_closed():
                print("      -> 🚨 检测到浏览器已被手动关闭，终止当前账号流...")
                break

            redundant_mouse_move(page)

            if current_state == "FEED_EXPLORE":
                explore_feed_briefly(page)
                # 🔥 使用前端面板下发的真实概率来做摇骰子
                current_state = random.choices(
                    ["FEED_EXPLORE", "SEARCH_WASH", "CHECK_NOTIFY", "VIEW_PROFILE"],
                    weights=[WEIGHT_FEED, WEIGHT_SEARCH, WEIGHT_NOTIFY, WEIGHT_PROFILE], k=1
                )[0]

            elif current_state == "SEARCH_WASH":
                search_and_wash_tags_briefly(page)
                current_state = random.choices(
                    ["FEED_EXPLORE", "CHECK_NOTIFY"], weights=[70, 30], k=1
                )[0]

            elif current_state == "CHECK_NOTIFY":
                check_notifications_briefly(page)
                current_state = "FEED_EXPLORE"

            elif current_state == "VIEW_PROFILE":
                view_own_profile_briefly(page)
                current_state = "FEED_EXPLORE"

        except RuntimeError as e:
            if "Browser Closed" in str(e):
                print("      -> 🚨 检测到浏览器已被手动关闭，紧急终止当前账号流...")
                break

    print("      -> 🏁 [引擎停机] 设定的摸鱼时长已耗尽或被中止。")


# ==========================================
# 模块：AdsPower API 控制
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
    except:
        pass


# ==========================================
# 🚀 主控台
# ==========================================
def main():
    print(f"🌟 启动 [数字幽灵 2.0] 混沌马尔可夫矩阵养号大阵，共 {len(MATRIX_PROFILES)} 个账号...\n")

    for index, profile_id in enumerate(MATRIX_PROFILES):
        print(f"\n========== 🎬 灵魂注入：第 {index + 1} 个账号 (ID: {profile_id}) ==========")

        total_warmup_mins = random.randint(*WARMUP_DURATION_MINUTES)

        try:
            ws_url = start_adspower_profile(profile_id, ADSPOWER_API_KEY)
        except Exception as e:
            print(f"❌ 启动 AdsPower 失败，跳过: {e}")
            write_run_log(profile_id, "6. 混沌养号", "error", f"启动环境失败: {e}")
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
                markov_router_engine(page, total_warmup_mins)
                print(f"\n✅ 账号 {profile_id} 今日深度 SPA 完美结束！行为特征已极度拟人化！")
                # 🔥 汇报成功
                write_run_log(profile_id, "6. 混沌养号", "success", "深度养号 SPA 结束")
            except Exception as exc:
                print(f"\n❌ 账号 {profile_id} 养号流发生异常: {exc}")
                # 🔥 汇报失败
                write_run_log(profile_id, "6. 混沌养号", "error", f"养号流异常: {exc}")
            finally:
                print(f"[step] 断开链路并物理销毁浏览器...")
                try:
                    browser.close()
                except:
                    pass
                stop_adspower_profile(profile_id, ADSPOWER_API_KEY)

        if index < len(MATRIX_PROFILES) - 1:
            delay = random.randint(*COOLDOWN_RANGE)
            print(f"⏳ 【深度物理隔离】：切号冷却等待 {delay} 秒...\n")
            time.sleep(delay)

    print("\n🎉 矩阵养号全流程完毕！算法迷雾已部署，你的舰队固若金汤！")


if __name__ == "__main__":
    main()