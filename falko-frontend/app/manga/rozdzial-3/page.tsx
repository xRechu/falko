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

// Create pages array for chapter 3 (reverse order for variety)
const reversedPictures = [...pictures].reverse();

const pages = [
  {
    front: "book-cover",
    back: reversedPictures[0],
  },
];

// Add content pages
for (let i = 1; i < reversedPictures.length - 1; i += 2) {
  pages.push({
    front: reversedPictures[i % reversedPictures.length],
    back: reversedPictures[(i + 1) % reversedPictures.length],
  });
}

pages.push({
  front: reversedPictures[reversedPictures.length - 1],
  back: "book-back",
});

export default function Rozdzial3Page() {
  return (
    <MangaViewer
      chapterNumber={3}
      chapterTitle="Rozdział 3: Wyzwanie"
      pages={pages}
    />
  );
}