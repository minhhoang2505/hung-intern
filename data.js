/**
 * data.js — TẦNG DỮ LIỆU (Data Layer)
 * ------------------------------------------------
 * File này KHÔNG chứa bất kỳ logic DOM nào.
 * Nó chỉ export ra một mảng Object thuần (products) để app.js đọc và render.
 * Mỗi sản phẩm có cấu trúc: id, name, price, salePrice, category, image, isLiveShow.
 *
 * - price / salePrice: đơn vị VNĐ (số nguyên, chưa format).
 *   salePrice = null nghĩa là sản phẩm không giảm giá.
 * - category: "skincare" | "makeup" | "fashion" | "accessories"
 * - isLiveShow: true nếu sản phẩm từng lên Live Show (dùng cho khu Live Show Favorites).
 * - image: ảnh minh hoạ (placeholder), thay bằng ảnh thật khi có nguồn chính thức.
 */

// data.js

const products = [
    {
        id: 1,
        brand: "Test",
        badge: "BEST SELLER",
        name: "Test 1",
        price: 32,
        salePrice: 24,
        category: "fashion",
        image: "img/placeholder.jpg",
        isLiveShow: true
    },
    {
        id: 2,
        brand: "Test",
        badge: "NEW",
        name: "Test 2",
        price: 22,
        salePrice: 18,
        category: "lifestyle",
        image: "img/placeholder.jpg",
        isLiveShow: true
    },
    {
        id: 3,
        brand: "Test",
        badge: "ON AIR",
        name: "Test 3",
        price: 28,
        salePrice: 21,
        category: "tech",
        image: "img/placeholder.jpg",
        isLiveShow: true
    },
    {
        id: 4,
        brand: "Test",
        badge: null,
        name: "Test 4",
        price: 38,
        salePrice: 29,
        category: "home",
        image: "img/placeholder.jpg",
        isLiveShow: true
    },
];
/**
 * =================================================================
 * KHU VỰC "DON'T MISS THIS OPPORTUNITY TODAY" (livestream + sản phẩm)
 * =================================================================
 * STREAM: thông tin hiển thị trên khung livestream (tag, mốc thời gian, viewer).
 * opportunityProducts: 3 sản phẩm hiển thị bên cạnh khung livestream,
 * có thêm "brand" và "badge" so với cấu trúc products[] gốc.
 */
 
const STREAM = {
    tag: "Test Live",
    viewersStart: 1234,
    elapsedSeconds: 5678,   
    totalSeconds: 91011,    
    thumbnail: "img/teststream.jpg",
    chatLines: [
        "Hihi",
        "Hehe",
        "Haha"
    ]
};
 
const opportunityProducts = [
    {
        id: 101,
        brand: "Test",
        badge: "BEST SELLER",
        name: "Test 101",
        price: 15.50,
        salePrice: 96.50,
        image: "img/placeholder.jpg"
    },
    {
        id: 102,
        brand: "Test",
        badge: null,
        name: "Test 102",
        price: 15.50,
        salePrice: 15.50,
        image: "img/placeholder.jpg"
    },
    {
        id: 103,
        brand: "Test",
        badge: null,
        name: "Test 103",
        price: 15.50,
        salePrice: 15.50,
        image: "img/placeholder.jpg"
    }
];


/**
 * =================================================================
 * KHU VỰC "TRUSTED BY LEADING BRANDS"
 * =================================================================
 * Mỗi brand có logo (chữ hiển thị trong vòng tròn), mô tả ngắn,
 * và danh sách vài sản phẩm tiêu biểu (name, price, salePrice, image).
 * salePrice = null nghĩa là sản phẩm không giảm giá, chỉ hiển thị 1 giá.
 */

const brands = [
    {
        id: 1,
        logo: "ANUA",
        name: "ANUA",
        description: "Famous for its product line made with heartleaf extract, which helps soothe the skin.",
        products: [
            {
                name: "PDRN Hyaluronic Acid Capsule 100 Serum",
                price: 15.50,
                salePrice: 15.50,
                image: "img/placeholder.jpg"
            },
            {
                name: "Niacinamide 10 TXA 4 Serum for Brightening and Dark Spots",
                price: 24.50,
                salePrice: null,
                image: "img/placeholder.jpg"
            },
            {
                name: "Heartleaf LHA Moisture Peeling Gel",
                price: 15.50,
                salePrice: 15.50,
                image: "img/placeholder.jpg"
            }
        ]
    },
    {
        id: 2,
        logo: "rom&nd",
        name: "ROM&ND",
        description: "Featuring lip tints and eyeshadows in trendy shades.",
        products: [
            {
                name: "Glasting color gloss",
                price: 15.50,
                salePrice: 15.50,
                image: "img/placeholder.jpg"
            },
            {
                name: "Color lip matte",
                price: 15.50,
                salePrice: 15.50,
                image: "img/placeholder.jpg"
            },
            {
                name: "Better than cheek",
                price: 15.50,
                salePrice: 15.50,
                image: "img/placeholder.jpg"
            }
        ]
    },
    {
        id: 3,
        logo: "Kaja",
        name: "KAJA",
        description: "A convenient makeup brand with innovative packaging.",
        products: [
            {
                name: "Beauty Bento",
                price: 15.50,
                salePrice: 15.50,
                image: "img/placeholder.jpg"
            },
            {
                name: "Bento Pouch",
                price: 15.50,
                salePrice: 15.50,
                image: "img/placeholder.jpg"
            },
            {
                name: "Whipped Dream",
                price: 15.50,
                salePrice: 15.50,
                image: "img/placeholder.jpg"
            }
        ]
    }
];