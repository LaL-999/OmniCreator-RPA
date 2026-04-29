import os
import time
import re
import random
import textwrap
import json  # 🔥 新增
from pathlib import Path
from io import BytesIO
import requests
import httpx
import pyperclip
from PIL import Image, ImageDraw, ImageFont
from openai import OpenAI
from logger import write_run_log
from playwright.sync_api import (
    Error as PlaywrightError,
    TimeoutError as PlaywrightTimeoutError,
    sync_playwright,
)


# ==========================================
# ⚙️ 动态配置中心 (连通前端 JSON)
# ==========================================
def load_configs():
    base_dir = os.getcwd()
    configs_dir = os.path.join(base_dir, "configs")
    global_path = os.path.join(configs_dir, "global_config.json")
    script_path = os.path.join(configs_dir, "adspower_test.json")

    global_data = {}
    if os.path.exists(global_path):
        with open(global_path, "r", encoding="utf-8") as f: global_data = json.load(f)
    script_data = {}
    if os.path.exists(script_path):
        with open(script_path, "r", encoding="utf-8") as f: script_data = json.load(f)
    return global_data, script_data


GLOBAL_DATA, SCRIPT_DATA = load_configs()

# 1. 全局 API 密钥提取
ADSPOWER_API_KEY = GLOBAL_DATA.get("adspowerApiKey", "78d891ffc160582bc0af4d3d4f6693ce0089ff9076ded42a")
DEEPSEEK_API_KEY = GLOBAL_DATA.get("deepseekApiKey", "sk-8f095952e06045c7b0e81f03cc2d9b7d")
IMAGE_API_KEY = GLOBAL_DATA.get("imageApiKey", "40747ad508a04b4ab59664e066b3f5e2.xAdet1WLeSAIHlC6")
IMAGE_BASE_URL = "https://open.bigmodel.cn/api/paas/v4"
IMAGE_MODEL = GLOBAL_DATA.get("imageModel", "cogview-3-plus")
AI_TEMP_MIN = GLOBAL_DATA.get("aiTempMin", 0.85)
AI_TEMP_MAX = GLOBAL_DATA.get("aiTempMax", 0.99)

# 2. 脚本专属配置提取
MATRIX_TASKS = SCRIPT_DATA.get("tasks", [
    {
        "profile_id": "k1bhea90",
        "topic": "美国留学的法律避坑指南，主要讲租房和打工"
    }
])

STRATEGY = SCRIPT_DATA.get("strategyConfig", {})
IMAGE_COUNT_RANGE = (STRATEGY.get("image_count_min", 1), STRATEGY.get("image_count_max", 3))
COOLDOWN_RANGE = (STRATEGY.get("cooldown_min", 45), STRATEGY.get("cooldown_max", 90))

STYLES_POOL = SCRIPT_DATA.get("styles", [
    "【碎碎念吐槽型】：像在宿舍和室友聊天一样，语气随性，多用感叹号，不要有太强的逻辑性。",
    "【小白真诚分享型】：假装自己刚踩过坑，心有余悸地提醒大家，语言要通俗接地气，别端着。",
    "【极简懒人型】：非常直接地把坑说出来，用词要年轻化（如：绝绝子、无语死了、避雷）。"
])

SYSTEM_PROMPT_TEMPLATE = SCRIPT_DATA.get("prompt", """
你是一个在小红书上随手记录生活的真实留学生。
请根据用户提供的主题，写一篇排版精美、易读且充满人情味的经验分享笔记。

【🚨 顶级防封与排版红线】：
1. 拒绝机械感：绝对禁止使用“首先”、“其次”、“总之”、“保姆级教程”等标准AI词汇！
2. {selected_style}
3. 【核心排版要求（打造呼吸感）】：
   - 绝对不要用“1. 2. 3.”这种干瘪的数字列点！
   - 必须使用 Emoji (如 💡, ✅, 🔴, 👉, 避雷) 来作为段落的视觉引导符号。
   - 拒绝密密麻麻的文字块！每讲完一个小点，必须【换两行留白】，保证视觉舒适度。
4. 语言要带有真人的口语化，正常使用标点符号。

【⚙️ 强制输出格式】（用于系统解析，带冒号的结构要保留，但内容必须像真人）：
标题：[吸引人的口语化标题，15字内]
正文：[换行清晰、带有Emoji引导的精美正文，必须有排版的呼吸感。正文结尾绝不要附带标签]
互动：[随口问一句，如“你们遇到过吗”]
标签：[直接写词语，空格隔开，绝对不要带#号]
""")

