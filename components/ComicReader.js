import Image from "next/image";
import { resolveStorageUrl } from "../src/utils/media";
import styles from "./ComicReader.module.css";

export default function ComicReader({ images = [] }) {
  return (
    <section className={styles.reader}>
      {images.map((path, index) => (
        <div key={`${path}-${index}`} className={styles.panel}>
          <Image
            src={resolveStorageUrl(path)}
            alt={`Comic page ${index + 1}`}
            width={1080}
            height={1520}
            loading="lazy"
            className={styles.image}
            unoptimized
          />
        </div>
      ))}
    </section>
  );
}
