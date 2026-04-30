import { createGroq } from '@ai-sdk/groq';
import { streamText, generateText } from 'ai';
import { getServicesAsText, getServices } from '@/lib/constants/services';
import { getNextAvailableSlots } from '@/lib/constants/appointments';
import { finalizeBooking } from '@/lib/constants/booking';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const lastUserMessage = messages.filter((m: any) => m.role === 'user').at(-1)?.content || "";
    const recentMessages = messages.slice(-6);
    const supabase = await createAdminClient();

    // 1. DATA E HORA
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.formatToParts(now);
    const brDate = `${parts.find(p => p.type === 'year')?.value}-${parts.find(p => p.type === 'month')?.value}-${parts.find(p => p.type === 'day')?.value}`;

    // 🧠 PASSO 1: A LUNA "PENSANDO" (EXTRAÇÃO SEMÂNTICA)
    const { text: extractedJson } = await generateText({
      model: groq('llama-3.1-8b-instant'),
      system: `Analise a conversa e extraia os dados para o formulário. 
               Seja preciso. Se o usuário mudar de ideia, use a última informação.
               Converta horas para HH:mm.
               Retorne APENAS um JSON: {"servico": string|null, "horario": string|null, "nome": string|null, "telefone": string|null}`,
      prompt: `Conversa Recente: ${messages.map((m: any) => `${m.role}: ${m.content}`).join('\n')}`,
    });

    let form;
    try { 
        form = JSON.parse(extractedJson); 
        console.log("📝 Formulário Preenchido pela IA:", form);
    } catch { 
        form = { servico: null, horario: null, nome: null, telefone: null }; 
    }

    // 2. LOGICA DE NEGÓCIO (SERVIÇOS E SLOTS)
    const servicesRaw = await getServices();
    const menuDeServicos = await getServicesAsText();
    
    // Busca o objeto do serviço no banco com base no nome que a IA extraiu
    let servicoSelecionado = servicesRaw.find(s => 
        form.servico?.toLowerCase().includes(s.name.toLowerCase()) || 
        s.name.toLowerCase().includes(form.servico?.toLowerCase())
    );

    let melDosHorarios = "";
    let dataParaAgendamento = brDate;

    if (servicoSelecionado) {
      const slots = await getNextAvailableSlots(servicoSelecionado.name);
      
      if (form.horario) {
        const slotEscolhido = slots.find(s => s.time === form.horario);
        if (slotEscolhido) dataParaAgendamento = slotEscolhido.date;
      }

      if (!form.horario && slots.length > 0) {
        melDosHorarios = `\n\nHORÁRIOS DISPONÍVEIS: ${slots.map(s => s.label).join(', ')}.`;
      }
    }

    // 3. DISPARO DO AGENDAMENTO (O Finalizador)
    if (form.telefone && form.horario && servicoSelecionado && form.nome) {
       console.log("🚀 AGENDAMENTO VALIDADO! Enviando para o banco...");
       finalizeBooking(form.nome, form.telefone, servicoSelecionado.name, form.horario, dataParaAgendamento)
         .catch(err => console.error("❌ Erro ao salvar:", err));
    }

    // 4. RESPOSTA FLUIDA DA LUNA
    return streamText({
      model: groq('llama-3.1-8b-instant'),
      messages: recentMessages,
      system: `Você é a Luna, atendente da Clínica Lumière. ✨
      
      DADOS DO FORMULÁRIO ATUAL:
      - SERVIÇO: ${servicoSelecionado?.name || 'Pendente'}
      - HORA: ${form.horario || 'Pendente'}
      - CLIENTE: ${form.nome || 'Pendente'}
      - TELEFONE: ${form.telefone || 'Pendente'}

      SUA MISSÃO:
      1. Siga o fluxo: Saudação -> Serviço -> Horário -> Nome/Tel -> Confirmação.
      2. Use os dados acima para saber onde você está na conversa.
      3. Se o serviço já está definido, não ofereça o menu novamente.
      4. Ofereça os horarios da lista "HORÁRIOS DISPONÍVEIS", e so aceite eles como opção valida!
      4. Se o telefone falta, peça-o gentilmente.
      
      DISPONIBILIDADE REAL (Hoje é ${brDate}):
      ${melDosHorarios || 'Consulte o cliente sobre o horário preferido.'}
      
      MENU:
      ${menuDeServicos}`,
    }).toDataStreamResponse();

  } catch (error) {
    console.error("💥 Erro Fatal:", error);
    return new Response("Erro interno", { status: 500 });
  }
}
