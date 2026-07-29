// =============================
// BIẾN TOÀN CỤC
// =============================

const IMG_BASE = (typeof seouliveData !== "undefined" && seouliveData.imgUrl)
    ? seouliveData.imgUrl
    : "img";

const liveShowGrid = document.getElementById("liveShowGrid");
const productGrid = document.getElementById("productGrid");
const opportunityGrid = document.getElementById("opportunityGrid");
const brandsGrid = document.getElementById("brandsGrid");
const WISHLIST_KEY = "wishlist";
let products = [];
const STREAM = {
    tag: "Test Live",
    viewersStart: 1234,
    elapsedSeconds: 5678,
    totalSeconds: 91011,
    thumbnail: `${IMG_BASE}/teststream.jpg`,
    chatLines: [
        "Hihi",
        "Hehe",
        "Haha"
    ]
};
const brands = [
    {
        id: 1,
        logo: "ANUA",
        name: "ANUA",
        description: "Famous for its product line made with heartleaf extract, which helps soothe the skin.",
        products: [
            { name: "PDRN Hyaluronic Acid Capsule 100 Serum", price: 15.50, salePrice: 15.50, image: `${IMG_BASE}/placeholder.jpg` },
            { name: "Niacinamide 10 TXA 4 Serum for Brightening and Dark Spots", price: 24.50, salePrice: null, image: `${IMG_BASE}/placeholder.jpg` },
            { name: "Heartleaf LHA Moisture Peeling Gel", price: 15.50, salePrice: 15.50, image: `${IMG_BASE}/placeholder.jpg` }
        ]
    },
    {
        id: 2,
        logo: "rom&nd",
        name: "ROM&ND",
        description: "Featuring lip tints and eyeshadows in trendy shades.",
        products: [
            { name: "Glasting color gloss", price: 15.50, salePrice: 15.50, image: `${IMG_BASE}/placeholder.jpg` },
            { name: "Color lip matte", price: 15.50, salePrice: 15.50, image: `${IMG_BASE}/placeholder.jpg` },
            { name: "Better than cheek", price: 15.50, salePrice: 15.50, image: `${IMG_BASE}/placeholder.jpg` }
        ]
    },
    {
        id: 3,
        logo: "Kaja",
        name: "KAJA",
        description: "A convenient makeup brand with innovative packaging.",
        products: [
            { name: "Beauty Bento", price: 15.50, salePrice: 15.50, image: `${IMG_BASE}/placeholder.jpg` },
            { name: "Bento Pouch", price: 15.50, salePrice: 15.50, image: `${IMG_BASE}/placeholder.jpg` },
            { name: "Whipped Dream", price: 15.50, salePrice: 15.50, image: `${IMG_BASE}/placeholder.jpg` }
        ]
    }
];
const newArrivalsBanners = [
    { id: 1, title: "Shop What Influencers Are Selling — Live", image: `${IMG_BASE}/imgplaceholder.jpg` },
    { id: 2, title: "Shop What Influencers Are Selling — Live", image: `${IMG_BASE}/imgplaceholder.jpg` }
];
const trendingSpotlight = {
    brand: "KAINE",
    name: "Rosemary Relief Gel Cleanser",
    price: 15.50,
    salePrice: 15.50,
    discountLabel: "sale 20%",
    viewingCount: 2553,
    countdownSeconds: 81365, // hiển thị dạng 22 : 36 : 05
    image: `${IMG_BASE}/imgplaceholder.jpg`
};
const trendingRankList = [
    { rank: 1, name: "Rosemary Relief Gel Cleanser" },
    { rank: 2, name: "Rosemary Relief Gel Cleanser" },
    { rank: 3, name: "Rosemary Relief Gel Cleanser" },
    { rank: 4, name: "Rosemary Relief Gel Cleanser" },
    { rank: 5, name: "Rosemary Relief Gel Cleanser" }
];
const instagramFeed = [
    `${IMG_BASE}/imgplaceholder.jpg`, `${IMG_BASE}/imgplaceholder.jpg`, `${IMG_BASE}/imgplaceholder.jpg`,
    `${IMG_BASE}/imgplaceholder.jpg`, `${IMG_BASE}/imgplaceholder.jpg`, `${IMG_BASE}/imgplaceholder.jpg`,
    `${IMG_BASE}/imgplaceholder.jpg`, `${IMG_BASE}/imgplaceholder.jpg`, `${IMG_BASE}/imgplaceholder.jpg`,
    `${IMG_BASE}/imgplaceholder.jpg`, `${IMG_BASE}/imgplaceholder.jpg`, `${IMG_BASE}/imgplaceholder.jpg`
];
const footerColumns = [
    { title: "Information", links: ["Our Story", "Our Journal", "FAQ", "Contact Us"] },
    { title: "Collections", links: ["Face makeup", "Skin care", "Tools", "Gift set"] },
    { title: "Need Some Help ?", links: ["Privacy Policy", "Shipping Info", "Return & Refund Policy", "Payment Methods"] }
];
// =============================
// KHU VỰC GỌI API (Fetch + Async/Await + Loading + Error Handling)
// =============================
function mapApiProductToInternal(item) {
    const hasDiscount = item.discountPercentage > 0;
    const salePrice = item.price;
    const originalPrice = hasDiscount
        ? salePrice / (1 - item.discountPercentage / 100)
        : salePrice;
    let badge = null;
    if (item.discountPercentage >= 15) {
        badge = "BEST SELLER";
    } else if (item.rating >= 4.7) {
        badge = "NEW";
    }
    return {
        id: item.id,
        brand: item.brand || item.category,
        badge,
        name: item.title,
        price: Number(originalPrice.toFixed(2)),
        salePrice: Number(salePrice.toFixed(2)),
        category: item.category,
        image: item.thumbnail,
        isLiveShow: item.id <= 10
    };
}
function showProductsLoading() {
    const section = document.getElementById("productsStatusSection");
    const spinner = document.getElementById("productsSpinner");
    const text = document.getElementById("productsStatusText");
    const retryBtn = document.getElementById("productsRetryBtn");
    if (!section) return;
    section.classList.remove("d-none");
    spinner?.classList.remove("d-none");
    retryBtn?.classList.add("d-none");
    if (text) {
        text.textContent = "Đang tải dữ liệu...";
        text.classList.remove("text-danger");
        text.classList.add("text-muted");
    }
}
function hideProductsStatus() {
    document.getElementById("productsStatusSection")?.classList.add("d-none");
}
function showProductsError(message) {
    const section = document.getElementById("productsStatusSection");
    const spinner = document.getElementById("productsSpinner");
    const text = document.getElementById("productsStatusText");
    const retryBtn = document.getElementById("productsRetryBtn");
    if (!section) return;
    section.classList.remove("d-none");
    spinner?.classList.add("d-none");
    retryBtn?.classList.remove("d-none");
    if (text) {
        text.textContent = message;
        text.classList.remove("text-muted");
        text.classList.add("text-danger");
    }
}

