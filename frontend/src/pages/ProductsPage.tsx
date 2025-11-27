import React, { useState, useEffect } from 'react';
import { ProductTable } from '../components/ProductTable';
import { CartModal } from '../components/CartModal';
import { productsApi } from '../api/products';
import { Product } from '../types/product';
import { useCart } from '../contexts/CartContext';

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showCartModal, setShowCartModal] = useState(false);
  const { getTotalItems } = useCart();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await productsApi.getAll();
      setProducts(data);
      const uniqueCategories = Array.from(new Set(data.map(p => p.category))).sort();
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const totalItems = getTotalItems();

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Productos</h1>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <ProductTable 
            products={products} 
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            onRefresh={loadProducts}
          />
        </div>
      </div>

      {/* Botón flotante del carrito */}
      {totalItems > 0 && (
        <button
          onClick={() => setShowCartModal(true)}
          className="fixed bottom-8 right-8 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full shadow-lg font-semibold text-lg flex items-center gap-2 z-40 transition-all hover:scale-105"
        >
          <span>🛒</span>
          <span>Ver Pedido ({totalItems} {totalItems === 1 ? 'item' : 'items'})</span>
        </button>
      )}

      {/* Modal del carrito */}
      <CartModal isOpen={showCartModal} onClose={() => setShowCartModal(false)} />
    </>
  );
};
