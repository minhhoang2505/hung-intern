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

async function getProducts(): Promise<Product[]> {
  const res = await fetch(
    "http://test1.local/wp-json/wp/v2/seoulive_product?_embed",
    { cache: "no-store" }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch products");
  }

  return res.json();
}

export default async function HomePage() {
  const products = await getProducts();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-6">
      {products.map((product) => {
        const image = product._embedded?.["wp:featuredmedia"]?.[0];
        console.log(product);

        return (
          <Link
            key={product.id}
            href={product.link}
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
  );
}