const btn = document.getElementById("loadProducts");
const storeGrid = document.getElementById("storeGrid");
const status = document.getElementById("status");

function truncateText(text, maxLength = 40) {
    return text.length > maxLength
        ? text.slice(0, maxLength) + "..."
        : text;
}

btn.addEventListener("click", async () => {

    status.textContent = "Đang tải dữ liệu...";

    storeGrid.innerHTML = "";

    try {

        const response = await fetch("https://fakestoreapi.com/products?limit=5");

        if (!response.ok) {
            throw new Error("Lỗi khi lấy dữ liệu.");
        }

        const products = await response.json();

        status.textContent = "";

        products.forEach(product => {

            const card = document.createElement("div");
            card.className = "card";

            const image = document.createElement("img");
            image.src = product.image;
            image.alt = product.title;

            const title = document.createElement("div");
            title.className = "title";
            title.textContent = truncateText(product.title);

            const price = document.createElement("div");
            price.className = "price";
            price.textContent = `$${product.price}`;

            card.appendChild(image);
            card.appendChild(title);
            card.appendChild(price);

            storeGrid.appendChild(card);
        });

    } catch (error) {

        status.textContent = "Không thể tải dữ liệu. Vui lòng thử lại!";
        console.error(error);

    }

});