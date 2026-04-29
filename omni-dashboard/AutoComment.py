import time
import random
import requests
import httpx
import re
import json  # 🔥 新增
import os  # 🔥 新增
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
    script_path = os.path.join(configs_dir, "auto_comment.json")

    global_data = {}
    if os.path.exists(global_path):
        with open(global_path, "r", encoding="utf-8") as f: global_data = json.load(f)
    script_data = {}
    if os.path.exists(script_path):
        with open(script_path, "r", encoding="utf-8") as f: script_data = json.load(f)
    return global_data, script_data


GLOBAL_DATA, SCRIPT_DATA = load_configs()

ADSPOWER_API_KEY = GLOBAL_DATA.get("adspowerApiKey", "78d891ffc160582bc0af4d3d4f6693ce0089ff9076ded42a")
DEEPSEEK_API_KEY = GLOBAL_DATA.get("deepseekApiKey", "sk-8f095952e06045c7b0e81f03cc2d9b7d")
AI_TEMP_MAX = GLOBAL_DATA.get("aiTempMax", 0.95)

MATRIX_TASKS = SCRIPT_DATA.get("tasks", [
    {
        "profile_id": "k1bhea90",
        "keyword": "美国留学 租房被坑"
    }
])

RPA_CFG = SCRIPT_DATA.get("rpaConfig", {})
TARGET_QUOTA_RANGE = (RPA_CFG.get("target_quota_min", 2), RPA_CFG.get("target_quota_max", 3))
POST_DELAY_RANGE = (RPA_CFG.get("post_delay_min", 30), RPA_CFG.get("post_delay_max", 60))
COOLDOWN_RANGE = (RPA_CFG.get("cooldown_min", 90), RPA_CFG.get("cooldown_max", 180))

SEARCH_ANGLES = SCRIPT_DATA.get("searchAngles", [
    "急救求助（带求助、急等字眼）",
    "血泪避坑（带避雷、坑死等字眼）",
    "特定细节（带押金、中介费、退学等）"
])

STRATEGIES = SCRIPT_DATA.get("strategies", [
    "【同仇敌忾型】：非常简短地跟着痛骂。然后留下一句自己也遇到过最后搞定了，引发好奇。",
    "【真诚小白型】：用极其随意的口吻感叹太难了，自己之前也踩坑，后来找人帮忙才解决。",
    "【直接给方案型】：不要废话，单刀直入说一句干货建议，最后说不懂的来看我主页。"
])

SYSTEM_PROMPT_TEMPLATE = SCRIPT_DATA.get("prompt", """
你是一个正在躺在床上刷小红书的真实大学生。看到这篇帖子，你想留个言。

【🚨 顶级防封红线 (AI 降智指令)】：
1. 绝对不要像机器人！绝对禁止使用书面语、成语和做作的排版！
2. 可以正常使用标点符号，但要像真人发评论一样自然随意。
3. 总字数严格控制在 10 到 30 个字之间。越短越真实。
4. 禁止用“天呐”、“抱抱姐妹”这种烂大街的假人词汇。

【🎭 本次强制表演策略】：
{selected_strategy}

【输出格式】：
直接输出文案，不要有任何修饰词或多余的解释。
""")


# ==========================================
# 🛡️ 核心物理防封引擎
# ==========================================
def gauss_wait(page, mu, sigma):
    try:
        delay = random.gauss(mu, sigma)
        page.wait_for_timeout(int(max(0.2, delay) * 1000))
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


def smooth_scroll_with_overshoot(page, total_delta_y):
    """底层物理滚轮滑动机制"""
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


def human_like_reading_and_liking(page):
    read_time = random.randint(20, 40)
    print(f"      -> 📖 开启沉浸式拟人阅读模式 (预计停留 {read_time} 秒)...")

    gauss_wait(page, 2.0, 0.5)

    try:
        # 【核心修复：彻底废除点击，纯物理滚轮滑动】
        vp = page.viewport_size
        if vp:
            # 强制把鼠标移动到右侧 85% 的极度边缘空白区，绝不会碰到内容中的标签链接！
            safe_x = vp['width'] * 0.85
            safe_y = vp['height'] * 0.50
            page.mouse.move(safe_x, safe_y, steps=15)
            gauss_wait(page, 0.5, 0.1)

            print("      -> 📜 鼠标已安全悬停在右侧边缘空白区，开始纯物理滚轮下翻...")
            for _ in range(random.randint(4, 7)):
                # 直接触发滚轮，绝对不点击！
                smooth_scroll_with_overshoot(page, random.randint(600, 1200))

                # 偶尔在这个安全区微动鼠标防风控检测
                jiggle_x = safe_x + random.randint(-15, 15)
                jiggle_y = safe_y + random.randint(-20, 20)
                page.mouse.move(jiggle_x, jiggle_y, steps=5)

                gauss_wait(page, 1.5, 0.5)

            # 滚轮回顶部，准备点赞评论
            page.mouse.move(safe_x, safe_y, steps=5)
            smooth_scroll_with_overshoot(page, -random.randint(1500, 3500))
            gauss_wait(page, 2.0, 0.5)

    except Exception as e:
        print(f"      -> ⚠️ 滚动执行异常: {e}")

    gauss_wait(page, int(read_time * 0.3), 1.0)

    if random.random() < 0.40:
        try:
            # 【回归原版】：直接用 force=True 强行穿透点击赞，无视所有透明遮罩！
            like_btn = page.locator(".like-wrapper, .left-icon-item").first
            if like_btn.is_visible():
                like_btn.click(force=True)
                print("      -> ❤️ (强力穿透) 觉得这篇笔记不错，随手点了个赞！")
                gauss_wait(page, 2.0, 0.5)
        except:
            pass


