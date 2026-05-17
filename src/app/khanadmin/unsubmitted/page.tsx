'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { AbandonedOrder } from '@/utils/abandonedOrders';
import { useProducts } from '@/context/ProductContext';
import { useToast } from '@/components/Toast';
import { Product } from '@/data/products';
import * as XLSX from 'xlsx';

// Translation function type
type TFunction = (key: string, options?: { defaultValue?: string }) => string;

// Translation map for admin unsubmitted orders
const translations: Record<string, string> = {
  'admin.unsubmitted.orderDetails': 'Unsubmitted Order Details',
  'admin.unsubmitted.status': 'Unsubmitted',
  'admin.unsubmitted.quantity': 'Quantity',
  'admin.unsubmitted.customerInfo': 'Customer Information',
  'admin.unsubmitted.name': 'Name',
  'admin.unsubmitted.phone': 'Phone',
  'admin.unsubmitted.city': 'City',
  'admin.unsubmitted.address': 'Address',
  'admin.unsubmitted.createdAt': 'Created At',
  'admin.unsubmitted.title': 'Unsubmitted Orders',
  'admin.unsubmitted.description': 'Orders that were started but not completed',
  'admin.unsubmitted.product': 'Product',
  'admin.unsubmitted.date': 'Date',
  'admin.unsubmitted.actions': 'Actions',
  'admin.unsubmitted.view': 'View',
  'admin.unsubmitted.delete': 'Delete',
  'admin.unsubmitted.confirmDelete': 'Delete Unsubmitted Order?',
  'admin.unsubmitted.confirmDeleteMessage': 'This action cannot be undone.',
  'admin.unsubmitted.noOrders': 'No unsubmitted orders found',
  'admin.editOrder': 'Edit Order',
  'admin.customerName': 'Customer Name',
  'admin.phoneNumber': 'Phone Number',
  'admin.orders.city': 'City',
  'admin.deliveryAddress': 'Delivery Address',
  'admin.orders.quantity': 'Quantity',
  'admin.orders.export.selected': 'Export Selected',
  'admin.orders.export.all': 'Export All',
  'admin.orders.export.noOrdersSelected': 'Please select orders to export',
  'admin.orders.selectAll': 'Select All',
  'admin.cancel': 'Cancel',
  'admin.save': 'Save',
  'admin.delete': 'Delete',
};

// Detail Modal Component
interface DetailModalProps {
  order: AbandonedOrder | null;
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  t: TFunction;
}