# ------------------------------------------
# 废弃直接跳转的 URL，保留作为兜底
BACKUP_PUBLISH_URL_IMAGE = "https://creator.xiaohongshu.com/publish/publish?from=tab_switch&target=image"
TEXT_UPLOAD_IMAGE = "\u4e0a\u4f20\u56fe\u7247"
TEXT_PUBLISH = "\u53d1\u5e03"

# 临时图片存储文件夹 (实现阅后即焚)
TEMP_IMAGE_DIR = os.path.join(os.getcwd(), "temp_xhs_images")


# ==========================================
# 模块 1：AI 大脑动态生成专属文案 (🔥 呼吸感排版版)
# ==========================================
def generate_ai_content(topic):
    print(f"🧠 正在呼叫 AI 大脑构思【{topic}】相关的精美排版文案...")

    client = OpenAI(
        api_key=DEEPSEEK_API_KEY,
        base_url="https://api.deepseek.com",
        http_client=httpx.Client(trust_env=False)
    )

    selected_style = random.choice(STYLES_POOL)
    print(f"      -> 🎲 本次抽中的文案人设：{selected_style.split('】')[0]}】")

    system_prompt = SYSTEM_PROMPT_TEMPLATE.replace("{selected_style}", selected_style)

    try:
        dynamic_temp = random.uniform(AI_TEMP_MIN, AI_TEMP_MAX)
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"请帮我写一篇关于【{topic}】的笔记。"}
            ],
            temperature=dynamic_temp
        )

        raw_result = response.choices[0].message.content.strip()
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
            tags_str = tags_match.group(1).strip()
            tags_str = tags_str.replace("#", "").replace(",", " ").replace("，", " ")
            tags_list = [t for t in tags_str.split() if t.strip()]
        else:
            print("      -> ⚠️ 触发深度解析兜底机制...")
            lines = [line.strip() for line in clean_result.split('\n') if line.strip()]
            title = lines[0].replace("标题：", "").replace("标题", "").strip()

            last_line = lines[-1]
            if "标签：" in last_line or "#" in last_line:
                tags_str = last_line.replace("标签：", "").replace("#", " ")
                tags_list = [t for t in tags_str.split() if t.strip()]
                content = "\n".join(lines[1:-1]).replace("正文：", "").replace("正文", "").strip()
            else:
                content = "\n".join(lines[1:]).replace("正文：", "").replace("正文", "").strip()
                tags_list = ["留学必备", "留学干货", "留学经验"]

        title = title.split('，')[0].strip()
        if len(title) > 16:
            title = title[:16]

        print(f"      -> 📝 拟人降智文案解析成功！标题：[{title}]")
        return title, content, tags_list

    except Exception as e:
        print(f"      -> ❌ 彻底解析失败，使用备用文案 ({e})")
        return "留学生避雷指南", "这真的是我的血泪教训！你们一定要注意看合同，千万别被坑了。\n\n大家遇到过类似情况吗？评论区交流下！", [
            "留学避坑", "留学生日常"]


# ==========================================
# 模块 1.5：视觉大脑 (🔥 新增底层噪点污染防查重)
# ==========================================
def add_stealth_noise(img):
    """【防封高墙】：为图片注入隐形噪点，彻底改变文件的底层哈希值与MD5"""
    width, height = img.size
    noise_layer = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(noise_layer)

    num_points = random.randint(2000, 5000)
    for _ in range(num_points):
        x = random.randint(0, width - 1)
        y = random.randint(0, height - 1)
        color = (random.randint(0, 255), random.randint(0, 255), random.randint(0, 255), random.randint(2, 6))
        draw.point((x, y), fill=color)

    return Image.alpha_composite(img.convert('RGBA'), noise_layer).convert('RGB')


