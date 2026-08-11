// =============================
// BIẾN TOÀN CỤC
// =============================

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
    thumbnail: "img/teststream.jpg",
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
            { name: "PDRN Hyaluronic Acid Capsule 100 Serum", price: 15.50, salePrice: 15.50, image: "img/placeholder.jpg" },
            { name: "Niacinamide 10 TXA 4 Serum for Brightening and Dark Spots", price: 24.50, salePrice: null, image: "img/placeholder.jpg" },
            { name: "Heartleaf LHA Moisture Peeling Gel", price: 15.50, salePrice: 15.50, image: "img/placeholder.jpg" }
        ]
    },
    {
        id: 2,
        logo: "rom&nd",
        name: "ROM&ND",
        description: "Featuring lip tints and eyeshadows in trendy shades.",
        products: [
            { name: "Glasting color gloss", price: 15.50, salePrice: 15.50, image: "img/placeholder.jpg" },
            { name: "Color lip matte", price: 15.50, salePrice: 15.50, image: "img/placeholder.jpg" },
            { name: "Better than cheek", price: 15.50, salePrice: 15.50, image: "img/placeholder.jpg" }
        ]
    },
    {
        id: 3,
        logo: "Kaja",
        name: "KAJA",
        description: "A convenient makeup brand with innovative packaging.",
        products: [
            { name: "Beauty Bento", price: 15.50, salePrice: 15.50, image: "img/placeholder.jpg" },
            { name: "Bento Pouch", price: 15.50, salePrice: 15.50, image: "img/placeholder.jpg" },
            { name: "Whipped Dream", price: 15.50, salePrice: 15.50, image: "img/placeholder.jpg" }
        ]
    }
];
const newArrivalsBanners = [
    { id: 1, title: "Shop What Influencers Are Selling — Live", image: "img/imgplaceholder.jpg" },
    { id: 2, title: "Shop What Influencers Are Selling — Live", image: "img/imgplaceholder.jpg" }
];
const trendingSpotlight = {
    brand: "KAINE",
    name: "Rosemary Relief Gel Cleanser",
    price: 15.50,
    salePrice: 15.50,
    discountLabel: "sale 20%",
    viewingCount: 2553,
    countdownSeconds: 81365, // hiển thị dạng 22 : 36 : 05
    image: "img/imgplaceholder.jpg"
};
const trendingRankList = [
    { rank: 1, name: "Rosemary Relief Gel Cleanser" },
    { rank: 2, name: "Rosemary Relief Gel Cleanser" },
    { rank: 3, name: "Rosemary Relief Gel Cleanser" },
    { rank: 4, name: "Rosemary Relief Gel Cleanser" },
    { rank: 5, name: "Rosemary Relief Gel Cleanser" }
];
const instagramFeed = [
    "img/imgplaceholder.jpg", "img/imgplaceholder.jpg", "img/imgplaceholder.jpg",
    "img/imgplaceholder.jpg", "img/imgplaceholder.jpg", "img/imgplaceholder.jpg",
    "img/imgplaceholder.jpg", "img/imgplaceholder.jpg", "img/imgplaceholder.jpg",
    "img/imgplaceholder.jpg", "img/imgplaceholder.jpg", "img/imgplaceholder.jpg"
];
const footerColumns = [
    { title: "Information", links: ["Our Story", "Our Journal", "FAQ", "Contact Us"] },
    { title: "Collections", links: ["Face makeup", "Skin care", "Tools", "Gift set"] },
    { title: "Need Some Help ?", links: ["Privacy Policy", "Shipping Info", "Return & Refund Policy", "Payment Methods"] }
];
// =============================
// KHU VỰC "CẮT" LAYOUT (Header / Footer dùng chung cho mọi trang)
// =============================
// Dùng fetch() để lấy nội dung 1 file HTML "component" (header.html/footer.html)
// rồi nhúng (innerHTML) vào đúng vị trí placeholder trên trang.
async function loadPartial(url, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        container.innerHTML = await response.text();
    } catch (error) {
        console.error(`Lỗi khi tải ${url}:`, error);
    }
}
// Nhúng header.html vào đầu trang (#siteHeader) và footer.html vào cuối trang
// (#siteFooter). Chạy song song bằng Promise.all và luôn được "await" ở init()
// để đảm bảo các phần tử bên trong header/footer (VD: #footerLinks, #appToast)
// đã tồn tại trên DOM trước khi các hàm render/bind khác chạy tới.
async function loadLayout() {
    await Promise.all([
        loadPartial("header.html", "siteHeader"),
        loadPartial("footer.html", "siteFooter")
    ]);
}
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
// requestId tăng dần mỗi lần gọi fetchProducts(). Dùng để nhận biết và BỎ QUA
// kết quả của 1 lần gọi cũ (vd: request đầu bị chặn/mạng chậm, phản hồi trễ)
// nếu lúc nó về thì đã có 1 lần gọi MỚI hơn (bấm "Thử lại") — tránh tình trạng
// request cũ về sau ghi đè giao diện đã load thành công của request mới.
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
        renderOpportunityProducts();
        renderProducts("all");
    } catch (error) {

        // Cùng lý do: lỗi của 1 request cũ đã bị thay thế thì không hiển thị nữa.
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
// =============================
// CATEGORY SLIDER — kéo chuột/vuốt tay ngang (thay khu vực Live Shows)
// =============================
const CATEGORY_MARQUEE_ITEMS = [
    { name: "SHIFT Collection", img: "img/imgplaceholder.jpg" },
    { name: "Giày", img: "img/imgplaceholder.jpg" },
    { name: "Túi", img: "img/imgplaceholder.jpg" },
    { name: "Ví", img: "img/imgplaceholder.jpg" },
    { name: "Thắt lưng", img: "img/imgplaceholder.jpg" },
    { name: "Dép", img: "img/imgplaceholder.jpg" },
    { name: "Chăm sóc đồ da", img: "img/imgplaceholder.jpg" },
    { name: "Quà tặng nam giới", img: "img/imgplaceholder.jpg" },
];
function renderLiveShows() {
    const track = document.getElementById("categoryTrack");
    if (!track) return;
    // Nhân 3 bộ danh mục giống hệt nhau để làm vùng đệm 2 bên: khi kéo tới
    // gần hết 1 bộ, JS sẽ "nhảy" scrollLeft sang bộ kế bên (nội dung y hệt
    // nên mắt không nhận ra) -> tạo cảm giác kéo lặp vô hạn theo cả 2 hướng.
    const items = [...CATEGORY_MARQUEE_ITEMS, ...CATEGORY_MARQUEE_ITEMS, ...CATEGORY_MARQUEE_ITEMS];
    track.innerHTML = items
        .map(item => `
            <a href="#" class="cat-tile" draggable="false">
                <img src="${item.img}" alt="${escapeHTML(item.name)}" loading="lazy" draggable="false">
                <span>${escapeHTML(item.name)}</span>
            </a>
        `)
        .join("");
}

// Kéo giữ chuột để cuộn ngang, lặp vô hạn cả 2 chiều (giữ chuột trái, kéo
// qua kéo lại). Trên điện thoại/máy tính bảng, cuộn ngang bằng ngón tay đã
// hoạt động sẵn nhờ overflow-x:auto của trình duyệt nên không cần xử lý
// thêm cho touch — chỉ bắt sự kiện pointer khi pointerType là "mouse" để
// tránh giẫm lên cơ chế cuộn chạm mặc định (nếu bắt cả touch, gọi
// setPointerCapture sẽ chặn mất native scroll trên mobile).
function initCategorySlider() {
    const el = document.getElementById("categoryMarquee");
    const track = document.getElementById("categoryTrack");
    if (!el || !track) return;

    let setWidth = 0; // chiều rộng của 1 bộ danh mục (track.scrollWidth / 3)

    function measure() {
        setWidth = track.scrollWidth / 3;
    }

    measure();
    el.scrollLeft = setWidth; // xuất phát ở bộ giữa để còn biên độ nhảy cả 2 hướng

    let isDown = false;
    let startX = 0;
    let startScroll = 0;
    let didDrag = false; // đã kéo đủ xa chưa -> dùng để chặn click vào link ngay sau khi kéo

    function onPointerDown(event) {
        if (event.pointerType === "touch") return;
        if (event.button !== undefined && event.button !== 0) return;
        if (!setWidth) measure(); // phòng khi lần đo đầu tiên bị lỡ (track chưa có nội dung lúc đó)
        isDown = true;
        didDrag = false;
        startX = event.clientX;
        startScroll = el.scrollLeft;
        el.classList.add("dragging");
        el.setPointerCapture?.(event.pointerId);
    }

    function onPointerMove(event) {
        if (!isDown || !setWidth) return;
        const deltaX = event.clientX - startX;
        if (Math.abs(deltaX) > 4) didDrag = true;
        el.scrollLeft = startScroll - deltaX;
        // Vừa vượt qua mép bộ giữa -> nhảy sang bộ liền kề (giống hệt nội
        // dung) và dịch luôn mốc "startScroll" theo đúng khoảng đã nhảy, để
        // lần tính deltaX kế tiếp không bị lệch/giật ngược lại.
        if (el.scrollLeft < setWidth * 0.5) {
            el.scrollLeft += setWidth;
            startScroll += setWidth;
        } else if (el.scrollLeft > setWidth * 1.5) {
            el.scrollLeft -= setWidth;
            startScroll -= setWidth;
        }
    }

    function onPointerUp() {
        if (!isDown) return;
        isDown = false;
        el.classList.remove("dragging");
    }

    // Cuộn chạm (touch) trên mobile đi qua cơ chế native của trình duyệt,
    // không qua onPointerMove ở trên, nên cần 1 chốt chặn riêng ở đây để
    // vẫn "nhảy" bộ khi cuộn chạm/lướt đà (momentum) chạm gần mép.
    function onScroll() {
        if (isDown || !setWidth) return;
        if (el.scrollLeft < setWidth * 0.5) {
            el.scrollLeft += setWidth;
        } else if (el.scrollLeft > setWidth * 1.5) {
            el.scrollLeft -= setWidth;
        }
    }

    // Trình duyệt cho phép kéo-thả mặc định với thẻ <a>/<img> (kéo link, kéo
    // ảnh ra ngoài...). Hành vi này khởi động TRƯỚC khi pointermove của mình
    // kịp xử lý, nên chiếm mất thao tác kéo ngang -> phải chặn hẳn dragstart
    // thì mới kéo được, dù đã có draggable="false" trong HTML.
    el.addEventListener("dragstart", (event) => event.preventDefault());

    el.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    el.addEventListener("scroll", onScroll);

    // Kích thước item dùng đơn vị vw nên đổi theo bề rộng màn hình -> đo lại
    // setWidth khi resize, đồng thời giữ nguyên vị trí tương đối (tỉ lệ %
    // trong 1 bộ) để không bị giật hình khi xoay màn hình/resize cửa sổ.
    window.addEventListener("resize", () => {
        const prevSetWidth = setWidth;
        const ratio = prevSetWidth ? (el.scrollLeft % prevSetWidth) / prevSetWidth : 0;
        measure();
        el.scrollLeft = setWidth + ratio * setWidth;
    });

    // Sau khi vừa kéo (didDrag=true), chặn click phát sinh trên thẻ <a> bên
    // trong để không bị nhảy trang ngoài ý muốn ngay khi người dùng thả chuột.
    el.addEventListener("click", (event) => {
        if (didDrag) {
            event.preventDefault();
            event.stopPropagation();
        }
    }, true);
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
// Giao tiếp giữa 2 trang HTML tĩnh (index.html -> single.html) thông qua
// query string trên thanh địa chỉ URL, sẽ được single.html đọc lại bằng
// URLSearchParams(window.location.search).
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
// requestId tăng dần: cùng lý do với fetchProducts(), tránh 1 request cũ
// (VD: đổi id liên tục / bấm "Thử lại") ghi đè lên kết quả của request mới hơn.
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
// =============================
// HEADER: hiệu ứng thu nhỏ/phóng to + đổi màu nền theo scroll
// =============================
// Ngưỡng scroll (px) để chuyển header từ trạng thái "phóng to, nền trong suốt"
// sang "thu nhỏ, nền trắng". Gắn listener ngay từ đầu (không cần chờ header.html
// load xong) vì hiệu ứng chỉ dựa vào 1 class trên <body>, còn CSS lo phần hiển thị.
const HEADER_SCROLL_THRESHOLD = 60;

function updateHeaderScrollState() {
    const shouldShrink = window.scrollY > HEADER_SCROLL_THRESHOLD;
    document.body.classList.toggle("header-scrolled", shouldShrink);
}

function bindHeaderScrollEffect() {
    updateHeaderScrollState();
    window.addEventListener("scroll", updateHeaderScrollState, { passive: true });
}

// Bấm icon kính lúp -> mở ô tìm kiếm (phủ lên toàn bộ thanh header).
// Dùng event delegation trên document vì header.html được nhúng bất đồng bộ
// (loadPartial) nên không thể addEventListener trực tiếp lên phần tử trước khi nó tồn tại.
function bindHeaderSearchToggle() {
    document.addEventListener("click", (event) => {
        const headerEl = document.querySelector(".header");
        if (!headerEl) return;

        const openBtn = event.target.closest(".search-toggle");
        const closeBtn = event.target.closest(".search-close");

        if (openBtn) {
            headerEl.classList.add("search-open");
            openBtn.setAttribute("aria-expanded", "true");
            headerEl.querySelector(".search-form input")?.focus();
            return;
        }

        if (closeBtn || (headerEl.classList.contains("search-open") && !event.target.closest(".search-form"))) {
            headerEl.classList.remove("search-open");
            headerEl.querySelector(".search-toggle")?.setAttribute("aria-expanded", "false");
        }
    });

    // Nhấn Esc để đóng ô tìm kiếm.
    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        const headerEl = document.querySelector(".header.search-open");
        headerEl?.classList.remove("search-open");
    });
}

