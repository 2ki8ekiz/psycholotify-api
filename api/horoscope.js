export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ reply: 'Method Not Allowed' });

  try {
    // 1. ZIRH: Android'den gelen veriyi her koşulda güvenle JSON'a çevir
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        console.error("Veri çözme hatası:", e);
      }
    }

    const { sign, message, history } = body || {};
    const apiKey = process.env.GEMINI_API_KEY;

    // 2. ZIRH: Vercel gizli kasası (API Key) kontrolü
    if (!apiKey) {
      console.error("API Key Vercel'de bulunamadı!");
      return res.status(500).json({ reply: 'Sunucu yapılandırma hatası: API anahtarı eksik.' });
    }

    // Sohbet geçmişini Gemini'nin sevdiği formata zorla sokalım
    let contents = [];
    contents.push({ role: "user", parts: [{ text: `Sen Jungcu bir psikolojik rehbersin. ${sign} burcu için bilgece, şefkatli ve edebi bir yorum yap.` }] });
    
    if (Array.isArray(history)) {
      history.forEach(item => {
        contents.push({ role: item.role === 'model' ? 'model' : 'user', parts: item.parts });
      });
    }
    if (message) contents.push({ role: "user", parts: [{ text: message }] });

    // İstek gönder
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: contents })
    });

    const data = await response.json();

    // 3. ZIRH: HATA YAKALAMA: Yanıtı güvenli bir şekilde çek
    if (data && data.candidates && data.candidates[0]) {
      const text = data.candidates[0].content.parts[0].text;
      return res.status(200).json({ reply: text });
    } else {
      console.error("Gemini Ham Yanıt:", JSON.stringify(data));
      return res.status(500).json({ reply: 'Yapay zeka yanıtı işlenemedi. Lütfen tekrar dene.' });
    }

  } catch (error) {
    console.error("Sunucu Çökmesi:", error);
    return res.status(500).json({ reply: `Sunucu hatası: ${error.message}` });
  }
}
