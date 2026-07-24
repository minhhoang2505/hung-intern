/**
 * =================================================================
 * GHI CHÚ VỀ TỐI ƯU RENDER (tránh Reflow nhiều lần)
 * =================================================================
 * Mục đích:
 * Toàn bộ các hàm render*()/create*() trong file này (renderLiveShows,
 * renderProducts, renderOpportunityProducts, renderBrands, renderArrivals,
 * renderTrendingRankList, renderInstagramFeed, renderFooterLinks...)
 * đều dùng để vẽ danh sách sản phẩm/nội dung lên giao diện.
 *
 * Logic xử lý:
 * - Mỗi hàm dùng .map() để biến 1 mảng dữ liệu thành 1 mảng chuỗi HTML,
 *   rồi .join("") gộp tất cả thành 1 chuỗi HTML DUY NHẤT.
 * - Chuỗi đó chỉ được gán vào DOM đúng 1 lần bằng container.innerHTML = ...,
 *   KHÔNG bao giờ dùng innerHTML += hoặc appendChild() bên trong vòng lặp.
 *
 * Lý do chọn cách này:
 * Nếu dùng innerHTML += hoặc appendChild() cho từng phần tử trong forEach,
 * mỗi lần thêm 1 phần tử trình duyệt phải tính toán lại layout (Reflow)
 * và vẽ lại (Repaint) — với N sản phẩm sẽ tốn N lần Reflow.
 * Gộp chuỗi HTML bằng map()/join() rồi gán innerHTML 1 lần chỉ khiến
 * trình duyệt Reflow/Repaint đúng 1 lần duy nhất, hiệu năng tốt hơn hẳn
 * khi danh sách dài. Đây cũng là lý do không cần thêm
 * document.createDocumentFragment(): Fragment chỉ thật sự cần thiết khi
 * phải build cây DOM bằng createElement()/appendChild() từng node; còn
 * ở đây build bằng chuỗi HTML nên gán innerHTML 1 lần đã đạt hiệu quả
 * tương đương (chỉ 1 lần parse HTML + 1 lần Reflow), mà code lại ngắn
 * gọn hơn nhiều so với việc tạo từng element bằng tay.
 */

// =============================
// BIẾN TOÀN CỤC
// =============================

const liveShowGrid = document.getElementById("liveShowGrid");
const productGrid = document.getElementById("productGrid");
const opportunityGrid = document.getElementById("opportunityGrid");
const brandsGrid = document.getElementById("brandsGrid");

const WISHLIST_KEY = "wishlist";


// =============================
// KHU VỰC "CAROUSEL DOTS" (mobile)
// =============================

