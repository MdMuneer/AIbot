import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { readFile } from "fs/promises";
import { createClient } from "@supabase/supabase-js";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings } from "@langchain/openai";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

try {
  const text = await readFile("scrimba-info.txt", "utf-8");

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    separators: ["\n\n", "\n", " ", ""],
    chunkOverlap: 50,
  });

  const output = await splitter.createDocuments([text]);

  const SbUrl = process.env.SUPABASE_URL;
  const SbApiKey = process.env.SUPABASE_API_KEY;
  const openAIApiKey = process.env.OPENAI_API_KEY;
  const client = createClient(SbUrl, SbApiKey);

  await SupabaseVectorStore.fromDocuments(
    output,
    new OpenAIEmbeddings({
      openAIApiKey,
    }),
    {
      client,
      tableName: "documents",
    }
  );

} catch (err) {
  console.log(err);
}
