const form = document.getElementById("productForm");
const productList = document.getElementById("productList");

const products = [];

form.addEventListener("submit", function (event) {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const price = Number(document.getElementById("price").value);
    const inStock = document.getElementById("stock").value === "true";

    if (price < 0) {
        alert("Giá sản phẩm không được âm!");
        return;
    }

    const product = {
        id: Date.now(),
        name,
        price,
        inStock
    };

    products.push(product);

    renderProducts();

    form.reset();
});

function renderProducts() {

    productList.innerHTML = "";

    products.forEach(product => {

        const card = document.createElement("div");
        card.className = "card";

        card.innerHTML = `
            <h3>${product.name}</h3>
            <p>Giá: ${product.price.toLocaleString()} đ</p>
            <p>Trạng thái: ${product.inStock ? "Còn hàng" : "Hết hàng"}</p>
            <button class="delete-btn" data-id="${product.id}">
                Xóa
            </button>
        `;

        productList.appendChild(card);
    });

    document.querySelectorAll(".delete-btn").forEach(button => {

        button.addEventListener("click", function () {

            const id = Number(this.dataset.id);

            const index = products.findIndex(product => product.id === id);

            if (index !== -1) {
                products.splice(index, 1);
            }

            renderProducts();
        });

    });
}