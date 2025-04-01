export default function (application, html, data) {
  if ((application.document.getFlag('CoC7', 'css-adventure-entry') ?? false)) {
    if (!html.classList.contains('coc7-adventure-entry')) {
      html.classList.add('coc7-adventure-entry', 'theme-light')
    }
    if ((application.document.getFlag('CoC7', 'fixed-adventure-heading') ?? false) && !html.classList.contains('fixed-adventure-heading')) {
      html.classList.add('fixed-adventure-heading')
      const subheading = data.pages?.[0]?.flags?.CoC7?.['fixed-adventure-subheading'] ?? ''
      if (subheading === '') {
        html.querySelector('article.journal-entry-page.text.level1')?.before('<div style="padding: 0.5em;"></div>')
      } else {
        const short = subheading.trim().length === 0
        html.querySelector('article.journal-entry-page.text.level1')?.before('<div class="adventure-heading-section flexrow-coc7"><div class="bookmark' + (short ? ' short' : '') + '"><img src="systems/CoC7/assets/art/' + (short ? 'bookmarks.webp' : 'bookmark.webp') + '"></div><div class="adventure-heading"><div class="heading">' + data.title + '</div>' + (short ? '' : '<div class="subheading">' + subheading + '</div>') + '</div></div>')
      }
    }
  }
}
