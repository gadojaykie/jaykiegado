const body = document.body;
const themeToggle = document.querySelector('.theme-toggle');
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelectorAll('.nav-link');
const navMenu = document.querySelector('.nav-links');
const siteHeader = document.getElementById('siteHeader');
const contactWidgets = document.querySelector('.contact-widgets');
const siteFooter = document.querySelector('.site-footer');

if (contactWidgets instanceof HTMLElement && siteFooter instanceof HTMLElement && 'IntersectionObserver' in window) {
  const footerObserver = new IntersectionObserver(([entry]) => {
    contactWidgets.classList.toggle('is-hidden', entry.isIntersecting);
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

const testimonialSlider = document.querySelector('[data-testimonial-slider]');

if (testimonialSlider instanceof HTMLElement) {
  const slides = Array.from(testimonialSlider.querySelectorAll('.testimonial-slide'));
  const previousButton = testimonialSlider.querySelector('[data-testimonial-prev]');
  const nextButton = testimonialSlider.querySelector('[data-testimonial-next]');
  const position = testimonialSlider.querySelector('.testimonial-position');

  if (
    slides.length > 1
    && previousButton instanceof HTMLButtonElement
    && nextButton instanceof HTMLButtonElement
    && position instanceof HTMLElement
  ) {
    let activeIndex = 0;

    const showSlide = (index) => {
      activeIndex = (index + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => {
        const isActive = slideIndex === activeIndex;
        slide.classList.toggle('is-active', isActive);
        slide.setAttribute('aria-hidden', String(!isActive));
      });
      position.textContent = `${activeIndex + 1} / ${slides.length}`;
    };

    previousButton.addEventListener('click', () => showSlide(activeIndex - 1));
    nextButton.addEventListener('click', () => showSlide(activeIndex + 1));
    showSlide(activeIndex);
    testimonialSlider.classList.add('is-ready');
  }
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