def human_like_feed_browsing(page):
    print("      -> 🌍 回到主页信息流，进入无目的平滑摸鱼模式 (防封掩护)...")
    try:
        page.mouse.click(10, 10)
        gauss_wait(page, 1.0, 0.2)

        for _ in range(random.randint(2, 4)):
            print("      -> 🔽 正在平滑浏览主页推荐...")
            for _ in range(random.randint(5, 10)):
                page.keyboard.press("ArrowDown")
                page.wait_for_timeout(random.randint(150, 400))
            gauss_wait(page, 3.0, 1.0)

            if random.random() < 0.15:
                like_btns = page.locator("section.note-item .like-wrapper")
                if like_btns.count() > 0:
                    idx = random.randint(0, like_btns.count() - 1)
                    target_btn = like_btns.nth(idx)
                    if target_btn.is_visible():
                        # 【回归原版】：无视菜单重叠，强力穿透点赞
                        target_btn.click(force=True)
                        print("      -> 💗 (强力穿透) 摸鱼触发：随手给主页里的一篇路人帖子点了个赞！")
                        gauss_wait(page, 1.5, 0.3)
    except Exception as e:
        print(f"      -> ⚠️ 信息流浏览异常: {e}")


# ==========================================
# 模块 1：双核 AI 大脑
# ==========================================
def generate_viral_search_keyword(base_keyword):
    print(f"🔍 正在呼叫 AI 左脑，将意图【{base_keyword}】降维打击为爆款短搜词...")
    client = OpenAI(
        api_key=DEEPSEEK_API_KEY,
        base_url="https://api.deepseek.com",
        http_client=httpx.Client(trust_env=False)
    )

    selected_angle = random.choice(SEARCH_ANGLES)
    random_seed = random.randint(10000, 99999)

    system_prompt = f"""
    你是一个资深的小红书SEO专家。
    将用户提供的宽泛意图，转化为一个极易搜出最新爆款笔记的小红书长尾搜索词。

    【🚨 强制格式与视角 (生死红线)】：
    视角：{selected_angle}
    结构：必须是 2 到 3 个短词的组合，中间用【空格】隔开！
    字数：总字数绝对不能超过12个字。千万不要写成完整的一句话！

    防查重随机种子：{random_seed}
    """
    try:
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"宽泛搜索意图：{base_keyword}"}
            ],
            temperature=AI_TEMP_MAX
        )
        viral_keyword = response.choices[0].message.content.strip().replace('"', '').replace('“', '').replace('”', '')
        print(f"      -> 🎯 AI 左脑裂变成功！使用短搜词：【{viral_keyword}】")
        return viral_keyword
    except Exception as e:
        print(f"      -> ⚠️ AI 预搜索词失败，降级使用原词")
        return base_keyword


def obfuscate_comment(text: str) -> str:
    particles = ["~", "呀", "滴", "哈", "！", "～", "...", ""]
    emojis = ["😂", "😭", "🙏", "👀", "✨", "🔥", "🤝", "避雷", "无语了", ""]
    safe_text = text.replace("微信", random.choice(["卫星", "V", "🟢", "vx"])) \
        .replace("私信", random.choice(["私我", "滴我", "主页找我"]))
    if safe_text and safe_text[-1] not in ["！", "？", "!", "?", "。"]:
        safe_text += random.choice(particles)
    safe_text += random.choice(emojis)
    return safe_text


