const initStore = document.getElementById("initStore");
const loadingStatus = document.getElementById("loadingStatus");
const productGrid = document.getElementById("productGrid");

initStore.addEventListener("click", loadAndRenderProducts);

async function loadAndRenderProducts() {

    try {

        initStore.disabled = true;
        loadingStatus.textContent = "Đang tải dữ liệu...";

        const response = await fetch("https://fakestoreapi.com/products");

        if (!response.ok) {
            throw new Error("Không thể tải dữ liệu.");
        }

        const products = await response.json();

        // Xóa dữ liệu cũ trước khi hiển thị
        productGrid.textContent = "";

        /*
        --------------------------------------------------------------------
        Tạo DocumentFragment để chứa tất cả card.
        Sau khi tạo xong mới thêm vào DOM đúng một lần.
        Điều này giúp giảm số lần cập nhật giao diện.
        --------------------------------------------------------------------
        */
        const fragment = document.createDocumentFragment();

        // Duyệt mảng bằng for...of giúp code dễ đọc hơn
        for (const product of products) {

            /*
            --------------------------------------------------------------------
            Không dùng:

            productGrid.innerHTML += `...`;

            Vì mỗi lần innerHTML thay đổi, trình duyệt sẽ:

            1. Đọc toàn bộ HTML cũ.
            2. Ghép chuỗi HTML mới.
            3. Parse lại HTML.
            4. Tạo lại DOM.
            5. Reflow (tính toán lại bố cục).
            6. Repaint (vẽ lại giao diện).

            Nếu có nhiều sản phẩm thì các bước trên sẽ lặp đi lặp lại
            rất nhiều lần, khiến website chạy chậm.

            Giải pháp:
            - createElement()
            - DocumentFragment()
            - appendChild()

            Sau khi tạo xong toàn bộ phần tử thì chỉ append vào DOM
            đúng một lần.
            --------------------------------------------------------------------
            */

            const card = document.createElement("div");
            card.className = "card";

            const title = document.createElement("h3");

            /*
            --------------------------------------------------------------------
            Không dùng:

            card.innerHTML = `<h3>${product.title}</h3>`;

            Vì product.title lấy từ API nên không thể đảm bảo luôn an toàn.

            Nếu dữ liệu chứa:

            <script>alert("Hacked")</script>

            hoặc

            <img src="x" onerror="alert('XSS')">

            thì khi dùng innerHTML trình duyệt sẽ hiểu đó là HTML
            và có thể thực thi JavaScript.

            Đây là lỗ hổng bảo mật XSS (Cross-Site Scripting).

            Để tránh XSS em sử dụng:

            - document.createElement()
            - textContent()
            - appendChild()

            Trong đó textContent chỉ hiển thị văn bản,
            không thực thi HTML hoặc JavaScript.
            --------------------------------------------------------------------
            */

            title.textContent = product.title;

            const price = document.createElement("p");
            price.textContent = `Giá: ${product.price}$`;

            card.appendChild(title);
            card.appendChild(price);

            fragment.appendChild(card);
        }

        // Chỉ cập nhật DOM đúng một lần
        productGrid.appendChild(fragment);

    } catch (error) {

        console.error(error);
        loadingStatus.textContent = "Không thể tải dữ liệu.";

    } finally {

        initStore.disabled = false;

        if (loadingStatus.textContent === "Đang tải dữ liệu...") {
            loadingStatus.textContent = "";
        }

    }

}