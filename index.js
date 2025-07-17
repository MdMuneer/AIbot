import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
dotenv.config();

import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { retriever } from "./utils/retriever.js";
import { formatChatHistory } from "./utils/formatChatHistory.js";
import { combineDocuments } from "./utils/combineDocuments.js";
import {
  RunnablePassthrough,
  RunnableSequence,
} from "@langchain/core/runnables";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

const llm = new ChatOpenAI({ openAIApiKey: process.env.OPENAI_API_KEY });

const standaloneQuestionPrompt = PromptTemplate.fromTemplate(
  `Given some conversation history (if any) and a question, convert the question to a standalone question. 
conversation history: {conv_history}
question: {question} 
standalone question:`
);
const standaloneQuestionChain = standaloneQuestionPrompt
  .pipe(llm)
  .pipe(new StringOutputParser());

const retrieverChain = RunnableSequence.from([
  (prevResult) => prevResult.standalone_Question,
  retriever,
  combineDocuments,
]);

const answerPrompt =
  PromptTemplate.fromTemplate(`You are a helpful and enthusiastic support bot who can answer a given question about Scrimba based on the context provided and the conversation history. Try to find the answer in the context. If the answer is not given in the context, find the answer in the conversation history if possible. If you really don't know the answer, say "I'm sorry, I don't know the answer to that." And direct the questioner to email muneerhelp@scrimba.com. Don't try to make up an answer. Always speak as if you were chatting to a friend.
context: {context}
conversation history: {conv_history}
question: {question}
answer: `);

const answerChain = answerPrompt.pipe(llm).pipe(new StringOutputParser());

const convHistory = [];

const fullChain = RunnableSequence.from([
  {
    standalone_Question: standaloneQuestionChain,
    original_input: new RunnablePassthrough(),
  },
  {
    context: retrieverChain,
    question: ({ original_input }) => original_input.question,
    conv_history: ({ original_input }) => original_input.conv_history,
  },
  answerChain,
]);

app.post("/ask", async (req, res) => {
  const { question } = req.body;
  try {
    const response = await fullChain.invoke({
      question,
      conv_history: formatChatHistory(convHistory),
    });
    convHistory.push(question);
    convHistory.push(response);
    res.json({ response });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong." });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
