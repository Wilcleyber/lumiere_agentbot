import { getServices } from '@/lib/constants/services';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const services = await getServices();
    return NextResponse.json({ 
      status: 'Conectado!', 
      data: services 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      status: 'Erro', 
      message: error.message 
    }, { status: 500 });
  }
}
