import { createClient } from '@/lib/supabase/server';
import { getServices } from './services';

export async function getNextAvailableSlots(serviceName: string) {
  const supabase = await createClient();
  const services = await getServices();
  
  // 1. ACHAR O SERVIÇO (E o dono dele)
  const service = services.find(s => s.name.toLowerCase().includes(serviceName.toLowerCase()));
  if (!service) {
    console.error("❌ Serviço não encontrado no cache");
    return [];
  }

  const ownerId = service.user_id; 
  console.log(`✅ Buscando para o dono: ${ownerId}`);

  const availableSlots: { date: string, time: string, label: string }[] = [];
  const now = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const checkDate = new Date(now);
    checkDate.setDate(now.getDate() + dayOffset);
    
    if (checkDate.getDay() === 0 || checkDate.getDay() === 6) continue;

    const dateStr = checkDate.toISOString().split('T')[0];

    // 2. BUSCA SIMPLES (O básico que o Supabase entende)
    const { data: occupied } = await supabase
      .from('appointments')
      .select('date')
      .eq('user_id', ownerId)
      .eq('status', 'pending')
      .gte('date', `${dateStr} 00:00:00`)
      .lte('date', `${dateStr} 23:59:59`);

    // Pegamos apenas a hora e minuto: "HH:mm"
    const occupiedTimes = occupied?.map(acc => acc.date.substring(11, 16)) || [];
    console.log(`🚫 Ocupados em ${dateStr}:`, occupiedTimes);

    // 3. GERAR SLOTS
    for (let hour = 8; hour <= 17.5; hour += 0.5) {
      const h = Math.floor(hour).toString().padStart(2, '0');
      const m = (hour % 1 === 0 ? "00" : "30");
      const timeStr = `${h}:${m}`;

      // Pula horários passados (se for hoje)
      if (dayOffset === 0) {
        if (parseInt(h) < now.getHours() || (parseInt(h) === now.getHours() && parseInt(m) <= now.getMinutes())) continue;
      }

      // Pula se estiver ocupado
      if (occupiedTimes.includes(timeStr)) continue;

      const label = dayOffset === 0 ? `hoje às ${timeStr}` : 
                    dayOffset === 1 ? `amanhã às ${timeStr}` : 
                    `dia ${checkDate.getDate()}/${checkDate.getMonth()+1} às ${timeStr}`;

      availableSlots.push({ date: dateStr, time: timeStr, label });
      if (availableSlots.length >= 4) break;
    }
    if (availableSlots.length >= 4) break;
  }

  return availableSlots;
}
