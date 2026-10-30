import os
import math
import numpy as np
from PIL import Image, ImageEnhance

src_path = 'public/robot-character/spline_robot_static.png'
base_im = Image.open(src_path).convert('RGBA')
arr = np.array(base_im)
alpha = arr[:, :, 3]

Y, X = np.ogrid[:512, :512]

# Exact anatomical pivots based on robot joint coordinates:
pivot_l = (172, 217)   # Left shoulder revolute joint
pivot_r = (335, 218)   # Right shoulder revolute joint
pivot_head = (256, 162)# Neck pitch/yaw pivot

dist_l_shoulder = np.sqrt((X - pivot_l[0])**2 + (Y - pivot_l[1])**2)
dist_r_shoulder = np.sqrt((X - pivot_r[0])**2 + (Y - pivot_r[1])**2)

# Head mask: neck cut at y < 164
mask_head = (alpha > 10) & (Y < 164) & (X >= 185) & (X <= 325)

# Left arm mask: arm limb and left shoulder joint
mask_arm_l = (alpha > 10) & (Y >= 170) & ((X <= 178) | (dist_l_shoulder <= 22))

# Right arm mask: arm limb and right shoulder joint
mask_arm_r = (alpha > 10) & (Y >= 170) & ((X >= 330) | (dist_r_shoulder <= 22))

# Torso mask: core chest, torso, hips, and socket backings
mask_torso = (alpha > 10) & (~mask_head) & (~mask_arm_l) & (~mask_arm_r)

torso_arr = arr.copy()
torso_arr[~mask_torso] = [0, 0, 0, 0]

# Fill shoulder socket cavities on the torso with dark metallic hardware (RGB: 16, 18, 20, 255)
socket_l = (dist_l_shoulder <= 26) & (alpha > 10) & (~mask_head)
socket_r = (dist_r_shoulder <= 26) & (alpha > 10) & (~mask_head)
torso_arr[socket_l] = [16, 18, 20, 255]
torso_arr[socket_r] = [16, 18, 20, 255]

# Arm layers
arm_l_arr = arr.copy()
arm_l_arr[~mask_arm_l] = [0, 0, 0, 0]

arm_r_arr = arr.copy()
arm_r_arr[~mask_arm_r] = [0, 0, 0, 0]

# Head layer
head_arr = arr.copy()
head_arr[~mask_head] = [0, 0, 0, 0]

img_torso = Image.fromarray(torso_arr)
img_l = Image.fromarray(arm_l_arr)
img_r = Image.fromarray(arm_r_arr)
img_head = Image.fromarray(head_arr)

def rotate_about(im, deg, pivot):
    w, h = im.size
    px, py = pivot
    pad = Image.new('RGBA', (w * 2, h * 2), (0, 0, 0, 0))
    pad.paste(im, (w - px, h - py), im)
    rot = pad.rotate(deg, resample=Image.Resampling.BILINEAR)
    return rot.crop((w - px, h - py, 2 * w - px, 2 * h - py))

FPS = 15
DURATION_SEC = 3.0
NUM_FRAMES = 45 # 15 FPS * 3.0s = 45 frames
FRAME_DURATION_MS = 66

frames = []
step_keyframes = {}

