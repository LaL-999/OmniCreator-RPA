// 这是一个全局的事件派发器，可以在任何地方随时触发漂亮的弹窗
export const toast = {
  success: (msg: string) => window.dispatchEvent(new CustomEvent('SHOW_TOAST', { detail: { type: 'success', msg } })),
  error: (msg: string) => window.dispatchEvent(new CustomEvent('SHOW_TOAST', { detail: { type: 'error', msg } })),
  warning: (msg: string) => window.dispatchEvent(new CustomEvent('SHOW_TOAST', { detail: { type: 'warning', msg } }))
};