function DetailModal({ order, isOpen, onClose, products, t }: DetailModalProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  if (!isOpen || !order) return null;

  const product = products.find(p => p.id.toString() === order.product_id);
  const productName = product 
    ? (typeof product.title === 'object' ? product.title.en : product.title)
    : order.product_id;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: isMobile ? '10px' : '20px',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: isMobile ? '100%' : '500px',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: isMobile ? '16px' : '20px',
          borderBottom: '1px solid #eee',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          backgroundColor: '#fff',
          borderRadius: '16px 16px 0 0',
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: '600', color: '#1a1a2e' }}>
              {t('admin.unsubmitted.orderDetails', { defaultValue: 'Unsubmitted Order Details' })}
            </h2>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '2px', wordBreak: 'break-all' }}>
              ID: {order.id.substring(0, isMobile ? 15 : 25)}...
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: isMobile ? '32px' : '36px',
              height: isMobile ? '32px' : '36px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: '#f5f5f5',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginLeft: '12px',
            }}
          >
            <svg width={isMobile ? '16' : '18'} height={isMobile ? '16' : '18'} viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: isMobile ? '16px' : '20px' }}>
          {/* Status Badge */}
          <div style={{ marginBottom: '20px' }}>
            <span style={{
              display: 'inline-block',
              padding: '6px 12px',
              backgroundColor: '#FFF3E0',
              color: '#FF9800',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '600',
            }}>
              {t('admin.unsubmitted.status', { defaultValue: 'Unsubmitted' })}
            </span>
          </div>

          {/* Product Info */}
          {product && (
            <div style={{ marginBottom: '20px', padding: isMobile ? '12px' : '16px', backgroundColor: '#f8f9fa', borderRadius: '12px' }}>
              <div style={{ display: 'flex', gap: isMobile ? '12px' : '16px', alignItems: 'center', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                {product.image && (
                  <div style={{ 
                    width: isMobile ? '60px' : '80px', 
                    height: isMobile ? '60px' : '80px', 
                    borderRadius: '10px', 
                    overflow: 'hidden', 
                    position: 'relative', 
                    flexShrink: 0 
                  }}>
                    <Image src={product.image} alt={productName} fill style={{ objectFit: 'cover' }} />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ 
                    fontSize: isMobile ? '13px' : '14px', 
                    fontWeight: '600', 
                    color: '#1a1a2e', 
                    marginBottom: '4px',
                    wordBreak: 'break-word'
                  }}>
                    {productName}
                  </p>
                  <p style={{ fontSize: '12px', color: '#666' }}>
                    {t('admin.unsubmitted.quantity', { defaultValue: 'Quantity' })}: {order.quantity}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Customer Info */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a2e', marginBottom: '12px' }}>
              {t('admin.unsubmitted.customerInfo', { defaultValue: 'Customer Information' })}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <p style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                  {t('admin.unsubmitted.name', { defaultValue: 'Name' })}
                </p>
                <p style={{ fontSize: '14px', color: '#333', fontWeight: '500' }}>{order.name || '-'}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                  {t('admin.unsubmitted.phone', { defaultValue: 'Phone' })}
                </p>
                <p style={{ fontSize: '14px', color: '#333', fontWeight: '500' }}>{order.phone || '-'}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                  {t('admin.unsubmitted.city', { defaultValue: 'City' })}
                </p>
                <p style={{ fontSize: '14px', color: '#333', fontWeight: '500' }}>{order.city || '-'}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                  {t('admin.unsubmitted.address', { defaultValue: 'Address' })}
                </p>
                <p style={{ fontSize: '14px', color: '#333', fontWeight: '500' }}>{order.address || '-'}</p>
              </div>
            </div>
          </div>

          {/* Date Info */}
          <div style={{ paddingTop: '16px', borderTop: '1px solid #eee' }}>
            <p style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>
              {t('admin.unsubmitted.createdAt', { defaultValue: 'Created At' })}
            </p>
            <p style={{ fontSize: '14px', color: '#333', fontWeight: '500' }}>{formatDate(order.created_at)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Edit Modal Component
interface EditModalProps {
  order: AbandonedOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedOrder: AbandonedOrder) => void;
  t: TFunction;
}

function EditModal({ order, isOpen, onClose, onSave, t }: EditModalProps) {
  // Initialize form data from order - key prop on form will reset this when order changes
  const [formData, setFormData] = useState(() => ({
    name: order?.name || '',
    phone: order?.phone || '',
    city: order?.city || '',
    address: order?.address || '',
    quantity: order?.quantity || '',
  }));

  if (!isOpen || !order) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedOrder: AbandonedOrder = {
      ...order,
      ...formData,
    };
    onSave(updatedOrder);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #eee',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          backgroundColor: '#fff',
          borderRadius: '16px 16px 0 0',
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1a1a2e' }}>
            {t('admin.editOrder', { defaultValue: 'Edit Order' })}
          </h2>
          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: '#f5f5f5',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form key={order?.id || 'new'} onSubmit={handleSubmit} style={{ padding: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Customer Name */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#666', marginBottom: '6px' }}>
                {t('admin.customerName', { defaultValue: 'Customer Name' })}
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#666', marginBottom: '6px' }}>
                {t('admin.phoneNumber', { defaultValue: 'Phone Number' })}
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
                required
              />
            </div>

            {/* City */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#666', marginBottom: '6px' }}>
                {t('admin.orders.city', { defaultValue: 'City' })}
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
                required
              />
            </div>

            {/* Address */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#666', marginBottom: '6px' }}>
                {t('admin.deliveryAddress', { defaultValue: 'Delivery Address' })}
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  resize: 'vertical',
                }}
                required
              />
            </div>

            {/* Quantity */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#666', marginBottom: '6px' }}>
                {t('admin.orders.quantity', { defaultValue: 'Quantity' })}
              </label>
              <input
                type="text"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
                required
              />
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                backgroundColor: '#fff',
                color: '#666',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              {t('admin.cancel', { defaultValue: 'Cancel' })}
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#4CAF50',
                color: '#fff',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              {t('admin.save', { defaultValue: 'Save' })}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UnsubmittedOrdersPage() {
  const { products } = useProducts();
  const { showToast } = useToast();
  
  // Translation function
  const t: TFunction = (key: string, options?: { defaultValue?: string }) => {
    return translations[key] || options?.defaultValue || key;
  };
  const [abandonedOrders, setAbandonedOrders] = useState<AbandonedOrder[]>([]);
  const [viewOrder, setViewOrder] = useState<AbandonedOrder | null>(null);
  const [editOrder, setEditOrder] = useState<AbandonedOrder | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; orderId: string | null }>({
    isOpen: false,
    orderId: null,
  });
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 100;

  // Pagination calculations
  const totalPages = Math.ceil(abandonedOrders.length / ordersPerPage);
  const startIndex = (currentPage - 1) * ordersPerPage;
  const endIndex = startIndex + ordersPerPage;
  const paginatedOrders = abandonedOrders.slice(startIndex, endIndex);

  // Detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Close mobile menu when screen size changes to desktop

  // Load abandoned orders from API
  useEffect(() => {
    const loadOrders = async () => {
      try {
        const response = await fetch('/api/abandoned', { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          const orders = data.abandonedOrders || [];
          // Sort by created_at (newest first)
          orders.sort((a: AbandonedOrder, b: AbandonedOrder) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          setAbandonedOrders(orders);
        }
      } catch (error) {
        console.error('Error loading abandoned orders:', error);
      }
    };

    loadOrders();

    // Reload every 30 seconds to catch new abandoned orders (reduced frequency)
    const interval = setInterval(loadOrders, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleDelete = (id: string) => {
    setDeleteConfirm({ isOpen: true, orderId: id });
  };

  const confirmDelete = async () => {
    if (deleteConfirm.orderId) {
      try {
        const response = await fetch(`/api/abandoned?id=${deleteConfirm.orderId}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          setAbandonedOrders(prev => prev.filter(order => order.id !== deleteConfirm.orderId));
          setDeleteConfirm({ isOpen: false, orderId: null });
          showToast('Item Deleted Successfully', 'success');
        }
      } catch (error) {
        console.error('Error deleting order:', error);
        showToast('Failed to delete order', 'error');
      }
    }
  };

  const handleEditOrder = (order: AbandonedOrder) => {
    setEditOrder(order);
  };

  const handleSaveEditedOrder = async (updatedOrder: AbandonedOrder) => {
    try {
      const response = await fetch('/api/abandoned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: updatedOrder.name,
          phone: updatedOrder.phone,
          city: updatedOrder.city,
          address: updatedOrder.address,
          quantity: updatedOrder.quantity,
          product_id: updatedOrder.product_id,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setAbandonedOrders(prev => 
          prev.map(order => order.id === updatedOrder.id ? data.abandonedOrder : order)
        );
        setEditOrder(null);
        showToast('Changes Saved', 'success');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      showToast('Failed to update order', 'error');
    }
  };

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id.toString() === productId);
    if (!product) return productId;
    
    return typeof product.title === 'object' 
      ? product.title.en
      : product.title;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Handle checkbox selection
  const handleSelectOrder = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === abandonedOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(abandonedOrders.map(o => o.id));
    }
  };

  // Export to Excel function
  const exportToExcel = (ordersToExport: AbandonedOrder[]) => {
    if (ordersToExport.length === 0) {
      alert(t('admin.orders.export.noOrdersSelected'));
      return;
    }

    // Prepare data for Excel
    const excelData = ordersToExport.map(order => ({
      'Order ID': order.id.substring(0, 30),
      'Customer': order.name || 'N/A',
      'Phone': order.phone || 'N/A',
      'City': order.city || 'N/A',
      'Address': order.address || 'N/A',
      'Product': getProductName(order.product_id),
      'Quantity': order.quantity,
      'Created At': formatDate(order.created_at),
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    ws['!cols'] = [
      { wch: 30 }, // Order ID
      { wch: 20 }, // Customer
      { wch: 15 }, // Phone
      { wch: 15 }, // City
      { wch: 30 }, // Address
      { wch: 40 }, // Product
      { wch: 10 }, // Quantity
      { wch: 20 }, // Created At
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Unsubmitted Orders');

    // Generate filename with current date
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Unsubmitted_Orders_${dateStr}.xlsx`;

    // Export file
    XLSX.writeFile(wb, filename);

    // Clear selection after export
    setSelectedOrders([]);
  };

  const handleExportSelected = () => {
    const ordersToExport = abandonedOrders.filter(o => selectedOrders.includes(o.id));
    exportToExcel(ordersToExport);
  };

  const handleExportAll = () => {
    exportToExcel(abandonedOrders);
  };

  // Bulk delete selected orders
  const handleBulkDelete = () => {
    if (selectedOrders.length === 0) return;
    setDeleteConfirm({ isOpen: true, orderId: 'bulk' });
  };

  const confirmBulkDelete = async () => {
    try {
      // Delete all selected orders
      for (const orderId of selectedOrders) {
        await fetch(`/api/abandoned?id=${orderId}`, {
          method: 'DELETE',
        });
      }
      
      // Update state
      setAbandonedOrders(prev => prev.filter(order => !selectedOrders.includes(order.id)));
      setSelectedOrders([]);
      setDeleteConfirm({ isOpen: false, orderId: null });
      showToast(`${selectedOrders.length} orders deleted successfully`, 'success');
    } catch (error) {
      console.error('Error deleting orders:', error);
      showToast('Failed to delete some orders', 'error');
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <div style={{ 
        flex: 1, 
        marginLeft: '0', 
        padding: isMobile ? '16px' : '24px', 
        paddingTop: isMobile ? '90px' : '24px',
        width: '100%',
        maxWidth: '100%',
        overflowX: 'hidden'
      }} className="lg:ml-64">
        {/* Header with Export Buttons */}
        <div style={{ 
          marginBottom: isMobile ? '16px' : '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          <div>
            <h1 style={{ 
              fontSize: isMobile ? '22px' : '28px', 
              fontWeight: '700', 
              color: '#1a1a2e', 
              marginBottom: '8px' 
            }}>
              {t('admin.unsubmitted.title', { defaultValue: 'Unsubmitted Orders' })}
            </h1>
            <p style={{ color: '#666', fontSize: isMobile ? '13px' : '14px' }}>
              {t('admin.unsubmitted.description', { defaultValue: 'Orders that were started but not completed' })} ({abandonedOrders.length})
            </p>
          </div>

          {/* Export and Delete Buttons */}
          {abandonedOrders.length > 0 && (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {selectedOrders.length > 0 && (
                <>
                  <button
                    onClick={handleExportSelected}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: isMobile ? '10px 14px' : '12px 18px',
                      borderRadius: '10px',
                      border: 'none',
                      backgroundColor: '#4CAF50',
                      color: '#fff',
                      fontSize: isMobile ? '13px' : '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
                      transition: 'all 0.2s ease',
                    }}
                    className="hover:opacity-90"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    {t('admin.orders.export.selected')} ({selectedOrders.length})
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: isMobile ? '10px 14px' : '12px 18px',
                      borderRadius: '10px',
                      border: 'none',
                      backgroundColor: '#e53935',
                      color: '#fff',
                      fontSize: isMobile ? '13px' : '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(229, 57, 53, 0.3)',
                      transition: 'all 0.2s ease',
                    }}
                    className="hover:opacity-90"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    {t('admin.delete')} ({selectedOrders.length})
                  </button>
                </>
              )}
              <button
                onClick={handleExportAll}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: isMobile ? '10px 14px' : '12px 18px',
                  borderRadius: '10px',
                  border: '2px solid #1a1a2e',
                  backgroundColor: '#fff',
                  color: '#1a1a2e',
                  fontSize: isMobile ? '13px' : '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                className="hover:bg-gray-50"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
                {t('admin.orders.export.all')}
              </button>
            </div>
          )}
        </div>

        {/* Empty State */}
        {abandonedOrders.length === 0 ? (
          <div style={{ 
            backgroundColor: '#fff', 
            borderRadius: '14px', 
            padding: '60px 20px', 
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <p style={{ color: '#999', fontSize: '16px' }}>
              {t('admin.unsubmitted.noOrders', { defaultValue: 'No unsubmitted orders found' })}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table - Only shows on large screens */}
            {!isMobile && (
              <div style={{ 
                backgroundColor: '#fff', 
                borderRadius: '14px', 
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)', 
                overflow: 'hidden',
                width: '100%'
              }}>
              <div style={{ overflowX: 'auto', width: '100%' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #eee' }}>
                      <th style={{ textAlign: 'center', padding: '12px 16px', width: '50px' }}>
                        <input
                          type="checkbox"
                          checked={abandonedOrders.length > 0 && selectedOrders.length === abandonedOrders.length}
                          onChange={handleSelectAll}
                          style={{
                            width: '18px',
                            height: '18px',
                            cursor: 'pointer',
                            accentColor: '#4CAF50',
                          }}
                        />
                      </th>
                      <th style={{ textAlign: 'left', padding: '12px 16px', color: '#666', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                        {t('admin.unsubmitted.name', { defaultValue: 'Customer Name' })}
                      </th>
                      <th style={{ textAlign: 'left', padding: '12px 16px', color: '#666', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                        {t('admin.unsubmitted.phone', { defaultValue: 'Phone' })}
                      </th>
                      <th style={{ textAlign: 'left', padding: '12px 16px', color: '#666', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                        {t('admin.unsubmitted.product', { defaultValue: 'Product' })}
                      </th>
                      <th style={{ textAlign: 'left', padding: '12px 16px', color: '#666', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                        {t('admin.unsubmitted.city', { defaultValue: 'City' })}
                      </th>
                      <th style={{ textAlign: 'left', padding: '12px 16px', color: '#666', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                        {t('admin.unsubmitted.quantity', { defaultValue: 'Qty' })}
                      </th>
                      <th style={{ textAlign: 'left', padding: '12px 16px', color: '#666', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                        {t('admin.unsubmitted.date', { defaultValue: 'Date' })}
                      </th>
                      <th style={{ textAlign: 'center', padding: '12px 16px', color: '#666', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                        {t('admin.unsubmitted.actions', { defaultValue: 'Actions' })}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedOrders.map((order) => (
                      <tr key={order.id} style={{ borderBottom: '1px solid #f5f5f5' }} className="hover:bg-gray-50">
                        <td style={{ textAlign: 'center', padding: '16px' }}>
                          <input
                            type="checkbox"
                            checked={selectedOrders.includes(order.id)}
                            onChange={() => handleSelectOrder(order.id)}
                            style={{
                              width: '18px',
                              height: '18px',
                              cursor: 'pointer',
                              accentColor: '#4CAF50',
                            }}
                          />
                        </td>
                        <td style={{ padding: '16px', fontSize: '15px', color: '#1a1a2e', fontWeight: '600' }}>
                          {order.name || 'No Name'}
                          <div style={{ fontSize: '11px', color: '#999', marginTop: '4px', fontFamily: 'monospace' }}>
                            #{order.id.substring(10, 25)}
                          </div>
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', color: '#333' }}>
                          {order.phone || '-'}
                        </td>
                        <td style={{ padding: '16px', fontSize: '13px', color: '#666', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {getProductName(order.product_id)}
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', color: '#333' }}>
                          {order.city || '-'}
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', color: '#333', fontWeight: '500', textAlign: 'center' }}>
                          {order.quantity || '-'}
                        </td>
                        <td style={{ padding: '16px', fontSize: '13px', color: '#666' }}>
                          {formatDate(order.created_at)}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => setViewOrder(order)}
                              style={{
                                padding: '10px',
                                backgroundColor: '#e3f2fd',
                                color: '#2196F3',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                              className="hover:opacity-90"
                              title={t('admin.unsubmitted.view', { defaultValue: 'View' })}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleEditOrder(order)}
                              style={{
                                padding: '10px',
                                backgroundColor: '#fff3e0',
                                color: '#FF9800',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                              className="hover:opacity-90"
                              title={t('admin.editOrder', { defaultValue: 'Edit' })}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(order.id)}
                              style={{
                                padding: '10px',
                                backgroundColor: '#ffebee',
                                color: '#e53935',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                              className="hover:opacity-90"
                              title={t('admin.unsubmitted.delete', { defaultValue: 'Delete' })}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            )}

            {/* Mobile Cards - Only shows on small screens */}
            {isMobile && (
              <div style={{ 
                display: 'flex',
                flexDirection: 'column', 
                gap: '12px'
              }}>
              {/* Select All for Mobile */}
              {abandonedOrders.length > 0 && (
                <div style={{
                  padding: '12px 16px',
                  borderBottom: '2px solid #e0e0e0',
                  backgroundColor: '#f8f9fa',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  borderRadius: '14px',
                }}>
                  <input
                    type="checkbox"
                    checked={abandonedOrders.length > 0 && selectedOrders.length === abandonedOrders.length}
                    onChange={handleSelectAll}
                    style={{
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer',
                      accentColor: '#4CAF50',
                    }}
                  />
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#666' }}>
                    {t('admin.orders.selectAll')} ({abandonedOrders.length})
                  </span>
                </div>
              )}
              {paginatedOrders.map((order) => (
                <div
                  key={order.id}
                  style={{
                    backgroundColor: selectedOrders.includes(order.id) ? '#f0f9ff' : '#fff',
                    borderRadius: '14px',
                    padding: '16px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                    <input
                      type="checkbox"
                      checked={selectedOrders.includes(order.id)}
                      onChange={() => handleSelectOrder(order.id)}
                      style={{
                        width: '20px',
                        height: '20px',
                        cursor: 'pointer',
                        accentColor: '#4CAF50',
                        flexShrink: 0,
                        marginRight: '12px',
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a2e', marginBottom: '2px' }}>
                        {order.name || 'No Name'}
                      </p>
                      <p style={{ fontSize: '11px', color: '#999', fontFamily: 'monospace' }}>
                        #{order.id.substring(10, 25)}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#666', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{t('admin.unsubmitted.phone', { defaultValue: 'Phone' })}:</span>
                      <span style={{ fontWeight: '500' }}>{order.phone || '-'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{t('admin.unsubmitted.product', { defaultValue: 'Product' })}:</span>
                      <span style={{ fontWeight: '500', fontSize: '12px', textAlign: 'right' }}>
                        {getProductName(order.product_id).substring(0, 30)}{getProductName(order.product_id).length > 30 ? '...' : ''}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{t('admin.unsubmitted.city', { defaultValue: 'City' })}:</span>
                      <span style={{ fontWeight: '500' }}>{order.city || '-'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{t('admin.unsubmitted.quantity', { defaultValue: 'Quantity' })}:</span>
                      <span style={{ fontWeight: '500' }}>{order.quantity || '-'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{t('admin.unsubmitted.date', { defaultValue: 'Date' })}:</span>
                      <span style={{ fontWeight: '500', fontSize: '12px' }}>{formatDate(order.created_at)}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setViewOrder(order)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        backgroundColor: '#e3f2fd',
                        color: '#2196F3',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      className="hover:opacity-90"
                      title={t('admin.unsubmitted.view', { defaultValue: 'View' })}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleEditOrder(order)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        backgroundColor: '#fff3e0',
                        color: '#FF9800',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      className="hover:opacity-90"
                      title={t('admin.editOrder', { defaultValue: 'Edit' })}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(order.id)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        backgroundColor: '#ffebee',
                        color: '#e53935',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      className="hover:opacity-90"
                      title={t('admin.unsubmitted.delete', { defaultValue: 'Delete' })}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
              </div>
            )}
          </>
        )}

        {/* View Detail Modal */}
        <DetailModal
          order={viewOrder}
          isOpen={!!viewOrder}
          onClose={() => setViewOrder(null)}
          products={products}
          t={t}
        />

        {/* Edit Order Modal */}
        <EditModal
          order={editOrder}
          isOpen={!!editOrder}
          onClose={() => setEditOrder(null)}
          onSave={handleSaveEditedOrder}
          t={t}
        />

        {/* Delete Confirmation Modal */}
        {deleteConfirm.isOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '20px',
            }}
            onClick={() => setDeleteConfirm({ isOpen: false, orderId: null })}
          >
            <div
              style={{
                backgroundColor: '#fff',
                borderRadius: '16px',
                padding: isMobile ? '20px' : '24px',
                maxWidth: isMobile ? '90%' : '400px',
                width: '100%',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: '600', color: '#1a1a2e', marginBottom: '12px' }}>
                {deleteConfirm.orderId === 'bulk' 
                  ? `Delete ${selectedOrders.length} Unsubmitted Orders?`
                  : t('admin.unsubmitted.confirmDelete', { defaultValue: 'Delete Unsubmitted Order?' })
                }
              </h3>
              <p style={{ fontSize: isMobile ? '13px' : '14px', color: '#666', marginBottom: '20px' }}>
                {t('admin.unsubmitted.confirmDeleteMessage', { defaultValue: 'This action cannot be undone.' })}
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setDeleteConfirm({ isOpen: false, orderId: null })}
                  style={{
                    padding: isMobile ? '8px 16px' : '10px 20px',
                    backgroundColor: '#f5f5f5',
                    color: '#333',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: isMobile ? '13px' : '14px',
                    fontWeight: '500',
                    flex: isMobile ? '1' : 'auto',
                  }}
                >
                  {t('admin.cancel', { defaultValue: 'Cancel' })}
                </button>
                <button
                  onClick={deleteConfirm.orderId === 'bulk' ? confirmBulkDelete : confirmDelete}
                  style={{
                    padding: isMobile ? '8px 16px' : '10px 20px',
                    backgroundColor: '#e53935',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: isMobile ? '13px' : '14px',
                    fontWeight: '500',
                    flex: isMobile ? '1' : 'auto',
                  }}
                >
                  {t('admin.delete', { defaultValue: 'Delete' })}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '24px',
            padding: '20px',
            flexWrap: 'wrap',
          }}>
            {/* Previous Button */}
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              style={{
                padding: '10px 16px',
                borderRadius: '10px',
                border: '2px solid #e0e0e0',
                backgroundColor: currentPage === 1 ? '#f5f5f5' : '#fff',
                color: currentPage === 1 ? '#999' : '#1a1a2e',
                fontSize: '14px',
                fontWeight: '600',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              className={currentPage !== 1 ? 'hover:bg-gray-50' : ''}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
              <span className="hidden sm:inline">Previous</span>
            </button>

            {/* Page Numbers */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => {
                // Show first page, last page, current page, and pages around current
                const showPage = pageNum === 1 || 
                                pageNum === totalPages || 
                                (pageNum >= currentPage - 1 && pageNum <= currentPage + 1);
                
                // Show ellipsis
                const showEllipsisBefore = pageNum === currentPage - 2 && currentPage > 3;
                const showEllipsisAfter = pageNum === currentPage + 2 && currentPage < totalPages - 2;

                if (showEllipsisBefore || showEllipsisAfter) {
                  return (
                    <span key={`ellipsis-${pageNum}`} style={{ 
                      padding: '10px 8px', 
                      color: '#999',
                      fontSize: '14px',
                      fontWeight: '600',
                    }}>
                      ...
                    </span>
                  );
                }

                if (!showPage) return null;

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '10px',
                      border: currentPage === pageNum ? '2px solid #1a1a2e' : '2px solid #e0e0e0',
                      backgroundColor: currentPage === pageNum ? '#1a1a2e' : '#fff',
                      color: currentPage === pageNum ? '#fff' : '#333',
                      fontSize: '14px',
                      fontWeight: currentPage === pageNum ? '700' : '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      minWidth: '44px',
                      boxShadow: currentPage === pageNum ? '0 4px 12px rgba(26, 26, 46, 0.3)' : 'none',
                      transform: currentPage === pageNum ? 'translateY(-2px)' : 'translateY(0)',
                    }}
                    className="hover:bg-gray-50"
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            {/* Next Button */}
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: '10px 16px',
                borderRadius: '10px',
                border: '2px solid #e0e0e0',
                backgroundColor: currentPage === totalPages ? '#f5f5f5' : '#fff',
                color: currentPage === totalPages ? '#999' : '#1a1a2e',
                fontSize: '14px',
                fontWeight: '600',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              className={currentPage !== totalPages ? 'hover:bg-gray-50' : ''}
            >
              <span className="hidden sm:inline">Next</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>

            {/* Page Info */}
            <div style={{
              marginLeft: '12px',
              padding: '10px 16px',
              backgroundColor: '#f8f9fa',
              borderRadius: '10px',
              fontSize: '13px',
              color: '#666',
              fontWeight: '500',
              whiteSpace: 'nowrap',
            }}>
              Page {currentPage} of {totalPages} • {abandonedOrders.length} orders
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

