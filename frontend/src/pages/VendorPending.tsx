import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Clock, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const VendorPending = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
              <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
          </div>

          <div className="text-center space-y-2">
            <h1 className="font-display text-2xl font-bold text-foreground">Pending Admin Approval</h1>
            <p className="text-sm text-muted-foreground">
              Your vendor account has been created successfully!
            </p>
          </div>

          <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm text-foreground">Account Created</p>
                <p className="text-xs text-muted-foreground mt-1">Your vendor profile has been registered</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm text-foreground">Awaiting Approval</p>
                <p className="text-xs text-muted-foreground mt-1">Our admin team is reviewing your application</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-2">What happens next?</h3>
            <ul className="space-y-2 text-xs text-blue-800 dark:text-blue-200">
              <li className="flex items-start gap-2">
                <span className="font-bold">1.</span>
                <span>Admin review your vendor information</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">2.</span>
                <span>You'll receive an email when approved</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">3.</span>
                <span>You can then log in and start selling</span>
              </li>
            </ul>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            This usually takes 24-48 hours. Thank you for your patience!
          </p>

          <div className="flex flex-col gap-2">
            <Button
              onClick={() => navigate("/login")}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full flex items-center justify-center gap-2"
            >
              Back to Login
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Link to="/" className="text-center">
              <Button variant="ghost" className="w-full rounded-full">
                Return Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorPending;
