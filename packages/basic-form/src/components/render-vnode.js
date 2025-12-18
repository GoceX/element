/*
 * 组件：RenderVNode（函数式组件）
 * 作用：将一个 render 函数以 VNode 的形式渲染出来。
 * 使用场景：
 * - schema.render / schema.sectionsTitle 等配置返回 VNode 的场景
 * - 需要在模板中安全地执行渲染函数（带 try/catch）
 */
export default {
  functional: true,
  props: { renderFn: Function },
  render(createElement, ctx) {
    try {
      const fn = ctx.props.renderFn;
      // renderFn 约定：接收 createElement 并返回 VNode
      return typeof fn === 'function' ? fn(createElement) : null;
    } catch (err) {
      console.error('[RenderVNode] render error:', err);
      return null;
    }
  }
};
