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

// Create pages array for chapter 4 (mixed order)
const mixedPictures = [
  pictures[8], pictures[2], pictures[15], pictures[5],
  pictures[11], pictures[1], pictures[14], pictures[7],
  pictures[3], pictures[12], pictures[6], pictures[0],
  pictures[13], pictures[9], pictures[4], pictures[10]
];

const pages = [
  {
    front: "book-cover",
    back: mixedPictures[0],
  },
];

// Add content pages
for (let i = 1; i < mixedPictures.length - 1; i += 2) {
  pages.push({
    front: mixedPictures[i % mixedPictures.length],
    back: mixedPictures[(i + 1) % mixedPictures.length],
  });
}

pages.push({
  front: mixedPictures[mixedPictures.length - 1],
  back: "book-back",
});

export default function Rozdzial4Page() {
  return (
    <MangaViewer
      chapterNumber={4}
      chapterTitle="Rozdział 4: Finał"
      pages={pages}
    />
  );
}