document.addEventListener("DOMContentLoaded", () => {
  const root = document.documentElement;

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
});
