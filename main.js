const initStore = document.getElementById("initStore");
const loadingStatus = document.getElementById("loadingStatus");
const categoryFilter = document.getElementById("categoryFilter");
const productGrid = document.getElementById("productGrid");


function truncateText(text, length = 35){
    return text.length > length
        ? text.slice(0, length) + "..."
        : text;
}

function renderProducts(products){

    productGrid.textContent = "";

    const fragment = document.createDocumentFragment();

    products.forEach(product=>{

        const card=document.createElement("div");
        card.className="card";

        const img=document.createElement("img");
        img.src=product.image;
        img.alt=product.title;

        const title=document.createElement("div");
        title.className="title";
        title.textContent=truncateText(product.title);

        const price=document.createElement("div");
        price.className="price";
        price.textContent="$"+product.price;

        card.appendChild(img);
        card.appendChild(title);
        card.appendChild(price);

        fragment.appendChild(card);

    });

    productGrid.appendChild(fragment);

}


function renderCategories(categories){

    categoryFilter.textContent="";

    const fragment=document.createDocumentFragment();

    categories.forEach(category=>{

        const btn=document.createElement("button");
        btn.textContent=category;
        btn.dataset.category=category;

        fragment.appendChild(btn);

    });

    categoryFilter.appendChild(fragment);

}


initStore.addEventListener("click",async()=>{

    initStore.disabled=true;

    loadingStatus.textContent="Đang khởi tạo cửa hàng...";

    try{

        const [categoryRes,productRes]=await Promise.all([
            fetch("https://fakestoreapi.com/products/categories"),
            fetch("https://fakestoreapi.com/products?limit=8")
        ]);

        const categories=await categoryRes.json();
        const products=await productRes.json();

        renderCategories(categories);

        renderProducts(products);

    }
    catch(error){

        loadingStatus.textContent="Không thể tải dữ liệu.";

        console.error(error);

    }
    finally{

        initStore.disabled = false;
}

});

categoryFilter.addEventListener("click",async(e)=>{

    if(e.target.tagName!=="BUTTON") return;

    const category=e.target.dataset.category;

    loadingStatus.textContent="Đang tải danh mục...";

    productGrid.classList.add("loading");

    try{

        const response=await fetch(`https://fakestoreapi.com/products/category/${category}`);

        const products=await response.json();

        renderProducts(products);
        loadingStatus.textContent = "";
    } catch (error) {
        loadingStatus.textContent = "Không tải được danh mục.";
        console.error(error);
    } finally {
        productGrid.classList.remove("loading");
    }

});