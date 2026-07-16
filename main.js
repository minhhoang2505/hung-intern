const products = [
    { id: 1, name: "Áo thun nam", category: "ao", price: 150000, inStock: true },
    { id: 2, name: "Quần jean nữ", category: "quan", price: 350000, inStock: true },
    { id: 3, name: "Giày thể thao", category: "giay", price: 500000, inStock: false },
    { id: 4, name: "Áo khoác hoodie", category: "ao", price: 420000, inStock: true },
    { id: 5, name: "Dép sandal", category: "giay", price: 180000, inStock: true },
    { id: 6, name: "Quần shorts", category: "quan", price: 200000, inStock: false },
];

const productGrid = document.getElementById("productGrid");
const searchInput = document.getElementById("searchInput");
const filterButtons = document.getElementById("filterButtons");

const cartCount = document.getElementById("cartCount");
const cartTotal = document.getElementById("cartTotal");

const cart = [];

let currentCategory = "all";
let currentKeyword = "";

renderProducts(products);

function renderProducts(list){

    productGrid.innerHTML = "";

    list.forEach(product=>{

        const card = document.createElement("div");
        card.className = "card";

        const title = document.createElement("h3");
        title.textContent = product.name;

        const price = document.createElement("p");
        price.textContent = `Giá: ${product.price.toLocaleString()} đ`;

        card.appendChild(title);
        card.appendChild(price);

        if(product.inStock){

            const btn = document.createElement("button");
            btn.textContent = "Thêm vào giỏ";
            btn.dataset.id = product.id;

            card.appendChild(btn);

        }else{

            const span = document.createElement("span");
            span.className = "out-stock";
            span.textContent = "Hết hàng";

            card.appendChild(span);
        }

        productGrid.appendChild(card);

    });

}

function filterProducts(){

    const result = products.filter(product=>{

        const matchCategory =
            currentCategory === "all" ||
            product.category === currentCategory;

        const matchKeyword =
            product.name
            .toLowerCase()
            .includes(currentKeyword.toLowerCase());

        return matchCategory && matchKeyword;

    });

    renderProducts(result);

}

filterButtons.addEventListener("click",function(event){

    if(event.target.tagName !== "BUTTON") return;

    currentCategory = event.target.dataset.category;

    filterProducts();

});

searchInput.addEventListener("input",function(){

    currentKeyword = this.value;

    filterProducts();

});

productGrid.addEventListener("click",function(event){

    if(event.target.tagName !== "BUTTON") return;

    const id = Number(event.target.dataset.id);

    const product = products.find(item=>item.id===id);

    cart.push(product);

    updateCart();

});
const clearCart = document.getElementById("clearCart");
    clearCart.addEventListener("click", function(){

        cart.length = 0;

    updateCart();

});

function updateCart(){

    cartCount.textContent = cart.length;

    let total = 0;

    cart.forEach(product=>{

        total += product.price;

    });

    cartTotal.textContent = total.toLocaleString();

}