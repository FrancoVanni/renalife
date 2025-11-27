import React, { useState, useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import { productsApi } from '../api/products';
import { messagesApi } from '../api/messages';
import { CartItemCalculated } from '../types/product';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartModal: React.FC<CartModalProps> = ({ isOpen, onClose }) => {
  const { items, updateQuantity, updatePaymentMethod, removeFromCart, clearCart } = useCart();
  const [calculatedItems, setCalculatedItems] = useState<CartItemCalculated[]>([]);
  const [loading, setLoading] = useState(false);
  const [entregaOption, setEntregaOption] = useState<'retiran' | 'domicilio' | 'mostrador' | 'otra'>('retiran');
  const [domicilio, setDomicilio] = useState('');
  const [otraEntrega, setOtraEntrega] = useState('');
  const [clienteNum, setClienteNum] = useState('');
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteEmail, setClienteEmail] = useState('');
  const [clienteDireccion, setClienteDireccion] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [generatedMessages, setGeneratedMessages] = useState<{ clientMessage: string; companyMessage: string } | null>(null);

  useEffect(() => {
    if (isOpen && items.length > 0) {
      calculatePrices();
    } else {
      setCalculatedItems([]);
    }
  }, [items, isOpen]);

  const calculatePrices = async () => {
    if (items.length === 0) {
      setCalculatedItems([]);
      return;
    }

    setLoading(true);
    try {
      const products = items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        payment_method: item.payment_method,
      }));

      const results = await productsApi.calcForCarrito(products);
      setCalculatedItems(results);
    } catch (error) {
      console.error('Error calculating prices:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTotalARS = () => {
    return calculatedItems.reduce((total, item) => total + item.total_ars, 0);
  };

  const getDeliveryInfo = (): string => {
    if (entregaOption === 'retiran') {
      return 'Retiran hoy por Viamonte';
    } else if (entregaOption === 'domicilio' && domicilio) {
      return `Domicilio de entrega: ${domicilio}`;
    } else if (entregaOption === 'mostrador') {
      return 'Despacho mostrador';
    } else if (entregaOption === 'otra' && otraEntrega) {
      return otraEntrega;
    }
    return '';
  };

  const generateMessages = async () => {
    if (items.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    setLoading(true);
    try {
      const input = {
        items: items.map(item => ({
          id: item.id,
          code: item.code,
          name: item.name,
          quantity: item.quantity,
          price_usd: item.price_usd,
          iva_included: item.iva_included,
        })),
        payment_method: items[0].payment_method, // Usar el método del primer item (todos deberían tener el mismo)
        client_name: clienteNombre || undefined,
        delivery_info: getDeliveryInfo() || undefined,
      };

      const messages = await messagesApi.generate(input);
      setGeneratedMessages(messages);
    } catch (error) {
      console.error('Error generating messages:', error);
      alert('Error al generar los mensajes');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyClientMessage = async () => {
    if (!generatedMessages) {
      await generateMessages();
      return;
    }

    try {
      await navigator.clipboard.writeText(generatedMessages.clientMessage);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      alert('Error al copiar el mensaje');
    }
  };

  const handleCopyCompanyMessage = async () => {
    if (!generatedMessages) {
      await generateMessages();
      return;
    }

    try {
      await navigator.clipboard.writeText(generatedMessages.companyMessage);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      alert('Error al copiar el mensaje');
    }
  };

  const handleWhatsApp = () => {
    if (!generatedMessages) {
      alert('Por favor genera los mensajes primero');
      return;
    }

    // Aquí podrías agregar lógica para obtener el teléfono del cliente
    const phone = ''; // Obtener del cliente seleccionado
    if (!phone) {
      alert('No se proporcionó número de teléfono');
      return;
    }

    const encodedMessage = encodeURIComponent(generatedMessages.clientMessage);
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <h2 className="text-3xl font-bold text-gray-900">Carrito de Pedido</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Lista de productos */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Productos</h3>
              {items.length === 0 ? (
                <p className="text-gray-500 text-center py-8">El carrito está vacío</p>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => {
                    const calculated = calculatedItems.find(c => c.id === item.id);
                    const price = calculated ? calculated.price_ars : 0;
                    const subtotal = price * item.quantity;

                    return (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{item.name}</p>
                            <p className="text-sm text-gray-600">Código: {item.code}</p>
                            <p className="text-sm text-gray-600">Precio USD: ${item.price_usd.toFixed(2)}</p>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Eliminar
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Cantidad:
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Método de pago:
                            </label>
                            <select
                              value={item.payment_method}
                              onChange={(e) => updatePaymentMethod(item.id, e.target.value as 'contado' | 'echeck' | '30_dias')}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                            >
                              <option value="contado">Contado</option>
                              <option value="echeck">E-check</option>
                              <option value="30_dias">30 días</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Precio (IVA incluido):
                            </label>
                            <div className="px-3 py-2 bg-gray-50 rounded-lg">
                              <p className="text-sm font-semibold text-gray-900">
                                ${calculated ? calculated.price_ars.toFixed(2) : '0.00'} c/u
                              </p>
                              <p className="text-xs text-gray-600">
                                Total: ${subtotal.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <hr className="border-gray-200" />

            {/* Totales */}
            {calculatedItems.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total del pedido:</span>
                  <span className="text-2xl font-bold text-gray-900">
                    ${getTotalARS().toFixed(2)} ARS
                  </span>
                </div>
                <p className="text-sm text-gray-600 text-right mt-1">
                  (IVA incluido)
                </p>
              </div>
            )}

            <hr className="border-gray-200" />

            {/* Información de entrega */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Información de Entrega</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Opción de entrega</label>
                  <select
                    value={entregaOption}
                    onChange={(e) => setEntregaOption(e.target.value as any)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="retiran">Retiran hoy por Viamonte</option>
                    <option value="domicilio">Domicilio de entrega</option>
                    <option value="mostrador">Despacho mostrador</option>
                    <option value="otra">Otra opción</option>
                  </select>
                </div>
                {entregaOption === 'domicilio' && (
                  <input
                    type="text"
                    placeholder="Dirección de entrega"
                    value={domicilio}
                    onChange={(e) => setDomicilio(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                )}
                {entregaOption === 'otra' && (
                  <textarea
                    placeholder="Otra opción de entrega"
                    value={otraEntrega}
                    onChange={(e) => setOtraEntrega(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                )}
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* Datos del cliente */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Datos del Cliente</h3>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Cliente N°"
                  value={clienteNum}
                  onChange={(e) => setClienteNum(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="text"
                  placeholder="Nombre del cliente"
                  value={clienteNombre}
                  onChange={(e) => setClienteNombre(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={clienteEmail}
                  onChange={(e) => setClienteEmail(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="text"
                  placeholder="Dirección / CP"
                  value={clienteDireccion}
                  onChange={(e) => setClienteDireccion(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* Mensajes generados */}
            {generatedMessages && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Mensaje para Cliente</h3>
                  <textarea
                    value={generatedMessages.clientMessage}
                    readOnly
                    className="w-full min-h-[150px] px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono resize-none"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleCopyClientMessage}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Copiar Mensaje Cliente
                    </button>
                    <button
                      onClick={handleWhatsApp}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Enviar por WhatsApp
                    </button>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Mensaje para Empresa (OC)</h3>
                  <textarea
                    value={generatedMessages.companyMessage}
                    readOnly
                    className="w-full min-h-[150px] px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono resize-none"
                  />
                  <button
                    onClick={handleCopyCompanyMessage}
                    className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Copiar Mensaje Empresa
                  </button>
                </div>
              </div>
            )}

            {/* Botones */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={generateMessages}
                disabled={items.length === 0 || loading}
                className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
              >
                {loading ? 'Generando...' : 'Generar Mensajes'}
              </button>
              <button
                onClick={clearCart}
                className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
              >
                Vaciar carrito
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          Mensaje copiado
        </div>
      )}
    </>
  );
};
