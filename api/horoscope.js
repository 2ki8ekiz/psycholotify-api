export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { sign, message, history } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    // 1. Sohbet geçmişini Gemini'nin sevdiği formata zorla sokalım
    let contents = [];
    contents.push({ role: "user", parts: [{ text: `Sen bir psikolojik rehbersin. ${sign} burcu için bilgece bir yorum yap.` }] });
    
    if (Array.isArray(history)) {
      history.forEach(item => {
        contents.push({ role: item.role === 'model' ? 'model' : 'user', parts: item.parts });
      });
    }
    if (message) contents.push({ role: "user", parts: [{ text: message }] });

    // 2. İstek gönder
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: contents })
    });

    const data = await response.json();

    // 3. HATA YAKALAMA: Yanıtı güvenli bir şekilde çek
    if (data && data.candidates && data.candidates[0]) {
      const text = data.candidates[0].content.parts[0].text;
      return res.status(200).json({ reply: text });
    } else {
      // Eğer Gemini farklı bir format dönerse ham veriyi logla ve hata döndür
      console.error("Gemini Ham Yanıt:", JSON.stringify(data));
      return res.status(500).json({ error: 'Gemini yanıtı işlenemedi.' });
    }

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
