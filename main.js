async function loadAndRenderProducts() {

    try {

        const response = await fetch("https://fakestoreapi.com/products");

        if (!response.ok) {
            throw new Error("Không thể tải dữ liệu.");
        }

        const products = await response.json();

        const productGrid = document.getElementById("productGrid");

        // Xóa dữ liệu cũ trước khi render
        productGrid.textContent = "";

        /*
        Tạo DocumentFragment để chứa toàn bộ sản phẩm.
        Sau khi tạo xong mới thêm vào DOM đúng 1 lần.
        Điều này giúp giảm số lần cập nhật giao diện.
        */
        const fragment = document.createDocumentFragment();

        // Dùng for...of để duyệt mảng dễ đọc hơn
        for (const product of products) {

            /*
            KHÔNG dùng: productGrid.innerHTML += `...`; vì mỗi lần innerHTML thay đổi, trình duyệt sẽ:
            1. Đọc toàn bộ HTML hiện tại.
            2. Ghép chuỗi HTML mới.
            3. Parse (phân tích) lại HTML.
            4. Tạo lại DOM.
            5. Reflow (tính toán lại bố cục).
            6. Repaint (vẽ lại giao diện).

            Nếu có nhiều sản phẩm thì quá trình này lặp lại rất nhiều lần, làm chương trình chạy chậm và tốn tài nguyên.

            Giải pháp:
            - createElement()
            - DocumentFragment
            - appendChild()

            Sau khi tạo xong tất cả phần tử thì chỉ append vào DOM đúng 1 lần.
            */

            const card = document.createElement("div");
            card.className = "card";

            const title = document.createElement("h3");

            /*
            Không dùng:  card.innerHTML = `<h3>${product.title}</h3>`; vì product.title lấy từ API nên có thể chứa HTML hoặc JavaScript

            Nếu dùng innerHTML thì trình duyệt sẽ hiểu đây là HTML và có thể thực thi JavaScript.
            Đây gọi là lỗ hổng XSS (Cross-Site Scripting).
            Để tránh XSS, dùng textContent.
            textContent chỉ hiển thị dữ liệu dưới dạng văn bản,
            không thực thi HTML hoặc JavaScript.
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

    }

}

loadAndRenderProducts();
/* Giải thích
1. Tại sao innerHTML  trong vòng lặp lại làm chậm trình duyệt?

innerHTML  sẽ làm trình duyệt cập nhật DOM sau mỗi lần lặp. Mỗi lần cập nhật, trình duyệt phải đọc lại toàn bộ HTML cũ, ghép thêm chuỗi mới, phân tích lại HTML, tạo lại các DOM Node và cập nhật giao diện.
Quá trình này làm phát sinh:
Reflow: Trình duyệt tính toán lại vị trí và kích thước của các phần tử.
Repaint: Trình duyệt vẽ lại giao diện sau khi bố cục thay đổi.
Nếu danh sách có nhiều sản phẩm thì Reflow và Repaint sẽ diễn ra rất nhiều lần, khiến website chạy chậm.
Giải pháp: dùng createElement(), DocumentFragment() và appendChild() để tạo toàn bộ phần tử trước, sau đó chỉ thêm vào DOM một lần.

2. Tại sao ${product.title} trong innerHTML dễ bị XSS?

product.title được lấy từ API nên không thể chắc chắn dữ liệu luôn an toàn. Nếu dữ liệu chứa mã HTML hoặc JavaScript thì khi dùng innerHTML, trình duyệt sẽ coi đó là HTML và có thể thực thi mã độc.*/