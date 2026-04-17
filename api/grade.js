export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Vercel securely pulls this from your project settings (we will set this up in Step 4)
    const API_KEY = process.env.GEMINI_API_KEY; 
    
    if (!API_KEY) {
        return res.status(500).json({ error: 'API key is missing on the server.' });
    }

    const studentEssay = req.body.essay;

    const SYSTEM_PROMPT = `
You are a Senior GCE O-Level Humanities Examiner marking a Q5 Assertion question. 
The question is: "AI will ruin the education system." How far do these sources support this statement?

MARKING RULES (Q5):
* L1 (1-2m): General statements not using source evidence.
* L2 (3-5m): One-Sided answer (Only Supports OR Only Rejects). Must explicitly link to hypothesis, quote evidence, and explain.
* L3 (6-8m): Balanced answer (Both Supports AND Rejects).
* L4 (9-10m): Achieves L3 PLUS provides a final justified conclusion by evaluating the reliability of a source.

OUTPUT FORMAT:
1. Estimated Grade: [Level and Marks]
2. What You Did Well: [One positive sentence]
3. The Gap: [What is missing based on LORMS]
4. Model Answer Snippet: [A paragraph showing how to improve]
`;

    try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
        
        const payload = {
            contents: [{
                parts: [{ text: SYSTEM_PROMPT + "\n\n---\n\nSTUDENT'S ESSAY:\n" + studentEssay }]
            }],
            generationConfig: { temperature: 0.2 }
        };

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.error) throw new Error(data.error.message);

        const aiFeedback = data.candidates[0].content.parts[0].text;
        
        // Send the feedback back to the student's browser
        return res.status(200).json({ feedback: aiFeedback });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
