import { createClient } from '@/lib/supabase/server';

// Nosso cache em memória
let servicesCache: any[] | null = null;
let lastFetch = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos

export async function getServices() {
  const now = Date.now();

  // Se já temos o cache e ele não expirou, retorna ele
  if (servicesCache && (now - lastFetch < CACHE_DURATION)) {
    console.log(">>> [CACHE] Usando espelho de serviços.");
    return servicesCache;
  }

  // Se não, busca no Supabase
  try {
    console.log(">>> [DB] Buscando serviços no Supabase...");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('services') 
      .select('name, price, duration, user_id');

    if (error) throw error;

    servicesCache = data;
    lastFetch = now;
    return servicesCache;
  } catch (error) {
    console.error("❌ Erro ao buscar serviços:", error);
    return servicesCache || []; 
  }
}

// A NOVIDADE: Transforma o array do banco em texto para o Prompt da Luna
export async function getServicesAsText() {
  const services = await getServices();
  
  if (!services || services.length === 0) {
    return "No momento, não temos serviços cadastrados.";
  }

  // Transforma em uma listinha bonita para o System Prompt
  return services
    .map(s => `- ${s.name}: R$ ${s.price}`)
    .join('\n');
}
