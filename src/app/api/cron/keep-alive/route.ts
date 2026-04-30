import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Faz uma consulta boba só para o Supabase ver que tem gente em casa
    const { data, error } = await supabase.from('services').select('id').limit(1);

    if (error) throw error;

    console.log("⏰ SUPABASE KEEP-ALIVE: Projeto acordado com sucesso!");
    return NextResponse.json({ ok: true, message: "Acordado!" });
  } catch (err) {
    console.error("❌ Erro no Keep-alive:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
