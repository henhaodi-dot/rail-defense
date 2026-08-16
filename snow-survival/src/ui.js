export function createUI() {
  /* ---- HUD bar ---- */
  const hud = document.createElement('div');
  Object.assign(hud.style, {
    position: 'fixed',
    top: 'calc(env(safe-area-inset-top, 0px) + 8px)',
    right: '8px',
    padding: '8px 14px',
    background: 'rgba(0,0,0,0.5)',
    borderRadius: '12px',
    color: '#fff',
    font: '600 13px/1.8 system-ui, sans-serif',
    zIndex: '50',
    pointerEvents: 'none',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
  });
  document.body.appendChild(hud);

  /* ---- collection progress bar ---- */
  const bar = document.createElement('div');
  Object.assign(bar.style, {
    position: 'fixed',
    width: '56px',
    height: '7px',
    background: 'rgba(0,0,0,0.45)',
    borderRadius: '4px',
    overflow: 'hidden',
    zIndex: '50',
    display: 'none',
    pointerEvents: 'none',
  });
  const barFill = document.createElement('div');
  Object.assign(barFill.style, {
    width: '0%',
    height: '100%',
    background: '#66cc55',
    borderRadius: '4px',
  });
  bar.appendChild(barFill);
  document.body.appendChild(bar);

  /* ---- "full" label ---- */
  const full = document.createElement('div');
  Object.assign(full.style, {
    position: 'fixed',
    background: '#f06030',
    color: '#fff',
    font: 'bold 11px system-ui',
    padding: '2px 8px',
    borderRadius: '6px',
    zIndex: '50',
    display: 'none',
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
  });
  full.textContent = '背包已满';
  document.body.appendChild(full);

  /* ---- floating sell feedback ---- */
  const sellPop = document.createElement('div');
  Object.assign(sellPop.style, {
    position: 'fixed',
    color: '#ffe040',
    font: 'bold 18px system-ui',
    zIndex: '60',
    pointerEvents: 'none',
    opacity: '0',
    textShadow: '0 1px 4px rgba(0,0,0,0.6)',
    transition: 'transform 0.8s ease-out, opacity 0.8s ease-out',
    whiteSpace: 'nowrap',
  });
  document.body.appendChild(sellPop);

  return { hud, bar, barFill, full, sellPop, sellTimer: 0 };
}

export function updateHUD(ui, eco) {
  ui.hud.innerHTML =
    `<span style="color:#ffe040">💰 ${eco.money}</span><br>` +
    `🎒 ${eco.total()}/${eco.capacity}` +
    (eco.backpack.ore  ? ` · 矿${eco.backpack.ore}`  : '') +
    (eco.backpack.wood ? ` · 木${eco.backpack.wood}` : '') +
    (eco.backpack.meat ? ` · 肉${eco.backpack.meat}` : '');
}

export function showProgress(ui, pct, sx, sy) {
  ui.bar.style.display = 'block';
  ui.bar.style.left = (sx - 28) + 'px';
  ui.bar.style.top = (sy - 18) + 'px';
  ui.barFill.style.width = (pct * 100) + '%';
}

export function hideProgress(ui) {
  ui.bar.style.display = 'none';
}

export function showFull(ui, sx, sy) {
  ui.full.style.display = 'block';
  ui.full.style.left = (sx - 28) + 'px';
  ui.full.style.top = (sy - 22) + 'px';
}

export function hideFull(ui) {
  ui.full.style.display = 'none';
}

export function showSellFeedback(ui, amount, sx, sy) {
  ui.sellPop.style.transition = 'none';
  ui.sellPop.textContent = `+$${amount}`;
  ui.sellPop.style.left = (sx - 20) + 'px';
  ui.sellPop.style.top = sy + 'px';
  ui.sellPop.style.opacity = '1';
  ui.sellPop.style.transform = 'translateY(0)';
  void ui.sellPop.offsetWidth;
  ui.sellPop.style.transition = 'transform 0.8s ease-out, opacity 0.8s ease-out';
  ui.sellPop.style.opacity = '0';
  ui.sellPop.style.transform = 'translateY(-40px)';
}
