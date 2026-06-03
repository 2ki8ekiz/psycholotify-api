export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Sadece POST metodu kabul edilir' });
  }

  try {
    const { mood, intensity, note } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

   const prompt = `Sen empatik, Jung arketiplerine ve Bilişsel Davranışçı yaklaşımlara hakim bir içgörü rehberisin. Tıbbi terimler kullanmazsın, klinik teşhis koymazsın. Amacın, kullanıcının anlattıklarından yola çıkarak ona sıcak, edebi ve farkındalık yaratacak bir 'okuma' sunmaktır.
    
    Kullanıcının bugünkü durumu:
    - Temel Duygu: ${mood}
    - Şiddeti: ${intensity}/10
    - Kullanıcının notu: '${note}'
    
    Bu verileri kullanarak kullanıcıya maksimum 2 paragraflık, metaforlar içeren ve ona kendi gücünü hatırlatan bir analiz yaz. Yanıtına doğrudan analiz metniyle başla. Ekstra hiçbir başlık, ikon, selamlama veya giriş cümlesi ekleme.`;

    // Google'ın aktif ve yayında olan modeli: Gemini 2.5 Flash
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("API Hatası:", data);
      return res.status(500).json({ error: 'Yapay zeka sunucusu yanıt vermedi.' });
    }

    const text = data.candidates[0].content.parts[0].text;

    res.status(200).json({ analysis: text });

  } catch (error) {
    console.error("Sunucu Hatası:", error);
    res.status(500).json({ error: 'Analiz oluşturulurken sunucuda bir hata oluştu.' });
  }
}
