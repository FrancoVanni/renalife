import React, { useState } from 'react';
import { Product } from '../types/product';
import { useCart } from '../contexts/CartContext';

interface ProductTableProps {
  products: Product[];
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  onRefresh: () => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({ 
  products, 
  categories, 
  selectedCategory, 
  onCategoryChange,
  onRefresh 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({});
  const { addToCart } = useCart();

  const handleQuantityChange = (productId: number, value: string) => {
    const numValue = parseInt(value) || 1;
    setQuantities((prev) => ({ ...prev, [productId]: numValue }));
  };

  const handleAddToCart = (product: Product) => {
    const quantity = quantities[product.id] || 1;
    addToCart(
      {
        id: product.id,
        code: product.code,
        name: product.name,
        price_usd: product.price_usd,
        iva_included: product.iva_included,
      },
      quantity
    );
    setQuantities((prev) => ({ ...prev, [product.id]: 1 }));
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Buscar productos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
        />
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base bg-white min-w-[200px]"
        >
          <option value="">Todas las categorías</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Código</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nombre</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Categoría</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Precio USD</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">IVA Incluido</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Cantidad</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                  No se encontraron productos
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => (
                <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-900">{product.id}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{product.code}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{product.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{product.category}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">${product.price_usd.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{product.iva_included ? 'Sí' : 'No'}</td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min="1"
                      value={quantities[product.id] || 1}
                      onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                      className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Agregar al pedido
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
