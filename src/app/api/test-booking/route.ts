import { finalizeBooking } from '@/lib/constants/booking';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log(">>> [TESTE-BOOKING] Iniciando simulação de agendamento...");

    // Dados de teste (Simulando o que a Luna pegaria no chat)
    const dadosTeste = {
      nome: "Wil Testador",
      telefone: "94999999999", // Um número que não existe no seu banco ainda
      servico: "Limpeza de Pele", // Precisa ser exatamente como está no banco
      horario: "11:30",
      data: "2026-04-29" // Amanhã
    };

    const resultado = await finalizeBooking(
      dadosTeste.nome,
      dadosTeste.telefone,
      dadosTeste.servico,
      dadosTeste.horario,
      dadosTeste.data
    );

    return NextResponse.json({
      status: "Sucesso!",
      mensagem: "O agendamento foi gravado no Supabase.",
      dados_enviados: dadosTeste,
      resultado: resultado
    });

  } catch (error: any) {
    console.error("❌ Erro no Teste de Booking:", error);
    return NextResponse.json({ 
      status: "Erro",
      mensagem: error.message,
      detalhes: "Verifique se o nome do serviço existe exatamente igual no banco ou se as colunas permitem nulos."
    }, { status: 500 });
  }
}
