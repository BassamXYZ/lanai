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
  const auth = firebase.auth();
  let currentUser = null;
  
  
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


// ═══════════════════════════════════════════════
// AUTH — تسجيل الدخول
// ═══════════════════════════════════════════════

auth.onAuthStateChanged(user => {
  currentUser = user;
  if (user) {
    // مستخدم مسجّل — أظهر Dashboard
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('dashboard').classList.add('active');
    // تحديث اسم المستخدم في Sidebar
    const nameEl = document.querySelector('.user-name');
    const avatarEl = document.querySelector('.user-avatar');
    if (nameEl) nameEl.textContent = user.displayName || user.email.split('@')[0];
    if (avatarEl) avatarEl.textContent = (user.displayName || user.email)[0].toUpperCase();
  } else {
    // غير مسجّل — أظهر صفحة Auth
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('auth-page').classList.add('active');
  }
});

function switchAuthTab(tab) {
  document.getElementById('form-login').style.display    = tab === 'login'    ? 'block' : 'none';
  document.getElementById('form-register').style.display = tab === 'register' ? 'block' : 'none';
  document.getElementById('tab-login').classList.toggle('active',    tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');
  hideAuthMsg();
}

function showAuthError(msg) {
  const el = document.getElementById('auth-error');
  el.textContent = msg;
  el.style.display = 'block';
  document.getElementById('auth-success').style.display = 'none';
}
function showAuthSuccess(msg) {
  const el = document.getElementById('auth-success');
  el.textContent = msg;
  el.style.display = 'block';
  document.getElementById('auth-error').style.display = 'none';
}
function hideAuthMsg() {
  document.getElementById('auth-error').style.display   = 'none';
  document.getElementById('auth-success').style.display = 'none';
}

function setAuthBtn(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  const labels = {
    'login-btn':    loading ? 'جارٍ الدخول...'   : '<i class="fas fa-sign-in-alt"></i> دخول',
    'register-btn': loading ? 'جارٍ الإنشاء...' : '<i class="fas fa-user-plus"></i> إنشاء الحساب'
  };
  btn.innerHTML = labels[btnId];
}

async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-pass').value;
  if (!email || !pass) { showAuthError('أدخل البريد وكلمة المرور'); return; }
  setAuthBtn('login-btn', true);
  hideAuthMsg();
  try {
    await auth.signInWithEmailAndPassword(email, pass);
    // onAuthStateChanged سيتولى الباقي تلقائياً
  } catch(e) {
    setAuthBtn('login-btn', false);
    const msgs = {
      'auth/user-not-found':   'هذا البريد غير مسجّل',
      'auth/wrong-password':   'كلمة المرور غير صحيحة',
      'auth/invalid-email':    'صيغة البريد غير صحيحة',
      'auth/too-many-requests':'تم تعطيل الحساب مؤقتاً، حاول لاحقاً',
      'auth/invalid-credential': 'البريد أو كلمة المرور غير صحيحة'
    };
    showAuthError(msgs[e.code] || e.message);
  }
}

async function doRegister() {
  const name  = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pass  = document.getElementById('reg-pass').value;
  if (!name || !email || !pass) { showAuthError('أكمل جميع الحقول'); return; }
  if (pass.length < 8)         { showAuthError('كلمة المرور 8 أحرف على الأقل'); return; }
  setAuthBtn('register-btn', true);
  hideAuthMsg();
  try {
    const cred = await auth.createUserWithEmailAndPassword(email, pass);
    await cred.user.updateProfile({ displayName: name });
    showAuthSuccess('تم إنشاء الحساب ✓');
  } catch(e) {
    setAuthBtn('register-btn', false);
    const msgs = {
      'auth/email-already-in-use': 'هذا البريد مسجّل، سجّل الدخول',
      'auth/invalid-email':        'صيغة البريد غير صحيحة',
      'auth/weak-password':        'كلمة المرور ضعيفة جداً'
    };
    showAuthError(msgs[e.code] || e.message);
  }
}

async function doGoogleLogin() {
  hideAuthMsg();
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    await auth.signInWithPopup(provider);
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('dashboard').classList.add('active');
  } catch(e) {
    if (e.code !== 'auth/popup-closed-by-user')
      showAuthError('فشل Google: ' + e.message);
  }
}