// =======================================================
/*
Mục đích:
Tạo chấm điều hướng (dot) bên dưới 1 khu vực dạng lưới
(Live Show, Opportunity, Buying Now, Brands) để dùng khi
CSS chuyển lưới đó thành carousel cuộn ngang trên mobile.
Trên desktop, khu vực này vẫn là lưới nhiều cột bình thường
và .carousel-dots bị ẩn qua CSS nên hàm này không ảnh hưởng gì.

Logic xử lý:
- Đếm số phần tử con trực tiếp trong gridEl (mỗi item = 1 chấm).
- map() số lượng đó thành các <button class="carousel-dot">, chấm
  đầu tiên có class "active".
- Gắn sự kiện click cho từng dot: cuộn gridEl tới đúng item tương
  ứng bằng scrollIntoView() (mượt, không cần tự tính toán toạ độ).
- Gắn sự kiện "scroll" (có throttle bằng requestAnimationFrame)
  lên gridEl: dựa vào scrollLeft để xác định item nào đang ở gần
  mép trái nhất, rồi bật class "active" cho dot tương ứng.

Lý do chọn cách này:
- Dùng scrollIntoView({inline:"start"}) thay vì tự tính scrollLeft
  bằng tay vì trình duyệt đã tối ưu và xử lý mượt (behavior:"smooth")
  sẵn, không cần viết lại animation cuộn.
- Dùng requestAnimationFrame để throttle sự kiện "scroll" vì scroll
  bắn ra rất nhiều lần/giây — nếu tính toán DOM (đổi class active)
  ở mọi lần bắn sự kiện sẽ gây giật khi cuộn; rAF đảm bảo chỉ tính
  toán tối đa 1 lần mỗi khung hình (~60 lần/giây).
- Hàm dùng chung (generic) cho cả 4 khu vực (Live Show, Opportunity,
  Buying Now, Brands) thay vì viết 4 hàm riêng gần giống hệt nhau —
  tránh lặp code (DRY).
*/
// =======================================================

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

        // Trước đây chỉ bật/tắt class "active" trên đúng cái dot đó, nên nó
        // CHUYỂN đúng nhưng "nhảy cóc" tại chỗ chứ không trượt mượt qua vị trí
        // dot bên cạnh. Giờ dùng 1 chấm indicator riêng, transform theo toạ độ
        // (offsetLeft/offsetTop) của dot đang active — CSS "transition:transform"
        // sẽ tự vẽ animation trượt mượt giữa 2 vị trí.
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

                // Chỉ cần scroll — dot active sẽ tự đồng bộ qua sự kiện "scroll"
                // bên dưới (dùng chung 1 nguồn xử lý duy nhất, tránh đá nhau).
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

    // Đồng bộ dot "active" theo đúng vị trí đang cuộn tới (gridEl.scrollLeft),
    // dùng chung cho cả 2 trường hợp: bấm dot (scroll mượt) VÀ tự kéo tay.
    // Debounce vì sự kiện "scroll" bắn liên tục hàng chục lần/giây.
    let scrollDebounce = null;

    function syncActiveDotFromScroll(){

        // Dùng getBoundingClientRect() thay vì offsetLeft: offsetLeft chỉ đúng
        // khi gridEl có "position:relative", còn getBoundingClientRect() luôn
        // cho toạ độ thật trên màn hình bất kể CSS positioning của cha là gì
        // — nên tính khoảng cách item-so-với-mép-trái-khung-nhìn luôn chính xác.
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



// =======================================================
/*
Mục đích:
Lấy danh sách sản phẩm yêu thích đã lưu trên trình duyệt.

Logic xử lý:
- Đọc dữ liệu từ localStorage.
- Nếu chưa có dữ liệu thì trả về mảng rỗng.
- Nếu có thì chuyển chuỗi JSON thành mảng.

Lý do chọn cách này:
localStorage giúp dữ liệu vẫn được giữ sau khi tải lại trang.
*/
// =======================================================

function getWishlist() {

    const wishlist = localStorage.getItem(WISHLIST_KEY);

    return wishlist ? JSON.parse(wishlist) : [];

}


// =======================================================
/*
Mục đích:
Lưu danh sách sản phẩm yêu thích.

Logic xử lý:
- Chuyển mảng thành chuỗi JSON.
- Ghi vào localStorage.

Lý do chọn cách này:
localStorage chỉ lưu được chuỗi nên cần JSON.stringify().
*/
// =======================================================

function saveWishlist(wishlist) {

    localStorage.setItem(
        WISHLIST_KEY,
        JSON.stringify(wishlist)
    );

}


// =======================================================
/*
Mục đích:
Kiểm tra sản phẩm đã được yêu thích chưa.

Logic xử lý:
- Lấy wishlist.
- Kiểm tra id có tồn tại trong mảng.

Lý do chọn cách này:
includes() nhanh và dễ đọc.
*/
// =======================================================

function isWishlist(id) {

    return getWishlist().includes(id);

}



// =======================================================
/*
Mục đích:
Thêm hoặc bỏ sản phẩm khỏi Wishlist.

Logic xử lý:
- Lấy wishlist hiện tại.
- Nếu id đã tồn tại thì xóa.
- Nếu chưa thì thêm.
- Lưu lại localStorage.

Lý do chọn cách này:
Giữ toàn bộ trạng thái trong localStorage nên F5 vẫn còn.
*/
// =======================================================

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

// =======================================================
/*
Mục đích:
Chọn class màu cho badge dựa theo nội dung ("ON AIR", "NEW", "BEST SELLER"...).

Logic xử lý:
- Có 1 bảng map cố định giữa text badge và class màu tương ứng.
- Nếu badge không nằm trong map (badge lạ/tuỳ chỉnh) thì dùng
  class mặc định "badge-default" (xanh dương) để không bị rỗng style.

Lý do chọn cách này:
Tách riêng để dùng chung cho cả createProductCard() và
createOpportunityCard(), không phải viết if/else lặp lại 2 nơi.
*/
// =======================================================

const BADGE_COLOR_MAP = {
    "ON AIR": "badge-onair",
    "NEW": "badge-new",
    "BEST SELLER": "badge-bestseller"
};

function getBadgeClass(badge) {

    return BADGE_COLOR_MAP[badge] || "badge-default";

}

// =======================================================
/*
Mục đích:
Tạo HTML của một sản phẩm.

Logic xử lý:
- Nhận object sản phẩm.
- Kiểm tra wishlist.
- Sinh HTML.

Lý do chọn cách này:
Tách riêng component giúp tái sử dụng cho nhiều khu vực.
*/
// =======================================================

function escapeHTML(text) {

    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

}
/**
 * Tạo HTML cho 1 sản phẩm, ĐÃ BỌC SẴN trong 1 cột Bootstrap Grid.
 *
 * @param {object} product - sản phẩm (id, brand, badge, name, price, salePrice, image).
 * @param {object} [options]
 * @param {string} [options.colClass] - class cột Bootstrap, mặc định 4 cột trên desktop,
 *   2 cột trên tablet, 1 cột trên mobile — đúng như bài yêu cầu (col-12 col-md-6 col-lg-3).
 *   Dùng col-sm-6 thay vì col-md-6 để chuyển sang 2 cột sớm hơn (từ 576px) cho gọn màn hình.
 * @param {string} [options.extraClass] - class phụ gắn thêm vào <article> (vd: "opportunity-card").
 */
function createProductCard(product, options = {}) {

    const {
        colClass = "col-12 col-sm-6 col-lg-3",
        extraClass = ""
    } = options;

    const wished = isWishlist(product.id);

    // data-* trên vùng ảnh: dùng để Bootstrap Modal (#quickViewModal) đọc lại
    // thông tin sản phẩm khi mở modal (xem hàm bindQuickViewModal()).
    const quickViewData = `
        data-bs-toggle="modal"
        data-bs-target="#quickViewModal"
        data-id="${product.id}"
        data-name="${escapeHTML(product.name)}"
        data-brand="${escapeHTML(product.brand ?? "")}"
        data-price="${Number(product.price)}"
        data-saleprice="${Number(product.salePrice)}"
        data-image="${encodeURI(product.image)}"
        data-badge="${escapeHTML(product.badge ?? "")}"
    `;

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

            <!-- Click vào ảnh = Xem nhanh (mở Bootstrap Modal) -->
            <div class="product-image quick-view-trigger" role="button" ${quickViewData}>

                <img
                    src="${encodeURI(product.image)}"
                    alt="${escapeHTML(product.name)}">

                <span class="quick-view-label">
                    <i class="fa-regular fa-eye me-1"></i>Xem nhanh
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
// =======================================================
/*
Mục đích:
Hiển thị các sản phẩm Live Show.

Logic xử lý:
- Lọc sản phẩm có isLiveShow = true.
- map() thành HTML.
- Hiển thị lên giao diện.

Lý do chọn cách này:
filter() và map() không làm thay đổi dữ liệu gốc.
*/
// =======================================================

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

// =======================================================
/*
Mục đích:
Gắn sự kiện click cho nút Wishlist.

Logic xử lý:
- Bắt tất cả nút wishlist.
- Click sẽ đổi trạng thái.
- Render lại giao diện.

Lý do chọn cách này:
Event sau khi render cần bind lại để các nút mới hoạt động.
*/
// =======================================================

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

// =======================================================
/*
Mục đích:
Hiện thông báo góc màn hình khi thêm/bỏ Wishlist hoặc thêm giỏ hàng,
dùng đúng Component Toast có sẵn của Bootstrap thay vì tự viết
CSS animation + setTimeout ẩn/hiện thủ công.

Logic xử lý:
- Đổi nội dung #appToastBody.
- getOrCreateInstance() tái sử dụng đúng 1 instance Toast cho phần tử
  #appToast (Bootstrap tự quản lý việc show/hide/animation/tự ẩn sau delay).
*/
// =======================================================

function showToast(message) {

    const toastEl = document.getElementById("appToast");

    if (!toastEl || typeof bootstrap === "undefined") return;

    document.getElementById("appToastBody").textContent = message;

    const toast = bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 2200 });

    toast.show();

}


