// The inline script in index.html decides once (path has /preview/ or URL has
// ?palette=) and marks <html data-preview>.
export function isPreview() {
  return document.documentElement.hasAttribute('data-preview')
}
