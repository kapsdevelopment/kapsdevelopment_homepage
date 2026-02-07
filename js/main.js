document.addEventListener("DOMContentLoaded", () => {
  const root = document.documentElement;

document.querySelectorAll(".js-stop").forEach((el) => {
  el.addEventListener("click", (e) => e.stopPropagation());
});


  // Dark mode toggles
  const themeDesktop = document.getElementById("theme-toggle-desktop");
  const themeMobile = document.getElementById("theme-toggle-mobile");

  const toggleTheme = () => {
    root.classList.toggle("dark");
  };

  themeDesktop?.addEventListener("click", toggleTheme);
  themeMobile?.addEventListener("click", toggleTheme);

  // Mobile menu
  const menuBtn = document.getElementById("menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener("click", () => {
      const isHidden = mobileMenu.classList.toggle("hidden");
      menuBtn.setAttribute("aria-expanded", String(!isHidden));
    });

    mobileMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        mobileMenu.classList.add("hidden");
        menuBtn.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Prevent double submit on contact form
  const form = document.querySelector("#contact form");

  if (form) {
    form.addEventListener("submit", () => {
      const button = form.querySelector('button[type="submit"]');
      if (button) {
        button.disabled = true;
        button.textContent = "Sending…";
      }
    });
  }

  // ---------------------------------------
  // Phone screenshot rotators (auto + tap)
  // ---------------------------------------
  const screens = document.querySelectorAll(".js-phone");

  screens.forEach((screen) => {
    const imgs = Array.from(screen.querySelectorAll(".screens img"));
    if (imgs.length <= 1) return;

    let idx = 0;

    // Ensure first is active
    imgs.forEach((img, i) => img.classList.toggle("active", i === 0));

    const show = (i) => {
      imgs.forEach((img, n) => img.classList.toggle("active", n === i));
    };

    const next = () => {
      idx = (idx + 1) % imgs.length;
      show(idx);
    };

    // Auto rotate
    let timer = setInterval(next, 3500);

    // Tap/click
    screen.addEventListener("click", next);

    // Pause auto when user interacts (optional, feels nice)
    const stopAuto = () => {
      if (!timer) return;
      clearInterval(timer);
      timer = null;
    };
    screen.addEventListener("pointerdown", stopAuto, { once: true });
  });
    // ---------------------------------------
  // Clickable app cards (whole card -> link)
  // ---------------------------------------
  const appCards = document.querySelectorAll("[data-href]");

  appCards.forEach((card) => {
    // a11y
    card.setAttribute("role", "link");
    card.setAttribute("tabindex", "0");

    const href = card.getAttribute("data-href");
    if (!href) return;

    const go = () => (window.location.href = href);

    card.addEventListener("click", go);

    card.addEventListener("keydown", (e) => {
      // Enter/Space should activate
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        go();
      }
    });
  });

  // Prevent phone taps from triggering card navigation
  document.querySelectorAll(".js-phone").forEach((screen) => {
    screen.addEventListener("click", (e) => e.stopPropagation());
    screen.addEventListener("keydown", (e) => e.stopPropagation());
  });
});
