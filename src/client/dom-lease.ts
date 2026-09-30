/**
 * `body` 属性租约。
 *
 * 插件的 `apply` 可能被多次激活（HMR 重载、启用/停用、多个会话页），而
 * `document.body` 是全局共享状态。直接 `setAttribute` / `removeAttribute`
 * 会互相踩：后卸载的那次会把先卸载那次刚恢复的值再删一遍。
 *
 * 租约的做法是给每个属性记一份「原始值 + 当前持有者集合」：
 * 最后一个持有者释放时才真正恢复原值，其他持有者释放只做减法。
 *
 * 参照实现：`reference/repos/deep-whale/maid-atelier/src/client/index.ts`
 * 的 `createBodyAttributeLease`（MIT），本文件是其精简重写。
 *
 * @module dom-lease
 */

interface LeaseState {
  readonly originalValue: string | null
  readonly owners: Set<symbol>
  readonly value: string
}

const registry = new WeakMap<HTMLElement, Map<string, LeaseState>>()

export interface AttributeLease {
  acquire(): void
  release(): void
}

/**
 * 为一个元素的某个属性建立租约。同一元素同一属性的多个租约共享一份
 * 原始值，互不覆盖对方的恢复动作。
 *
 * @param element - 目标元素（通常是 `document.body`）。
 * @param attribute - 属性名。
 * @param value - 持有期间写入的值，默认空串（存在性标记）。
 */
export function createAttributeLease(element: HTMLElement, attribute: string, value = ''): AttributeLease {
  const owner = Symbol(attribute)
  let active = false

  return {
    acquire(): void {
      if (active) return
      let attributes = registry.get(element)
      if (attributes === undefined) {
        attributes = new Map()
        registry.set(element, attributes)
      }
      let state = attributes.get(attribute)
      if (state === undefined) {
        state = { originalValue: element.getAttribute(attribute), owners: new Set(), value }
        attributes.set(attribute, state)
      }
      state.owners.add(owner)
      active = true
      element.setAttribute(attribute, state.value)
    },

    release(): void {
      if (!active) return
      active = false
      const state = registry.get(element)?.get(attribute)
      if (state === undefined || !state.owners.delete(owner)) return
      if (state.owners.size > 0) {
        // 还有别的持有者：确保值仍在位，但不动原始值。
        element.setAttribute(attribute, state.value)
        return
      }
      // 最后一个持有者：只有当前值仍是我们写的那个才恢复，否则说明有别人改过。
      if (element.getAttribute(attribute) === state.value) {
        if (state.originalValue === null) element.removeAttribute(attribute)
        else element.setAttribute(attribute, state.originalValue)
      }
      registry.get(element)?.delete(attribute)
    },
  }
}
