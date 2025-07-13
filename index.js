import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { readFile } from "fs/promises";

try {
  const text = await readFile("scrimba-info.txt", "utf-8");

  const splitter = new RecursiveCharacterTextSplitter({
    chinkSize: 500,
    separators: ["\n\n", "\n", " ", ""],
    chunkOverlap: 50,
  });

  const output = await splitter.createDocuments([text]);
  console.log(output);

  const SbUrl = process.env.SUPABASE_URL;
  const SbApiKey = process.env.SUPABASE_API_KEY;
  const openAiApiKey = process.env.OPENAI_API_KEY;
} catch (err) {
  console.log(err);
}
