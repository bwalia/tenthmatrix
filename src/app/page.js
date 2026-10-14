import { redirect } from 'next/navigation';

// src/proxy.js already redirects `/` to `/en`; this is the fallback for any
// request that reaches the app without passing through the proxy.
export default function RootPage() {
  redirect('/en');
}
