function combineDocuments(documents) {
  // Combine the documents into a single string
  return documents.map((doc) => doc.pageContent).join("\n\n");
}

export { combineDocuments };
