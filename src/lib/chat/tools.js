// Client tools for the enquiry assistant. strict: true keeps arguments
// schema-valid; eager_input_streaming streams large inputs, which means the
// SDK no longer validates them, so executor.js checks every input itself.
const tool = (name, description, properties) => ({
  name,
  description,
  strict: true,
  eager_input_streaming: true,
  input_schema: {
    type: 'object',
    properties,
    required: Object.keys(properties),
    additionalProperties: false,
  },
});

export const TOOLS = [
  tool(
    'search_site',
    "Search TenthMatrix's articles, blog posts and insights. Use short topic queries (e.g. 'invoice automation', 'agent approval gates'). Returns titles, links and excerpts to cite.",
    { query: { type: 'string', description: 'Short topic query, 2-6 words.' } },
  ),
  tool(
    'record_requirements',
    'Silently record new facts the visitor gave about the job: what it is, systems involved, team size, who checks results, what must never be automatic, timescale, budget. Only facts they stated, in their words.',
    { notes: { type: 'string', description: 'The new facts only, one per line.' } },
  ),
  tool(
    'submit_enquiry',
    'Send the enquiry to the TenthMatrix team once the visitor wants a follow-up and has agreed to be contacted. An engineer replies within one working day.',
    {
      name: { type: 'string', description: "Visitor's full name." },
      email: { type: 'string', description: "Visitor's email address." },
      phone: { type: 'string', description: 'Phone number, or an empty string.' },
      company: { type: 'string', description: 'Company name, or an empty string.' },
      summary: { type: 'string', description: 'What they want agents to do, the systems, and anything else agreed, in plain words.' },
      consent: { type: 'boolean', description: 'True only if the visitor agreed to be contacted.' },
    },
  ),
];

export const TOOL_NAMES = new Set(TOOLS.map((t) => t.name));
