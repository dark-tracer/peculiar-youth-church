import { BookOpenText } from "lucide-react";

const VERSES: { text: string; reference: string }[] = [
  { text: "For I know the plans I have for you, declares the Lord, plans for welfare and not for evil, to give you a future and a hope.", reference: "Jeremiah 29:11" },
  { text: "I can do all things through him who strengthens me.", reference: "Philippians 4:13" },
  { text: "Trust in the Lord with all your heart, and do not lean on your own understanding.", reference: "Proverbs 3:5" },
  { text: "The Lord is my shepherd; I shall not want.", reference: "Psalm 23:1" },
  { text: "Be strong and courageous. Do not be frightened, for the Lord your God is with you wherever you go.", reference: "Joshua 1:9" },
  { text: "Cast all your anxieties on him, because he cares for you.", reference: "1 Peter 5:7" },
  { text: "For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.", reference: "John 3:16" },
  { text: "Come to me, all who labor and are heavy laden, and I will give you rest.", reference: "Matthew 11:28" },
  { text: "Delight yourself in the Lord, and he will give you the desires of your heart.", reference: "Psalm 37:4" },
  { text: "But those who hope in the Lord will renew their strength. They will soar on wings like eagles.", reference: "Isaiah 40:31" },
  { text: "The Lord is my light and my salvation; whom shall I fear?", reference: "Psalm 27:1" },
  { text: "And we know that for those who love God all things work together for good.", reference: "Romans 8:28" },
  { text: "Let all that you do be done in love.", reference: "1 Corinthians 16:14" },
  { text: "Do not be anxious about anything, but in everything by prayer and supplication with thanksgiving let your requests be made known to God.", reference: "Philippians 4:6" },
  { text: "Your word is a lamp to my feet and a light to my path.", reference: "Psalm 119:105" },
  { text: "The Lord your God is in your midst, a mighty one who will save.", reference: "Zephaniah 3:17" },
  { text: "Rejoice in hope, be patient in tribulation, be constant in prayer.", reference: "Romans 12:12" },
  { text: "Greater love has no one than this: to lay down one's life for one's friends.", reference: "John 15:13" },
  { text: "Let your light shine before others, so that they may see your good works and give glory to your Father who is in heaven.", reference: "Matthew 5:16" },
  { text: "The steadfast love of the Lord never ceases; his mercies never come to an end; they are new every morning.", reference: "Lamentations 3:22-23" },
  { text: "Be still, and know that I am God.", reference: "Psalm 46:10" },
  { text: "If God is for us, who can be against us?", reference: "Romans 8:31" },
  { text: "Seek first the kingdom of God and his righteousness, and all these things will be added to you.", reference: "Matthew 6:33" },
  { text: "Above all else, guard your heart, for everything you do flows from it.", reference: "Proverbs 4:23" },
  { text: "In the beginning was the Word, and the Word was with God, and the Word was God.", reference: "John 1:1" },
  { text: "Weeping may tarry for the night, but joy comes with the morning.", reference: "Psalm 30:5" },
  { text: "Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.", reference: "Joshua 1:9" },
  { text: "The Lord is near to the brokenhearted and saves the crushed in spirit.", reference: "Psalm 34:18" },
  { text: "Therefore, if anyone is in Christ, he is a new creation. The old has passed away; behold, the new has come.", reference: "2 Corinthians 5:17" },
  { text: "Love is patient and kind; love does not envy or boast; it is not arrogant or rude.", reference: "1 Corinthians 13:4" },
  { text: "This is the day that the Lord has made; let us rejoice and be glad in it.", reference: "Psalm 118:24" },
];

function dayIndex(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const day = Math.floor(diff / (1000 * 60 * 60 * 24));
  return day % VERSES.length;
}

export function VerseOfTheDay({ overrideText, overrideReference }: { overrideText?: string; overrideReference?: string }) {
  const verse = overrideText
    ? { text: overrideText, reference: overrideReference || "" }
    : VERSES[dayIndex()];

  return (
    <div className="rounded-2xl border border-border bg-card p-8">
      <div className="flex items-center gap-2 text-sm font-semibold text-brand">
        <BookOpenText className="h-4 w-4" /> Verse of the Day
      </div>
      <blockquote className="mt-4 text-lg italic text-foreground/90 leading-relaxed">
        "{verse.text}"
      </blockquote>
      {verse.reference && <p className="mt-3 text-sm text-brand font-semibold">— {verse.reference}</p>}
    </div>
  );
}