// =============================
// ANNOUNCEMENT BAR: đóng bằng nút X, có animation trượt lên (CSS lo phần
// animation qua class "is-closed"), nhớ trạng thái đã đóng trong phiên làm
// việc (sessionStorage) để không hiện lại khi chuyển trang/tải lại.
// =============================
const ANNOUNCEMENT_CLOSED_KEY = "announcementClosed";

function bindAnnouncementClose() {
    // Nếu trước đó người dùng đã đóng trong phiên này, ẩn luôn không cần animation.
    if (sessionStorage.getItem(ANNOUNCEMENT_CLOSED_KEY) === "1") {
        document.getElementById("announcementBar")?.classList.add("is-closed");
    }

    // Dùng delegation trên document vì header.html được nhúng bất đồng bộ
    // (loadPartial) nên nút #announcementClose chưa tồn tại lúc gắn listener.
    document.addEventListener("click", (event) => {
        const closeBtn = event.target.closest("#announcementClose");
        if (!closeBtn) return;

        document.getElementById("announcementBar")?.classList.add("is-closed");
        sessionStorage.setItem(ANNOUNCEMENT_CLOSED_KEY, "1");
    });
}

// Tự động luân phiên các dòng thông báo (announcement-item) theo hiệu ứng
// trượt dọc: dòng cũ trượt lên & mờ dần ra khỏi khung, dòng mới trượt lên
// & hiện dần vào đúng lúc đó (kiểu carousel dọc, giống ticker). Hàm này chỉ
// cần gọi 1 lần sau khi header.html đã được nhúng xong (loadLayout() đã
// await), vì vậy có thể query thẳng #announcementTrack thay vì delegation.
function bindAnnouncementTicker() {
    const track = document.getElementById("announcementTrack");
    if (!track) return;

    const items = Array.from(track.querySelectorAll(".announcement-item"));
    if (items.length < 2) return; // chỉ 1 dòng thì không cần luân phiên

    let activeIndex = items.findIndex((item) => item.classList.contains("is-active"));
    if (activeIndex === -1) activeIndex = 0;

    setInterval(() => {
        const current = items[activeIndex];
        const nextIndex = (activeIndex + 1) % items.length;
        const next = items[nextIndex];

        // Dòng đang hiện: trượt lên & mờ dần ra khỏi khung (is-leaving).
        current.classList.remove("is-active");
        current.classList.add("is-leaving");

        // Dòng kế tiếp: đưa vào đúng lúc, trượt từ dưới lên vào giữa khung.
        next.classList.add("is-active");

        // Sau khi hiệu ứng kết thúc, "chốt" lại dòng vừa rời đi về đúng vị trí
        // xuất phát (dưới khung, không animation) để sẵn sàng cho lượt sau.
        window.setTimeout(() => {
            current.classList.remove("is-leaving");
        }, 520);

        activeIndex = nextIndex;
    }, 3500);
}

