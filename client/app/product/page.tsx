"use client";
import MoodChat from "@/components/MoodChat";
import { useUser } from "@clerk/nextjs";
import React from "react";

const Product = () => {
  const { user } = useUser();

  const handleCheckIn = async (message: string) => {
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id, // get this from Supabase session or props
          message,
        }),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      console.log("API Response:", data);
      // Return the reply so the chat component can use it
      return data.reply || "Sorry, I didn't get a response.";
    } catch (error) {
      console.error("Error in handleCheckIn:", error);
      return "Sorry, something went wrong. Please try again.";
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Daily Check In</h1>
      <MoodChat onSend={handleCheckIn} />
    </div>
  );
};

export default Product;
