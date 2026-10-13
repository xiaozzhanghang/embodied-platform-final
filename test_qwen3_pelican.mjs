import fs from 'fs';

const PROMPT = `你是一个顶级的前端动画与 SVG 专家。请严格编写一个高品质、可以直接在浏览器中双击运行的单文件 HTML，满足以下全部要求：
1. 【主题】：一只卡通鹈鹕骑自行车在路上行进。
2. 【SVG 角色造型】：
   - 鹈鹕：白色或米浅黄色羽毛身躯、黑色/深灰翼尖、圆溜溜的可爱眼睛与腮红、标志性巨大明亮的橙黄色嘴喙与大喉囊（下颌垂下的标志性喉囊）；
   - 自行车：精致的几何车架、车把、车座、中轴链盘与脚踏板，以及前后两个带有多根辐射状辐条（spokes）的完整轮子；
   - 骑行姿势：鹈鹕坐在车座上，双翼/手握住车把，腿部连接脚踏板。
3. 【纯 CSS Keyframes 动画】（无任何外部 JS 库或图片引用）：
   - 车轮旋转：前后轮辐条匀速持续旋转；
   - 踩踏循环：脚踏板圆周旋转，鹈鹕的腿部/脚联动做上下踩踏循环，身体配合节奏有轻微颠簸起伏；
   - 背景无限水平后移：天空白云、远山/树木剪影、近处地面公路与虚线标线从右向左匀速无缝平移，营造强烈的向前飞驰位移感。
4. 【技术规范】：
   - 必须是完整的单文件 HTML，包含 <!DOCTYPE html>, <head>, <style>, <body>, 内联 <svg>；
   - 纯内联原生 SVG 图形与纯 CSS 动画，绝对不要引用任何外部 url() 或第三方 CDN；
   - 布局响应式自适应居中，现代配色，构图精美。
请直接输出可直接运行的完整 HTML 代码。`;

async function main() {
  console.log('[INFO] Calling local Ollama qwen3-vl:latest...');
  const startTime = Date.now();
  
  const res = await fetch('http://127.0.0.1:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'qwen3-vl:latest',
      prompt: PROMPT,
      stream: false,
      options: {
        temperature: 0.3,
        num_predict: 4096
      }
    })
  });

  if (!res.ok) {
    console.error('HTTP Error:', res.status);
    return;
  }

  const data = await res.json();
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`[SUCCESS] Generated in ${elapsed}s, eval_count: ${data.eval_count}`);
  
  const rawText = data.response || '';
  fs.writeFileSync('./pelican_bike_qwen3_raw.txt', rawText, 'utf8');
  if (data.thinking) {
    fs.writeFileSync('./pelican_bike_qwen3_thinking.txt', data.thinking, 'utf8');
  }

  let cleanCode = rawText;
  const match = rawText.match(/```(?:html)?\s*([\s\S]*?)```/i);
  if (match) {
    cleanCode = match[1].trim();
  }

  fs.writeFileSync('./pelican_bike_qwen3.html', cleanCode, 'utf8');
  console.log('[INFO] Saved to ./pelican_bike_qwen3.html');
}

main().catch(console.error);
