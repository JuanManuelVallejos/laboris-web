// Se ejecuta antes de la hidratación para evitar flash de tema incorrecto.
(function () {
  try {
    var stored = localStorage.getItem('lab-theme');
    var theme = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {}
})();