// =============================
// BOOTSTRAP: ADD TO CART
// =============================

// =======================================================
/*
Mục đích:
Xử lý mọi nút "Add to Cart" (trên product-card lẫn trong Modal Quick View)
bằng 1 event delegation duy nhất dựa vào [data-action="cart"].

Lý do chọn cách này:
Các nút được render lại liên tục (mỗi lần renderProducts/renderLiveShows...)
nên bind trực tiếp từng nút sẽ bị mất sự kiện. Delegation lên document
(giống bindWishlistEvents) đảm bảo nút render sau vẫn hoạt động.
*/
// =======================================================

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
// BOOTSTRAP: MODAL QUICK VIEW
// =============================

// =======================================================
/*
Mục đích:
Điền dữ liệu sản phẩm vào Modal #quickViewModal mỗi khi modal được mở,
và xử lý 2 nút hành động (Add to Cart / Add to Wishlist) bên trong modal.

Logic xử lý:
- Bootstrap tự mở modal nhờ data-bs-toggle/data-bs-target đặt sẵn trên
  vùng ảnh sản phẩm (xem createProductCard()) — không cần gọi
  new bootstrap.Modal(...).show() bằng tay.
- Lắng nghe sự kiện "show.bs.modal": event.relatedTarget chính là phần tử
  vừa được click (vùng ảnh có data-*), đọc dataset để hiển thị.
- Lưu id/name hiện tại vào dataset của chính modal để 2 nút Add to Cart/
  Add to Wishlist bên trong modal biết đang thao tác với sản phẩm nào.
*/
// =======================================================

