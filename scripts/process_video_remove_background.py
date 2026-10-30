import os
import sys
import time
import cv2
import av
import numpy as np
from scipy.ndimage import binary_fill_holes, binary_dilation, binary_erosion
from PIL import Image

video_in = 'Screen Recording 2026-10-26 at 22.18.52.mov'
out_prores = 'Screen_Recording_transparent_prores4444.mov'
out_qtrle = 'Screen_Recording_transparent.mov'
out_webm = 'public/robot-character/spline_robot_transparent.webm'
out_static_png = 'public/robot-character/spline_robot_static.png'
out_webp = 'public/robot-character/spline_robot_animated.webp'

os.makedirs('public/robot-character', exist_ok=True)

cap = cv2.VideoCapture(video_in)
if not cap.isOpened():
    print(f'Error: Could not open {video_in}')
    sys.exit(1)

orig_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
orig_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
orig_fps = cap.get(cv2.CAP_PROP_FPS)
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
duration = total_frames / orig_fps if orig_fps > 0 else 0

print(f'Input video: {orig_w}x{orig_h}, FPS: {orig_fps:.2f}, Frames: {total_frames}, Duration: {duration:.2f}s')

# Target output frame rate: 30 FPS for smooth, standard playback
TARGET_FPS = 30
frame_step = orig_fps / TARGET_FPS # step to sample ~30 fps
num_target_frames = int(total_frames / frame_step)
print(f'Target output: 30 FPS, ~{num_target_frames} frames')

# Initialize Video Encoders via PyAV
# 1. QuickTime Animation / PNG MOV (Universal macOS transparency)
mov_container = av.open(out_qtrle, mode='w')
mov_stream = mov_container.add_stream('qtrle', rate=TARGET_FPS)
mov_stream.width = orig_w
mov_stream.height = orig_h
mov_stream.pix_fmt = 'argb'

# 2. Apple ProRes 4444 MOV with Alpha (Professional editing transparency)
prores_container = av.open(out_prores, mode='w')
prores_stream = prores_container.add_stream('prores_ks', rate=TARGET_FPS)
prores_stream.width = orig_w
prores_stream.height = orig_h
prores_stream.pix_fmt = 'yuva444p10le'

# 3. WebM VP9 with Alpha (Web browser transparency)
webm_container = av.open(out_webm, mode='w')
webm_stream = webm_container.add_stream('libvpx-vp9', rate=TARGET_FPS)
webm_stream.width = orig_w
webm_stream.height = orig_h
webm_stream.pix_fmt = 'yuva420p'

# For WebP animation, we select 60 smooth frames across a representative 3-second cycle
webp_sample_indices = set(np.linspace(0, min(180, num_target_frames - 1), 60, dtype=int))
webp_frames = []

t0 = time.time()
frame_idx = 0
encoded_count = 0

print('Beginning background removal and multi-format encoding...')

while True:
    target_orig_idx = int(encoded_count * frame_step)
    if target_orig_idx >= total_frames:
        break
        
    cap.set(cv2.CAP_PROP_POS_FRAMES, target_orig_idx)
    ret, frame_bgr = cap.read()
    if not ret:
        break
        
    # --- Advanced Morphological Hole-Filling Matting ---
    # 1. Identify non-black pixels (luminance > 3)
    v = np.max(frame_bgr, axis=2)
    fg_rough = (v > 3)
    
    # 2. Dilate by 4 iterations to bridge subtle shadow gaps and fine mechanical joints
    dilated = binary_dilation(fg_rough, iterations=4)
    
    # 3. Fill all enclosed internal holes (retains black visor, dark carbon fiber, shadow folds)
    filled = binary_fill_holes(dilated)
    
    # 4. Erode back by 4 iterations to perfectly restore original boundary silhouette
    eroded = binary_erosion(filled, iterations=4)
    
    # 5. Anti-aliasing boundary feathering (Gaussian sigma=1.2)
    mask_float = eroded.astype(np.float32)
    mask_blurred = cv2.GaussianBlur(mask_float, (7, 7), 1.2)
    alpha = (mask_blurred * 255).astype(np.uint8)
    
    # Ensure outermost borders are pure 0
    alpha[:3, :] = 0
    alpha[-3:, :] = 0
    alpha[:, :3] = 0
    alpha[:, -3:] = 0
    
    # Construct RGBA
    b, g, r = cv2.split(frame_bgr)
    rgba = cv2.merge([r, g, b, alpha]) # RGB + Alpha
    
    # Save static master image on frame 0
    if encoded_count == 0:
        cv2.imwrite(out_static_png, cv2.merge([b, g, r, alpha]))
        print(f'Saved master static transparent PNG: {out_static_png}')
        
    # Save to WebP sequence buffer
    if encoded_count in webp_sample_indices:
        # Resize to 512x446 for crisp, lightweight web delivery
        im_pil = Image.fromarray(rgba)
        im_resized = im_pil.resize((512, int(512 * orig_h / orig_w)), Image.Resampling.LANCZOS)
        webp_frames.append(im_resized)
        
    # --- Mux into MOV (qtrle argb) ---
    argb = cv2.merge([alpha, r, g, b])
    mov_frame = av.VideoFrame.from_ndarray(argb, format='argb')
    for packet in mov_stream.encode(mov_frame):
        mov_container.mux(packet)
        
    # --- Mux into ProRes 4444 (yuva444p10le) ---
    rgba_frame = av.VideoFrame.from_ndarray(rgba, format='rgba')
    for packet in prores_stream.encode(rgba_frame):
        prores_container.mux(packet)
        
    # --- Mux into WebM (VP9 yuva420p) ---
    for packet in webm_stream.encode(rgba_frame):
        webm_container.mux(packet)
        
    encoded_count += 1
    if encoded_count % 50 == 0:
        elapsed = time.time() - t0
        fps_proc = encoded_count / elapsed
        print(f'Processed {encoded_count}/{num_target_frames} frames ({encoded_count/num_target_frames*100:.1f}%) at {fps_proc:.1f} fps...')

# Finalize streams
print('Flushing video encoders...')
for packet in mov_stream.encode():
    mov_container.mux(packet)
mov_container.close()

for packet in prores_stream.encode():
    prores_container.mux(packet)
prores_container.close()

for packet in webm_stream.encode():
    webm_container.mux(packet)
webm_container.close()

cap.release()

# Generate transparent animated WebP
if webp_frames:
    print(f'Saving transparent animated WebP ({len(webp_frames)} frames)...')
    webp_frames[0].save(
        out_webp,
        format='WEBP',
        save_all=True,
        append_images=webp_frames[1:],
        duration=int(1000 / 20), # 20 FPS
        loop=0,
        quality=88,
        method=4,
        lossless=False
    )
    print(f'Saved animated WebP: {out_webp} ({os.path.getsize(out_webp)/1024:.1f} KB)')

total_time = time.time() - t0
print(f'All processing complete in {total_time:.1f} seconds!')
print(f'1. Universal Transparent MOV: {out_qtrle} ({os.path.getsize(out_qtrle)/1024/1024:.2f} MB)')
print(f'2. Apple ProRes 4444 Alpha MOV: {out_prores} ({os.path.getsize(out_prores)/1024/1024:.2f} MB)')
print(f'3. Transparent WebM VP9: {out_webm} ({os.path.getsize(out_webm)/1024/1024:.2f} MB)')
print(f'4. Master Static PNG: {out_static_png} ({os.path.getsize(out_static_png)/1024:.1f} KB)')
