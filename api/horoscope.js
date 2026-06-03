export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Sadece POST metodu kabul edilir' });
  }

  try {
    const { sign, message, history } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    // Jungcu ve derin farkındalık odaklı sistem yönergesi
    const systemInstruction = `Sen Jungcu analitik psikoloji ilkelerini astrolojik sembollerle harmanlayan, geleceği tahmin etmek yerine 'şimdi ve burada' bilincine odaklanan bilge bir İçsel Rehbersin. Kesinlikle falcılık, kehanet veya klinik teşhis yapmazsın. Amacın, burçların evrensel arketiplerini kullanarak kullanıcıya o günkü potansiyellerini hatırlatmak ve edebi, sıcak, samimi bir farkındalık sunmaktır. Sadece Türkçe karakterlerle sıcak bir sahaf romanı dilinde konuş.`;

    let contents = [];

    if (!history || history.length === 0) {
      // 1. Durum: İlk defa burca tıklandı, günlük yorum üretiliyor
      contents = [{
        role: "user",
        parts: [{ text: `${systemInstruction}\n\nBugünün tarihi 2026 yılındayız. Lütfen ${sign} burcu için bugüne özel, onun gölge ve aydınlık yönlerini ele alan, maksimum iki paragraflık edebi ve derin bir psikolojik farkındalık fısıltısı yaz. Doğrudan metne başla.` }]
      }];
    } else {
      // 2. Durum: Kullanıcı yorum hakkında soru soruyor, sohbet devam ediyor
      contents = [...history];
      if (message) {
        contents.push({
          role: "user",
          parts: [{ text: message }]
        });
      }
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API Hatası:", data);
      return res.status(500).json({ error: 'Yapay zeka sunucusu yanıt vermedi.' });
    }

    const text = data.candidates[0].content.parts[0].text;
    res.status(200).json({ reply: text });

  } catch (error) {
    console.error("Sunucu Hatası:", error);
    res.status(500).json({ error: 'Burç analizi hazırlanırken bir hata oluştes.' });
  }
}
