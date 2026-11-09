/**
 * 价格展示格式化：最多保留 4 位小数，小数末尾的 0 不展示。
 * 例：1.2345 -> '1.2345'，1.2300 -> '1.23'，1.0000 -> '1'，2 -> '2'
 * 非数值（null/undefined/空串）原样返回，交由调用方决定占位符。
 */
export function formatPrice(val) {
  if (val == null || val === '') return val
  const num = Number(val)
  if (Number.isNaN(num)) return val
  return String(Number(num.toFixed(4)))
}
