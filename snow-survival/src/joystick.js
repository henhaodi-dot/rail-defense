export function createJoystick() {
  const outer = document.createElement('div');
  Object.assign(outer.style, {
    position: 'fixed',
    left: '20px',
    bottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)',
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.15)',
    border: '2px solid rgba(255,255,255,0.35)',
    zIndex: '100',
    touchAction: 'none',
    userSelect: 'none',
    WebkitUserSelect: 'none',
  });

  const knob = document.createElement('div');
  Object.assign(knob.style, {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: '44px',
    height: '44px',
    marginLeft: '-22px',
    marginTop: '-22px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.5)',
    border: '2px solid rgba(255,255,255,0.7)',
    pointerEvents: 'none',
  });
  outer.appendChild(knob);
  document.body.appendChild(outer);

  const state = { x: 0, z: 0, active: false };
  const MAX = 42;

  function center() {
    const r = outer.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function move(cx, cy) {
    const c = center();
    let dx = cx - c.x;
    let dy = cy - c.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d > MAX) { dx = dx / d * MAX; dy = dy / d * MAX; }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    state.x = dx / MAX;
    state.z = dy / MAX;
  }

  function end() {
    state.active = false;
    state.x = 0;
    state.z = 0;
    knob.style.transform = 'translate(0px, 0px)';
  }

  // Touch events (primary on mobile)
  outer.addEventListener('touchstart', e => {
    e.preventDefault();
    state.active = true;
    const t = e.touches[0];
    move(t.clientX, t.clientY);
  }, { passive: false });

  outer.addEventListener('touchmove', e => {
    e.preventDefault();
    if (!state.active) return;
    const t = e.touches[0];
    move(t.clientX, t.clientY);
  }, { passive: false });

  outer.addEventListener('touchend', e => {
    e.preventDefault();
    end();
  }, { passive: false });

  outer.addEventListener('touchcancel', e => {
    end();
  });

  // Pointer events (desktop fallback)
  outer.addEventListener('pointerdown', e => {
    if (e.pointerType === 'touch') return;
    e.preventDefault();
    state.active = true;
    outer.setPointerCapture(e.pointerId);
    move(e.clientX, e.clientY);
  });
  outer.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch' || !state.active) return;
    move(e.clientX, e.clientY);
  });
  outer.addEventListener('pointerup', e => {
    if (e.pointerType === 'touch') return;
    end();
  });
  outer.addEventListener('pointercancel', e => {
    if (e.pointerType === 'touch') return;
    end();
  });

  return {
    getInput() { return { x: state.x, z: state.z }; },
  };
}
