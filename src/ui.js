export class UIManager {
  constructor() {
    this.onBuildSelect = null;
    this.onStartWave = null;
    this.onUpgrade = null;
    this.onRestart = null;
    this._msgTimer = 0;
    this._create();
  }

  _create() {
    this.hud = document.createElement('div');
    this.hud.id = 'hud';
    this.hud.innerHTML =
      '<div class="res"><span class="ri">💰</span><span id="g-ct">200</span></div>' +
      '<div class="res"><span class="ri">🪵</span><span id="w-ct">100</span></div>';
    document.body.appendChild(this.hud);

    this.waveEl = document.createElement('div');
    this.waveEl.id = 'wave-info';
    this.waveEl.innerHTML =
      '<div id="wave-txt"></div>' +
      '<div id="base-hp-wrap"><div id="base-hp-bar"></div></div>';
    document.body.appendChild(this.waveEl);

    this.waveBtn = document.createElement('button');
    this.waveBtn.id = 'wave-btn';
    this.waveBtn.textContent = 'START WAVE 1';
    this.waveBtn.addEventListener('pointerdown', e => e.stopPropagation());
    this.waveBtn.addEventListener('click', e => {
      e.stopPropagation();
      if (this.onStartWave) this.onStartWave();
    });
    document.body.appendChild(this.waveBtn);

    this.panel = document.createElement('div');
    this.panel.id = 'build-panel';
    const btns = [
      {id:'TRACK',   icon:'\u{1F6E4}️', label:'Track',   cost:'$5'},
      {id:'MINING',  icon:'⛏️',        label:'Mine',    cost:'$50'},
      {id:'STORAGE', icon:'\u{1F4E6}',        label:'Storage', cost:'$30'},
      {id:'TOWER',   icon:'\u{1F3F0}',        label:'Tower',   cost:'$40'},
      {id:'CANNON',  icon:'\u{1F4A3}',        label:'Cannon',  cost:'$80+30w'},
      {id:'ICE',     icon:'\u{2744}️',   label:'Ice',     cost:'$60+20w'},
      {id:'LUMBER',  icon:'\u{1FA93}',         label:'Lumber',  cost:'$60'},
    ];
    for (const b of btns) {
      const el = document.createElement('button');
      el.className = 'build-btn'; el.dataset.type = b.id;
      el.innerHTML = `<span class="bi">${b.icon}</span><span class="bl">${b.label}</span><span class="bc">${b.cost}</span>`;
      el.addEventListener('pointerdown', e => e.stopPropagation());
      el.addEventListener('click', e => { e.stopPropagation(); this._select(b.id, el); });
      this.panel.appendChild(el);
    }
    this._cancelBtn = document.createElement('button');
    this._cancelBtn.className = 'build-btn cancel-btn';
    this._cancelBtn.innerHTML = '<span class="bi">✕</span><span class="bl">Cancel</span>';
    this._cancelBtn.style.display = 'none';
    this._cancelBtn.addEventListener('pointerdown', e => e.stopPropagation());
    this._cancelBtn.addEventListener('click', e => { e.stopPropagation(); this._select('CANCEL'); });
    this.panel.appendChild(this._cancelBtn);
    document.body.appendChild(this.panel);

    this._modeEl = document.createElement('div');
    this._modeEl.id = 'mode-ind';
    document.body.appendChild(this._modeEl);

    this._msgEl = document.createElement('div');
    this._msgEl.id = 'msg';
    document.body.appendChild(this._msgEl);

    // Upgrade panel
    this._upgEl = document.createElement('div');
    this._upgEl.id = 'upg-panel';
    this._upgEl.style.display = 'none';
    this._upgEl.innerHTML =
      '<div class="upg-title" id="upg-title"></div>' +
      '<div class="upg-info" id="upg-info"></div>' +
      '<div class="upg-btns">' +
      '<button id="upg-btn" class="upg-action">Upgrade</button>' +
      '<button id="upg-close" class="upg-close-btn">Close</button>' +
      '</div>';
    this._upgEl.addEventListener('pointerdown', e => e.stopPropagation());
    document.body.appendChild(this._upgEl);
    document.getElementById('upg-btn').addEventListener('click', e => {
      e.stopPropagation();
      if (this.onUpgrade) this.onUpgrade();
    });
    document.getElementById('upg-close').addEventListener('click', e => {
      e.stopPropagation();
      this.hideUpgrade();
    });

    // Game over overlay
    this._overEl = document.createElement('div');
    this._overEl.id = 'game-over';
    this._overEl.innerHTML =
      '<div class="go-text">GAME OVER</div>' +
      '<div class="go-sub" id="go-sub"></div>' +
      '<button class="restart-btn" id="restart-btn">Play Again</button>';
    this._overEl.style.display = 'none';
    this._overEl.addEventListener('pointerdown', e => e.stopPropagation());
    document.body.appendChild(this._overEl);
    document.getElementById('restart-btn').addEventListener('click', e => {
      e.stopPropagation();
      if (this.onRestart) this.onRestart();
    });
  }

  _select(type, el) {
    this.panel.querySelectorAll('.build-btn').forEach(b => b.classList.remove('active'));
    if (type === 'CANCEL') {
      this._cancelBtn.style.display = 'none';
      this._modeEl.textContent = '';
    } else {
      if (el) el.classList.add('active');
      this._cancelBtn.style.display = '';
    }
    if (this.onBuildSelect) this.onBuildSelect(type);
  }

  setRes(gold, wood) {
    document.getElementById('g-ct').textContent = Math.floor(gold);
    document.getElementById('w-ct').textContent = Math.floor(wood);
  }

  setWave(wave, total, active, buildTimer) {
    const el = document.getElementById('wave-txt');
    if (!wave) {
      el.textContent = 'Build your defenses!';
      this.waveBtn.style.display = '';
      this.waveBtn.textContent = 'START WAVE 1';
    } else if (active) {
      el.textContent = `Wave ${wave}/${total}`;
      this.waveBtn.style.display = 'none';
    } else if (wave < total) {
      el.textContent = `Wave ${wave}/${total} cleared! Next in ${Math.ceil(buildTimer)}s`;
      this.waveBtn.style.display = '';
      this.waveBtn.textContent = `START WAVE ${wave + 1}`;
    } else {
      el.textContent = 'All waves cleared!';
      this.waveBtn.style.display = 'none';
    }
  }

  setBaseHP(hp, max) {
    const pct = Math.max(0, hp / max) * 100;
    const bar = document.getElementById('base-hp-bar');
    bar.style.width = pct + '%';
    bar.style.background = pct > 50 ? '#4c4' : pct > 25 ? '#cc4' : '#c44';
  }

  setMode(txt) { this._modeEl.textContent = txt; }

  msg(text, ms = 2000) {
    this._msgEl.textContent = text;
    this._msgEl.classList.add('show');
    clearTimeout(this._msgTimer);
    this._msgTimer = setTimeout(() => this._msgEl.classList.remove('show'), ms);
  }

  showUpgrade(building, upgCost) {
    const title = document.getElementById('upg-title');
    const info = document.getElementById('upg-info');
    const btn = document.getElementById('upg-btn');
    title.textContent = `${building.type} Lv${building.level}`;
    let costStr = `${upgCost.cost} gold`;
    if (upgCost.wood) costStr += ` + ${upgCost.wood} wood`;
    info.textContent = `Upgrade to Lv${building.level+1}: ${costStr}`;
    btn.textContent = `Upgrade (${costStr})`;
    this._upgEl.style.display = '';
  }

  hideUpgrade() {
    this._upgEl.style.display = 'none';
  }

  deselect() {
    this.panel.querySelectorAll('.build-btn').forEach(b => b.classList.remove('active'));
    this._cancelBtn.style.display = 'none';
    this._modeEl.textContent = '';
  }

  gameOver(wave) {
    this._overEl.style.display = '';
    document.querySelector('.go-text').textContent = 'GAME OVER';
    document.getElementById('go-sub').textContent = `Survived ${wave} wave${wave !== 1 ? 's' : ''}`;
  }

  victory() {
    this._overEl.style.display = '';
    document.querySelector('.go-text').textContent = 'VICTORY!';
    document.getElementById('go-sub').textContent = 'All waves defeated!';
  }

  hideOverlay() {
    this._overEl.style.display = 'none';
  }
}