// =============================
// HERO: slider ảnh nền kéo được bằng chuột/vuốt tay + tự động chuyển + chấm điều hướng
// =============================
const HERO_SLIDES = ["img/clipbg.jpg", "img/clipbg.jpg", "img/clipbg.jpg"];
const HERO_AUTOPLAY_MS = 5000;
const HERO_SWIPE_THRESHOLD_RATIO = 0.12; // kéo quá 12% chiều rộng hero -> đổi slide

function initHeroCarousel() {
    const heroEl = document.getElementById("heroSlider");
    const trackEl = document.getElementById("heroTrack");
    const dotsEl = document.getElementById("heroDots");
    if (!heroEl || !trackEl || !dotsEl) return;

    const slideCount = HERO_SLIDES.length;
    if (slideCount === 0) return;

    // Nhân bản slide cuối lên đầu và slide đầu xuống cuối. Nhờ vậy khi kéo/auto
    // chuyển vượt qua mép mảng, track vẫn trượt tiếp theo đúng hướng (không bị
    // giật lùi lại từ đầu) -> tạo cảm giác loop vô hạn liền mạch.
    const extendedSlides = [HERO_SLIDES[slideCount - 1], ...HERO_SLIDES, HERO_SLIDES[0]];
    trackEl.innerHTML = extendedSlides
        .map((src) => `<div class="hero-slide" style="background-image:url('${src}')"></div>`)
        .join("");

    let current = 1; // vị trí trong mảng đã nhân bản (0 và slideCount+1 là 2 slide clone)
    let timer = null;
    let isDragging = false;
    let isAnimating = false; // đang có transition chạy dở -> chặn lệnh chuyển slide mới
    let startX = 0;
    let deltaX = 0;

    function realIndex() {
        return (current - 1 + slideCount) % slideCount;
    }

    // Tạo các nút dot 1 LẦN DUY NHẤT lúc khởi tạo. renderDots() bên dưới chỉ
    // toggle class "active" trên các phần tử có sẵn này (không dùng innerHTML
    // để tạo lại từ đầu mỗi lần) — vì nếu tạo lại DOM mới mỗi lần, trình
    // duyệt coi đó là phần tử hoàn toàn khác nên CSS transition (width, màu
    // nền ở .hero-dot.active) không có gì để animate, dot cứ "nhảy cóc" thẳng
    // sang trạng thái cuối thay vì phình/thu mượt.
    dotsEl.innerHTML = HERO_SLIDES
        .map((_, i) => `<button type="button" class="hero-dot" aria-label="Chuyển đến ảnh ${i + 1}"></button>`)
        .join("");
    const dotEls = Array.from(dotsEl.children);

    function renderDots() {
        const active = realIndex();
        dotEls.forEach((dot, i) => {
            dot.classList.toggle("active", i === active);
        });
    }

    function setPosition(withTransition) {
        trackEl.style.transition = withTransition ? "transform .45s cubic-bezier(.4,0,.2,1)" : "none";
        trackEl.style.transform = `translateX(calc(${-current * 100}% + ${deltaX}px))`;
    }

    function step(direction) {
        // Nếu 1 lệnh chuyển slide đang chạy dở mà cho phép chồng thêm lệnh mới,
        // "current" có thể bị cộng dồn vượt ra ngoài phạm vi mảng đã nhân bản
        // (chỉ có slideCount+2 phần tử) -> track trượt tới 1 vị trí không có
        // slide nào ở đó -> hiện khoảng trắng. Vuốt/bấm nhanh nhiều lần liên
        // tiếp trước khi transitionend kịp chạy chính là nguyên nhân gây lỗi
        // này, nên ở đây chặn lệnh mới cho tới khi lệnh trước hoàn tất.
        if (isAnimating) return;
        isAnimating = true;
        current += direction;
        deltaX = 0;
        setPosition(true);
        renderDots();
    }

    function goToRealIndex(targetIndex) {
        if (isAnimating) return;
        isAnimating = true;
        current = targetIndex + 1;
        deltaX = 0;
        setPosition(true);
        renderDots();
    }

    // Nếu đang đứng ở 1 trong 2 slide clone (đầu/cuối mảng nhân bản) thì "chốt"
    // tức thời (không animation) về đúng slide thật tương ứng — người dùng
    // không nhìn thấy cú nhảy này. Trả về true nếu vừa chốt lại (đã tự gọi
    // setPosition(false) rồi, khỏi cần gọi lại).
    function correctBoundary() {
        if (current === 0) {
            current = slideCount;
            setPosition(false);
            return true;
        }
        if (current === slideCount + 1) {
            current = 1;
            setPosition(false);
            return true;
        }
        return false;
    }

    // Sau khi animation kết thúc bình thường, chốt lại nếu đang ở slide clone.
    trackEl.addEventListener("transitionend", () => {
        correctBoundary();
        isAnimating = false;
    });

    function restartAutoplay() {
        window.clearInterval(timer);
        timer = window.setInterval(() => step(1), HERO_AUTOPLAY_MS);
    }

    function onPointerDown(event) {
        // Chỉ nút chuột trái (hoặc chạm tay) mới bắt đầu kéo.
        if (event.button !== undefined && event.button !== 0) return;
        isDragging = true;
        startX = event.clientX;
        deltaX = 0;
        heroEl.classList.add("dragging");
        window.clearInterval(timer);

        // Nếu người dùng chạm/kéo ngay khi 1 slide đang tự trượt dở (autoplay
        // hoặc slide trước đó), huỷ animation đó rồi "chốt" ngay track về đúng
        // vị trí hiện tại (không hiệu ứng) trước khi bắt đầu kéo. Nếu không làm
        // bước này, việc set transition:none bên dưới sẽ huỷ ngang transition
        // đang chạy mà KHÔNG bắn transitionend, khiến isAnimating bị kẹt ở true
        // mãi mãi VÀ (nếu lúc đó current đang là 1 trong 2 slide clone ở đầu/cuối
        // mảng) current cũng bị kẹt luôn ở vị trí clone đó — lần chuyển slide kế
        // tiếp sẽ cộng thêm 1 bước và vượt ra ngoài mảng slide, gây khoảng trắng.
        isAnimating = false;
        if (!correctBoundary()) {
            setPosition(false);
        }

        heroEl.setPointerCapture?.(event.pointerId);
    }

    function onPointerMove(event) {
        if (!isDragging) return;
        deltaX = event.clientX - startX;
        setPosition(false);
    }

    function onPointerUp() {
        if (!isDragging) return;
        isDragging = false;
        heroEl.classList.remove("dragging");

        const heroWidth = heroEl.getBoundingClientRect().width;
        const threshold = heroWidth * HERO_SWIPE_THRESHOLD_RATIO;

        if (deltaX <= -threshold) {
            step(1);
        } else if (deltaX >= threshold) {
            step(-1);
        } else {
            deltaX = 0;
            setPosition(true);
        }
        restartAutoplay();
    }

    heroEl.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    dotsEl.addEventListener("click", (event) => {
        const dotBtn = event.target.closest(".hero-dot");
        if (!dotBtn) return;
        goToRealIndex(Array.from(dotsEl.children).indexOf(dotBtn));
        restartAutoplay();
    });

    setPosition(false);
    renderDots();
    restartAutoplay();
}

async function init() {
    bindHeaderScrollEffect();
    bindHeaderSearchToggle();
    bindAnnouncementClose();

    // Nhúng header.html / footer.html trước, vì các bước bên dưới (VD:
    // renderFooterLinks, showToast) cần các phần tử nằm bên trong đó.
    await loadLayout();

    // bindAnnouncementTicker() cần #announcementTrack đã có trong DOM nên
    // phải gọi sau loadLayout(), khác với bindAnnouncementClose() ở trên
    // (dùng event delegation trên document nên gọi trước cũng không sao).
    bindAnnouncementTicker();

    bindWishlistEvents();
    bindCartEvents();
    bindProductCardNavigation();
    bindMobileMenuAutoFocus();
    renderFooterLinks();

    if (document.getElementById("productGrid")) {
        // Các phần chỉ có ở trang chủ (index.html)
        initHeroCarousel();
        renderLiveShows(); // phải render trước để categoryTrack có nội dung, initCategorySlider() cần đo chiều rộng track
        initCategorySlider();
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