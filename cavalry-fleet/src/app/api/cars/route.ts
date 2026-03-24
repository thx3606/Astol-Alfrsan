import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const cars = await prisma.car.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(cars);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch cars' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { modelName, dailyPrice, quantity, imageUrl, galleryImages, specs } = body;

    const car = await prisma.car.create({
      data: {
        modelName,
        dailyPrice: Number(dailyPrice),
        quantity: Number(quantity),
        imageUrl,
        galleryImages,
        specs,
      }
    });

    return NextResponse.json({ success: true, car });
  } catch (error) {
    console.error('Create Car Error:', error);
    return NextResponse.json({ error: 'Failed to create car' }, { status: 500 });
  }
}