async function doForgotPass() {
  const email = document.getElementById('login-email').value.trim();
  if (!email) { showAuthError('أدخل بريدك الإلكتروني أولاً'); return; }
  try {
    await auth.sendPasswordResetEmail(email);
    showAuthSuccess('تم إرسال رابط إعادة التعيين إلى بريدك ✓');
  } catch(e) {
    showAuthError('تعذّر الإرسال: ' + e.message);
  }
}

// تسجيل الخروج — استبدل goLanding الموجودة
function goLanding() {
  if (!currentUser) return;
  if (!confirm('هل تريد تسجيل الخروج؟')) return;
  auth.signOut();
  // onAuthStateChanged سيتولى إظهار auth-page تلقائياً
}

// دالة مساعدة للنسخ
function copyText(elementId) {
  const el = document.getElementById(elementId);
  const txt = el.value || el.textContent;
  navigator.clipboard.writeText(txt)
    .then(() => showToast('تم النسخ ✓'))
    .catch(() => showToast('تعذّر النسخ'));
}

// ═══════════════════════════════════════════════
// GRAMMAR CHECK — LanguageTool API
// لا يحتاج API Key — مجاني تماماً
// ═══════════════════════════════════════════════
async function doGrammarCheck() {
  const text = document.getElementById('gr-input').value.trim();
  const lang = document.getElementById('gr-lang').value;
  if (!text) { showToast('أدخل نصاً للتصحيح'); return; }

  const spinner = document.getElementById('gr-spinner');
  const summary = document.getElementById('gr-summary');
  const results = document.getElementById('gr-results');
  spinner.style.display = 'inline-block';
  summary.innerHTML = '';
  results.innerHTML  = '<p style="color:var(--text-muted);font-size:13px;padding:12px;">جارٍ الفحص...</p>';

  try {
    const res  = await fetch('https://api.languagetool.org/v2/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `text=${encodeURIComponent(text)}&language=${lang}`
    });
    const data = await res.json();
    spinner.style.display = 'none';

    const matches = data.matches || [];
    if (matches.length === 0) {
      summary.innerHTML = '<span style="color:var(--green);"><i class="fas fa-check-circle"></i> لا أخطاء — النص سليم!</span>';
      summary.style.background = 'rgba(46,204,113,.08)';
      results.innerHTML = '';
      return;
    }

    summary.innerHTML = `<i class="fas fa-exclamation-triangle" style="color:var(--red);"></i> &nbsp;${matches.length} ملاحظة`;
    summary.style.background = 'rgba(231,76,60,.08)';

    results.innerHTML = matches.map((m, i) => {
      const wrong = text.substring(m.offset, m.offset + m.length);
      const suggestions = (m.replacements || []).slice(0, 4);
      return `
        <div class="gr-error-card">
          <span class="gr-error-tag">ملاحظة ${i + 1}</span>
          <div style="font-size:14px;font-weight:600;margin-bottom:6px;">${m.message}</div>
          <div style="font-size:13px;color:var(--text-muted);margin-bottom:8px;">
            الكلمة: <span style="color:var(--red);">"${wrong}"</span>
          </div>
          ${suggestions.length ? `
            <div>اقتراحات:
              ${suggestions.map(s =>
                `<button class="gr-suggestion"
                  onclick="applyGrammarFix('${wrong.replace(/'/g,"\\'")}','${s.value.replace(/'/g,"\\'")}')">
                  ${s.value}
                </button>`
              ).join('')}
            </div>` : ''}
        </div>`;
    }).join('');

  } catch(e) {
    spinner.style.display = 'none';
    results.innerHTML = '<p style="color:var(--red);font-size:13px;">تعذّر الاتصال بـ LanguageTool — تحقق من الإنترنت</p>';
  }
}

function applyGrammarFix(wrong, correct) {
  const ta = document.getElementById('gr-input');
  ta.value = ta.value.replace(wrong, correct);
  showToast('تم التطبيق ✓');
}

// ═══════════════════════════════════════════════
// PDF READER — pdf.js
// لا يحتاج API Key — مكتبة مفتوحة المصدر
// ═══════════════════════════════════════════════ 

(function() {
  if (window.pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }
})();

// Toast notification helper
function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.remove('hidden');
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => {
    toast.classList.add('hidden');
  }, 2500);
}

// PDF state
let pdfDoc      = null;
let pdfPageNum  = 1;
let pdfScale    = 1.5;
let pdfPageText = '';

