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

        const title = document.createElement("h3");
        title.textContent = product.name;

        card.appendChild(title);

        card.innerHTML += `
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

/** Chữa bài

const card = document.createElement("div");
card.className = "card";

// Tên - dữ liệu từ user -> dùng textContent
const title = document.createElement("h3");
title.textContent = product.name;
card.appendChild(title);

// Giá - dữ liệu từ user -> dùng textContent
const pPrice = document.createElement("p");
pPrice.textContent = `Giá: ${product.price.toLocaleString()} đ`;
card.appendChild(pPrice);

// Trạng thái - dữ liệu từ user -> dùng textContent
const pStatus = document.createElement("p");
pStatus.textContent = `Trạng thái: ${product.inStock ? "Còn hàng" : "Hết hàng"}`;
card.appendChild(pStatus);

// Nút xóa - không có dữ liệu user, chỉ là id số -> tương đối an toàn
const btn = document.createElement("button");
btn.className = "delete-btn";
btn.dataset.id = product.id;
btn.textContent = "Xóa";
card.appendChild(btn);
 */