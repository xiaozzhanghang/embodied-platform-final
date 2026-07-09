#!/bin/bash

# 具身智能平台 - 视频自动转码工具 (H.264 / AVC 兼容格式)
# 支持对单个文件或指定文件夹下的所有 video.mp4 进行自动批量转码

# 颜色控制台输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0;68m' # 恢复默认颜色
BOLD='\033[1m'

echo -e "${BLUE}${BOLD}====================================================${NC}"
echo -e "${BLUE}${BOLD}      具身智能数据包 - 视频自动转码实用工具          ${NC}"
echo -e "${BLUE}${BOLD}====================================================${NC}"

# 检查运行环境是否为 macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${RED}[ERROR] 本脚本使用的 avconvert 引擎仅支持 macOS 系统。${NC}"
    exit 1
fi

TARGET=$1

# 提示使用说明
if [ -z "$TARGET" ]; then
    echo -e "${YELLOW}[USAGE] 使用方法:${NC}"
    echo -e "  1. 对单个视频文件转码:  ${GREEN}./transcode.sh /path/to/video.mp4${NC}"
    echo -e "  2. 对整个目录内视频扫描: ${GREEN}./transcode.sh /path/to/session_folder${NC}"
    echo ""
    read -p "请输入要处理的文件或文件夹路径: " TARGET
fi

# 检查路径是否存在
if [ ! -e "$TARGET" ]; then
    echo -e "${RED}[ERROR] 指定路径不存在: $TARGET${NC}"
    exit 1
fi

# 转码单个文件的函数
transcode_file() {
    local file_path="$1"
    local dir_path=$(dirname "$file_path")
    local filename=$(basename "$file_path")
    
    # 过滤掉已经是备份的文件
    if [[ "$filename" == *"_raw.mp4"* ]]; then
        return
    fi
    
    echo -e "${YELLOW}[INFO] 正在分析视频编码: $file_path...${NC}"
    
    # 用 python 快速检查编码格式是否为 mp4v
    local is_mp4v=$(python3 -c "
with open('$file_path', 'rb') as f:
    content = f.read()
    if b'mp4v' in content and b'avc1' not in content:
        print('true')
    else:
        print('false')
    ")
    
    if [ "$is_mp4v" = "true" ]; then
        echo -e "${YELLOW}[WARNING] 检测到不兼容的 mp4v 编码。启动 avconvert 硬件加速转码...${NC}"
        
        local temp_out="${dir_path}/video_tmp_h264.mp4"
        local backup_raw="${dir_path}/video_raw.mp4"
        
        # 执行 macOS 原生转码
        avconvert --source "$file_path" --preset PresetHighestQuality --output "$temp_out" --replace --progress
        
        if [ $? -eq 0 ]; then
            # 备份原视频并覆盖
            mv "$file_path" "$backup_raw"
            mv "$temp_out" "$file_path"
            echo -e "${GREEN}[SUCCESS] 转码完成!${NC}"
            echo -e "  - 备份原文件: ${BLUE}video_raw.mp4${NC}"
            echo -e "  - 兼容版文件: ${BLUE}video.mp4 (H.264)${NC}"
        else
            echo -e "${RED}[ERROR] 转码失败: $file_path${NC}"
            rm -f "$temp_out"
        fi
    else
        echo -e "${GREEN}[PASS] 视频编码已是 H.264 (avc1) 或其他兼容格式，无需重复转码。${NC}"
    fi
    echo -e "${BLUE}----------------------------------------------------${NC}"
}

# 判定是文件夹还是文件
if [ -d "$TARGET" ]; then
    echo -e "${YELLOW}[INFO] 正在递归扫描目录: $TARGET${NC}"
    echo -e "${BLUE}----------------------------------------------------${NC}"
    
    # 查找所有的 mp4 文件
    find "$TARGET" -type f -name "video.mp4" | while read -r video_file; do
        transcode_file "$video_file"
    done
    
    echo -e "${GREEN}${BOLD}[FINISHED] 目录扫描与转码任务全部完成!${NC}"
else
    transcode_file "$TARGET"
fi
