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

const pricingCurrency = document.querySelector('#pricingCurrency');
const currencyNote = document.querySelector('#currencyNote');
const prices = Array.from(document.querySelectorAll('[data-php-price]'));
const packageOptions = Array.from(document.querySelectorAll('#inquiryPackage option[data-php-price]'));

if (pricingCurrency instanceof HTMLSelectElement && currencyNote instanceof HTMLElement && prices.length > 0) {
  const currencySymbols = {
    PHP: '₱',
    USD: '$',
    EUR: '€',
    GBP: '£',
    CAD: 'CA$',
    AUD: 'A$',
    SGD: 'S$',
    JPY: '¥'
  };
  const currencies = Object.keys(currencySymbols);
  let exchangeRatesPromise;
  let requestNumber = 0;
  const requiredCurrencies = currencies.filter((currency) => currency !== 'PHP');

  const formatPrice = (amount, currency) => {
    const fractionDigits = currency === 'PHP' || currency === 'JPY' ? 0 : 2;
    const formattedAmount = new Intl.NumberFormat(undefined, {
      maximumFractionDigits: fractionDigits,
      minimumFractionDigits: 0
    }).format(amount);

    return `${currencySymbols[currency]}${formattedAmount}`;
  };

  const setPrices = (currency, rate) => {
    prices.forEach((price) => {
      const amount = Number(price.dataset.phpPrice) * rate;
      const suffix = price.dataset.priceSuffix || '';
      price.textContent = `${formatPrice(amount, currency)}${suffix}`;
    });

    packageOptions.forEach((option) => {
      const amount = Number(option.dataset.phpPrice) * rate;
      option.textContent = `${option.value} — starting at ${formatPrice(amount, currency)}`;
    });
  };

  const loadExchangeRates = () => {
    if (!exchangeRatesPromise) {
      const query = new URLSearchParams({
        base: 'PHP',
        quotes: requiredCurrencies.join(',')
      });
      const controllers = [];
      const fetchRates = async (url, parseRates) => {
        const controller = new AbortController();
        controllers.push(controller);
        const timeoutId = window.setTimeout(() => controller.abort(), 8000);

        try {
          const response = await fetch(url, { signal: controller.signal });
          if (!response.ok) {
            throw new Error(`Exchange-rate service returned status ${response.status}`);
          }

          const result = parseRates(await response.json());
          if (!result.date || requiredCurrencies.some((currency) => !Number.isFinite(result.rates.get(currency)) || result.rates.get(currency) <= 0)) {
            throw new Error('Exchange-rate service returned incomplete rates');
          }

          return result;
        } finally {
          window.clearTimeout(timeoutId);
        }
      };
      const frankfurterRates = fetchRates(`https://api.frankfurter.dev/v2/rates?${query}`, (rates) => {
        if (!Array.isArray(rates) || rates.length === 0) {
          throw new Error('Frankfurter returned no rates');
        }
        return {
          date: rates[0].date,
          rates: new Map(rates.map(({ quote, rate }) => [quote, Number(rate)]))
        };
      });
      const openExchangeRates = fetchRates('https://open.er-api.com/v6/latest/PHP', (response) => {
        if (response.result !== 'success' || response.base_code !== 'PHP' || !response.rates) {
          throw new Error('Exchange-rate backup returned an invalid response');
        }
        return {
          date: new Date(response.time_last_update_utc).toISOString().slice(0, 10),
          rates: new Map(requiredCurrencies.map((currency) => [currency, Number(response.rates[currency])]))
        };
      });

      exchangeRatesPromise = Promise.any([frankfurterRates, openExchangeRates])
        .then((result) => {
          controllers.forEach((controller) => controller.abort());
          return result;
        })
        .catch((error) => {
          controllers.forEach((controller) => controller.abort());
          exchangeRatesPromise = undefined;
          throw error;
        });
    }

    return exchangeRatesPromise;
  };

  pricingCurrency.addEventListener('change', async () => {
    const currency = pricingCurrency.value;
    const thisRequest = ++requestNumber;

    if (currency === 'PHP') {
      setPrices('PHP', 1);
      currencyNote.textContent = 'Prices are shown in PHP. Converted prices are approximate; final quotations are provided in PHP.';
      return;
    }

    if (!currencySymbols[currency]) {
      pricingCurrency.value = 'PHP';
      setPrices('PHP', 1);
      currencyNote.textContent = 'That currency is unavailable. Prices are shown in PHP.';
      return;
    }

    currencyNote.textContent = 'Loading the latest exchange rates…';

    try {
      const { date, rates } = await loadExchangeRates();
      if (thisRequest !== requestNumber) {
        return;
      }

      setPrices(currency, rates.get(currency));
      currencyNote.textContent = `Approximate conversion using rates dated ${date}. Final quotations are provided in PHP.`;
    } catch (error) {
      if (thisRequest !== requestNumber) {
        return;
      }

      console.error('Unable to load pricing exchange rates.', error);
      pricingCurrency.value = 'PHP';
      setPrices('PHP', 1);
      currencyNote.textContent = 'Exchange rates could not be loaded. Prices are shown in PHP; final quotations are provided in PHP.';
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
