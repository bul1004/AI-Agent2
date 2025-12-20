import LandingPage from "./(public)/page";

// Force dynamic rendering to prevent build-time errors
export const dynamic = "force-dynamic";

export default function HomePage() {
  return <LandingPage />;
}
