'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useCartStore } from '../../../store/cartStore';
import { getProxiedImageUrl } from '../../../lib/imageProxy';

export default function CartPage() {
  const t = useTranslations('cart');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const basePath = `/${locale}`;
  const router = useRouter();
  const searchParams = useSearchParams();
  const items = useCartStore((state) => state.items);
  const remove = useCartStore((state) => state.remove);
  const updateQty = useCartStore((state) => state.updateQty);
  const clear = useCartStore((state) => state.clear);
  const total = useCartStore((state) => state.getTotal());

  const [showCheckout, setShowCheckout] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [legalConsent, setLegalConsent] = useState(false);
  
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
    deliveryMethod: 'nova_poshta' as 'nova_poshta' | 'ukrposhta',
    novaPoshtaCityRef: '',
    novaPoshtaCityName: '',
    novaPoshtaWarehouseRef: '',
    novaPoshtaWarehouseDesc: '',
    ukrposhtaCity: '',
    ukrposhtaBranch: '',
  });

  const [npCities, setNpCities] = useState<{ ref: string; name: string; area?: string }[]>([]);
  const [npWarehouses, setNpWarehouses] = useState<{ ref: string; description: string; number: string }[]>([]);
  const [ukrposhtaCities, setUkrposhtaCities] = useState<string[]>([]);
  const [npCitySearch, setNpCitySearch] = useState('');
  const [ukrposhtaCitySearch, setUkrposhtaCitySearch] = useState('');
  const [npCityDropdownOpen, setNpCityDropdownOpen] = useState(false);
  const [npWarehouseDropdownOpen, setNpWarehouseDropdownOpen] = useState(false);
  const [ukrposhtaCityDropdownOpen, setUkrposhtaCityDropdownOpen] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);
  const citySearchRef = useRef<NodeJS.Timeout | null>(null);
  const npDropdownRef = useRef<HTMLDivElement>(null);
  const npWarehouseRef = useRef<HTMLDivElement>(null);
  const ukrposhtaDropdownRef = useRef<HTMLDivElement>(null);

  const allVirtual =
    items.length > 0 &&
    items.every((i: any) => {
      if (i?.virtual === true) return true;
      const name = String(i?.name || '').toLowerCase();
      // Фолбек для старих записів у localStorage, де `virtual` могло не зберегтися.
      return name.includes('аватар') || name.includes('avatar');
    });

  // Попереднє заповнення email/телефону для залогіненого користувача
  useEffect(() => {
    fetch('/api/auth/user')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        const rawPhone = (data.phone || '').replace(/\D/g, '');
        const normPhone = rawPhone.startsWith('380') ? rawPhone.slice(0, 12) : rawPhone.startsWith('0') ? rawPhone.slice(0, 10) : rawPhone.length <= 9 ? '0' + rawPhone : '380' + rawPhone.slice(-9);
        setFormData((prev) => ({
          ...prev,
          firstName: prev.firstName || data.displayName || '',
          email: prev.email || data.email || '',
          phone: prev.phone || normPhone || '',
        }));
      })
      .catch(() => {});
  }, []);

  const fetchNpCities = useCallback(async (search: string) => {
    setLoadingCities(true);
    try {
      const res = await fetch('/api/delivery/nova-poshta/cities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ search: search || undefined }),
      });
      const data = await res.json();
      if (data.success) setNpCities(data.data);
      else setNpCities([]);
    } catch {
      setNpCities([]);
    } finally {
      setLoadingCities(false);
    }
  }, []);

  const fetchNpWarehouses = useCallback(async (cityRef: string) => {
    if (!cityRef) return;
    setLoadingWarehouses(true);
    try {
      const res = await fetch('/api/delivery/nova-poshta/warehouses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cityRef }),
      });
      const data = await res.json();
      if (data.success) setNpWarehouses(data.data);
      else setNpWarehouses([]);
    } catch {
      setNpWarehouses([]);
    } finally {
      setLoadingWarehouses(false);
    }
  }, []);

  const fetchUkrposhtaCities = useCallback(async (search: string) => {
    try {
      const q = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await fetch(`/api/delivery/ukrposhta/cities${q}`);
      const data = await res.json();
      if (data.success) setUkrposhtaCities(data.data);
      else setUkrposhtaCities([]);
    } catch {
      setUkrposhtaCities([]);
    }
  }, []);

  useEffect(() => {
    if (formData.deliveryMethod === 'nova_poshta') {
      if (citySearchRef.current) clearTimeout(citySearchRef.current);
      citySearchRef.current = setTimeout(() => {
        fetchNpCities(npCitySearch);
      }, 300);
    }
  }, [npCitySearch, formData.deliveryMethod, fetchNpCities]);

  useEffect(() => {
    if (formData.deliveryMethod === 'nova_poshta' && formData.novaPoshtaCityRef) {
      fetchNpWarehouses(formData.novaPoshtaCityRef);
    } else {
      setNpWarehouses([]);
    }
  }, [formData.deliveryMethod, formData.novaPoshtaCityRef, fetchNpWarehouses]);

  useEffect(() => {
    if (formData.deliveryMethod === 'ukrposhta') {
      fetchUkrposhtaCities(ukrposhtaCitySearch);
    }
  }, [formData.deliveryMethod, ukrposhtaCitySearch, fetchUkrposhtaCities]);

  useEffect(() => {
    if (searchParams.get('liqpay') === 'success') {
      setOrderSuccess(true);
      const orderFromQuery = searchParams.get('order');
      setOrderNumber(orderFromQuery || null);
      clear();
    }
  }, [searchParams, clear]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedOutsideNp = !npDropdownRef.current?.contains(target);
      const clickedOutsideNpWarehouse = !npWarehouseRef.current?.contains(target);
      const clickedOutsideUkrposhta = !ukrposhtaDropdownRef.current?.contains(target);
      if (clickedOutsideNp) setNpCityDropdownOpen(false);
      if (clickedOutsideNpWarehouse) setNpWarehouseDropdownOpen(false);
      if (clickedOutsideUkrposhta) setUkrposhtaCityDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatPhoneDisplay = (digits: string) => {
    if (!digits) return '';
    if (digits.startsWith('380')) {
      return `+380 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10, 12)}`.trim();
    }
    if (digits.startsWith('0')) {
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`.trim();
    }
    return digits;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const digits = value.replace(/\D/g, '');
      let normalized = digits;
      if (digits.length > 0 && !digits.startsWith('0') && !digits.startsWith('380')) {
        normalized = digits.length <= 9 ? '0' + digits : '380' + digits.slice(-9);
      }
      let limited = normalized;
      if (normalized.startsWith('380')) limited = normalized.slice(0, 12);
      else if (normalized.startsWith('0')) limited = normalized.slice(0, 10);
      setFormData(prev => ({ ...prev, phone: limited }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isValidPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    return (digits.length === 10 && digits.startsWith('0')) || (digits.length === 12 && digits.startsWith('380'));
  };

  const getAddressFromDelivery = () => {
    if (formData.deliveryMethod === 'nova_poshta') {
      return formData.novaPoshtaWarehouseDesc || '';
    }
    if (formData.deliveryMethod === 'ukrposhta') {
      return formData.ukrposhtaBranch
        ? `Відділення: ${formData.ukrposhtaBranch}, ${formData.ukrposhtaCity}`
        : '';
    }
    return formData.address;
  };

  const getCityFromDelivery = () => {
    if (formData.deliveryMethod === 'nova_poshta') return formData.novaPoshtaCityName;
    if (formData.deliveryMethod === 'ukrposhta') return formData.ukrposhtaCity;
    return formData.city;
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!legalConsent) {
      alert(t('consentRequired'));
      return;
    }
    if (!isValidPhone(formData.phone)) {
      alert(locale === 'uk' ? 'Введіть коректний номер телефону (наприклад: 050 123 45 67 або +380 50 123 45 67)' : 'Enter a valid phone number (e.g. 050 123 45 67 or +380 50 123 45 67)');
      return;
    }
    const allVirtual = items.length > 0 && items.every((i: any) => i.virtual);

    if (!allVirtual && formData.deliveryMethod === 'nova_poshta') {
      if (!formData.novaPoshtaCityRef || !formData.novaPoshtaWarehouseRef) {
        alert('Оберіть місто та відділення Нової Пошти');
        return;
      }
    }
    if (!allVirtual && formData.deliveryMethod === 'ukrposhta') {
      if (!formData.ukrposhtaCity || !formData.ukrposhtaBranch) {
        alert('Оберіть місто та вкажіть номер відділення Укрпошти');
        return;
      }
    }
    setIsSubmitting(true);

    const address = allVirtual ? '' : getAddressFromDelivery();
    const city = allVirtual ? '' : getCityFromDelivery();

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items,
          locale,
          billing: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone.startsWith('380') ? `+${formData.phone}` : formData.phone,
            address,
            city,
            postcode: formData.postcode || '',
            country: formData.country,
            notes: formData.notes,
            deliveryMethod: allVirtual ? 'virtual' : formData.deliveryMethod,
            novaPoshtaCity: allVirtual ? '' : formData.novaPoshtaCityName,
            novaPoshtaWarehouse: allVirtual ? '' : formData.novaPoshtaWarehouseDesc,
            ukrposhtaCity: allVirtual ? '' : formData.ukrposhtaCity,
            ukrposhtaBranch: allVirtual ? '' : formData.ukrposhtaBranch,
          },
          shipping: allVirtual || formData.shippingSameAsBilling
            ? undefined
            : {
                firstName: formData.firstName,
                lastName: formData.lastName,
                address,
                city,
                postcode: formData.postcode || '',
                country: formData.country,
              },
          paymentMethod: allVirtual ? 'card' : formData.paymentMethod,
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.paymentProvider === 'liqpay' && data.liqpay?.data && data.liqpay?.signature && data.liqpay?.checkoutUrl) {
          const form = document.createElement('form');
          form.method = 'POST';
          form.action = data.liqpay.checkoutUrl;

          const dataInput = document.createElement('input');
          dataInput.type = 'hidden';
          dataInput.name = 'data';
          dataInput.value = data.liqpay.data;

          const signatureInput = document.createElement('input');
          signatureInput.type = 'hidden';
          signatureInput.name = 'signature';
          signatureInput.value = data.liqpay.signature;

          form.appendChild(dataInput);
          form.appendChild(signatureInput);
          document.body.appendChild(form);

          // Очищаем корзину перед переходом в платежный шлюз.
          clear();
          form.submit();
          return;
        }

        setOrderSuccess(true);
        setOrderNumber(data.orderNumber || data.orderId);
        clear();
        setTimeout(() => {
          router.push(basePath);
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
      <div className="min-h-screen bg-white py-12 mt-12">
        <div className="max-w-[1920px] w-full mx-auto site-padding-x">
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
              href={basePath}
              className="inline-block bg-[#9C0000] text-white px-8 py-3 rounded-md hover:bg-white hover:text-[#9C0000] hover:border-[#9C0000] hover:border transition-all duration-300 font-bold text-lg"
            >
              {t('returnHome')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white py-12 mt-12">
        <div className="max-w-[1920px] w-full mx-auto site-padding-x">
          <h1 className="text-[55px] font-bold uppercase text-black mb-8">{t('title')}</h1>
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-2xl text-gray-600 mb-6">{t('empty')}</p>
            <Link
              href={`${basePath}/catalog`}
              className="bg-[#9C0000] text-white px-8 py-3 rounded-md hover:bg-white hover:text-[#9C0000] hover:border-[#9C0000] hover:border transition-all duration-300 font-bold text-lg"
            >
              {t('goToCatalog')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-12 mt-16">
      <div className="max-w-[1920px] w-full mx-auto site-padding-x">
        <nav className="text-sm text-[#9C9C9C] mb-4">
          <Link href={basePath} className="hover:text-black">Головна</Link>
          <span className="mx-2">/</span>
          <span className="text-black">{t('title')}</span>
        </nav>
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
                  className="bg-white border border-[#D8D8D8] rounded-2xl p-6 flex flex-col sm:flex-row gap-6 items-center"
                >
                  {item.image && (
                    <Image
                      src={getProxiedImageUrl(item.image)}
                      alt={item.name}
                      width={120}
                      height={120}
                      className="object-contain rounded max-w-[140px]"
                    />
                  )}
                  
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-black mb-2">{item.name}</h3>
                    <p className="text-[#9C0000] font-bold text-lg mb-4">
                      {item.price} ₴
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-4">
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

                  <div className="text-right w-full sm:w-auto">
                    <p className="text-2xl font-bold text-black">
                      {itemTotal.toFixed(2)} ₴
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white border border-[#D8D8D8] rounded-2xl p-6 sticky top-4">
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
              {!allVirtual && (
                <div className="bg-[#FFF7F7] border border-[#F5B7B7] rounded-xl p-4 text-sm text-black mb-6">
                  <p className="font-semibold mb-2 text-black">Доставка та оплата</p>
                  <ul className="space-y-1 text-[#5A5A5A]">
                    <li>• Нова Пошта: від 45 грн</li>
                    <li>• Укрпошта: від 45 грн</li>
                    <li>• Оплата при отриманні</li>
                  </ul>
                </div>
              )}

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
                    placeholder={`${t('phone')} * (050 123 45 67)`}
                    value={formatPhoneDisplay(formData.phone)}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-[#D8D8D8] rounded-md focus:outline-none focus:border-[#9C0000]"
                  />

                  {!allVirtual && (
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">{t('deliveryMethod')}</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="deliveryMethod"
                            value="nova_poshta"
                            checked={formData.deliveryMethod === 'nova_poshta'}
                            onChange={() => setFormData((p) => ({ ...p, deliveryMethod: 'nova_poshta' }))}
                            className="w-4 h-4 text-[#9C0000] border-gray-300 focus:ring-[#9C0000]"
                          />
                          <span>{t('novaPoshta')}</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="deliveryMethod"
                            value="ukrposhta"
                            checked={formData.deliveryMethod === 'ukrposhta'}
                            onChange={() => setFormData((p) => ({ ...p, deliveryMethod: 'ukrposhta' }))}
                            className="w-4 h-4 text-[#9C0000] border-gray-300 focus:ring-[#9C0000]"
                          />
                          <span>{t('ukrposhta')}</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {!allVirtual && formData.deliveryMethod === 'nova_poshta' && (
                    <div className="space-y-4" ref={npDropdownRef}>
                      <div className="relative">
                        <label className="block text-sm font-medium text-black mb-1">{t('selectCity')}</label>
                        <input
                          type="text"
                          value={formData.novaPoshtaCityRef ? formData.novaPoshtaCityName : npCitySearch}
                          onChange={(e) => {
                            const v = e.target.value;
                            setNpCitySearch(v);
                            if (formData.novaPoshtaCityRef && v !== formData.novaPoshtaCityName) {
                              setFormData((p) => ({
                                ...p,
                                novaPoshtaCityRef: '',
                                novaPoshtaCityName: '',
                                novaPoshtaWarehouseRef: '',
                                novaPoshtaWarehouseDesc: '',
                              }));
                            }
                            setNpCityDropdownOpen(true);
                          }}
                          onFocus={() => setNpCityDropdownOpen(true)}
                          placeholder={t('searchCity')}
                          className="w-full px-4 py-2 border border-[#D8D8D8] rounded-md focus:outline-none focus:border-[#9C0000]"
                        />
                        {npCityDropdownOpen && (
                          <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-auto bg-white border border-[#D8D8D8] rounded-md shadow-lg z-50">
                            {loadingCities ? (
                              <div className="px-4 py-3 text-gray-500">{tCommon('loading')}</div>
                            ) : npCities.length === 0 ? (
                              <div className="px-4 py-3 text-gray-500">
                                {npCitySearch.length >= 2 ? t('nothingFoundCity') : t('minCharsCity')}
                              </div>
                            ) : (
                              npCities.map((c) => (
                                <button
                                  key={c.ref}
                                  type="button"
                                  onClick={() => {
                                    setFormData((p) => ({
                                      ...p,
                                      novaPoshtaCityRef: c.ref,
                                      novaPoshtaCityName: c.name,
                                      novaPoshtaWarehouseRef: '',
                                      novaPoshtaWarehouseDesc: '',
                                    }));
                                    setNpCitySearch('');
                                    setNpCityDropdownOpen(false);
                                  }}
                                  className="w-full text-left px-4 py-2 hover:bg-[#FFF7F7]"
                                >
                                  {c.name}
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                      {formData.novaPoshtaCityRef && (
                        <div className="relative" ref={npWarehouseRef}>
                          <label className="block text-sm font-medium text-black mb-1">{t('selectWarehouse')}</label>
                          <input
                            type="text"
                            value={formData.novaPoshtaWarehouseDesc}
                            readOnly
                            onFocus={() => setNpWarehouseDropdownOpen(true)}
                            placeholder={loadingWarehouses ? tCommon('loading') : t('selectWarehouse')}
                            className="w-full px-4 py-2 border border-[#D8D8D8] rounded-md focus:outline-none focus:border-[#9C0000] bg-white cursor-pointer"
                          />
                          {npWarehouseDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-auto bg-white border border-[#D8D8D8] rounded-md shadow-lg z-50">
                              {loadingWarehouses ? (
                                <div className="px-4 py-3 text-gray-500">{tCommon('loading')}</div>
                              ) : (
                                npWarehouses.map((w) => (
                                  <button
                                    key={w.ref}
                                    type="button"
                                    onClick={() => {
                                      setFormData((p) => ({
                                        ...p,
                                        novaPoshtaWarehouseRef: w.ref,
                                        novaPoshtaWarehouseDesc: w.description,
                                      }));
                                      setNpWarehouseDropdownOpen(false);
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-[#FFF7F7] text-sm"
                                  >
                                    {w.description}
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {!allVirtual && formData.deliveryMethod === 'ukrposhta' && (
                    <div className="space-y-4" ref={ukrposhtaDropdownRef}>
                      <div className="relative">
                        <label className="block text-sm font-medium text-black mb-1">{t('selectCity')}</label>
                        <input
                          type="text"
                          value={formData.ukrposhtaCity ? formData.ukrposhtaCity : ukrposhtaCitySearch}
                          onChange={(e) => {
                            const v = e.target.value;
                            setUkrposhtaCitySearch(v);
                            if (formData.ukrposhtaCity && v !== formData.ukrposhtaCity) {
                              setFormData((p) => ({ ...p, ukrposhtaCity: '' }));
                            }
                            setUkrposhtaCityDropdownOpen(true);
                          }}
                          onFocus={() => setUkrposhtaCityDropdownOpen(true)}
                          placeholder={t('searchCity')}
                          className="w-full px-4 py-2 border border-[#D8D8D8] rounded-md focus:outline-none focus:border-[#9C0000]"
                        />
                        {ukrposhtaCityDropdownOpen && (
                          <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-auto bg-white border border-[#D8D8D8] rounded-md shadow-lg z-50">
                            {ukrposhtaCities.length === 0 ? (
                              <div className="px-4 py-3 text-gray-500">
                                {ukrposhtaCitySearch.length >= 2 ? t('nothingFoundCity') : t('minCharsCity')}
                              </div>
                            ) : (
                              ukrposhtaCities.map((c) => (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => {
                                    setFormData((p) => ({ ...p, ukrposhtaCity: c }));
                                    setUkrposhtaCitySearch('');
                                    setUkrposhtaCityDropdownOpen(false);
                                  }}
                                  className="w-full text-left px-4 py-2 hover:bg-[#FFF7F7]"
                                >
                                  {c}
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-black mb-1">{t('branchNumber')}</label>
                        <input
                          type="text"
                          name="ukrposhtaBranch"
                          value={formData.ukrposhtaBranch}
                          onChange={handleInputChange}
                          placeholder={t('branchNumberPlaceholder')}
                          className="w-full px-4 py-2 border border-[#D8D8D8] rounded-md focus:outline-none focus:border-[#9C0000]"
                        />
                      </div>
                    </div>
                  )}
                  
                  {allVirtual ? (
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">{t('paymentMethod')}</label>
                      <div className="px-4 py-2 border border-[#D8D8D8] rounded-md bg-gray-50 text-sm text-[#111111]">
                        {t('card')}
                      </div>
                    </div>
                  ) : (
                    <select
                      name="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-[#D8D8D8] rounded-md focus:outline-none focus:border-[#9C0000]"
                    >
                      <option value="cash_on_delivery">{t('cashOnDelivery')}</option>
                      <option value="card">{t('card')}</option>
                      <option value="liqpay">LiqPay (Visa/Mastercard)</option>
                    </select>
                  )}
                  
                  <textarea
                    name="notes"
                    placeholder={t('notes')}
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-[#D8D8D8] rounded-md focus:outline-none focus:border-[#9C0000]"
                  />

                  <label className="flex items-start gap-3 text-sm text-[#5A5A5A]">
                    <input
                      type="checkbox"
                      checked={legalConsent}
                      onChange={(e) => setLegalConsent(e.target.checked)}
                      className="mt-0.5 h-4 w-4 accent-[#9C0000]"
                      required
                    />
                    <span>
                      {t('consentStart')}{' '}
                      <Link href={`${basePath}/public-offer`} className="text-[#9C0000] hover:underline font-medium">
                        {t('consentOffer')}
                      </Link>
                      ,{' '}
                      <Link href={`${basePath}/privacy-policy`} className="text-[#9C0000] hover:underline font-medium">
                        {t('consentPrivacy')}
                      </Link>{' '}
                      {t('consentAnd')}{' '}
                      <Link href={`${basePath}/delivery`} className="text-[#9C0000] hover:underline font-medium">
                        {t('consentDelivery')}
                      </Link>
                      .
                    </span>
                  </label>
                  
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

        <section className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-[#E6E6E6] rounded-2xl p-6 bg-white">
            <h3 className="text-lg font-semibold text-black mb-2">Офіційні товари</h3>
            <p className="text-[#6D6D6D]">Працюємо напряму з постачальниками, гарантія якості.</p>
          </div>
          <div className="border border-[#E6E6E6] rounded-2xl p-6 bg-white">
            <h3 className="text-lg font-semibold text-black mb-2">Швидка доставка</h3>
            <p className="text-[#6D6D6D]">Відправка замовлень щодня. Середній термін 1–3 дні.</p>
          </div>
          <div className="border border-[#E6E6E6] rounded-2xl p-6 bg-white">
            <h3 className="text-lg font-semibold text-black mb-2">Потрібна допомога?</h3>
            <p className="text-[#6D6D6D]">Напишіть нам у Telegram або через форму контактів.</p>
            <Link href={`${basePath}/contacts`} className="inline-block mt-3 text-[#9C0000] font-semibold hover:text-[#7D0000]">
              Перейти до контактів
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}


