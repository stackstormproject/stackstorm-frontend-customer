import { CartContents } from '../components/cart/CartContents';

export default function CartPage() {
  return (
    <div className="container page cart-page">
      <h1>Your bag</h1>
      <CartContents />
    </div>
  );
}