def generate_human_like_comment(post_title, post_content):
    print("🧠 正在呼叫 AI 右脑构思极简摸鱼风评论...")
    client = OpenAI(
        api_key=DEEPSEEK_API_KEY,
        base_url="https://api.deepseek.com",
        http_client=httpx.Client(trust_env=False)
    )

    selected_strategy = random.choice(STRATEGIES)
    system_prompt = SYSTEM_PROMPT_TEMPLATE.replace("{selected_strategy}", selected_strategy)

    try:
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"帖子标题：{post_title}\n帖子内容：{post_content}"}
            ],
            temperature=AI_TEMP_MAX
        )
        raw_comment = response.choices[0].message.content.strip()
        raw_comment = raw_comment.replace('"', '').replace('“', '').replace('”', '').replace('评论：', '')
        final_comment = obfuscate_comment(raw_comment)
        print(f"      -> 💬 拟人防封评论生成完毕：[{final_comment}]")
        return final_comment
    except Exception as e:
        print(f"      -> ⚠️ 评论生成失败，使用降级文本")
        return obfuscate_comment("这也太坑了吧，我之前押金差点要不回来，后面硬刚解决的！")


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
    except:
        pass


# ==========================================
# 模块 3：单次目标帖子的交互与退出逻辑
# ==========================================
def process_single_post(page, post_element, post_index):
    print(f"\n[step] 尝试进入列表第 {post_index + 1} 篇相关笔记...")

    try:
        post_element.evaluate("el => el.scrollIntoView({block:'center'})")
        gauss_wait(page, 1.0, 0.2)

        # 【回归原版】：直接对整个卡片实施最高权限点击，绝不踩空！
        post_element.click(force=True)

        page.wait_for_selector("#detail-title, #detail-desc, video", state="visible", timeout=4500)
        print("      -> ✅ 成功稳稳进入详情页！")
        human_like_reading_and_liking(page)
    except PlaywrightTimeoutError:
        print("      -> ⚠️ 尴尬，可能点到了死链或者网络卡了没弹窗。安全脱离现场！")
        page.keyboard.press("Escape")
        gauss_wait(page, 1.0, 0.2)
        if "search_result" not in page.url:
            page.go_back()
        return False
    except Exception as e:
        print(f"      -> ❌ 访问笔记过程异常: {e}")
        close_post_modal(page)
        return False

    print("      -> 正在抓取页面内容供 AI 分析...")
    try:
        title_element = page.locator("#detail-title").first
        desc_element = page.locator("#detail-desc").first

        post_title = title_element.inner_text() if title_element.count() > 0 else "无标题"
        post_desc = desc_element.inner_text() if desc_element.count() > 0 else "无内容"
        post_desc = post_desc[:300]
    except Exception as e:
        print("      -> 抓取内容失败，放弃评论该帖子")
        close_post_modal(page)
        return False

    comment_text = generate_human_like_comment(post_title, post_desc)

    print("      -> 寻找评论框并执行交互动作...")
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

            # 【回归原版】：强力获取焦点
            comment_trigger.click(force=True)
            comment_trigger.focus()
            gauss_wait(page, 0.5, 0.2)

            page.keyboard.press("Control+A")
            page.keyboard.press("Backspace")
            gauss_wait(page, 0.5, 0.1)

            human_like_typing(page, comment_text)
            gauss_wait(page, 1.0, 0.3)

            print("      -> 尝试发送评论...")
            send_btn = page.locator(".interaction-container, .bottom-bar").get_by_text("发送", exact=True).first
            if send_btn.is_visible():
                send_btn.click(force=True)
                print("      -> ✅ 已点击发送！")
            else:
                page.keyboard.press("Enter")
                print("      -> ✅ 已回车发送！")

            gauss_wait(page, 4.0, 1.0)
        else:
            print("      -> ⚠️ 未能抓取到底部评论框，放弃本次留言。")
            close_post_modal(page)
            return False
    except Exception as e:
        print("      -> ❌ 寻找评论框或发送失败：", e)
        close_post_modal(page)
        return False

    close_post_modal(page)
    return True


def close_post_modal(page):
    print("      -> 🚪 退出当前帖子...")
    try:
        page.keyboard.press("Escape")
        gauss_wait(page, 1.5, 0.2)
        close_btn = page.locator(".close-box, .close-icon, [class*='close']").first
        if close_btn.is_visible():
            close_btn.click(force=True)
        gauss_wait(page, 1.5, 0.2)
    except:
        pass