// Load PDF from file input
async function loadPDF(event) {
  const file = event.target.files[0];
  if (!file || file.type !== 'application/pdf') {
    showToast('يرجى اختيار ملف PDF فقط');
    return;
  }

  const arrayBuffer = await file.arrayBuffer();
  if (!window.pdfjsLib) {
    showToast('مكتبة PDF.js غير محملة');
    return;
  }

  try {
    pdfDoc = await pdfjsLib.getDocument(arrayBuffer).promise;
    pdfPageNum = 1;

    document.getElementById('pdf-empty').style.display  = 'none';
    document.getElementById('pdf-viewer').style.display = 'block';
    document.getElementById('pdf-prev').disabled        = false;
    document.getElementById('pdf-next').disabled        = false;
    document.getElementById('pdf-speak-btn').style.display = 'inline-flex';

    await renderPDFPage();
    showToast(`تم فتح ${pdfDoc.numPages} صفحة ✓`);
  } catch (e) {
    console.error(e);
    showToast('تعذّر فتح الملف — تأكد أنه PDF سليم');
  }
}

// Render current page
async function renderPDFPage() {
  if (!pdfDoc) return;
  try {
    const page     = await pdfDoc.getPage(pdfPageNum);
    const viewport = page.getViewport({ scale: pdfScale });
    const canvas   = document.getElementById('pdf-canvas');
    const ctx      = canvas.getContext('2d');

    canvas.height  = viewport.height;
    canvas.width   = viewport.width;

    // Maintain max width
    canvas.style.width = '100%';
    canvas.style.height = 'auto';

    await page.render({ canvasContext: ctx, viewport }).promise;

    // Update page info
    document.getElementById('pdf-page-info').textContent =
      `صفحة ${pdfPageNum} من ${pdfDoc.numPages}`;

    // Extract text for speech
    const textContent = await page.getTextContent();
    pdfPageText = textContent.items.map(item => item.str).join(' ');
  } catch (e) {
    console.error('Render error:', e);
    showToast('حدث خطأ أثناء عرض الصفحة');
  }
}

// Navigate pages
function changePDFPage(direction) {
  if (!pdfDoc) return;
  const newPage = pdfPageNum + direction;
  if (newPage < 1 || newPage > pdfDoc.numPages) return;
  pdfPageNum = newPage;
  renderPDFPage();
}

// Zoom in/out
function changePDFZoom(delta) {
  pdfScale = Math.max(0.5, Math.min(3, pdfScale + delta));
  renderPDFPage();
}

