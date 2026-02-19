exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, X-Api-Key',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { prompt } = JSON.parse(event.body || '{}');
    const apiKey = event.headers['x-api-key'];

    if (!apiKey || !apiKey.startsWith('sk-')) {
      return {
        statusCode: 401,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: { message: 'Kein gültiger API Key übergeben' } }),
      };
    }

    if (!prompt) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: { message: 'Kein Prompt übergeben' } }),
      };
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        temperature: 0.1,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `Du bist ein präziser Kochrezept-Extraktions-Agent.
ABSOLUTE REGELN:
1. Halluziniere NIEMALS Mengenangaben. amount: null wenn nicht explizit erkennbar
2. Halluziniere NIEMALS Einheiten. unit: null wenn nicht genannt
3. Erfinde KEINE Schritte die nicht erkennbar sind
4. Antworte NUR mit validem JSON ohne Markdown`,
          },
          { role: 'user', content: prompt },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(data),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: { message: err.message || 'Server-Fehler' } }),
    };
  }
};