function bindQuickViewModal() {

    const modalEl = document.getElementById("quickViewModal");

    if (!modalEl || typeof bootstrap === "undefined") return;

    modalEl.addEventListener("show.bs.modal", (event) => {

        const trigger = event.relatedTarget;

        if (!trigger) return;

        const { id, name, brand, price, saleprice, image, badge } = trigger.dataset;

        document.getElementById("quickViewLabel").textContent = name;
        document.getElementById("quickViewName").textContent = name;
        document.getElementById("quickViewBrand").textContent = brand;
        document.getElementById("quickViewImage").src = image;
        document.getElementById("quickViewImage").alt = name;
        document.getElementById("quickViewOriginalPrice").textContent = `$${Number(price).toFixed(2)}`;
        document.getElementById("quickViewSalePrice").textContent = `$${Number(saleprice).toFixed(2)}`;

        const badgeEl = document.getElementById("quickViewBadge");

        if (badge) {
            badgeEl.textContent = badge;
            badgeEl.className = `badge mb-2 ${getBadgeClass(badge)}`;
            badgeEl.style.display = "inline-block";
        } else {
            badgeEl.style.display = "none";
        }

        modalEl.dataset.currentId = id;
        modalEl.dataset.currentName = name;

    });

    document.getElementById("quickViewAddToCart")?.addEventListener("click", () => {

        showToast(`Đã thêm "${modalEl.dataset.currentName}" vào giỏ hàng 🛒`);

    });

    document.getElementById("quickViewAddToWishlist")?.addEventListener("click", () => {

        const id = Number(modalEl.dataset.currentId);

        toggleWishlist(id);

        renderLiveShows();

        renderProducts(currentCategory);

        renderOpportunityProducts();

        showToast(
            isWishlist(id)
                ? "Đã thêm vào Wishlist ❤️"
                : "Đã bỏ khỏi Wishlist"
        );

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


// =======================================================
/*
Mục đích:
Hiển thị danh sách sản phẩm trong phần
"What Everyone Is Buying Right Now".

Logic xử lý:
- Nếu category là "all" thì hiển thị toàn bộ.
- Ngược lại lọc theo category.
- Dùng createProductCard() để tạo giao diện.
- Render lên productGrid.

Lý do chọn cách này:
Tách riêng renderProducts() giúp dễ tái sử dụng khi
Filter hoặc Wishlist thay đổi.
*/
// =======================================================

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


// =======================================================
/*
Mục đích:
Lọc sản phẩm theo Tab.

Logic xử lý:
- Gọi renderProducts().
- Sau khi render thì gắn lại sự kiện Wishlist.

Lý do chọn cách này:
Render lại DOM sẽ làm mất Event cũ nên cần bind lại.
*/
// =======================================================

function filterProducts(category) {

    renderProducts(category);


}


// =======================================================
/*
Mục đích:
Đổi trạng thái Active của các Tab.

Logic xử lý:
- Xóa class active của toàn bộ Tab.
- Thêm active cho Tab vừa click.

Lý do chọn cách này:
Chỉ cho phép một Tab được active tại một thời điểm.
*/
// =======================================================

function updateActiveTab(activeTab) {

    const tabs = document.querySelectorAll(".tab");

    tabs.forEach(tab => {

        tab.classList.remove("active");

    });

    activeTab.classList.add("active");

}


// =======================================================
/*
Mục đích:
Gắn sự kiện Click cho các Tab.

Logic xử lý:
- Lấy toàn bộ Tab.
- Đọc data-category.
- Gọi filterProducts().
- Cập nhật giao diện Active.

Lý do chọn cách này:
data-category giúp HTML và JS liên kết với nhau
mà không cần viết if...else cho từng nút.
*/
// =======================================================

function bindTabEvents() {

    const tabs = document.querySelectorAll(".tab");

    tabs.forEach(tab => {

        tab.addEventListener("click", () => {

            const category = tab.dataset.category;

            updateActiveTab(tab);

            filterProducts(category);

        });

    });

}


// =============================
// KHU VỰC "DON'T MISS THIS OPPORTUNITY TODAY"
// =============================

// =======================================================
/*
Mục đích:
Đổi số giây thành định dạng thời gian mm:ss hoặc h:mm:ss.

Logic xử lý:
- Tính giờ, phút, giây từ tổng số giây.
- Nếu có giờ thì hiển thị dạng h:mm:ss, không thì mm:ss.

Lý do chọn cách này:
Khớp với định dạng đồng hồ hiển thị trong ảnh mẫu (1:06:50/1:10:18).
*/
// =======================================================

function formatTime(totalSeconds) {

    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);

    const pad = (n) => String(n).padStart(2, "0");

    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;

}


// =======================================================
/*
Mục đích:
Tạo HTML cho 1 sản phẩm trong khu Opportunity.

Logic xử lý:
- Giống createProductCard() nhưng có thêm brand + badge
  vì đây là 2 field không tồn tại trong products[] gốc.

Lý do chọn cách này:
Tách riêng để không phải sửa cấu trúc products[] hiện có.
*/
// =======================================================

/*
Ghi chú: createOpportunityCard() cũ đã bị gộp vào createProductCard() vì
opportunityProducts[] có đúng cấu trúc field (id, brand, badge, name, price,
salePrice, image) như products[] — không cần viết lại HTML 2 lần.
Xem renderOpportunityProducts() bên dưới, chỉ đổi colClass + extraClass.
*/


// =======================================================
/*
Mục đích:
Hiển thị 3 sản phẩm bên cạnh khung livestream.

Logic xử lý:
- map() opportunityProducts thành HTML bằng createOpportunityCard().
- Gán vào #opportunityGrid.

Lý do chọn cách này:
Cùng cách làm với renderLiveShows()/renderProducts() cho đồng bộ code.
*/
// =======================================================

function renderOpportunityProducts() {

    if (!opportunityGrid) return;

    opportunityGrid.innerHTML = opportunityProducts
        .map(product => createProductCard(product, {
            colClass: "col-12 col-sm-6 col-lg-4",
            extraClass: "opportunity-card"
        }))
        .join("");

    initGridCarousel(opportunityGrid, document.getElementById("opportunityDots"));

}


// =======================================================
/*
Mục đích:
Hiển thị thông tin tĩnh của khung livestream (tag, viewer, thời gian, chat mẫu).

Logic xử lý:
- Gán ảnh nền, tag, viewer ban đầu.
- Render vài dòng chat mẫu chạy phía trên thanh nhập liệu.

Lý do chọn cách này:
Tách riêng phần render khỏi phần cập nhật theo thời gian
(updateViewerCount, startClock) để dễ đọc.
*/
// =======================================================

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


// =======================================================
/*
Mục đích:
Cho phép thả tim trên khung livestream, có hiệu ứng tim bay lên.

Logic xử lý:
- Toggle class "is-liked" mỗi lần click.
- Tạo 1 span "♥" bay lên rồi tự xoá sau khi kết thúc animation.

Lý do chọn cách này:
Không cần lưu trạng thái thả tim vào localStorage vì đây chỉ là
hiệu ứng tương tác tức thời, không phải dữ liệu cần giữ lại.
*/
// =======================================================

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


// =======================================================
/*
Mục đích:
Giả lập số viewer tăng/giảm nhẹ theo thời gian thực cho sinh động.

Logic xử lý:
- Mỗi 2.2s cộng thêm một số ngẫu nhiên trong khoảng -3..+3.
- Không cho số viewer xuống dưới 1000.

Lý do chọn cách này:
setInterval là đủ cho hiệu ứng "đang live", không cần realtime thật.
*/
// =======================================================

function startViewerTicker() {

    let current = STREAM.viewersStart;

    setInterval(() => {

        const delta = Math.floor(Math.random() * 7) - 3;

        current = Math.max(1000, current + delta);

        updateViewerCount(current);

    }, 2200);

}


// =======================================================
/*
Mục đích:
Chạy đồng hồ replay tăng dần mỗi giây.

Logic xử lý:
- Cộng dồn elapsed mỗi 1000ms cho tới khi bằng total.

Lý do chọn cách này:
Tạo cảm giác video đang phát thật sự.
*/
// =======================================================

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

// =======================================================
/*
Mục đích:
Tạo HTML cho 1 dòng sản phẩm nhỏ bên trong 1 brand card.

Logic xử lý:
- Nếu có salePrice thì hiển thị giá gốc gạch ngang + giá sale.
- Nếu salePrice là null thì chỉ hiển thị 1 giá bình thường (normal-price).

Lý do chọn cách này:
Dùng lại đúng 3 class original-price/sale-price/normal-price
đã có sẵn trong style.css, không cần thêm class mới.
*/
// =======================================================

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


// =======================================================
/*
Mục đích:
Tạo HTML cho 1 brand card (logo + mô tả + danh sách sản phẩm).

Logic xử lý:
- map() qua brand.products bằng createBrandProductRow().
- Ghép vào khung brand-card-header + brand-products.

Lý do chọn cách này:
Đồng bộ cách làm với createProductCard()/createOpportunityCard().
*/
// =======================================================

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


// =======================================================
/*
Mục đích:
Hiển thị toàn bộ brand card lên #brandsGrid.

Lý do chọn cách này:
Cùng pattern render*() như các khu vực khác, có guard null
để không lỗi nếu #brandsGrid chưa tồn tại trên trang.
*/
// =======================================================

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

// =======================================================
/*
Mục đích:
Hiển thị 2 banner quảng cáo livestream ở khu New Arrivals
(ảnh nền + tiêu đề + link "Watch Live Now").

Logic xử lý:
- Lấy mảng newArrivalsBanners từ data.js.
- map() từng banner thành 1 khối HTML có background-image inline
  (vì mỗi banner 1 ảnh khác nhau, không thể gộp chung 1 class CSS).
- join("") gộp lại thành chuỗi HTML rồi gán 1 lần vào #arrivalsGrid.

Lý do chọn cách này:
Dùng .map()/.join() thay vì vòng lặp for vì chỉ cần biến đổi
1-1 từ mảng dữ liệu sang mảng chuỗi HTML rồi nối lại — không cần
biến đếm hay điều kiện dừng như for, code ngắn và dễ đọc hơn.
Gán innerHTML 1 lần (thay vì appendChild trong lúc lặp) giúp
trình duyệt chỉ phải re-render DOM đúng 1 lần thay vì nhiều lần.
*/
// =======================================================

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

// =======================================================
/*
Mục đích:
Hiển thị sản phẩm nổi bật (đang live, có đếm ngược + số người xem)
ở khối bên trái của khu Trending now, popular.

Logic xử lý:
- Đọc object trendingSpotlight từ data.js.
- Dùng lại formatTime() đã viết sẵn để đổi countdownSeconds
  thành chuỗi giờ:phút:giây, sau đó .split(":").join(" : ")
  để ra đúng định dạng "22 : 36 : 05" như ảnh mẫu.
- Badge giảm giá (discountLabel) chỉ render khi có giá trị,
  tránh hiện ngoặc đơn rỗng "()" khi sản phẩm không giảm giá.

Lý do chọn cách này:
Tái sử dụng formatTime() có sẵn thay vì viết thêm 1 hàm định dạng
thời gian mới — tránh lặp lại logic tính giờ/phút/giây đã có.
*/
// =======================================================

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


// =======================================================
/*
Mục đích:
Hiển thị bảng xếp hạng 01-05 ở khối bên phải của khu Trending.

Logic xử lý:
- map() qua trendingRankList, mỗi item render 1 <li> gồm
  số thứ hạng + tên sản phẩm.
- Số thứ hạng luôn hiện 2 chữ số (01, 02...) bằng padStart(2,"0").

Lý do chọn cách này:
padStart(2,"0") xử lý được mọi số từ 1-99 mà không cần viết
if/else để tự thêm số "0" phía trước cho từng trường hợp.
Dùng map() vì mỗi phần tử mảng chỉ cần biến đổi độc lập thành
1 <li>, không phụ thuộc vào phần tử trước/sau — rất hợp với map().
*/
// =======================================================

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

// =======================================================
/*
Mục đích:
Hiển thị lưới ảnh kiểu Instagram feed dưới hashtag #seoulive.

Logic xử lý:
- Mảng instagramFeed chỉ là danh sách URL ảnh (string), không phải
  object phức tạp vì phần này thuần tuý trang trí, không có giá/tên.
- map() từng URL thành 1 thẻ <img> bọc trong div.instagram-item.

Lý do chọn cách này:
Không cần object {id, image,...} vì không có hành vi tương tác
nào khác ngoài hiển thị ảnh — mảng string đơn giản là đủ và
dễ thêm/bớt ảnh trực tiếp trong data.js mà không sợ nhầm field.
*/
// =======================================================

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

// =======================================================
/*
Mục đích:
Hiển thị 3 cột link ở footer (Information, Collections,
Need Some Help ?) từ dữ liệu footerColumns.

Logic xử lý:
- map() 2 lần lồng nhau: lần ngoài lặp qua từng cột, lần trong
  lặp qua từng link trong col.links để tạo các thẻ <li><a>.

Lý do chọn cách này:
Tách link ra data.js thay vì viết cứng trong index.html giúp
sau này đổi/thêm/bớt link ở footer chỉ cần sửa 1 file duy nhất
(data.js), không phải mò trong HTML dài. .map() lồng nhau phù hợp
vì đây đúng là cấu trúc dữ liệu lồng nhau (mảng cột chứa mảng link).
*/
// =======================================================

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


// =======================================================
/*
Mục đích:
Khởi tạo toàn bộ trang khi website tải xong.

Logic xử lý:
- Render Live Shows.
- Render Product Grid.
- Gắn sự kiện Wishlist.
- Gắn sự kiện Tab.

Lý do chọn cách này:
Đưa toàn bộ bước khởi tạo vào một hàm duy nhất
giúp dễ quản lý và bảo trì.
*/
// =======================================================

function init() {

    renderLiveShows();

    renderProducts();

    bindWishlistEvents();

    bindTabEvents();

    renderStream();

    renderOpportunityProducts();

    bindLikeButton();

    startViewerTicker();

    startClock();

    renderBrands();

    renderArrivals();

    renderTrendingSpotlight();

    renderTrendingRankList();

    renderInstagramFeed();

    renderFooterLinks();

    bindCartEvents();

    bindQuickViewModal();

    bindMobileMenuAutoFocus();

}


// =============================
// KHỞI CHẠY ỨNG DỤNG
// =============================

init();