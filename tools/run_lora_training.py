#!/usr/bin/env python3
"""
run_lora_training.py
使用 MLX-VLM 在本地 Apple Silicon (M1 Pro) 上执行具身动作时序 LoRA 领域微调
"""

import os
import sys
import time
import subprocess
import argparse

WORKSPACE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PYTHON_BIN = os.path.join(WORKSPACE_DIR, ".venv_mlx", "bin", "python")
DATASET_DIR = os.path.join(WORKSPACE_DIR, "data", "mlx_dataset")
ADAPTER_OUTPUT_DIR = os.path.join(WORKSPACE_DIR, "adapters")
os.makedirs(ADAPTER_OUTPUT_DIR, exist_ok=True)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model-path", default="mlx-community/Qwen2.5-VL-3B-Instruct-4bit")
    parser.add_argument("--iters", type=int, default=30, help="Number of fine-tuning iterations")
    parser.add_argument("--batch-size", type=int, default=1)
    parser.add_argument("--lr", type=float, default=2e-4)
    parser.add_argument("--rank", type=int, default=8)
    parser.add_argument("--alpha", type=int, default=16)
    parser.add_argument("--output-path", default=os.path.join(ADAPTER_OUTPUT_DIR, "adapters.safetensors"))
    args = parser.parse_args()

    print("=======================================================")
    print("🚀 启动 Apple Silicon M1 Pro 本地多模态 LoRA 领域微调")
    print(f"📦 基座模型: {args.model_path} (4-bit QLoRA)")
    print(f"📊 训练集路径: {DATASET_DIR}")
    print(f"⚙️ 迭代次数: {args.iters} | Batch: {args.batch_size} | Rank: {args.rank} | LR: {args.lr}")
    print(f"💾 产物路径: {args.output_path}")
    print("=======================================================")

    cmd = [
        PYTHON_BIN, "-m", "mlx_vlm.lora",
        "--model-path", args.model_path,
        "--dataset", DATASET_DIR,
        "--batch-size", str(args.batch_size),
        "--iters", str(args.iters),
        "--learning-rate", str(args.lr),
        "--lora-rank", str(args.rank),
        "--lora-alpha", str(args.alpha),
        "--grad-checkpoint",
        "--steps-per-report", "5",
        "--steps-per-save", str(args.iters),
        "--output-path", args.output_path
    ]

    t0 = time.time()
    env = os.environ.copy()
    env["HF_ENDPOINT"] = "https://hf-mirror.com"
    env["PYTHONUNBUFFERED"] = "1"

    proc = subprocess.Popen(cmd, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1)

    for line in proc.stdout:
        print(line, end="", flush=True)

    proc.wait()
    total_time = time.time() - t0

    if proc.returncode == 0:
        print(f"\n✅ LoRA 微调成功跑通！总耗时: {total_time:.1f}s")
        print(f"适配器权重已生成: {args.output_path}")
        return 0
    else:
        print(f"\n❌ 微调进程异常退出，退出码: {proc.returncode}")
        return proc.returncode

if __name__ == "__main__":
    sys.exit(main())
