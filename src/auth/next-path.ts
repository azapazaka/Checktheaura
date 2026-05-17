export function buildNextPath(pathname: string, search = '', hash = '') {
  return encodeURIComponent(`${pathname}${search}${hash}`)
}

export function getSafeNextPath(value: string | null | undefined) {
  if (!value || !value.startsWith('/')) {
    return '/'
  }

  return value === '/auth' ? '/' : value
}

export function appendNextParam(basePath: string, nextPath: string | null | undefined) {
  const safeNextPath = getSafeNextPath(nextPath)

  if (!safeNextPath || safeNextPath === '/') {
    return basePath
  }

  const delimiter = basePath.includes('?') ? '&' : '?'
  return `${basePath}${delimiter}next=${encodeURIComponent(safeNextPath)}`
}
