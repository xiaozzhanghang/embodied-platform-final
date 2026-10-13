import fs from 'fs';

const PROMPT = `你是一个资深的前端与 SVG 动画专家。请严格按照以下要求编写一个单文件 HTML：
1. 包含完整的 SVG 矢量动画：绘制一只生动的卡通鹈鹕（羽毛为白/浅黄色、嘴下带标志性大喉囊/下颌黄色大囊袋），戴着或不戴帽子均可，形象可爱呆萌。
2. 鹈鹕正在骑一辆自行车（车架、车把、车座、脚踏板、链盘，以及两个带有清晰辐条轮辐的自行车轮）。
3. 动态效果完全由纯 CSS Keyframes 控制（禁止使用任何外部 JS 库或外部资源，保证离线单文件直接可在浏览器中打开流畅运行）：
   - 车轮旋转（前后轮带辐条高速或平稳匀速转动）；
   - 腿部与脚踩踏动作（鹈鹕的双腿配合脚踏板做上下或圆周踩踏交替循环，身体可有轻微颠簸起伏节奏感）；
   - 背景后移模拟前进位移（路面标线、地面、远景树木或云朵/路灯向后移动，呈现向前骑行的动感效果）；
4. 视觉要求：构图协调，色彩明快舒适，SVG 结构清晰规范，动画丝滑流畅。
请直接输出包含完整 <!DOCTYPE html>、<style> 和 <svg> 的单文件 HTML 代码。`;

async function testModel(modelName, outputFile) {
  console.log(`[INFO] Calling local Ollama model: ${modelName}...`);
  const startTime = Date.now();
  
  try {
    const res = await fetch('http://127.0.0.1:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelName,
        prompt: PROMPT,
        stream: false,
        options: {
          temperature: 0.4,
          num_predict: 4096
        }
      })
    });
    
    if (!res.ok) {
      console.error(`HTTP error: ${res.status}`);
      return null;
    }
    
    const data = await res.json();
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[SUCCESS] Generated in ${elapsed}s, eval_count: ${data.eval_count}`);
    
    let text = data.response || '';
    // If thinking model wrapped in <think>...</think>, extract code or body
    let cleanCode = text;
    const codeBlockMatch = text.match(/```(?:html)?\s*([\s\S]*?)```/i);
    if (codeBlockMatch) {
      cleanCode = codeBlockMatch[1].trim();
    }
    
    fs.writeFileSync(outputFile, cleanCode, 'utf8');
    fs.writeFileSync(outputFile.replace('.html', '_raw.txt'), text, 'utf8');
    console.log(`[INFO] Saved to ${outputFile}`);
    return { model: modelName, elapsed, code: cleanCode, thinking: data.thinking };
  } catch (err) {
    console.error(`Error:`, err);
    return null;
  }
}

async function run() {
  const result = await testModel('qwen2.5-vl:latest', './pelican_bike_qwen25.html');
  console.log('Result:', result ? 'Done' : 'Failed');
}

run();
