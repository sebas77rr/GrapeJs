// Genera el HTML de la landing del video
function renderFunnelLanding(funnel) {
  const threshold = funnel.video_threshold || 90;
  const ctaText = funnel.cta_text || "¡Quiero acceder!";
  const formUrl = `/f/${funnel.public_slug}/form`;

  let playerHTML = "";
  let playerJS = "";

  let vType = funnel.video_type || 'youtube';
  if (funnel.video_url.match(/(youtube\.com|youtu\.be)/i)) vType = 'youtube';
  else if (funnel.video_url.match(/vimeo\.com/i)) vType = 'vimeo';

  if (vType === "youtube") {
    playerHTML = `<div class="video-wrapper"><div id="yt-player"></div></div>`;
    playerJS = `
      var tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
      var ytPlayer, ytDuration = 0, ytInterval;
      function extractYTId(url) {
        var m = url.match(/(?:youtu\\.be\\/|v=|embed\\/)([\\w-]{11})/);
        return m ? m[1] : '';
      }
      window.onYouTubeIframeAPIReady = function() {
        ytPlayer = new YT.Player('yt-player', {
          width: '100%', height: '100%',
          videoId: extractYTId('${funnel.video_url}'),
          playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
          events: {
            onReady: function(e) { ytDuration = e.target.getDuration(); },
            onStateChange: function(e) {
              if (e.data === YT.PlayerState.PLAYING) {
                ytInterval = setInterval(function() {
                  var t = ytPlayer.getCurrentTime();
                  trackSegment(t, ytDuration);
                  updateProgress(t, ytDuration);
                }, 500);
              } else { clearInterval(ytInterval); }
            }
          }
        });
      }`;
  } else if (vType === "vimeo") {
    playerHTML = `<div class="video-wrapper">
        <iframe id="vimeo-player" src="https://player.vimeo.com/video/${funnel.video_url.match(/vimeo\.com\/(\d+)/)?.[1] || funnel.video_url}"
                frameborder="0" allow="autoplay; fullscreen" allowfullscreen style="width:100%;height:100%;position:absolute;top:0;left:0;"></iframe>
      </div>`;
    playerJS = `
      var vScript = document.createElement('script');
      vScript.src = 'https://player.vimeo.com/api/player.js';
      vScript.onload = function() {
        var vPlayer = new Vimeo.Player(document.getElementById('vimeo-player'));
        var vDuration = 0;
        vPlayer.getDuration().then(function(d) { vDuration = d; });
        vPlayer.on('timeupdate', function(data) {
          trackSegment(data.seconds, vDuration);
          updateProgress(data.seconds, vDuration);
        });
      };
      document.head.appendChild(vScript);`;
  } else {
    playerHTML = `<div class="video-wrapper">
        <video id="mp4-player" preload="metadata" playsinline controls>
          <source src="${funnel.video_url}" type="video/mp4">
        </video>
      </div>`;
    playerJS = `
      var vid = document.getElementById('mp4-player');
      vid.addEventListener('timeupdate', function() {
        trackSegment(vid.currentTime, vid.duration || 1);
        updateProgress(vid.currentTime, vid.duration || 1);
      });`;
  }

  return `<!DOCTYPE html><html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(funnel.title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Sora:wght@600;700;800&display=swap" rel="stylesheet">

  <style>
    :root {
      --accent: ${funnel.cta_color || '#6366f1'};
      --accent2: ${funnel.cta_color || '#a78bfa'};
      --accent-glow: ${funnel.cta_color ? funnel.cta_color + '40' : 'rgba(99,102,241,0.25)'};
      --bg-color: ${funnel.bg_color || '#0f172a'};
      --text-color: ${funnel.text_color || '#ffffff'};
      --success: #10b981;
      --glass: rgba(255,255,255,0.04);
      --border: rgba(255,255,255,0.1);
      --text-muted: rgba(255,255,255,0.6);
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body {
      font-family: 'DM Sans', sans-serif;
      ${funnel.bg_image 
        ? `background: url('${funnel.bg_image}') no-repeat center center fixed; background-size: cover;` 
        : `background: var(--bg-color);`}
      min-height: 100vh;
      color: var(--text-color);
      overflow-x: hidden;
    }
    body::before {
      content: '';
      position: fixed; inset: 0;
      ${funnel.bg_image ? `background: rgba(0,0,0,0.55);` : `background: radial-gradient(2px 2px at 15% 25%, rgba(167,139,250,0.25), transparent), radial-gradient(2px 2px at 75% 15%, rgba(99,102,241,0.2), transparent), radial-gradient(2px 2px at 45% 75%, rgba(236,72,153,0.12), transparent);`}
      pointer-events: none; z-index: 0;
    }
    .container {
      position: relative; z-index: 1;
      max-width: 780px; margin: 0 auto;
      padding: 48px 20px 72px;
      display: flex; flex-direction: column; align-items: center;
      min-height: 100vh; justify-content: center; gap: 0;
    }
    .eyebrow {
      font-family: 'Sora', sans-serif;
      font-size: 0.72rem; font-weight: 700; letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--accent2);
      margin-bottom: 16px;
      opacity: 0; animation: fadeUp 0.6s ease-out 0.1s forwards;
    }
    .title {
      font-family: 'Sora', sans-serif;
      font-size: clamp(2rem, 5.5vw, 3.2rem);
      font-weight: 800; text-align: center; line-height: 1.12;
      margin-bottom: 16px; letter-spacing: -0.03em;
      ${funnel.text_color ? `color: var(--text-color);` : `background: linear-gradient(135deg, #fff 0%, #e0e7ff 45%, #c4b5fd 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;`}
      opacity: 0; animation: fadeUp 0.7s ease-out 0.2s forwards;
    }
    .highlight {
      font-size: clamp(0.95rem, 2.2vw, 1.15rem);
      text-align: center; margin-bottom: 40px; max-width: 580px;
      line-height: 1.65; font-weight: 500; 
      color: ${funnel.text_color ? `var(--text-color)` : `rgba(255,255,255,0.6)`};
      opacity: 0; animation: fadeUp 0.8s ease-out 0.3s forwards;
    }
    .video-card {
      width: 100%;
      background: var(--glass);
      backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
      border: 1px solid var(--border); border-radius: 24px; padding: 14px;
      box-shadow: 0 30px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.03);
      opacity: 0; animation: fadeUp 0.9s ease-out 0.4s forwards;
    }
    .video-wrapper {
      position: relative; width: 100%; 
      ${funnel.video_orientation === 'vertical' 
          ? `width: min(100%, 400px, calc(70vh * 9 / 16)); height: auto; aspect-ratio: 9/16; margin: 0 auto;` 
          : `padding-bottom: 56.25%;`}
      border-radius: 14px; overflow: hidden; background: #000;
    }
    .video-wrapper iframe, .video-wrapper video {
      position: absolute; inset: 0; width: 100%; height: 100%;
      border: none; border-radius: 14px;
    }
    .progress-row {
      display: flex; align-items: center; gap: 14px; margin-top: 14px; padding: 0 4px;
    }
    .progress-label { font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.35); letter-spacing: 0.06em; white-space: nowrap; }
    .progress-track {
      flex: 1; height: 5px; background: rgba(255,255,255,0.07);
      border-radius: 10px; overflow: hidden;
    }
    .progress-fill {
      height: 100%; width: 0%; border-radius: 10px;
      background: linear-gradient(90deg, var(--accent), var(--accent2));
      transition: width 0.4s ease;
    }
    .progress-pct { font-size: 12px; font-weight: 800; color: rgba(255,255,255,0.45); min-width: 36px; text-align: right; }
    .cta-wrap { width: 100%; margin-top: 36px; display: flex; justify-content: center; opacity: 0; animation: fadeUp 1s ease-out 0.55s forwards; }
    .cta-btn {
      display: inline-flex; align-items: center; gap: 12px;
      padding: 18px 52px; font-family: 'Sora', sans-serif; font-size: 1rem; font-weight: 700;
      border: 1px solid rgba(255,255,255,0.1); border-radius: 100px;
      background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.3);
      cursor: not-allowed; text-decoration: none; transition: all 0.5s ease; letter-spacing: 0.01em;
    }
    .cta-btn.unlocked {
      background: var(--accent); color: #fff; border-color: transparent; cursor: pointer;
      box-shadow: 0 8px 40px rgba(99,102,241,0.4), 0 0 0 1px rgba(255,255,255,0.1);
      animation: unlockPop 0.5s ease-out, pulse 3s ease-in-out infinite 0.5s;
    }
    .cta-btn.unlocked:hover { transform: translateY(-3px) scale(1.03); box-shadow: 0 14px 50px rgba(99,102,241,0.55); }
    .badge {
      position: fixed; bottom: 20px; right: 20px;
      background: rgba(255,255,255,0.06); backdrop-filter: blur(12px);
      padding: 7px 15px; border-radius: 100px; font-size: 11px; font-weight: 600;
      color: rgba(255,255,255,0.4); border: 1px solid rgba(255,255,255,0.07);
      display: flex; align-items: center; gap: 6px; z-index: 9999;
    }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes unlockPop { 0% { transform: scale(0.9); opacity: 0.6; } 60% { transform: scale(1.05); } 100% { transform: scale(1); opacity: 1; } }
    @keyframes pulse { 0%,100% { box-shadow: 0 8px 40px rgba(99,102,241,0.4); } 50% { box-shadow: 0 8px 55px rgba(99,102,241,0.6); } }
    @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
    body.theme-light { background: #f1f5f9; color: #0f172a; }
    body.theme-light::before { display: none; }
    body.theme-light .title { background: none; -webkit-text-fill-color: #0f172a; }
    body.theme-light .highlight { color: #64748b; }
    body.theme-light .video-card { background: #fff; border-color: #e2e8f0; box-shadow: 0 20px 40px rgba(0,0,0,0.06); }
    body.theme-light .progress-track { background: #e2e8f0; }
    body.theme-light .cta-btn { background: #f1f5f9; color: #94a3b8; border-color: #e2e8f0; }
    body.theme-light .badge { background: #fff; color: #94a3b8; border-color: #e2e8f0; }
    @media (max-width: 600px) {
      .container { padding: 32px 16px 56px; }
      .video-card { padding: 10px; border-radius: 18px; }
      .cta-btn { padding: 16px 32px; font-size: 0.95rem; width: 100%; justify-content: center; border-radius: 16px; }
    }
    .funnel-logo {
      max-height: 60px; max-width: 200px;
      margin: 0 auto 20px auto; display: block;
      object-fit: contain;
    }
    ${funnel.video_mode === 'fullscreen' ? `
    /* body { background: #000; } removed so bg_image shows */
    .container { max-width: 1000px; width: 100%; padding: 0 10px; display: flex; flex-direction: column; justify-content: center; min-height: 100vh; }
    .video-card { background: transparent; border: none; box-shadow: none; padding: 0; border-radius: 0; }
    .video-wrapper { 
      border-radius: 0; 
      ${funnel.video_orientation === 'vertical' 
          ? `padding-bottom: 0 !important; height: 70vh; width: calc(70vh * 9 / 16); max-width: 100% !important; margin: 0 auto;` 
          : `max-width: 100% !important; max-height: 75vh;`}
    }
    .video-wrapper iframe, .video-wrapper video { border-radius: 0; }
    .progress-row { margin-top: 20px; padding: 0 20px; }
    .cta-wrap { margin-top: 20px; padding-bottom: 30px; }
    ` : ''}
  </style>
</head>
<body class="theme-${funnel.theme || 'dark'}">
  <div class="container">
    ${funnel.logo_url ? `<img src="${funnel.logo_url}" alt="Logo" class="funnel-logo" />` : ""}
    ${funnel.video_mode !== 'fullscreen' ? `
      <div class="eyebrow">✦ Contenido exclusivo</div>
      <h1 class="title">${escapeHtml(funnel.title)}</h1>
      ${funnel.highlight_text ? `<p class="highlight">${escapeHtml(funnel.highlight_text)}</p>` : ""}
    ` : ""}
    <div class="video-card">
      ${playerHTML}
      <div class="progress-row">
        <span class="progress-label">PROGRESO</span>
        <div class="progress-track"><div class="progress-fill" id="progressFill"></div></div>
        <span class="progress-pct" id="progressText">0%</span>
      </div>
    </div>
    <div class="cta-wrap">
      <a id="ctaBtn" class="cta-btn" href="javascript:void(0)">
        <span id="ctaIcon">🔒</span>
        <span id="ctaLabel">${funnel.locked_btn_text || 'Ve el video para desbloquear'}</span>
      </a>
    </div>
  </div>
  <script>
    (function() {
      var THRESHOLD = ${threshold};
      var CTA_TEXT = ${JSON.stringify(ctaText)};
      var FORM_URL = ${JSON.stringify(formUrl)};
      var STORAGE_KEY = 'funnel_unlocked_${funnel.id}';
      var progressFill = document.getElementById('progressFill');
      var progressText = document.getElementById('progressText');
      var ctaBtn = document.getElementById('ctaBtn');
      var ctaIcon = document.getElementById('ctaIcon');
      var ctaLabel = document.getElementById('ctaLabel');
      var watchedSegments = new Set();
      var totalSegments = 100;
      function trackSegment(currentTime, duration) {
        if (!duration || duration <= 0) return;
        var seg = Math.floor((currentTime / duration) * totalSegments);
        if (seg >= 0 && seg < totalSegments) watchedSegments.add(seg);
      }
      function getRealPct() { return Math.min(100, Math.round((watchedSegments.size / totalSegments) * 100)); }
      function updateProgress(currentTime, duration) {
        if (!duration || duration <= 0) return;
        trackSegment(currentTime, duration);
        var pct = getRealPct();
        progressFill.style.width = pct + '%';
        progressText.textContent = pct + '%';
        if (pct >= THRESHOLD) { progressFill.style.background = 'linear-gradient(90deg, #10b981, #34d399)'; unlockCTA(); }
        else if (pct >= THRESHOLD * 0.7) { progressFill.style.background = 'linear-gradient(90deg, #6366f1, #f59e0b)'; }
      }
      var isUnlocked = false;
      function unlockCTA() {
        if (isUnlocked) return;
        isUnlocked = true;
        ctaBtn.classList.add('unlocked');
        ctaIcon.textContent = '✅';
        ctaLabel.textContent = CTA_TEXT;
        ctaBtn.href = FORM_URL;
        ctaBtn.style.cursor = 'pointer';
        try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch(e) {}
      }
      try {
        if (sessionStorage.getItem(STORAGE_KEY) === '1') {
          unlockCTA();
          progressFill.style.width = '100%';
          progressText.textContent = '100%';
          progressFill.style.background = 'linear-gradient(90deg, #10b981, #34d399)';
        }
      } catch(e) {}
      ${playerJS}
    })();
  </script>
</body>
</html>`;
}

// --- GENERADOR DEL FORMULARIO + CALENDARIO ---
function renderFunnelForm(funnel) {
  let parsedFields = funnel.form_fields || [];
  if (typeof parsedFields === 'string') parsedFields = JSON.parse(parsedFields);
  if (typeof parsedFields === 'string') parsedFields = JSON.parse(parsedFields);

  const fieldsHTML = parsedFields.map((f) => {
    const required = f.required ? 'required' : '';
    const requiredStar = f.required ? '<span class="req">*</span>' : '';
    if (f.type === "textarea") {
      return `<div class="form-group">
          <label for="field_${f.name}">${escapeHtml(f.label)} ${requiredStar}</label>
          <textarea id="field_${f.name}" name="${escapeHtml(f.name)}" rows="3" placeholder="${escapeHtml(f.label)}" ${required}></textarea>
        </div>`;
    } else if (f.type === "select") {
      return `<div class="form-group">
          <label for="field_${f.name}">${escapeHtml(f.label)} ${requiredStar}</label>
          <select id="field_${f.name}" name="${escapeHtml(f.name)}" ${required}>
            <option value="">Selecciona una opción...</option>
            <option value="opcion1">Opción 1</option>
            <option value="opcion2">Opción 2</option>
            <option value="opcion3">Opción 3</option>
          </select>
        </div>`;
    }
    const isPhone = f.type === 'tel' || f.name.toLowerCase().includes('telefono') || f.name.toLowerCase().includes('phone');
    if (isPhone) {
      return `<div class="form-group">
        <label for="field_${f.name}">${escapeHtml(f.label)} ${requiredStar}</label>
        <div class="phone-wrapper">
          <select id="field_${f.name}_code" name="${escapeHtml(f.name)}_code">
            <option value="" disabled selected>Indicativo</option>
            <option value="+57">🇨🇴 Colombia (+57)</option>
            <option value="+52">🇲🇽 México (+52)</option>
          </select>
          <input type="tel" id="field_${f.name}" name="${escapeHtml(f.name)}" placeholder="Número sin indicativo" ${required} />
        </div>
      </div>`;
    }
    return `<div class="form-group">
        <label for="field_${f.name}">${escapeHtml(f.label)} ${requiredStar}</label>
        <input type="${f.type || 'text'}" id="field_${f.name}" name="${escapeHtml(f.name)}" placeholder="${escapeHtml(f.label)}" ${required} />
      </div>`;
  }).join("\n");

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(funnel.title)} — Agenda tu cita</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --accent: ${funnel.cta_color || '#6366f1'};
      --accent-light: rgba(99,102,241,0.15);
      --accent-glow: rgba(99,102,241,0.35);
      --bg: #0d0d1a;
      --surface: rgba(255,255,255,0.04);
      --border: rgba(255,255,255,0.09);
      --text: #fff;
      --text-muted: rgba(255,255,255,0.5);
      --radius: 16px;
      --success: #10b981;
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body {
      font-family: 'DM Sans', sans-serif;
      ${funnel.bg_image
        ? `background: url('${funnel.bg_image}') no-repeat center center fixed; background-size: cover;`
        : funnel.bg_color
          ? `background: ${funnel.bg_color};`
          : `background: radial-gradient(ellipse at 20% 50%, #0f0c29 0%, #302b63 50%, #24243e 100%);`}
      min-height: 100vh; color: var(--text);
      display: flex; align-items: center; justify-content: center;
      padding: 24px 16px; overflow-x: hidden;
    }
    body::before {
      content: ''; position: fixed; inset: 0;
      ${funnel.bg_image ? `background: rgba(0,0,0,0.6);` : `background: radial-gradient(2px 2px at 20% 30%, rgba(139,92,246,0.2), transparent), radial-gradient(2px 2px at 80% 70%, rgba(99,102,241,0.15), transparent);`}
      pointer-events: none; z-index: 0;
    }

    /* ── CARD ── */
    .card {
      position: relative; z-index: 1;
      width: 100%; max-width: 500px;
      background: rgba(255,255,255,0.04);
      backdrop-filter: blur(28px); -webkit-backdrop-filter: blur(28px);
      border: 1px solid var(--border); border-radius: 28px;
      padding: 44px 40px;
      box-shadow: 0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06);
      animation: cardIn 0.6s cubic-bezier(0.16,1,0.3,1);
    }

    /* ── STEPS INDICATOR ── */
    .steps {
      display: flex; align-items: center; gap: 8px;
      margin-bottom: 36px; justify-content: center;
    }
    .step-dot {
      width: 8px; height: 8px; border-radius: 100px;
      background: rgba(255,255,255,0.15); transition: all 0.4s ease;
    }
    .step-dot.active { width: 28px; background: var(--accent); }
    .step-dot.done { background: var(--success); }

    /* ── FORM VIEW ── */
    .view { display: none; animation: fadeIn 0.4s ease; }
    .view.active { display: block; }
    .view-header { margin-bottom: 28px; }
    .view-emoji { font-size: 2.2rem; margin-bottom: 10px; }
    .view-title {
      font-family: 'Sora', sans-serif; font-size: 1.55rem; font-weight: 800;
      line-height: 1.2; margin-bottom: 6px;
      ${funnel.text_color ? `color: var(--text-color);` : `background: linear-gradient(135deg, #fff 0%, #c4b5fd 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;`}
    }
    .view-sub { color: var(--text-muted); font-size: 0.9rem; line-height: 1.5; }

    /* ── FORM FIELDS ── */
    .form-group { margin-bottom: 18px; }
    .form-group label {
      display: block; font-size: 0.8rem; font-weight: 700;
      color: ${funnel.text_color ? `var(--text-color)` : `rgba(255,255,255,0.95)`}; margin-bottom: 7px; letter-spacing: 0.04em; text-transform: uppercase;
    }
    .req { color: #f87171; margin-left: 2px; }
    .form-group input, .form-group textarea, .form-group select {
      width: 100%; padding: 13px 16px;
      background: rgba(255,255,255,0.92); border: 2px solid transparent;
      border-radius: 12px; color: #0f172a; font-family: 'DM Sans', sans-serif;
      font-size: 0.95rem; font-weight: 600; outline: none; transition: all 0.25s ease;
    }
    .form-group select option { background: #fff; color: #0f172a; }
    .form-group input::placeholder, .form-group textarea::placeholder { color: rgba(15,23,42,0.4); font-weight: 500; }
    .form-group input:focus, .form-group textarea:focus, .form-group select:focus {
      background: #ffffff;
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--accent-glow);
    }
    .form-group textarea { resize: vertical; min-height: 80px; }

    /* ── PHONE FIELD ── */
    .phone-wrapper { display: flex; gap: 8px; }
    .phone-wrapper select {
      flex-shrink: 0; width: auto; min-width: 140px;
      background: #fff; color: #0f172a;
      border: 2px solid rgba(15,23,42,0.12);
      border-radius: 12px; padding: 12px 10px;
      font-family: 'DM Sans', sans-serif; font-size: 0.92rem; font-weight: 600;
      cursor: pointer; outline: none; appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%230f172a' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
      background-repeat: no-repeat; background-position: right 10px center;
      padding-right: 28px;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .phone-wrapper select:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-glow); }
    .phone-wrapper input[type="tel"] { flex: 1; }

    /* ── BUTTONS ── */
    .btn-primary {
      width: 100%; padding: 15px;
      font-family: 'Sora', sans-serif; font-size: 0.95rem; font-weight: 700;
      border: none; border-radius: 14px; cursor: pointer;
      background: var(--accent); color: #fff;
      margin-top: 8px; transition: all 0.25s ease;
      box-shadow: 0 6px 24px var(--accent-glow);
      display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 32px var(--accent-glow); }
    .btn-primary:active { transform: translateY(0); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    .btn-back {
      background: none; border: none; color: var(--text-muted);
      font-size: 0.85rem; font-weight: 600; cursor: pointer; padding: 0;
      display: flex; align-items: center; gap: 6px; margin-bottom: 20px;
      transition: color 0.2s;
    }
    .btn-back:hover { color: #fff; }

    /* ── ERROR ── */
    .error-box {
      display: none; background: rgba(239,68,68,0.12);
      border: 1px solid rgba(239,68,68,0.3); border-radius: 10px;
      padding: 11px 14px; margin-bottom: 16px; font-size: 0.87rem;
      color: #fca5a5; text-align: center;
    }
    .error-box.show { display: block; }

    /* ── CALENDAR ── */
    .calendar-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 20px;
    }
    .cal-month {
      font-family: 'Sora', sans-serif; font-size: 1rem; font-weight: 700; color: #fff;
    }
    .cal-nav {
      background: rgba(255,255,255,0.06); border: 1px solid var(--border);
      color: #fff; border-radius: 8px; width: 34px; height: 34px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; font-size: 1rem; transition: all 0.2s;
    }
    .cal-nav:hover { background: rgba(255,255,255,0.12); }
    .cal-grid {
      display: grid; grid-template-columns: repeat(7,1fr); gap: 4px;
      margin-bottom: 20px;
    }
    .cal-day-label {
      text-align: center; font-size: 0.7rem; font-weight: 700;
      color: var(--text-muted); padding: 6px 0; letter-spacing: 0.05em; text-transform: uppercase;
    }
    .cal-day {
      aspect-ratio: 1; display: flex; align-items: center; justify-content: center;
      border-radius: 10px; font-size: 0.85rem; font-weight: 600; cursor: pointer;
      transition: all 0.2s; border: 1px solid transparent; color: #fff;
    }
    .cal-day:hover:not(.disabled):not(.empty) { background: rgba(255,255,255,0.1); }
    .cal-day.today { border-color: rgba(99,102,241,0.5); color: var(--accent); }
    .cal-day.selected { background: var(--accent); color: #fff; box-shadow: 0 4px 16px var(--accent-glow); }
    .cal-day.disabled { color: rgba(255,255,255,0.15); cursor: not-allowed; }
    .cal-day.empty { cursor: default; }
    .cal-day.has-slots::after {
      content: ''; display: block; width: 4px; height: 4px;
      background: var(--success); border-radius: 50%;
      position: absolute; bottom: 4px; left: 50%; transform: translateX(-50%);
    }
    .cal-day { position: relative; }

    /* ── SLOTS ── */
    .slots-loading {
      text-align: center; padding: 32px 0; color: var(--text-muted); font-size: 0.9rem;
    }
    .slots-loading .spinner {
      width: 28px; height: 28px; border: 3px solid rgba(255,255,255,0.1);
      border-top-color: var(--accent); border-radius: 50%;
      animation: spin 0.8s linear infinite; margin: 0 auto 12px;
    }
    .slots-empty { text-align: center; padding: 28px 0; color: var(--text-muted); font-size: 0.9rem; }
    .slots-section { margin-bottom: 20px; }
    .slots-section-title {
      font-size: 0.72rem; font-weight: 700; letter-spacing: 0.1em;
      text-transform: uppercase; color: var(--text-muted); margin-bottom: 10px;
    }
    .slots-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; }
    .slot-btn {
      padding: 10px 8px; background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1); border-radius: 10px;
      color: #fff; font-family: 'DM Sans', sans-serif; font-size: 0.85rem;
      font-weight: 600; cursor: pointer; text-align: center; transition: all 0.2s;
    }
    .slot-btn:hover { background: rgba(99,102,241,0.2); border-color: rgba(99,102,241,0.4); }
    .slot-btn.selected {
      background: var(--accent); border-color: var(--accent);
      box-shadow: 0 4px 14px var(--accent-glow);
    }
    .slot-btn.full { opacity: 0.35; cursor: not-allowed; text-decoration: line-through; }

    /* ── SELECTED SUMMARY ── */
    .selection-summary {
      background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.2);
      border-radius: 12px; padding: 14px 16px; margin-bottom: 20px;
      display: none; font-size: 0.88rem; color: rgba(255,255,255,0.8);
    }
    .selection-summary.show { display: flex; align-items: center; gap: 10px; }
    .selection-summary strong { color: var(--success); }

    /* ── SUCCESS ── */
    .success-view { text-align: center; padding: 20px 0; }
    .success-icon {
      width: 72px; height: 72px; background: rgba(16,185,129,0.15);
      border: 2px solid rgba(16,185,129,0.3); border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 2rem; margin: 0 auto 20px;
      animation: successPop 0.5s cubic-bezier(0.16,1,0.3,1);
    }
    .success-title {
      font-family: 'Sora', sans-serif; font-size: 1.6rem; font-weight: 800;
      margin-bottom: 8px; color: var(--success);
    }
    .success-text { color: var(--text-muted); font-size: 0.95rem; line-height: 1.6; margin-bottom: 24px; }
    .success-detail {
      background: rgba(255,255,255,0.04); border: 1px solid var(--border);
      border-radius: 14px; padding: 16px 20px; text-align: left;
      font-size: 0.87rem; color: rgba(255,255,255,0.7); line-height: 1.8;
    }
    .success-detail strong { color: #fff; }

    /* ── CONFETTI ── */
    .confetti-piece {
      position: fixed; border-radius: 2px; z-index: 9998; pointer-events: none;
      animation: confettiFall 3s ease-out forwards;
    }

    /* ── BADGE ── */
    .badge {
      position: fixed; bottom: 18px; right: 18px;
      background: rgba(255,255,255,0.06); backdrop-filter: blur(12px);
      padding: 7px 14px; border-radius: 100px; font-size: 11px; font-weight: 600;
      color: rgba(255,255,255,0.35); border: 1px solid rgba(255,255,255,0.07);
      display: flex; align-items: center; gap: 5px; z-index: 9999;
    }

    /* ── ANIMATIONS ── */
    @keyframes cardIn { from { opacity: 0; transform: translateY(28px) scale(0.97); } to { opacity: 1; transform: none; } }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes successPop { 0% { transform: scale(0.5); opacity: 0; } 70% { transform: scale(1.1); } 100% { transform: scale(1); opacity: 1; } }
    @keyframes confettiFall { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(100vh) rotate(720deg); opacity: 0; } }

    /* ── LIGHT THEME ── */
    body.theme-light { background: #f1f5f9; color: #0f172a; }
    body.theme-light::before { display: none; }
    body.theme-light .card { background: #fff; border-color: #e2e8f0; box-shadow: 0 20px 40px rgba(0,0,0,0.06); }
    body.theme-light .view-title { background: none; -webkit-text-fill-color: #0f172a; }
    body.theme-light .view-sub { color: #64748b; }
    body.theme-light .form-group label { color: #64748b; }
    body.theme-light .form-group input, body.theme-light .form-group textarea, body.theme-light .form-group select { background: #f8fafc; border-color: #cbd5e1; color: #0f172a; }
    body.theme-light .form-group input::placeholder { color: #94a3b8; }
    body.theme-light .cal-day { color: #334155; }
    body.theme-light .cal-day.disabled { color: #cbd5e1; }
    body.theme-light .slot-btn { background: #f8fafc; border-color: #e2e8f0; color: #334155; }
    body.theme-light .cal-nav { background: #f1f5f9; border-color: #e2e8f0; color: #334155; }
    body.theme-light .btn-back { color: #94a3b8; }
    body.theme-light .btn-back:hover { color: #334155; }
    body.theme-light .success-detail { background: #f8fafc; border-color: #e2e8f0; color: #64748b; }
    body.theme-light .success-detail strong { color: #0f172a; }
    body.theme-light .badge { background: #fff; color: #94a3b8; border-color: #e2e8f0; }

    /* ── RESPONSIVE ── */
    @media (max-width: 520px) {
      .card { padding: 32px 20px; border-radius: 20px; }
      .slots-grid { grid-template-columns: repeat(2,1fr); }
    }
  </style>
</head>
<body class="theme-${funnel.theme || 'dark'}">
  <div class="card">
    <!-- Steps indicator -->
    <div class="steps">
      <div class="step-dot active" id="dot1"></div>
      <div class="step-dot" id="dot2"></div>
      <div class="step-dot" id="dot3"></div>
    </div>

    <!-- VIEW 1: Formulario -->
    <div class="view active" id="view-form">
      <div class="view-header">
        <div class="view-emoji">🎯</div>
        <h1 class="view-title">¡Estás a un paso!</h1>
        <p class="view-sub">Completa tus datos para agendar tu cita</p>
      </div>
      <div id="errorBox" class="error-box"></div>
      <form id="leadForm" novalidate>
        ${fieldsHTML}
        <button type="submit" class="btn-primary" id="submitBtn">
          Continuar <span>→</span>
        </button>
      </form>
    </div>

    <!-- VIEW 2: Calendario -->
    <div class="view" id="view-calendar">
      <button class="btn-back" id="backToForm">← Volver</button>
      <div class="view-header">
        <div class="view-emoji">📅</div>
        <h1 class="view-title">Elige tu fecha</h1>
        <p class="view-sub">Selecciona el día y horario disponible</p>
      </div>

      <div class="calendar-header">
        <button class="cal-nav" id="prevMonth">‹</button>
        <span class="cal-month" id="calMonth">Junio 2026</span>
        <button class="cal-nav" id="nextMonth">›</button>
      </div>
      <div class="cal-grid" id="calGrid"></div>

      <div id="slotsContainer"></div>

      <div class="selection-summary" id="selectionSummary">
        <span style="display:inline-block; vertical-align:-3px; margin-right:4px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
        </span>
        <span id="summaryText"></span>
      </div>

      <button class="btn-primary" id="confirmBtn" disabled style="opacity:0.4">
        Confirmar cita →
      </button>
    </div>

    <!-- VIEW 3: Confirmación -->
    <div class="view" id="view-success">
      <div class="success-view">
        <div class="success-icon" style="color: var(--success); background: rgba(16, 185, 129, 0.1); border-radius: 50%; width: 72px; height: 72px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        <h2 class="success-title">¡Cita confirmada!</h2>
        <p class="success-text">Tu cita ha sido agendada exitosamente. Te enviaremos un recordatorio.</p>
        <div class="success-detail" id="successDetail"></div>
      </div>
    </div>
  </div>

  <script>
  (function() {
    var FUNNEL_ID = '${funnel.id}';
    var SUB_ID = '${funnel.sub_id || ""}';
    var FIELDS = ${JSON.stringify(parsedFields)};
    var COLORS = ['#7c3aed','#a78bfa','#34d399','#f59e0b','#ec4899','#3b82f6'];
    var clientId = null;
    var selectedDate = null;
    var selectedSlot = null;
    var currentYear, currentMonth;

    // ── DOM refs ──
    var form = document.getElementById('leadForm');
    var submitBtn = document.getElementById('submitBtn');
    var errorBox = document.getElementById('errorBox');
    var dot1 = document.getElementById('dot1');
    var dot2 = document.getElementById('dot2');
    var dot3 = document.getElementById('dot3');
    // ── Init calendar with current month ──
    var now = new Date();
    currentYear = now.getFullYear();
    currentMonth = now.getMonth();
    renderCalendar();

    // ── Navigation ──
    document.getElementById('prevMonth').addEventListener('click', function() {
      currentMonth--;
      if (currentMonth < 0) { currentMonth = 11; currentYear--; }
      renderCalendar();
    });
    document.getElementById('nextMonth').addEventListener('click', function() {
      currentMonth++;
      if (currentMonth > 11) { currentMonth = 0; currentYear++; }
      renderCalendar();
    });
    document.getElementById('backToForm').addEventListener('click', function() {
      showView('form');
    });
    document.getElementById('confirmBtn').addEventListener('click', confirmAppointment);

    // ── Show view ──
    function showView(name) {
      document.querySelectorAll('.view').forEach(function(v) { v.classList.remove('active'); });
      document.getElementById('view-' + name).classList.add('active');
      dot1.className = 'step-dot' + (name === 'form' ? ' active' : ' done');
      dot2.className = 'step-dot' + (name === 'calendar' ? ' active' : name === 'success' ? ' done' : '');
      dot3.className = 'step-dot' + (name === 'success' ? ' active' : '');
    }

    // ── Calendar render ──
    function renderCalendar() {
      var months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
      document.getElementById('calMonth').textContent = months[currentMonth] + ' ' + currentYear;
      var grid = document.getElementById('calGrid');
      grid.innerHTML = '';
      var days = ['LU','MA','MI','JU','VI','SÁ','DO'];
      days.forEach(function(d) {
        var el = document.createElement('div');
        el.className = 'cal-day-label'; el.textContent = d;
        grid.appendChild(el);
      });
      var firstDay = new Date(currentYear, currentMonth, 1).getDay();
      var daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      firstDay = (firstDay + 6) % 7; // Monday first
      for (var i = 0; i < firstDay; i++) {
        var empty = document.createElement('div'); empty.className = 'cal-day empty'; grid.appendChild(empty);
      }
      var today = new Date(); today.setHours(0,0,0,0);
      for (var d = 1; d <= daysInMonth; d++) {
        var dayEl = document.createElement('div');
        dayEl.className = 'cal-day';
        dayEl.textContent = d;
        var thisDate = new Date(currentYear, currentMonth, d);
        thisDate.setHours(0,0,0,0);
        if (thisDate < today) {
          dayEl.classList.add('disabled');
        } else {
          var dateStr = formatDate(currentYear, currentMonth + 1, d);
          if (thisDate.toDateString() === today.toDateString()) dayEl.classList.add('today');
          if (selectedDate === dateStr) dayEl.classList.add('selected');
          (function(ds, el) {
            el.addEventListener('click', function() { selectDate(ds); });
          })(dateStr, dayEl);
        }
        grid.appendChild(dayEl);
      }
    }

    function formatDate(y, m, d) {
      return y + '-' + String(m).padStart(2,'0') + '-' + String(d).padStart(2,'0');
    }

    // ── Select date ──
    function selectDate(dateStr) {
      selectedDate = dateStr;
      selectedSlot = null;
      document.getElementById('selectionSummary').classList.remove('show');
      document.getElementById('confirmBtn').disabled = true;
      document.getElementById('confirmBtn').style.opacity = '0.4';
      renderCalendar();
      loadSlots(dateStr);
    }

    // ── Load slots ──
    function loadSlots(dateStr) {
      var container = document.getElementById('slotsContainer');
      container.innerHTML = '<div class="slots-loading"><div class="spinner"></div>Cargando horarios...</div>';
      fetch('/api/crm/availability?date=' + dateStr + '&sub_id=' + SUB_ID)
        .then(function(r) { return r.json(); })
        .then(function(data) {
          var slots = data.slots || [];
          slots = slots.filter(function(s) { return s.available > 0; });
          if (slots.length === 0) {
            container.innerHTML = '<div class="slots-empty">😔 No hay horarios disponibles para este día.<br>Por favor elige otra fecha.</div>';
            return;
          }
          renderSlots(slots);
        })
        .catch(function() {
          container.innerHTML = '<div class="slots-empty">⚠️ Error cargando horarios. Intenta de nuevo.</div>';
        });
    }

    // ── Render slots grouped by morning/afternoon ──
    function renderSlots(slots) {
      var morning = slots.filter(function(s) { return parseInt(s.startTime) < 12; });
      var afternoon = slots.filter(function(s) { return parseInt(s.startTime) >= 12; });
      var html = '';
      if (morning.length > 0) {
        html += '<div class="slots-section"><div class="slots-section-title">☀️ Por la mañana</div><div class="slots-grid">';
        morning.forEach(function(s) { html += slotBtn(s); });
        html += '</div></div>';
      }
      if (afternoon.length > 0) {
        html += '<div class="slots-section"><div class="slots-section-title">🌅 Por la tarde</div><div class="slots-grid">';
        afternoon.forEach(function(s) { html += slotBtn(s); });
        html += '</div></div>';
      }
      document.getElementById('slotsContainer').innerHTML = html;
      document.querySelectorAll('.slot-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var sd = btn.dataset.startDate;
          var st = btn.dataset.startTime;
          selectSlot(sd, st, btn);
        });
      });
    }

    function slotBtn(s) {
      var full = s.available === 0;
      return '<button class="slot-btn' + (full ? ' full' : '') + '" data-start-date="' + s.startDate + '" data-start-time="' + s.startTime + '"' + (full ? ' disabled' : '') + '>' + s.startTime + '</button>';
    }

    // ── Select slot ──
    function selectSlot(startDate, startTime, el) {
      selectedSlot = { startDate: startDate, startTime: startTime };
      document.querySelectorAll('.slot-btn').forEach(function(b) { b.classList.remove('selected'); });
      el.classList.add('selected');
      var summary = document.getElementById('selectionSummary');
      var parts = selectedDate.split('-');
      var dateObj = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]));
      var days = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
      var months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
      document.getElementById('summaryText').innerHTML = '<strong>' + days[dateObj.getDay()] + ' ' + dateObj.getDate() + ' de ' + months[dateObj.getMonth()] + '</strong> a las <strong>' + startTime + '</strong>';
      summary.classList.add('show');
      var btn = document.getElementById('confirmBtn');
      btn.disabled = false;
      btn.style.opacity = '1';
    }

    // ── Confetti ──
    function launchConfetti() {
      for (var i = 0; i < 55; i++) {
        var piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.left = Math.random() * 100 + 'vw';
        piece.style.top = '-10px';
        piece.style.background = COLORS[Math.floor(Math.random() * COLORS.length)];
        piece.style.width = (5 + Math.random() * 7) + 'px';
        piece.style.height = (5 + Math.random() * 7) + 'px';
        piece.style.animationDuration = (2 + Math.random() * 2) + 's';
        piece.style.animationDelay = (Math.random() * 0.6) + 's';
        document.body.appendChild(piece);
        setTimeout(function(el) { el.remove(); }, 5000, piece);
      }
    }

    // ── Confirm appointment ──
    function confirmAppointment() {
      if (!clientId || !selectedSlot) return;
      var btn = document.getElementById('confirmBtn');
      btn.disabled = true; btn.textContent = 'Confirmando...';
      fetch('/api/crm/appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          clientId: clientId, 
          date: selectedSlot.startDate,
          funnelId: FUNNEL_ID,
          sub_id: SUB_ID
        })
      })
      .then(function(r) { return r.json(); })
      .then(function() {
        var parts = selectedDate.split('-');
        var dateObj = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]));
        var days = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
        var months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
        var timeParts = selectedSlot.startTime.split(':');
        var hours = parseInt(timeParts[0], 10);
        var minutes = timeParts[1];
        var ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; 
        var formattedTime = hours + ':' + minutes + ' ' + ampm;

        var calIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:-3px; margin-right:4px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>';
        var clockIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:-3px; margin-right:4px;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>';
        var checkIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:-3px; margin-right:4px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';

        document.getElementById('successDetail').innerHTML =
          '<div style="margin-bottom:8px;">' + calIcon + ' <strong>' + days[dateObj.getDay()] + ', ' + dateObj.getDate() + ' de ' + months[dateObj.getMonth()] + ' ' + parts[0] + '</strong></div>' +
          '<div style="margin-bottom:8px;">' + clockIcon + ' <strong>' + formattedTime + '</strong></div>' +
          '<div>' + checkIcon + ' Estado: <strong>Confirmada</strong></div>';
        showView('success');
        launchConfetti();
      })
      .catch(function() {
        btn.disabled = false; btn.textContent = 'Confirmar cita →';
        alert('Error al confirmar la cita. Intenta de nuevo.');
      });
    }

    // ── Form submit ──
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      errorBox.classList.remove('show');
      var data = {};
      var missing = [];
      var invalidEmails = [];
      FIELDS.forEach(function(f) {
        var el = document.getElementById('field_' + f.name);
        var val = el ? el.value.trim() : '';

        var isPhone = f.type === 'tel' || f.name.toLowerCase().includes('telefono') || f.name.toLowerCase().includes('phone');
        if (isPhone && val) {
          var codeEl = document.getElementById('field_' + f.name + '_code');
          var code = codeEl ? codeEl.value : '';
          // Concatenar indicativo + número, limpiando espacios y el + del número si ya lo tiene
          var rawNum = val.replace(/\D/g, '');
          val = code ? code.replace('+','') + rawNum : rawNum;
        }

        data[f.name] = val;
        if (f.required && !val) {
          missing.push(f.label);
        } else if (val && (f.type === 'email' || f.name.includes('correo') || f.name.includes('email'))) {
          // Validar que tenga formato de correo básico
          if (val.indexOf('@') === -1 || val.indexOf('.') === -1) {
            invalidEmails.push(f.label);
          }
        }
      });
      if (missing.length > 0) {
        errorBox.textContent = 'Completa los campos requeridos: ' + missing.join(', ');
        errorBox.classList.add('show'); return;
      }
      if (invalidEmails.length > 0) {
        errorBox.textContent = 'Ingresa un correo electrónico válido (con @) en: ' + invalidEmails.join(', ');
        errorBox.classList.add('show'); return;
      }
      submitBtn.disabled = true; submitBtn.textContent = 'Enviando...';
      fetch('/api/funnels/' + FUNNEL_ID + '/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: data, sub_id: SUB_ID })
      })
      .then(function(r) {
        if (!r.ok) return r.json().then(function(b) { throw new Error(b.error || 'Error al enviar'); });
        return r.json();
      })
      .then(function(res) {
        clientId = res.lead && res.lead.id ? res.lead.id : null;
        showView('calendar');
      })
      .catch(function(err) {
        errorBox.textContent = err.message || 'Error inesperado.';
        errorBox.classList.add('show');
        submitBtn.disabled = false; submitBtn.textContent = 'Continuar →';
      });
    });

  })();
  </script>
</body>
</html>`;
}

function escapeHtml(text) {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

module.exports = { renderFunnelLanding, renderFunnelForm };