let fetchRequestId = 0;

async function fetchProducts() {
    const requestId = ++fetchRequestId;
    showProductsLoading();
    try {
        const response = await fetch("https://dummyjson.com/products?limit=20");
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();   
        console.log("DummyJSON /products response:", data);

        // Đã có 1 lần gọi mới hơn xảy ra sau lần này -> kết quả này đã lỗi thời, bỏ qua.
        if (requestId !== fetchRequestId) return;

        products = data.products.map(mapApiProductToInternal);
        hideProductsStatus();
        renderCategoryTabs(products);
        renderLiveShows();
        renderOpportunityProducts();
        renderProducts("all");
    } catch (error) {

  
        if (requestId !== fetchRequestId) return;

        console.error("Lỗi khi gọi API sản phẩm:", error);
        showProductsError(`Lỗi kết nối máy chủ, vui lòng thử lại. (${error.message})`);
    }
}
// =============================
// KHU VỰC "CAROUSEL DOTS" (mobile)
// =============================
function initGridCarousel(gridEl, dotsEl) {
    if (!gridEl || !dotsEl) return;
    if (gridEl._carouselAbortController) {
        gridEl._carouselAbortController.abort();
    }
    const controller = new AbortController();
    gridEl._carouselAbortController = controller;
    const items = Array.from(gridEl.children);
    if (items.length === 0) {
        dotsEl.innerHTML = "";
        return;
    }
    dotsEl.innerHTML = items
        .map((_, index) => `
            <button
                class="carousel-dot"
                data-index="${index}"
                aria-label="Đi tới mục ${index + 1}">
            </button>
        `)
        .join("") + `<span class="carousel-dot-indicator" aria-hidden="true"></span>`;
    const dots = Array.from(dotsEl.querySelectorAll(".carousel-dot"));
    const indicator = dotsEl.querySelector(".carousel-dot-indicator");
    function setActiveDot(index){
        dots.forEach(d => d.classList.remove("active"));
        const activeDot = dots[index];
        activeDot?.classList.add("active");
        if (activeDot && indicator) {
            indicator.style.transform =
                `translate(${activeDot.offsetLeft - 1}px, ${activeDot.offsetTop - 1}px)`;
        }
    }
    setActiveDot(0);
    dots.forEach((dot, index)=>{
        dot.addEventListener(
            "click",
            ()=>{
                items[index].scrollIntoView({
                    behavior:"smooth",
                    inline:"start",
                    block:"nearest"
                });
            },
            {
                signal:controller.signal
            }
        );
    });
    let scrollDebounce = null;
    function syncActiveDotFromScroll(){
        const gridLeft = gridEl.getBoundingClientRect().left;
        let closestIndex = 0;
        let closestDistance = Infinity;
        items.forEach((item, index) => {
            const itemLeft = item.getBoundingClientRect().left;
            const distance = Math.abs(itemLeft - gridLeft);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestIndex = index;
            }
        });
        setActiveDot(closestIndex);
    }
    gridEl.addEventListener(
        "scroll",
        () => {
            clearTimeout(scrollDebounce);
            scrollDebounce = setTimeout(syncActiveDotFromScroll, 100);
        },
        {
            signal: controller.signal,
            passive: true
        }
    );
    controller.signal.addEventListener("abort", () => clearTimeout(scrollDebounce));
}
function getWishlist() {
    const wishlist = localStorage.getItem(WISHLIST_KEY);
    return wishlist ? JSON.parse(wishlist) : [];
}
function saveWishlist(wishlist) {
    localStorage.setItem(
        WISHLIST_KEY,
        JSON.stringify(wishlist)
    );
}
function isWishlist(id) {
    return getWishlist().includes(id);
}
function toggleWishlist(id) {
    let wishlist = getWishlist();
    if (wishlist.includes(id)) {
        wishlist = wishlist.filter(item => item !== id);
    }
    else {
        wishlist.push(id);
    }
    saveWishlist(wishlist);
}
const BADGE_COLOR_MAP = {
    "ON AIR": "badge-onair",
    "NEW": "badge-new",
    "BEST SELLER": "badge-bestseller"
};
function getBadgeClass(badge) {

    return BADGE_COLOR_MAP[badge] || "badge-default";

}
function escapeHTML(text) {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
function createProductCard(product, options = {}) {
    const {
        colClass = "col-12 col-sm-6 col-lg-3",
        extraClass = ""
    } = options;
    const wished = isWishlist(product.id);
    return `
    <div class="${colClass}">
        <article class="product-card mx-auto ${extraClass}">
            ${product.badge
                ? `<span class="product-badge ${getBadgeClass(product.badge)}">${escapeHTML(product.badge)}</span>`
                : ""}
            <button
                class="wishlist-btn ${wished ? "active" : ""}"
                data-action="wishlist"
                data-id="${product.id}">
                <i class="fa-heart ${wished ? "fa-solid" : "fa-regular"}"></i>
            </button>
            <div class="product-image quick-view-trigger" role="button" data-id="${product.id}">
                <img
                    src="${encodeURI(product.image)}"
                    alt="${escapeHTML(product.name)}">
                <span class="quick-view-label">
                    <i class="fa-regular fa-eye me-1"></i>Xem chi tiết
                </span>
            </div>
            <div class="product-info">
                <p class="product-brand">${escapeHTML(product.brand ?? "")}</p>
                <h3 class="product-name">${escapeHTML(product.name)}</h3>
                <div class="product-price">
                    <del class="original-price">$${Number(product.price).toFixed(2)}</del>
                    <span class="sale-price">$${Number(product.salePrice).toFixed(2)}</span>
                </div>
            </div>
            <button
                type="button"
                class="btn btn-outline-dark btn-sm w-100 mt-2"
                data-action="cart"
                data-id="${product.id}"
                data-name="${escapeHTML(product.name)}">
                <i class="fa-solid fa-cart-shopping me-1"></i>Add to Cart
            </button>
        </article>
    </div>
    `;
}
function renderLiveShows() {
     if (!liveShowGrid) return;
     const liveProducts = products
        .filter(product => product.isLiveShow)
        .slice(0, 4);
      liveShowGrid.innerHTML = liveProducts
        .map(product => createProductCard(product))
        .join("");
      initGridCarousel(liveShowGrid, document.getElementById("liveShowDots"));
}
let wishlistEventsBound = false;
function bindWishlistEvents() {
    if (wishlistEventsBound) return;
    wishlistEventsBound = true;
    document.addEventListener("click", handleWishlistClick);
}
function handleWishlistClick(event) {
    const button = event.target.closest(".wishlist-btn");
    if (!button) return;
    const id = Number(button.dataset.id);
    toggleWishlist(id);
    const nowWished = isWishlist(id);
    renderLiveShows();
    renderProducts(currentCategory);
    renderOpportunityProducts();
    showToast(
        nowWished
            ? "Đã thêm vào Wishlist ❤️"
            : "Đã bỏ khỏi Wishlist"
    );
}
// =============================
// BOOTSTRAP: TOAST (thông báo góc màn hình)
// =============================
function showToast(message) {
    const toastEl = document.getElementById("appToast");
    if (!toastEl || typeof bootstrap === "undefined") return;
    document.getElementById("appToastBody").textContent = message;
    const toast = bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 2200 });
    toast.show();
}
// =============================
// BOOTSTRAP: ADD TO CART
// =============================]
let cartEventsBound = false;
function bindCartEvents() {
    if (cartEventsBound) return;
    cartEventsBound = true;
    document.addEventListener("click", (event) => {
        const button = event.target.closest('[data-action="cart"]');
        if (!button) return;
        showToast(`Đã thêm "${button.dataset.name}" vào giỏ hàng 🛒`);
    });
}
// =============================
// DYNAMIC ROUTING: Click vào thẻ sản phẩm -> chuyển sang single.html?id=...
// =============================
let productNavigationBound = false;
function bindProductCardNavigation() {
    if (productNavigationBound) return;
    productNavigationBound = true;
    document.addEventListener("click", (event) => {
        const trigger = event.target.closest(".quick-view-trigger");
        if (!trigger) return;
        const id = trigger.dataset.id;
        if (!id) return;
        window.location.href = `single.html?id=${encodeURIComponent(id)}`;
    });
}
function bindMobileMenuAutoFocus() {
    const offcanvasEl = document.getElementById("mobileMenu");

    if (!offcanvasEl) return;
    offcanvasEl.addEventListener("shown.bs.offcanvas", () => {
        offcanvasEl.querySelector('input[type="search"]')?.focus();
    });
}
// =============================
// BIẾN TRẠNG THÁI
// =============================
let currentCategory = "all";
function renderProducts(category = "all") {

    currentCategory = category;
    if (!productGrid) return;
    const productList =
    category === "all"
        ? products
        : products.filter(product => product.category === category);
    productGrid.innerHTML = productList
        .map(product => createProductCard(product))
        .join("");
    initGridCarousel(productGrid, document.getElementById("buyingDots"));
}
function filterProducts(category) {
    renderProducts(category);
}
function renderCategoryTabs(productList) {
    const tabsList = document.getElementById("tabsList");
    if (!tabsList) return;
    const categories = [...new Set(productList.map(product => product.category))];
    const formatLabel = (text) =>
        text
            .split("-")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");

    const allTab = `<li><button class="tab active" data-category="all">All</button></li>`;
    const categoryTabs = categories
        .map(category => `
            <li>
                <button class="tab" data-category="${escapeHTML(category)}">
                    ${escapeHTML(formatLabel(category))}
                </button>
            </li>
        `)
        .join("");
    tabsList.innerHTML = allTab + categoryTabs;
}
function updateActiveTab(activeTab) {
    const tabs = document.querySelectorAll(".tab");
    tabs.forEach(tab => {
        tab.classList.remove("active");
    });
    activeTab.classList.add("active");
}
let tabEventsBound = false;
function bindTabEvents() {
    if (tabEventsBound) return;
    tabEventsBound = true;
    document.addEventListener("click", (event) => {
        const tab = event.target.closest(".tab");
        if (!tab) return;
        const category = tab.dataset.category;
        updateActiveTab(tab);
        filterProducts(category);
    });
}
// =============================
// KHU VỰC "DON'T MISS THIS OPPORTUNITY TODAY"
// =============================
function formatTime(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    const pad = (n) => String(n).padStart(2, "0");
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
function renderOpportunityProducts() {
    if (!opportunityGrid) return;
    // Lấy 3 sản phẩm THẬT từ API (khác với 4 sản phẩm đã hiển thị ở Live Shows)
    // thay vì dữ liệu test cứng ("Test 101/102/103") như trước đây.
    const opportunityProducts = products
        .filter(product => !product.isLiveShow)
        .slice(0, 3);
    opportunityGrid.innerHTML = opportunityProducts
        .map(product => createProductCard(product, {
            colClass: "col-12 col-sm-6 col-lg-4",
            extraClass: "opportunity-card"
        }))
        .join("");
    initGridCarousel(opportunityGrid, document.getElementById("opportunityDots"));
}
function renderStream() {
    const streamThumb = document.getElementById("stream-thumb");
    const streamTag = document.getElementById("stream-tag");
    const streamElapsed = document.getElementById("stream-elapsed");
    const streamTotal = document.getElementById("stream-total");

    if (!streamThumb || !streamTag || !streamElapsed || !streamTotal) return;
    streamThumb.style.backgroundImage = `url("${encodeURI(STREAM.thumbnail)}")`;
    streamTag.textContent = String(STREAM.tag);
    streamElapsed.textContent = formatTime(STREAM.elapsedSeconds);
    streamTotal.textContent = formatTime(STREAM.totalSeconds);
    updateViewerCount(STREAM.viewersStart);
    renderChatLines(STREAM.chatLines);
}
const viewerCount = document.getElementById("viewer-count");
function updateViewerCount(n) {
    if (viewerCount) {
        viewerCount.textContent = n.toLocaleString("en-US");
    }
}
function renderChatLines(lines) {
    const wrap = document.getElementById("chat-lines");
    if (!wrap) return;
    wrap.innerHTML = lines
        .map(line => `<p class="chat-line">${escapeHTML(line)}</p>`)
        .join("");
}
function bindLikeButton() {
    const btn = document.getElementById("like-btn");
    if (!btn) return;
    btn.addEventListener("click", () => {
        const liked = btn.classList.toggle("is-liked");
        if (liked) {
            const heart = document.createElement("span");
            heart.className = "heart-burst";
            heart.textContent = "♥";
            btn.appendChild(heart);
            heart.addEventListener("animationend", () => heart.remove());
        }
    });
}
function startViewerTicker() {
    let current = STREAM.viewersStart;
    setInterval(() => {
        const delta = Math.floor(Math.random() * 7) - 3;
        current = Math.max(1000, current + delta);
        updateViewerCount(current);
    }, 2200);
}
function startClock() {
    const streamElapsed = document.getElementById("stream-elapsed");
    if (!streamElapsed) return;
    let elapsed = STREAM.elapsedSeconds;
    const total = STREAM.totalSeconds;
    setInterval(() => {
        if (elapsed < total) {
            elapsed++;
            streamElapsed.textContent = formatTime(elapsed);
        }
    }, 1000);
}
// =============================
// KHU VỰC "TRUSTED BY LEADING BRANDS"
// =============================
function createBrandProductRow(product) {
    const priceHTML = product.salePrice
        ? `
            <del class="original-price">$${Number(product.price).toFixed(2)}</del>
            <span class="sale-price">$${Number(product.salePrice).toFixed(2)}</span>
        `
        : `<span class="normal-price">$${Number(product.price).toFixed(2)}</span>`;
    return `
    <div class="brand-product">
        <div class="brand-product-image">
            <img 
            src="${encodeURI(product.image)}" 
            alt="${escapeHTML(product.name)}">
        </div>
        <div class="brand-product-info">
            <p class="brand-product-name">${escapeHTML(product.name)}</p>
            <p class="brand-product-price">${priceHTML}</p>
        </div>
    </div>
    `;
}
function createBrandCard(brand) {
    const productsHTML = brand.products
        .map(createBrandProductRow)
        .join("");
    return `
    <article class="brand-card">
        <div class="brand-card-header">
           <div class="brand-logo">${escapeHTML(brand.logo)}</div>
           <h3 class="brand-title">
           <span class="brand-title-name">${escapeHTML(brand.name)}</span>
    -
${escapeHTML(brand.description)}
</h3>
        </div>
        <div class="brand-products">
            ${productsHTML}
        </div>
    </article>
    `;
}
function renderBrands() {
    if (!brandsGrid) return;
    brandsGrid.innerHTML = brands
        .map(createBrandCard)
        .join("");
    initGridCarousel(
        brandsGrid,
        document.getElementById("brandsDots")
    );
}
// =============================
// KHU VỰC "NEW ARRIVALS"
// =============================
function renderArrivals() {
    const grid = document.getElementById("arrivalsGrid");
    if (!grid) return;
    grid.innerHTML = newArrivalsBanners.map(banner => `
        <article class="arrival-banner" style="background-image:url('${encodeURI(banner.image)}')">
        <p class="arrival-title">${escapeHTML(banner.title)}</p>
        <a href="#" class="arrival-link">Watch Live Now
        <i class="fa-solid fa-arrow-right"></i>
    </a>
</article>
    `).join("");
}
// =============================
// KHU VỰC "TRENDING NOW, POPULAR"
// =============================
function renderTrendingSpotlight() {
    const el = document.getElementById("trendingSpotlight");
    if (!el) return;
    const product = trendingSpotlight;
    const countdownText = formatTime(product.countdownSeconds)
        .split(":")
        .join(" : ");
    el.innerHTML = `
        <div class="trending-image" style='background-image:url("${encodeURI(product.image)}")'>
            <span class="trending-live">
                <i class="dot"></i> ${countdownText}
            </span>
            <span class="trending-viewing">
                <i class="fa-solid fa-eye"></i> ${product.viewingCount.toLocaleString("en-US")} Viewing
            </span>
        </div>
        <div class="trending-info">
            <p class="product-brand">${escapeHTML(product.brand)}</p>
            <h3 class="trending-name">${escapeHTML(product.name)}</h3>
            <p class="product-price">
                <del class="original-price">$${Number(product.price).toFixed(2)}</del>
                <span class="sale-price">$${Number(product.salePrice).toFixed(2)}</span>
                ${product.discountLabel
    ? `<span class="discount-tag">(${escapeHTML(product.discountLabel)})</span>`
    : ""}
            </p>
        </div>
    `;
}
function renderTrendingRankList() {
    const list = document.getElementById("trendingRankList");
    if (!list) return;
    list.innerHTML = trendingRankList.map(item => `
        <li class="rank-item">
            <span class="rank-number">${String(item.rank).padStart(2, "0")}</span>
            <span class="rank-name">${escapeHTML(item.name)}</span>
        </li>
    `).join("");
}
// =============================
// KHU VỰC "#SEOULIVE"
// =============================
function renderInstagramFeed() {
    const grid = document.getElementById("instagramGrid");
    if (!grid) return;
    grid.innerHTML = instagramFeed.map(src => `
        <div class="instagram-item">
            <img src="${encodeURI(src)}" alt="#seoulive">
        </div>
    `).join("");
}
// =============================
// FOOTER
// =============================
function renderFooterLinks() {
    const wrap = document.getElementById("footerLinks");
    if (!wrap) return;
    wrap.innerHTML = footerColumns.map(col => `
        <div class="footer-col">
            <h4>${escapeHTML(col.title)}</h4>
            <ul>
                ${col.links
    .map(link =>
        `<li><a href="#">${escapeHTML(link)}</a></li>`
    )
    .join("")}
            </ul>
        </div>
    `).join("");
}
// =============================
// KHU VỰC "TRANG CHI TIẾT SẢN PHẨM" (single.html)
// Đọc ?id= trên URL (URLSearchParams) -> fetch đúng 1 sản phẩm -> render
// =============================
function showSingleLoading() {
    const section = document.getElementById("singleStatusSection");
    const spinner = document.getElementById("singleSpinner");
    const text = document.getElementById("singleStatusText");
    const retryBtn = document.getElementById("singleRetryBtn");
    if (!section) return;
    document.getElementById("singleProductContent")?.classList.add("d-none");
    section.classList.remove("d-none");
    spinner?.classList.remove("d-none");
    retryBtn?.classList.add("d-none");
    if (text) {
        text.textContent = "Đang tải dữ liệu...";
        text.classList.remove("text-danger");
        text.classList.add("text-muted");
    }
}
function hideSingleStatus() {
    document.getElementById("singleStatusSection")?.classList.add("d-none");
}
function showSingleError(message) {
    const section = document.getElementById("singleStatusSection");
    const spinner = document.getElementById("singleSpinner");
    const text = document.getElementById("singleStatusText");
    const retryBtn = document.getElementById("singleRetryBtn");
    if (!section) return;
    document.getElementById("singleProductContent")?.classList.add("d-none");
    section.classList.remove("d-none");
    spinner?.classList.add("d-none");
    retryBtn?.classList.remove("d-none");
    if (text) {
        text.textContent = message;
        text.classList.remove("text-muted");
        text.classList.add("text-danger");
    }
}
function renderSingleProduct(item) {
    const product = mapApiProductToInternal(item);

    document.title = `${product.name} — Seoulive`;
    const breadcrumb = document.getElementById("singleBreadcrumbName");
    if (breadcrumb) breadcrumb.textContent = product.name;

    const badgeEl = document.getElementById("singleBadge");
    if (badgeEl) {
        if (product.badge) {
            badgeEl.textContent = product.badge;
            badgeEl.className = `product-badge ${getBadgeClass(product.badge)}`;
            badgeEl.classList.remove("d-none");
        } else {
            badgeEl.classList.add("d-none");
        }
    }

    const imageEl = document.getElementById("singleImage");
    if (imageEl) {
        imageEl.src = encodeURI(product.image);
        imageEl.alt = product.name;
    }

    document.getElementById("singleBrand").textContent = product.brand ?? "";
    document.getElementById("singleName").textContent = product.name;
    document.getElementById("singleRating").innerHTML =
        `<i class="fa-solid fa-star text-warning"></i> ${Number(item.rating ?? 0).toFixed(1)}`;
    document.getElementById("singleStock").textContent =
        item.stock > 0 ? `Còn hàng (${item.stock})` : "Hết hàng";
    document.getElementById("singleOriginalPrice").textContent = `$${Number(product.price).toFixed(2)}`;
    document.getElementById("singleSalePrice").textContent = `$${Number(product.salePrice).toFixed(2)}`;
    document.getElementById("singleDescription").textContent = item.description ?? "";

    const addToCartBtn = document.getElementById("singleAddToCart");
    if (addToCartBtn) {
        addToCartBtn.onclick = () => showToast(`Đã thêm "${product.name}" vào giỏ hàng 🛒`);
    }

    const wishlistBtn = document.getElementById("singleWishlistBtn");
    const wishlistIcon = document.getElementById("singleWishlistIcon");
    const wishlistLabel = document.getElementById("singleWishlistLabel");
    function syncWishlistUI() {
        const wished = isWishlist(product.id);
        if (wishlistIcon) wishlistIcon.className = `fa-heart me-2 ${wished ? "fa-solid" : "fa-regular"}`;
        if (wishlistLabel) wishlistLabel.textContent = wished ? "Đã thích" : "Add to Wishlist";
    }
    syncWishlistUI();
    if (wishlistBtn) {
        wishlistBtn.onclick = () => {
            toggleWishlist(product.id);
            syncWishlistUI();
            showToast(
                isWishlist(product.id)
                    ? "Đã thêm vào Wishlist ❤️"
                    : "Đã bỏ khỏi Wishlist"
            );
        };
    }
}

let singleFetchRequestId = 0;
async function fetchSingleProduct() {
    const requestId = ++singleFetchRequestId;
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) {
        showSingleError("Không tìm thấy sản phẩm (thiếu ID trên URL).");
        return;
    }
    showSingleLoading();
    try {
        const response = await fetch(`https://dummyjson.com/products/${encodeURIComponent(id)}`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const item = await response.json();
        console.log("DummyJSON /products/:id response:", item);

        if (requestId !== singleFetchRequestId) return;

        renderSingleProduct(item);
        hideSingleStatus();
        document.getElementById("singleProductContent")?.classList.remove("d-none");
    } catch (error) {
        if (requestId !== singleFetchRequestId) return;

        console.error("Lỗi khi gọi API chi tiết sản phẩm:", error);
        showSingleError(`Lỗi kết nối máy chủ, vui lòng thử lại. (${error.message})`);
    }
}
async function init() {
    
    bindWishlistEvents();
    bindCartEvents();
    bindProductCardNavigation();
    bindMobileMenuAutoFocus();
    renderFooterLinks();

    if (document.getElementById("productGrid")) {
        
        bindTabEvents();
        renderStream();
        bindLikeButton();
        startViewerTicker();
        startClock();
        renderBrands();
        renderArrivals();
        renderTrendingSpotlight();
        renderTrendingRankList();
        renderInstagramFeed();
        fetchProducts();
    }

    if (document.getElementById("singleProductContent")) {
        // Trang chi tiết sản phẩm (single.html)
        fetchSingleProduct();
    }
}
document.getElementById("productsRetryBtn")?.addEventListener("click", fetchProducts);
document.getElementById("singleRetryBtn")?.addEventListener("click", fetchSingleProduct);
// =============================
// KHỞI CHẠY ỨNG DỤNG
// =============================
init();