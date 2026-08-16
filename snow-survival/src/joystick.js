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
  });
  outer.appendChild(knob);
  document.body.appendChild(outer);

  const state = { x: 0, z: 0, pid: -1 };
  const MAX = 42;

  function center() {
    const r = outer.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function move(e) {
    const c = center();
    let dx = e.clientX - c.x;
    let dy = e.clientY - c.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d > MAX) { dx = dx / d * MAX; dy = dy / d * MAX; }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    state.x = dx / MAX;
    state.z = dy / MAX;
  }

  function end() {
    state.pid = -1;
    state.x = 0;
    state.z = 0;
    knob.style.transform = 'translate(0px, 0px)';
  }

  outer.addEventListener('pointerdown', e => {
    e.preventDefault();
    state.pid = e.pointerId;
    outer.setPointerCapture(e.pointerId);
    move(e);
  });
  outer.addEventListener('pointermove', e => {
    if (e.pointerId !== state.pid) return;
    move(e);
  });
  outer.addEventListener('pointerup', e => {
    if (e.pointerId === state.pid) end();
  });
  outer.addEventListener('pointercancel', e => {
    if (e.pointerId === state.pid) end();
  });

  return {
    getInput() { return { x: state.x, z: state.z }; },
  };
}
