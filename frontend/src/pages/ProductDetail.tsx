import React from "react";
import { useParams } from "react-router-dom";
import ProductDetailInner from "./ProductDetailInner";

const ProductDetail = () => {
  const { id } = useParams();
  return <ProductDetailInner id={id} key={id ?? "product-detail"} />;
};

export default ProductDetail;
