if (!window.__headerMenuInitialized) {
  window.__headerMenuInitialized = true;

  const toggleMenu = () => {
    const bookmark = document.querySelector(".bookmark");
    const navList = document.querySelector(".nav-list");
    if (!bookmark || !navList) return;
    bookmark.classList.toggle("active");
    navList.classList.toggle("none");
  };

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest(".dot")) {
      toggleMenu();
    }
  });
}