def generate_image_assets(topic, title, content):
    print(f"🎨 [视觉脑] 正在为笔记生成【带噪点洗稿的排版配图】...")

    if not os.path.exists(TEMP_IMAGE_DIR):
        os.makedirs(TEMP_IMAGE_DIR)

    image_paths = []

    client_text = OpenAI(api_key=DEEPSEEK_API_KEY, base_url="https://api.deepseek.com",
                         http_client=httpx.Client(trust_env=False))
    client_img = OpenAI(api_key=IMAGE_API_KEY, base_url=IMAGE_BASE_URL, http_client=httpx.Client(trust_env=False))

    def fetch_and_crop_zhipu(prompt_text):
        response = client_img.images.generate(
            model=IMAGE_MODEL, prompt=prompt_text, n=1, size="768x1024"
        )
        img_url = response.data[0].url
        headers = {'User-Agent': 'Mozilla/5.0'}
        img_data = requests.get(img_url, headers=headers, timeout=30).content

        img = Image.open(BytesIO(img_data))
        w, h = img.size
        cropped_img = img.crop((0, 0, w, h - 90))
        final_img = cropped_img.resize((w, h), Image.Resampling.LANCZOS)

        stealth_img = add_stealth_noise(final_img)
        return stealth_img

    try:
        # ==================== 第 1 步：生成封面图 ====================
        print("      -> 🎨 [1/2] 正在绘制纯净背景封面...")
        cover_prompt_resp = client_text.chat.completions.create(
            model="deepseek-chat",
            messages=[{"role": "user",
                       "content": f"Write a short English prompt for an aesthetic, minimalist 3D illustration about: '{topic}'. It must have a clean background with empty space in the center. ABSOLUTELY NO TEXT, NO WORDS, NO CHARACTERS in the image. Just output the prompt."}]
        )
        cover_prompt = cover_prompt_resp.choices[0].message.content.strip()

        cover_img = fetch_and_crop_zhipu(cover_prompt)
        cover_path = os.path.join(TEMP_IMAGE_DIR, f"cover_{int(time.time())}.jpg")

        safe_title_for_pil = re.sub(r'[^\u4e00-\u9fa5a-zA-Z0-9：，。？！、!?, \-]', '', title).strip()

        print(f"      -> 🪄 正在印刷封面标题，并打乱视觉指纹...")
        width, height = cover_img.size

        try:
            font_size = int(width * 0.08)
            font = ImageFont.truetype("msyhbd.ttc", font_size)
        except IOError:
            try:
                font = ImageFont.truetype("simhei.ttf", font_size)
            except IOError:
                font = ImageFont.load_default()

        overlay = Image.new('RGBA', cover_img.size, (0, 0, 0, 0))
        draw_overlay = ImageDraw.Draw(overlay)
        box_y0 = int(height * 0.20)
        box_y1 = int(height * 0.40)
        draw_overlay.rectangle(((0, box_y0), (width, box_y1)), fill=(255, 255, 255, 210))

        cover_img = Image.alpha_composite(cover_img.convert('RGBA'), overlay).convert('RGB')
        draw = ImageDraw.Draw(cover_img)

        if len(safe_title_for_pil) > 10:
            lines = [safe_title_for_pil[:10], safe_title_for_pil[10:]]
        else:
            lines = [safe_title_for_pil]

        current_y = box_y0 + (box_y1 - box_y0 - (len(lines) * font_size)) / 2 - 10
        for line in lines:
            text_bbox = draw.textbbox((0, 0), line, font=font)
            text_w = text_bbox[2] - text_bbox[0]
            text_x = (width - text_w) / 2
            draw.text((text_x + 2, current_y + 2), line, font=font, fill=(150, 150, 150))
            draw.text((text_x, current_y), line, font=font, fill=(30, 30, 30))
            current_y += font_size + 15

        cover_img.save(cover_path)
        image_paths.append(cover_path)
        print("      -> ✅ 封面排版完成！已注入 1% 防风控噪点像素！")

        # ==================== 第 2 步：智能提取知识点生成配图 ====================
        num_content_images = random.randint(*IMAGE_COUNT_RANGE)
        print(f"      -> 🎨 [2/2] 正在提炼正文核心干货，准备生成 {num_content_images} 张知识点配图...")

        point_prompt = f"请把以下笔记的核心干货或避坑方法，浓缩提取成 {num_content_images} 句极短的短语，用于印在配图上。每句严格控制在 12 个字以内，绝对不要带标点符号。用 '|' 分隔开。笔记片段：{content[:400]}"
        point_resp = client_text.chat.completions.create(
            model="deepseek-chat",
            messages=[{"role": "user", "content": point_prompt}]
        )
        points_str = point_resp.choices[0].message.content.strip()
        points_list = [p.strip() for p in points_str.split('|') if p.strip()]

        while len(points_list) < num_content_images:
            points_list.append("核心干货 建议收藏")

        scene_prompt_req = f"Based on the topic '{topic}', write {num_content_images} distinct English Midjourney prompts for aesthetic minimalist 3D illustrations. Clean background. NO TEXT. Separate each prompt with a '|'. Only output the prompts."
        scene_resp = client_text.chat.completions.create(
            model="deepseek-chat",
            messages=[{"role": "user", "content": scene_prompt_req}]
        )
        prompts_str = scene_resp.choices[0].message.content.strip()
        content_prompts = [p.strip() for p in prompts_str.split('|') if p.strip()]

        if not content_prompts:
            content_prompts = [cover_prompt] * num_content_images

        for i, cp in enumerate(content_prompts[:num_content_images]):
            try:
                print(f"      -> ⏳ 绘制场景图 {i + 1} 并印入防封哈希...")
                c_img = fetch_and_crop_zhipu(cp)
                cw, ch = c_img.size

                c_font_size = int(cw * 0.07)
                try:
                    c_font = ImageFont.truetype("msyhbd.ttc", c_font_size)
                except IOError:
                    try:
                        c_font = ImageFont.truetype("simhei.ttf", c_font_size)
                    except IOError:
                        c_font = ImageFont.load_default()

                p_text = re.sub(r'[^\u4e00-\u9fa5a-zA-Z0-9 ]', '', points_list[i]).strip()
                p_lines = textwrap.wrap(p_text, width=10)

                c_overlay = Image.new('RGBA', c_img.size, (0, 0, 0, 0))
                c_draw_overlay = ImageDraw.Draw(c_overlay)

                box_h = (len(p_lines) * c_font_size) + 80
                box_cy0 = int((ch - box_h) / 2)
                box_cy1 = box_cy0 + box_h
                c_draw_overlay.rectangle(((0, box_cy0), (cw, box_cy1)), fill=(255, 255, 255, 215))

                c_img = Image.alpha_composite(c_img.convert('RGBA'), c_overlay).convert('RGB')
                c_draw = ImageDraw.Draw(c_img)

                c_current_y = box_cy0 + 40
                for line in p_lines:
                    text_bbox = c_draw.textbbox((0, 0), line, font=c_font)
                    text_w = text_bbox[2] - text_bbox[0]
                    text_x = (cw - text_w) / 2
                    c_draw.text((text_x + 2, c_current_y + 2), line, font=c_font, fill=(150, 150, 150))
                    c_draw.text((text_x, c_current_y), line, font=c_font, fill=(30, 30, 30))
                    c_current_y += c_font_size + 15

                c_path = os.path.join(TEMP_IMAGE_DIR, f"content_{i}_{int(time.time())}.jpg")
                c_img.save(c_path)
                image_paths.append(c_path)
                print(f"      -> ✅ 配图 {i + 1} 排版完成！已印入干货及隐藏指纹！")

            except Exception as e:
                print(f"      -> ⚠️ 场景图 {i + 1} 生成失败，跳过: {e}")

    except Exception as e:
        print(f"      -> ❌ 图文资源生成流严重失败: {e}")
        return []

    return image_paths


