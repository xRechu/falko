import { MangaViewer } from '@/components/manga/MangaViewer';

// Temporary placeholder images - replace with actual manga pages later
const pictures = [
  "DSC00680",
  "DSC00933", 
  "DSC00966",
  "DSC00983",
  "DSC01011",
  "DSC01040",
  "DSC01064",
  "DSC01071",
  "DSC01103",
  "DSC01145",
  "DSC01420",
  "DSC01461",
  "DSC01489",
  "DSC02031",
  "DSC02064",
  "DSC02069",
];

// Create pages array for chapter 1
const pages = [
  {
    front: "book-cover",
    back: pictures[0],
  },
];

// Add content pages
for (let i = 1; i < pictures.length - 1; i += 2) {
  pages.push({
    front: pictures[i % pictures.length],
    back: pictures[(i + 1) % pictures.length],
  });
}

// Add back cover
pages.push({
  front: pictures[pictures.length - 1],
  back: "book-back",
});

export default function Rozdzial1Page() {
  return (
    <MangaViewer
      chapterNumber={1}
      chapterTitle="Rozdział 1: Początek"
      pages={pages}
    />
  );
}