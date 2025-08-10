import React, { useState } from "react";
import pdfToText from "react-pdftotext";
import { getLocalAIResponse } from "../../services/ollamaService";

export default function ResumeUpload() {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    pdfToText(file)
      .then((parsedText) => setResumeText(parsedText))
      .catch((err) => console.error("Failed to extract text from pdf", err));
  };

  const getFeedback = async () => {
    setLoading(true);
    setFeedback(""); // clear old result
  
    const prompt = `
  You are a professional resume reviewer.
  Analyze the following resume and job description, and give clear, actionable improvement suggestions.
  
  Resume:
  ${resumeText}
  
  Job Description:
  ${jobDescription}
    `;
  
    const aiResponse = await getLocalAIResponse(prompt);
    setFeedback(aiResponse);
  
    setLoading(false);
  };  

  return (
    <div className="p-6">
      <input type="file" accept="application/pdf" onChange={handleFile} />
      <textarea
        placeholder="Extracted Resume Text"
        value={resumeText}
        readOnly
        className="w-full h-40 border mt-4 p-2"
      />
  
      <textarea
        placeholder="Paste Job Description here"
        value={jobDescription}
        onChange={(e) => setJobDescription(e.target.value)}
        className="w-full h-32 border mt-4 p-2"
      />
  
      <button
        onClick={getFeedback}
        className="bg-blue-500 text-white px-4 py-2 mt-4 rounded"
        disabled={loading}
      >
        {loading ? "Analyzing..." : "Get AI Feedback (Local)"}
      </button>
  
      {loading && (
        <div className="flex items-center mt-4">
          <svg
            className="animate-spin h-5 w-5 mr-2 text-blue-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            ></path>
          </svg>
          Processing...
        </div>
      )}
  
      {feedback && (
        <div className="mt-4 p-4 border bg-gray-50 whitespace-pre-wrap">
          {feedback}
        </div>
      )}
    </div>
  );  
}