# ==========================================
# 模块 2：AdsPower API 控制逻辑
# ==========================================
def start_adspower_profile(profile_id: str, api_key: str) -> str:
    headers = {"Authorization": f"Bearer {api_key}"}
    start_url = f"http://127.0.0.1:50325/api/v1/browser/start?user_id={profile_id}"
    resp = requests.get(start_url, headers=headers, timeout=20).json()
    if resp.get("code") != 0:
        raise RuntimeError(f"AdsPower start failed: {resp.get('msg')}")
    return resp["data"]["ws"]["puppeteer"]


def stop_adspower_profile(profile_id: str, api_key: str):
    try:
        headers = {"Authorization": f"Bearer {api_key}"}
        stop_url = f"http://127.0.0.1:50325/api/v1/browser/stop?user_id={profile_id}"
        requests.get(stop_url, headers=headers, timeout=10)
        print("      -> 🧹 AdsPower 浏览器进程已成功物理销毁，内存已释放。")
    except Exception:
        pass


# ==========================================
# 模块 3：Playwright 底层控制逻辑 (🔥 修复强锁定版)
# ==========================================
def get_live_page(context):
    for page in reversed(context.pages):
        if not page.is_closed(): return page
    return context.new_page()


def navigate_to_publish_safely(context, page):
    """【防封高墙】：废弃直接输入URL跳转，改从主页伪装进场"""
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
        print("      -> ✅ 已安全潜入创作者中心发布页！")
        return new_page

    except Exception as e:
        print(f"      -> ⚠️ 拟人寻路失败或超时，启动后备跳转机制...")
        page.goto(BACKUP_PUBLISH_URL_IMAGE, wait_until="domcontentloaded")
        page.wait_for_timeout(3000)
        return page