# ==========================================
# 模块 4：自动化搜索与多目标派发主逻辑
# ==========================================
def search_and_distribute_comments(page, base_keyword):
    viral_keyword = generate_viral_search_keyword(base_keyword)

    print(f"[step] 导航至首页，输入热词: 【{viral_keyword}】")
    page.goto("https://www.xiaohongshu.com/explore")
    gauss_wait(page, 4.0, 1.0)

    search_input = page.locator("#search-input").first
    if search_input.is_visible():
        search_input.click(force=True)
        search_input.fill("")
        human_like_typing(page, viral_keyword)

        print("      -> ⏳ 等待下拉热词...")
        gauss_wait(page, 3.0, 0.5)

        print("      -> 🎯 物理盲操截胡热度话题！")
        page.keyboard.press("ArrowDown")
        gauss_wait(page, 0.8, 0.2)
        page.keyboard.press("Enter")

    print("[step] 浏览搜索结果...")
    gauss_wait(page, 5.0, 1.0)

    print("      -> 🔀 尝试悬停【筛选】并切换至【最新】排序...")
    try:
        filter_btn = page.locator("div, span").get_by_text("筛选", exact=False).first
        if filter_btn.is_visible():
            # 必须使用 hover 激活下拉菜单
            filter_btn.hover()
            gauss_wait(page, 1.5, 0.5)

            latest_btn = page.locator("div, span, li").get_by_text("最新", exact=True).first
            if latest_btn.is_visible():
                latest_btn.click(force=True)
                print("      -> ✅ 已成功切换至【最新】排序！")
                gauss_wait(page, 4.0, 1.0)
            else:
                print("      -> ⚠️ 悬停后找不到【最新】按钮。")
        else:
            print("      -> ⚠️ 找不到【筛选】按钮。")
    except Exception as e:
        print(f"      -> ⚠️ 切换排序发生异常，继续综合排序: {e}")

    post_cards = page.locator("section.note-item")
    try:
        post_cards.first.wait_for(state="visible", timeout=10000)
    except:
        print(f"      -> ⚠️ 搜索结果加载超时。")
        return

    total_found = post_cards.count()
    target_quota = random.randint(*TARGET_QUOTA_RANGE)
    print(f"      -> 🕵️‍♂️ 共发现 {total_found} 篇笔记。本次任务额度：强行派发 {target_quota} 个钩子！")

    success_count = 0
    post_idx = 0

    while success_count < target_quota and post_idx < total_found:
        target_post = post_cards.nth(post_idx)

        is_success = process_single_post(page, target_post, post_idx)

        if is_success:
            success_count += 1
            print(f"      -> 🎉 第 {success_count}/{target_quota} 篇防封评论派发完毕！")

        post_idx += 1

        if success_count < target_quota and post_idx < total_found:
            delay = random.randint(*POST_DELAY_RANGE)
            print(f"      -> ⏳ 【深度潜伏期】：进入主页伪装时间 (预计 {delay} 秒)...")
            human_like_feed_browsing(page)
            time.sleep(delay)

    if success_count == 0:
        print(f"[ok] 遗憾，本账号未能成功派发任何钩子。")
    else:
        print(f"[ok] 本账号收割完毕，成功达标派发了 {success_count} 条钩子！")


# ==========================================
# 模块 5：矩阵核心控制器
# ==========================================
def main():
    print(f"🚀 启动 [矩阵引流防封高墙版] 引擎，共 {len(MATRIX_TASKS)} 个任务...\n")

    for index, task in enumerate(MATRIX_TASKS):
        profile_id = task.get("profile_id", "")
        base_keyword = task.get("keyword", "")

        if not profile_id or not base_keyword:
            continue

        print(f"\n========== 🎬 开始执行第 {index + 1} 个账号 (ID: {profile_id}) ==========")

        try:
            ws_url = start_adspower_profile(profile_id, ADSPOWER_API_KEY)
        except Exception as e:
            print(f"❌ 启动环境失败，跳过: {e}")
            write_run_log(profile_id, "2. 评论截流", "error", f"启动环境失败: {e}")
            continue

        with sync_playwright() as p:
            browser = p.chromium.connect_over_cdp(ws_url)
            context = browser.contexts[0]

            print("      -> 正在清理并最大化窗口...")
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
                search_and_distribute_comments(page, base_keyword)
                # 🔥 汇报成功
                write_run_log(profile_id, "2. 评论截流", "success", "该账号本轮截流任务已顺利完成")
            except Exception as exc:
                print(f"❌ 账号 {profile_id} 异常: {exc}")
                # 🔥 汇报失败
                write_run_log(profile_id, "2. 评论截流", "error", f"截流引擎崩溃: {exc}")
            finally:
                print("[step] 断开链路关闭浏览器...")
                try:
                    browser.close()
                except:
                    pass
                stop_adspower_profile(profile_id, ADSPOWER_API_KEY)

        if index < len(MATRIX_TASKS) - 1:
            acc_delay = random.randint(*COOLDOWN_RANGE)
            print(f"⏳ 【账号隔离期】：等待 {acc_delay} 秒后切换身份...\n")
            time.sleep(acc_delay)

    print("\n🎉 矩阵执行完毕！安全撤退！")


if __name__ == "__main__":
    main()