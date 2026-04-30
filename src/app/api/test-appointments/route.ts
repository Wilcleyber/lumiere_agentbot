import { getNextAvailableSlots } from '@/lib/constants/appointments';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Agora testamos a nova função "Caçadora de Vagas"
    const proximosHorarios = await getNextAvailableSlots("Limpeza de Pele");

    return NextResponse.json({
      servico: "Limpeza de Pele",
      mensagem: "Buscando os próximos 5 horários disponíveis a partir de agora:",
      resultados: proximosHorarios,
      total_encontrado: proximosHorarios.length
    });
    
  } catch (error: any) {
    console.error("Erro no teste:", error);
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }
}