def upload_image_file(page, image_paths: list):
    input_candidates = [
        page.locator("input[type='file'][accept*='image']"),
        page.locator("input[type='file']"),
    ]
    for locator in input_candidates:
        try:
            if locator.count() > 0:
                locator.first.set_input_files(image_paths, timeout=15000)
                print(f"      -> ⏳ 正在上传 {len(image_paths)} 张打乱MD5的图片...")
                page.wait_for_timeout(20000)
                return
        except Exception:
            continue

    upload_btn = page.get_by_text(TEXT_UPLOAD_IMAGE, exact=False).first
    with page.expect_file_chooser(timeout=15000) as fc_info:
        upload_btn.click(force=True)
    fc_info.value.set_files(image_paths)
    page.wait_for_timeout(20000)


def fill_publish_form(page, title: str, content: str, tags: list):
    print("      -> ✍️ 正在物理填入降智文案与标签...")
    title_locators = [
        page.locator("input[placeholder*='\u6807\u9898']"),
        page.get_by_placeholder("\u586b\u5199\u6807\u9898\u4f1a\u6709\u66f4\u591a\u8d5e\u54e6"),
    ]
    for loc in title_locators:
        if loc.count():
            loc.first.fill(title)
            break

    clean_content = re.sub(r'#[^\s#]+', '', content).strip()

    editor = page.locator(".ql-editor, div[contenteditable='true']").first
    editor.click(force=True)
    page.wait_for_timeout(300)
    page.keyboard.press("Control+A")
    page.keyboard.press("Backspace")
    page.wait_for_timeout(500)

    pyperclip.copy(clean_content)
    page.keyboard.press("Control+V")
    page.wait_for_timeout(1000)
    page.keyboard.press("Enter")
    page.wait_for_timeout(500)

    if tags:
        for tag in tags:
            page.keyboard.type("#" + tag, delay=50)
            page.wait_for_timeout(800)
            page.keyboard.press("Space")
            page.wait_for_timeout(400)


def click_publish_and_verify(page):
    page.mouse.click(10, 10)
    page.wait_for_timeout(1000)

    print("      -> 锁定发布按钮...")
    btn = page.get_by_role("button", name=TEXT_PUBLISH).first
    btn.click(force=True)

    print("      -> 🕵️‍♂️ 正在智能校验是否发布成功...")
    try:
        success_pattern = re.compile(r"published=true|note-manager")
        page.wait_for_url(success_pattern, timeout=15000)
        print("      -> ✅ 智能校验通过：成功避开风控，伪装发布完成！")
        return True
    except PlaywrightTimeoutError:
        print("      -> ❌ 校验失败：点击发布后 15 秒内页面未出现成功标识。")
        return False


