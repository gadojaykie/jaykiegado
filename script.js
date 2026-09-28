const themeToggle = document.querySelector(".theme-toggle");
const themeIcon = themeToggle.querySelector("span");

themeToggle.addEventListener("click", () => {
  const isDark = document.body.classList.toggle("dark-theme");
  themeIcon.textContent = isDark ? "☀" : "☾";
  themeToggle.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
});

const navLinks = document.querySelectorAll(".nav-link");
const pageSections = [...navLinks]
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter((section) => section && section.id !== "home");

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.forEach((item) => {
      const active = item === link;
      item.classList.toggle("active", active);
      if (active) item.setAttribute("aria-current", "page");
      else item.removeAttribute("aria-current");
    });
  });
});

const sectionObserver = new IntersectionObserver((entries) => {
  if (window.scrollY < 50) {
    navLinks.forEach((link) => {
      const active = link.getAttribute("href") === "#home";
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    return;
  }

  const visible = entries.filter((entry) => entry.isIntersecting)
    .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];
  if (!visible) return;

  navLinks.forEach((link) => {
    const active = link.getAttribute("href") === `#${visible.target.id}`;
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}, { rootMargin: "-15% 0px -65% 0px", threshold: [0, 0.15, 0.4] });

pageSections.forEach((section) => sectionObserver.observe(section));