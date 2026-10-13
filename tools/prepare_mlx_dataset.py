#!/usr/bin/env python3
"""
prepare_mlx_dataset.py
从真实工业装配视频帧中构建 MLX-VLM 训练集与独立盲测评测集
严格保证：
1. 训练集覆盖工位动作规范与标准受控词库
2. 独立盲测集（工步9：装配螺栓第3颗换位紧固）严格隔绝，绝不参与训练
"""

import os
import json
import re

WORKSPACE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
FRAMES_DIR = os.path.join(WORKSPACE_DIR, "mov_frames")
DATASET_DIR = os.path.join(WORKSPACE_DIR, "data", "mlx_dataset")
os.makedirs(DATASET_DIR, exist_ok=True)

# 工业标准 SOP 步骤定义 (基于真实质检真值)
ALL_STEPS = [
    {"step_no": 1, "start_sec": 0.0, "end_sec": 7.5, "skill": "扫码标定", "object": "智能手机 / QR码", "arm": "双手协同 (Dual Arms)"},
    {"step_no": 2, "start_sec": 7.5, "end_sec": 22.0, "skill": "准备待命", "object": "装配工作台面", "arm": "双手协同 (Dual Arms)"},
    {"step_no": 3, "start_sec": 22.0, "end_sec": 50.0, "skill": "工位接近", "object": "头戴采集设备 / 智能手机", "arm": "双手协同 (Dual Arms)"},
    {"step_no": 4, "start_sec": 50.0, "end_sec": 57.0, "skill": "工具拿起", "object": "电动螺丝刀/手电钻", "arm": "右手 (Right Arm)"},
    {"step_no": 5, "start_sec": 57.0, "end_sec": 64.0, "skill": "对位接近", "object": "装配工件 (1号螺栓孔)", "arm": "双臂协同 (Dual Arms)"},
    {"step_no": 6, "start_sec": 64.0, "end_sec": 72.0, "skill": "螺栓紧固", "object": "装配螺栓 (第1颗)", "arm": "右手 (Right Arm)"},
    {"step_no": 7, "start_sec": 72.0, "end_sec": 79.3, "skill": "提升换位", "object": "装配工件 (2号对角孔)", "arm": "双臂协同 (Dual Arms)"},
    {"step_no": 8, "start_sec": 79.3, "end_sec": 87.0, "skill": "螺栓紧固", "object": "装配螺栓 (第2颗)", "arm": "右手 (Right Arm)"},
    # 步骤 9 (87.0 ~ 102.0s): 保留为独立盲测测试集，完全不参与微调！
    {"step_no": 9, "start_sec": 87.0, "end_sec": 102.0, "skill": "换位紧固", "object": "装配螺栓 (第3颗)", "arm": "双臂协同 (Dual Arms)", "is_test": True},
    {"step_no": 10, "start_sec": 102.0, "end_sec": 117.0, "skill": "螺栓终紧", "object": "装配螺栓 (第4颗)", "arm": "双臂协同 (Dual Arms)"},
    {"step_no": 11, "start_sec": 117.0, "end_sec": 130.0, "skill": "协同扶持", "object": "装配件与紧固接缝", "arm": "双手协同 (Dual Arms)"},
    {"step_no": 12, "start_sec": 130.0, "end_sec": 138.3, "skill": "工具归位", "object": "电动螺丝刀/工作台面", "arm": "右手 (Right Arm)"},
]

PROMPT_TEXT = (
    "输入为工业具身机器人装配视频的关键帧序列。请按装配工艺SOP输出动作时序分解的结构化JSON，"
    "包含相对时间范围time_range(秒)、操作动作skill、操作对象object和执行手臂arm。"
)

