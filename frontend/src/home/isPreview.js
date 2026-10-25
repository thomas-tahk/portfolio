// Preview builds only: path contains /preview/ or the URL has ?palette=.
export function isPreview() {
  return location.pathname.includes('/preview/') || new URLSearchParams(location.search).has('palette')
}
