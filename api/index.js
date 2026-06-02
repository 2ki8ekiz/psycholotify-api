const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Sadece POST metodu kabul edilir' });
  }

  try {
    const { mood, intensity, note } = req.body;

    const prompt = `Sen empatik, Jung arketiplerine ve Bilişsel Davranışçı yaklaşımlara hakim bir içgörü rehberisin. Tıbbi terimler kullanmazsın, klinik teşhis koymazsın. Amacın, kullanıcının anlattıklarından yola çıkarak ona sıcak, edebi ve farkındalık yaratacak bir 'okuma' sunmaktır.
    
    Kullanıcının bugünkü durumu:
    - Temel Duygu: ${mood}
    - Şiddeti: ${intensity}/10
    - Kullanıcının notu: '${note}'
    
    Bu verileri kullanarak kullanıcıya maksimum 2 paragraflık, metaforlar içeren ve ona kendi gücünü hatırlatan bir analiz yaz. Çıktı sadece bu analiz metni olsun, ekstra bir giriş veya selamlama yapma.`;

    const model = genAI.getGenerativeModel({ model: "gemini-pro"});
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.status(200).json({ analysis: text });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Analiz oluşturulurken bir hata oluştu.' });
  }
}
