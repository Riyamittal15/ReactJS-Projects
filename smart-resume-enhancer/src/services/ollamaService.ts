export const getLocalAIResponse = async (prompt: string) => {
    try {
        const res = await fetch("http://localhost:11434/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "llama3", // change to mistral or gemma if needed
                prompt,
                stream: false
            }),
        });

        if (!res.ok) throw new Error(`Ollama error: ${res.statusText}`);

        const data = await res.json();
        return data.response;
    } catch (error) {
        console.error("Error connecting to Ollama:", error);
        return "❌ Could not connect to local AI. Is Ollama running?";
    }
};
