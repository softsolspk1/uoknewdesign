// Shared helper: adds native lazy-loading to <img> tags that don't already
// declare a loading attribute. Used both for the git-tracked legacy_html/
// home.html fallback content and (separately) for DB-stored Page content.
function addLazyLoading(html) {
  return html.replace(/<img\b([^>]*?)\s*(\/?)>/gi, (match, attrs, selfClose) => {
    if (/\sloading\s*=/i.test(attrs)) return match;
    const decodingAttr = /\sdecoding\s*=/i.test(attrs) ? '' : ' decoding="async"';
    return `<img${attrs} loading="lazy"${decodingAttr} ${selfClose}>`.replace(/\s+>/, '>').replace(/\s+\/>/, ' />');
  });
}

module.exports = { addLazyLoading };
