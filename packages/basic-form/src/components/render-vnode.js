export default {
  functional: true,
  props: { renderFn: Function },
  render(createElement, ctx) {
    try {
      const fn = ctx.props.renderFn;
      return typeof fn === 'function' ? fn(createElement) : null;
    } catch (err) {
      console.error('[RenderVNode] render error:', err);
      return null;
    }
  }
};

