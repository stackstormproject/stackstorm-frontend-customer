import React, { useState, useEffect } from 'react';
import {
  Package,
  Search,
  Filter,
  ArrowLeft,
  Truck,
  CheckCircle2,
  Clock,
  Sparkles,
  ShoppingBag,
  Loader2,
} from 'lucide-react';
import { OrderCard } from '../components/orders/OrderCard';
import { ReturnExchangeModal } from '../components/orders/ReturnExchangeModal';
import orderApi, { FALLBACK_ORDERS } from '../api/order.api';
import './OrderHistoryPage.css';

/**
 * OrderHistoryPage Component
 *
 * Lists past and active customer orders with status filters, search,
 * and 4-stage delivery milestone stepper tracking (AC1–AC4).
 */
export function OrderHistoryPage({
  initialOrders = null,
  onBackToCatalog,
  onViewInvoice,
  onReturnRequest,
  className = '',
}) {
  const [orders, setOrders] = useState(initialOrders || FALLBACK_ORDERS);
  const [isLoading, setIsLoading] = useState(!initialOrders);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'active' | 'delivered'
  const [searchQuery, setSearchQuery] = useState('');
  const [returnModalOrder, setReturnModalOrder] = useState(null);

  useEffect(() => {
    let isMounted = true;
    if (!initialOrders) {
      orderApi
        .getMyOrders()
        .then((data) => {
          if (isMounted) {
            setOrders(data || FALLBACK_ORDERS);
            setIsLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) {
            setOrders(FALLBACK_ORDERS);
            setIsLoading(false);
          }
        });
    } else {
      setOrders(initialOrders);
      setIsLoading(false);
    }
    return () => {
      isMounted = false;
    };
  }, [initialOrders]);

  // Filtering Logic
  const filteredOrders = orders.filter((order) => {
    const status = (order.status || '').toLowerCase();

    // Tab Filter
    if (activeFilter === 'active') {
      if (
        status !== 'placed' &&
        status !== 'processing' &&
        status !== 'shipped' &&
        status !== 'in_transit'
      ) {
        return false;
      }
    } else if (activeFilter === 'delivered') {
      if (status !== 'delivered' && status !== 'completed') {
        return false;
      }
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchNumber = (order.order_number || order.id || '').toLowerCase().includes(q);
      const matchItem = (order.items || []).some((it) =>
        (it.title || '').toLowerCase().includes(q)
      );
      if (!matchNumber && !matchItem) return false;
    }

    return true;
  });

  const activeCount = orders.filter((o) => {
    const s = (o.status || '').toLowerCase();
    return s === 'placed' || s === 'processing' || s === 'shipped';
  }).length;

  if (isLoading) {
    return (
      <div className="orders-page-loading" data-testid="orders-loading">
        <Loader2 size={36} className="spinner-icon" />
        <p>Loading your Dickwella Fashion Corner order history...</p>
      </div>
    );
  }

  return (
    <div className={`order-history-page ${className}`} data-testid="order-history-page">
      <div className="container">
        {/* Navigation Bar */}
        <div className="order-history__nav-bar">
          <button
            type="button"
            className="order-history__back-btn"
            onClick={onBackToCatalog}
            data-testid="orders-back-to-catalog-btn"
          >
            <ArrowLeft size={16} />
            <span>Return to Boutique Catalog</span>
          </button>
        </div>

        {/* Page Hero */}
        <div className="order-history__hero">
          <div>
            <div className="order-history__badge">
              <Sparkles size={14} />
              <span>Southern Province Handloom Courier Telemetry</span>
            </div>
            <h1 className="order-history__title">Order History & Delivery Tracking</h1>
            <p className="order-history__subtitle">
              Track your artisan batik apparel packages, view invoices, and initiate 30-day returns.
            </p>
          </div>

          <div className="order-history__hero-stats">
            <div className="order-stat-pill">
              <Truck size={18} color="#D97706" />
              <div>
                <span className="stat-num" data-testid="active-orders-count">
                  {activeCount}
                </span>
                <span className="stat-label">In Transit</span>
              </div>
            </div>
            <div className="order-stat-pill">
              <Package size={18} color="#10B981" />
              <div>
                <span className="stat-num">{orders.length}</span>
                <span className="stat-label">Total Orders</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="order-history__controls">
          <div className="order-filter-pills" role="tablist" aria-label="Order status filter tabs">
            <button
              type="button"
              role="tab"
              aria-selected={activeFilter === 'all'}
              className={`filter-pill ${activeFilter === 'all' ? 'filter-pill--active' : ''}`}
              onClick={() => setActiveFilter('all')}
              data-testid="filter-all"
            >
              All Orders ({orders.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeFilter === 'active'}
              className={`filter-pill ${activeFilter === 'active' ? 'filter-pill--active' : ''}`}
              onClick={() => setActiveFilter('active')}
              data-testid="filter-active"
            >
              Active / In Transit ({activeCount})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeFilter === 'delivered'}
              className={`filter-pill ${activeFilter === 'delivered' ? 'filter-pill--active' : ''}`}
              onClick={() => setActiveFilter('delivered')}
              data-testid="filter-delivered"
            >
              Delivered
            </button>
          </div>

          <div className="order-search-wrap">
            <Search size={16} className="search-icon" />
            <input
              type="search"
              className="order-search-input"
              placeholder="Search by order ID or item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="order-search-input"
            />
          </div>
        </div>

        {/* Orders List Grid */}
        <div className="order-history__list" data-testid="orders-list-wrap">
          {filteredOrders.length === 0 ? (
            <div className="orders-empty-state" data-testid="orders-empty-state">
              <Package size={48} className="empty-icon" />
              <h3>No Orders Found</h3>
              <p>
                {searchQuery
                  ? `No orders matching "${searchQuery}". Try searching a different term.`
                  : 'You have not placed any orders under this filter yet.'}
              </p>
              <button
                type="button"
                className="btn-primary"
                onClick={onBackToCatalog}
                data-testid="empty-explore-btn"
              >
                <ShoppingBag size={16} />
                <span>Explore Dickwella Catalog</span>
              </button>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <OrderCard
                key={order.id || order.order_number}
                order={order}
                onViewInvoice={onViewInvoice}
                onReturnRequest={onReturnRequest || ((ord) => setReturnModalOrder(ord))}
              />
            ))
          )}
        </div>

        {/* 30-Day Return / Exchange Modal (STORM-FE-016) */}
        {returnModalOrder && (
          <ReturnExchangeModal
            isOpen={!!returnModalOrder}
            onClose={() => setReturnModalOrder(null)}
            order={returnModalOrder}
            onSuccess={() => {
              setReturnModalOrder(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

export default OrderHistoryPage;
