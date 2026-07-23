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
    {
        id: 5,
        brand: "Test",
        badge: "NEW",
        name: "Test 5",
        price: 49,
        salePrice: 24,
        category: "accessories",
        image: "img/placeholder.jpg",
        isLiveShow: true
    },
    {
        id: 6,
        brand: "Test",
        badge: "NEW",
        name: "Test 6",
        price: 49,
        salePrice: 24,
        category: "fashion",
        image: "img/placeholder.jpg",
        isLiveShow: true
    },
    {
        id: 7,
        brand: "Test",
        badge: "NEW",
        name: "Test 7",
        price: 49,
        salePrice: 24,
        category: "tech",
        image: "img/placeholder.jpg",
        isLiveShow: true
    },
    {
        id: 8,
        brand: "Test",
        badge: "NEW",
        name: "Test 8",
        price: 49,
        salePrice: 24,
        category: "home",
        image: "img/placeholder.jpg",
        isLiveShow: true
    },
    {
        id: 9,
        brand: "Test",
        badge: "NEW",
        name: "Test 9",
        price: 49,
        salePrice: 24,
        category: "lifestyle",
        image: "img/placeholder.jpg",
        isLiveShow: true
    },
    {
        id: 10,
        brand: "Test",
        badge: "NEW",
        name: "Test 10",
        price: 49,
        salePrice: 24,
        category: "lifestyle",
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
        salePrice: 15,
        image: "img/placeholder.jpg"
    },
    {
        id: 102,
        brand: "Test",
        badge: null,
        name: "Test 102",
        price: 15.50,
        salePrice: 15.20,
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


/**
 * =================================================================
 * KHU VỰC "NEW ARRIVALS" (2 banner quảng cáo livestream)
 * =================================================================
 */

const newArrivalsBanners = [
    {
        id: 1,
        title: "Shop What Influencers Are Selling — Live",
        image: "img/imgplaceholder.jpg"
    },
    {
        id: 2,
        title: "Shop What Influencers Are Selling — Live",
        image: "img/imgplaceholder.jpg"
    }
];


/**
 * =================================================================
 * KHU VỰC "TRENDING NOW, POPULAR"
 * =================================================================
 * trendingSpotlight: sản phẩm nổi bật bên trái (đang phát livestream,
 * có đếm ngược countdown + số người đang xem).
 * trendingRankList: danh sách xếp hạng 01-05 bên phải.
 */

const trendingSpotlight = {
    brand: "KAINE",
    name: "Rosemary Relief Gel Cleanser",
    price: 15.50,
    salePrice: 15.50,
    discountLabel: "sale 20%",
    viewingCount: 2553,
    countdownSeconds: 81365, // hiển thị dạng 22 : 36 : 05
    image: "img/imgplaceholder.jpg"
};

const trendingRankList = [
    { rank: 1, name: "Rosemary Relief Gel Cleanser" },
    { rank: 2, name: "Rosemary Relief Gel Cleanser" },
    { rank: 3, name: "Rosemary Relief Gel Cleanser" },
    { rank: 4, name: "Rosemary Relief Gel Cleanser" },
    { rank: 5, name: "Rosemary Relief Gel Cleanser" }
];


/**
 * =================================================================
 * KHU VỰC "#SEOULIVE" (lưới ảnh kiểu Instagram feed)
 * =================================================================
 */

const instagramFeed = [
    "img/imgplaceholder.jpg",
    "img/imgplaceholder.jpg",
    "img/imgplaceholder.jpg",
    "img/imgplaceholder.jpg",
    "img/imgplaceholder.jpg",
    "img/imgplaceholder.jpg",
    "img/imgplaceholder.jpg",
    "img/imgplaceholder.jpg",
    "img/imgplaceholder.jpg",
    "img/imgplaceholder.jpg",
    "img/imgplaceholder.jpg",
    "img/imgplaceholder.jpg"
];


/**
 * =================================================================
 * FOOTER
 * =================================================================
*/

const footerColumns = [
    {
        title: "Information",
        links: ["Our Story", "Our Journal", "FAQ", "Contact Us"]
    },
    {
        title: "Collections",
        links: ["Face makeup", "Skin care", "Tools", "Gift set"]
    },
    {
        title: "Need Some Help ?",
        links: ["Privacy Policy", "Shipping Info", "Return & Refund Policy", "Payment Methods"]
    }
];