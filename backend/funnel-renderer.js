/**
 * funnel-renderer.js — Generador de HTML para Video Funnels
 * Exporta dos funciones: renderFunnelLanding y renderFunnelForm
 * Genera páginas auto-contenidas con diseño premium y tracking de video.
 */

// ── RENDERIZAR LANDING DE VIDEO ────────────────────────────────────────────
/**
 * Genera la página de aterrizaje del funnel con:
 * - Reproductor de video (YouTube / Vimeo / MP4)
 * - Barra de progreso animada
 * - Botón CTA bloqueado hasta alcanzar el umbral de visualización
 * - Anti-trampas: rastrea segmentos realmente vistos
 * - Diseño oscuro con glassmorphism, gradientes y micro-animaciones
 */
function renderFunnelLanding(funnel) {
  const threshold = funnel.video_threshold || 90;
  const ctaText = funnel.cta_text || "¡Quiero acceder!";
  const formUrl = `/f/${funnel.public_slug}/form`;

  // ── Bloque del reproductor según tipo ──
  let playerHTML = "";
  let playerJS = "";

  let vType = funnel.video_type || 'youtube';
  if (funnel.video_url.match(/(youtube\.com|youtu\.be)/i)) vType = 'youtube';
  else if (funnel.video_url.match(/vimeo\.com/i)) vType = 'vimeo';

  if (vType === "youtube") {
    // Extraer ID del video de YouTube
    playerHTML = `
      <div class="video-wrapper">
        <div id="yt-player"></div>
      </div>`;
    playerJS = `
      // --- YouTube IFrame API ---
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
            onReady: function(e) {
              ytDuration = e.target.getDuration();
            },
            onStateChange: function(e) {
              if (e.data === YT.PlayerState.PLAYING) {
                ytInterval = setInterval(function() {
                  var t = ytPlayer.getCurrentTime();
                  trackSegment(t);
                  updateProgress(t, ytDuration);
                }, 500);
              } else {
                clearInterval(ytInterval);
              }
            }
          }
        });
      }`;
  } else if (funnel.video_type === "vimeo") {
    // Extraer ID del video de Vimeo
    playerHTML = `
      <div class="video-wrapper">
        <iframe id="vimeo-player" src="https://player.vimeo.com/video/${funnel.video_url.match(/vimeo\.com\/(\d+)/)?.[1] || funnel.video_url}"
                frameborder="0" allow="autoplay; fullscreen" allowfullscreen
                style="width:100%;height:100%;position:absolute;top:0;left:0;"></iframe>
      </div>`;
    playerJS = `
      // --- Vimeo Player API ---
      var vScript = document.createElement('script');
      vScript.src = 'https://player.vimeo.com/api/player.js';
      vScript.onload = function() {
        var vPlayer = new Vimeo.Player(document.getElementById('vimeo-player'));
        var vDuration = 0;
        vPlayer.getDuration().then(function(d) { vDuration = d; });
        vPlayer.on('timeupdate', function(data) {
          trackSegment(data.seconds);
          updateProgress(data.seconds, vDuration);
        });
      };
      document.head.appendChild(vScript);`;
  } else {
    // MP4 nativo
    playerHTML = `
      <div class="video-wrapper">
        <video id="mp4-player" preload="metadata" playsinline controls>
          <source src="${funnel.video_url}" type="video/mp4">
          Tu navegador no soporta video HTML5.
        </video>
      </div>`;
    playerJS = `
      // --- HTML5 Video ---
      var vid = document.getElementById('mp4-player');
      vid.addEventListener('timeupdate', function() {
        trackSegment(vid.currentTime);
        updateProgress(vid.currentTime, vid.duration || 1);
      });`;
  }

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(funnel.title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    /* ── Reset y base ── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      ${funnel.bg_image ? `background: url('${funnel.bg_image}') no-repeat center center fixed; background-size: cover;` : (funnel.bg_color ? `background: ${funnel.bg_color};` : `background: linear-gradient(165deg, #0a0a1a 0%, #0d0d2b 30%, #1a1a2e 60%, #16213e 100%);`)}
      min-height: 100vh;
      color: ${funnel.bg_image || funnel.bg_color || funnel.theme === 'dark' ? '#fff' : '#1e293b'};
      overflow-x: hidden;
    }

    /* ── Partículas de fondo decorativas / Overlay ── */
    body::before {
      content: '';
      position: fixed; top: 0; left: 0;
      width: 100%; height: 100%;
      ${funnel.bg_image ? 
        `background: rgba(0,0,0,0.6);` : 
        `background:
          radial-gradient(2px 2px at 20% 30%, rgba(139,92,246,0.3), transparent),
          radial-gradient(2px 2px at 80% 20%, rgba(59,130,246,0.2), transparent),
          radial-gradient(2px 2px at 40% 70%, rgba(236,72,153,0.15), transparent),
          radial-gradient(3px 3px at 60% 80%, rgba(139,92,246,0.2), transparent),
          radial-gradient(2px 2px at 10% 90%, rgba(59,130,246,0.15), transparent),
          radial-gradient(2px 2px at 90% 60%, rgba(236,72,153,0.2), transparent);`
      }
      pointer-events: none;
      z-index: 0;
    }

    /* ── Contenedor principal ── */
    .funnel-container {
      position: relative;
      z-index: 1;
      max-width: 820px;
      margin: 0 auto;
      padding: 40px 20px 60px;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
      justify-content: center;
    }

    /* ── Título ── */
    .funnel-title {
      font-size: clamp(2rem, 5.5vw, 3.4rem);
      font-weight: 900;
      text-align: center;
      line-height: 1.15;
      margin-bottom: 14px;
      letter-spacing: -0.02em;
      background: linear-gradient(135deg, #ffffff 0%, #e0e7ff 50%, #c4b5fd 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: titleIn 0.8s ease-out;
    }

    /* ── Subtítulo / Highlight ── */
    .funnel-highlight {
      font-size: clamp(1rem, 2.5vw, 1.25rem);
      text-align: center;
      margin-bottom: 36px;
      max-width: 600px;
      line-height: 1.6;
      font-weight: 500;
      background: linear-gradient(90deg, #a78bfa, #818cf8, #6366f1);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: fadeUp 1s ease-out 0.2s both;
    }

    /* ── Card glassmorphism del video ── */
    .video-card {
      width: 100%;
      background: rgba(255,255,255,0.04);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 20px;
      padding: 16px;
      box-shadow:
        0 25px 50px rgba(0,0,0,0.4),
        0 0 80px rgba(139,92,246,0.08),
        inset 0 1px 0 rgba(255,255,255,0.06);
      animation: fadeUp 0.8s ease-out 0.3s both;
    }

    .video-wrapper {
      position: relative;
      width: 100%;
      padding-bottom: 56.25%; /* 16:9 */
      border-radius: 12px;
      overflow: hidden;
      background: #000;
    }
    .video-wrapper iframe,
    .video-wrapper video {
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      border: none;
      border-radius: 12px;
    }

    /* ── Barra de progreso ── */
    .progress-container {
      width: 100%;
      margin-top: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .progress-bar-bg {
      flex: 1;
      height: 6px;
      background: rgba(255,255,255,0.08);
      border-radius: 10px;
      overflow: hidden;
      position: relative;
    }
    .progress-bar-fill {
      height: 100%;
      width: 0%;
      border-radius: 10px;
      background: linear-gradient(90deg, #7c3aed, #8b5cf6, #a78bfa);
      transition: width 0.4s ease;
      position: relative;
    }
    .progress-bar-fill::after {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
      animation: shimmer 2s infinite;
    }
    .progress-text {
      font-size: 13px;
      font-weight: 700;
      color: rgba(255,255,255,0.5);
      min-width: 42px;
      text-align: right;
      font-variant-numeric: tabular-nums;
    }

    /* ── Botón CTA ── */
    .cta-area {
      width: 100%;
      margin-top: 32px;
      display: flex;
      justify-content: center;
      animation: fadeUp 1s ease-out 0.5s both;
    }

    .cta-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 18px 48px;
      font-size: 1.1rem;
      font-weight: 700;
      font-family: 'Inter', sans-serif;
      border: none;
      border-radius: 16px;
      cursor: not-allowed;
      text-decoration: none;
      transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      letter-spacing: 0.01em;

      /* Estado bloqueado */
      background: rgba(255,255,255,0.06);
      color: rgba(255,255,255,0.35);
      border: 1px solid rgba(255,255,255,0.08);
    }

    .cta-btn.unlocked {
      display: inline-flex;
      background: ${funnel.cta_color || '#6366f1'};
      color: #fff;
      border-color: transparent;
      box-shadow:
        0 10px 40px rgba(16,185,129,0.35),
        0 0 60px rgba(16,185,129,0.15),
        inset 0 1px 0 rgba(255,255,255,0.2);
      transform: scale(1);
      animation: unlockPulse 0.6s ease-out, ctaGlow 3s ease-in-out infinite 0.6s;
    }
    .cta-btn.unlocked:hover {
      transform: scale(1.04) translateY(-2px);
      box-shadow:
        0 16px 50px rgba(16,185,129,0.45),
        0 0 80px rgba(16,185,129,0.2),
        inset 0 1px 0 rgba(255,255,255,0.2);
    }
    .cta-btn.unlocked::before {
      content: '';
      position: absolute;
      top: -2px; left: -2px; right: -2px; bottom: -2px;
      background: linear-gradient(135deg, #059669, #10b981, #34d399, #6ee7b7);
      border-radius: 18px;
      z-index: -1;
      filter: blur(12px);
      opacity: 0.4;
    }

    /* ── Badge Powered By ── */
    .powered-badge {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(255,255,255,0.07);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      padding: 8px 16px;
      border-radius: 50px;
      font-size: 12px;
      font-weight: 600;
      color: rgba(255,255,255,0.5);
      border: 1px solid rgba(255,255,255,0.08);
      display: flex;
      align-items: center;
      gap: 6px;
      z-index: 9999;
      transition: opacity 0.3s;
    }
    .powered-badge:hover { color: rgba(255,255,255,0.8); }

    /* ── Animaciones ── */
    @keyframes titleIn {
      from { opacity: 0; transform: translateY(-20px) scale(0.96); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(24px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(200%); }
    }
    @keyframes unlockPulse {
      0% { transform: scale(0.92); opacity: 0.7; }
      50% { transform: scale(1.06); }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes ctaGlow {
      0%, 100% { box-shadow: 0 10px 40px rgba(16,185,129,0.35), 0 0 60px rgba(16,185,129,0.15); }
      50% { box-shadow: 0 10px 50px rgba(16,185,129,0.5), 0 0 80px rgba(16,185,129,0.25); }
    }

    /* ── Tema Light (Sobrescrituras) ── */
    body.theme-light { background: #f8fafc; color: #0f172a; }
    body.theme-light::before { display: none; }
    body.theme-light .funnel-title { background: none; -webkit-text-fill-color: #0f172a; }
    body.theme-light .funnel-highlight { background: none; -webkit-text-fill-color: #475569; }
    body.theme-light .video-card { background: #fff; border: 1px solid #e2e8f0; box-shadow: 0 20px 40px rgba(0,0,0,0.05); }
    body.theme-light .progress-bar-bg { background: #e2e8f0; }
    body.theme-light .progress-text { color: #64748b; }
    body.theme-light .cta-btn { background: #f1f5f9; color: #94a3b8; border-color: #e2e8f0; }
    body.theme-light .cta-btn.unlocked { background: linear-gradient(135deg, #059669, #10b981); color: #fff; box-shadow: 0 10px 25px rgba(16,185,129,0.2); border-color: transparent; }
    body.theme-light .cta-btn.unlocked::before { display: none; }
    body.theme-light .powered-badge { background: #fff; color: #64748b; border-color: #e2e8f0; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }

    /* ── Responsivo ── */
    @media (max-width: 640px) {
      .funnel-container { padding: 24px 16px 48px; }
      .video-card { padding: 10px; border-radius: 14px; }
      .cta-btn { padding: 16px 32px; font-size: 1rem; width: 100%; }
      .powered-badge { bottom: 12px; right: 12px; font-size: 11px; }
    }
  </style>
</head>
<body class="theme-${funnel.theme || 'dark'}">
  <div class="funnel-container">
    <h1 class="funnel-title">${escapeHtml(funnel.title)}</h1>
    ${funnel.highlight_text ? `<p class="funnel-highlight">${escapeHtml(funnel.highlight_text)}</p>` : ""}

    <div class="video-card">
      ${playerHTML}
      <div class="progress-container">
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" id="progressFill"></div>
        </div>
        <span class="progress-text" id="progressText">0%</span>
      </div>
    </div>

    <div class="cta-area">
      <a id="ctaBtn" class="cta-btn" href="javascript:void(0)">
        <span id="ctaIcon">🔒</span>
        <span id="ctaLabel" style="font-size: 0.9em; font-weight: 500;">${funnel.locked_btn_text || 'Ver el video para desbloquear el beneficio'}</span>
      </a>
    </div>
  </div>

  <div class="powered-badge">
    <span>🚀</span> Powered by <strong>Nuestra Plataforma</strong>
  </div>

  <script>
    (function() {
      // ── Configuración ──
      var THRESHOLD = ${threshold};
      var CTA_TEXT = ${JSON.stringify(ctaText)};
      var FORM_URL = ${JSON.stringify(formUrl)};
      var STORAGE_KEY = 'funnel_unlocked_${funnel.id}';

      // ── Elementos DOM ──
      var progressFill = document.getElementById('progressFill');
      var progressText = document.getElementById('progressText');
      var ctaBtn = document.getElementById('ctaBtn');
      var ctaIcon = document.getElementById('ctaIcon');
      var ctaLabel = document.getElementById('ctaLabel');

      // ── Anti-trampas: rastrear segmentos vistos ──
      var watchedSegments = new Set();
      var totalSegments = 100; // Dividimos el video en 100 partes

      function trackSegment(currentTime, duration) {
        if (!duration || duration <= 0) return;
        var segment = Math.floor((currentTime / duration) * totalSegments);
        if (segment >= 0 && segment < totalSegments) {
          watchedSegments.add(segment);
        }
      }

      // ── Calcular porcentaje real visto ──
      function getRealPercentage() {
        return Math.min(100, Math.round((watchedSegments.size / totalSegments) * 100));
      }

      // ── Actualizar barra de progreso ──
      function updateProgress(currentTime, duration) {
        if (!duration || duration <= 0) return;
        trackSegment(currentTime, duration);
        var pct = getRealPercentage();
        progressFill.style.width = pct + '%';
        progressText.textContent = pct + '%';

        // Cambiar color de la barra al acercarse al umbral
        if (pct >= THRESHOLD) {
          progressFill.style.background = 'linear-gradient(90deg, #059669, #10b981, #34d399)';
          unlockCTA();
        } else if (pct >= THRESHOLD * 0.7) {
          progressFill.style.background = 'linear-gradient(90deg, #7c3aed, #8b5cf6, #f59e0b)';
        }
      }

      // ── Desbloquear botón CTA ──
      var isUnlocked = false;
      function unlockCTA() {
        if (isUnlocked) return;
        isUnlocked = true;
        ctaBtn.classList.add('unlocked');
        ctaIcon.textContent = '✅';
        ctaLabel.textContent = CTA_TEXT;
        ctaBtn.href = FORM_URL;
        ctaBtn.style.cursor = 'pointer';
        // Guardar estado en sessionStorage
        try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch(e) {}
      }

      // ── Restaurar estado si ya desbloqueó antes ──
      try {
        if (sessionStorage.getItem(STORAGE_KEY) === '1') {
          unlockCTA();
          progressFill.style.width = '100%';
          progressText.textContent = '100%';
          progressFill.style.background = 'linear-gradient(90deg, #059669, #10b981, #34d399)';
        }
      } catch(e) {}

      // ── Lógica del reproductor específico ──
      ${playerJS}
    })();
  </script>
</body>
</html>`;
}

// ── RENDERIZAR FORMULARIO ──────────────────────────────────────────────────
/**
 * Genera la página del formulario del funnel con:
 * - Diseño glassmorphism premium
 * - Campos configurables según form_fields del funnel
 * - Envío por fetch con animación de confetti al éxito
 * - Validación de campos requeridos
 */
function renderFunnelForm(funnel) {
  let parsedFields = funnel.form_fields || [];
  if (typeof parsedFields === 'string') parsedFields = JSON.parse(parsedFields);
  if (typeof parsedFields === 'string') parsedFields = JSON.parse(parsedFields); // Fallback double stringify

  const fieldsHTML = parsedFields.map((f) => {
    const required = f.required ? 'required' : '';
    const requiredStar = f.required ? '<span class="req">*</span>' : '';

    if (f.type === "textarea") {
      return `
        <div class="form-group">
          <label for="field_${f.name}">${escapeHtml(f.label)} ${requiredStar}</label>
          <textarea id="field_${f.name}" name="${escapeHtml(f.name)}" rows="3"
                    placeholder="${escapeHtml(f.label)}" ${required}></textarea>
        </div>`;
    } else if (f.type === "select") {
      return `
        <div class="form-group">
          <label for="field_${f.name}">${escapeHtml(f.label)} ${requiredStar}</label>
          <select id="field_${f.name}" name="${escapeHtml(f.name)}" ${required}>
            <option value="">Selecciona una opción...</option>
            <option value="opcion1">Opción 1</option>
            <option value="opcion2">Opción 2</option>
            <option value="opcion3">Opción 3</option>
          </select>
        </div>`;
    }
    return `
      <div class="form-group">
        <label for="field_${f.name}">${escapeHtml(f.label)} ${requiredStar}</label>
        <input type="${f.type || 'text'}" id="field_${f.name}" name="${escapeHtml(f.name)}"
               placeholder="${escapeHtml(f.label)}" ${required} />
      </div>`;
  }).join("\n");

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(funnel.title)} — Formulario</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      ${funnel.bg_image ? `background: url('${funnel.bg_image}') no-repeat center center fixed; background-size: cover;` : (funnel.bg_color ? `background: ${funnel.bg_color};` : `background: linear-gradient(165deg, #0a0a1a 0%, #0d0d2b 30%, #1a1a2e 60%, #16213e 100%);`)}
      min-height: 100vh;
      color: ${funnel.bg_image || funnel.bg_color || funnel.theme === 'dark' ? '#fff' : '#1e293b'};
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      overflow-x: hidden;
    }

    /* Partículas decorativas / Overlay */
    body::before {
      content: '';
      position: fixed; top: 0; left: 0;
      width: 100%; height: 100%;
      ${funnel.bg_image ? 
        `background: rgba(0,0,0,0.6);` : 
        `background:
          radial-gradient(2px 2px at 20% 30%, rgba(139,92,246,0.3), transparent),
          radial-gradient(2px 2px at 80% 20%, rgba(59,130,246,0.2), transparent),
          radial-gradient(2px 2px at 40% 70%, rgba(236,72,153,0.15), transparent),
          radial-gradient(3px 3px at 60% 80%, rgba(139,92,246,0.2), transparent);`
      }
      pointer-events: none;
      z-index: 0;
    }

    /* ── Card del formulario con glassmorphism ── */
    .form-card {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 520px;
      background: rgba(255,255,255,0.05);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 24px;
      padding: 48px 40px;
      box-shadow:
        0 30px 60px rgba(0,0,0,0.5),
        0 0 100px rgba(139,92,246,0.06),
        inset 0 1px 0 rgba(255,255,255,0.08);
      animation: cardIn 0.7s ease-out;
    }

    /* ── Encabezado ── */
    .form-emoji {
      font-size: 3rem;
      text-align: center;
      margin-bottom: 8px;
      animation: bounce 1s ease-in-out;
    }
    .form-title {
      font-size: clamp(1.5rem, 4vw, 2rem);
      font-weight: 800;
      text-align: center;
      margin-bottom: 6px;
      background: linear-gradient(135deg, #fff 0%, #e0e7ff 50%, #c4b5fd 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .form-subtitle {
      text-align: center;
      color: rgba(255,255,255,0.5);
      font-size: 0.95rem;
      margin-bottom: 32px;
      font-weight: 500;
    }

    /* ── Campos del formulario ── */
    .form-group {
      margin-bottom: 20px;
    }
    .form-group label {
      display: block;
      font-size: 0.85rem;
      font-weight: 600;
      color: rgba(255,255,255,0.7);
      margin-bottom: 8px;
      letter-spacing: 0.02em;
    }
    .req { color: #f87171; margin-left: 2px; }

    .form-group input,
    .form-group textarea,
    .form-group select {
      width: 100%;
      padding: 14px 18px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px;
      color: #fff;
      font-family: 'Inter', sans-serif;
      font-size: 0.95rem;
      font-weight: 500;
      outline: none;
      transition: all 0.3s ease;
    }
    .form-group select option { background: #1e293b; color: #fff; }
    .form-group input::placeholder,
    .form-group textarea::placeholder {
      color: rgba(255,255,255,0.25);
    }
    .form-group input:focus,
    .form-group textarea:focus,
    .form-group select:focus {
      border-color: rgba(139,92,246,0.6);
      background: rgba(255,255,255,0.08);
      box-shadow: 0 0 0 3px rgba(139,92,246,0.15), 0 0 20px rgba(139,92,246,0.08);
    }
    .form-group textarea {
      resize: vertical;
      min-height: 80px;
    }

    /* ── Botón de envío ── */
    .submit-btn {
      width: 100%;
      padding: 16px;
      font-size: 1.05rem;
      font-weight: 700;
      font-family: 'Inter', sans-serif;
      border: none;
      border-radius: 14px;
      cursor: pointer;
      background: ${funnel.cta_color || 'linear-gradient(135deg, #7c3aed, #8b5cf6, #a78bfa)'};
      color: #fff;
      margin-top: 8px;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
      letter-spacing: 0.01em;
      box-shadow: 0 8px 30px rgba(124,58,237,0.3);
    }
    .submit-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 40px rgba(124,58,237,0.45);
    }
    .submit-btn:active {
      transform: translateY(0);
    }
    .submit-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    /* ── Estado de éxito ── */
    .success-msg {
      display: none;
      text-align: center;
      padding: 40px 20px;
      animation: successIn 0.6s ease-out;
    }
    .success-msg.show { display: block; }
    .success-emoji { font-size: 4rem; margin-bottom: 16px; }
    .success-title {
      font-size: 1.5rem;
      font-weight: 800;
      margin-bottom: 8px;
      background: linear-gradient(135deg, #34d399, #10b981);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .success-text {
      color: rgba(255,255,255,0.6);
      font-size: 1rem;
    }

    /* ── Error ── */
    .error-msg {
      display: none;
      background: rgba(239,68,68,0.15);
      border: 1px solid rgba(239,68,68,0.3);
      border-radius: 10px;
      padding: 12px 16px;
      margin-bottom: 16px;
      font-size: 0.9rem;
      color: #fca5a5;
      text-align: center;
    }
    .error-msg.show { display: block; }

    /* ── Badge ── */
    .powered-badge {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(255,255,255,0.07);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      padding: 8px 16px;
      border-radius: 50px;
      font-size: 12px;
      font-weight: 600;
      color: rgba(255,255,255,0.5);
      border: 1px solid rgba(255,255,255,0.08);
      display: flex;
      align-items: center;
      gap: 6px;
      z-index: 9999;
    }

    /* ── Confetti ── */
    .confetti-piece {
      position: fixed;
      width: 10px;
      height: 10px;
      border-radius: 2px;
      z-index: 9998;
      pointer-events: none;
      animation: confettiFall 3s ease-out forwards;
    }

    /* ── Animaciones ── */
    @keyframes cardIn {
      from { opacity: 0; transform: translateY(30px) scale(0.96); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      30% { transform: translateY(-12px); }
      60% { transform: translateY(-4px); }
    }
    @keyframes successIn {
      from { opacity: 0; transform: scale(0.8); }
      to { opacity: 1; transform: scale(1); }
    }
    @keyframes confettiFall {
      0% { transform: translateY(0) rotate(0deg); opacity: 1; }
      100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
    }

    /* ── Tema Light (Sobrescrituras) Formulario ── */
    body.theme-light { background: #f8fafc; color: #0f172a; }
    body.theme-light::before { display: none; }
    body.theme-light .form-card { background: #fff; border: 1px solid #e2e8f0; box-shadow: 0 20px 40px rgba(0,0,0,0.05); }
    body.theme-light .form-title { background: none; -webkit-text-fill-color: #0f172a; }
    body.theme-light .form-subtitle { color: #475569; }
    body.theme-light .form-group label { color: #475569; }
    body.theme-light .form-group input, body.theme-light .form-group textarea { background: #fff; border: 1px solid #cbd5e1; color: #0f172a; }
    body.theme-light .form-group input::placeholder, body.theme-light .form-group textarea::placeholder { color: #94a3b8; }
    body.theme-light .form-group input:focus, body.theme-light .form-group textarea:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); background: #fff; }
    body.theme-light .powered-badge { background: #fff; color: #64748b; border-color: #e2e8f0; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
    body.theme-light .success-title { background: none; -webkit-text-fill-color: #10b981; }
    body.theme-light .success-text { color: #475569; }

    /* ── Responsivo ── */
    @media (max-width: 640px) {
      .form-card { padding: 32px 24px; border-radius: 18px; }
      .powered-badge { bottom: 12px; right: 12px; font-size: 11px; }
    }
  </style>
</head>
<body class="theme-${funnel.theme || 'dark'}">
  <div class="form-card">
    <div id="formView">
      <div class="form-emoji">🎯</div>
      <h1 class="form-title">¡Estás a un paso!</h1>
      <p class="form-subtitle">Completa tus datos y te contactaremos pronto</p>

      <div id="errorBox" class="error-msg"></div>

      <form id="leadForm" novalidate>
        ${fieldsHTML}
        <button type="submit" class="submit-btn" id="submitBtn">
          Enviar información
        </button>
      </form>
    </div>

    <div id="successView" class="success-msg">
      <div class="success-emoji">🎉</div>
      <h2 class="success-title">✅ ¡Gracias!</h2>
      <p class="success-text">Te contactaremos pronto.</p>
    </div>
  </div>

  <div class="powered-badge">
    <span>🚀</span> Powered by <strong>Nuestra Plataforma</strong>
  </div>

  <script>
    (function() {
      var form = document.getElementById('leadForm');
      var submitBtn = document.getElementById('submitBtn');
      var errorBox = document.getElementById('errorBox');
      var formView = document.getElementById('formView');
      var successView = document.getElementById('successView');

      // ── Colores para confetti ──
      var COLORS = ['#7c3aed','#8b5cf6','#a78bfa','#34d399','#f59e0b','#ec4899','#3b82f6','#10b981'];

      // ── Lanzar confetti ──
      function launchConfetti() {
        for (var i = 0; i < 60; i++) {
          var piece = document.createElement('div');
          piece.className = 'confetti-piece';
          piece.style.left = Math.random() * 100 + 'vw';
          piece.style.top = '-10px';
          piece.style.background = COLORS[Math.floor(Math.random() * COLORS.length)];
          piece.style.width = (6 + Math.random() * 8) + 'px';
          piece.style.height = (6 + Math.random() * 8) + 'px';
          piece.style.animationDuration = (2 + Math.random() * 2) + 's';
          piece.style.animationDelay = (Math.random() * 0.8) + 's';
          document.body.appendChild(piece);
          // Limpiar después de la animación
          setTimeout(function(el) { el.remove(); }, 5000, piece);
        }
      }

      // ── Envío del formulario ──
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        errorBox.classList.remove('show');

        // Recopilar datos
        var data = {};
        var fields = ${JSON.stringify(parsedFields)};
        var missing = [];

        fields.forEach(function(f) {
          var el = document.getElementById('field_' + f.name);
          var val = el ? el.value.trim() : '';
          data[f.name] = val;
          if (f.required && !val) missing.push(f.label);
        });

        // Validar campos requeridos
        if (missing.length > 0) {
          errorBox.textContent = 'Completa los campos: ' + missing.join(', ');
          errorBox.classList.add('show');
          return;
        }

        // Deshabilitar botón mientras envía
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';

        // Enviar al backend
        fetch('/api/funnels/${funnel.id}/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: data })
        })
        .then(function(r) {
          if (!r.ok) return r.json().then(function(b) { throw new Error(b.error || 'Error al enviar'); });
          return r.json();
        })
        .then(function() {
          // Éxito: mostrar mensaje y confetti
          formView.style.display = 'none';
          successView.classList.add('show');
          launchConfetti();
        })
        .catch(function(err) {
          errorBox.textContent = err.message || 'Error inesperado. Intenta de nuevo.';
          errorBox.classList.add('show');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Enviar información';
        });
      });
    })();
  </script>
</body>
</html>`;
}

// ── UTILIDAD: escapar HTML para prevenir XSS ───────────────────────────────
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
