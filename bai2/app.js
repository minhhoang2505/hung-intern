const books = [
    {
      title: "Python Programming (E-book)",
      image: "img/imgplaceholder.jpg",
      desc: "Python is the most widely used and versatile programming language i...",
      price: "19,000₮",
      oldPrice: "39,000₮",
      free: false
    },
    {
      title: "HTML, CSS, and JavaScript Basics (E-book)",
      image: "img/imgplaceholder.jpg",
      desc: "The basics of modern web development from scratch! In this e-book,...",
      free: true
    },
    {
      title: "Data Structures and Algorithms (E-book)",
      image: "img/imgplaceholder.jpg",
      desc: "This e-guide provides an understanding of the basic concepts and...",
      free: true
    },
    {
      title: "Business Excel (E-book)",
      image: "img/imgplaceholder.jpg",
      desc: "An electronic workbook that combines the m... commonly used fo...",
      price: "19,000₮",
      oldPrice: "39,000₮",
      free: false
    },
    {
      title: "Data Analysis SPSS (E-book)",
      image: "img/imgplaceholder.jpg",
      desc: "This book covers everything from selecting a research topic and...",
      price: "19,000₮",
      oldPrice: "45,000₮",
      free: false
    },
    {
      title: "Descriptive Statistics (E-book)",
      image: "img/imgplaceholder.jpg",
      desc: "Descriptive statistics summarize the main characteristics of a data...",
      free: true
    }
  ];

  const grid = document.getElementById('bookGrid');
  grid.innerHTML = books.map(b => `
    <div class="book-card">
      <div class="book-cover"><img src="${b.image}" alt="${b.title}"></div>
      <div class="book-info">
        <p class="book-title">${b.title}</p>
        <p class="book-desc">${b.desc}</p>
        ${
          b.free
            ? `<span class="book-price free">Free</span>`
            : `<span class="book-price">${b.price}</span> <span class="book-price-old">${b.oldPrice}</span>`
        }
      </div>
    </div>
  `).join('');

  // Sort dropdown open/close (visual only, no data logic)
  const sortBtn = document.getElementById('sortBtn');
  const sortMenu = document.getElementById('sortMenu');
  const sortLabel = document.getElementById('sortLabel');

  sortBtn.addEventListener('click', () => {
    sortBtn.classList.toggle('open');
    sortMenu.classList.toggle('open');
  });

  sortMenu.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      sortMenu.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      sortLabel.textContent = btn.dataset.label;
      sortBtn.classList.remove('open');
      sortMenu.classList.remove('open');
    });
  });

  document.addEventListener('click', (e) => {
    if (!sortBtn.contains(e.target) && !sortMenu.contains(e.target)) {
      sortBtn.classList.remove('open');
      sortMenu.classList.remove('open');
    }
  });

  // Other Technologies collapse toggle (visual only)
  const otherTechBtn = document.getElementById('otherTechBtn');
  const otherTechPanel = document.getElementById('otherTechPanel');
  otherTechBtn.addEventListener('click', () => {
    otherTechBtn.classList.toggle('open');
    otherTechPanel.classList.toggle('open');
  });

  // Back to top button
  const backToTop = document.getElementById('backToTop');
  window.addEventListener('scroll', () => {
    backToTop.classList.toggle('show', window.scrollY > 300);
  });
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });