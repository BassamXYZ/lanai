  // إعدادات Firebase الخاصة بك
  const firebaseConfig = {
    apiKey: "AIzaSyDNFa7SDu3_B53FHYXw8yzwCy9Zxi5xETw",
    authDomain: "lan-ai-f2a69.firebaseapp.com",
    databaseURL: "https://lan-ai-f2a69-default-rtdb.firebaseio.com",
    projectId: "lan-ai-f2a69",
    storageBucket: "lan-ai-f2a69.firebasestorage.app",
    messagingSenderId: "972123025099",
    appId: "1:972123025099:web:6b0391a0938ec85266b54e",
    measurementId: "G-KZGQ2Q33M8"
  };

  // تهيئة Firebase
  firebase.initializeApp(firebaseConfig);
  const db = firebase.database();
  
  
  
// ============ NAVIGATION ============
function enterDashboard(view) {
  document.getElementById('landing').classList.remove('active');
  document.getElementById('dashboard').classList.add('active');
  if (view) {
    setTimeout(() => showView(view, null), 100);
  }
}

function exitDashboard() {
  document.getElementById('dashboard').classList.remove('active');
  document.getElementById('landing').classList.add('active');
  if (view) {
    setTimeout(() => showView(view, null), 100);
  }
}

function goLanding() {
  document.getElementById('dashboard').classList.remove('active');
  document.getElementById('landing').classList.add('active');
}

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

function showView(viewId, navEl) {
  // Hide all views
  document.querySelectorAll('.tool-view').forEach(v => v.classList.remove('active'));
  // Show target
  const target = document.getElementById('view-' + viewId);
  if (target) { target.classList.add('active'); target.classList.add('fade-in'); }

  // Update nav
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (navEl) {
    navEl.classList.add('active');
  } else {
    // Find matching nav item
    document.querySelectorAll('.nav-item').forEach(n => {
      if (n.getAttribute('onclick') && n.getAttribute('onclick').includes("'" + viewId + "'")) {
        n.classList.add('active');
      }
    });
  }

  // Update topbar title
  const titles = {
    'home': 'لوحة التحكم', 'voice-call': 'المكالمات الصوتية',
    'video-call': 'مكالمات الفيديو', 'recorder': 'تسجيل الصوت',
    'voice-translator': 'المترجم الصوتي', 'translator': 'مترجم متعدد اللغات',
    'stt': 'تحويل الصوت ↔ نص', 'files': 'حافظة الملفات',
    'grammar': 'التصحيح اللغوي', 'tasks': 'مذكرة المهام',
    'content': 'كتابة المحتوى', 'research': 'كتابة الأبحاث',
    'qr': 'قراءة QR والباركود', 'ebooks': 'الكتب الإلكترونية',
    'media-gen': 'توليد الفيديوهات والصور', 'prices': 'مزامنة الأسعار',
    'tourism': 'الخدمات السياحية', 'wallet': 'المحفظة الحسابية',
    'alexa': 'ربط Alexa'
  };
  document.getElementById('topbar-title').textContent = titles[viewId] || 'LAN AI';
}

// ============ RECORDER ============
let mediaRecorder = null;
let recChunks = [];
let recInterval = null;
let recSeconds = 0;
let recordings = [];
let isRecording = false;
let analyserNode = null;
let audioCtx = null;

