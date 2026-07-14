const products = [
  { name: "Món A", price: 150 },
  { name: "Món B", price: 80 },
  { name: "Món C", price: 250 },
  { name: "Món D", price: 60 }
];

// Lọc sản phẩm có giá > 100
const filteredProducts = products.filter(product => product.price > 100);

// Tính tổng giá của các sản phẩm sau khi lọc
const totalPrice = filteredProducts.reduce((sum, product) => sum + product.price, 0);

console.log("Sản phẩm sau khi lọc:", filteredProducts);
console.log("Tổng tiền:", totalPrice);