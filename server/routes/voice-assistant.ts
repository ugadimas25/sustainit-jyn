import { Router } from "express";
import OpenAI from "openai";
import { z } from "zod";

const router = Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Schema for chat request validation
const chatRequestSchema = z.object({
  message: z.string().min(1).max(1000),
  conversation: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).optional().default([]),
  context: z.string().optional()
});

// EUDR compliance knowledge base
const EUDR_KNOWLEDGE = `
You are EUDR Assistant, a friendly and knowledgeable AI helper specializing in European Union Deforestation Regulation (EUDR) compliance. 

Key EUDR Information:
- EUDR came into effect on June 29, 2023
- Companies must ensure commodities (soy, beef, palm oil, wood, cocoa, coffee, rubber) are deforestation-free
- Due diligence statements (DDS) required for imports
- Geolocation data mandatory for all plots/farms
- Risk assessment: low, standard, enhanced based on country/region
- Penalties include fines up to 4% of annual turnover
- Supply chain traceability from farm to final product required

Your personality:
- Friendly, approachable, and encouraging
- Use simple language, avoid overly technical jargon
- Provide practical, actionable advice
- Show empathy for compliance challenges
- Be concise but thorough
- Use encouraging phrases like "Great question!", "You're on the right track!", "Let me help you with that!"

Always relate answers to practical compliance steps and offer specific guidance for supply chain management.
`;

router.post('/chat', async (req, res) => {
  try {
    const { message, conversation, context } = chatRequestSchema.parse(req.body);

    // Build conversation history for context
    const messages = [
      {
        role: 'system' as const,
        content: EUDR_KNOWLEDGE
      },
      ...conversation.slice(-8), // Keep last 8 messages for context
      {
        role: 'user' as const,
        content: message
      }
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages,
      max_tokens: 300,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    });

    const assistantMessage = completion.choices[0]?.message?.content;

    if (!assistantMessage) {
      throw new Error('No response generated');
    }

    res.json({
      message: assistantMessage,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Voice assistant chat error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request format',
        details: error.errors
      });
    }

    if (error instanceof Error && error.message.includes('API key')) {
      return res.status(401).json({
        error: 'OpenAI API key not configured'
      });
    }

    res.status(500).json({
      error: 'Failed to process chat request',
      message: 'I apologize, but I\'m experiencing technical difficulties. Please try again in a moment.'
    });
  }
});

// Speech-to-text endpoint (for future enhancement)
router.post('/transcribe', async (req, res) => {
  try {
    // This would handle audio file transcription using OpenAI Whisper
    // For now, we're using browser-native speech recognition
    res.status(501).json({
      error: 'Speech transcription endpoint not yet implemented',
      message: 'Currently using browser-native speech recognition'
    });
  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({
      error: 'Transcription failed'
    });
  }
});

// Text-to-speech endpoint (for future enhancement)
router.post('/synthesize', async (req, res) => {
  try {
    // This would handle text-to-speech using OpenAI TTS
    // For now, we're using browser-native speech synthesis
    res.status(501).json({
      error: 'Speech synthesis endpoint not yet implemented',
      message: 'Currently using browser-native speech synthesis'
    });
  } catch (error) {
    console.error('Speech synthesis error:', error);
    res.status(500).json({
      error: 'Speech synthesis failed'
    });
  }
});

export { router as voiceAssistantRouter };