def get_frames_in_range(start_s, end_s, max_count=4):
    """从 mov_frames 中按时间顺序查找最贴近的关键帧"""
    all_files = os.listdir(FRAMES_DIR)
    frames_with_sec = []
    for f in all_files:
        m = re.search(r"frame_t(\d+(\.\d+)?)s\.jpg", f)
        if m:
            sec = float(m.group(1))
            if start_s <= sec <= end_s:
                frames_with_sec.append((sec, os.path.join(FRAMES_DIR, f)))
    frames_with_sec.sort(key=lambda x: x[0])
    if not frames_with_sec:
        return []
    if len(frames_with_sec) <= max_count:
        return [p for _, p in frames_with_sec]
    # 均匀采样
    step = (len(frames_with_sec) - 1) / (max_count - 1)
    indices = [round(i * step) for i in range(max_count)]
    raw_paths = [frames_with_sec[i][1] for i in indices]

    # 缩放至工业 VLM 视频切片标准尺寸 (448px)，极大降低显存开销并提升计算速度
    from PIL import Image
    cache_dir = os.path.join(DATASET_DIR, "resized_frames")
    os.makedirs(cache_dir, exist_ok=True)
    optimized_paths = []
    for rp in raw_paths:
        dst = os.path.join(cache_dir, os.path.basename(rp))
        if not os.path.exists(dst):
            with Image.open(rp) as im:
                im = im.convert("RGB")
                im.thumbnail((448, 448))
                im.save(dst, "JPEG", quality=88)
        optimized_paths.append(dst)
    return optimized_paths

def build_dataset():
    train_records = []
    test_records = []

    for s in ALL_STEPS:
        is_test = s.get("is_test", False)
        frames = get_frames_in_range(s["start_sec"], s["end_sec"], max_count=4)
        if len(frames) < 2:
            continue

        rel_duration = round(s["end_sec"] - s["start_sec"], 2)
        answer_data = [
            {
                "step_no": s["step_no"],
                "time_range": [0.0, rel_duration],
                "skill": s["skill"],
                "object": s["object"],
                "arm": s["arm"],
            }
        ]

        record = {
            "images": frames,
            "messages": [
                {"role": "user", "content": PROMPT_TEXT},
                {"role": "assistant", "content": "```json\n" + json.dumps(answer_data, ensure_ascii=False, indent=2) + "\n```"}
            ]
        }

        if is_test:
            test_records.append(record)
        else:
            train_records.append(record)

    # 扩增训练多工步过渡窗口 (如 工具拿起 -> 对位接近)
    train_transitions = [
        # (Step 4 & 5)
        (50.0, 64.0, [ALL_STEPS[3], ALL_STEPS[4]]),
        # (Step 6 & 7)
        (64.0, 79.3, [ALL_STEPS[5], ALL_STEPS[6]]),
        # (Step 10 & 11)
        (102.0, 130.0, [ALL_STEPS[9], ALL_STEPS[10]]),
    ]

    for win_start, win_end, sub_steps in train_transitions:
        frames = get_frames_in_range(win_start, win_end, max_count=4)
        if len(frames) >= 2:
            answer_data = []
            for st in sub_steps:
                r_start = max(0.0, round(st["start_sec"] - win_start, 2))
                r_end = min(round(win_end - win_start, 2), round(st["end_sec"] - win_start, 2))
                answer_data.append({
                    "step_no": st["step_no"],
                    "time_range": [r_start, r_end],
                    "skill": st["skill"],
                    "object": st["object"],
                    "arm": st["arm"]
                })
            record = {
                "images": frames,
                "messages": [
                    {"role": "user", "content": PROMPT_TEXT},
                    {"role": "assistant", "content": "```json\n" + json.dumps(answer_data, ensure_ascii=False, indent=2) + "\n```"}
                ]
            }
            train_records.append(record)

    # 写入 train.jsonl 与 test.jsonl
    train_file = os.path.join(DATASET_DIR, "train.jsonl")
    with open(train_file, "w", encoding="utf-8") as f:
        for r in train_records:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

    test_file = os.path.join(DATASET_DIR, "test.jsonl")
    with open(test_file, "w", encoding="utf-8") as f:
        for r in test_records:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

    print(f"✅ 数据集构建完成！")
    print(f"训练集样本: {len(train_records)} 条 -> {train_file}")
    print(f"独立盲测集样本: {len(test_records)} 条 (工步9: 装配螺栓第3颗) -> {test_file}")

if __name__ == "__main__":
    build_dataset()
