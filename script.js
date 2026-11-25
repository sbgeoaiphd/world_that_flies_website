'use strict';
document.querySelectorAll('[data-video]').forEach(function (container) {
  var button = container.querySelector('button');
  button.addEventListener('click', function () {
    var id = container.getAttribute('data-video');
    if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return;
    var frame = document.createElement('iframe');
    frame.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0';
    frame.title = container.getAttribute('data-title');
    frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    container.replaceChildren(frame);
    frame.focus();
  });
});

// Keep dialogue samples from talking over one another.
document.querySelectorAll('audio').forEach(function (player) {
  player.addEventListener('play', function () {
    document.querySelectorAll('audio').forEach(function (other) {
      if (other !== player) other.pause();
    });
  });
});

// With scripting disabled, the index links open the journeys directly.
const coverStories = Array.from(document.querySelectorAll('.cover-story'));
const coverLinks = Array.from(document.querySelectorAll('[data-cover]'));
const coverButtons = coverLinks.map((link, index) => {
  const button = document.createElement('button');
  const story = document.getElementById('cover-' + link.dataset.cover);
  button.type = 'button';
  button.className = link.className;
  button.innerHTML = link.innerHTML;
  button.querySelector('.contents-arrow').textContent = '←';
  button.setAttribute('aria-label', 'Preview ' + link.querySelector('strong').textContent);
  button.setAttribute('aria-controls', story.id);
  button.setAttribute('aria-pressed', String(index === 0));
  button.addEventListener('click', () => {
    coverStories.forEach(item => { item.hidden = item !== story; });
    coverButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    if (window.matchMedia('(max-width: 680px)').matches) {
      story.querySelector('a').focus();
    }
  });
  link.replaceWith(button);
  return button;
});

// Start an excerpt only when the reader reaches it. A deliberate pause or a
// completed excerpt stays paused when the reader returns.
document.querySelectorAll('video.film-excerpt').forEach(video => {
  if (!window.IntersectionObserver || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let inView = false;
  let resumeWhenVisible = true;

  function updatePlayback() {
    if (inView && !document.hidden) {
      if (resumeWhenVisible) {
        resumeWhenVisible = false;
        video.play().catch(() => { /* The native play control remains available. */ });
      }
    } else if (!video.paused && !video.ended) {
      resumeWhenVisible = true;
      video.pause();
    }
  }

  new IntersectionObserver(([entry]) => {
    inView = entry.intersectionRatio >= 0.35;
    updatePlayback();
  }, {threshold: 0.35}).observe(video);
  document.addEventListener('visibilitychange', updatePlayback);
});

// Photo links still open the original file when a modal is unavailable.
const photoLinks = document.querySelectorAll('figure a[href$=".webp"]');
if (photoLinks.length && typeof HTMLDialogElement !== 'undefined' && HTMLDialogElement.prototype.showModal) {
  const viewer = document.createElement('dialog');
  viewer.className = 'photo-viewer';
  viewer.setAttribute('aria-labelledby', 'photo-viewer-caption');
  viewer.innerHTML = '<button type="button" autofocus aria-label="Close photograph">Close ×</button>' +
    '<figure><img alt=""><figcaption id="photo-viewer-caption"></figcaption></figure>';
  document.body.append(viewer);
  const enlarged = viewer.querySelector('img');
  const caption = viewer.querySelector('figcaption');
  let opener;

  photoLinks.forEach(link => {
    link.setAttribute('aria-haspopup', 'dialog');
    link.addEventListener('click', event => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      opener = link;
      enlarged.alt = link.querySelector('img').alt;
      enlarged.src = link.href;
      caption.textContent = link.closest('figure').querySelector('figcaption')?.textContent || enlarged.alt;
      viewer.showModal();
    });
  });
  viewer.addEventListener('click', () => viewer.close());
  viewer.addEventListener('close', () => opener?.focus({preventScroll: true}));
}
