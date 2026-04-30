import { createAdminClient } from '@/lib/supabase/server';

export async function finalizeBooking(
  name: string,
  phone: string,
  serviceName: string,
  time: string,
  date: string
) {
  const supabase = await createAdminClient();

  // 1. Busca o serviço e o dono
  const { data: service, error: serviceErr } = await supabase
    .from('services')
    .select('id, price, user_id')
    .ilike('name', `%${serviceName}%`)
    .single();

  if (serviceErr || !service) throw new Error("Serviço não encontrado.");

  const ownerId = service.user_id;

  // 2. Busca ou Cria o Cliente 
  let { data: client } = await supabase
    .from('clients')
    .select('id')
    .eq('phone', phone)
    .eq('user_id', ownerId) 
    .single();

  if (!client) {
    const { data: newClient, error: clientError } = await supabase
      .from('clients')
      .insert([{ name, phone, user_id: ownerId }])
      .select()
      .single();
    if (clientError) throw clientError;
    client = newClient;
  }

  // 3. FORMATAÇÃO PARA O SUPABASE (Fuso -03:00)
  const finalTimestamp = `${date} ${time}:00`;

  // 4. Cria o Agendamento
  const { error: bookingError } = await supabase
    .from('appointments')
    .insert([{
      client_id: client!.id,
      service_id: service.id,
      user_id: ownerId, 
      date: finalTimestamp,
      status: 'pending',
      price_at_time: service.price
    }]);

  if (bookingError) throw bookingError;

  return { success: true };
}
