
import { useEffect, useState } from "preact/hooks";

const channelSlug = "linda-text";

export default function ArenaChannel() {
  const [blocks, setBlocks] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const res = await fetch(
        `https://api.are.na/v2/channels/${channelSlug}?per=100`
      );
      const data = await res.json();
      setBlocks(data.contents.reverse()); // reverse to get chronological
    }
    fetchData();
  }, []);

  return (
    <main class="channel home-wrap">
      <ul class="home">
        {blocks.map((block, i) => {
          let content = null;

          if (block.class === "Image" && block?.image?.display?.url) {
            content = (
              <div class="image-box block">
                <a href={block.image.display.url}>
                  <img
                    src={block.image.display.url}
                    alt={block.title || ""}
                    loading="lazy"
                  />
                </a>
                <p class="title">{block.title}</p>
                <a>image</a>
              </div>
            );
          } else if (block.class === "Text" && block?.content_html) {
            content = (
            <div class="text-box block">
              <div
                dangerouslySetInnerHTML={{ __html: block.content_html }}
              />
              <a>TEXT</a>
            </div>
            );
          } else if (block.class === "Link") {
            content = (
              <div class="link-box block">
                <a href={block.source.url} target="_blank">
                  <img
                    src={block.image.display.url}
                    alt={block.title || ""}
                    loading="lazy"
                  />
                </a>
                <p class="title">{block.title}</p>
                <a>LINK</a>
              </div>
            );
          } else if (
            block.class === "Media" &&
            block.embed?.type?.includes("video")
          ) {
            content = (
              <div class="media-box block">
                <img
                  src={block.image.display.url}
                  alt={block.title || ""}
                  loading="lazy"
                />
                <a
                  href={block.source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  linked video
                </a>
                <p class="title">{block.title}</p>
              </div>
            );
          } else if (
            block.class === "Media" &&
            block.embed?.type?.includes("rich")
          ) {
            content = (
              <div class="media-box block">
                <img
                  src={block.image.display.url}
                  alt={block.title || ""}
                  loading="lazy"
                />
                <a
                  href={block.source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  other
                </a>
                <p class="title">{block.title}</p>
              </div>
            );
          } else if (
            block.class === "Attachment" &&
            block.attachment?.content_type?.includes("video")
          ) {
            content = (
              <div class="video-box block">
                <video
                  src={block.attachment?.url}
                  poster={block.image?.thumb?.url || ""}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  controls
                />
                <a href={block.attachment?.url}>video</a>
                <p class="title">{block.title}</p>
              </div>
            );
          } else if (
            block.class === "Attachment" &&
            block.attachment?.content_type?.includes("audio")
          ) {
            content = (
              <div class="audio-box block">
                <audio controls src={block.attachment?.url} />
                <a href={block.attachment?.url}>audio</a>
                <p class="title">{block.title}</p>
              </div>
            );
          } else if (
            block.class === "Attachment" &&
            block.attachment?.content_type?.includes("pdf") &&
            (block.attachment?.url || block.image?.thumb?.url)
          ) {
            content = (
              <div class="pdf-box block">
                <img
                  src={block.image.thumb.url}
                  alt={block.title || ""}
                  loading="lazy"
                />
                <a href={block.attachment?.url}>PDF</a>
                <p class="title">{block.title}</p>
              </div>
            );
          }

          if (!content) return null;

          return (
            <li key={block.id || `${block.class}-${i}`} class={`${block.title} item`}>
              {content}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
