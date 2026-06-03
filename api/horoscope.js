export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Sadece POST metodu kabul edilir' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') body = JSON.parse(body);
    const { sign, message, history } = body;
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API Anahtarı eksik.' });
    }

    // Sistemin ruhu ve ilk tetikleyici sorumuz
    const systemPrompt = `Sen Jungcu analitik psikoloji ilkelerini astrolojik sembollerle harmanlayan bilge bir İçsel Rehbersin. Falcılık veya klinik teşhis yapmazsın. Amacın sıcak, edebi ve samimi bir farkındalık sunmaktır. Sadece Türkçe karakterlerle yaz.`;
    const initialUserPrompt = `Lütfen ${sign} burcu için bugüne özel, gölge ve aydınlık yönlerini ele alan edebi bir psikolojik farkındalık fısıltısı yaz. Doğrudan metne başla.`;

    let contents = [];
    const safeHistory = Array.isArray(history) ? history : [];

    if (safeHistory.length === 0) {
      // DURUM 1: İlk defa tıklanıyor. Temiz bir sayfa açıyoruz.
      contents.push({
        role: "user",
        parts: [{ text: systemPrompt + "\n\n" + initialUserPrompt }]
      });
    } else {
      // DURUM 2: Sohbet devam ediyor. 
      // Gemini çökmesin diye sohbeti zorla "user" (kullanıcı) ile başlatıyoruz.
      contents.push({
        role: "user",
        parts: [{ text: systemPrompt + "\n\n" + initialUserPrompt }]
      });

      // Android'den gelen önceki konuşmaları sıraya diziyoruz
      for(let item of safeHistory) {
         contents.push({
           role: item.role === 'model' ? 'model' : 'user',
           parts: item.parts
         });
      }

      // Ve son olarak kullanıcının yeni yazdığı soruyu ekliyoruz
      contents.push({
        role: "user",
        parts: [{ text: message }]
      });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: contents })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini Reddedilme Hatası:", data);
      return res.status(500).json({ error: 'Yapay zeka formatı reddetti.' });
    }

    const text = data.candidates[0].content.parts[0].text;
    return res.status(200).json({ reply: text });

  } catch (error) {
    console.error("Sunucu Çökmesi:", error);
    return res.status(500).json({ error: 'Sunucu içi işlem hatası.' });
  }
}
