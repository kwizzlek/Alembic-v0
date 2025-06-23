import { redirect } from 'next/navigation';

export default function Home() {
  // This will be handled by the AuthHandler in the layout
  return redirect('/dashboard');
}
