#!/usr/bin/env python3
"""
run_full_experiment.py
端到端具身 VLM 本地微调前后对比验证全自动流水线
流程：
1. Baseline 评测：评估未经微调的 Qwen2.5-VL-3B-Instruct-4bit 原生模型在独立盲测样本上的输出
2. LoRA 领域微调：在真实的工业装配动作训练集上执行 25 步梯度反向传播
3. 微调后评测：使用同一套盲测输入评估挂载 LoRA 适配器后的模型输出
4. 综合对比分析：输出准确率、时序边界 IoU、JSON 格式合规性与耗时的真实客观对比报告
"""

import os
import sys
import json
import time
import subprocess

WORKSPACE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PYTHON_BIN = os.path.join(WORKSPACE_DIR, ".venv_mlx", "bin", "python")
MODEL_PATH = "mlx-community/Qwen2.5-VL-3B-Instruct-4bit"
ADAPTER_PATH = os.path.join(WORKSPACE_DIR, "adapters", "adapters.safetensors")

def run_cmd(cmd, desc):
    print(f"\n=======================================================")
    print(f"▶️  {desc}")
    print(f"=======================================================")
    env = os.environ.copy()
    env["HF_ENDPOINT"] = "https://hf-mirror.com"
    res = subprocess.run(cmd, env=env)
    if res.returncode != 0:
        print(f"❌ 步骤失败: {desc} (退出码 {res.returncode})")
        sys.exit(res.returncode)

def main():
    print("🎯 具身大模型视频标注微调能力验证实验 (M1 Pro 本地全流程)")

    # 1. 基座评测
    run_cmd([
        PYTHON_BIN, "tools/evaluate_model.py",
        "--model-path", MODEL_PATH,
        "--output-report", "eval_baseline.json"
    ], "阶段 1: 原生基座模型 (Baseline) 独立盲测评估")

    # 2. LoRA 微调
    run_cmd([
        PYTHON_BIN, "tools/run_lora_training.py",
        "--model-path", MODEL_PATH,
        "--iters", "25",
        "--batch-size", "1",
        "--lr", "2e-4",
        "--rank", "8",
        "--output-path", ADAPTER_PATH
    ], "阶段 2: 领域 LoRA 微调 (SFT 真实反向传播)")

    # 3. 微调后评测
    run_cmd([
        PYTHON_BIN, "tools/evaluate_model.py",
        "--model-path", MODEL_PATH,
        "--adapter-path", ADAPTER_PATH,
        "--output-report", "eval_finetuned.json"
    ], "阶段 3: 微调模型 (Post-SFT) 独立盲测评估")

    # 4. 生成对比报告
    with open("eval_baseline.json", "r", encoding="utf-8") as f:
        base_report = json.load(f)
    with open("eval_finetuned.json", "r", encoding="utf-8") as f:
        fine_report = json.load(f)

    comparison = {
        "experiment_title": "Qwen2.5-VL-3B 本地微调前后具身标注能力客观评测",
        "hardware": "Apple M1 Pro (16GB 统一内存)",
        "framework": "Apple MLX-VLM (4-bit QLoRA)",
        "comparison_metrics": {
            "json_valid_rate": {
                "before": base_report["valid_json_rate"],
                "after": fine_report["valid_json_rate"],
            },
            "skill_accuracy": {
                "before": base_report["skill_accuracy"],
                "after": fine_report["skill_accuracy"],
            },
            "object_accuracy": {
                "before": base_report["object_accuracy"],
                "after": fine_report["object_accuracy"],
            },
            "mean_time_iou": {
                "before": base_report["mean_time_iou"],
                "after": fine_report["mean_time_iou"],
            }
        },
        "baseline_detail": base_report,
        "finetuned_detail": fine_report
    }

    with open("eval_comparison.json", "w", encoding="utf-8") as f:
        json.dump(comparison, f, ensure_ascii=False, indent=2)

    print("\n=======================================================")
    print("🏁 全流程对比实验完成！核心指标客观对比汇总：")
    print(f"  JSON 结构合规率: {base_report['valid_json_rate']} ➔ {fine_report['valid_json_rate']}")
    print(f"  动作动词准确率: {base_report['skill_accuracy']} ➔ {fine_report['skill_accuracy']}")
    print(f"  操作工件识别率: {base_report['object_accuracy']} ➔ {fine_report['object_accuracy']}")
    print(f"  时序区间 mIoU:  {base_report['mean_time_iou']} ➔ {fine_report['mean_time_iou']}")
    print(f"  对比详细结果已归档至: eval_comparison.json")
    print("=======================================================")

if __name__ == "__main__":
    main()
