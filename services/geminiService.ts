import { GoogleGenAI } from "@google/genai";
import { Visitor } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateWelcomeEmail = async (visitor: Visitor, eventName: string): Promise<{ subject: string; body: string }> => {
  try {
    if (!process.env.API_KEY) throw new Error("API Key is missing");

    const prompt = `
      Write a warm, professional, and short welcome email for an attendee arriving at our event.
      
      Event Name: ${eventName}
      Attendee Name: ${visitor.fullName}
      Company: ${visitor.company}
      Role: ${visitor.role}

      The email should confirm they have successfully checked in.
      Keep the tone exciting but professional.
      Return the result in JSON format with keys "subject" and "body".
      The body should be plain text, suitable for email.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating welcome email:", error);
    return {
      subject: `Welcome to ${eventName}!`,
      body: `Hi ${visitor.fullName},\n\nWelcome to ${eventName}. We are glad to have you here representing ${visitor.company}. Enjoy the event!\n\nBest,\nEvent Team`
    };
  }
};

export const generateThankYouEmail = async (visitor: Visitor, eventName: string, highlights: string): Promise<{ subject: string; body: string }> => {
  try {
    if (!process.env.API_KEY) throw new Error("API Key is missing");

    const prompt = `
      Write a personalized thank you email to an attendee after the event.
      
      Event Name: ${eventName}
      Attendee Name: ${visitor.fullName}
      Event Highlights to mention: ${highlights}

      Return the result in JSON format with keys "subject" and "body".
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating thank you email:", error);
    return {
      subject: `Thank you for attending ${eventName}`,
      body: `Hi ${visitor.fullName},\n\nThank you for joining us at ${eventName}. We hope you found it valuable.\n\nBest,\nEvent Team`
    };
  }
};