import { woo } from "./woo";

export async function getProduct(id: number) {
  const res = await woo.get(`products/${id}`);
  return res.data;
}