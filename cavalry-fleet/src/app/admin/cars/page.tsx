"use client";

import { useState, useEffect } from 'react';
import { Plus, Trash2, UploadCloud, X, Loader } from 'lucide-react';

export default function FleetAdmin() {
  const [cars, setCars] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [modelName, setModelName] = useState('');
  const [dailyPrice, setDailyPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [specs, setSpecs] = useState({ topSpeed: '250', hp: '500', year: '2025' });
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    try {
      const res = await fetch('/api/cars');
      const data = await res.json();
      setCars(Array.isArray(data) ? data : (data?.cars || []));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload-media', { method: 'POST', body: formData });
    const data = await res.json();
    if (!data.success) throw new Error('Upload failed');
    return data.url;
  };

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMainImage(file);
      setMainImagePreview(URL.createObjectURL(file));
    }
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (galleryImages.length + files.length > 30) return alert('يمكنك اختيار بحد أقصى 30 صورة إضافية للسيارة الواحدة');
    const newFiles = [...galleryImages, ...files].slice(0, 30);
    setGalleryImages(newFiles);
    setGalleryPreviews(newFiles.map(file => URL.createObjectURL(file)));
  };

  const handleAddCar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mainImage) return alert('الرجاء رفع الصورة الرئيسية للسيارة');

    setIsSubmitting(true);
    try {
      // 1. Upload Main Image
      const mainImageUrl = await uploadImage(mainImage);

      // 2. Upload Gallery Images (Up to 10)
      const galleryUrls: string[] = [];
      for (const file of galleryImages) {
        const url = await uploadImage(file);
        galleryUrls.push(url);
      }

      // 3. Save to DB
      const res = await fetch('/api/cars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelName,
          dailyPrice: Number(dailyPrice),
          quantity: Number(quantity),
          imageUrl: mainImageUrl,
          galleryImages: JSON.stringify(galleryUrls),
          specs: JSON.stringify(specs)
        })
      });

      if (res.ok) {
        setIsAdding(false);
        resetForm();
        fetchCars();
      } else {
        alert("حدث خطأ أثناء الحفظ");
      }
    } catch (error) {
      alert("خطأ في رفع الصور");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه السيارة بشكل نهائي؟')) return;
    try {
      const res = await fetch(`/api/cars/${id}`, { method: 'DELETE' });
      if (res.ok) fetchCars();
    } catch (error) {
      alert("حدث خطأ أثناء الحذف");
    }
  };

  const resetForm = () => {
    setModelName(''); setDailyPrice(''); setQuantity('1');
    setMainImage(null); setMainImagePreview(null); setGalleryImages([]); setGalleryPreviews([]);
    setSpecs({ topSpeed: '250', hp: '500', year: '2025' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-charcoal border border-gray-800 p-6 rounded-2xl">
        <div>
          <h1 className="text-3xl font-bold text-white">إدارة الأسطول</h1>
          <p className="text-gray-400 mt-1">تستطيع إضافة سيارات حقيقية مع مواصفاتها وما يصل إلى 10 صور، وحذفها.</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-gold-gradient text-deepblack px-6 py-3 rounded-xl font-bold hover:scale-[1.02] transition-transform flex items-center gap-2"
        >
          {isAdding ? <><X size={20} /> إلغاء إضافة</> : <><Plus size={20} /> إضافة سيارة جديدة</>}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddCar} className="bg-charcoal border border-gold-800/40 p-8 rounded-2xl space-y-8 relative overflow-hidden shadow-xl">
          <h2 className="text-xl font-bold text-white border-b border-gray-800 pb-4">بيانات السيارة الجديدة</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm text-gray-400">اسم موديل السيارة</label>
              <input required value={modelName} onChange={e => setModelName(e.target.value)} type="text" className="w-full bg-deepblack border border-gray-800 focus:border-gold-500 rounded-lg px-4 py-3 text-white outline-none" placeholder="مثال: Rolls-Royce Phantom" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-400">سعر الإيجار اليومي (ر.س)</label>
              <input required value={dailyPrice} onChange={e => setDailyPrice(e.target.value)} type="number" className="w-full bg-deepblack border border-gray-800 focus:border-gold-500 rounded-lg px-4 py-3 text-white outline-none" placeholder="3500" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-400">العدد المتاح في المخزون (الكمية)</label>
              <input required value={quantity} onChange={e => setQuantity(e.target.value)} type="number" min="1" className="w-full bg-deepblack border border-gray-800 focus:border-gold-500 rounded-lg px-4 py-3 text-white outline-none" placeholder="1" />
            </div>

            {/* Specs */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400">السرعة القصوى (KM/H)</label>
              <input required value={specs.topSpeed} onChange={e => setSpecs({ ...specs, topSpeed: e.target.value })} type="text" className="w-full bg-deepblack border border-gray-800 rounded-lg px-4 py-3 text-white outline-none direction-ltr text-right" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-400">قوة الأحصنة (HP)</label>
              <input required value={specs.hp} onChange={e => setSpecs({ ...specs, hp: e.target.value })} type="text" className="w-full bg-deepblack border border-gray-800 rounded-lg px-4 py-3 text-white outline-none direction-ltr text-right" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-400">سنة الصنع أو الموديل</label>
              <input required value={specs.year} onChange={e => setSpecs({ ...specs, year: e.target.value })} type="text" className="w-full bg-deepblack border border-gray-800 rounded-lg px-4 py-3 text-white outline-none" />
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-sm text-gold-400 font-bold block mb-2 text-center md:text-right">الصورة الرئيسية للسيارة (إجباري)</label>
              <label className="relative flex flex-col items-center justify-center h-48 border-2 border-dashed border-gold-800/30 hover:border-gold-500 bg-deepblack rounded-xl cursor-pointer overflow-hidden group">
                {mainImagePreview ? (
                  <>
                    <img src={mainImagePreview} alt="Preview" className="w-full h-full object-cover opacity-60 group-hover:opacity-30 transition-opacity" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <UploadCloud className="text-gold-500 mb-2" size={32} />
                      <span className="text-sm font-bold text-white bg-black/50 px-3 py-1 rounded-md">تغيير الصورة</span>
                    </div>
                  </>
                ) : (
                  <>
                    <UploadCloud className="text-gold-500 mb-2" size={32} />
                    <span className="text-sm text-gray-300">اختر صورة رئيسية واحدة</span>
                  </>
                )}
                <input required={!mainImage} type="file" className="hidden" accept="image/*" onChange={handleMainImageChange} />
              </label>
            </div>
            <div className="space-y-3">
              <label className="flex justify-between items-center text-sm text-gold-400 font-bold mb-2">
                <span>معرض الصور (حتى 30 صورة)</span>
                <span className="text-gray-500 bg-black/30 px-2 py-0.5 rounded-full">{galleryImages.length}/30</span>
              </label>
              <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-700 hover:border-gold-500 bg-deepblack rounded-xl cursor-pointer">
                <UploadCloud className="text-gray-500 mb-2" size={32} />
                <span className="text-sm text-gray-300">حدد صور إضافية لرفعها (يمكن التحديد المتعدد)</span>
                <input type="file" multiple className="hidden" accept="image/*" onChange={handleGalleryChange} />
              </label>
              {galleryPreviews.length > 0 && (
                <div className="grid grid-cols-5 gap-2 mt-4">
                  {galleryPreviews.map((src, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden group border border-gray-800">
                      <img src={src} className="w-full h-full object-cover" alt="" />
                      <button type="button" onClick={(e) => { e.preventDefault(); const nG = [...galleryImages]; nG.splice(i, 1); setGalleryImages(nG); const nP = [...galleryPreviews]; nP.splice(i, 1); setGalleryPreviews(nP); }} className="absolute inset-0 bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            type="submit" disabled={isSubmitting}
            className="w-full bg-gold-gradient text-deepblack py-4 rounded-xl font-bold flex justify-center items-center gap-2 hover:scale-[1.01] transition-transform disabled:opacity-50"
          >
            {isSubmitting ? <><Loader className="animate-spin" size={20} /> جاري رفع البيانات والصور...</> : 'حفظ ونشر السيارة في الموقع'}
          </button>
        </form>
      )}

      {isLoading ? (
        <div className="flex justify-center p-12 text-gray-500"><Loader className="animate-spin" size={40} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.isArray(cars) && cars.map((car: any) => {
            let specsParsed: any = {};
            let galleryParsed: string[] = [];
            try {
              specsParsed = typeof car.specs === 'string' ? JSON.parse(car.specs) : (car.specs || {});
            } catch (e) { }
            try {
              galleryParsed = typeof car.galleryImages === 'string' ? JSON.parse(car.galleryImages) : (car.galleryImages || []);
            } catch (e) { }
            return (
              <div key={car.id} className="bg-charcoal border border-gray-800 rounded-2xl overflow-hidden hover:border-gold-500/20 transition-colors">
                <div className="relative h-48 bg-black">
                  <img src={car.imageUrl} alt={car.modelName} className="w-full h-full object-cover opacity-80" />
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-gray-700 text-xs text-gold-400">
                    العدد المتاح: {car.quantity}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-bold text-white mb-2">{car.modelName}</h3>
                  <p className="text-gray-400 mb-4">{car.dailyPrice} ر.س / يوم</p>

                  <div className="flex gap-2 mb-6">
                    <span className="bg-deepblack border border-gray-800 px-2 py-1 rounded text-xs text-gray-300">{specsParsed.year || '2025'}</span>
                    <span className="bg-deepblack border border-gray-800 px-2 py-1 rounded text-xs text-gray-300" dir="ltr">{specsParsed.hp || '500'} HP</span>
                    {galleryParsed.length > 0 && (
                      <span className="ml-auto bg-gold-500/10 text-gold-500 px-2 py-1 rounded text-xs flex items-center gap-1">
                        + {galleryParsed.length} صور
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleDelete(car.id)}
                    className="w-full flex justify-center items-center gap-2 bg-red-500/10 text-red-500 py-2.5 rounded-lg hover:bg-red-500 hover:text-white transition-colors text-sm font-bold"
                  >
                    <Trash2 size={16} /> إزالة نهائية
                  </button>
                </div>
              </div>
            );
          })}

          {(!cars || cars.length === 0) && (
            <div className="col-span-full bg-deepblack border border-dashed border-gray-800 p-12 text-center rounded-2xl">
              <p className="text-gray-500">لا يوجد سيارات حقيقية في الأسطول. الموقع حاليا ً سيعرض سيارات افتراضية حتى تقوم بإضافة أول سيارة مخصصة لك!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
