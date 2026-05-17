type JsonLdProps = {
  data: Record<string, unknown> | Record<string, unknown>[];
};

/** Renders schema.org JSON-LD for crawlers */
export default function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
