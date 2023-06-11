import { useState } from 'react';
import { DashButton } from './DashButton'
import { FileEmbedder } from './FileEmbedder';
import * as PDFJS from 'pdfjs-dist/build/pdf';

PDFJS.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS.version}/pdf.worker.min.js`;

const readFile = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = (event) => resolve(event.target.result);
  reader.onerror = reject;
  reader.readAsText(blob);
});

export default class Pdf {
  static async getPageText(pdf, pageNo) {
    const page = await pdf.getPage(pageNo);
    const tokenizedText = await page.getTextContent();
    const pageText = tokenizedText.items.map((token) => token.str).join('');
    return pageText;
  }

  static async getPDFText(source) {
    const pdf = await PDFJS.getDocument(source).promise;
    const maxPages = pdf.numPages;
    const pageTextPromises = [];
    for (let pageNo = 1; pageNo <= maxPages; pageNo += 1) {
      pageTextPromises.push(Pdf.getPageText(pdf, pageNo));
    }
    const pageTexts = await Promise.all(pageTextPromises);
    return pageTexts.join(' ');
  }
}

export const FileLoader = ({ setFileText }) => {
  const [files, setFiles] = useState();
  const [uploadStatus, setUploadStatus] = useState("Embed");
  const handleEmbed = (files) => {
    setFiles(files)
  };

  return (
    <>
      <FileEmbedder handleEmbed={handleEmbed} />
      <DashButton
        handleClick={async () => {
          if (files && files.length) {
            const file = files[0];
            let text;
            const blob = new Blob([file], { type: 'text/plain' });
            if (file.type === "application/pdf") {
              text = await Pdf.getPDFText(URL.createObjectURL(blob));
            } else { 
              text = await readFile(file)
            }
            console.log(`file text: ${text}`);
            setFileText(text);
            setUploadStatus("Embed Complete");
          }
        }}
      >
        <div>{uploadStatus}</div>
      </DashButton>
    </>
  );
};
