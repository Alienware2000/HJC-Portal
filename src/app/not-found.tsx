import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-svh flex flex-col items-center justify-center bg-gray-50">
      <p className="text-[80px] font-bold text-gray-200 leading-none">404</p>
      <p className="text-[15px] text-gray-500 mt-4">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link href="/" className="mt-6 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
        Go home
      </Link>
    </div>
  );
}