for i in range(NUM_FRAMES):
    t = i / NUM_FRAMES # 0.0 to 1.0
    phase = 2 * math.pi * t
    
    # 1. 浮空高度与躯干微呼吸 (Sinusoidal vertical hover)
    hover_y = math.sin(phase) * 8.0
    body_scale_y = 1.0 + math.sin(phase) * 0.010
    body_scale_x = 1.0 - math.sin(phase) * 0.005
    
    # 2. 头部左右偏航 (Yaw) 与倾角 (Tilt)
    head_yaw_offset = math.sin(phase) * 8.0 # -8px to +8px
    head_tilt = math.sin(phase) * 4.5       # -4.5 deg to +4.5 deg
    
    # 3. 双眼眨眼微光 (Blink at t ~ 0.28 and t ~ 0.78)
    blink_factor = 0.0
    for blink_t in [0.28, 0.78]:
        dt = abs(t - blink_t)
        if dt < 0.045:
            blink_factor = max(blink_factor, math.cos(dt / 0.045 * (math.pi / 2)))
            
    # 4. 手臂挥动动作编排 (Wave & Articulation)
    # 左臂 (角色右侧): 待机微摆动
    angle_l = math.sin(phase) * 4.5
    # 右臂 (角色左侧): 明显上抬挥手姿态 (-12 deg to +3 deg)
    angle_r = - math.sin(phase) * 8.5 - math.sin(2 * phase) * 3.5
    
    # 合成
    frame = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
    
    # 躯干
    scaled_bw = int(img_torso.width * body_scale_x)
    scaled_bh = int(img_torso.height * body_scale_y)
    torso_scaled = img_torso.resize((scaled_bw, scaled_bh), Image.Resampling.BILINEAR)
    off_x = (img_torso.width - scaled_bw) // 2
    off_y = (img_torso.height - scaled_bh) // 2
    frame.paste(torso_scaled, (off_x, int(hover_y) + off_y), torso_scaled)
    
    # 左臂旋转并贴合
    rot_l = rotate_about(img_l, angle_l, pivot_l)
    frame.paste(rot_l, (0, int(hover_y)), rot_l)
    
    # 右臂旋转并贴合 (挥手动作)
    rot_r = rotate_about(img_r, angle_r, pivot_r)
    frame.paste(rot_r, (0, int(hover_y)), rot_r)
    
    # 头部旋转与微移
    rot_h = rotate_about(img_head, head_tilt, pivot_head)
    if blink_factor > 0:
        enhancer = ImageEnhance.Brightness(rot_h)
        rot_h = enhancer.enhance(1.0 - blink_factor * 0.35)
    frame.paste(rot_h, (int(head_yaw_offset), int(hover_y)), rot_h)
    
    # 确保外围 Alpha 100% 干净
    frame_arr = np.array(frame)
    frame_arr[:4, :, 3] = 0
    frame_arr[-4:, :, 3] = 0
    frame_arr[:, :4, 3] = 0
    frame_arr[:, -4:, 3] = 0
    clean_frame = Image.fromarray(frame_arr)
    frames.append(clean_frame)
    
    # 提取五个步骤的关键帧
    # Step 1: Frame 0 (0.0s) - 初始待机悬浮
    # Step 2: Frame 12 (0.8s) - 向左探视 + 眨眼
    # Step 3: Frame 21 (1.4s) - 右臂抬起挥手致意
    # Step 4: Frame 33 (2.2s) - 向右环视探查
    # Step 5: Frame 42 (2.8s) - 回正复位
    if i == 0:
        step_keyframes['step1_idle'] = clean_frame
    elif i == 12:
        step_keyframes['step2_look_left'] = clean_frame
    elif i == 21:
        step_keyframes['step3_wave_hand'] = clean_frame
    elif i == 33:
        step_keyframes['step4_look_right'] = clean_frame
    elif i == 42:
        step_keyframes['step5_reset'] = clean_frame

# 保存主 WebP
out_webp = 'public/robot-character/spline_robot_animated.webp'
frames[0].save(
    out_webp,
    format='WEBP',
    save_all=True,
    append_images=frames[1:],
    duration=FRAME_DURATION_MS,
    loop=0,
    quality=85,
    method=4,
    lossless=False
)

for step_name, key_frame in step_keyframes.items():
    key_frame.save(f'public/robot-character/{step_name}.png', format='PNG')
    print(f'Saved public/robot-character/{step_name}.png')

size_bytes = os.path.getsize(out_webp)
print(f'Successfully updated {out_webp}: {len(frames)} frames, {size_bytes / 1024:.1f} KB')
