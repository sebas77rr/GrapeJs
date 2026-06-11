/**
 * survey-renderer.js
 * Generates the public HTML page for a KiuFlow satisfaction survey.
 * Questions are rendered as: text/textarea inputs, numeric rating buttons,
 * or multiple-choice option buttons — matching the reference UI the client showed.
 */

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Renders the complete survey HTML page.
 * @param {object} opts
 * @param {number}   opts.surveyId  - KiuFlow survey ID
 * @param {string}   opts.surveyName - Survey title
 * @param {string}   opts.clientId  - Client ID (for answer submission)
 * @param {string}   opts.subId     - Subscription ID
 * @param {Array}    opts.questions - Array of question objects from KiuFlow
 * @param {string}   [opts.apiBase] - Base URL of the builder backend
 */
function renderSurveyPage({ surveyId, surveyName, clientId, subId, questions, apiBase = '' }) {
  const totalQ = Array.isArray(questions) ? questions.length : 0;
  const safeTitle = escapeHtml(surveyName || 'Encuesta de Satisfacción');
  const safeApiBase = escapeHtml(apiBase);

  // Build question HTML blocks
  const questionsHtml = (questions || []).map((q, idx) => {
    const num = idx + 1;
    const qText = escapeHtml(q.question || q.name || `Pregunta ${num}`);
    const qId = `q_${q.id || idx}`;
    const kiuId = q.id;
    const type = (q.type || '').toUpperCase();

    let inputHtml = '';

    if (type === 'OPEN' || type === 'TEXT' || type === 'TEXTO' || type === '') {
      // Open text input
      inputHtml = `
        <div class="answer-area" data-q="${kiuId}" data-type="text">
          <input
            type="text"
            id="${qId}"
            class="text-input"
            placeholder="Escribe tu respuesta aquí..."
            autocomplete="off"
          />
          <button class="submit-btn" onclick="submitAnswer('${kiuId}', '${escapeHtml(String(kiuId))}')">
            Enviar respuesta
          </button>
          <div class="answer-feedback" id="fb_${kiuId}"></div>
        </div>`;

    } else if (type === 'LONG_TEXT' || type === 'TEXTAREA') {
      inputHtml = `
        <div class="answer-area" data-q="${kiuId}" data-type="textarea">
          <textarea
            id="${qId}"
            class="text-input textarea"
            placeholder="Escribe tu respuesta aquí..."
            rows="3"
          ></textarea>
          <button class="submit-btn" onclick="submitAnswer('${kiuId}', '${escapeHtml(String(kiuId))}')">
            Enviar respuesta
          </button>
          <div class="answer-feedback" id="fb_${kiuId}"></div>
        </div>`;

    } else if (type === 'SCALE' || type === 'RATING' || type === 'NUMERIC') {
      // Numeric scale — detect range from options or default 1-5
      const options = Array.isArray(q.options) ? q.options : [];
      const max = options.length > 0 ? options.length : (q.max || 5);
      const min = q.min || 1;
      const nums = [];
      for (let n = min; n <= max; n++) nums.push(n);
      inputHtml = `
        <div class="answer-area" data-q="${kiuId}" data-type="scale">
          <div class="scale-row">
            ${nums.map(n => `<button class="scale-btn" onclick="selectScale(this, '${kiuId}', '${n}')">${n}</button>`).join('')}
          </div>
          <div class="answer-feedback" id="fb_${kiuId}"></div>
        </div>`;

    } else if (type === 'SINGLE_CHOICE' || type === 'MULTIPLE_CHOICE' || type === 'CHOICE') {
      const opts = Array.isArray(q.options) ? q.options : [];
      const isMulti = type === 'MULTIPLE_CHOICE';
      const btnMode = isMulti ? 'multi' : 'single';
      inputHtml = `
        <div class="answer-area" data-q="${kiuId}" data-type="${btnMode}">
          <div class="choice-row">
            ${opts.map(o => {
              const label = escapeHtml(typeof o === 'string' ? o : (o.option || o.text || o.name || String(o)));
              return `<button class="choice-btn" onclick="selectChoice(this, '${kiuId}', '${label}', '${btnMode}')">${label}</button>`;
            }).join('')}
          </div>
          ${isMulti ? `<button class="submit-btn multi-submit" onclick="submitMulti('${kiuId}')" style="margin-top:12px">Confirmar selección</button>` : ''}
          <div class="answer-feedback" id="fb_${kiuId}"></div>
        </div>`;

    } else {
      // Fallback: treat as open text
      inputHtml = `
        <div class="answer-area" data-q="${kiuId}" data-type="text">
          <input type="text" id="${qId}" class="text-input" placeholder="Escribe tu respuesta..." autocomplete="off" />
          <button class="submit-btn" onclick="submitAnswer('${kiuId}', '${escapeHtml(String(kiuId))}')">Enviar respuesta</button>
          <div class="answer-feedback" id="fb_${kiuId}"></div>
        </div>`;
    }

    return `
      <div class="question-card" id="qcard_${kiuId}">
        <div class="q-header">
          <span class="q-num">${num}</span>
          <span class="q-text">${qText}</span>
        </div>
        ${inputHtml}
      </div>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${safeTitle}</title>
  <meta name="description" content="Encuesta de satisfacción - ${safeTitle}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    /* ─── Reset & Base ─── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --rosa: #DB2C52;
      --rosa-hover: #c0213f;
      --rosa-soft: rgba(219, 44, 82, 0.08);
      --rosa-border: rgba(219, 44, 82, 0.3);
      --text: #1a1a2e;
      --text-muted: #64748b;
      --border: #e2e8f0;
      --bg: #f8fafc;
      --white: #ffffff;
      --success: #10b981;
      --success-soft: rgba(16, 185, 129, 0.1);
      --radius: 10px;
      --shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
    }
    html { scroll-behavior: smooth; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      font-size: 15px;
      line-height: 1.6;
    }

    /* ─── Header ─── */
    .header {
      background: var(--white);
      border-bottom: 1px solid var(--border);
      padding: 18px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky; top: 0; z-index: 10;
      box-shadow: var(--shadow);
    }
    .header-logo {
      font-weight: 700;
      font-size: 1.1rem;
      color: var(--rosa);
      letter-spacing: -0.02em;
    }
    .header-counter {
      font-size: 0.8rem;
      color: var(--text-muted);
      font-weight: 500;
      background: var(--bg);
      padding: 4px 12px;
      border-radius: 999px;
      border: 1px solid var(--border);
    }

    /* ─── Progress bar ─── */
    .progress-bar-wrap {
      background: var(--border);
      height: 3px;
      width: 100%;
    }
    .progress-bar-fill {
      background: var(--rosa);
      height: 3px;
      width: 0%;
      transition: width 0.4s ease;
    }

    /* ─── Layout ─── */
    .page-wrapper {
      max-width: 760px;
      margin: 0 auto;
      padding: 32px 16px 80px;
    }

    /* ─── Hero ─── */
    .survey-hero {
      text-align: center;
      margin-bottom: 32px;
    }
    .survey-hero h1 {
      font-size: clamp(1.4rem, 4vw, 1.9rem);
      font-weight: 700;
      color: var(--text);
      letter-spacing: -0.02em;
      margin-bottom: 8px;
    }
    .survey-hero p {
      font-size: 0.93rem;
      color: var(--text-muted);
    }
    .survey-hero .q-count {
      display: inline-block;
      background: var(--rosa-soft);
      color: var(--rosa);
      font-weight: 700;
      font-size: 0.82rem;
      padding: 4px 14px;
      border-radius: 999px;
      margin-bottom: 16px;
    }

    /* ─── Question Card ─── */
    .question-card {
      background: var(--white);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 24px;
      margin-bottom: 16px;
      box-shadow: var(--shadow);
      transition: border-color 0.2s;
    }
    .question-card.answered {
      border-color: var(--success);
      background: linear-gradient(to right, rgba(16,185,129,0.03), var(--white));
    }
    .q-header {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      margin-bottom: 18px;
    }
    .q-num {
      flex-shrink: 0;
      width: 30px; height: 30px;
      border-radius: 50%;
      background: var(--rosa);
      color: #fff;
      font-size: 0.82rem;
      font-weight: 700;
      display: flex; align-items: center; justify-content: center;
    }
    .q-text {
      font-size: 0.97rem;
      font-weight: 600;
      color: var(--text);
      padding-top: 4px;
      line-height: 1.5;
    }

    /* ─── Text inputs ─── */
    .text-input {
      width: 100%;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 10px 14px;
      font-family: inherit;
      font-size: 0.93rem;
      color: var(--text);
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
      background: var(--white);
      resize: vertical;
    }
    .text-input:focus {
      border-color: var(--rosa);
      box-shadow: 0 0 0 3px var(--rosa-soft);
    }
    .text-input.textarea { min-height: 80px; }

    /* ─── Submit button ─── */
    .submit-btn {
      margin-top: 12px;
      background: var(--white);
      border: 1.5px solid var(--rosa-border);
      color: var(--rosa);
      font-family: inherit;
      font-size: 0.88rem;
      font-weight: 600;
      padding: 9px 22px;
      border-radius: 8px;
      cursor: pointer;
      display: block;
      margin-left: auto;
      margin-right: auto;
      transition: background 0.18s, color 0.18s, border-color 0.18s;
    }
    .submit-btn:hover {
      background: var(--rosa);
      color: #fff;
      border-color: var(--rosa);
    }
    .submit-btn:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }

    /* ─── Scale buttons ─── */
    .scale-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .scale-btn {
      width: 44px; height: 44px;
      border: 1.5px solid var(--border);
      border-radius: 8px;
      background: var(--white);
      font-family: inherit;
      font-size: 0.95rem;
      font-weight: 500;
      color: var(--text);
      cursor: pointer;
      transition: all 0.15s;
    }
    .scale-btn:hover {
      border-color: var(--rosa);
      color: var(--rosa);
      background: var(--rosa-soft);
    }
    .scale-btn.selected {
      background: var(--rosa);
      border-color: var(--rosa);
      color: #fff;
      font-weight: 700;
    }

    /* ─── Choice buttons ─── */
    .choice-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .choice-btn {
      border: 1.5px solid var(--border);
      border-radius: 8px;
      background: var(--white);
      font-family: inherit;
      font-size: 0.88rem;
      font-weight: 500;
      color: var(--text);
      padding: 9px 16px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .choice-btn:hover {
      border-color: var(--rosa);
      color: var(--rosa);
      background: var(--rosa-soft);
    }
    .choice-btn.selected {
      background: var(--rosa);
      border-color: var(--rosa);
      color: #fff;
      font-weight: 600;
    }

    /* ─── Feedback badge ─── */
    .answer-feedback {
      display: none;
      margin-top: 10px;
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--success);
      background: var(--success-soft);
      border-radius: 6px;
      padding: 6px 12px;
      text-align: center;
    }
    .answer-feedback.visible { display: block; }
    .answer-feedback.error {
      color: #ef4444;
      background: rgba(239,68,68,0.08);
    }

    /* ─── Finished screen ─── */
    .finished-screen {
      display: none;
      text-align: center;
      padding: 48px 24px;
      background: var(--white);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      margin-top: 32px;
    }
    .finished-screen .icon {
      font-size: 3rem;
      margin-bottom: 16px;
    }
    .finished-screen h2 {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 8px;
    }
    .finished-screen p {
      color: var(--text-muted);
      font-size: 0.95rem;
    }

    /* ─── Responsive ─── */
    @media (max-width: 480px) {
      .page-wrapper { padding: 20px 12px 60px; }
      .question-card { padding: 18px 14px; }
      .scale-btn { width: 40px; height: 40px; font-size: 0.9rem; }
      .survey-hero h1 { font-size: 1.3rem; }
    }
  </style>
</head>
<body>

  <!-- Header -->
  <header class="header">
    <div class="header-logo">KiuFlow</div>
    <div class="header-counter" id="counter">0 / ${totalQ} respondidas</div>
  </header>
  <div class="progress-bar-wrap">
    <div class="progress-bar-fill" id="progressBar"></div>
  </div>

  <!-- Content -->
  <div class="page-wrapper">
    <div class="survey-hero">
      <div class="q-count">${totalQ} preguntas</div>
      <h1>${safeTitle}</h1>
      <p>Tus respuestas nos ayudan a mejorar. Solo toma un momento.</p>
    </div>

    <div id="questionsContainer">
      ${questionsHtml}
    </div>

    <div class="finished-screen" id="finishedScreen">
      <div class="icon">🎉</div>
      <h2>¡Muchas gracias!</h2>
      <p>Hemos recibido todas tus respuestas.<br>Tu opinión es muy valiosa para nosotros.</p>
    </div>
  </div>

  <script>
    var TOTAL = ${totalQ};
    var answered = new Set();
    var API_BASE = '${safeApiBase}';
    var SURVEY_ID = '${escapeHtml(String(surveyId))}';
    var CLIENT_ID = '${escapeHtml(String(clientId || ''))}';
    var SUB_ID = '${escapeHtml(String(subId || ''))}';

    function updateProgress() {
      var count = answered.size;
      document.getElementById('counter').textContent = count + ' / ' + TOTAL + ' respondidas';
      document.getElementById('progressBar').style.width = (TOTAL > 0 ? (count / TOTAL * 100) : 0) + '%';
      if (count >= TOTAL && TOTAL > 0) {
        document.getElementById('finishedScreen').style.display = 'block';
        document.getElementById('finishedScreen').scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    function markAnswered(qId) {
      answered.add(String(qId));
      var card = document.getElementById('qcard_' + qId);
      if (card) card.classList.add('answered');
      updateProgress();
    }

    function showFeedback(qId, msg, isError) {
      var fb = document.getElementById('fb_' + qId);
      if (!fb) return;
      fb.textContent = msg;
      fb.className = 'answer-feedback visible' + (isError ? ' error' : '');
    }

    function postAnswer(qId, answer, callback) {
      fetch(API_BASE + '/api/public/survey/' + SURVEY_ID + '/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surveyId: SURVEY_ID,
          questionId: String(qId),
          answer: answer,
          clientId: CLIENT_ID,
          sub_id: SUB_ID
        })
      })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (callback) callback(null, data);
      })
      .catch(function(err) {
        if (callback) callback(err);
      });
    }

    /* ── Text / Textarea answer ── */
    function submitAnswer(qId, elId) {
      var el = document.getElementById('q_' + elId) || document.querySelector('[data-q="' + qId + '"] .text-input');
      if (!el) return;
      var val = el.value.trim();
      if (!val) { showFeedback(qId, 'Por favor escribe tu respuesta.', true); return; }

      var btn = document.querySelector('[data-q="' + qId + '"] .submit-btn');
      if (btn) btn.disabled = true;

      postAnswer(qId, val, function(err) {
        if (err) {
          showFeedback(qId, 'Error al enviar. Intenta de nuevo.', true);
          if (btn) btn.disabled = false;
        } else {
          showFeedback(qId, '✓ Respuesta recibida', false);
          if (el) { el.disabled = true; }
          markAnswered(qId);
        }
      });
    }

    /* ── Scale (numeric) ── */
    function selectScale(btnEl, qId, val) {
      var area = document.querySelector('[data-q="' + qId + '"]');
      if (!area || area.dataset.locked) return;
      var btns = area.querySelectorAll('.scale-btn');
      btns.forEach(function(b) { b.classList.remove('selected'); });
      btnEl.classList.add('selected');

      area.dataset.locked = '1';
      btns.forEach(function(b) { b.disabled = true; });

      postAnswer(qId, val, function(err) {
        if (err) {
          showFeedback(qId, 'Error al enviar. Intenta de nuevo.', true);
          delete area.dataset.locked;
          btns.forEach(function(b) { b.disabled = false; });
        } else {
          showFeedback(qId, '✓ Respuesta recibida', false);
          markAnswered(qId);
        }
      });
    }

    /* ── Single choice ── */
    function selectChoice(btnEl, qId, val, mode) {
      var area = document.querySelector('[data-q="' + qId + '"]');
      if (!area) return;
      if (mode === 'single') {
        if (area.dataset.locked) return;
        var btns = area.querySelectorAll('.choice-btn');
        btns.forEach(function(b) { b.classList.remove('selected'); });
        btnEl.classList.add('selected');

        area.dataset.locked = '1';
        btns.forEach(function(b) { b.disabled = true; });

        postAnswer(qId, val, function(err) {
          if (err) {
            showFeedback(qId, 'Error al enviar. Intenta de nuevo.', true);
            delete area.dataset.locked;
            btns.forEach(function(b) { b.disabled = false; });
          } else {
            showFeedback(qId, '✓ Respuesta recibida', false);
            markAnswered(qId);
          }
        });
      } else {
        // multi: just toggle selection visually; submit via button
        btnEl.classList.toggle('selected');
      }
    }

    /* ── Multi choice submit ── */
    function submitMulti(qId) {
      var area = document.querySelector('[data-q="' + qId + '"]');
      if (!area || area.dataset.locked) return;
      var selected = Array.from(area.querySelectorAll('.choice-btn.selected')).map(function(b) { return b.textContent; });
      if (selected.length === 0) { showFeedback(qId, 'Selecciona al menos una opción.', true); return; }

      var btn = area.querySelector('.multi-submit');
      if (btn) btn.disabled = true;
      area.dataset.locked = '1';

      postAnswer(qId, selected.join(', '), function(err) {
        if (err) {
          showFeedback(qId, 'Error al enviar. Intenta de nuevo.', true);
          delete area.dataset.locked;
          if (btn) btn.disabled = false;
        } else {
          showFeedback(qId, '✓ Respuesta recibida', false);
          area.querySelectorAll('.choice-btn').forEach(function(b) { b.disabled = true; });
          markAnswered(qId);
        }
      });
    }

    // Init
    updateProgress();
  </script>
</body>
</html>`;
}

module.exports = { renderSurveyPage };
