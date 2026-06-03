export default async function handler(req, res) {
  // Sadece POST isteklerini kabul ediyoruz
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Sadece POST metodu kabul edilir' });
  }

  try {
    const { sign, message, history } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("API Key Bulunamadı!");
      return res.status(500).json({ error: 'Sistem ayarlarında API anahtarı eksik.' });
    }

    // Jungcu ve derin farkındalık odaklı sistem yönergesi (Persona tanımı)
    const systemInstructionText = `Sen Jungcu analitik psikoloji ilkelerini astrolojik sembollerle harmanlayan, geleceği tahmin etmek yerine 'şimdi ve burada' bilincine odaklanan bilge bir İçsel Rehbersin. Kesinlikle falcılık, kehanet veya klinik teşhis yapmazsın. Amacın, burçların evrensel arketiplerini kullanarak kullanıcıya o günkü potansiyellerini hatırlatmak ve edebi, sıcak, samimi bir farkındalık sunmaktır. Sadece Türkçe karakterlerle, sıcak bir sahaf romanı dilinde konuş.`;

    let contents = [];

    // Gelen geçmiş (history) verisini güvenli bir şekilde kontrol ediyoruz
    const safeHistory = Array.isArray(history) ? history : [];

    if (safeHistory.length === 0) {
      // 1. Durum: İlk defa burca tıklandı, günlük farkındalık yorumu üretiliyor
      contents = [{
        role: "user",
        parts: [{ text: `Lütfen ${sign} burcu için bugüne özel, onun gölge ve aydınlık yönlerini ele alan, maksimum iki paragraflık edebi ve derin bir psikolojik farkındalık fısıltısı yaz. Doğrudan metne başla.` }]
      }];
    } else {
      // 2. Durum: Kullanıcı yorum hakkında soru soruyor, sohbet devam ediyor
      contents = [...safeHistory];
      if (message) {
        contents.push({
          role: "user",
          parts: [{ text: message }]
        });
      }
    }

    // En güncel ve sabırlı Gemini API adresi
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    // Gemini API'sine resmi formatta istek gönderiyoruz
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: contents,
        systemInstruction: {
          parts: [{ text: systemInstructionText }]
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API Kaynaklı Hata:", data);
      return res.status(500).json({ error: 'Yapay zeka motoru bağlantıyı reddetti.' });
    }

    // Güvenli veri okuma: candidates dizisinin boş olup olmadığını kontrol ediyoruz
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const text = data.candidates[0].content.parts[0].text;
      return res.status(200).json({ reply: text });
    } else {
      return res.status(500).json({ error: 'Yapay zekadan geçerli bir yanıt alınamadı.' });
    }

  } catch (error) {
    console.error("Sunucu İçi Hata oluştu:", error);
    return res.status(500).json({ error: 'Burç analizi hazırlanırken sunucu içi bir çökme yaşandı.' });
  }
}