async function toggleRecording() {
  if (!isRecording) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      analyserNode = audioCtx.createAnalyser();
      analyserNode.fftSize = 256;
      source.connect(analyserNode);

      mediaRecorder = new MediaRecorder(stream);
      recChunks = [];
      mediaRecorder.ondataavailable = e => recChunks.push(e.data);
      mediaRecorder.onstop = saveRecording;
      mediaRecorder.start();

      isRecording = true;
      recSeconds = 0;
      document.getElementById('rec-btn').classList.add('recording');
      document.getElementById('rec-icon').className = 'fas fa-stop';
      document.getElementById('rec-status').textContent = '● جارٍ التسجيل...';
      document.getElementById('rec-label').textContent = 'اضغط لإيقاف التسجيل';
      document.getElementById('rec-status').style.color = '#e74c3c';

      recInterval = setInterval(() => {
        recSeconds++;
        const m = String(Math.floor(recSeconds / 60)).padStart(2, '0');
        const s = String(recSeconds % 60).padStart(2, '0');
        document.getElementById('rec-timer').textContent = m + ':' + s;
        animateWave();
      }, 1000);
    } catch (e) {
      alert('تعذّر الوصول إلى الميكروفون. يرجى السماح بالوصول.');
    }
  } else {
    isRecording = false;
    clearInterval(recInterval);
    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach(t => t.stop());
    document.getElementById('rec-btn').classList.remove('recording');
    document.getElementById('rec-icon').className = 'fas fa-microphone';
    document.getElementById('rec-status').textContent = 'تم حفظ التسجيل';
    document.getElementById('rec-status').style.color = '#2ecc71';
    document.getElementById('rec-label').textContent = 'اضغط لبدء تسجيل جديد';
    resetWave();
  }
}

function animateWave() {
  for (let i = 1; i <= 12; i++) {
    const h = Math.floor(Math.random() * 40) + 6;
    const el = document.getElementById('wb' + i);
    if (el) el.style.height = h + 'px';
  }
}
function resetWave() {
  for (let i = 1; i <= 12; i++) {
    const el = document.getElementById('wb' + i);
    if (el) el.style.height = '8px';
  }
}

function saveRecording() {
  const blob = new Blob(recChunks, { type: 'audio/webm' });
  const url = URL.createObjectURL(blob);
  const name = 'تسجيل ' + (recordings.length + 1);
  const dur = recSeconds;
  recordings.push({ name, url, dur });

  const list = document.getElementById('recordings-list');
  const item = document.createElement('div');
  item.className = 'recording-item';
  const m = String(Math.floor(dur / 60)).padStart(2, '0');
  const s = String(dur % 60).padStart(2, '0');
  item.innerHTML = `
    <i class="fas fa-file-audio" style="color:var(--gold)"></i>
    <span class="recording-name">${name}</span>
    <span class="recording-dur">${m}:${s}</span>
    <audio controls src="${url}" style="height:28px;flex:1;min-width:100px;filter:invert(0.8)"></audio>
    <a href="${url}" download="${name}.webm" style="color:var(--gold);font-size:14px;"><i class="fas fa-download"></i></a>
  `;
  list.prepend(item);
}

// ============ STT ============
let sttRecog = null;
let sttOn = false;

function toggleSTT() {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    document.getElementById('stt-output').value = 'عذراً، متصفحك لا يدعم التعرف على الصوت. جرّب Chrome.';
    return;
  }
  if (!sttOn) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    sttRecog = new SR();
    sttRecog.lang = 'ar-SA';
    sttRecog.continuous = true;
    sttRecog.interimResults = true;
    sttRecog.onresult = (e) => {
      let final = '', interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      document.getElementById('stt-output').value = (document.getElementById('stt-output').value.replace(/\[.*?\]$/, '') + final + (interim ? '[' + interim + ']' : '')).trim();
    };
    sttRecog.onerror = () => { document.getElementById('stt-status').textContent = 'خطأ في التعرف. حاول مجدداً.'; };
    sttRecog.start();
    sttOn = true;
    document.getElementById('stt-btn').classList.add('recording');
    document.getElementById('stt-icon').className = 'fas fa-stop';
    document.getElementById('stt-status').textContent = '● جارٍ الاستماع...';
  } else {
    sttRecog.stop();
    sttOn = false;
    document.getElementById('stt-btn').classList.remove('recording');
    document.getElementById('stt-icon').className = 'fas fa-microphone';
    document.getElementById('stt-status').textContent = 'تم الإيقاف — اضغط للمتابعة';
  }
}

function doTTS() {
  const text = document.getElementById('tts-input').value.trim();
  if (!text) return;
  const lang = document.getElementById('tts-lang').value;
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = lang;
  utt.rate = 0.9;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utt);
}

// ============ TRANSLATOR (Demo) ============
const demoTranslations = {
  'مرحبا': { en: 'Hello', fr: 'Bonjour', de: 'Hallo', es: 'Hola', tr: 'Merhaba' },
  'كيف حالك': { en: 'How are you?', fr: 'Comment allez-vous?', de: 'Wie geht es Ihnen?', es: '¿Cómo estás?', tr: 'Nasılsın?' },
};

