const body = document.body;
const themeToggle = document.querySelector('.theme-toggle');
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelectorAll('.nav-link');
const navMenu = document.querySelector('.nav-links');
const siteHeader = document.getElementById('siteHeader');

if (themeToggle) {
  const themeIcon = themeToggle.querySelector('span');

  themeToggle.addEventListener('click', () => {
    const isDark = body.classList.toggle('dark-theme');
    themeToggle.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
    if (themeIcon) {
      themeIcon.textContent = isDark ? '☀' : '☾';
    }
  });
}

if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!isExpanded));
    navMenu.classList.toggle('is-open', !isExpanded);
  });

  navMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navToggle.setAttribute('aria-expanded', 'false');
      navMenu.classList.remove('is-open');
    });
  });
}

const activateLink = (hash) => {
  navLinks.forEach((link) => {
    const isMatch = link.getAttribute('href') === hash;
    link.classList.toggle('is-active', isMatch);
  });
};

const sections = Array.from(document.querySelectorAll('section[id], main[id]'));

const observer = new IntersectionObserver((entries) => {
  const visible = entries
    .filter((entry) => entry.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

  if (!visible) {
    return;
  }

  activateLink(`#${visible.target.id}`);
}, {
  rootMargin: '-20% 0px -55% 0px',
  threshold: [0.15, 0.45, 0.75]
});

sections.forEach((section) => observer.observe(section));

window.addEventListener('scroll', () => {
  siteHeader?.classList.toggle('is-scrolled', window.scrollY > 12);

  if (window.scrollY < 80) {
    activateLink('#top');
  }
});

activateLink('#top');
