// 获取DOM元素
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const confidenceSlider = document.getElementById('confidence');
const confidenceValue = document.getElementById('confidence-value');
const maxBoxesSlider = document.getElementById('maxBoxes');
const maxBoxesValue = document.getElementById('maxBoxes-value');

// 全局变量
let model = null;
let isDetecting = false;
let detectionInterval = null;

// --------------------------
// 【可调参数】作业核心要求
// --------------------------
let params = {
    confidence: 0.5,   // 置信度阈值（可调）
    maxBoxes: 5        // 最大检测目标数（可调）
};

// 滑块绑定参数
confidenceSlider.oninput = (e) => {
    params.confidence = parseFloat(e.target.value);
    confidenceValue.textContent = params.confidence;
};
maxBoxesSlider.oninput = (e) => {
    params.maxBoxes = parseInt(e.target.value);
    maxBoxesValue.textContent = params.maxBoxes;
};

// --------------------------
// 【优化点1】预加载AI模型，提升速度
// --------------------------
async function loadModel() {
    if (!model) {
        model = await cocoSsd.load({ base: 'lite_mobilenet_v2' }); // 轻量模型，优化性能
        console.log('AI模型加载完成！');
    }
}

// 初始化摄像头
async function initCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    return new Promise(resolve => {
        video.onloadedmetadata = () => resolve();
    });
}

// --------------------------
// 【AI检测逻辑】
// --------------------------
async function detect() {
    if (!model || !isDetecting) return;
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // 执行检测
    const predictions = await model.detect(video);
    // 过滤结果（根据可调参数）
    const results = predictions.filter(p => p.score >= params.confidence).slice(0, params.maxBoxes);
    
    // 绘制检测框
    results.forEach(p => {
        ctx.strokeStyle = '#2c8cfe';
        ctx.lineWidth = 2;
        ctx.strokeRect(p.bbox[0], p.bbox[1], p.bbox[2], p.bbox[3]);
        ctx.fillStyle = '#2c8cfe';
        ctx.fillText(`${p.class} (${Math.round(p.score*100)}%)`, p.bbox[0], p.bbox[1]-5);
    });

    requestAnimationFrame(detect); // 【优化点2】使用RAF替代定时器，提升流畅度
}

// 启动按钮
startBtn.addEventListener('click', async () => {
    isDetecting = true;
    await initCamera();
    await loadModel();
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    detect();
});

// 停止按钮
stopBtn.addEventListener('click', () => {
    isDetecting = false;
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});
