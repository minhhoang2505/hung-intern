// app/product/[slug]/page.tsx
import Image from "next/image";
import { notFound } from "next/navigation";
import QuickOrderForm from "./QuickOrderForm";

interface Product {
  id: number;
  slug: string;
  title: { rendered: string };
  content: { rendered: string };
  meta?: {
    regular_price?: string;
    sale_price?: string;
    stock?: string;
  };
  _embedded?: {
    "wp:featuredmedia"?: { source_url: string; alt_text: string }[];
  };
}

async function getProductBySlug(slug: string): Promise<Product | null> {
  const url = `${process.env.WP_BASE_URL}/wp-json/wp/v2/seoulive_product?slug=${slug}&_embed`;
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error("Failed to fetch product");
  }

  const data: Product[] = await res.json();
  return data[0] ?? null;
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const image = product._embedded?.["wp:featuredmedia"]?.[0];
  const regularPrice = product.meta?.regular_price;
  const salePrice = product.meta?.sale_price;
  const stock = Number(product.meta?.stock ?? 0);

  return (
    <div className="max-w-5xl mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden">
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

      <div>
        <h1
          className="text-2xl font-bold mb-2"
          dangerouslySetInnerHTML={{ __html: product.title.rendered }}
        />

        <div className="mb-4">
          {salePrice ? (
            <>
              <span className="text-xl font-semibold text-red-600 mr-2">
                {salePrice}₫
              </span>
              <span className="text-sm line-through text-gray-400">
                {regularPrice}₫
              </span>
            </>
          ) : (
            <span className="text-xl font-semibold">{regularPrice}₫</span>
          )}
        </div>

        <div
          className="prose mb-6"
          dangerouslySetInnerHTML={{ __html: product.content.rendered }}
        />

        {stock > 0 ? (
          <QuickOrderForm productId={product.id} />
        ) : (
          <p className="text-red-600 font-medium">Sản phẩm tạm hết hàng.</p>
        )}
      </div>
    </div>
  );
}