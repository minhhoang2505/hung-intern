const addToCartButtons = document.querySelectorAll(".add_to_cart_button");
const toast = document.getElementById("toast");
addToCartButtons.forEach(button => {

    button.addEventListener("click", function (event) {

        event.preventDefault();

        const productID = this.dataset.product_id;

        console.log("Product ID:", productID);

        const product = this.closest(".product");

        const productName = product.querySelector(".woocommerce-loop-product__title").textContent;

        this.innerHTML = "✔ Đã thêm";
        this.classList.add("added");

        toast.textContent = `Bạn vừa thêm ${productName} vào giỏ!`;
        toast.classList.add("show");

        setTimeout(() => {
            
            this.innerHTML = "Thêm vào giỏ hàng";
            this.classList.remove("added");

            toast.classList.remove("show");

        }, 3000);

    });

});