import Layout from "@/components/Layout";
import ProductForm from "@/components/ProductForm";
import axios from "axios";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Loader } from "@/components/ui";

export default function EditProductPage() {
  const [productInfo, setProductInfo] = useState(null);
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (!id) return;
    let active = true;

    axios.get(`/api/products?id=${id}`).then((res) => {
      if (active) setProductInfo(res.data.data);
    });

    return () => {
      active = false;
    };
  }, [id]);

  return (
    <Layout>
           {productInfo ? (
        <ProductForm key={productInfo._id} {...productInfo} />
      ) : (
        <div className="min-h-screen flex items-center justify-center">
          <Loader size="md" text="Loading product..." />
        </div>
      )}
    </Layout>
  );
}
