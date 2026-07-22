// =============================
// BIẾN TOÀN CỤC
// =============================

const liveShowGrid = document.getElementById("liveShowGrid");
const productGrid = document.getElementById("productGrid");
const opportunityGrid = document.getElementById("opportunityGrid");

const WISHLIST_KEY = "wishlist";


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

function createProductCard(product) {

    return `

    <article class="product-card">

        ${product.badge
            ? `<span class="product-badge ${getBadgeClass(product.badge)}">${product.badge}</span>`
            : ""}

        <button
            class="wishlist-btn ${isWishlist(product.id) ? "active" : ""}"
            data-id="${product.id}">

            <i class="fa-regular fa-heart"></i>

        </button>

        <div class="product-image">

            <img
                src="${product.image}"
                alt="${product.name}">

        </div>

        <div class="product-info">

            <p class="product-brand">${product.brand ?? ""}</p>

            <h3 class="product-name">
                ${product.name}
            </h3>

            <div class="product-price">

                <del class="original-price">$${Number(product.price).toFixed(2)}</del>

                <span class="sale-price">$${Number(product.salePrice).toFixed(2)}</span>

            </div>

        </div>

    </article>

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
        .map(createProductCard)
        .join("");

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

function bindWishlistEvents() {

    const buttons = document.querySelectorAll(".wishlist-btn");

    buttons.forEach(button => {

        button.addEventListener("click", () => {

            const id = Number(button.dataset.id);

            toggleWishlist(id);

            renderLiveShows();

            renderProducts(currentCategory);

            bindWishlistEvents();

        });

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

    let productList;

    if (category === "all") {

        productList = products;

    } else {

        productList = products.filter(product => {

            return product.category === category;

        });

    }

    productGrid.innerHTML = productList
        .map(createProductCard)
        .join("");

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

    bindWishlistEvents();

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

function createOpportunityCard(product) {

    return `

    <article class="product-card opportunity-card">

        ${product.badge
            ? `<span class="product-badge ${getBadgeClass(product.badge)}">${product.badge}</span>`
            : ""}

        <div class="product-image">

            <img
                src="${product.image}"
                alt="${product.name}">

        </div>

        <div class="product-info">

            <p class="product-brand">${product.brand}</p>

            <h3 class="product-name">
                ${product.name}
            </h3>

            <div class="product-price">

                <del class="original-price">$${product.price.toFixed(2)}</del>

                <span class="sale-price">$${product.salePrice.toFixed(2)}</span>

            </div>

        </div>

    </article>

    `;

}


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
        .map(createOpportunityCard)
        .join("");

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

    if (!streamThumb || !streamTag) return;

    streamThumb.style.backgroundImage = `url(${STREAM.thumbnail})`;
    streamTag.textContent = STREAM.tag;

    document.getElementById("stream-elapsed").textContent =
        formatTime(STREAM.elapsedSeconds);

    document.getElementById("stream-total").textContent =
        formatTime(STREAM.totalSeconds);

    updateViewerCount(STREAM.viewersStart);
    renderChatLines(STREAM.chatLines);

}

function updateViewerCount(n) {

    const el = document.getElementById("viewer-count");

    if (el) el.textContent = n.toLocaleString("en-US");

}

function renderChatLines(lines) {

    const wrap = document.getElementById("chat-lines");

    if (!wrap) return;

    wrap.innerHTML = lines
        .map(line => `<p class="chat-line">${line}</p>`)
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

    let elapsed = STREAM.elapsedSeconds;
    const total = STREAM.totalSeconds;

    setInterval(() => {

        if (elapsed < total) elapsed += 1;

        const el = document.getElementById("stream-elapsed");

        if (el) el.textContent = formatTime(elapsed);

    }, 1000);

}


// =============================
// KHU VỰC "TRUSTED BY LEADING BRANDS"
// =============================

// =======================================================
/*
Mục đích:
Tạo HTML cho 1 dòng sản phẩm nhỏ bên trong 1 brand card.

Logo xử lý:
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
            <img src="${product.image}" alt="${product.name}">
        </div>

        <div class="brand-product-info">

            <p class="brand-product-name">${product.name}</p>

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

            <div class="brand-logo">${brand.logo}</div>

            <h3 class="brand-title">
                <span class="brand-title-name">${brand.name}</span> - ${brand.description}
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

    const grid = document.getElementById("brandsGrid");

    if (!grid) return;

    grid.innerHTML = brands
        .map(createBrandCard)
        .join("");

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

}


// =============================
// KHỞI CHẠY ỨNG DỤNG
// =============================

init();