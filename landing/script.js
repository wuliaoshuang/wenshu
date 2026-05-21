const revealTargets = document.querySelectorAll('.steps article, .feature, .role-card, .command-board, .download');

const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  }
}, { threshold: 0.18 });

for (const target of revealTargets) observer.observe(target);

document.documentElement.style.setProperty('--loaded', '1');
