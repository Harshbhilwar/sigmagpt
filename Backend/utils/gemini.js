import "dotenv/config";

const getGeminiAPIResponse = async (message) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const lower = message.toLowerCase();

  // 1. Detect if the user wants an image
  const isImageRequest = lower.includes("generate image") || 
                         lower.includes("create image") || 
                         lower.includes("draw");

  // Choose model: Use the specific Image model for image requests
  const model = isImageRequest ? "gemini-3.1-flash-image-preview" : "gemini-3-flash-preview";

  // Existing custom logic
  if (lower.includes("date")) return `Today is ${new Date().toDateString()}`;
  if (lower.includes("who built you")) return "I was built by Harsh Bhilwar.";

  const prompt = `You are SigmaGPT, built by Harsh Bhilwar. User Question: ${message}`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();

    // 2. Handle Image Output (Base64)
    const part = data.candidates?.[0]?.content?.parts?.[0];
    
    if (part?.inlineData) {
      // Return the base64 string formatted for an <img> tag
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }

    // Handle Text Output
    if (part?.text) return part.text;

  } catch (err) {
    console.error("API Error:", err);
  }

  return "AI service is busy. Please try again.";
};

export default getGeminiAPIResponse;