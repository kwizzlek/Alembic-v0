'use client';

import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function TestToastPage() {
  const handleSimpleToast = () => {
    toast("Event created successfully!");
  };

  const handleSuccessToast = () => {
    toast.success("Success! Your changes have been saved.");
  };

  const handleErrorToast = () => {
    toast.error("Failed to save changes. Please try again.");
  };

  const handlePromiseToast = () => {
    const promise = new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.5) {
          resolve({ name: "Document" });
        } else {
          reject(new Error("Something went wrong"));
        }
      }, 2000);
    });

    toast.promise(promise, {
      loading: "Saving...",
      success: (data: any) => `${data.name} has been saved`,
      error: (err) => err.message,
    });
  };

  return (
    <div className="container mx-auto p-8 space-y-4">
      <h1 className="text-2xl font-bold mb-6">Toast Notifications</h1>
      
      <div className="space-y-4">
        <div className="space-x-4">
          <Button onClick={handleSimpleToast}>
            Show Simple Toast
          </Button>
          <Button variant="outline" onClick={handleSuccessToast}>
            Show Success Toast
          </Button>
        </div>
        
        <div className="space-x-4">
          <Button variant="destructive" onClick={handleErrorToast}>
            Show Error Toast
          </Button>
          <Button variant="secondary" onClick={handlePromiseToast}>
            Show Promise Toast
          </Button>
        </div>
      </div>
    </div>
  );
}
