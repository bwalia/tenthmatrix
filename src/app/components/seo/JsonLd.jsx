// Server component: serialises schema.org objects into a JSON-LD script tag.
// `<` is escaped so CMS-supplied strings can never close the script element.
export default function JsonLd({ data }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
