import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'لم يتم استلام أي ملف' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // إنشاء اسم آمن وفريد للصورة
    const fileExtension = file.name.split('.').pop() || 'png';
    const uniqueId = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const fileName = `${uniqueId}.${fileExtension}`;

    const uploadDir = join(process.cwd(), 'public', 'uploads');

    // التأكد من وجود مجلد uploads
    await mkdir(uploadDir, { recursive: true }).catch(() => { });

    const path = join(uploadDir, fileName);
    await writeFile(path, buffer);

    return NextResponse.json({ success: true, url: `/uploads/${fileName}` });
  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء حفظ الملف' }, { status: 500 });
  }
}