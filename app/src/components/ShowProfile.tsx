import React from "react";

export const ShowProfile: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-background text-foreground">
      <h1 className="text-4xl font-bold mb-6">Profile</h1>
      <p className="max-w-2xl text-lg mb-8 text-center">
        This is your profile page. Here you can view your personal information and account details. More features coming soon.
      </p>
      {/* Display user info here */}
    </div>
  );
};


