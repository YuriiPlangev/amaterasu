'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCartStore } from '../../../store/cartStore';

export default function CartPage() {
  const t = useTranslations('cart');
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const remove = useCartStore((state) => state.remove);
  const updateQty = useCartStore((state) => state.updateQty);
  const clear = useCartStore((state) => state.clear);
  const total = useCartStore((state) => state.getTotal());

  const [showCheckout, setShowCheckout] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postcode: '',
    country: 'UA',
    paymentMethod: 'cash_on_delivery',
    notes: '',
    shippingSameAsBilling: true,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items,
          billing: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            postcode: formData.postcode,
            country: formData.country,
            notes: formData.notes,
          },
          shipping: formData.shippingSameAsBilling ? undefined : {
            firstName: formData.firstName,
            lastName: formData.lastName,
            address: formData.address,
            city: formData.city,
            postcode: formData.postcode,
            country: formData.country,
          },
          paymentMethod: formData.paymentMethod,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setOrderSuccess(true);
        setOrderNumber(data.orderNumber || data.orderId);
        clear();
        setTimeout(() => {
          router.push('/');
        }, 3000);
      } else {
        alert(`${t('error')}: ${data.error || t('orderError')}`);
      }
    } catch (error: any) {
      console.error('Order submission error:', error);
      alert(t('orderError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderSuccess) {
    return (
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-[1920px] w-full mx-auto px-10 sm:px-6 lg:px-[144px]">
          <div className="max-w-2xl mx-auto bg-white border border-[#D8D8D8] rounded-lg p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-black mb-2">{t('orderSuccess')}</h1>
              {orderNumber && (
                <p className="text-lg text-gray-600">
                  {t('orderNumber')} <span className="font-semibold text-[#9C0000]">#{orderNumber}</span>
                </p>
              )}
              <p className="text-gray-600 mt-4">
                {t('orderMessage')}
              </p>
            </div>
            <Link
              href="/"
              className="inline-block bg-[#9C0000] text-white px-8 py-3 rounded-md hover:bg-white hover:text-[#9C0000] hover:border-[#9C0000] hover:border transition-all duration-300 font-bold text-lg"
            >
              {t('returnHome')}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-[1920px] w-full mx-auto px-10 sm:px-6 lg:px-[144px]">
          <h1 className="text-[55px] font-bold uppercase text-black mb-8">{t('title')}</h1>
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-2xl text-gray-600 mb-6">{t('empty')}</p>
            <Link
              href="/shop"
              className="bg-[#9C0000] text-white px-8 py-3 rounded-md hover:bg-white hover:text-[#9C0000] hover:border-[#9C0000] hover:border transition-all duration-300 font-bold text-lg"
            >
              {t('goToCatalog')}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-[1920px] w-full mx-auto px-10 sm:px-6 lg:px-[144px]">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-[55px] font-bold uppercase text-black">{t('title')}</h1>
          <button
            onClick={clear}
            className="text-[#9C0000] hover:underline text-lg font-medium"
          >
            {t('clear')}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const price = parseFloat(item.price?.replace(/[^\d.,]/g, '').replace(',', '.') || '0');
              const itemTotal = price * item.qty;

              return (
                <div
                  key={item.id}
                  className="bg-white border border-[#D8D8D8] rounded-lg p-6 flex gap-6 items-center"
                >
                  {item.image && (
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={120}
                      height={120}
                      className="object-contain rounded"
                    />
                  )}
                  
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-black mb-2">{item.name}</h3>
                    <p className="text-[#9C0000] font-bold text-lg mb-4">
                      {item.price} ₴
                    </p>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center border border-[#D8D8D8] rounded-md">
                        <button
                          onClick={() => updateQty(item.id, item.qty - 1)}
                          className="px-4 py-2 hover:bg-gray-100 transition-colors"
                        >
                          −
                        </button>
                        <span className="px-4 py-2 min-w-[60px] text-center font-semibold">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => updateQty(item.id, item.qty + 1)}
                          className="px-4 py-2 hover:bg-gray-100 transition-colors"
                        >
                          +
                        </button>
                      </div>
                      
                      <button
                        onClick={() => remove(item.id)}
                        className="text-[#9C0000] hover:underline text-sm font-medium"
                      >
                        {t('remove')}
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold text-black">
                      {itemTotal.toFixed(2)} ₴
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white border border-[#D8D8D8] rounded-lg p-6 sticky top-4">
              <h2 className="text-2xl font-bold text-black mb-6">{t('title')}</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-lg">
                  <span className="text-gray-600">{t('items')}</span>
                  <span className="font-semibold">{items.reduce((sum, item) => sum + item.qty, 0)} шт.</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span className="text-gray-600">{t('sum')}</span>
                  <span className="font-semibold">{total.toFixed(2)} ₴</span>
                </div>
                <div className="border-t border-[#D8D8D8] pt-4">
                  <div className="flex justify-between text-2xl">
                    <span className="font-bold">{t('total')}</span>
                    <span className="font-bold text-[#9C0000]">{total.toFixed(2)} ₴</span>
                  </div>
                </div>
              </div>

              {!showCheckout ? (
                <button
                  onClick={() => setShowCheckout(true)}
                  className="w-full bg-[#9C0000] text-white px-6 py-4 rounded-md hover:bg-white hover:text-[#9C0000] hover:border-[#9C0000] hover:border transition-all duration-300 font-bold text-lg"
                >
                  {t('checkout')}
                </button>
              ) : (
                <form onSubmit={handleSubmitOrder} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="firstName"
                      placeholder={`${t('firstName')} *`}
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="px-4 py-2 border border-[#D8D8D8] rounded-md focus:outline-none focus:border-[#9C0000]"
                    />
                    <input
                      type="text"
                      name="lastName"
                      placeholder={`${t('lastName')} *`}
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="px-4 py-2 border border-[#D8D8D8] rounded-md focus:outline-none focus:border-[#9C0000]"
                    />
                  </div>
                  
                  <input
                    type="email"
                    name="email"
                    placeholder={`${t('email')} *`}
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-[#D8D8D8] rounded-md focus:outline-none focus:border-[#9C0000]"
                  />
                  
                  <input
                    type="tel"
                    name="phone"
                    placeholder={`${t('phone')} *`}
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-[#D8D8D8] rounded-md focus:outline-none focus:border-[#9C0000]"
                  />
                  
                  <input
                    type="text"
                    name="address"
                    placeholder={`${t('address')} *`}
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-[#D8D8D8] rounded-md focus:outline-none focus:border-[#9C0000]"
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="city"
                      placeholder={`${t('city')} *`}
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                      className="px-4 py-2 border border-[#D8D8D8] rounded-md focus:outline-none focus:border-[#9C0000]"
                    />
                    <input
                      type="text"
                      name="postcode"
                      placeholder={`${t('postcode')} *`}
                      value={formData.postcode}
                      onChange={handleInputChange}
                      required
                      className="px-4 py-2 border border-[#D8D8D8] rounded-md focus:outline-none focus:border-[#9C0000]"
                    />
                  </div>
                  
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-[#D8D8D8] rounded-md focus:outline-none focus:border-[#9C0000]"
                  >
                    <option value="cash_on_delivery">{t('cashOnDelivery')}</option>
                    <option value="card">{t('card')}</option>
                  </select>
                  
                  <textarea
                    name="notes"
                    placeholder={t('notes')}
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-[#D8D8D8] rounded-md focus:outline-none focus:border-[#9C0000]"
                  />
                  
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCheckout(false)}
                      className="flex-1 px-4 py-2 border border-[#D8D8D8] rounded-md hover:bg-gray-100 transition-colors"
                    >
                      {t('back')}
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-[#9C0000] text-white px-6 py-2 rounded-md hover:bg-white hover:text-[#9C0000] hover:border-[#9C0000] hover:border transition-all duration-300 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? t('processing') : t('confirm')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}


