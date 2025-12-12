import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle, Home } from 'lucide-react';
import SEO from '@/components/SEO';
import Footer from '@/components/Footer';

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col">
      <SEO
        title="404 Not Found"
        description="The page you are looking for does not exist."
      />
      <div className="flex-grow flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-[#0B0F19] dark:to-[#0f1419] p-4">
        {/* Background Effects */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293708_1px,transparent_1px),linear-gradient(to_bottom,#1f293708_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1f293720_1px,transparent_1px),linear-gradient(to_bottom,#1f293720_1px,transparent_1px)] bg-[size:4rem_4rem]" />
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-red-400/10 dark:bg-red-600/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-400/10 dark:bg-blue-600/20 rounded-full blur-3xl" />
        </div>

        <Card className="w-full max-w-md relative z-10 border-0 shadow-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg">
          <CardHeader className="space-y-4 pb-6 text-center">
            <div className="mx-auto p-3 bg-gradient-to-r from-red-600 to-orange-600 rounded-full w-fit">
              <AlertTriangle className="h-8 w-8 text-white" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                404 Not Found
              </CardTitle>
              <CardDescription className="text-base">
                Oops! The page you're looking for doesn't exist.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="text-center text-slate-600 dark:text-slate-400">
              It seems you've ventured into uncharted territory. Let's get you back to safety.
            </div>

            <Link to="/">
              <Button className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold">
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
