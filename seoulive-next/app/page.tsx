import Image from "next/image";
import Link from "next/link";

interface Product {
  id: number;
  slug: string;
  title: { rendered: string };
  link: string;
  _embedded?: {
    "wp:featuredmedia"?: {
      source_url: string;
      alt_text: string;
    }[];
  };
}

async function getProducts(brandId?: string): Promise<Product[]> {
  const url = brandId
    ? `${process.env.WP_BASE_URL}/wp-json/wp/v2/seoulive_product?product_brand=${brandId}&_embed`
    : `${process.env.WP_BASE_URL}/wp-json/wp/v2/seoulive_product?_embed`;

  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error("Failed to fetch products");
  }

  return res.json();
}

const BRANDS = [
  { id: "3", name: "Essence" },
  { id: "4", name: "Chic Cosmetics" },
];

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ brand?: string }>;
}) {
  const { brand } = await searchParams;
  const products = await getProducts(brand);

  return (
    <div>
      {/* Filter buttons */}
      <div className="flex gap-3 p-6 flex-wrap">
        <Link
          href="/"
          className={`px-4 py-2 rounded ${
            !brand ? "bg-black text-white" : "bg-gray-200"
          }`}
        >
          Tất cả
        </Link>
        {BRANDS.map((b) => (
          <Link
            key={b.id}
            href={`/?brand=${b.id}`}
            className={`px-4 py-2 rounded ${
              brand === b.id ? "bg-black text-white" : "bg-gray-200"
            }`}
          >
            {b.name}
          </Link>
        ))}
      </div>

      {/* Grid sản phẩm */}
      {products.length === 0 ? (
        <p className="p-6 text-gray-500">Không có sản phẩm nào thuộc brand này.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-6">
          {products.map((product) => {
            const image = product._embedded?.["wp:featuredmedia"]?.[0];
            return (
              <Link
                key={product.id}
                href={`/product/${product.slug}`}
                className="border rounded-lg overflow-hidden hover:shadow-lg transition"
              >
                <div className="relative w-full aspect-square bg-gray-100">
                  {image?.source_url ? (
                    <Image
                      src={image.source_url}
                      alt={image.alt_text || product.title.rendered}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                      No image
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3
                    className="font-semibold text-sm"
                    dangerouslySetInnerHTML={{ __html: product.title.rendered }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}