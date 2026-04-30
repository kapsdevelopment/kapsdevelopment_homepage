(function () {
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-nav-toggle]").forEach((button) => {
      const header = button.closest(".site-header");
      const nav = header?.querySelector("[data-site-nav]");
      if (!nav) return;

      button.addEventListener("click", () => {
        const isOpen = nav.classList.toggle("is-open");
        button.setAttribute("aria-expanded", String(isOpen));
      });

      nav.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
          nav.classList.remove("is-open");
          button.setAttribute("aria-expanded", "false");
        });
      });
    });
  });
})();