// Read page aloud
function readCurrentPDFPage() {
  if (!pdfPageText || pdfPageText.trim() === '') {
    showToast('لا يوجد نص مقروء في هذه الصفحة');
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(pdfPageText);
  utterance.lang  = 'ar-SA';
  utterance.rate  = 0.9;
  utterance.volume = 1;
  window.speechSynthesis.speak(utterance);
  showToast('جارٍ قراءة الصفحة...');
}

// ═══════════════════════════════════════════════
// IMAGE GENERATOR — Pollinations.ai
// لا يحتاج API Key — مجاني بلا حدود
// ═══════════════════════════════════════════════
const genImageHistory = [];

async function generateImage() {
  const prompt  = document.getElementById('gen-prompt').value.trim();
  const style   = document.getElementById('gen-style').value;
  const sizeStr = document.getElementById('gen-size').value;

  if (!prompt) { showToast('أدخل وصفاً للصورة'); return; }

  const [width, height] = sizeStr.split('x').map(Number);
  const fullPrompt = style ? `${prompt}, ${style}` : prompt;
  const seed = Math.floor(Math.random() * 999999);
  const url  = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux&enhance=false`;

  const spinner   = document.getElementById('gen-spinner');
  const outputDiv = document.getElementById('gen-output');
  spinner.style.display = 'inline-block';

  outputDiv.innerHTML = `
    <div id="gen-loading" style="text-align:center;padding:40px;">
      <div class="tool-spinner" style="width:40px;height:40px;border-width:3px;margin:0 auto;"></div>
      <p style="color:var(--text-muted);margin-top:16px;font-size:14px;">جارٍ التوليد...<br><small>قد يستغرق 30-60 ثانية</small></p>
    </div>
    <img id="gen-result-img" style="max-width:100%;border-radius:12px;border:1px solid var(--border-bright);display:none;">
    <div id="gen-dl-btn" style="display:none;gap:10px;margin-top:14px;justify-content:center;">
      <a id="gen-open-link" href="#" target="_blank"
        style="padding:10px 20px;background:var(--gold);color:var(--navy);border-radius:10px;font-weight:700;font-size:13px;text-decoration:none;display:inline-flex;align-items:center;gap:6px;">
        <i class="fas fa-external-link-alt"></i> فتح الصورة
      </a>
      <button onclick="generateImage()"
        style="padding:10px 20px;background:transparent;border:1px solid var(--border-bright);color:var(--text);border-radius:10px;font-family:'Cairo',sans-serif;font-size:13px;cursor:pointer;">
        <i class="fas fa-redo"></i> توليد آخر
      </button>
    </div>`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90000);

    const resp = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!resp.ok) throw new Error('HTTP ' + resp.status);

    const blob = await resp.blob();
    const blobUrl = URL.createObjectURL(blob);

    const img = document.getElementById('gen-result-img');
    img.src = blobUrl;
    img.style.display = 'block';
    document.getElementById('gen-open-link').href = blobUrl;
    document.getElementById('gen-loading').style.display = 'none';
    document.getElementById('gen-dl-btn').style.display = 'flex';
    spinner.style.display = 'none';

  } catch (err) {
    spinner.style.display = 'none';
    const msg = err.name === 'AbortError' ? 'انتهت مهلة الطلب — حاول مجدداً' : 'تعذّر التوليد — تحقق من اتصالك';
    document.getElementById('gen-loading').innerHTML = `<p style="color:var(--red)">${msg}</p>
      <button onclick="generateImage()" style="margin-top:12px;padding:10px 20px;background:var(--gold);color:var(--navy);border:none;border-radius:10px;font-family:'Cairo',sans-serif;font-size:13px;font-weight:700;cursor:pointer;">
        <i class="fas fa-redo"></i> إعادة المحاولة
      </button>`;
  }
}

function renderGenHistory() {
  const el = document.getElementById('gen-history');
  if (!genImageHistory.length) return;
  el.innerHTML = '<p style="font-size:11px;color:var(--text-muted);margin-bottom:6px;">سابقة:</p>' +
    genImageHistory.slice(0, 5).map(u =>
      `<img src="${u}" class="gen-history-thumb"
        onclick="document.getElementById('gen-output').querySelector('img').src='${u}'">`
    ).join('');
}

// ═══════════════════════════════════════════════
// TOURISM — OpenStreetMap Nominatim
// لا يحتاج API Key — مجاني بالكامل
// ═══════════════════════════════════════════════
async function searchPlaces() {
  const query   = document.getElementById('tourism-query').value.trim();
  const type    = document.getElementById('tourism-type').value;
  const spinner = document.getElementById('tourism-spinner');
  const results = document.getElementById('tourism-results');
  const mapDiv  = document.getElementById('tourism-map');

  if (!query) { showToast('أدخل مكاناً للبحث'); return; }

  const searchQuery = type ? `${type} ${query}` : query;
  spinner.style.display = 'inline-block';
  results.innerHTML     = '<p style="color:var(--text-muted);font-size:13px;grid-column:1/-1;">جارٍ البحث...</p>';
  mapDiv.style.display  = 'none';

  try {
    const res  = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=9&addressdetails=1`,
      { headers: { 'Accept-Language': 'ar' } }
    );
    const data = await res.json();
    spinner.style.display = 'none';

    if (!data.length) {
      results.innerHTML = '<p style="color:var(--text-muted);font-size:13px;grid-column:1/-1;">لا نتائج — جرّب بحثاً مختلفاً</p>';
      return;
    }

    const typeEmojis = {
      restaurant:'🍽️', hotel:'🏨', museum:'🏛️',
      mosque:'🕌', hospital:'🏥', cafe:'☕', park:'🌳'
    };
    const emoji = typeEmojis[type] || '📍';

    results.innerHTML = data.map(place => {
      const nameParts = place.display_name.split(',').slice(0, 2).join('،');
      return `
        <div class="place-card" onclick="showPlaceOnMap(${place.lat}, ${place.lon})">
          <div class="place-emoji">${emoji}</div>
          <div class="place-info">
            <div class="place-name">${nameParts.substring(0, 50)}${nameParts.length > 50 ? '...' : ''}</div>
            <div class="place-type">${place.type || type || 'مكان'}</div>
            <a href="https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lon}&zoom=17"
              target="_blank" class="place-map-link" onclick="event.stopPropagation()">
              <i class="fas fa-map-marker-alt"></i> فتح الخريطة
            </a>
          </div>
        </div>`;
    }).join('');

    // Show first result on map
    showPlaceOnMap(data[0].lat, data[0].lon);

  } catch(e) {
    spinner.style.display = 'none';
    results.innerHTML = '<p style="color:var(--red);font-size:13px;grid-column:1/-1;">تعذّر البحث — تحقق من الاتصال</p>';
  }
}

