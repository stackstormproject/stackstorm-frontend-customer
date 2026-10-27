import { Link, useParams } from 'react-router-dom';
import NotFoundPage from './NotFoundPage';

// Wording follows the SRS business rules and checkout.service constants.
const TOPICS = {
  delivery: {
    title: 'Delivery and collection',
    body: [
      'We deliver to all 25 districts. Standard delivery costs LKR 450 and is free on orders of LKR 10,000 or more.',
      'Orders usually arrive in 2 to 4 working days. You can follow each order from Your orders.',
      'You can also collect from the shop on Main Street, Dickwella, at no charge.',
      'When you start checkout we hold your items for 15 minutes so nobody else can buy them while you pay.',
    ],
  },
  returns: {
    title: 'Returns and exchanges',
    body: [
      'You can return or exchange an item within 30 days of delivery. Start a return from the order in Your orders.',
      'Items marked final sale cannot be returned or exchanged.',
      'Refunds go back to the card you paid with once we have received and checked the item.',
    ],
  },
};

export default function HelpPage() {
  const { topic } = useParams();
  const content = TOPICS[topic];
  if (!content) return <NotFoundPage />;
  return (
    <article className="container page prose">
      <h1>{content.title}</h1>
      {content.body.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      <p>
        <Link to="/shop">Continue shopping</Link>
      </p>
    </article>
  );
}