function doTranslate() {
  const input = document.getElementById('tr-input').value.trim();
  if (!input) return;
  const to = document.getElementById('tr-to').value;
  const from = document.getElementById('tr-from').value;

  let output = '';
  if (to === 'en' && from === 'ar') {
    output = input
      .replace(/مرحبا/g, 'Hello')
      .replace(/كيف حالك/g, 'How are you?')
      .replace(/شكراً/g, 'Thank you')
      .replace(/نعم/g, 'Yes')
      .replace(/لا/g, 'No')
      .replace(/صباح الخير/g, 'Good morning')
      .replace(/مساء الخير/g, 'Good evening');
    if (output === input) output = '[Demo] ' + input.split('').reverse().join('') + ' (English translation here)';
  } else if (to === 'fr' && from === 'ar') {
    output = input.replace(/مرحبا/g, 'Bonjour').replace(/شكراً/g, 'Merci');
    if (output === input) output = '[Demo] Traduction française de: ' + input;
  } else {
    const labels = { en: 'English', fr: 'French', de: 'German', es: 'Spanish', ar: 'Arabic', zh: 'Chinese', ja: 'Japanese', tr: 'Turkish' };
    output = `[Demo] Translation to ${labels[to] || to}: "${input}"`;
  }

  const el = document.getElementById('tr-output');
  el.value = '';
  let i = 0;
  const type = () => {
    if (i < output.length) { el.value += output[i++]; setTimeout(type, 18); }
  };
  type();
}

function swapLangs() {
  const f = document.getElementById('tr-from');
  const t = document.getElementById('tr-to');
  const tmp = f.value;
  f.value = t.value;
  t.value = tmp;
  const inp = document.getElementById('tr-input').value;
  const out = document.getElementById('tr-output').value;
  document.getElementById('tr-input').value = out;
  document.getElementById('tr-output').value = inp;
}

function copyTrans() {
  navigator.clipboard?.writeText(document.getElementById('tr-output').value);
  showToast('تم النسخ ✓');
}

// ============ TASKS ============
const tasksRef = db.ref('tasks');

// جلب المهام من Firebase وعرضها
tasksRef.on('value', (snapshot) => {
  const list = document.getElementById('tasks-list');
  list.innerHTML = ''; // تفريغ القائمة الحالية
  
  snapshot.forEach((childSnapshot) => {
    const taskKey = childSnapshot.key;
    const taskData = childSnapshot.val();
    
    const item = document.createElement('div');
    item.className = 'task-item fade-in';
    item.innerHTML = `
      <div class="task-check ${taskData.done ? 'done' : ''}" onclick="toggleTask('${taskKey}', ${taskData.done})"></div>
      <span class="task-text ${taskData.done ? 'done' : ''}">${taskData.text}</span>
      <i class="fas fa-trash task-del" onclick="deleteTask('${taskKey}')"></i>
    `;
    list.prepend(item);
  });
});

function addTask() {
  const input = document.getElementById('task-input');
  const text = input.value.trim();
  if (!text) return;
  
  // حفظ المهمة في Firebase
  tasksRef.push({
    text: text,
    done: false,
    createdAt: firebase.database.ServerValue.TIMESTAMP
  });
  
  input.value = '';
}

function toggleTask(key, currentStatus) {
  // تحديث حالة المهمة في Firebase
  tasksRef.child(key).update({
    done: !currentStatus
  });
}

function deleteTask(key) {
  // حذف المهمة من Firebase
  tasksRef.child(key).remove();
}

