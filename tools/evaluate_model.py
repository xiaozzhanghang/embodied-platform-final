#!/usr/bin/env python3
"""
evaluate_model.py
对 Qwen2.5-VL-3B 视觉语言大模型进行盲测集性能评测
支持：
1. 原生未微调基座评测 (Baseline)
2. 挂载 LoRA 适配器后的微调模型评测 (Post-SFT)
计算并对比：
- 动作分类准确率 (Skill Match)
- 装配对象准确率 (Object Match)
- 时序区间 IoU 重合度
- JSON 结构合规率
- 显存占用与推理耗时
"""

import os
import sys
import json
import time
import re
import argparse

def parse_json_from_response(text):
    """从模型输出中提取并解析 JSON"""
    m = re.search(r"```json\s*(.*?)\s*```", text, re.DOTALL)
    if m:
        text_to_parse = m.group(1).strip()
    else:
        m2 = re.search(r"\[\s*\{.*?\}\s*\]", text, re.DOTALL)
        text_to_parse = m2.group(0).strip() if m2 else text.strip()
    try:
        data = json.loads(text_to_parse)
        if isinstance(data, list) and len(data) > 0:
            return data, True
    except Exception:
        pass
    return None, False

def calculate_time_iou(range_a, range_b):
    start = max(range_a[0], range_b[0])
    end = min(range_a[1], range_b[1])
    inter = max(0.0, end - start)
    union = max(range_a[1], range_b[1]) - min(range_a[0], range_b[0])
    return (inter / union) if union > 0 else 0.0

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model-path", default="mlx-community/Qwen2.5-VL-3B-Instruct-4bit")
    parser.add_argument("--adapter-path", default=None, help="LoRA adapter safetensors path")
    parser.add_argument("--test-file", default="data/mlx_dataset/test.jsonl")
    parser.add_argument("--output-report", default="eval_report.json")
    args = parser.parse_args()

    # 载入 mlx_vlm
    from mlx_vlm import load, generate
    from mlx_vlm.prompt_utils import apply_chat_template

    print(f"=======================================================")
    print(f"🔍 启动模型评测: {args.model_path}")
    print(f"📌 适配器: {args.adapter_path if args.adapter_path else '无 (原生基座 Baseline)'}")
    print(f"=======================================================")

    t0 = time.time()
    model, processor = load(args.model_path, adapter_path=args.adapter_path)
    load_time = time.time() - t0
    print(f"⏱️ 模型加载耗时: {load_time:.2f}s")

    # 读取测试样本
    with open(args.test_file, "r", encoding="utf-8") as f:
        test_samples = [json.loads(line) for line in f if line.strip()]

    results = []
    for idx, sample in enumerate(test_samples):
        images = sample["images"]
        messages = sample["messages"]
        user_prompt = messages[0]["content"]

        # 解析 Ground Truth
        gt_content = messages[1]["content"]
        gt_data, _ = parse_json_from_response(gt_content)
        gt_step = gt_data[0] if gt_data else {}

        print(f"\n--- 盲测样本 #{idx + 1} ---")
        print(f"真实工步真值 (Ground Truth):")
        print(f"  动作: {gt_step.get('skill')} | 对象: {gt_step.get('object')} | 时间: {gt_step.get('time_range')}")

        # 应用 chat template
        prompt = apply_chat_template(processor, model.config, [{"role": "user", "content": user_prompt}], num_images=len(images))

        # 执行推理
        inf_start = time.time()
        raw_res = generate(model, processor, prompt=prompt, image=images, max_tokens=256, verbose=False)
        inf_time = time.time() - inf_start
        response_text = raw_res.text if hasattr(raw_res, "text") else str(raw_res)
        peak_mem = getattr(raw_res, "peak_memory", 0.0)
        tps = getattr(raw_res, "generation_tps", 0.0)

        # 解析输出
        pred_data, is_valid_json = parse_json_from_response(response_text)
        pred_step = pred_data[0] if pred_data else {}

        pred_skill = pred_step.get("skill", "未识别")
        pred_obj = pred_step.get("object", "未识别")
        pred_time = pred_step.get("time_range", [0.0, 0.0])

        # 指标计算
        gt_skill = gt_step.get("skill", "")
        gt_obj = gt_step.get("object", "")
        gt_time = gt_step.get("time_range", [0.0, 15.0])

        skill_match = (gt_skill in pred_skill) or (pred_skill in gt_skill)
        obj_match = (gt_obj[:4] in pred_obj) or (pred_obj[:4] in gt_obj)
        iou = calculate_time_iou(pred_time, gt_time) if len(pred_time) == 2 else 0.0

        print(f"模型预测输出:")
        print(f"  原始响应文本:\n{response_text.strip()}")
        print(f"  解析结果: 动作='{pred_skill}' | 对象='{pred_obj}' | 时间={pred_time}")
        print(f"  指标判定: 动作匹配={skill_match} | 工件匹配={obj_match} | 时间IoU={iou:.3f} | JSON合规={is_valid_json}")
        print(f"  推理耗时: {inf_time:.2f}s | 显存占用: {peak_mem:.2f}GB | 吞吐: {tps:.1f} tps")

        results.append({
            "sample_index": idx,
            "ground_truth": gt_step,
            "prediction_raw": response_text,
            "predicted_step": pred_step,
            "is_valid_json": is_valid_json,
            "skill_match": bool(skill_match),
            "object_match": bool(obj_match),
            "time_iou": round(iou, 3),
            "inference_time_sec": round(inf_time, 2),
            "peak_memory_gb": round(peak_mem, 2),
            "tps": round(tps, 1)
        })

    # 统计汇总
    total = len(results)
    valid_json_count = sum(1 for r in results if r["is_valid_json"])
    skill_acc = sum(1 for r in results if r["skill_match"]) / total if total > 0 else 0
    obj_acc = sum(1 for r in results if r["object_match"]) / total if total > 0 else 0
    mean_iou = sum(r["time_iou"] for r in results) / total if total > 0 else 0

    summary = {
        "model": args.model_path,
        "adapter": args.adapter_path,
        "sample_count": total,
        "valid_json_rate": f"{(valid_json_count / total * 100):.1f}%",
        "skill_accuracy": f"{(skill_acc * 100):.1f}%",
        "object_accuracy": f"{(obj_acc * 100):.1f}%",
        "mean_time_iou": f"{(mean_iou * 100):.1f}%",
        "results": results
    }

    with open(args.output_report, "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)

    print(f"\n=======================================================")
    print(f"📊 评测汇总结果报告:")
    print(f"  JSON合规率: {summary['valid_json_rate']}")
    print(f"  动作匹配率: {summary['skill_accuracy']}")
    print(f"  工件识别率: {summary['object_accuracy']}")
    print(f"  平均时序IoU: {summary['mean_time_iou']}")
    print(f"  详细报告已保存至: {args.output_report}")
    print(f"=======================================================")

if __name__ == "__main__":
    main()
