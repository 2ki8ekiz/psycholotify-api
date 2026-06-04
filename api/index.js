export default async function handler(req, res) {
  // Sadece POST isteklerini kabul ediyoruz
  if (req.method !== 'POST') {
    return res.status(405).json({ analysis: 'Sadece POST metodu kabul edilir' });
  }

  try {
    // 1. ZIRH: Android'den gelen veriyi her koşulda güvenle aç (String/JSON kalkanı)
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        console.error("Veri çözme hatası:", e);
      }
    }

    const { mood, intensity, note } = body || {};
    const apiKey = process.env.GEMINI_API_KEY;

    // 2. ZIRH: Vercel gizli kasası kontrolü
    if (!apiKey) {
      console.error("API Key Vercel'de bulunamadı!");
      return res.status(500).json({ analysis: 'Sistem ayarlarında API anahtarı eksik.' });
    }

    const prompt = `Sen empatik, Jung arketiplerine ve Bilişsel Davranışçı yaklaşımlara hakim bir içgörü rehberisin. Tıbbi terimler kullanmazsın, klinik teşhis koymazsın. Amacın, kullanıcının anlattıklarından yola çıkarak ona sıcak, edebi ve farkındalık yaratacak bir 'okuma' sunmaktır.
    
    Kullanıcının bugünkü durumu:
    - Temel Duygu: ${mood || "Belirtilmedi"}
    - Şiddeti: ${intensity || 5}/10
    - Kullanıcının notu: '${note || "Belirtilmedi"}'
    
    Bu verileri kullanarak kullanıcıya maksimum 2 paragraflık, metaforlar içeren ve ona kendi gücünü hatırlatan bir analiz yaz. Yanıtına doğrudan analiz metniyle başla.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini Hatası:", JSON.stringify(data));
      return res.status(500).json({ analysis: 'Yapay zeka motoru şu an meşgul. Lütfen tekrar dene.' });
    }

    // 3. ZIRH: Yanıtı güvenle yakala ve Android'in beklediği 'analysis' anahtarıyla yolla
    if (data && data.candidates && data.candidates[0]) {
      const text = data.candidates[0].content.parts[0].text;
      return res.status(200).json({ analysis: text });
    } else {
      return res.status(500).json({ analysis: 'Yapay zekadan gelen yanıt işlenemedi.' });
    }

  } catch (error) {
    console.error("Sunucu Çökmesi:", error);
    return res.status(500).json({ analysis: 'Sunucu içi bağlantı hatası oluştu.' });
  }
}
