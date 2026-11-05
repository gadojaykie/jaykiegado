const body = document.body;
const themeToggle = document.querySelector('.theme-toggle');
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelectorAll('.nav-link');
const navMenu = document.querySelector('.nav-links');
const siteHeader = document.getElementById('siteHeader');
const messengerWidget = document.querySelector('.messenger-widget');
const siteFooter = document.querySelector('.site-footer');

if (messengerWidget instanceof HTMLAnchorElement && siteFooter instanceof HTMLElement && 'IntersectionObserver' in window) {
  const footerObserver = new IntersectionObserver(([entry]) => {
    messengerWidget.classList.toggle('is-hidden', entry.isIntersecting);
  });

  footerObserver.observe(siteFooter);
}

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

const projectInquiry = document.querySelector('#projectInquiry');

if (projectInquiry instanceof HTMLFormElement) {
  const formStatus = projectInquiry.querySelector('.form-status');
  const submitButton = projectInquiry.querySelector('button[type="submit"]');
  const submitButtonContent = submitButton?.innerHTML;

  projectInquiry.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!projectInquiry.reportValidity()) {
      return;
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Sending...';
    }
    if (formStatus) {
      formStatus.textContent = 'Sending your inquiry...';
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(projectInquiry.action, {
        method: 'POST',
        body: new FormData(projectInquiry),
        headers: { Accept: 'application/json' },
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`Formspree rejected the submission with status ${response.status}`);
      }

      projectInquiry.reset();
      if (formStatus) {
        formStatus.textContent = 'Thanks! Your inquiry was sent. I’ll get back to you by email.';
      }
    } catch (error) {
      console.error('Project inquiry submission failed.', error);
      if (formStatus) {
        const isTimeout = error !== null && typeof error === 'object' && 'name' in error && error.name === 'AbortError';
        formStatus.textContent = isTimeout
          ? 'This is taking longer than expected. Your inquiry may still have been received; please check your email before retrying, or email me directly below.'
          : 'Sorry, your inquiry could not be sent. Please try again or email me directly using the link below.';
      }
    } finally {
      window.clearTimeout(timeoutId);
      if (submitButton) {
        submitButton.disabled = false;
        if (submitButtonContent) {
          submitButton.innerHTML = submitButtonContent;
        }
      }
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

const sections = Array.from(document.querySelectorAll('section[id]'));
let activeSectionUpdateScheduled = false;

const updateActiveSection = () => {
  const activationLine = (siteHeader?.getBoundingClientRect().bottom ?? 0) + 16;
  const currentSection = sections
    .filter((section) => section.getBoundingClientRect().top <= activationLine)
    .at(-1);
  const isAtPageBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
  const activeSection = isAtPageBottom ? sections.at(-1) : currentSection;

  activateLink(activeSection ? `#${activeSection.id}` : '#top');
  activeSectionUpdateScheduled = false;
};

window.addEventListener('scroll', () => {
  siteHeader?.classList.toggle('is-scrolled', window.scrollY > 12);

  if (!activeSectionUpdateScheduled) {
    activeSectionUpdateScheduled = true;
    window.requestAnimationFrame(updateActiveSection);
  }
});

window.addEventListener('resize', updateActiveSection);
updateActiveSection();