// ============ CONTENT WRITER ============
const contentSamples = [
  `🌟 اكتشف قوة التحول الرقمي مع حلولنا المتكاملة!

في عالم يتسارع فيه التطور التكنولوجي، أصبح من الضروري أن تواكب مؤسستك أحدث الاتجاهات في مجال الذكاء الاصطناعي وتقنيات المعلومات.

نقدم لك منظومة متكاملة من الخدمات والحلول التقنية المصممة خصيصاً لتلبية احتياجات السوق العربي، مع ضمان أعلى معايير الجودة والكفاءة.

✅ حلول مخصصة لأعمالك
✅ دعم فني على مدار الساعة  
✅ ضمان النتائج أو استرداد المبلغ كاملاً

تواصل معنا اليوم وابدأ رحلة النجاح! 🚀`,
  `📢 عرض لا يُفوَّت!

نحن سعداء بتقديم خدماتنا المميزة التي طالما انتظرتها. مع خبرة تمتد لأكثر من 10 سنوات في المجال، نضمن لك تجربة استثنائية تتجاوز توقعاتك.

لا تضيع الفرصة — التواصل معنا الآن يعني الحصول على استشارة مجانية شاملة.`,
  `في الوقت الذي تتشابك فيه التحديات وتتسارع وتيرة التغيير، يبرز الذكاء الاصطناعي كحليف استراتيجي لا غنى عنه لكل مؤسسة تطمح إلى التميز والريادة.

هذا المقال يستعرض أبرز الفرص والتحديات التي يطرحها الذكاء الاصطناعي في سياق الأعمال العربية، ويقدم رؤية متوازنة تجمع بين الواقعية والتفاؤل المبني على الأدلة.`
];

let contentIdx = 0;
function generateContent() {
  const topic = document.getElementById('content-topic').value.trim();
  const out = document.getElementById('content-output');
  out.value = '';
  const text = (topic ? `📝 محتوى عن: ${topic}\n\n` : '') + contentSamples[contentIdx % contentSamples.length];
  contentIdx++;
  let i = 0;
  const type = () => {
    if (i < text.length) { out.value += text[i++]; setTimeout(type, 12); }
  };
  type();
}

function copyContent() {
  navigator.clipboard?.writeText(document.getElementById('content-output').value);
  showToast('تم النسخ ✓');
}

// ============ QR ============
let qrStream = null;
let qrActive = false;
let qrAnimFrame = null;

async function toggleQR() {
  if (!qrActive) {
    try {
      qrStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      const video = document.getElementById('qr-video');
      video.srcObject = qrStream;
      video.style.display = 'block';
      document.getElementById('qr-placeholder').style.display = 'none';
      document.getElementById('qr-btn').innerHTML = '<i class="fas fa-stop"></i> إيقاف الكاميرا';
      qrActive = true;
      scanQR();
    } catch (e) {
      alert('تعذّر الوصول إلى الكاميرا. يرجى السماح بالوصول.');
    }
  } else {
    qrActive = false;
    cancelAnimationFrame(qrAnimFrame);
    if (qrStream) qrStream.getTracks().forEach(t => t.stop());
    document.getElementById('qr-video').style.display = 'none';
    document.getElementById('qr-placeholder').style.display = 'flex';
    document.getElementById('qr-btn').innerHTML = '<i class="fas fa-camera"></i> تشغيل الكاميرا';
  }
}

function scanQR() {
  if (!qrActive) return;
  const video = document.getElementById('qr-video');
  const canvas = document.getElementById('qr-canvas');
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      if (window.jsQR) {
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code) {
          document.getElementById('qr-output').textContent = code.data;
          document.getElementById('qr-output').style.color = 'var(--green)';
        }
      }
    } catch (e) {}
  }
  qrAnimFrame = requestAnimationFrame(scanQR);
}

function readQRFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.getElementById('qr-canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      if (window.jsQR) {
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        document.getElementById('qr-output').textContent = code ? code.data : 'لم يتم العثور على كود QR في الصورة.';
        document.getElementById('qr-output').style.color = code ? 'var(--green)' : 'var(--red)';
      } else {
        document.getElementById('qr-output').textContent = 'مكتبة jsQR غير محملة. يتطلب اتصالاً بالإنترنت.';
      }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function generateQR() {
  const text = document.getElementById('qr-gen-input').value.trim();
  if (!text) return;
  const out = document.getElementById('qr-gen-out');
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(text)}&bgcolor=0f1c2e&color=D4A017`;
  out.innerHTML = `<img src="${url}" alt="QR Code" style="border-radius:12px;border:2px solid var(--border-bright);max-width:180px;">
    <br><a href="${url}" download="qrcode.png" style="color:var(--gold);font-size:13px;display:inline-block;margin-top:8px;"><i class="fas fa-download"></i> تحميل الكود</a>`;
}

// ============ WALLET ============
function walletAction(type) {
  const amount = prompt(`أدخل المبلغ (${type}):`);
  if (!amount || isNaN(amount)) return;
  const amtEl = document.getElementById('wallet-amount');
  let current = parseFloat(amtEl.textContent.replace(',', ''));
  if (type === 'إيداع') current += parseFloat(amount);
  else if (type === 'سحب') current = Math.max(0, current - parseFloat(amount));
  amtEl.textContent = current.toLocaleString('ar-EG');

  const list = document.getElementById('tx-list');
  const item = document.createElement('div');
  item.className = 'tx-item fade-in';
  const isIn = type === 'إيداع';
  item.innerHTML = `
    <div class="tx-info">
      <div class="tx-icon ${isIn ? 'bg-green' : 'bg-red'}"><i class="fas fa-arrow-${isIn ? 'down' : 'up'} c-${isIn ? 'green' : 'red'}"></i></div>
      <div><div class="tx-name">${type}</div><div class="tx-date">الآن</div></div>
    </div>
    <div class="tx-amount ${isIn ? 'tx-plus' : 'tx-minus'}">${isIn ? '+' : '-'} ${parseFloat(amount).toLocaleString('ar-EG')} ر.س</div>
  `;
  list.prepend(item);
  showToast(`تمت عملية ${type} بنجاح ✓`);
}

// ============ TOAST ============
function showToast(msg) {
  const t = document.createElement('div');
  t.textContent = msg;
  t.style.cssText = `position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:var(--gold);color:var(--navy);padding:12px 28px;border-radius:100px;font-family:Cairo,sans-serif;font-size:14px;font-weight:700;z-index:9999;box-shadow:0 8px 30px rgba(212,160,23,0.4);animation:fadeInUp .3s ease;`;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2500);
}

// Load jsQR for QR scanning
const jsQRScript = document.createElement('script');
jsQRScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jsQR/1.4.0/jsQR.min.js';
document.head.appendChild(jsQRScript);

// ============ EXCHANGE RATES ============
async function fetchExchangeRates() {
  const container = document.getElementById('rates-container');
  container.innerHTML = '<div style="color: var(--gold); grid-column: 1 / -1; text-align: center;">جاري جلب الأسعار المباشرة... <i class="fas fa-spinner fa-spin"></i></div>';
  
  try {
    const response = await fetch('https://v6.exchangerate-api.com/v6/3c658da2717dd2c1a4b1d5da/latest/USD');
    const data = await response.json();
    
    if (data.result === "success") {
      const rates = data.conversion_rates;
      // العملات العربية والعالمية المهمة التي نريد عرضها
      const targetCurrencies = ['SAR', 'AED', 'EGP', 'KWD', 'QAR', 'OMR', 'BHD', 'JOD', 'EUR', 'GBP'];
      
      container.innerHTML = '';
      targetCurrencies.forEach(currency => {
        if (rates[currency]) {
          container.innerHTML += `
            <div style="background: var(--surface2); padding: 15px; border-radius: 12px; border: 1px solid var(--border); text-align: center; transition: all 0.3s;" onmouseover="this.style.borderColor='var(--gold)'" onmouseout="this.style.borderColor='var(--border)'">
              <div style="font-size: 18px; font-weight: 800; color: var(--gold); margin-bottom: 5px;">${currency}</div>
              <div style="font-size: 16px; font-weight: 700; color: var(--text);">${rates[currency].toFixed(2)}</div>
            </div>
          `;
        }
      });
      showToast('تم تحديث الأسعار بنجاح ✓');
    } else {
      container.innerHTML = `<div style="color: var(--red); grid-column: 1 / -1;">فشل جلب الأسعار: ${data['error-type']}</div>`;
    }
  } catch (error) {
    container.innerHTML = '<div style="color: var(--red); grid-column: 1 / -1;">حدث خطأ أثناء الاتصال بالخادم. تأكد من اتصالك بالإنترنت.</div>';
  }
}
