import { useOutletContext } from "react-router-dom";
import { CartPage } from "../components/CartCheckout.jsx";

export default function CartRoutePage() {
  const v = useOutletContext();
  return <CartPage v={v} />;
}