def upload_and_publish(context, page, title: str, content: str, tags: list, image_paths: list):
    page = navigate_to_publish_safely(context, page)

    print("[step] 强制切换到图文模式...")
    try:
        # 【终极修复方案】：通过重型火力定位包含"上传图文"的多维目标，无视任何遮挡与样式干扰！
        tabs = [
            page.locator("text=上传图文").first,
            page.get_by_text("上传图文", exact=False).first,
            page.locator("//*[contains(text(), '上传图文')]").first
        ]

        switched = False
        for tab in tabs:
            try:
                # 必须加入显式等待，防动画加载延迟导致扑空
                tab.wait_for(state="visible", timeout=5000)
                tab.click(force=True)
                print("      -> ✅ 成功锁定并强制点击【上传图文】选项卡！")
                page.wait_for_timeout(2000)
                switched = True
                break
            except:
                continue

        if not switched:
            raise Exception("所有文本特征均未匹配到上传图文选项卡")

    except Exception as e:
        print(f"      -> ⚠️ 切换选项卡异常: {e}")
        print("      -> 🔄 触发最高级应急策略：URL 强制参数注入兜底...")
        # 兜底终极保险：强行附带 target=image 刷新进场
        page.goto("https://creator.xiaohongshu.com/publish/publish?from=tab_switch&target=image",
                  wait_until="domcontentloaded")
        page.wait_for_timeout(3000)

    print("[step] 开始上传图片资源...")
    upload_image_file(page, image_paths)

    try:
        page.wait_for_selector("input[placeholder*='\u6807\u9898']", timeout=25000)
    except PlaywrightTimeoutError:
        page.get_by_text("\u8f93\u5165\u6b63\u6587\u63cf\u8ff0", exact=False).first.wait_for(state="visible",
                                                                                             timeout=15000)

    fill_publish_form(page, title, content, tags)

    is_success = click_publish_and_verify(page)
    if not is_success:
        raise RuntimeError("智能校验未能确认发布成功状态。")


# ==========================================
# 模块 4：矩阵核心控制器
# ==========================================
def main():
    print(f"🚀 启动【防封高墙版】图文发布流水线，共需处理 {len(MATRIX_TASKS)} 个账号...\n")

    for index, task in enumerate(MATRIX_TASKS):
        profile_id = task.get("profile_id", "")
        topic = task.get("topic", "")

        if not profile_id or not topic:
            continue

        print(f"\n========== 开始执行第 {index + 1} 个账号 (ID: {profile_id}) ==========")

        title, content, tags_list = generate_ai_content(topic)
        image_paths = generate_image_assets(topic, title, content)

        if not image_paths:
            print("      -> ❌ 图片资源生成失败，为了保证质量，跳过该账号当前轮次！")
            write_run_log(profile_id, "1. 图文发帖", "warning", "图片资源生成失败，已跳过")
            continue

        print("[step] connect AdsPower")
        try:
            ws_url = start_adspower_profile(profile_id, ADSPOWER_API_KEY)
        except Exception as e:
            print(f"❌ 启动环境失败，跳过此账号: {e}")
            write_run_log(profile_id, "1. 图文发帖", "error", f"启动环境失败: {e}")
            continue

        with sync_playwright() as p:
            browser = p.chromium.connect_over_cdp(ws_url)
            context = browser.contexts[0]

            print("      -> 正在清理多余弹出网页并尝试最大化窗口...")
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
                upload_and_publish(context, page, title, content, tags_list, image_paths)
                print(f"✅ 账号 {profile_id} 闭环执行完毕，笔记已确认为发布状态！")
                # 🔥 汇报成功
                write_run_log(profile_id, "1. 图文发帖", "success", f"图文笔记 [{title}] 发布成功")
            except Exception as exc:
                print(f"❌ 账号 {profile_id} 发布流程失败: {exc}")
                # 🔥 汇报失败
                write_run_log(profile_id, "1. 图文发帖", "error", f"发布失败熔断: {exc}")
            finally:
                print("[step] 断开控制链路并彻底关闭浏览器进程...")
                browser.close()
                stop_adspower_profile(profile_id, ADSPOWER_API_KEY)

        print("      -> 🔥 [阅后即焚] 正在彻底销毁本地生成的临时图片...")
        for img in image_paths:
            try:
                if os.path.exists(img):
                    os.remove(img)
            except Exception:
                pass

        if index < len(MATRIX_TASKS) - 1:
            delay = random.randint(*COOLDOWN_RANGE)
            print(f"⏳ 账号切换缓冲：防风控关联，安全等待 {delay} 秒...\n")
            time.sleep(delay)

    print("\n🎉 矩阵全流程执行完毕！完美收工！")


if __name__ == "__main__":
    main()