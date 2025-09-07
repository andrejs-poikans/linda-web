export type ArenaBlock =
|   {
    class: 'Link';
    title?: string;
    source: { url: string };
    description?: string;
    image: {
        thumb: { url: string };
        large: { url: string };
        square: { url: string };
        display: { url: string};
        original: { url: string };
    }
    }
|   {
    class: 'Image';
    title?: string;
    source: { url: string };
    description?: string;
    image: {
        thumb: { url: string };
        large: { url: string };
        square: { url: string };
        display: { url: string};
        original: { url: string };
    }
    }
|   {
    class: 'Text';
    title?: string;
    content_html?: string;
    description?: string;
    }
|   {
      class: 'Attachment';
      title?: string;
      source: { url: string };
      description?: string;
      image?: {
        thumb?: { url: string };
        large?: { url: string };
        display?: { url: string };
        original?: { url: string };
      };
      attachment?: {
        content_type?: string;   // can be 'video', 'rich', etc.
        url?: string;
        html?: string;
      }
    }
|{
      class: 'Media';
      title?: string;
      source: { url: string };
      description?: string;
      image?: {
        thumb?: { url: string };
        large?: { url: string };
        display?: { url: string };
        original?: { url: string };
      };
      embed?: {
        content_type?: string;   // can be 'video', 'rich', etc.
        url?: string;
        html?: string;
      }
    };