function showPlaceOnMap(lat, lon) {
  const mapDiv   = document.getElementById('tourism-map');
  const mapFrame = document.getElementById('tourism-map-frame');
  mapDiv.style.display = 'block';
  const bbox  = `${lon - 0.015},${lat - 0.015},${+lon + 0.015},${+lat + 0.015}`;
  mapFrame.src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;
}

// ═══════════════════════════════════════════════
// VOICE TRANSLATOR — STT + MyMemory + TTS
// لا يحتاج API Key — كله مجاني
// ═══════════════════════════════════════════════
let vtRecognition = null;
let vtIsListening = false;

function toggleVoiceTranslator() {
  if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
    showToast('المتصفح لا يدعم التعرف على الصوت — استخدم Chrome');
    return;
  }
  vtIsListening ? stopVoiceTranslator() : startVoiceTranslator();
}

function startVoiceTranslator() {
  const SR       = window.SpeechRecognition || window.webkitSpeechRecognition;
  vtRecognition  = new SR();
  vtRecognition.lang        = document.getElementById('vt-from-lang').value;
  vtRecognition.continuous  = false;
  vtRecognition.interimResults = false;

  vtRecognition.onstart = () => {
    vtIsListening = true;
    document.getElementById('vt-rec-btn').classList.add('recording');
    document.getElementById('vt-rec-icon').className = 'fas fa-stop';
    document.getElementById('vt-status').textContent  = '● يستمع...';
    document.getElementById('vt-status').style.color  = 'var(--red)';
  };

  vtRecognition.onresult = async (event) => {
    const spokenText = event.results[0][0].transcript;
    document.getElementById('vt-original-text').textContent = spokenText;
    document.getElementById('vt-original-text').style.color = 'var(--text)';
    document.getElementById('vt-status').textContent = 'جارٍ الترجمة...';

    // Translate using MyMemory
    const fromLang = document.getElementById('vt-from-lang').value.split('-')[0];
    const toLang   = document.getElementById('vt-to-lang').value;
    const translated = await translateWithMyMemory(spokenText, fromLang, toLang);

    document.getElementById('vt-translated-text').value = translated;
    document.getElementById('vt-status').textContent    = '✓ تمت الترجمة';
    document.getElementById('vt-status').style.color    = 'var(--green)';
    stopVoiceTranslator();
  };

  vtRecognition.onerror = (e) => {
    showToast('خطأ في الميكروفون: ' + e.error);
    stopVoiceTranslator();
  };

  vtRecognition.onend = () => { if (vtIsListening) stopVoiceTranslator(); };
  vtRecognition.start();
}

function stopVoiceTranslator() {
  vtIsListening = false;
  if (vtRecognition) vtRecognition.stop();
  document.getElementById('vt-rec-btn').classList.remove('recording');
  document.getElementById('vt-rec-icon').className = 'fas fa-microphone';
}

async function translateWithMyMemory(text, from, to) {
  try {
    const res  = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`);
    const data = await res.json();
    return data.responseStatus === 200 ? data.responseData.translatedText : text;
  } catch(e) {
    return '[تعذّر الترجمة]';
  }
}

function speakTranslation() {
  const text = document.getElementById('vt-translated-text').value.trim();
  const lang = document.getElementById('vt-to-lang').value;
  if (!text) { showToast('لا يوجد نص للقراءة'); return; }
  window.speechSynthesis.cancel();
  const utt  = new SpeechSynthesisUtterance(text);
  utt.lang   = lang === 'ar' ? 'ar-SA' : lang;
  utt.rate   = 0.9;
  window.speechSynthesis.speak(utt);
}
