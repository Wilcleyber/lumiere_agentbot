export function interpretScheduleIntent(text: string) {
  const content = text.toLowerCase();
  
  // 1. TELEFONE 
  const phoneRegex = /(?:\(?\d{2}\)?\s?)?(?:9\s?)?\d{4}[-\s]?\d{4}/;
  const phoneMatch = content.match(phoneRegex);
  const cleanPhone = phoneMatch ? phoneMatch[0].replace(/\D/g, '') : null;

  // 2. HORÁRIO 
  const timeRegex = /\b([0-1]?[0-9]|2[0-3])[:h\s](00|30)\b/;
  const timeMatch = content.match(timeRegex);
  
  const hourOnlyRegex = /\b([0-1]?[0-9]|2[0-3])\s*(?:horas|hrs|h)\b/;
  const hourOnlyMatch = content.match(hourOnlyRegex);

  let interpretedTime = null;

  if (timeMatch) {
    interpretedTime = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
  } else if (hourOnlyMatch) {
    interpretedTime = `${hourOnlyMatch[1].padStart(2, '0')}:00`;
  }

  // 3. NOME 
  const ignoreList = ['quero', 'olá', 'ola', 'bom', 'dia', 'boa', 'tarde', 'gostaria', 'preciso', 'agendar'];
  let possibleName = text.split(/[,|\n]|\bat\b|\bas\b/i)[0].trim();
  
  const firstWord = possibleName.split(' ')[0].toLowerCase();
  if (ignoreList.includes(firstWord)) {
    possibleName = possibleName.split(' ').slice(1).join(' ').trim();
  }

  const finalName = (possibleName.length > 2 && possibleName.length < 25 && !possibleName.includes(':')) 
                    ? possibleName 
                    : null;

  // 4. LOGS DE DIAGNÓSTICO 
  console.log(`
  🔍 [INTERPRETER] Analisando: "${text.substring(0, 30)}..."
  ⏰ Hora extraída: ${interpretedTime || '❌'}
  📞 Tel extraído: ${cleanPhone || '❌'}
  👤 Nome extraído: ${finalName || '❌'}
  `);

  return {
    time: interpretedTime,
    phone: cleanPhone,
    name: finalName
  };
}
